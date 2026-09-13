import {
  RecallClassificationResult,
} from '../contracts/revisionModeContracts';

export interface RecallClassificationInput {
  recallQuality: string;
  retrievalSignal?: string;
  mistakeCategory?: string;
  attemptNumber: number;
  usedHint: boolean;
  hintLevel?: string;
  approvedContextAvailable?: boolean;
  deenSensitive?: boolean;
  priorMasterySignal?: string;
  lastReviewedAt?: Date;
}

export function classifyRecall(
  input: RecallClassificationInput,
): RecallClassificationResult {
  const { recallQuality, retrievalSignal, mistakeCategory, attemptNumber, usedHint } = input;

  if (input.deenSensitive && !input.approvedContextAvailable) {
    return {
      recallStrengthBucket: 'unknown',
      masterySignal: 'no_data_yet',
      readinessSignal: 'unknown',
      supportNeed: 'deen_referral',
      nextReviewIntervalBucket: 'deen_referral',
      safeReasonCodes: ['deen_uncertainty_detected'],
    };
  }

  if (!input.approvedContextAvailable) {
    return {
      recallStrengthBucket: 'unknown',
      masterySignal: 'no_data_yet',
      readinessSignal: 'unknown',
      supportNeed: 'content_gap_referral',
      nextReviewIntervalBucket: 'content_gap',
      safeReasonCodes: ['content_gap_detected'],
    };
  }

  if (attemptNumber >= 3 && ['blank', 'forgotten', 'incorrect', 'unclear'].includes(recallQuality)) {
    return {
      recallStrengthBucket: 'weak',
      masterySignal: 'not_ready',
      readinessSignal: 'teacher_review_recommended',
      supportNeed: 'teacher_support',
      nextReviewIntervalBucket: 'teacher_review',
      safeReasonCodes: ['low_confidence'],
    };
  }

  if (recallQuality === 'not_attempted' || recallQuality === 'blank') {
    return {
      recallStrengthBucket: 'not_attempted',
      masterySignal: 'not_ready',
      readinessSignal: 'needs_retry',
      supportNeed: 'try_again',
      nextReviewIntervalBucket: 'same_session_retry',
      safeReasonCodes: ['low_confidence'],
    };
  }

  if (recallQuality === 'forgotten') {
    return {
      recallStrengthBucket: 'weak',
      masterySignal: 'not_ready',
      readinessSignal: 'needs_review',
      supportNeed: retrievalSignal === 'failed_recall' ? 'try_again' : 'review_foundation',
      nextReviewIntervalBucket: 'same_session_retry',
      safeReasonCodes: ['low_confidence'],
    };
  }

  if (recallQuality === 'incorrect') {
    if (mistakeCategory === 'conceptual' || mistakeCategory === 'procedural' || mistakeCategory === 'prerequisite_gap') {
      return {
        recallStrengthBucket: 'weak',
        masterySignal: 'not_ready',
        readinessSignal: 'needs_review',
        supportNeed: 'repair_mistake',
        nextReviewIntervalBucket: 'later_today',
        safeReasonCodes: ['mistake_pattern_detected', 'low_confidence'],
      };
    }
    return {
      recallStrengthBucket: 'weak',
      masterySignal: 'emerging',
      readinessSignal: 'needs_review',
      supportNeed: 'try_again',
      nextReviewIntervalBucket: 'later_today',
      safeReasonCodes: ['low_confidence'],
    };
  }

  if (recallQuality === 'partial') {
    if (retrievalSignal === 'partial_recall') {
      return {
        recallStrengthBucket: 'emerging',
        masterySignal: 'developing',
        readinessSignal: 'almost_ready',
        supportNeed: 'schedule_spaced_review',
        nextReviewIntervalBucket: 'tomorrow',
        safeReasonCodes: ['weak_topic_detected'],
      };
    }
    return {
      recallStrengthBucket: 'emerging',
      masterySignal: 'developing',
      readinessSignal: 'almost_ready',
      supportNeed: 'schedule_spaced_review',
      nextReviewIntervalBucket: 'tomorrow',
      safeReasonCodes: [],
    };
  }

  if (recallQuality === 'mostly_recalled') {
    if (retrievalSignal === 'retrieved_slow') {
      return {
        recallStrengthBucket: 'stable',
        masterySignal: 'ready_with_support',
        readinessSignal: 'ready_to_move_on',
        supportNeed: 'schedule_spaced_review',
        nextReviewIntervalBucket: 'three_days',
        safeReasonCodes: [],
      };
    }
    return {
      recallStrengthBucket: 'stable',
      masterySignal: 'ready_with_support',
      readinessSignal: 'ready_to_move_on',
      supportNeed: 'schedule_spaced_review',
      nextReviewIntervalBucket: 'three_days',
      safeReasonCodes: [],
    };
  }

  if (recallQuality === 'recalled') {
    if (retrievalSignal === 'retrieved_fast') {
      return {
        recallStrengthBucket: 'strong',
        masterySignal: 'ready_independent',
        readinessSignal: 'ready_for_challenge',
        supportNeed: 'none',
        nextReviewIntervalBucket: usedHint ? 'three_days' : 'one_week',
        safeReasonCodes: usedHint ? [] : [],
      };
    }
    return {
      recallStrengthBucket: 'strong',
      masterySignal: 'ready_independent',
      readinessSignal: 'ready_to_move_on',
      supportNeed: usedHint ? 'schedule_spaced_review' : 'none',
      nextReviewIntervalBucket: 'one_week',
      safeReasonCodes: [],
    };
  }

  if (recallQuality === 'strong_recall') {
    if (retrievalSignal === 'retrieved_fast') {
      return {
        recallStrengthBucket: 'strong',
        masterySignal: 'strong',
        readinessSignal: 'ready_for_challenge',
        supportNeed: 'none',
        nextReviewIntervalBucket: usedHint ? 'one_week' : 'two_weeks',
        safeReasonCodes: [],
      };
    }
    return {
      recallStrengthBucket: 'strong',
      masterySignal: 'ready_independent',
      readinessSignal: 'ready_for_challenge',
      supportNeed: 'none',
      nextReviewIntervalBucket: usedHint ? 'one_week' : 'one_month',
      safeReasonCodes: [],
    };
  }

  if (recallQuality === 'unclear') {
    return {
      recallStrengthBucket: 'weak',
      masterySignal: 'emerging',
      readinessSignal: 'needs_review',
      supportNeed: 'try_again',
      nextReviewIntervalBucket: 'same_session_retry',
      safeReasonCodes: ['low_confidence'],
    };
  }

  return {
    recallStrengthBucket: 'unknown',
    masterySignal: 'no_data_yet',
    readinessSignal: 'unknown',
    supportNeed: 'none',
    nextReviewIntervalBucket: 'none',
    safeReasonCodes: [],
  };
}
