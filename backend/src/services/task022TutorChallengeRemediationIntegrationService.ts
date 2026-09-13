import type { CurriculumFamily } from '../contracts/task022CurriculumGovernanceContracts';
import type { Task022TutorChallengeRemediationContentDecision } from '../contracts/task022CurriculumGovernanceContracts';
import { contentGroundingService } from './task022ContentGroundingService';
import { approvedSourceRegistryService } from './task022ApprovedSourceRegistryService';
import { contentItemGovernanceService } from './task022ContentItemGovernanceService';

export interface ChallengeRemediationContentRequest {
  challengeType: string;
  curriculumFamily?: CurriculumFamily;
  subject?: string;
  topic?: string;
  skill?: string;
  schoolId?: string;
  learnerFacing: boolean;
  sourceId?: string;
  objectiveId?: string;
}

export interface BuildChallengeRemediationDecisionParams {
  challengeType: string;
  curriculumFamily?: CurriculumFamily;
  subject?: string;
  topic?: string;
  skill?: string;
  schoolId?: string;
  learnerFacing: boolean;
  groundingDecision: string;
  canProceed: boolean;
  gapReason?: string;
  reasonCodes: string[];
}

export class TutorChallengeRemediationIntegrationService {
  decideChallengeContentUse(request: ChallengeRemediationContentRequest): Task022TutorChallengeRemediationContentDecision {
    const grounding = contentGroundingService.check({
      curriculumFamily: request.curriculumFamily || 'system_seed',
      subject: request.subject,
      topic: request.topic,
      skill: request.skill,
      schoolId: request.schoolId,
      routePurpose: 'challenge_generation',
      learnerFacing: request.learnerFacing,
    });

    const canProceed = grounding.decision === 'grounded' && !this.isRestrictedSource(request);
    const reasonCodes: string[] = ['challenge-content-decision', ...grounding.reasonCodes];
    if (!canProceed) reasonCodes.push('challenge-blocked-no-grounded-source');

    if (this.hasAnswerKeyLeakRisk(request)) reasonCodes.push('answer-key-leak-prevented');

    return this.buildChallengeRemediationContentDecision({
      challengeType: request.challengeType || 'challenge_prompt',
      curriculumFamily: request.curriculumFamily,
      subject: request.subject,
      topic: request.topic,
      skill: request.skill,
      schoolId: request.schoolId,
      learnerFacing: request.learnerFacing,
      groundingDecision: grounding.decision,
      canProceed,
      gapReason: !canProceed ? (grounding.gapReason || 'blocked_by_policy') : undefined,
      reasonCodes,
    });
  }

  decideRemediationContentUse(request: ChallengeRemediationContentRequest): Task022TutorChallengeRemediationContentDecision {
    const grounding = contentGroundingService.check({
      curriculumFamily: request.curriculumFamily || 'system_seed',
      subject: request.subject,
      topic: request.topic,
      skill: request.skill,
      schoolId: request.schoolId,
      routePurpose: 'remediation_planning',
      learnerFacing: request.learnerFacing,
    });

    const hasWeakTopic = request.topic && grounding.decision === 'gap';
    const canProceed = grounding.decision === 'grounded';
    const reasonCodes: string[] = ['remediation-content-decision', ...grounding.reasonCodes];

    if (hasWeakTopic) reasonCodes.push('remediation-weak-topic-no-invent');
    if (!canProceed) reasonCodes.push('remediation-blocked-no-grounded-content');

    if (this.hasModelAnswerLeakRisk(request)) reasonCodes.push('model-answer-leak-prevented');

    return this.buildChallengeRemediationContentDecision({
      challengeType: request.challengeType || 'remediation_step',
      curriculumFamily: request.curriculumFamily,
      subject: request.subject,
      topic: request.topic,
      skill: request.skill,
      schoolId: request.schoolId,
      learnerFacing: request.learnerFacing,
      groundingDecision: grounding.decision,
      canProceed,
      gapReason: !canProceed ? (grounding.gapReason || 'remediation_content_gap') : undefined,
      reasonCodes,
    });
  }

  decidePracticeContentUse(request: ChallengeRemediationContentRequest): Task022TutorChallengeRemediationContentDecision {
    const requireApprovedMapping = request.objectiveId ? this.hasObjectiveSourceMapping(request.objectiveId) : false;
    const grounding = contentGroundingService.check({
      curriculumFamily: request.curriculumFamily || 'system_seed',
      subject: request.subject,
      topic: request.topic,
      skill: request.skill,
      schoolId: request.schoolId,
      routePurpose: 'learner_facing',
      learnerFacing: request.learnerFacing,
    });

    const canProceed = grounding.decision === 'grounded' && (!request.objectiveId || requireApprovedMapping);
    const reasonCodes: string[] = ['practice-content-decision', ...grounding.reasonCodes];
    if (request.objectiveId && !requireApprovedMapping) reasonCodes.push('practice-missing-approved-objective-source-mapping');
    if (!canProceed) reasonCodes.push('practice-blocked-no-approved-mapping');

    if (this.hasRawStudentWorkLeakRisk(request)) reasonCodes.push('raw-student-work-leak-prevented');

    return this.buildChallengeRemediationContentDecision({
      challengeType: request.challengeType || 'practice_question',
      curriculumFamily: request.curriculumFamily,
      subject: request.subject,
      topic: request.topic,
      skill: request.skill,
      schoolId: request.schoolId,
      learnerFacing: request.learnerFacing,
      groundingDecision: grounding.decision,
      canProceed,
      gapReason: !canProceed ? (grounding.gapReason || 'practice_no_approved_mapping') : undefined,
      reasonCodes,
    });
  }

  decideRevisionContentUse(request: ChallengeRemediationContentRequest): Task022TutorChallengeRemediationContentDecision {
    const grounding = contentGroundingService.check({
      curriculumFamily: request.curriculumFamily || 'system_seed',
      subject: request.subject,
      topic: request.topic,
      skill: request.skill,
      schoolId: request.schoolId,
      routePurpose: 'learner_facing',
      learnerFacing: request.learnerFacing,
    });

    const hasTeachingContent = !!request.topic || !!request.skill;
    const hasApprovedSourceRef = request.sourceId
      ? this.isApprovedSourceAvailable(request.sourceId, request.schoolId)
      : (grounding.approvedSourceIds ? grounding.approvedSourceIds.length > 0 : false);

    const canProceed = grounding.decision === 'grounded' && (!hasTeachingContent || hasApprovedSourceRef);
    const reasonCodes: string[] = ['revision-content-decision', ...grounding.reasonCodes];

    if (hasTeachingContent && !hasApprovedSourceRef) reasonCodes.push('revision-missing-approved-source-ref-for-teaching-content');
    if (!canProceed) reasonCodes.push('revision-blocked-no-source-ref');

    return this.buildChallengeRemediationContentDecision({
      challengeType: request.challengeType || 'revision_prompt',
      curriculumFamily: request.curriculumFamily,
      subject: request.subject,
      topic: request.topic,
      skill: request.skill,
      schoolId: request.schoolId,
      learnerFacing: request.learnerFacing,
      groundingDecision: grounding.decision,
      canProceed,
      gapReason: !canProceed ? (grounding.gapReason || 'revision_no_approved_source_ref') : undefined,
      reasonCodes,
    });
  }

  blockChallengeWithoutApprovedSource(request: ChallengeRemediationContentRequest): boolean {
    if (!request.curriculumFamily) return false;

    const sources = approvedSourceRegistryService.getApprovedSources(request.curriculumFamily);
    const relevantSources = sources.filter(s => {
      if (request.subject && s.subject !== request.subject) return false;
      if (request.topic && s.topic !== request.topic) return false;
      return s.approvalStatus === 'approved';
    });

    return relevantSources.length === 0;
  }

  blockRemediationWithoutApprovedSource(request: ChallengeRemediationContentRequest): boolean {
    if (!request.curriculumFamily) return true;

    const sources = approvedSourceRegistryService.getApprovedSources(request.curriculumFamily);
    const relevantSources = sources.filter(s => {
      if (request.subject && s.subject !== request.subject) return false;
      if (request.topic && s.topic !== request.topic) return false;
      return s.approvalStatus === 'approved';
    });

    const hasGroundedContentItems = request.topic
      ? contentItemGovernanceService.getItemsForTopic(request.topic).length > 0
      : false;

    const blocked = relevantSources.length === 0 && !hasGroundedContentItems;
    return blocked;
  }

  blockPracticeWithoutApprovedObjective(request: ChallengeRemediationContentRequest): boolean {
    if (!request.objectiveId) return false;

    const items = contentItemGovernanceService.getAllItems();
    const objectiveItems = items.filter(i => i.learningObjectiveId === request.objectiveId);
    const hasApprovedContent = objectiveItems.some(i => i.status === 'active' || i.status === 'approved');

    const blocked = !hasApprovedContent;
    return blocked;
  }

  buildChallengeRemediationContentDecision(params: BuildChallengeRemediationDecisionParams): Task022TutorChallengeRemediationContentDecision {
    const now = new Date().toISOString();

    return {
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      schoolId: params.schoolId,
      challengeType: params.challengeType,
      curriculumFamily: params.curriculumFamily,
      subject: params.subject,
      topic: params.topic,
      skill: params.skill,
      learnerFacing: params.learnerFacing,
      groundingDecision: params.groundingDecision,
      canProceed: params.canProceed,
      gapReason: params.gapReason,
      reasonCodes: params.reasonCodes,
      createdAt: now,
    };
  }

  private isRestrictedSource(request: ChallengeRemediationContentRequest): boolean {
    if (!request.curriculumFamily) return false;
    const sources = approvedSourceRegistryService.getApprovedSources(request.curriculumFamily);
    return sources.some(s => {
      if (request.subject && s.subject !== request.subject) return false;
      if (request.topic && s.topic !== request.topic) return false;
      return s.restrictedUse;
    });
  }

  private hasObjectiveSourceMapping(objectiveId: string): boolean {
    const items = contentItemGovernanceService.getAllItems();
    const matchingItems = items.filter(i => i.learningObjectiveId === objectiveId);
    return matchingItems.some(i => i.sourceId !== undefined);
  }

  private isApprovedSourceAvailable(sourceId: string, schoolId?: string): boolean {
    const items = contentItemGovernanceService.getAllItems();
    return items.some(i => i.sourceId === sourceId && (i.status === 'active' || i.status === 'approved'));
  }

  private hasAnswerKeyLeakRisk(request: ChallengeRemediationContentRequest): boolean {
    if (!request.topic) return false;
    const items = contentItemGovernanceService.getItemsForTopic(request.topic);
    return items.some(i => i.answerKeyProtected);
  }

  private hasModelAnswerLeakRisk(request: ChallengeRemediationContentRequest): boolean {
    if (!request.skill) return false;
    const items = contentItemGovernanceService.getItemsForSkill(request.skill);
    return items.some(i => i.teacherOnly);
  }

  private hasRawStudentWorkLeakRisk(request: ChallengeRemediationContentRequest): boolean {
    if (!request.topic) return false;
    const items = contentItemGovernanceService.getItemsForTopic(request.topic);
    return items.some(i => i.sensitivity === 'private' || i.sensitivity === 'sensitive');
  }
}

export const tutorChallengeRemediationIntegrationService = new TutorChallengeRemediationIntegrationService();
