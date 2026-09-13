import {
  RevisionModeBridgeResult,
} from '../contracts/revisionModeContracts';

export interface ModeBridgeInput {
  recallQuality?: string;
  retrievalSignal?: string;
  mistakeCategory?: string;
  explanationQuality?: string;
  supportNeed?: string;
  masterySignal?: string;
  readinessSignal?: string;
  attemptCount: number;
  weakRecallCount: number;
  completedItemCount: number;
  itemCount: number;
  approvedContextAvailable?: boolean;
  deenSensitive?: boolean;
}

export function recommendNextMode(input: ModeBridgeInput): RevisionModeBridgeResult {
  if (input.deenSensitive && !input.approvedContextAvailable) {
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

  if (input.completedItemCount >= input.itemCount && input.itemCount > 0) {
    return {
      recommendation: 'continue_revision',
      reasonCodes: [],
    };
  }

  if (input.supportNeed === 'use_quiz_mode') {
    return {
      recommendation: 'start_quiz_mode',
      reasonCodes: ['weak_topic_detected'],
    };
  }

  if (input.supportNeed === 'use_teach_back_mode') {
    return {
      recommendation: 'start_teach_back_mode',
      reasonCodes: [],
    };
  }

  if (input.supportNeed === 'use_focus_mode') {
    return {
      recommendation: 'start_focus_mode',
      reasonCodes: ['mistake_pattern_detected'],
    };
  }

  if (input.supportNeed === 'teacher_support') {
    return {
      recommendation: 'recommend_teacher_support',
      reasonCodes: ['low_confidence'],
    };
  }

  if (input.supportNeed === 'content_gap_referral') {
    return {
      recommendation: 'safe_content_gap_referral',
      reasonCodes: ['content_gap_detected'],
    };
  }

  if (input.supportNeed === 'deen_referral') {
    return {
      recommendation: 'safe_deen_referral',
      reasonCodes: ['deen_uncertainty_detected'],
    };
  }

  if (input.recallQuality && ['blank', 'forgotten', 'incorrect', 'unclear'].includes(input.recallQuality)) {
    if (input.attemptCount >= 3) {
      return {
        recommendation: 'recommend_teacher_support',
        reasonCodes: ['low_confidence'],
      };
    }
    return {
      recommendation: 'start_quiz_mode',
      reasonCodes: ['weak_topic_detected'],
    };
  }

  if (input.mistakeCategory && !['none', 'unknown'].includes(input.mistakeCategory)) {
    if (input.mistakeCategory === 'conceptual' || input.mistakeCategory === 'prerequisite_gap') {
      return {
        recommendation: 'start_focus_mode',
        reasonCodes: ['mistake_pattern_detected'],
      };
    }
    return {
      recommendation: 'start_teach_back_mode',
      reasonCodes: [],
    };
  }

  if (input.weakRecallCount >= 2) {
    return {
      recommendation: 'start_focus_mode',
      reasonCodes: ['weak_topic_detected'],
    };
  }

  return {
    recommendation: 'continue_revision',
    reasonCodes: [],
  };
}
