import type { CurriculumFamily, ContentGroundingResult, ContentGroundingDecision, DeenReferralDecision, ContentSensitivity, ContentUsePolicy, CurriculumTopic, CurriculumSkill, LearningObjective, ApprovedSource } from './task022ContentGovernanceContracts';
import { curriculumRegistryService } from './task022CurriculumRegistryService';
import { approvedSourceRegistryService } from './task022ApprovedSourceRegistryService';
import { contentItemGovernanceService } from './task022ContentItemGovernanceService';
import { deenContentGovernanceService } from './task022DeenContentGovernanceService';
import { topicSkillPrerequisiteMapService } from './task022TopicSkillPrerequisiteMapService';

export interface GroundingRequest {
  curriculumFamily: CurriculumFamily;
  subject?: string;
  topic?: string;
  skill?: string;
  stage?: string;
  schoolId?: string;
  routePurpose: 'tutor_context' | 'challenge_generation' | 'remediation_planning' | 'learner_facing' | 'teacher_facing';
  learnerFacing: boolean;
  text?: string;
}

export class ContentGroundingService {
  check(request: GroundingRequest): ContentGroundingResult {
    return this.evaluateGrounding(request, approvedSourceRegistryService.getApprovedSources(request.curriculumFamily));
  }

  /**
   * Durable production counterpart (R8-G.3A-D2 #19): grounding decisions use
   * durable approval truth. Unknown source => not approved. A dependency
   * failure while loading approval truth propagates (fail closed) so callers
   * can never answer grounded/allowed because the database failed.
   */
  async checkDurable(request: GroundingRequest): Promise<ContentGroundingResult> {
    const approvedSources = await approvedSourceRegistryService.getApprovedSourcesDurable(request.curriculumFamily);
    return this.evaluateGrounding(request, approvedSources);
  }

  private evaluateGrounding(
    request: GroundingRequest,
    approvedSources: ApprovedSource[],
  ): ContentGroundingResult {
    const reasons: string[] = [];

    const subject = curriculumRegistryService.resolveSubject(request.curriculumFamily, request.subject || '');
    if (!subject && request.subject) {
      return {
        decision: 'gap',
        gapReason: 'missing_curriculum_mapping',
        reasonCodes: ['subject-not-found-in-curriculum'],
      };
    }

    const topic = request.topic
      ? curriculumRegistryService.resolveTopic(request.curriculumFamily, request.subject || '', request.topic)
      : null;

    if (request.topic && !topic) {
      return {
        decision: 'gap',
        gapReason: 'missing_curriculum_mapping',
        reasonCodes: ['topic-not-found-in-curriculum'],
      };
    }

    let skill: CurriculumSkill | null = null;
    if (topic && request.skill) {
      const skills = curriculumRegistryService.resolveSkill(topic.topicId);
      skill = skills.find(s => s.title.toLowerCase().includes(request.skill!.toLowerCase())) || null;
    }

    const activeVersion = request.schoolId
      ? curriculumRegistryService.getActiveVersion(request.schoolId, request.curriculumFamily)
      : null;

    if (activeVersion && activeVersion.status === 'blocked') {
      return {
        decision: 'denied',
        gapReason: 'blocked_content',
        reasonCodes: ['curriculum-version-blocked'],
      };
    }

    if (activeVersion && activeVersion.status === 'deprecated') {
      return {
        decision: 'gap',
        gapReason: 'deprecated_curriculum_version',
        reasonCodes: ['curriculum-version-deprecated'],
      };
    }

    const relevantSources = approvedSources.filter(s => {
      if (request.subject && s.subject !== request.subject) return false;
      if (request.topic && s.topic !== request.topic) return false;
      return true;
    });

    if (relevantSources.length === 0 && request.topic) {
      return {
        decision: 'gap',
        gapReason: 'missing_approved_source',
        reasonCodes: ['no-approved-source-for-topic'],
      };
    }

    if (request.curriculumFamily === 'madrasa_deen' && request.text) {
      const classification = deenContentGovernanceService.classify(request.text, request.topic, request.subject);
      const handling = deenContentGovernanceService.decideHandling(classification);

      if (handling.referral !== 'no_referral') {
        return {
          decision: 'referral_required',
          referralDecision: handling.referral,
          safeContentContext: handling.safeSummary,
          reasonCodes: [...reasons, ...handling.reasonCodes],
        };
      }
    }

    let contentItems = topic
      ? contentItemGovernanceService.getItemsForTopic(topic.topicId)
      : [];

    if (request.skill && skill) {
      const skillItems = contentItemGovernanceService.getItemsForSkill(skill.skillId);
      if (skillItems.length > 0) contentItems = skillItems;
    }

    const learnerSafeItems = request.learnerFacing
      ? contentItems.filter(item => {
          const policy = contentItemGovernanceService.getContentUsePolicy(item);
          return policy.policy === 'allow_learner';
        })
      : contentItems;

    if (request.learnerFacing && learnerSafeItems.length === 0 && contentItems.length > 0) {
      const allTeacherOnly = contentItems.every(item => {
        const policy = contentItemGovernanceService.getContentUsePolicy(item);
        return policy.policy === 'allow_teacher_only';
      });

      if (allTeacherOnly) {
        return {
          decision: 'gap',
          gapReason: 'teacher_review_required',
          reasonCodes: ['all-content-teacher-only'],
        };
      }
    }

    if (request.learnerFacing && learnerSafeItems.length === 0) {
      return {
        decision: 'gap',
        gapReason: 'missing_content_item',
        reasonCodes: ['no-learner-safe-content-available'],
      };
    }

    const approvedSourceIds = relevantSources.map(s => s.id);

    const objectives: LearningObjective[] = skill
      ? topicSkillPrerequisiteMapService.getObjectivesForSkill(skill.skillId)
      : [];

    return {
      decision: 'grounded',
      safeContentContext: learnerSafeItems[0]?.studentSafeContent || (topic?.descriptionSafe || ''),
      approvedSourceIds,
      learningObjectiveIds: objectives.map(o => o.objectiveId),
      reasonCodes: ['content-grounded-successfully'],
    };
  }
}

export const contentGroundingService = new ContentGroundingService();
