import type {
  RecommendationWeightingPolicyInput,
  RecommendationWeightingPolicyDecision,
} from './learnerPreferenceFeedbackContracts';

export class RecommendationWeightingPolicyService {
  computeWeighting(input: RecommendationWeightingPolicyInput): RecommendationWeightingPolicyDecision {
    const reasonCodes: string[] = [];
    const safetyApplied: string[] = [];

    let priorityOverride: number | null = null;
    let supportLevelOverride: string | null = null;
    let difficultyAdjustment = 'neutral';
    let stepSizeAdjustment = 'standard';
    let challengeEligible = false;
    let skipAllowed = true;
    let teacherHelpSuggested = false;
    let foundationReviewBias = 0;
    let similarPracticeBias = 0;

    if (input.deenSensitivity) {
      challengeEligible = false;
      skipAllowed = false;
      safetyApplied.push('deen_sensitivity_policy');
      reasonCodes.push('deen_sensitive_topic_restricted');
    }

    if (input.safeguardingBoundary) {
      challengeEligible = false;
      skipAllowed = false;
      safetyApplied.push('safeguarding_boundary_policy');
      reasonCodes.push('safeguarding_boundary_applied');
    }

    if (input.revisionDueState) {
      if (input.revisionDueState.urgentCount > 0) {
        priorityOverride = 1;
        skipAllowed = false;
        safetyApplied.push('urgent_revision_priority');
        reasonCodes.push('urgent_revision_overrides_preference');
      } else if (input.revisionDueState.dueCount > 0) {
        skipAllowed = false;
        safetyApplied.push('revision_due_policy');
        reasonCodes.push('revision_due_limits_skip');
      }
    }

    if (input.spacedReviewDueState && input.spacedReviewDueState.dueCount > 0) {
      reasonCodes.push('spaced_review_due');
      if (!priorityOverride) {
        priorityOverride = 3;
      }
    }

    if (input.masteryEvidence) {
      const level = input.masteryEvidence.level;
      const confidence = input.masteryEvidence.confidence;

      if (level === 'proficient' || level === 'mastered') {
        challengeEligible = true;
        reasonCodes.push('mastery_supports_challenge');
      } else if (level === 'developing' || level === 'emerging') {
        challengeEligible = false;
        foundationReviewBias = 0.3;
        reasonCodes.push('low_mastery_limits_challenge');
      }

      if (confidence < 0.4) {
        challengeEligible = false;
        safetyApplied.push('low_mastery_confidence');
        reasonCodes.push('low_confidence_limits_challenge');
      }
    }

    const profile = input.learnerPreferenceProfile;
    if (profile.preferredSupportLevel === 'foundation_rebuild' || profile.preferredSupportLevel === 'teacher_support_recommended') {
      if (!priorityOverride || priorityOverride > 5) {
        priorityOverride = 5;
      }
      teacherHelpSuggested = true;
      reasonCodes.push('high_support_preference');
    }

    if (profile.foundationReviewPreference === 'high') {
      foundationReviewBias = Math.max(foundationReviewBias, 0.4);
      reasonCodes.push('high_foundation_review_preference');
    }

    if (profile.challengeReadinessSignal === 'high' && challengeEligible) {
      difficultyAdjustment = 'harder';
      reasonCodes.push('high_challenge_readiness');
    } else if (profile.challengeReadinessSignal === 'low') {
      difficultyAdjustment = 'easier';
      reasonCodes.push('low_challenge_readiness');
    }

    if (profile.preferredStepSize === 'shorter') {
      stepSizeAdjustment = 'shorter';
      reasonCodes.push('prefers_shorter_steps');
    } else if (profile.preferredStepSize === 'longer') {
      stepSizeAdjustment = 'longer';
      reasonCodes.push('prefers_longer_steps');
    }

    if (profile.practiceModePreference === 'more_practice') {
      similarPracticeBias = 0.3;
      reasonCodes.push('prefers_more_practice');
    } else if (profile.practiceModePreference === 'more_examples') {
      reasonCodes.push('prefers_more_examples');
    }

    if (input.recentInteractionPatterns.includes('repeated_skip')) {
      teacherHelpSuggested = true;
      safetyApplied.push('repeated_skip_supportive_reframe');
      reasonCodes.push('repeated_skips_teacher_help_offered');
    }

    return {
      priorityOverride,
      supportLevelOverride,
      difficultyAdjustment,
      stepSizeAdjustment,
      challengeEligible,
      skipAllowed,
      teacherHelpSuggested,
      foundationReviewBias,
      similarPracticeBias,
      reasonCodes: [...new Set(reasonCodes)],
      safetyApplied: [...new Set(safetyApplied)],
    };
  }
}

export const recommendationWeightingPolicyService = new RecommendationWeightingPolicyService();
