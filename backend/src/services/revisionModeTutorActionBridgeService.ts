import {
  RevisionModeBridgeResult,
} from '../contracts/revisionModeContracts';

export interface TutorActionBridgeInput {
  mode: string;
  stage: string;
  modeSessionId: string;
  conversationId?: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  targetRef?: string;
  approvedContentRef?: string;
  contentFingerprint?: string;
  requestCategory: string;
  recallQuality?: string;
  retrievalSignal?: string;
  mistakeCategory?: string;
  masterySignal?: string;
  readinessSignal?: string;
  approvedContextAvailable?: boolean;
  deenSensitive?: boolean;
  answerKeyRisk?: boolean;
  modelAnswerRisk?: boolean;
  revisionIntegrityRisk?: boolean;
  safeSignals: {
    attemptCount: number;
    hintCount: number;
    stuckCount: number;
    recoveryCount: number;
    reflectionCount: number;
    completedItemCount: number;
    skippedItemCount: number;
    pinnedItemCount: number;
    weakRecallCount: number;
    strongRecallCount: number;
    mistakeCount: number;
  };
  profileSignals?: {
    masteryLevel?: string;
    masteryStatus?: string;
    profileConfidence?: number;
    weakTopicDetected?: boolean;
    highHintDependency?: boolean;
    repeatedMistakeDetected?: boolean;
  };
}

export function getNextRevisionAction(
  input: TutorActionBridgeInput,
): RevisionModeBridgeResult {
  if (input.deenSensitive && !input.approvedContentRef) {
    return {
      recommendation: 'safe_deen_referral',
      reasonCodes: ['deen_uncertainty_detected'],
    };
  }

  if (!input.approvedContextAvailable) {
    return {
      recommendation: 'safe_content_gap_referral',
      reasonCodes: ['content_gap_detected'],
    };
  }

  if (input.answerKeyRisk) {
    return {
      recommendation: 'block_answer_key_request',
      reasonCodes: ['block_answer_key'],
    };
  }

  if (input.modelAnswerRisk) {
    return {
      recommendation: 'block_model_answer_request',
      reasonCodes: ['block_model_answer'],
    };
  }

  if (input.revisionIntegrityRisk) {
    return {
      recommendation: 'block_unsafe_request',
      reasonCodes: ['block_unsafe'],
    };
  }

  if (input.recallQuality && ['blank', 'forgotten', 'incorrect', 'unclear'].includes(input.recallQuality)) {
    if (input.mistakeCategory && ['conceptual', 'procedural', 'prerequisite_gap'].includes(input.mistakeCategory)) {
      return {
        recommendation: 'repairing_gap',
        reasonCodes: ['mistake_pattern_detected'],
      };
    }
    return {
      recommendation: 'recalling',
      reasonCodes: ['low_confidence'],
    };
  }

  if (input.safeSignals.weakRecallCount >= 3) {
    return {
      recommendation: 'recommend_teacher_support',
      reasonCodes: ['low_confidence'],
    };
  }

  if (input.recallQuality === 'mostly_recalled' || input.recallQuality === 'recalled') {
    if (input.mistakeCategory && !['none', 'unknown'].includes(input.mistakeCategory)) {
      return {
        recommendation: 'repairing_gap',
        reasonCodes: ['mistake_pattern_detected'],
      };
    }
    if (input.readinessSignal === 'ready_for_challenge') {
      return {
        recommendation: 'scheduling_next_review',
        reasonCodes: [],
      };
    }
    return {
      recommendation: 'reflection_check',
      reasonCodes: [],
    };
  }

  if (input.recallQuality === 'strong_recall') {
    return {
      recommendation: 'scheduling_next_review',
      reasonCodes: [],
    };
  }

  if (input.stage === 'recall_submitted' || input.stage === 'feedback_ready') {
    return {
      recommendation: 'reflection_check',
      reasonCodes: [],
    };
  }

  if (input.safeSignals.attemptCount === 0) {
    return {
      recommendation: 'reviewing_item',
      reasonCodes: [],
    };
  }

  return {
    recommendation: 'continue_revision',
    reasonCodes: [],
  };
}
