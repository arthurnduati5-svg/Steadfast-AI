import type {
  LearnerChoicePolicyDecision,
  AdaptiveRecommendationProfile,
} from './learnerPreferenceFeedbackContracts';

export class LearnerChoicePolicyService {
  evaluateChoice(
    input: {
      profile: AdaptiveRecommendationProfile;
      masteryEvidenceLevel?: string;
      masteryConfidence?: number;
      hasUrgentRevision: boolean;
      hasDueSpacedReview: boolean;
      isDeenSensitive: boolean;
      isSafeguardingActive: boolean;
      recentSkipCount: number;
      recentStruggleCount: number;
      recommendationType?: string;
    },
  ): LearnerChoicePolicyDecision {
    const result: LearnerChoicePolicyDecision = {
      skipAllowed: true,
      challengeAllowed: false,
      foundationReviewAllowed: true,
      teacherHelpAllowed: true,
      hintAllowed: true,
      notNowAllowed: true,
      deenSensitiveHandled: input.isDeenSensitive,
      safeguardingBoundaryApplied: input.isSafeguardingActive,
    };

    if (input.isDeenSensitive) {
      result.skipAllowed = false;
      result.challengeAllowed = false;
      result.deenSensitiveHandled = true;
    }

    if (input.isSafeguardingActive) {
      result.skipAllowed = false;
      result.challengeAllowed = false;
      result.notNowAllowed = false;
      result.safeguardingBoundaryApplied = true;
    }

    if (input.hasUrgentRevision) {
      result.skipAllowed = false;
      result.notNowAllowed = false;
      result.challengeAllowed = false;
    }

    if (input.hasDueSpacedReview && !input.isDeenSensitive) {
      result.skipAllowed = false;
    }

    if (input.masteryEvidenceLevel === 'proficient' || input.masteryEvidenceLevel === 'mastered') {
      result.challengeAllowed = true;
    } else if (input.masteryEvidenceLevel === 'developing' || input.masteryEvidenceLevel === 'emerging') {
      result.challengeAllowed = false;
    }

    if (input.masteryConfidence !== undefined && input.masteryConfidence < 0.4) {
      result.challengeAllowed = false;
    }

    if (input.recentSkipCount >= 2) {
      result.skipAllowed = true;
      result.notNowAllowed = true;
    }

    if (input.recentStruggleCount >= 3) {
      result.teacherHelpAllowed = true;
    }

    if (input.recommendationType === 'deen_teacher_referral') {
      result.skipAllowed = false;
      result.challengeAllowed = false;
      result.foundationReviewAllowed = false;
      result.hintAllowed = false;
      result.teacherHelpAllowed = true;
    }

    return result;
  }

  getChoiceWarning(decision: LearnerChoicePolicyDecision): string | undefined {
    if (!decision.challengeAllowed && !decision.deenSensitiveHandled && !decision.safeguardingBoundaryApplied) {
      return 'A challenge is not recommended yet. Keep building your foundation first.';
    }
    if (decision.deenSensitiveHandled) {
      return 'This topic requires teacher guidance.';
    }
    if (decision.safeguardingBoundaryApplied) {
      return 'Your safety comes first. Let us work through this together.';
    }
    return undefined;
  }
}

export const learnerChoicePolicyService = new LearnerChoicePolicyService();
