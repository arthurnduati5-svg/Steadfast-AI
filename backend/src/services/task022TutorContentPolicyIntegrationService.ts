import type { ContentGroundingResult, CurriculumFamily } from './task022ContentGovernanceContracts';
import { contentGroundingService } from './task022ContentGroundingService';
import { curriculumRegistryService } from './task022CurriculumRegistryService';
import { approvedSourceRegistryService } from './task022ApprovedSourceRegistryService';
import { contentGapDetectionService } from './task022ContentGapDetectionService';

export interface TutorContentContext {
  curriculumFamily?: CurriculumFamily;
  subject?: string;
  topic?: string;
  skill?: string;
  stage?: string;
  schoolId?: string;
  learnerFacing: boolean;
  text?: string;
}

export interface TutorContentPolicyResult {
  canProceed: boolean;
  groundedContent?: ContentGroundingResult;
  safeContext?: string;
  gapReason?: string;
  reasonCodes: string[];
}

export class TutorContentPolicyIntegrationService {
  prepareTutorContext(request: TutorContentContext): TutorContentPolicyResult {
    const reasons: string[] = ['tutor-content-policy-check'];

    if (!request.curriculumFamily) {
      return {
        canProceed: true,
        reasonCodes: [...reasons, 'no-curriculum-family-socratic-allowed'],
      };
    }

    const groundingResult = contentGroundingService.check({
      curriculumFamily: request.curriculumFamily,
      subject: request.subject,
      topic: request.topic,
      skill: request.skill,
      stage: request.stage,
      schoolId: request.schoolId,
      routePurpose: request.learnerFacing ? 'learner_facing' : 'tutor_context',
      learnerFacing: request.learnerFacing,
      text: request.text,
    });

    if (groundingResult.decision === 'grounded') {
      return {
        canProceed: true,
        groundedContent: groundingResult,
        safeContext: groundingResult.safeContentContext,
        reasonCodes: [...reasons, 'content-grounded', ...groundingResult.reasonCodes],
      };
    }

    if (groundingResult.decision === 'referral_required') {
      return {
        canProceed: false,
        groundedContent: groundingResult,
        gapReason: groundingResult.gapReason || 'referral_required',
        reasonCodes: [...reasons, 'content-referral-required', ...groundingResult.reasonCodes],
      };
    }

    if (groundingResult.decision === 'denied') {
      return {
        canProceed: false,
        gapReason: groundingResult.gapReason || 'denied',
        reasonCodes: [...reasons, 'content-denied', ...groundingResult.reasonCodes],
      };
    }

    const gap = request.topic
      ? contentGapDetectionService.detectGap(
          request.curriculumFamily,
          request.subject,
          request.topic,
          request.skill,
          request.schoolId
        )
      : null;

    return {
      canProceed: false,
      gapReason: gap?.gapType || 'content_gap',
      reasonCodes: [...reasons, 'content-gap', ...(gap?.reasonCodes || ['no-content-available'])],
    };
  }

  getSafeFallback(reason: string): string {
    switch (reason) {
      case 'missing_curriculum_mapping':
        return 'This topic is not yet mapped in the approved curriculum. Could you tell me more about what you would like to learn?';
      case 'missing_approved_source':
        return 'I do not have approved learning materials for this topic yet. Let me help you with a related topic or ask your teacher for guidance.';
      case 'missing_content_item':
        return 'I need more content to teach this topic properly. Let me ask you some questions to understand what you need help with.';
      case 'source_pending_review':
        return 'New learning materials for this topic are being reviewed. In the meantime, could you tell me what specific area you are struggling with?';
      case 'source_restricted':
        return 'This content requires special permission. Please ask your teacher for help with this topic.';
      case 'deen_referral_required':
        return 'I need to refer this question to a qualified teacher. Let me ask you a clarifying question instead.';
      case 'deprecated_curriculum_version':
        return 'The curriculum for this subject is being updated. Please check with your teacher for current learning materials.';
      case 'blocked_content':
        return 'I cannot assist with this topic through the tutor. Please speak with your teacher.';
      case 'teacher_review_required':
        return 'This content needs teacher review. Let me help you with something else or try a related topic.';
      default:
        return 'I need a bit more context to help you effectively. Could you tell me what subject you are studying?';
    }
  }
}

export const tutorContentPolicyIntegrationService = new TutorContentPolicyIntegrationService();
