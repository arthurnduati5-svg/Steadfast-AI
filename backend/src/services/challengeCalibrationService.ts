// ─────────────────────────────────────────────────────────────
// Steadfast AI — Challenge Calibration Service v1
// Detects whether the current challenge level is appropriate
// and recommends adjustments. Prevents over-scaffolding and
// under-scaffolding. Avoids shaming the learner.
// ─────────────────────────────────────────────────────────────

import type {
  ChallengeCalibrationLevel,
  SocraticSupportMode,
} from './socraticTutorPolicyContracts';

// ═══════════════════════════════════════════════════════════════
// Calibration Thresholds
// ═══════════════════════════════════════════════════════════════

const HIGH_MASTERY_THRESHOLD = 75;
const MEDIUM_MASTERY_THRESHOLD = 45;
const LOW_MASTERY_THRESHOLD = 25;

const HIGH_CONFIDENCE_THRESHOLD = 70;
const LOW_CONFIDENCE_THRESHOLD = 30;

const STRUGGLE_ATTEMPT_THRESHOLD = 3;
const BLOCKED_ATTEMPT_THRESHOLD = 5;

// ═══════════════════════════════════════════════════════════════
// Public Types
// ═══════════════════════════════════════════════════════════════

export interface CalibrationInput {
  masteryLevel?: number | null;
  confidenceLevel?: number | null;
  attemptCount?: number | null;
  recentSuccessRate?: number | null;
  hintUsageCount?: number | null;
  misconceptionCount?: number | null;
  repeatedWeakArea?: boolean;
  artifactDifficulty?: string | null;
  gradeLevel?: string | null;
  educationLevel?: string | null;
}

export interface CalibrationOutput {
  challengeLevel: ChallengeCalibrationLevel;
  recommendedSupportMode: SocraticSupportMode;
  recommendedPracticeDifficulty: 'foundation' | 'standard' | 'challenge';
  recommendedTutorMove: string;
  growthReason: string;
  warnings: string[];
}

// ═══════════════════════════════════════════════════════════════
// Calibration Logic
// ═══════════════════════════════════════════════════════════════

/**
 * Calibrate the appropriate challenge level for the learner.
 */
export function calibrateChallengeLevel(input: CalibrationInput): CalibrationOutput {
  const warnings: string[] = [];

  const mastery = input.masteryLevel ?? null;
  const confidence = input.confidenceLevel ?? null;
  const attempts = input.attemptCount ?? 0;
  const successRate = input.recentSuccessRate ?? null;
  const hintUsage = input.hintUsageCount ?? 0;
  const misconceptions = input.misconceptionCount ?? 0;
  const repeatedWeak = input.repeatedWeakArea ?? false;
  const difficulty = input.artifactDifficulty ?? 'standard';

  // Guard: no mastery data
  if (mastery === null || confidence === null) {
    return {
      challengeLevel: 'productive_struggle',
      recommendedSupportMode: 'question_first',
      recommendedPracticeDifficulty: 'standard',
      recommendedTutorMove: 'Ask an initial question to assess the learner\'s current understanding.',
      growthReason: 'No prior mastery data. Starting at standard level with Socratic questioning.',
      warnings: ['No mastery data available. Using default productive struggle calibration.'],
    };
  }

  // Blocked: very high attempts, low success, high hint usage
  if (attempts >= BLOCKED_ATTEMPT_THRESHOLD && successRate !== null && successRate < 20) {
    return {
      challengeLevel: 'blocked',
      recommendedSupportMode: 'concept_reteach',
      recommendedPracticeDifficulty: 'foundation',
      recommendedTutorMove: 'Step back and reteach the foundational concept. Use a worked example and then ask a simple check question.',
      growthReason: `Learner has attempted ${attempts} times with ${successRate}% success rate. Needs concept reteach.`,
      warnings: ['Learner may be blocked. Recommend reteach before continuing.'],
    };
  }

  // Too hard: low mastery, low confidence, multiple attempts
  if (mastery < MEDIUM_MASTERY_THRESHOLD && confidence < LOW_CONFIDENCE_THRESHOLD && attempts >= 2) {
    return {
      challengeLevel: 'too_hard',
      recommendedSupportMode: 'guided_steps',
      recommendedPracticeDifficulty: 'foundation',
      recommendedTutorMove: 'Break the problem into smaller steps. Guide the learner through each step with questions and checks.',
      growthReason: `Mastery (${mastery}%) and confidence (${confidence}%) are both low. Current level is too hard.`,
      warnings: [],
    };
  }

  // Needs foundation: very low mastery, many attempts (after too_hard check)
  if (mastery < LOW_MASTERY_THRESHOLD && attempts >= STRUGGLE_ATTEMPT_THRESHOLD) {
    return {
      challengeLevel: 'needs_foundation',
      recommendedSupportMode: 'concept_reteach',
      recommendedPracticeDifficulty: 'foundation',
      recommendedTutorMove: 'Return to foundational concepts. Use simpler examples and check understanding at each step.',
      growthReason: `Mastery (${mastery}%) is very low after ${attempts} attempts. Foundation practice needed.`,
      warnings: [],
    };
  }

  // Too easy: very high mastery and confidence
  if (mastery >= HIGH_MASTERY_THRESHOLD && confidence >= HIGH_CONFIDENCE_THRESHOLD) {
    if (successRate !== null && successRate >= 80) {
      return {
        challengeLevel: 'ready_for_challenge',
        recommendedSupportMode: 'challenge_extension',
        recommendedPracticeDifficulty: 'challenge',
        recommendedTutorMove: 'The learner has strong mastery. Present a challenge extension or transfer task that requires deeper reasoning.',
        growthReason: `Mastery (${mastery}%) and confidence (${confidence}%) are high with ${successRate}% success rate. Ready for challenge.`,
        warnings: [],
      };
    }
    return {
      challengeLevel: 'too_easy',
      recommendedSupportMode: 'question_first',
      recommendedPracticeDifficulty: 'standard',
      recommendedTutorMove: 'The learner may find current work too easy. Increase difficulty slightly and ask deeper reasoning questions.',
      growthReason: `Mastery (${mastery}%) is high but recent success rate (${successRate ?? 'N/A'}%) does not yet confirm challenge readiness.`,
      warnings: [],
    };
  }

  // Productive struggle: moderate mastery with some attempts
  if (mastery >= LOW_MASTERY_THRESHOLD && mastery < HIGH_MASTERY_THRESHOLD) {
    const usingHints = hintUsage > 2;
    const hasMultipleMisconceptions = misconceptions >= 2;

    if (usingHints && hasMultipleMisconceptions) {
      return {
        challengeLevel: 'productive_struggle',
        recommendedSupportMode: 'misconception_check',
        recommendedPracticeDifficulty: 'standard',
        recommendedTutorMove: 'The learner is in productive struggle with some misconceptions. Check understanding of key concepts before continuing.',
        growthReason: `Mastery (${mastery}%) shows progress but ${misconceptions} misconception(s) need addressing.`,
        warnings: [],
      };
    }

    if (repeatedWeak) {
      return {
        challengeLevel: 'productive_struggle',
        recommendedSupportMode: 'similar_practice',
        recommendedPracticeDifficulty: 'standard',
        recommendedTutorMove: 'The learner has shown repeated weakness in this area. Provide similar practice with scaffolded support.',
        growthReason: 'Repeated weakness detected in this area. Additional similar practice recommended.',
        warnings: ['Repeated weakness in this area — monitor growth.'],
      };
    }

    return {
      challengeLevel: 'productive_struggle',
      recommendedSupportMode: 'question_first',
      recommendedPracticeDifficulty: 'standard',
      recommendedTutorMove: 'Continue with Socratic questioning at the current level. The learner is making progress.',
      growthReason: `Mastery (${mastery}%) is developing. Productive struggle zone.`,
      warnings: [],
    };
  }

  // Needs reteach: low mastery with misconceptions
  if (misconceptions > 0 && attempts >= 2) {
    return {
      challengeLevel: 'needs_reteach',
      recommendedSupportMode: 'concept_reteach',
      recommendedPracticeDifficulty: 'foundation',
      recommendedTutorMove: 'Return to the core concept. Address the specific misconception and check understanding.',
      growthReason: `Mastery (${mastery}%) is low with ${misconceptions} active misconception(s). Needs reteach.`,
      warnings: [],
    };
  }

  // Default: productive struggle
  return {
    challengeLevel: 'productive_struggle',
    recommendedSupportMode: 'question_first',
    recommendedPracticeDifficulty: difficulty === 'beginner' ? 'foundation' : 'standard',
    recommendedTutorMove: 'Continue with guided Socratic questioning at an appropriate level.',
    growthReason: `Calibrated to productive struggle based on current learner state.`,
    warnings: [],
  };
}
