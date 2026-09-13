import type { ResolvedRecommendation } from './learnerNextStepRecommendationResolver';
import type {
  LearnerSafeEvidenceCard,
  LearnerRecommendationType,
} from './learnerTransparencyContracts';

function nowISO(): string {
  return new Date().toISOString();
}

export function buildLearnerSafeEvidenceCard(
  recommendation: ResolvedRecommendation,
): LearnerSafeEvidenceCard {
  const signal = _recommendationTypeToSignal(recommendation.recommendationType);
  const masteryLabel = _recommendationTypeToMasteryLabel(recommendation.recommendationType);
  const revisionStatus = _recommendationTypeToRevisionStatus(recommendation.recommendationType);
  const trend = _recommendationTypeToTrend(recommendation.recommendationType);

  return {
    evidenceId: `ev-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    subject: recommendation.subject,
    topic: recommendation.topic,
    skillLabel: recommendation.skillLabel,
    safeLearningSignal: signal,
    recentTrend: trend,
    masteryLabel,
    revisionStatus,
    createdAt: nowISO(),
    confidenceLabel: recommendation.evidenceSummary,
  };
}

export function buildSafeEvidenceCardsFromState(
  recommendations: ResolvedRecommendation[],
): LearnerSafeEvidenceCard[] {
  return recommendations.map((r) => buildLearnerSafeEvidenceCard(r));
}

function _recommendationTypeToSignal(type: LearnerRecommendationType): string {
  const signals: Record<LearnerRecommendationType, string> = {
    revision_due: 'This skill needs review based on recent practice patterns.',
    foundation_review: 'Building foundational understanding of this skill.',
    similar_practice: 'Practicing with similar problems to reinforce understanding.',
    challenge_practice: 'Ready to attempt more challenging problems.',
    mastery_check: 'Checking whether this skill is at mastery level.',
    mistake_pattern_review: 'A common mistake pattern has been detected.',
    spaced_review: 'Scheduled review to strengthen long-term memory.',
    teacher_help_suggested: 'Additional support may help with this skill.',
    deen_teacher_referral: 'This topic may need teacher guidance.',
    continue_current_session: 'Continuing current learning session.',
  };
  return signals[type];
}

function _recommendationTypeToMasteryLabel(type: LearnerRecommendationType): string {
  const labels: Record<LearnerRecommendationType, string> = {
    revision_due: 'needs_review',
    foundation_review: 'developing',
    similar_practice: 'developing',
    challenge_practice: 'secure',
    mastery_check: 'developing',
    mistake_pattern_review: 'needs_review',
    spaced_review: 'maintenance',
    teacher_help_suggested: 'needs_review',
    deen_teacher_referral: 'unknown',
    continue_current_session: 'developing',
  };
  return labels[type];
}

function _recommendationTypeToRevisionStatus(type: LearnerRecommendationType): 'due' | 'upcoming' | 'current' | 'none' {
  const statuses: Record<LearnerRecommendationType, 'due' | 'upcoming' | 'current' | 'none'> = {
    revision_due: 'due',
    foundation_review: 'current',
    similar_practice: 'current',
    challenge_practice: 'none',
    mastery_check: 'current',
    mistake_pattern_review: 'due',
    spaced_review: 'upcoming',
    teacher_help_suggested: 'none',
    deen_teacher_referral: 'none',
    continue_current_session: 'current',
  };
  return statuses[type];
}

function _recommendationTypeToTrend(type: LearnerRecommendationType): 'improving' | 'stable' | 'needs_attention' | 'unknown' {
  const trends: Record<LearnerRecommendationType, 'improving' | 'stable' | 'needs_attention' | 'unknown'> = {
    revision_due: 'needs_attention',
    foundation_review: 'stable',
    similar_practice: 'improving',
    challenge_practice: 'improving',
    mastery_check: 'stable',
    mistake_pattern_review: 'needs_attention',
    spaced_review: 'stable',
    teacher_help_suggested: 'needs_attention',
    deen_teacher_referral: 'unknown',
    continue_current_session: 'stable',
  };
  return trends[type];
}
