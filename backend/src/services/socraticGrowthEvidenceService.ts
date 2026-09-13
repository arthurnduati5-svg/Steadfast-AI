// ─────────────────────────────────────────────────────────────
// Steadfast AI — Socratic Growth Evidence Service v1
// Separates effort from mastery and completion from growth.
// Requires evidence before mastery improvement. Classifies
// evidence strength into levels: none, weak, moderate,
// strong, mastery_candidate. Prevents fake progress.
// ─────────────────────────────────────────────────────────────

import type { GrowthEvidenceLevel, GrowthEvidenceAssessment } from './socraticTutorPolicyContracts';

// ═══════════════════════════════════════════════════════════════
// Evidence Classification
// ═══════════════════════════════════════════════════════════════

/**
 * Classify growth evidence strength based on learner activity.
 *
 * Strong evidence includes:
 * - correct learner reasoning
 * - successful similar practice
 * - successful transfer task
 * - correct explanation in own words
 * - misconception corrected across repeated attempts
 *
 * Weak evidence includes:
 * - watched video
 * - read hint
 * - opened explanation
 * - clicked complete
 * - teacher note without learner work
 */
export function classifyGrowthEvidence(input: {
  activityType: string;
  learnerResponse?: string | null;
  correct?: boolean | null;
  score?: number | null;
  explanationQuality?: string | null;
  attemptCount?: number | null;
  previousCorrect?: boolean | null;
  misconceptionCorrected?: boolean;
  transferTaskSuccess?: boolean | null;
  learnerDemonstratedReasoning?: boolean;
  similarPracticeCorrect?: boolean | null;
}): GrowthEvidenceAssessment {
  const warnings: string[] = [];
  const activity = String(input.activityType || '').trim().toLowerCase();
  const learnerResponse = String(input.learnerResponse || '').trim();
  const correct = input.correct ?? null;
  const score = input.score ?? null;
  const explanationQuality = input.explanationQuality || null;
  const attemptCount = input.attemptCount ?? 0;
  const previousCorrect = input.previousCorrect ?? null;
  const misconceptionCorrected = input.misconceptionCorrected ?? false;
  const transferSuccess = input.transferTaskSuccess ?? null;
  const learnerDemonstratedReasoning = input.learnerDemonstratedReasoning ?? false;
  const similarPracticeCorrect = input.similarPracticeCorrect ?? null;

  // ── Mastery-candidate evidence ──

  // Misconception corrected across repeated attempts
  if (misconceptionCorrected && correct === true) {
    return {
      level: 'mastery_candidate',
      reason: 'Misconception corrected across repeated attempts with correct learner reasoning. Strong candidate for mastery update.',
      requiresLearnerWork: true,
      teacherInsightAllowed: false,
      warnings: [],
    };
  }

  // Successful transfer task
  if (transferSuccess === true && correct === true) {
    return {
      level: 'mastery_candidate',
      reason: 'Successful transfer task demonstrates ability to apply concepts to new problems.',
      requiresLearnerWork: true,
      teacherInsightAllowed: false,
      warnings: [],
    };
  }

  // ── Strong evidence ──

  if (learnerDemonstratedReasoning && similarPracticeCorrect === true) {
    return {
      level: 'strong',
      reason: 'Learner demonstrated reasoning and succeeded on similar practice.',
      requiresLearnerWork: true,
      teacherInsightAllowed: false,
      warnings: [],
    };
  }

  // Correct with strong explanation
  if (correct === true && explanationQuality === 'strong' && learnerResponse.length > 20) {
    return {
      level: 'strong',
      reason: 'Correct answer with strong explanation quality and meaningful learner response.',
      requiresLearnerWork: true,
      teacherInsightAllowed: false,
      warnings: [],
    };
  }

  // Correct similar practice after previously incorrect
  if (correct === true && previousCorrect === false && attemptCount >= 2) {
    return {
      level: 'strong',
      reason: 'Correct answer on re-attempt after previous incorrect. Shows learning from mistakes.',
      requiresLearnerWork: true,
      teacherInsightAllowed: false,
      warnings: [],
    };
  }

  // Correct explanation in own words
  if (learnerResponse.length > 50 && explanationQuality === 'strong') {
    return {
      level: 'strong',
      reason: 'Learner provided a thorough explanation in their own words, demonstrating understanding.',
      requiresLearnerWork: true,
      teacherInsightAllowed: false,
      warnings: [],
    };
  }

  // ── Moderate evidence ──

  if (learnerDemonstratedReasoning) {
    return {
      level: 'moderate',
      reason: 'Learner demonstrated reasoning, but similar practice has not yet confirmed mastery.',
      requiresLearnerWork: true,
      teacherInsightAllowed: false,
      warnings: similarPracticeCorrect === false ? ['Similar practice is still needed before mastery readiness.'] : [],
    };
  }

  // Correct answer with reasonable explanation
  if (correct === true && (score === null || score >= 70)) {
    return {
      level: 'moderate',
      reason: score !== null
        ? `Correct answer with score ${score}. Reasonable evidence of understanding.`
        : 'Correct answer. Moderate evidence of understanding.',
      requiresLearnerWork: true,
      teacherInsightAllowed: false,
      warnings: [],
    };
  }

  // Correct on challenging task
  if (correct === true && attemptCount >= 3) {
    return {
      level: 'moderate',
      reason: 'Correct after persistent attempts. Shows growth through effort.',
      requiresLearnerWork: true,
      teacherInsightAllowed: false,
      warnings: [],
    };
  }

  // ── Weak evidence ──

  // Watched video
  if (activity === 'video_watch' || activity === 'watch_video') {
    return {
      level: 'weak',
      reason: 'Watching a video is passive activity. Does not demonstrate mastery.',
      requiresLearnerWork: false,
      teacherInsightAllowed: false,
      warnings: ['Video watching alone is weak evidence of growth.'],
    };
  }

  // Read hint
  if (activity === 'read_hint' || activity === 'view_hint') {
    return {
      level: 'weak',
      reason: 'Reading a hint shows engagement but does not demonstrate understanding.',
      requiresLearnerWork: false,
      teacherInsightAllowed: false,
      warnings: ['Hint reading alone is weak evidence of growth.'],
    };
  }

  // Opened explanation
  if (activity === 'open_explanation' || activity === 'view_explanation') {
    return {
      level: 'weak',
      reason: 'Opening an explanation is passive. Does not confirm understanding.',
      requiresLearnerWork: false,
      teacherInsightAllowed: false,
      warnings: [],
    };
  }

  // Clicked complete without learner work
  if (activity === 'mark_complete' || activity === 'click_complete') {
    return {
      level: 'weak',
      reason: 'Marking complete without learner work is not evidence of growth.',
      requiresLearnerWork: false,
      teacherInsightAllowed: false,
      warnings: ['Completion without learner work is not reliable evidence.'],
    };
  }

  // Teacher note without learner work
  if (activity === 'teacher_note') {
    return {
      level: 'weak',
      reason: 'Teacher note without supporting learner work is weak evidence.',
      requiresLearnerWork: false,
      teacherInsightAllowed: true,
      warnings: ['Teacher notes alone should not drive mastery changes.'],
    };
  }

  // ── No evidence ──

  // Incorrect answer with no reasoning
  if (correct === false && learnerResponse.length < 20) {
    return {
      level: 'none',
      reason: 'Incorrect answer without meaningful reasoning. No growth evidence.',
      requiresLearnerWork: true,
      teacherInsightAllowed: false,
      warnings: ['No growth evidence. Learner needs more support.'],
    };
  }

  // Default: no evidence
  return {
    level: 'none',
    reason: 'No growth evidence available for this activity.',
    requiresLearnerWork: true,
    teacherInsightAllowed: false,
    warnings: [],
  };
}

export const assessMasteryReadiness = shouldUpdateMastery;

/**
 * Evaluate whether mastery should be updated based on accumulated evidence.
 */
export function shouldUpdateMastery(evidence: GrowthEvidenceAssessment[]): {
  shouldUpdate: boolean;
  reason: string;
  strongestLevel: GrowthEvidenceLevel;
} {
  if (evidence.length === 0) {
    return { shouldUpdate: false, reason: 'No evidence provided.', strongestLevel: 'none' };
  }

  // Find the strongest evidence level
  const levels: GrowthEvidenceLevel[] = ['none', 'weak', 'moderate', 'strong', 'mastery_candidate'];
  const strongestLevel = evidence.reduce((max, e) => {
    return levels.indexOf(e.level) > levels.indexOf(max) ? e.level : max;
  }, 'none' as GrowthEvidenceLevel);

  if (strongestLevel === 'mastery_candidate' || strongestLevel === 'strong') {
    return {
      shouldUpdate: true,
      reason: `Strongest evidence is "${strongestLevel}". Mastery update is warranted.`,
      strongestLevel,
    };
  }

  if (strongestLevel === 'moderate') {
    return {
      shouldUpdate: true,
      reason: `Strongest evidence is "${strongestLevel}". Moderate confidence mastery update.`,
      strongestLevel,
    };
  }

  return {
    shouldUpdate: false,
    reason: `Strongest evidence is "${strongestLevel}". More learner work required before mastery update.`,
    strongestLevel,
  };
}
