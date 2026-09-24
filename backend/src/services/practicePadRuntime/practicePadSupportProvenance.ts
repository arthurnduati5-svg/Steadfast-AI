// ─────────────────────────────────────────────────────────────
// Steadfast AI — Practice Pad PP-07: support provenance + retry /
// correction / transfer intelligence.
//
// Derived analysis only. Never mastery, memory, revision, or
// misconception truth. This module:
//
//   - maps the PP-06 L0–L5 rung onto the single canonical
//     CanonicalSupportLevel vocabulary (no second hint ladder);
//   - reconstructs trusted support history from durable
//     PracticePadCheck results (backend state, never client text);
//   - classifies retry/correction recovery deterministically;
//   - gates independent transfer evidence on governed problem + skill
//     identity with no intervening support;
//   - proposes evidence CANDIDATES reusing existing MasteryEvidenceSignal
//     and LearningEvidenceLedger vocabulary. The backend evidence owner
//     remains authoritative; nothing here mutates learning state.
//
// Evidence-strength law (ordering only, no numeric weights):
//   observed attempt < correction after substantial support
//   < self-correction < independent transfer.
// No numeric calibration is introduced or implied here.
//
// Zero model calls. Zero persistence (reads are injected by callers).
// Privacy: IDs, levels, moves, reason codes, versions, timestamps,
// and safe structural summaries only. No raw learner work, no answer
// keys, no expected answers, no hidden evaluation plans.
// ─────────────────────────────────────────────────────────────

import type { CanonicalSupportLevel } from '../supportLevelConsistencyContracts';
import type { LearningEvidenceEventType } from '../learningEvidenceLedgerContracts';
import type { MasteryEvidenceSignal } from '../../lib/types';
import type {
  PracticeInterventionLevel,
  PracticeInterventionMove,
  PracticeInterventionProposal,
  PracticeInterventionTrigger,
} from './practicePadInterventionContracts';
import type { PracticePadCheckResult } from './practicePadCheckContracts';

// ── §4: one explicit canonical support mapping (no second ladder) ──

/**
 * Single explicit mapping from the Practice Pad pedagogical rung
 * (L0–L5) onto CanonicalSupportLevel. Repository vocabulary wins
 * where stronger:
 *   L0 reflection stays independent      → reflection_prompt
 *   L1 metacognitive question            → question_only
 *   L2 concept cue                       → concept_cue
 *   L3 strategy microstep                → strategy_hint
 *   L4 analogous (never full) example    → similar_example
 *   L5 guided step-by-step rebuild       → step_check
 */
export const PRACTICE_PAD_LEVEL_TO_CANONICAL_SUPPORT: Record<
  PracticeInterventionLevel,
  CanonicalSupportLevel
> = {
  L0: 'reflection_prompt',
  L1: 'question_only',
  L2: 'concept_cue',
  L3: 'strategy_hint',
  L4: 'similar_example',
  L5: 'step_check',
};

export function canonicalSupportForLevel(level: PracticeInterventionLevel): CanonicalSupportLevel {
  return PRACTICE_PAD_LEVEL_TO_CANONICAL_SUPPORT[level];
}

// ── §5: support provenance ──

export type PracticeSupportOrigin = 'SYSTEM_PROPOSED';

export interface PracticeSupportProvenance {
  checkId: string;
  attemptId: string;
  basedOnVersion: number;
  practiceLevel: PracticeInterventionLevel;
  canonicalSupportLevel: CanonicalSupportLevel;
  move: PracticeInterventionMove;
  trigger: PracticeInterventionTrigger;
  targetStepIndex?: number;
  targetBlockId?: string;
  origin: PracticeSupportOrigin;
  createdAt: string;
}

/**
 * Provenance describes what the learner ACTUALLY received: the caller
 * passes the validated (possibly safe-fallback) proposal, never the
 * rejected candidate. For this check route the origin is always
 * SYSTEM_PROPOSED; learner-requested hint origin is not inferred
 * from client text.
 */
export function buildSupportProvenance(args: {
  checkId: string;
  attemptId: string;
  basedOnVersion: number;
  proposal: PracticeInterventionProposal;
  createdAt: string;
}): PracticeSupportProvenance {
  const decision = args.proposal.decision;
  return {
    checkId: args.checkId,
    attemptId: args.attemptId,
    basedOnVersion: args.basedOnVersion,
    practiceLevel: decision.level,
    canonicalSupportLevel: canonicalSupportForLevel(decision.level),
    move: decision.move,
    trigger: decision.trigger,
    ...(decision.targetStepIndex !== undefined ? { targetStepIndex: decision.targetStepIndex } : {}),
    ...(decision.targetBlockId ? { targetBlockId: decision.targetBlockId } : {}),
    origin: 'SYSTEM_PROPOSED',
    createdAt: args.createdAt,
  };
}

// ── §§6–7: trusted support history from durable backend state ──

const COUNTABLE_CHECK_STATUSES = new Set([
  'CONFIRMED_CORRECT',
  'CONFIRMED_INCORRECT',
  'NEEDS_SEMANTIC_ANALYSIS',
  'NEEDS_CLARIFICATION',
]);

/**
 * A durable result counts as delivered learner-visible support only when
 * it is current feedback (never stale), not a replay artefact, and its
 * attached intervention is above the L0 acknowledgement rung.
 * Excluded: replayed duplicates, stale checks, failed checks,
 * L0 acknowledgement, undelivered/rejected feedback.
 */
export function isSupportCountingResult(result: PracticePadCheckResult): boolean {
  if (!result || result.deduplicated) return false;
  if (!result.currentFeedbackEligible) return false;
  if (!COUNTABLE_CHECK_STATUSES.has(result.status)) return false;
  const intervention = result.intervention;
  if (!intervention) return false;
  if (intervention.level === 'L0') return false;
  return true;
}

/** A confirmed correct result terminates the unresolved support sequence. */
export function isConfirmedRecovery(result: PracticePadCheckResult): boolean {
  if (!result || result.deduplicated) return false;
  if (!result.currentFeedbackEligible) return false;
  return result.status === 'CONFIRMED_CORRECT';
}

function provenanceFromResult(result: PracticePadCheckResult): PracticeSupportProvenance {
  const intervention = result.intervention;
  if (!intervention) {
    throw new Error('provenanceFromResult requires an attached intervention');
  }
  return {
    checkId: result.checkId,
    attemptId: result.attemptId,
    basedOnVersion: result.basedOnVersion,
    practiceLevel: intervention.level,
    canonicalSupportLevel: intervention.canonicalSupportLevel,
    move: intervention.move as PracticeInterventionMove,
    trigger: intervention.trigger as PracticeInterventionTrigger,
    ...(intervention.targetStepIndex !== undefined ? { targetStepIndex: intervention.targetStepIndex } : {}),
    ...(intervention.targetBlockId ? { targetBlockId: intervention.targetBlockId } : {}),
    origin: 'SYSTEM_PROPOSED',
    createdAt: result.createdAt,
  };
}

/**
 * Reconstruct trusted support history for one attempt from durable
 * check results (chronological; a confirmed recovery resets the
 * unresolved sequence). The count is backend-authoritative: the
 * client MUST NOT provide it and raw learner text never converts
 * into support history.
 */
export function deriveTrustedSupportHistory(results: PracticePadCheckResult[]): PracticeSupportProvenance[] {
  const ordered = [...results].sort((a, b) => {
    if (a.basedOnVersion !== b.basedOnVersion) return a.basedOnVersion - b.basedOnVersion;
    return a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0;
  });
  const history: PracticeSupportProvenance[] = [];
  for (const result of ordered) {
    if (isConfirmedRecovery(result)) {
      history.length = 0;
      continue;
    }
    if (!isSupportCountingResult(result)) continue;
    history.push(provenanceFromResult(result));
  }
  return history;
}

export function countTrustedSupport(results: PracticePadCheckResult[]): number {
  return deriveTrustedSupportHistory(results).length;
}

/**
 * Support delivered strictly between two durable revisions.
 * Used to decide whether a correction was independent of support.
 */
export function deriveSupportBetween(
  priorVersion: number,
  currentVersion: number,
  history: PracticeSupportProvenance[],
): PracticeSupportProvenance[] {
  return history.filter((p) => p.basedOnVersion > priorVersion && p.basedOnVersion <= currentVersion);
}

// ── §§9–10: retry / correction analysis ──

export type PracticeRecoveryClassification =
  | 'SELF_CORRECTED'
  | 'CORRECTED_AFTER_SUPPORT'
  | 'SAME_ERROR_PATTERN'
  | 'NEW_ERROR_PATTERN'
  | 'PARTIAL_RECOVERY'
  | 'UNRESOLVED';

export interface PracticeDivergenceSummary {
  stepIndex: number;
  /** Structural PP-05 reason code only. Never a misconception label. */
  reasonCode?: string | null;
  observedSummary?: string | null;
  confirmedPrefixCount?: number | null;
}

export interface PracticeRecoveryAnalysis {
  priorCheckId: string;
  currentCheckId: string;
  priorVersion: number;
  currentVersion: number;
  priorDivergence?: PracticeDivergenceSummary | null;
  currentDivergence?: PracticeDivergenceSummary | null;
  supportReceived: PracticeSupportProvenance[];
  classification: PracticeRecoveryClassification;
  originalErrorResolved: boolean;
  independentOfSupport: boolean;
}

function isIntegerIndex(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

/**
 * Deterministic recovery classification over two durable revisions.
 * Never guesses: ambiguous comparison yields UNRESOLVED. Structural
 * reason + reasoning position are compared only where both sides
 * carry them; no canonical semantic misconception truth is fabricated.
 */
export function classifyPracticeRecovery(args: {
  priorCheckId: string;
  currentCheckId: string;
  priorVersion: number;
  currentVersion: number;
  priorStatus: PracticePadCheckResult['status'];
  currentStatus: PracticePadCheckResult['status'];
  priorDivergence?: PracticeDivergenceSummary | null;
  currentDivergence?: PracticeDivergenceSummary | null;
  supportReceived: PracticeSupportProvenance[];
  /** False when support history could not be loaded: never assume zero. */
  supportHistoryAvailable?: boolean;
}): PracticeRecoveryAnalysis {
  const base: PracticeRecoveryAnalysis = {
    priorCheckId: args.priorCheckId,
    currentCheckId: args.currentCheckId,
    priorVersion: args.priorVersion,
    currentVersion: args.currentVersion,
    priorDivergence: args.priorDivergence ?? null,
    currentDivergence: args.currentDivergence ?? null,
    supportReceived: [...args.supportReceived],
    classification: 'UNRESOLVED',
    originalErrorResolved: false,
    independentOfSupport: false,
  };
  if (args.supportHistoryAvailable === false) return base;
  // §11 version law: only chronological durable revisions compare.
  if (!Number.isInteger(args.priorVersion) || !Number.isInteger(args.currentVersion)) return base;
  if (!(args.currentVersion > args.priorVersion)) return base;
  // Only deterministic confirmations compare; anything undecidable or
  // unanchored is ambiguous by construction.
  const comparable =
    (args.priorStatus === 'CONFIRMED_CORRECT' || args.priorStatus === 'CONFIRMED_INCORRECT') &&
    (args.currentStatus === 'CONFIRMED_CORRECT' || args.currentStatus === 'CONFIRMED_INCORRECT');
  if (!comparable) return base;
  // Recovery requires a previously proven divergence.
  if (args.priorStatus !== 'CONFIRMED_INCORRECT') return base;
  const prior = args.priorDivergence ?? null;
  if (!prior || !isIntegerIndex(prior.stepIndex)) return base;

  if (args.currentStatus === 'CONFIRMED_CORRECT') {
    const current = args.currentDivergence ?? null;
    if (current && isIntegerIndex(current.stepIndex)) return base; // contradictory: never guess.
    const independent = args.supportReceived.length === 0;
    return {
      ...base,
      classification: independent ? 'SELF_CORRECTED' : 'CORRECTED_AFTER_SUPPORT',
      originalErrorResolved: true,
      independentOfSupport: independent,
    };
  }

  // Current work still fails deterministically: a comparable structural
  // location/pattern is required before naming the relationship.
  const current = args.currentDivergence ?? null;
  if (!current || !isIntegerIndex(current.stepIndex)) return base;
  const sameStep = current.stepIndex === prior.stepIndex;
  const priorReason = (prior.reasonCode ?? '').trim();
  const currentReason = (current.reasonCode ?? '').trim();
  const sameReason = !!priorReason && priorReason === currentReason;
  if (sameStep || sameReason) {
    return { ...base, classification: 'SAME_ERROR_PATTERN' };
  }
  const currentPrefix = isIntegerIndex(current.confirmedPrefixCount)
    ? (current.confirmedPrefixCount as number)
    : current.stepIndex;
  if (current.stepIndex > prior.stepIndex && currentPrefix > prior.stepIndex) {
    // Original divergence repaired and reasoning progressed further
    // before a later deterministic divergence: progress, not repetition.
    return { ...base, classification: 'PARTIAL_RECOVERY', originalErrorResolved: true };
  }
  return { ...base, classification: 'NEW_ERROR_PATTERN' };
}

// ── §§12–13: evidence candidates (proposed only, never mastery) ──

export type PracticeRecoveryMasterySignal = Extract<
  MasteryEvidenceSignal['evidenceType'],
  | 'correct_after_support'
  | 'repeated_mistake'
  | 'repeated_mistake_reduced'
  | 'similar_problem_success'
  | 'needed_multiple_hints'
  | 'support_strategy_helped'
  | 'support_strategy_failed'
>;

export interface PracticeRecoveryEvidenceCandidate {
  /** Deterministic: re-analysis of the same pair yields the same ID. */
  candidateId: string;
  priorCheckId: string;
  currentCheckId: string;
  /** Existing ledger vocabulary; the canonical evidence owner disposes. */
  ledgerEventType: LearningEvidenceEventType;
  /**
   * Existing mastery-signal vocabulary where directly applicable, else
   * null (never fabricated). Carries NO numeric weight: calibration
   * remains backend evidence policy.
   */
  masterySignal: PracticeRecoveryMasterySignal | null;
  safeSummary: string;
  createdAt: string;
  rawLearnerDataIncluded: false;
  rawPromptIncluded: false;
  rawAiResponseIncluded: false;
  rawTranscriptIncluded: false;
}

function candidateBase(args: {
  analysis: PracticeRecoveryAnalysis;
  ledgerEventType: LearningEvidenceEventType;
  masterySignal: PracticeRecoveryMasterySignal | null;
  safeSummary: string;
  suffix: string;
  createdAt: string;
}): PracticeRecoveryEvidenceCandidate {
  return {
    candidateId: `pprec_${args.analysis.currentCheckId}_${args.suffix}`,
    priorCheckId: args.analysis.priorCheckId,
    currentCheckId: args.analysis.currentCheckId,
    ledgerEventType: args.ledgerEventType,
    masterySignal: args.masterySignal,
    safeSummary: args.safeSummary.slice(0, 500),
    createdAt: args.createdAt,
    rawLearnerDataIncluded: false,
    rawPromptIncluded: false,
    rawAiResponseIncluded: false,
    rawTranscriptIncluded: false,
  };
}

/**
 * Propose evidence candidates for a recovery analysis. Candidates only:
 * no mastery, concept, or completion state is written here.
 */
export function proposeRecoveryEvidenceCandidates(
  analysis: PracticeRecoveryAnalysis,
  options: { createdAt: string } = { createdAt: new Date().toISOString() },
): PracticeRecoveryEvidenceCandidate[] {
  const createdAt = options.createdAt;
  switch (analysis.classification) {
    case 'SELF_CORRECTED':
      return [
        candidateBase({
          analysis,
          ledgerEventType: 'correction_observed',
          masterySignal: 'repeated_mistake_reduced',
          safeSummary:
            'Learner repaired the previously proven structural divergence with no intervening support.',
          suffix: 'self_corrected',
          createdAt,
        }),
      ];
    case 'CORRECTED_AFTER_SUPPORT': {
      const candidates = [
        candidateBase({
          analysis,
          ledgerEventType: 'correction_observed',
          masterySignal: 'correct_after_support',
          safeSummary: `Learner repaired the previously proven structural divergence after ${analysis.supportReceived.length} trusted support intervention(s).`,
          suffix: 'correct_after_support',
          createdAt,
        }),
      ];
      if (analysis.supportReceived.length >= 2) {
        candidates.push(
          candidateBase({
            analysis,
            ledgerEventType: 'retry_observed',
            masterySignal: 'needed_multiple_hints',
            safeSummary: `Correction required ${analysis.supportReceived.length} trusted support interventions before success.`,
            suffix: 'needed_multiple_hints',
            createdAt,
          }),
        );
      }
      return candidates;
    }
    case 'SAME_ERROR_PATTERN':
      return [
        candidateBase({
          analysis,
          ledgerEventType: 'mistake_signal_observed',
          masterySignal: 'repeated_mistake',
          safeSummary:
            'New reasoning fails at the same deterministically comparable structural location/pattern; structural comparison only, no semantic claim is made.',
          suffix: 'repeated_mistake',
          createdAt,
        }),
      ];
    case 'PARTIAL_RECOVERY':
      return [
        candidateBase({
          analysis,
          ledgerEventType: 'mistake_signal_observed',
          masterySignal: 'repeated_mistake_reduced',
          safeSummary:
            'Original structural divergence repaired and reasoning progressed further before a later deterministic divergence; progress, not repetition.',
          suffix: 'partial_recovery',
          createdAt,
        }),
      ];
    case 'NEW_ERROR_PATTERN':
      return [
        candidateBase({
          analysis,
          ledgerEventType: 'mistake_signal_observed',
          masterySignal: null,
          safeSummary:
            'A new deterministic structural failure appears without enough evidence to call it the original error.',
          suffix: 'new_error',
          createdAt,
        }),
      ];
    case 'UNRESOLVED':
    default:
      return [];
  }
}

// ── §§14–16: transfer requirement and independent transfer ──

export interface PracticeTransferCandidate {
  problemId: string;
  /** Governed skill / knowledge-component identity. */
  skillId: string | null;
}

export type PracticeTransferRequirement =
  | {
      status: 'transfer_required';
      originalProblemId: string;
      skillId: string;
      transferProblemId: string;
    }
  | {
      status: 'transfer_required_but_unavailable';
      originalProblemId: string;
      skillId: string | null;
      transferProblemId: null;
    };

/**
 * Select a governed transfer candidate: a DIFFERENT problem identity
 * with the SAME governed skill. Candidates come from the existing
 * question bank / selection owner; nothing is generated here and
 * nothing is fabricated when no governed candidate exists.
 */
export function requirePracticeTransfer(args: {
  originalProblemId: string;
  skillId: string | null;
  candidates: PracticeTransferCandidate[];
}): PracticeTransferRequirement {
  const original = (args.originalProblemId || '').trim();
  const skill = (args.skillId || '').trim();
  if (!original || !skill) {
    return {
      status: 'transfer_required_but_unavailable',
      originalProblemId: original,
      skillId: args.skillId ?? null,
      transferProblemId: null,
    };
  }
  const match = (args.candidates || []).find(
    (c) => (c.problemId || '').trim() && c.problemId.trim() !== original && (c.skillId || '').trim() === skill,
  );
  if (!match) {
    return { status: 'transfer_required_but_unavailable', originalProblemId: original, skillId: skill, transferProblemId: null };
  }
  return { status: 'transfer_required', originalProblemId: original, skillId: skill, transferProblemId: match.problemId.trim() };
}

export interface PracticeTransferVerdict {
  independent: boolean;
  reason:
    | 'independent_transfer_success'
    | 'same_problem_correction_not_transfer'
    | 'unrelated_skill_not_transfer'
    | 'transfer_not_solved'
    | 'supported_transfer_not_independent';
  masterySignal: PracticeRecoveryMasterySignal | null;
  ledgerEventType: LearningEvidenceEventType;
}

/**
 * A later result counts as independent transfer ONLY when backend
 * truth proves: different problem, same governed skill,
 * deterministic success, and no support delivered on the transfer
 * attempt before success. Same-problem revision is correction,
 * never transfer.
 */
export function evaluateTransferSuccess(args: {
  originalProblemId: string;
  transferProblemId: string;
  sameGovernedSkill: boolean;
  transferSolvedDeterministically: boolean;
  supportDeliveredOnTransfer: boolean;
}): PracticeTransferVerdict {
  if (args.transferProblemId === args.originalProblemId) {
    return {
      independent: false,
      reason: 'same_problem_correction_not_transfer',
      masterySignal: null,
      ledgerEventType: 'retry_observed',
    };
  }
  if (!args.sameGovernedSkill) {
    return {
      independent: false,
      reason: 'unrelated_skill_not_transfer',
      masterySignal: null,
      ledgerEventType: 'transfer_attempt_observed',
    };
  }
  if (!args.transferSolvedDeterministically) {
    return {
      independent: false,
      reason: 'transfer_not_solved',
      masterySignal: null,
      ledgerEventType: 'transfer_attempt_observed',
    };
  }
  if (args.supportDeliveredOnTransfer) {
    return {
      independent: false,
      reason: 'supported_transfer_not_independent',
      masterySignal: null,
      ledgerEventType: 'transfer_attempt_observed',
    };
  }
  return {
    independent: true,
    reason: 'independent_transfer_success',
    masterySignal: 'similar_problem_success',
    ledgerEventType: 'transfer_attempt_observed',
  };
}
