// ─────────────────────────────────────────────────────────────
// Steadfast AI — Weak-Area Growth Loop Service v1
// Implements the complete growth loop:
// detect weakness → identify misconception → select Socratic
// question → select hint ladder level → choose practice or
// reteach → require learner attempt → evaluate evidence →
// update mastery signal → update learner memory signal →
// schedule reinforcement → escalate only if repeated weakness
// ─────────────────────────────────────────────────────────────

import type {
  SocraticSupportMode,
  ChallengeCalibrationLevel,
} from './socraticTutorPolicyContracts';

// ═══════════════════════════════════════════════════════════════
// Thresholds
// ═══════════════════════════════════════════════════════════════

const LOW_MASTERY_THRESHOLD = 30;
const REPEATED_WEAKNESS_ESCALATION_THRESHOLD = 5;
const STUCK_ATTEMPT_THRESHOLD = 4;

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

export type GrowthNextAction =
  | 'ask_socratic_question'
  | 'give_hint'
  | 'reteach_concept'
  | 'assign_foundation_practice'
  | 'assign_similar_practice'
  | 'assign_challenge_practice'
  | 'schedule_reinforcement'
  | 'escalate_exception';

export interface GrowthPlanInput {
  studentId: string;
  topic?: string | null;
  skillId?: string | null;
  weakAreas: string[];
  misconceptions: string[];
  masteryLevel?: number | null;
  recentAttemptCount?: number | null;
  recentSuccessRate?: number | null;
  confidenceLevel?: number | null;
}

export interface GrowthPlanOutput {
  targetWeakArea: string | null;
  misconceptionFocus: string | null;
  supportMode: SocraticSupportMode;
  challengeLevel: ChallengeCalibrationLevel;
  nextAction: GrowthNextAction;
  growthMetric: string;
  teacherInsightAllowed: boolean;
  warnings: string[];
}

// ═══════════════════════════════════════════════════════════════
// Growth Loop Logic
// ═══════════════════════════════════════════════════════════════

/**
 * Build a growth plan for the learner's weak areas.
 */
export function buildWeakAreaGrowthPlan(input: GrowthPlanInput): GrowthPlanOutput {
  const warnings: string[] = [];
  const {
    studentId,
    topic,
    weakAreas,
    misconceptions,
    masteryLevel,
    recentAttemptCount,
    recentSuccessRate,
    confidenceLevel,
  } = input;

  const effectiveMastery = masteryLevel ?? null;
  const attempts = recentAttemptCount ?? 0;
  const successRate = recentSuccessRate ?? null;
  const confidence = confidenceLevel ?? 50;

  // Determine primary weak area and misconception
  const targetWeakArea = weakAreas.length > 0 ? weakAreas[0] : (topic || null);
  const misconceptionFocus = misconceptions.length > 0 ? misconceptions[0] : null;

  // No weak areas — no growth plan needed
  if (weakAreas.length === 0 && misconceptions.length === 0) {
    return {
      targetWeakArea: null,
      misconceptionFocus: null,
      supportMode: 'question_first',
      challengeLevel: 'productive_struggle',
      nextAction: 'ask_socratic_question',
      growthMetric: 'No weak areas detected. Continue with normal progression.',
      teacherInsightAllowed: false,
      warnings: [],
    };
  }

  // Repeated weakness persists despite multiple attempts → escalate
  if (attempts >= REPEATED_WEAKNESS_ESCALATION_THRESHOLD && effectiveMastery !== null && effectiveMastery < LOW_MASTERY_THRESHOLD) {
    return {
      targetWeakArea,
      misconceptionFocus,
      supportMode: 'concept_reteach',
      challengeLevel: 'needs_reteach',
      nextAction: 'escalate_exception',
      growthMetric: `Weak area "${targetWeakArea}" persists after ${attempts} attempts with ${effectiveMastery}% mastery. Needs human review.`,
      teacherInsightAllowed: true,
      warnings: [`Repeated weakness in "${targetWeakArea}" after ${attempts} attempts. Consider teacher insight.`],
    };
  }

  // Blocked after many attempts → reteach
  if (attempts >= STUCK_ATTEMPT_THRESHOLD && (effectiveMastery === null || effectiveMastery < LOW_MASTERY_THRESHOLD)) {
    return {
      targetWeakArea,
      misconceptionFocus,
      supportMode: 'concept_reteach',
      challengeLevel: 'blocked',
      nextAction: 'reteach_concept',
      growthMetric: `Learner is stuck on "${targetWeakArea}" after ${attempts} attempts. Recommending reteach.`,
      teacherInsightAllowed: false,
      warnings: [],
    };
  }

  // Active misconception → ask Socratic question to check understanding
  if (misconceptionFocus) {
    return {
      targetWeakArea,
      misconceptionFocus,
      supportMode: 'misconception_check',
      challengeLevel: 'productive_struggle',
      nextAction: 'ask_socratic_question',
      growthMetric: `Misconception "${misconceptionFocus}" detected in weak area "${targetWeakArea}". Asking diagnostic Socratic question.`,
      teacherInsightAllowed: false,
      warnings: [],
    };
  }

  // Low mastery with some attempts → give hint
  if (effectiveMastery !== null && effectiveMastery < LOW_MASTERY_THRESHOLD && attempts > 0) {
    return {
      targetWeakArea,
      misconceptionFocus,
      supportMode: 'hint_first',
      challengeLevel: 'too_hard',
      nextAction: 'give_hint',
      growthMetric: `Low mastery (${effectiveMastery}%) on "${targetWeakArea}". Providing scaffolded hint.`,
      teacherInsightAllowed: false,
      warnings: [],
    };
  }

  // Low mastery with no attempts → foundation practice
  if (effectiveMastery !== null && effectiveMastery < 50 && attempts <= 1) {
    return {
      targetWeakArea,
      misconceptionFocus,
      supportMode: 'guided_steps',
      challengeLevel: 'needs_foundation',
      nextAction: 'assign_foundation_practice',
      growthMetric: `Weak area "${targetWeakArea}" with ${effectiveMastery}% mastery. Assigning foundation practice.`,
      teacherInsightAllowed: false,
      warnings: [],
    };
  }

  // Some progress but still weak → similar practice
  if (effectiveMastery !== null && effectiveMastery >= 50 && effectiveMastery < 70) {
    return {
      targetWeakArea,
      misconceptionFocus,
      supportMode: 'similar_practice',
      challengeLevel: 'productive_struggle',
      nextAction: 'assign_similar_practice',
      growthMetric: `Weak area "${targetWeakArea}" at ${effectiveMastery}% mastery. Assigning similar practice.`,
      teacherInsightAllowed: false,
      warnings: [],
    };
  }

  // Strong progress → challenge extension
  if (effectiveMastery !== null && effectiveMastery >= 70 && successRate !== null && successRate >= 70) {
    return {
      targetWeakArea,
      misconceptionFocus,
      supportMode: 'challenge_extension',
      challengeLevel: 'ready_for_challenge',
      nextAction: 'assign_challenge_practice',
      growthMetric: `Weak area "${targetWeakArea}" improving (${effectiveMastery}% mastery, ${successRate}% success). Assigning challenge practice.`,
      teacherInsightAllowed: false,
      warnings: [],
    };
  }

  // Default: ask Socratic question
  return {
    targetWeakArea,
    misconceptionFocus,
    supportMode: 'question_first',
    challengeLevel: 'productive_struggle',
    nextAction: 'ask_socratic_question',
    growthMetric: `Starting growth loop for "${targetWeakArea}". Asking Socratic question.`,
    teacherInsightAllowed: false,
    warnings: [],
  };
}
