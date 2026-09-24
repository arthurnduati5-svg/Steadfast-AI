// ─────────────────────────────────────────────────────────────
// Steadfast AI — Practice Pad P0: canonical check-step contracts
//
// One canonical result shape for Practice Pad check-step. Reuses existing
// PracticeAttempt / PracticeMasteryContracts vocabulary where available.
// A check result is NEVER attempt completion, mastery, or understanding.
// ─────────────────────────────────────────────────────────────

export type PracticePadCheckStatus =
  | 'CONFIRMED_CORRECT'
  | 'CONFIRMED_INCORRECT'
  | 'NEEDS_SEMANTIC_ANALYSIS'
  | 'NEEDS_CLARIFICATION'
  | 'NOT_EVALUATED'
  | 'STALE_VERSION'
  | 'CONFLICT'
  | 'FAILED_CLOSED';

export type PracticePadDeterministicVerdict =
  | 'correct'
  | 'incorrect'
  | 'unknown';

export type PracticePadCheckerPath =
  | 'deterministic_exact'
  | 'deterministic_numeric'
  | 'deterministic_rational'
  | 'deterministic_arithmetic'
  | 'deterministic_algebraic_sample'
  | 'deterministic_linear'
  | 'deterministic_unsupported'
  | 'deterministic_invalid'
  | 'deterministic_expected_answer'
  | 'semantic_unavailable'
  | 'validation_failed'
  | 'stale_version'
  | 'conflict'
  | 'failed_closed';

export type PracticePadFailureCategory =
  | 'attempt_not_found'
  | 'wrong_learner'
  | 'wrong_school'
  | 'missing_school_identity'
  | 'problem_missing'
  | 'stale_work_version'
  | 'duplicate_conflict'
  | 'unsupported_representation'
  | 'checker_unavailable'
  | 'database_unavailable'
  | 'evidence_commit_failure'
  | 'invalid_request';

export interface PracticePadCheckRequest {
  attemptId: string;
  /** Work version the learner based this check on. Backend-owned invariant. */
  basedOnVersion: number;
  /** Client-generated idempotency key, scoped to (attemptId, basedOnVersion). */
  idempotencyKey: string;
  /** Learner work / selected-step projection. Context only — never authority. */
  workText: string;
  selectedStep?: string | null;
  /** Optional client context. Cannot override server-owned attempt/problem truth. */
  prompt?: string | null;
  topic?: string | null;
  subject?: string | null;
}

export interface PracticePadFirstDivergence {
  stepIndex: number;
  expectedSummary: string;
  observedSummary: string;
  /** Structural PP-05 reason code only. Never a misconception label. */
  reasonCode?: string | null;
}

export interface PracticePadEvidenceCandidate {
  /** Proposed only. Backend evidence owner decides whether to commit. */
  candidateId: string;
  attemptId: string;
  basedOnVersion: string;
  outcome: 'correct' | 'incorrect' | 'unscored';
  eligibleForMastery: false;
  reason: string;
}

export interface PracticePadMisconceptionCandidate {
  label: string;
  summary: string;
  confidence: number;
}

// ── PP-07: delivered PP-06 intervention (support provenance) ──

import type { CanonicalSupportLevel } from '../supportLevelConsistencyContracts';

/**
 * The exact PP-06 intervention delivered with this check. Attached
 * BEFORE durable persistence so idempotent replay returns the same
 * logical intervention. Learner-safe only: no hidden reasoning or
 * answer material. STALE_VERSION / FAILED_CLOSED / conflict results
 * carry no intervention and must never pretend one was delivered.
 */
export interface PracticePadDeliveredIntervention {
  level: 'L0' | 'L1' | 'L2' | 'L3' | 'L4' | 'L5';
  canonicalSupportLevel: CanonicalSupportLevel;
  move: string;
  trigger: string;
  targetStepIndex?: number;
  targetBlockId?: string;
  feedbackText: string;
  nextLearnerAction: string;
  origin: 'SYSTEM_PROPOSED';
}

/** PP-08: learner-safe interpretation metadata. No hidden reasoning, no protected answers. */
export interface PracticePadInterpretationProjection {
  interpretationId: string | null;
  sourceBlockId: string;
  status: string;
  candidates: Array<{
    candidateId: string;
    representationClass: string;
    displayValue: string;
    confidenceBand: 'low' | 'medium' | 'high';
  }>;
}

export interface PracticePadCheckResult {
  checkId: string;
  attemptId: string;
  basedOnVersion: number;
  status: PracticePadCheckStatus;
  /** PP-08: true when non-text work needs a confirmed interpretation first. */
  interpretationRequired?: boolean;
  /** PP-08: learner-safe interpretation metadata for the confirmation boundary. */
  interpretation?: PracticePadInterpretationProjection;
  deterministicVerdict: PracticePadDeterministicVerdict;
  firstDivergence?: PracticePadFirstDivergence;
  confirmedCorrectSteps: string[];
  suspectedIssue?: string;
  /** 0..1. Capped unless a deterministic path confirmed the verdict. */
  confidence: number;
  checkerPath: PracticePadCheckerPath;
  evidenceCandidate?: PracticePadEvidenceCandidate | null;
  misconceptionCandidate?: PracticePadMisconceptionCandidate | null;
  /** PP-07: the PP-06 intervention actually delivered with this check. */
  intervention?: PracticePadDeliveredIntervention | null;
  /** False for stale versions: retained historically, never current feedback. */
  currentFeedbackEligible: boolean;
  deduplicated: boolean;
  createdAt: string;
}

export interface PracticePadCheckFailure {
  ok: false;
  status: PracticePadCheckStatus;
  failureCategory: PracticePadFailureCategory;
  message: string;
  currentFeedbackEligible: false;
}

export type PracticePadCheckOutcome =
  | { ok: true; result: PracticePadCheckResult }
  | PracticePadCheckFailure;

// ── Durable-persistence failure (PP-01 production fail-closed law) ──

/**
 * Typed persistence failure for the protected Practice Pad path.
 * Thrown by the check/version stores when the authoritative PostgreSQL
 * store cannot answer and no explicit test double is installed.
 * The check runtime maps this to FAILED_CLOSED / database_unavailable
 * with currentFeedbackEligible=false and no committed side effects.
 * It must never be swallowed into a process-local success.
 */
export class PracticePadPersistenceError extends Error {
  readonly code = 'database_unavailable' as const;

  constructor(message: string) {
    super(message);
    this.name = 'PracticePadPersistenceError';
  }
}

// ── Learner-visible vs server-only problem projection ──

export interface PracticeProblemLearnerView {
  problemId: string;
  prompt: string;
  subject?: string | null;
  topic?: string | null;
  allowedResources: string[];
}

export interface PracticeProblemServerRecord extends PracticeProblemLearnerView {
  /** Server-only. Never serialized to the frontend. */
  expectedAnswer?: string | null;
  /** Server-only evaluation plan. Never serialized to the frontend. */
  evaluationPlan?: string | null;
  /** Server-only evaluation metadata. Never serialized to the frontend. */
  evaluationType?: string | null;
  /** Server-only acceptable forms. Never serialized to the frontend. */
  acceptableAnswerForms?: string[];
  schoolId: string;
}

export interface PracticePadTelemetry {
  requestId: string;
  attemptId: string;
  checkId: string | null;
  basedOnVersion: number;
  checkerPath: PracticePadCheckerPath | 'unknown';
  mode: 'deterministic' | 'semantic' | 'degraded';
  latencyMs: number;
  failureCategory?: PracticePadFailureCategory;
}
