import type { ResolvedRecommendation } from './learnerNextStepRecommendationResolver';
import type {
  LearnerProgressNarrative,
  LearnerSafeEvidenceCard,
} from './learnerTransparencyContracts';
import { buildLearnerSafeEvidenceCard } from './learnerSafeEvidenceCardService';

function nowISO(): string {
  return new Date().toISOString();
}

export function buildWhatImprovedNarrative(
  improvements: string[],
  evidenceCards: LearnerSafeEvidenceCard[],
): LearnerProgressNarrative {
  const narrative = improvements.length > 0
    ? `You are getting stronger at: ${improvements.slice(0, 3).join(', ')}. Keep building on this progress.`
    : 'You are making progress with your current learning. Keep going.';

  return {
    narrativeType: 'what_improved',
    title: 'What you have improved',
    narrative,
    safeEvidenceCards: evidenceCards,
    generatedAt: nowISO(),
  };
}

export function buildWhatToReviewNarrative(
  reviewItems: string[],
  evidenceCards: LearnerSafeEvidenceCard[],
): LearnerProgressNarrative {
  const narrative = reviewItems.length > 0
    ? `These skills need a little more attention: ${reviewItems.slice(0, 3).join(', ')}. A quick review will help strengthen your understanding.`
    : 'All skills are in good shape. Keep learning at your pace.';

  return {
    narrativeType: 'what_to_review',
    title: 'What to review',
    narrative,
    safeEvidenceCards: evidenceCards,
    generatedAt: nowISO(),
  };
}

export function buildWhyThisIsNextNarrative(
  recommendation: ResolvedRecommendation,
  evidenceCards: LearnerSafeEvidenceCard[],
): LearnerProgressNarrative {
  const narratives: Record<string, string> = {
    revision_due: `This next step helps you review ${recommendation.skillLabel} because your recent practice shows it needs a little more attention.`,
    foundation_review: `This next step helps build your foundation in ${recommendation.skillLabel} so future topics feel easier.`,
    similar_practice: `This next step gives you a similar problem to check whether you can apply ${recommendation.skillLabel} confidently.`,
    challenge_practice: `You are ready for a small challenge in ${recommendation.skillLabel}. This stretches your understanding further.`,
    mastery_check: `This checks whether you can use ${recommendation.skillLabel} without hints or help.`,
    mistake_pattern_review: `A common pattern in your recent ${recommendation.skillLabel} work needs attention. Reviewing it will help.`,
    spaced_review: `It has been a while since you practiced ${recommendation.skillLabel}. A quick review will refresh your memory.`,
    teacher_help_suggested: `${recommendation.skillLabel} has been challenging. Your teacher can offer helpful guidance.`,
    deen_teacher_referral: `This topic about ${recommendation.skillLabel} may need guidance from your teacher for the best support.`,
    continue_current_session: `Continue where you left off to keep building on your progress with ${recommendation.skillLabel}.`,
  };

  const narrative = narratives[recommendation.recommendationType]
    || `This next step helps you strengthen ${recommendation.skillLabel}.`;

  return {
    narrativeType: 'why_this_is_next',
    title: 'Why this is next',
    narrative,
    safeEvidenceCards: evidenceCards,
    generatedAt: nowISO(),
  };
}

export function buildHowToSucceedNarrative(
  recommendation: ResolvedRecommendation,
): LearnerProgressNarrative {
  const narratives: Record<string, string> = {
    revision_due: 'Take your time. Read the question carefully and try one step at a time. It is okay to review similar examples first.',
    foundation_review: 'Start with small steps. If something is unclear, try a simpler example first.',
    similar_practice: 'Think about how you solved similar problems before. Use the same approach.',
    challenge_practice: 'Think step by step. If you get stuck, try a different approach. The challenge is meant to stretch your thinking.',
    mastery_check: 'Try to solve without hints first. Show your reasoning clearly.',
    mistake_pattern_review: 'Look for the specific pattern. Understanding why it happens helps avoid it in future problems.',
    spaced_review: 'Try to recall what you remember before looking at notes. Active recall strengthens memory.',
    teacher_help_suggested: 'Ask your teacher which part feels trickiest. They can guide you with targeted help.',
    deen_teacher_referral: 'Your teacher can provide the right guidance for this topic.',
    continue_current_session: 'Review where you left off and continue from there.',
  };

  const narrative = narratives[recommendation.recommendationType]
    || 'Take one step at a time and show your reasoning as you go.';

  return {
    narrativeType: 'how_to_succeed',
    title: 'How to succeed in this step',
    narrative,
    safeEvidenceCards: [],
    generatedAt: nowISO(),
  };
}

export function buildReadyForChallengeNarrative(
  readySkills: string[],
): LearnerProgressNarrative {
  const narrative = readySkills.length > 0
    ? `You are ready for a challenge in: ${readySkills.slice(0, 3).join(', ')}. Try a harder problem to stretch your understanding.`
    : 'Keep building your foundation. Challenges will come when you are ready.';

  return {
    narrativeType: 'ready_for_challenge',
    title: 'Ready for a challenge',
    narrative,
    safeEvidenceCards: [],
    generatedAt: nowISO(),
  };
}

export function buildPrivacyVisibilityNarrative(): LearnerProgressNarrative {
  return {
    narrativeType: 'privacy_visibility',
    title: 'Your privacy',
    narrative: 'Your teacher can see safe learning progress summaries, not your private chat. Your conversations are private unless there is a serious safety concern following school safeguarding policy.',
    safeEvidenceCards: [],
    generatedAt: nowISO(),
  };
}

export function buildRecommendationNarrative(
  recommendation: ResolvedRecommendation,
  improvements: string[],
  reviewItems: string[],
): LearnerProgressNarrative[] {
  const evidenceCards = [buildLearnerSafeEvidenceCard(recommendation)];
  return [
    buildWhatImprovedNarrative(improvements, evidenceCards),
    buildWhatToReviewNarrative(reviewItems, evidenceCards),
    buildWhyThisIsNextNarrative(recommendation, evidenceCards),
    buildHowToSucceedNarrative(recommendation),
    buildPrivacyVisibilityNarrative(),
  ];
}
