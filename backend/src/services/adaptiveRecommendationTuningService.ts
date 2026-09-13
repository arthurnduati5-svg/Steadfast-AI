import type {
  AdaptiveRecommendationTuningInput,
  AdaptiveRecommendationTuningResult,
  LearnerPreferenceFeedbackType,
} from './learnerPreferenceFeedbackContracts';

export class AdaptiveRecommendationTuningService {
  computeTuning(input: AdaptiveRecommendationTuningInput): AdaptiveRecommendationTuningResult {
    const reasonCodes: string[] = [];
    const recommendationBiases: string[] = [];
    const safetyConstraintsApplied: string[] = [];
    const nextRecommendationConstraints: string[] = [];

    let supportLevelAdjustment = 'none';
    let difficultyAdjustment = 'neutral';
    let stepSizeAdjustment = 'standard';
    let confidence = 0.5;

    switch (input.feedbackType) {
      case 'too_hard': {
        supportLevelAdjustment = 'increase';
        difficultyAdjustment = 'easier';
        stepSizeAdjustment = 'shorter';
        reasonCodes.push('too_hard_increases_support');
        recommendationBiases.push('foundation_review_bias');
        nextRecommendationConstraints.push('smaller_steps');
        nextRecommendationConstraints.push('more_supported_practice');

        if (input.recentTooHardCount >= 3) {
          supportLevelAdjustment = 'significantly_increase';
          safetyConstraintsApplied.push('repeated_too_hard_escalation');
        }
        break;
      }

      case 'still_confused': {
        supportLevelAdjustment = 'increase';
        difficultyAdjustment = 'easier';
        reasonCodes.push('still_confused_increases_foundation_review');
        recommendationBiases.push('foundation_review_bias');
        nextRecommendationConstraints.push('foundation_review_first');

        if (input.recentConfusionCount >= 3) {
          recommendationBiases.push('teacher_help_suggestion_bias');
          safetyConstraintsApplied.push('repeated_confusion_teacher_support');
        }
        break;
      }

      case 'too_easy': {
        if (input.masteryEvidenceLevel === 'proficient' || input.masteryEvidenceLevel === 'mastered') {
          difficultyAdjustment = 'harder';
          recommendationBiases.push('challenge_bias');
          reasonCodes.push('too_easy_with_evidence_increases_challenge');
          nextRecommendationConstraints.push('challenge_eligible');
        } else {
          difficultyAdjustment = 'slightly_harder';
          reasonCodes.push('too_easy_but_evidence_not_confirmed');
          safetyConstraintsApplied.push('mastery_not_confirmed_challenge_limited');
          nextRecommendationConstraints.push('verify_mastery_before_challenge');
        }
        break;
      }

      case 'understood': {
        difficultyAdjustment = 'slightly_harder';
        reasonCodes.push('learner_understood_confirmed');
        recommendationBiases.push('similar_practice_bias');
        confidence = 0.3;
        break;
      }

      case 'want_challenge': {
        if (input.masteryEvidenceLevel === 'proficient' || input.masteryEvidenceLevel === 'mastered') {
          difficultyAdjustment = 'harder';
          recommendationBiases.push('challenge_bias');
          reasonCodes.push('challenge_requested_evidence_supports');
          nextRecommendationConstraints.push('challenge_eligible');
        } else {
          reasonCodes.push('challenge_requested_but_low_mastery');
          safetyConstraintsApplied.push('mastery_too_low_for_challenge');
          nextRecommendationConstraints.push('strengthen_foundation_first');
        }
        break;
      }

      case 'want_foundation_review': {
        supportLevelAdjustment = 'increase';
        difficultyAdjustment = 'easier';
        recommendationBiases.push('foundation_review_bias');
        reasonCodes.push('foundation_review_requested');
        nextRecommendationConstraints.push('foundation_review_priority');
        break;
      }

      case 'want_hint': {
        reasonCodes.push('hint_requested');
        recommendationBiases.push('hint_availability_bias');
        confidence = 0.4;
        break;
      }

      case 'want_teacher_help': {
        reasonCodes.push('teacher_help_requested');
        recommendationBiases.push('teacher_help_suggestion_bias');
        nextRecommendationConstraints.push('teacher_support_options');
        break;
      }

      case 'not_now': {
        reasonCodes.push('learner_postponed');
        safetyConstraintsApplied.push('postpone_non_urgent_items');
        nextRecommendationConstraints.push('non_urgent_skip_allowed');
        break;
      }

      case 'shorter_steps':
      case 'slower_pace': {
        stepSizeAdjustment = 'shorter';
        reasonCodes.push('shorter_steps_requested');
        recommendationBiases.push('smaller_step_bias');
        break;
      }

      case 'faster_pace': {
        stepSizeAdjustment = 'longer';
        reasonCodes.push('faster_pace_requested');
        break;
      }

      case 'more_examples': {
        recommendationBiases.push('more_examples_bias');
        reasonCodes.push('more_examples_requested');
        break;
      }

      case 'want_similar_practice': {
        recommendationBiases.push('similar_practice_bias');
        reasonCodes.push('similar_practice_requested');
        break;
      }

      case 'just_right':
      case 'helpful': {
        reasonCodes.push('positive_feedback');
        confidence = 0.6;
        break;
      }

      case 'not_helpful': {
        reasonCodes.push('negative_feedback');
        safetyConstraintsApplied.push('reconsider_approach');
        break;
      }
    }

    if (input.recentSkipCount >= 3) {
      safetyConstraintsApplied.push('repeated_skips_supportive_reframe');
      recommendationBiases.push('supportive_engagement_bias');
      reasonCodes.push('repeated_skips_increase_support');
    }

    if (input.recentTeacherHelpRequestCount >= 2) {
      recommendationBiases.push('teacher_help_suggestion_bias');
      safetyConstraintsApplied.push('teacher_help_offered');
      reasonCodes.push('multiple_teacher_help_requests');
    }

    confidence = Math.round(confidence * 100) / 100;

    return {
      supportLevelAdjustment,
      difficultyAdjustment,
      stepSizeAdjustment,
      recommendationBiases: [...new Set(recommendationBiases)],
      reasonCodes: [...new Set(reasonCodes)],
      confidence,
      safetyConstraintsApplied: [...new Set(safetyConstraintsApplied)],
      nextRecommendationConstraints: [...new Set(nextRecommendationConstraints)],
    };
  }

  getTuningSummary(result: AdaptiveRecommendationTuningResult): string {
    const parts: string[] = [];
    if (result.supportLevelAdjustment !== 'none') {
      parts.push(`Support: ${result.supportLevelAdjustment}`);
    }
    if (result.difficultyAdjustment !== 'neutral') {
      parts.push(`Difficulty: ${result.difficultyAdjustment}`);
    }
    if (result.stepSizeAdjustment !== 'standard') {
      parts.push(`Steps: ${result.stepSizeAdjustment}`);
    }
    if (result.recommendationBiases.length > 0) {
      parts.push(`Biases: ${result.recommendationBiases.join(', ')}`);
    }
    return parts.length > 0 ? parts.join('; ') : 'No tuning changes applied';
  }
}

export const adaptiveRecommendationTuningService = new AdaptiveRecommendationTuningService();
