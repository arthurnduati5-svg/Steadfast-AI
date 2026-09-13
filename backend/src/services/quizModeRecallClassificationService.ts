import type {
  RecallClassificationResult,
  QuizModeAnswerQuality,
  QuizModeMistakeCategory,
  QuizModeTimeSpentBucket,
  QuizModeConfidenceBucket,
} from '../contracts/quizModeContracts';

export interface RecallClassificationInput {
  answerQuality?: string;
  isCorrect?: boolean;
  attemptNumber: number;
  usedHint: boolean;
  hintLevel?: string;
  timeSpentBucket?: string;
  confidenceBucket?: string;
  mistakeCategory?: string;
  previousAttemptsSameQuestion?: number;
  recentMistakes?: number;
}

export function classifyRecall(input: RecallClassificationInput): RecallClassificationResult {
  if (!input.answerQuality || input.answerQuality === 'unanswered' || input.answerQuality === 'blank') {
    return {
      retrievalSignal: 'not_attempted',
      recallStrengthBucket: 'not_attempted',
      practiceNeed: 'try_again_now',
      safeReasonCodes: ['no_attempt_observed'],
    };
  }

  if (input.answerQuality === 'correct' || input.answerQuality === 'mostly_correct') {
    if (!input.usedHint && !input.hintLevel) {
      if (input.timeSpentBucket === 'under_1_min' || input.timeSpentBucket === '1_5_min') {
        return {
          retrievalSignal: 'retrieved_fast',
          recallStrengthBucket: 'strong',
          practiceNeed: 'move_next',
          safeReasonCodes: ['fast_correct_recall', 'strong_recall'],
        };
      }
      if (input.timeSpentBucket === '5_10_min' || input.timeSpentBucket === '10_20_min') {
        return {
          retrievalSignal: 'retrieved_slow',
          recallStrengthBucket: 'stable',
          practiceNeed: 'move_next',
          safeReasonCodes: ['slow_correct_recall', 'stable_recall'],
        };
      }
      return {
        retrievalSignal: 'retrieved_slow',
        recallStrengthBucket: 'stable',
        practiceNeed: 'move_next',
        safeReasonCodes: ['correct_recall', 'stable_recall'],
      };
    }
    return {
      retrievalSignal: 'retrieved_with_hint',
      recallStrengthBucket: 'emerging',
      practiceNeed: 'schedule_spaced_review',
      safeReasonCodes: ['correct_with_hint', 'emerging_recall'],
    };
  }

  if (input.answerQuality === 'partially_correct' || input.answerQuality === 'mostly_correct') {
    return {
      retrievalSignal: 'partial_recall',
      recallStrengthBucket: 'emerging',
      practiceNeed: 'try_again_now',
      safeReasonCodes: ['partial_recall', 'emerging_recall'],
    };
  }

  if (input.answerQuality === 'incorrect') {
    if (input.mistakeCategory === 'retrieval_failure') {
      return {
        retrievalSignal: 'failed_recall',
        recallStrengthBucket: 'weak',
        practiceNeed: 'try_again_now',
        safeReasonCodes: ['retrieval_failure', 'weak_recall'],
      };
    }
    if (input.mistakeCategory === 'prerequisite_gap') {
      return {
        retrievalSignal: 'failed_recall',
        recallStrengthBucket: 'weak',
        practiceNeed: 'review_foundation',
        safeReasonCodes: ['prerequisite_gap', 'requires_foundation_review'],
      };
    }
    if (input.mistakeCategory === 'conceptual') {
      return {
        retrievalSignal: 'failed_recall',
        recallStrengthBucket: 'weak',
        practiceNeed: 'review_foundation',
        safeReasonCodes: ['conceptual_mistake', 'requires_concept_review'],
      };
    }
    if (input.mistakeCategory === 'procedural') {
      return {
        retrievalSignal: 'failed_recall',
        recallStrengthBucket: 'weak',
        practiceNeed: 'try_again_now',
        safeReasonCodes: ['procedural_mistake', 'weak_recall'],
      };
    }
    if (input.mistakeCategory === 'careless') {
      return {
        retrievalSignal: 'failed_recall',
        recallStrengthBucket: 'emerging',
        practiceNeed: 'try_again_now',
        safeReasonCodes: ['careless_error', 'emerging_recall'],
      };
    }
    return {
      retrievalSignal: 'failed_recall',
      recallStrengthBucket: 'weak',
      practiceNeed: 'try_again_now',
      safeReasonCodes: ['incorrect_answer', 'weak_recall'],
    };
  }

  if (input.answerQuality === 'unclear') {
    return {
      retrievalSignal: 'partial_recall',
      recallStrengthBucket: 'emerging',
      practiceNeed: 'try_again_now',
      safeReasonCodes: ['unclear_answer', 'emerging_recall'],
    };
  }

  if (input.answerQuality === 'not_evaluated') {
    return {
      retrievalSignal: 'unknown',
      recallStrengthBucket: 'unknown',
      practiceNeed: 'try_again_now',
      safeReasonCodes: ['not_evaluated'],
    };
  }

  return {
    retrievalSignal: 'unknown',
    recallStrengthBucket: 'unknown',
    practiceNeed: 'try_again_now',
    safeReasonCodes: ['unknown_classification'],
  };
}

export function getPracticeNeedForRepeatedWeak(previousAttempts: number): string {
  if (previousAttempts >= 3) {
    return 'teacher_support';
  }
  if (previousAttempts >= 2) {
    return 'review_foundation';
  }
  return 'try_again_now';
}
