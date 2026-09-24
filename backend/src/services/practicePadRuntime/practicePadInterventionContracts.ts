// ─────────────────────────────────────────────────────────────
// Steadfast AI — Practice Pad PP-06: Socratic intervention contracts
//
// DERIVED policy only. Never mastery, memory, revision, or
// misconception truth. PP-04 owns math truth; PP-05 owns first
// divergence; this layer owns only the weakest-useful teaching move.
//
// Canonical support reconciliation (no second hint ladder):
//   L0 retry independently      → reflection_prompt / independent continuation
//   L1 metacognitive question   → question_only (FEEDBACK_POLICY_TEMPLATES
//                                  ask_for_reasoning / ask_clarifying_question)
//   L2 concept cue              → concept_cue (CanonicalSupportLevel)
//   L3 strategy microstep       → strategy_hint
//   L4 analogous example        → similar_example / partial_worked_example
//                                  (analogous only, never the full solution)
//   L5 guided reconstruction    → step_check guided rebuild, final answer
//                                  always blocked
// ─────────────────────────────────────────────────────────────

import type { PracticePadCheckStatus } from './practicePadCheckContracts';
import type { ReasoningReasonCode } from './practicePadReasoningGraph';

export type PracticeInterventionLevel = 'L0' | 'L1' | 'L2' | 'L3' | 'L4' | 'L5';

export type PracticeInterventionMove =
  | 'independent_continuation'
  | 'acknowledge_and_extend'
  | 'metacognitive_clarification'
  | 'concept_cue'
  | 'strategy_microstep'
  | 'analogous_example'
  | 'guided_reconstruction'
  | 'truthful_fallback';

export type PracticeInterventionTrigger =
  | 'confirmed_correct'
  | 'first_divergence'
  | 'needs_clarification'
  | 'needs_semantic_analysis_unavailable'
  | 'reasoning_unavailable'
  | 'validation_failure_fallback';

export interface PracticeInterventionDecision {
  level: PracticeInterventionLevel;
  move: PracticeInterventionMove;
  trigger: PracticeInterventionTrigger;
  targetStepIndex?: number;
  targetBlockId?: string;
  reasoningStatus: PracticePadCheckStatus;
  /** Structural reason code only (e.g. VALUE_CHANGED). Never a misconception label. */
  supportReason: string;
  learnerActionRequired: string;
  mayRevealFinalAnswer: false;
  /** True when semantic language would help but the model is disabled. */
  semanticLanguageRequired: boolean;
}

export interface PracticeInterventionInput {
  checkStatus: PracticePadCheckStatus;
  firstDivergenceStepIndex?: number | null;
  firstDivergenceBlockId?: string | null;
  /** Structural PP-05 reason code; guides policy, never becomes a misconception claim. */
  reasonCode?: ReasoningReasonCode | null;
  confirmedCorrectStepCount?: number;
  /**
   * Trusted prior support count from durable PP-07 provenance only.
   * Raw text must never be converted into this number.
   */
  trustedSupportCount?: number;
}

export interface PracticeInterventionProposal {
  decision: PracticeInterventionDecision;
  feedbackText: string;
  nextLearnerAction: string;
  targetStepIndex?: number;
  validated: boolean;
  fallbackUsed: boolean;
  liveModelCalls: 0;
}
