// ─────────────────────────────────────────────────────────────
// Steadfast AI — Practice Pad PP-10: canonical learning integration.
//
// ONE small orchestrator (no new state owner). Wires already-built
// Practice Pad intelligence into EXISTING canonical owners:
//
//   evidence  → practiceCanonicalLearningService / learningEvidenceLedger
//               (injected as evidenceCommitter; this file never writes a ledger)
//   mastery   → existing mastery inference owner (injected projector)
//   memory    → existing learner-memory owner (injected projector)
//   revision  → existing revision/spaced-review owner (injected projector)
//   Growth    → existing Growth/recommendation owner (injected projector)
//
// Laws:
//   - AI / Practice Pad MAY PROPOSE. Backend validates, persists, audits.
//   - Check truth stays independent; integrity is contextual only.
//   - Evidence admission precedes ALL downstream mutation.
//   - Failed commit → zero downstream mutation. Replay → one consequence.
//   - Zero live model calls. No raw work copied into learner state.
// ─────────────────────────────────────────────────────────────

import {
  classifyPracticeRecovery,
  deriveTrustedSupportHistory,
  evaluateTransferSuccess,
  type PracticeRecoveryAnalysis,
  type PracticeTransferVerdict,
} from './practicePadSupportProvenance';
import type { PracticePadCheckResult } from './practicePadCheckContracts';
import type { PracticeIntegrityEvidenceReaders } from './practicePadIntegrityEngine';

// ── PP-10 production binding: actual canonical owners (no new stores) ──
import { practicePadCheckStore, parseCheckResult } from './practicePadCheckStore';
import { practiceAttemptService } from '../practiceAttemptService';
import { practicePadProblemAuthority } from './practicePadProblemAuthority';
import { practicePadDocumentStore } from './practicePadDocumentStore';
import { practicePadInterpretationStore } from './practicePadInterpretationStore';
import { evaluatePracticeIntegrity } from './practicePadIntegrityEngine';
import { commitPracticeLearningEvidence } from '../practiceCanonicalLearningService';
import { learnerMemoryService } from '../learnerMemoryService';
import { spacedReviewService } from '../spacedReviewService';
import { nextPracticeService } from '../nextPracticeService';
import { practicePadProjectionReceiptStore } from './practicePadProjectionReceiptStore';
import {
  executeClaimedProjectionReceipt,
  type PracticeProjectionProjectors,
} from './practicePadProjectionReconciler';
import type { ResolvedTutorIdentity } from '../tutorStateContracts';

/** PP-10 performs zero live model/provider calls. */
export const PP10_LIVE_MODEL_CALLS = 0 as const;

/**
 * PP-10 fail-closed store-outage sentinels. Thrown by the canonical
 * production loaders when canonical truth cannot be read. The kernel
 * and the canonical entry convert them into protected PP-10 failures
 * with zero downstream mutation — never into empty stand-ins.
 */
export class PP10DocumentStoreUnavailable extends Error {
  readonly code = 'DOCUMENT_STORE_UNAVAILABLE' as const;
  constructor(message = 'Practice document/revision store unavailable.') {
    super(message);
    this.name = 'PP10DocumentStoreUnavailable';
  }
}

export class PP10CheckHistoryUnavailable extends Error {
  readonly code = 'CHECK_HISTORY_UNAVAILABLE' as const;
  constructor(message = 'Practice check-history store unavailable.') {
    super(message);
    this.name = 'PP10CheckHistoryUnavailable';
  }
}

export type PP10FailureCode =
  | 'CHECK_NOT_FOUND'
  | 'CHECK_NOT_CURRENT'
  | 'EVIDENCE_NOT_ADMISSIBLE'
  | 'RECOVERY_UNRESOLVED'
  | 'TRANSFER_UNVERIFIED'
  | 'INTEGRITY_EVIDENCE_UNAVAILABLE'
  | 'EVIDENCE_COMMIT_FAILED'
  | 'DOWNSTREAM_PROJECTION_FAILED'
  | 'IDEMPOTENCY_CONFLICT';

export interface PP10CanonicalAttempt {
  attemptId: string;
  schoolId: string;
  studentId: string;
  problemId?: string | null;
  problemVersion?: number | null;
}

export interface PP10CanonicalProblem {
  problemId: string;
  problemVersion?: number | null;
  /** READY means issuable. Anything else blocks negative learner mutation. */
  status: 'READY' | 'INVALID' | 'REJECTED' | 'NOT_READY' | 'AMBIGUOUS' | 'SOURCE_INVALID' | 'EVALUATION_INVALID' | string;
  skillId?: string | null;
  curriculumRefs?: { skillId?: string | null; objectiveId?: string | null; topicId?: string | null };
}

export interface PP10CanonicalRevision {
  version: number;
  /** Canonical stored work text (server-owned). Length only is used. */
  workText?: string | null;
  contentHash?: string | null;
}

export interface PP10CheckLoad {
  check: PracticePadCheckResult | null;
  /** False when the check is not the current feedback (stale/superseded). */
  isCurrent: boolean;
}

export interface PP10EvidenceCandidate {
  attemptId: string;
  problemId: string | null;
  problemVersion: number | null;
  documentVersion: number;
  checkId: string;
  skillId: string | null;
  curriculumRefs: { skillId?: string | null; objectiveId?: string | null; topicId?: string | null };
  deterministicOutcome: 'correct' | 'incorrect' | 'unscored';
  firstDivergenceStepIndex: number | null;
  firstDivergenceReasonCode: string | null;
  confirmedPrefixCount: number;
  supportQuality: 'INDEPENDENT' | 'SELF_CORRECTED' | 'CORRECTED_AFTER_SUPPORT' | 'HEAVILY_SUPPORTED' | 'UNRESOLVED_SUPPORT';
  recoveryClassification: PracticeRecoveryAnalysis['classification'];
  transferIndependent: boolean;
  transferReason: PracticeTransferVerdict['reason'] | null;
  ledgerEventType: string;
  masterySignal: string | null;
  interpretationId: string | null;
  interpretationSourceHash: string | null;
  representationClass: string | null;
  integrityEvidenceId: string | null;
  integrityConcern: string | null;
  integrityNextAction: string | null;
  evidenceQualityNote: string;
  createdAt: string;
  rawWorkIncluded: false;
  rawInkIncluded: false;
}

export interface PP10IntegrateDeps {
  identity: { schoolId: string; studentId: string; verifiedSchool: boolean };
  attemptId: string;
  checkId: string;
  idempotencyKey: string;
  loadCheck: (checkId: string) => Promise<PP10CheckLoad> | PP10CheckLoad;
  loadAttempt: (attemptId: string) => Promise<PP10CanonicalAttempt | null> | PP10CanonicalAttempt | null;
  loadProblem: (problemId: string | null) => Promise<PP10CanonicalProblem | null> | PP10CanonicalProblem | null;
  loadRevisions: (attemptId: string) => Promise<PP10CanonicalRevision[]> | PP10CanonicalRevision[];
  loadCheckHistory: (attemptId: string) => Promise<PracticePadCheckResult[]> | PracticePadCheckResult[];
  loadTransferContext?: () => Promise<{
    originalProblemId: string;
    transferProblemId: string | null;
    sameGovernedSkill: boolean;
    transferSolvedDeterministically: boolean;
    supportDeliveredOnTransfer: boolean;
  }> | {
    originalProblemId: string;
    transferProblemId: string | null;
    sameGovernedSkill: boolean;
    transferSolvedDeterministically: boolean;
    supportDeliveredOnTransfer: boolean;
  };
  integrityEvidence?: {
    integrityEvidenceId: string;
    concernLevel: string;
    signals: string[];
    recommendedNextEvidenceAction: string;
  } | null;
  /** Canonical evidence owner (practiceCanonicalLearningService / ledger). */
  evidenceCommitter: (candidate: PP10EvidenceCandidate) => Promise<{ ok: true; committedEvidenceId: string } | { ok: false; code: string; message: string }>;
  /** Existing downstream owners (injected projectors; never called before commit). */
  projectors?: {
    mastery?: (admitted: { committedEvidenceId: string; candidate: PP10EvidenceCandidate }) => Promise<void> | void;
    memory?: (admitted: { committedEvidenceId: string; candidate: PP10EvidenceCandidate }) => Promise<void> | void;
    revision?: (admitted: { committedEvidenceId: string; candidate: PP10EvidenceCandidate }) => Promise<void> | void;
    growth?: (admitted: { committedEvidenceId: string; candidate: PP10EvidenceCandidate }) => Promise<void> | void;
  };
  /** Caller-owned replay guard (durable in production; test-controlled here). */
  seenEvidenceKeys?: Set<string>;
  clock?: () => string;
}

export type PP10IntegrateResult =
  | {
      ok: true;
      committedEvidenceId: string;
      candidate: PP10EvidenceCandidate;
      recovery: PracticeRecoveryAnalysis | null;
      transfer: PracticeTransferVerdict | null;
      readers: PracticeIntegrityEvidenceReaders;
      order: string[];
      deduplicated: boolean;
      evidenceHeldForTransfer: boolean;
    }
  | { ok: false; code: PP10FailureCode; message: string; order: string[] };

// ── PP-10 §3: real backend readers (never client values) ──

export function resolvePracticeIntegrityReadersFromCanonical(args: {
  revisions: PP10CanonicalRevision[];
  currentVersion: number;
  checkHistory: PracticePadCheckResult[];
  currentCheck: PracticePadCheckResult;
  recovery: PracticeRecoveryAnalysis | null;
  transferIndependent: boolean;
}): PracticeIntegrityEvidenceReaders {
  const head = args.revisions.find((r) => r.version === args.currentVersion) ?? null;
  const workChars = head && typeof head.workText === 'string' ? head.workText.length : null;
  const revisionCount = args.revisions.length > 0 ? args.revisions.length : null;
  // PP-05 derived analysis from the canonical revision: confirmed prefix
  // length is the deterministic reasoning-step count (never client text).
  const reasoningSteps =
    Array.isArray(args.currentCheck.confirmedCorrectSteps) && args.currentCheck.confirmedCorrectSteps.length > 0
      ? args.currentCheck.confirmedCorrectSteps.length
      : null;
  // PP-07 durable recovery/check history: a prior CONFIRMED_INCORRECT
  // before this CONFIRMED_CORRECT proves self-correction context.
  let hadIncorrectBeforeCorrect: boolean | null = null;
  if (args.currentCheck.status === 'CONFIRMED_CORRECT') {
    hadIncorrectBeforeCorrect = args.checkHistory.some(
      (h) => h.checkId !== args.currentCheck.checkId && h.status === 'CONFIRMED_INCORRECT' && h.basedOnVersion <= args.currentCheck.basedOnVersion,
    );
  }
  return {
    workChars,
    revisionCount,
    reasoningSteps,
    hadIncorrectBeforeCorrect,
    transferCorrect: args.transferIndependent === true ? true : null,
    attemptVersion: args.currentVersion,
    // PP-10 §4 proof gate: true ONLY when PP-07 classified this exact
    // correction as CORRECTED_AFTER_SUPPORT from durable history.
    provenCorrectedAfterSupport: args.recovery?.classification === 'CORRECTED_AFTER_SUPPORT' ? true : null,
  };
}

function isProblemBlocked(status: string): boolean {
  return status !== 'READY';
}

function supportQualityFor(recovery: PracticeRecoveryAnalysis | null, trustedSupportCount: number): PP10EvidenceCandidate['supportQuality'] {
  if (!recovery || recovery.classification === 'UNRESOLVED') return 'UNRESOLVED_SUPPORT';
  if (recovery.classification === 'SELF_CORRECTED') return 'SELF_CORRECTED';
  if (recovery.classification === 'CORRECTED_AFTER_SUPPORT') {
    return trustedSupportCount >= 2 ? 'HEAVILY_SUPPORTED' : 'CORRECTED_AFTER_SUPPORT';
  }
  return 'UNRESOLVED_SUPPORT';
}

/**
 * ONE Practice Pad learning-integration orchestrator. Loads canonical
 * check/attempt/problem/revision, derives PP-07 recovery + transfer,
 * resolves real PP-09 backend readers, builds the evidence candidate,
 * invokes the EXISTING canonical evidence owner, then allows existing
 * downstream owners to project. Never reimplements ledger/mastery/
 * memory/revision/Growth.
 */
export async function integratePracticePadLearning(deps: PP10IntegrateDeps): Promise<PP10IntegrateResult> {
  const order: string[] = [];
  const now = deps.clock ?? (() => new Date().toISOString());

  const id = deps.identity;
  if (!id.schoolId || !id.studentId || !id.verifiedSchool) {
    return { ok: false, code: 'EVIDENCE_NOT_ADMISSIBLE', message: 'Verified school and learner are required.', order };
  }
  if (!deps.idempotencyKey) {
    return { ok: false, code: 'EVIDENCE_NOT_ADMISSIBLE', message: 'idempotencyKey is required.', order };
  }
  if (deps.seenEvidenceKeys?.has(deps.idempotencyKey)) {
    return { ok: false, code: 'IDEMPOTENCY_CONFLICT', message: 'Replay: this evidence key was already committed.', order };
  }

  // 1. canonical check
  const loaded = await deps.loadCheck(deps.checkId);
  const check = loaded?.check ?? null;
  if (!check) return { ok: false, code: 'CHECK_NOT_FOUND', message: 'Canonical check not found.', order };
  order.push('canonical check complete');
  if (!loaded.isCurrent || check.currentFeedbackEligible === false) {
    return { ok: false, code: 'CHECK_NOT_CURRENT', message: 'Check is not current feedback.', order };
  }

  // 2. canonical attempt/problem/revision
  const attempt = await deps.loadAttempt(deps.attemptId);
  if (!attempt || attempt.attemptId !== check.attemptId || attempt.schoolId !== id.schoolId || attempt.studentId !== id.studentId) {
    return { ok: false, code: 'EVIDENCE_NOT_ADMISSIBLE', message: 'Attempt ownership binding failed.', order };
  }
  const problem = await deps.loadProblem(attempt.problemId ?? null);
  if (!problem) {
    return { ok: false, code: 'EVIDENCE_NOT_ADMISSIBLE', message: 'No canonical problem binding.', order };
  }
  // §9 invalid/ambiguous problem protection: never hurt the learner.
  if (isProblemBlocked(problem.status)) {
    return { ok: false, code: 'EVIDENCE_NOT_ADMISSIBLE', message: `Problem is ${problem.status}; learner outcome is protected.`, order };
  }
  // Fail closed on canonical-truth outage: a loader that throws (or a
  // sentinel from the production loaders) is a protected failure, never
  // an empty stand-in. An empty revision list stays empty (no document
  // versions exist); an empty history stays empty (first check). Only an
  // UNAVAILABLE store fails here.
  let revisions: PP10CanonicalRevision[];
  try {
    revisions = (await deps.loadRevisions(attempt.attemptId)) ?? [];
  } catch (err) {
    return {
      ok: false,
      code: 'EVIDENCE_NOT_ADMISSIBLE',
      message: `Practice document/revision store unavailable (${(err as Error).message}); evidence is not admitted without canonical work truth.`,
      order,
    };
  }
  const headVersion = revisions.length > 0 ? Math.max(...revisions.map((r) => r.version)) : check.basedOnVersion;
  if (check.basedOnVersion !== headVersion) {
    return { ok: false, code: 'CHECK_NOT_CURRENT', message: 'Check version does not match canonical document head.', order };
  }
  let history: PracticePadCheckResult[];
  try {
    history = (await deps.loadCheckHistory(attempt.attemptId)) ?? [];
  } catch (err) {
    return {
      ok: false,
      code: 'EVIDENCE_NOT_ADMISSIBLE',
      message: `Check-history store unavailable (${(err as Error).message}); unavailable history is never treated as no support.`,
      order,
    };
  }
  order.push('evidence candidate');

  // §10 interpretation quality law: unconfirmed non-text → zero mutation.
  const interp = (check as PracticePadCheckResult).interpretationRequired;
  const interpProj = (check as PracticePadCheckResult).interpretation;
  if (interp === true) {
    return { ok: false, code: 'EVIDENCE_NOT_ADMISSIBLE', message: 'Unconfirmed interpretation: zero learning-state mutation.', order };
  }
  const interpretationIsNonText = !!interpProj && interpProj.status !== 'CONFIRMED' && interpProj.sourceBlockId;
  if (interpretationIsNonText && interpProj.status !== 'CONFIRMED') {
    // A projection exists but is not CONFIRMED → unconfirmed interpretation.
    return { ok: false, code: 'EVIDENCE_NOT_ADMISSIBLE', message: 'Unconfirmed interpretation: zero learning-state mutation.', order };
  }

  // Only deterministic confirmations may become mathematical evidence.
  const deterministicOutcome: PP10EvidenceCandidate['deterministicOutcome'] =
    check.status === 'CONFIRMED_CORRECT' ? 'correct' : check.status === 'CONFIRMED_INCORRECT' ? 'incorrect' : 'unscored';
  if (deterministicOutcome === 'unscored') {
    return { ok: false, code: 'EVIDENCE_NOT_ADMISSIBLE', message: 'Check is not deterministically confirmed.', order };
  }
  // Deterministic confidence requirement.
  if (typeof check.confidence === 'number' && check.confidence < 0.8) {
    return { ok: false, code: 'EVIDENCE_NOT_ADMISSIBLE', message: 'Confidence below deterministic admission threshold.', order };
  }

  // 3. PP-07 recovery (automatically derived from durable history).
  let recovery: PracticeRecoveryAnalysis | null = null;
  const orderedHistory = [...history].sort((a, b) =>
    a.basedOnVersion !== b.basedOnVersion ? a.basedOnVersion - b.basedOnVersion : a.createdAt < b.createdAt ? -1 : 1,
  );
  const prior = [...orderedHistory].filter((h) => h.basedOnVersion < check.basedOnVersion).pop() ?? null;
  if (prior) {
    // History EXCLUDES the current check: deriveTrustedSupportHistory
    // resets on a confirmed recovery, so including the correcting check
    // would wipe the very support delivered before it.
    const priorHistory = orderedHistory.filter((h) => h.checkId !== check.checkId && h.basedOnVersion <= check.basedOnVersion);
    const trusted = deriveTrustedSupportHistory(priorHistory);
    // Support delivered WITH the prior check (same basedOnVersion) counts
    // as received before the correction: PP-07 accepted semantics treat
    // same-version support as received (priorVersion 1 + support at
    // version 1 → CORRECTED_AFTER_SUPPORT). Strictly newer support also
    // counts; support after the current version never does.
    const supportReceived = trusted.filter((p) => p.basedOnVersion >= prior.basedOnVersion && p.basedOnVersion <= check.basedOnVersion);
    recovery = classifyPracticeRecovery({
      priorCheckId: prior.checkId,
      currentCheckId: check.checkId,
      priorVersion: prior.basedOnVersion,
      currentVersion: check.basedOnVersion,
      priorStatus: prior.status,
      currentStatus: check.status,
      priorDivergence: prior.firstDivergence ? { stepIndex: prior.firstDivergence.stepIndex, reasonCode: prior.firstDivergence.reasonCode ?? null } : null,
      currentDivergence: check.firstDivergence ? { stepIndex: check.firstDivergence.stepIndex, reasonCode: check.firstDivergence.reasonCode ?? null } : null,
      supportReceived,
      supportHistoryAvailable: true,
    });
  }

  // 4. PP-07 governed transfer (automatically resolved).
  let transfer: PracticeTransferVerdict | null = null;
  let transferIndependent = false;
  if (deps.loadTransferContext) {
    const t = await deps.loadTransferContext();
    if (t.transferProblemId) {
      transfer = evaluateTransferSuccess({
        originalProblemId: t.originalProblemId,
        transferProblemId: t.transferProblemId,
        sameGovernedSkill: t.sameGovernedSkill,
        transferSolvedDeterministically: t.transferSolvedDeterministically,
        supportDeliveredOnTransfer: t.supportDeliveredOnTransfer,
      });
      transferIndependent = transfer.independent;
    } else {
      transfer = null;
    }
  }

  // 5. PP-09 real backend readers (§3: never client values).
  const readers = resolvePracticeIntegrityReadersFromCanonical({
    revisions,
    currentVersion: headVersion,
    checkHistory: orderedHistory,
    currentCheck: check,
    recovery,
    transferIndependent,
  });

  // §8 structural mistake evidence only: first-divergence carries step
  // index + structural reasonCode + provenance, never a semantic label.
  const skillId = problem.skillId ?? problem.curriculumRefs?.skillId ?? null;
  // Trusted support delivered BEFORE this check (current check excluded
  // for the same reset reason as above; it must never count itself).
  const trustedSupportCount = deriveTrustedSupportHistory(
    orderedHistory.filter((h) => h.checkId !== check.checkId && h.basedOnVersion <= check.basedOnVersion),
  ).length;
  const quality = supportQualityFor(recovery, trustedSupportCount);

  // Map recovery → existing evidence vocabulary (reuse, no new weights).
  // CORRECTED_AFTER_SUPPORT != independent mastery proof; independent
  // transfer uses the stronger similar_problem_success kind.
  let ledgerEventType = 'practice_observed';
  let masterySignal: string | null = null;
  if (deterministicOutcome === 'correct' && transferIndependent) {
    ledgerEventType = 'transfer_attempt_observed';
    masterySignal = 'similar_problem_success';
  } else if (recovery?.classification === 'SELF_CORRECTED') {
    ledgerEventType = 'correction_observed';
    masterySignal = 'repeated_mistake_reduced';
  } else if (recovery?.classification === 'CORRECTED_AFTER_SUPPORT') {
    ledgerEventType = 'correction_observed';
    masterySignal = trustedSupportCount >= 2 ? 'needed_multiple_hints' : 'correct_after_support';
  } else if (recovery?.classification === 'SAME_ERROR_PATTERN') {
    ledgerEventType = 'mistake_signal_observed';
    masterySignal = 'repeated_mistake';
  } else if (recovery?.classification === 'PARTIAL_RECOVERY') {
    ledgerEventType = 'mistake_signal_observed';
    masterySignal = 'repeated_mistake_reduced';
  } else if (deterministicOutcome === 'correct') {
    // A. correct first attempt without support (independent).
    ledgerEventType = trustedSupportCount === 0 ? 'practice_observed' : 'correction_observed';
    masterySignal = trustedSupportCount === 0 ? null : 'correct_after_support';
  } else {
    ledgerEventType = 'mistake_signal_observed';
    masterySignal = null;
  }

  const integrity = deps.integrityEvidence ?? null;
  // §13 integrity is contextual only: never flips math verdict (the
  // deterministicOutcome above is already fixed), never directly mutates
  // mastery. MODERATE concern may HOLD strong evidence for transfer.
  const evidenceHeldForTransfer =
    !!integrity && integrity.concernLevel === 'MODERATE' && deterministicOutcome === 'correct' && !transferIndependent;

  const candidate: PP10EvidenceCandidate = {
    attemptId: attempt.attemptId,
    problemId: problem.problemId,
    problemVersion: problem.problemVersion ?? null,
    documentVersion: headVersion,
    checkId: check.checkId,
    skillId,
    curriculumRefs: {
      ...(problem.curriculumRefs?.skillId ? { skillId: problem.curriculumRefs.skillId } : skillId ? { skillId } : {}),
      ...(problem.curriculumRefs?.objectiveId ? { objectiveId: problem.curriculumRefs.objectiveId } : {}),
      ...(problem.curriculumRefs?.topicId ? { topicId: problem.curriculumRefs.topicId } : {}),
    },
    deterministicOutcome,
    firstDivergenceStepIndex: check.firstDivergence?.stepIndex ?? null,
    firstDivergenceReasonCode: (check.firstDivergence?.reasonCode ?? null) as string | null,
    confirmedPrefixCount: Array.isArray(check.confirmedCorrectSteps) ? check.confirmedCorrectSteps.length : 0,
    supportQuality: transferIndependent ? 'INDEPENDENT' : quality,
    recoveryClassification: recovery?.classification ?? 'UNRESOLVED',
    transferIndependent,
    transferReason: transfer?.reason ?? null,
    ledgerEventType,
    masterySignal,
    interpretationId: interpProj && interpProj.status === 'CONFIRMED' ? (interpProj.interpretationId ?? null) : null,
    interpretationSourceHash: null,
    representationClass: null,
    integrityEvidenceId: integrity?.integrityEvidenceId ?? null,
    integrityConcern: integrity?.concernLevel ?? null,
    integrityNextAction: integrity?.recommendedNextEvidenceAction ?? null,
    evidenceQualityNote:
      transferIndependent
        ? 'Independent transfer success: stronger evidence via existing policy.'
        : recovery?.classification === 'CORRECTED_AFTER_SUPPORT'
          ? 'Corrected after support: support-qualified evidence, not independent mastery proof.'
          : recovery?.classification === 'SELF_CORRECTED'
            ? 'Self-corrected: valid recovery evidence.'
            : 'Direct deterministic evidence with support provenance.',
    createdAt: now(),
    rawWorkIncluded: false,
    rawInkIncluded: false,
  };

  // 6. canonical evidence commit (existing owner validates + persists).
  order.push('validate');
  let commit: { ok: true; committedEvidenceId: string } | { ok: false; code: string; message: string };
  try {
    commit = await deps.evidenceCommitter(candidate);
  } catch (err) {
    return { ok: false, code: 'EVIDENCE_COMMIT_FAILED', message: `Evidence owner threw: ${(err as Error).message}`, order };
  }
  if (!commit.ok) {
    // §6/§18: failed commit → zero downstream mutation.
    return { ok: false, code: 'EVIDENCE_COMMIT_FAILED', message: commit.message, order };
  }
  order.push('canonical evidence commit');

  // 7. existing downstream owners project (mastery/memory/revision/Growth).
  // Held evidence (MODERATE concern) still commits the math truth but
  // downstream strong projections are deferred to transfer; only
  // revision/Growth receive the admitted contextual evidence here.
  try {
    const admitted = { committedEvidenceId: commit.committedEvidenceId, candidate };
    if (!evidenceHeldForTransfer) {
      if (deps.projectors?.mastery) await deps.projectors.mastery(admitted);
      order.push('mastery consequence');
      if (deps.projectors?.memory) await deps.projectors.memory(admitted);
      order.push('memory consequence');
    }
    if (deps.projectors?.revision) await deps.projectors.revision(admitted);
    order.push('revision consequence');
    if (deps.projectors?.growth) await deps.projectors.growth(admitted);
    order.push('Growth consequence');
  } catch (err) {
    // Canonical evidence remains authoritative; failure is observable.
    return { ok: false, code: 'DOWNSTREAM_PROJECTION_FAILED', message: `Downstream projector threw: ${(err as Error).message}`, order };
  }

  deps.seenEvidenceKeys?.add(deps.idempotencyKey);
  return {
    ok: true,
    committedEvidenceId: commit.committedEvidenceId,
    candidate,
    recovery,
    transfer,
    readers,
    order,
    deduplicated: false,
    evidenceHeldForTransfer,
  };
}

// ─────────────────────────────────────────────────────────────
// PP-10 PRODUCTION BINDING (canonical entry point).
//
// integratePracticePadLearningCanonical(...) is the ONE production
// entry. Its public input is SMALL (verified identity, attemptId,
// checkId, idempotencyKey). Callers never inject loaders, committers,
// projectors, Sets, or integrity evidence: every binding below
// defaults to the existing canonical owner and is overridable only
// as an explicit test seam.
//
// Bound canonical owners:
//   check     → practicePadCheckStore.findByCheckId (existing storage)
//   attempt   → practiceAttemptService.getPracticeAttempt (+ listPracticeAttempts
//               for transfer derivation; existing owner, no new store)
//   problem   → practicePadProblemAuthority.resolveForAttemptAsync
//   revisions → practicePadDocumentStore (lengths/hashes only, no raw work)
//   history   → practicePadCheckStore.listByAttempt
//   integrity → evaluatePracticeIntegrity with backend-derived readers
//   evidence  → commitPracticeLearningEvidence (durable owner of replay;
//               its receipt is the ONLY production idempotency authority)
//   interpret → practicePadInterpretationStore (CONFIRMED provenance only)
//   memory    → learnerMemoryService.createLearnerMemory (existing owner;
//               admitted learning facts only, after evidence commit)
//   revision  → spacedReviewService.scheduleReviewFromAttempt (existing
//               owner; admitted facts only, after evidence commit)
//   Growth    → nextPracticeService.recommendNextPractice (existing owner;
//               admitted facts only, after evidence commit)
//   transfer  → derived from backend state (PracticeAttempt + PracticePadCheck
//               + governed skill + deterministic outcome + support history);
//               overrides.loadTransferContext is a test seam only.
//
// Deliberately NOT bound here:
//   - No mastery projector: commitPracticeLearningEvidence already owns
//     the canonical mastery consequence. One evidence → at most one
//     mastery. Passing a second projector would double-apply mastery.
//   - No seenEvidenceKeys: a caller-owned Set is not production
//     authority and is never consulted on this path.
//   - No model calls: PP10_LIVE_MODEL_CALLS stays 0.
//   - No new stores: every downstream owner above already exists.
//
// PP-12 carry-forward (recorded, NOT fixed here): the
// PracticeCanonicalIdempotency runtime CREATE TABLE / CREATE INDEX in
// practiceCanonicalLearningService must be migrated to provisioned
// schema and removed from request execution during PP-12. No DDL,
// migration, concurrency, or load work is attempted on this path.
// ─────────────────────────────────────────────────────────────

export interface PP10CanonicalInput {
  identity: { schoolId: string; studentId: string; verifiedSchool: boolean };
  attemptId: string;
  checkId: string;
  idempotencyKey: string;
}

export interface PP10CanonicalOverrides {
  checkStore?: Pick<typeof practicePadCheckStore, 'findByCheckId' | 'listByAttempt'>;
  attemptOwner?: Pick<typeof practiceAttemptService, 'getPracticeAttempt'> & {
    listPracticeAttempts?: (
      identity: { schoolId: string; studentId: string; verifiedSchool: boolean },
      options?: { skillId?: string; limit?: number },
    ) => Promise<
      Array<{
        attemptId: string;
        problemId?: string | null;
        skillIds?: string[];
        status?: string;
      }>
    >;
  };
  problemAuthority?: Pick<typeof practicePadProblemAuthority, 'resolveForAttemptAsync'>;
  documentStore?: Pick<typeof practicePadDocumentStore, 'getDocument' | 'getRevision'>;
  interpretationStore?: Pick<typeof practicePadInterpretationStore, 'getInterpretation'>;
  integrityEvaluator?: typeof evaluatePracticeIntegrity;
  integrityStore?: Parameters<typeof evaluatePracticeIntegrity>[2] extends infer _D
    ? import('./practicePadIntegrityEngine').PracticePadIntegrityDependencies['store']
    : never;
  evidenceOwner?: Pick<{ commit: typeof commitPracticeLearningEvidence }, 'commit'> & {
    commitPracticeLearningEvidence?: typeof commitPracticeLearningEvidence;
  };
  /** Test seam only. Production derives transfer context from backend state. */
  loadTransferContext?: PP10IntegrateDeps['loadTransferContext'];
  /** Test seams only. Production defaults are the real canonical owners. */
  downstreamOwners?: Partial<PP10DownstreamOwners>;
  /**
   * Durable projection-receipt owner. Production default is the real
   * PostgreSQL-backed practicePadProjectionReceiptStore. Test seam only
   * overrides with an equivalent in-memory double.
   */
  receiptStore?: Pick<
    typeof practicePadProjectionReceiptStore,
    'ensureReceipt' | 'getReceipt' | 'markProjectionState' | 'claimReceipt' | 'releaseClaim'
  >;
  clock?: () => string;
}

/**
 * Stable logical Practice Pad request identity for the canonical
 * evidence owner. attemptId + checkId already bind the exact check
 * (and therefore its document version); retries and concurrent
 * identical requests hash to the same durable receipt. Different
 * logical evidence (different check) never collapses.
 */
export function pp10StableClientRequestId(attemptId: string, checkId: string): string {
  return `pp10:${attemptId}:${checkId}`;
}

// ─────────────────────────────────────────────────────────────
// PP-10 blocker repair: admitted learning facts + real downstream
// owners. Only scalar facts admitted by the canonical evidence
// commit travel downstream. Never: raw PracticeDocument, raw
// handwriting/ink, tab-switch/integrity suspicion, cheating labels,
// or speculative misconception labels.
// ─────────────────────────────────────────────────────────────

export interface PP10AdmittedLearningFacts {
  committedEvidenceId: string;
  attemptId: string;
  schoolId: string;
  studentId: string;
  checkId: string;
  documentVersion: number;
  skillId: string | null;
  subject: string | null;
  topic: string | null;
  deterministicOutcome: 'correct' | 'incorrect' | 'unscored';
  supportQuality: PP10EvidenceCandidate['supportQuality'];
  recoveryClassification: PracticeRecoveryAnalysis['classification'];
  transferIndependent: boolean;
}

export interface PP10DownstreamOwners {
  recordLearnerMemory: (
    identity: { schoolId: string; studentId: string; verifiedSchool: boolean },
    facts: PP10AdmittedLearningFacts,
  ) => Promise<unknown> | unknown;
  scheduleRevisionReview: (
    identity: { schoolId: string; studentId: string; verifiedSchool: boolean },
    facts: PP10AdmittedLearningFacts,
  ) => Promise<unknown> | unknown;
  recommendGrowth: (
    identity: { schoolId: string; studentId: string; verifiedSchool: boolean },
    facts: PP10AdmittedLearningFacts,
  ) => Promise<unknown> | unknown;
}

function pp10TutorIdentityOf(identity: { schoolId: string; studentId: string }): ResolvedTutorIdentity {
  return { schoolId: identity.schoolId, studentId: identity.studentId } as unknown as ResolvedTutorIdentity;
}

/**
 * Stable PP-10 evidence marker carried in exactly one learner-memory
 * evidence summary. Crash/duplicate retries locate this marker through
 * the EXISTING canonical memory scope owner and return success WITHOUT
 * appending again. No new memory table; no raw work/ink in the marker.
 */
export function pp10MemoryEvidenceMarker(committedEvidenceId: string): string {
  return `pp10-evidence:${committedEvidenceId}`;
}

/**
 * Default learner-memory owner: the EXISTING learnerMemoryService.
 * Factual outcome/skill/support wording only — no suspicion, no
 * cheating labels, no misconception labels, no raw work.
 *
 * Crash-idempotent: the SAME committedEvidenceId always resolves to the
 * same marker evidence. A retry after a crash between the memory effect
 * and the receipt success marker finds the marker and succeeds without
 * a second append/create.
 */
export async function pp10RecordLearnerMemoryDefault(
  identity: { schoolId: string; studentId: string; verifiedSchool: boolean },
  facts: PP10AdmittedLearningFacts,
): Promise<unknown> {
  const skillPart = facts.skillId ? ` for skill ${facts.skillId}` : '';
  const outcomeText = facts.deterministicOutcome;
  const kind =
    facts.deterministicOutcome === 'correct'
      ? 'strength'
      : facts.deterministicOutcome === 'incorrect'
        ? 'recent_mistake'
        : 'practice_pattern';
  const tutor = pp10TutorIdentityOf(identity);
  const marker = pp10MemoryEvidenceMarker(facts.committedEvidenceId);
  const markerSummary =
    `Check ${facts.checkId}: ${outcomeText}. Canonical evidence ${facts.committedEvidenceId}. Marker ${marker}.`.slice(0, 1200);
  // Idempotency gate: an existing memory in the canonical scope that
  // already carries this evidence marker means the durable effect
  // already happened (e.g. crash before the receipt marker).
  try {
    const scoped = await learnerMemoryService.listLearnerMemory(tutor, {
      kind: kind as never,
      subject: facts.subject,
      topic: facts.topic,
      limit: 10,
    });
    for (const mem of scoped ?? []) {
      if (Array.isArray(mem.evidence) && mem.evidence.some((e) => typeof e?.summary === 'string' && e.summary.includes(marker))) {
        return mem;
      }
    }
    const target = (scoped ?? [])[0] ?? null;
    if (target) {
      return learnerMemoryService.appendEvidenceToLearnerMemory(tutor, target.memoryId, [
        {
          evidenceId: `evd_pp10_${facts.committedEvidenceId}`.slice(0, 80),
          eventId: null,
          source: 'practice_attempt',
          summary: markerSummary,
          observedAt: new Date().toISOString(),
          subject: facts.subject,
          topic: facts.topic,
          skillIds: facts.skillId ? [facts.skillId] : [],
          artifactId: null,
          artifactBlockId: null,
          confidence: facts.deterministicOutcome === 'correct' ? 0.6 : 0.4,
          safeQuote: null,
        } as never,
      ]);
    }
  } catch {
    // Scope lookup is best-effort idempotency only; fall through to the
    // canonical create path rather than failing the projection.
  }
  return learnerMemoryService.createLearnerMemory(tutor, {
    kind,
    visibility: 'system_only',
    subject: facts.subject,
    topic: facts.topic,
    skillIds: facts.skillId ? [facts.skillId] : [],
    label: `Practice evidence: ${outcomeText}${skillPart}`.slice(0, 160),
    summary: (
      `Deterministic practice check ${facts.checkId} confirmed ${outcomeText}${skillPart}. ` +
      `Support quality ${facts.supportQuality}; recovery ${facts.recoveryClassification}; ` +
      `independent transfer ${facts.transferIndependent ? 'proven' : 'not proven'}.`
    ).slice(0, 1200),
    tutorUse: `Prior practice outcome${skillPart}: ${outcomeText}; support ${facts.supportQuality}.`.slice(0, 800),
    evidence: [
      {
        source: 'practice_attempt',
        summary: markerSummary,
        subject: facts.subject,
        topic: facts.topic,
        skillIds: facts.skillId ? [facts.skillId] : [],
        confidence: facts.deterministicOutcome === 'correct' ? 0.6 : 0.4,
      },
    ],
    confidence: facts.transferIndependent ? 'high' : facts.deterministicOutcome === 'correct' ? 'medium' : 'low',
  });
}

/**
 * Stable PP-10 revision key: one committed evidence + one skill always
 * resolves to one durable review identity across crash retries.
 */
export function pp10RevisionIdempotencyKey(committedEvidenceId: string, skillId: string | null): string {
  return `pp10:${committedEvidenceId}:${skillId ?? 'noskill'}`;
}

/**
 * Default revision/spaced-review owner: the EXISTING
 * spacedReviewService. Receives a sanitized attempt built from admitted
 * facts only (outcome + skill + subject/topic) — never the raw
 * document, ink, or integrity signals. Crash-safe: stable idempotency
 * key (deterministic review identity, no duplicate review) with
 * requireDurable=true (a swallowed DB write can never read SUCCEEDED).
 */
export async function pp10ScheduleRevisionReviewDefault(
  identity: { schoolId: string; studentId: string; verifiedSchool: boolean },
  facts: PP10AdmittedLearningFacts,
): Promise<unknown> {
  const sanitizedAttempt = {
    attemptId: facts.attemptId,
    schoolId: facts.schoolId,
    studentId: facts.studentId,
    sessionId: null,
    kind: 'practice_pad',
    status: 'evaluated',
    outcome: facts.deterministicOutcome === 'correct' ? 'correct' : facts.deterministicOutcome === 'incorrect' ? 'incorrect' : 'not_evaluated',
    subject: facts.subject,
    topic: facts.topic,
    skillIds: facts.skillId ? [facts.skillId] : [],
    promptSummary: `Practice Pad check ${facts.checkId}`,
    learnerAnswerSummary: null,
    expectedAnswerSummary: null,
    feedbackSummary: null,
    artifactId: null,
    artifactBlockId: null,
    sourceQuestionId: null,
    problemId: null,
    problemVersion: null,
    hintsRequested: 0,
    attemptNumber: 1,
    timeSpentSeconds: null,
    confidence: facts.deterministicOutcome === 'correct' ? 0.6 : 0.4,
    misconceptionSignals: [],
    evidence: [],
    createdAt: new Date().toISOString(),
    evaluatedAt: new Date().toISOString(),
  };
  return spacedReviewService.scheduleReviewFromAttempt(
    pp10TutorIdentityOf(identity),
    sanitizedAttempt as Parameters<typeof spacedReviewService.scheduleReviewFromAttempt>[1],
    null,
    {
      idempotencyKey: pp10RevisionIdempotencyKey(facts.committedEvidenceId, facts.skillId),
      requireDurable: true,
    },
  );
}

/**
 * Default Growth/recommendation owner: the EXISTING
 * nextPracticeService. Read-only recommendation over admitted facts.
 */
export async function pp10RecommendGrowthDefault(
  identity: { schoolId: string; studentId: string; verifiedSchool: boolean },
  facts: PP10AdmittedLearningFacts,
): Promise<unknown> {
  return nextPracticeService.recommendNextPractice(pp10TutorIdentityOf(identity), {
    sessionId: null,
    subject: facts.subject,
    topic: facts.topic,
    skillIds: facts.skillId ? [facts.skillId] : [],
    artifactIds: [],
    maxRecommendations: 3,
  });
}

// ─────────────────────────────────────────────────────────────
// PP-10 blocker repair: real production transfer context derived
// from backend state (PP-07 / PracticeAttempt / PracticeProblem
// provenance). Proven ONLY when canonical state shows: a different
// problem with the same governed skill, solved deterministically
// (CONFIRMED_CORRECT head check, admission-grade confidence), with
// support on the transfer attempt read from durable history.
// Absent proof → null → transferIndependent=false. Never throws:
// derivation failure is absent proof, never an integration failure.
// ─────────────────────────────────────────────────────────────

export interface PP10ProductionTransferContext {
  originalProblemId: string;
  transferProblemId: string | null;
  sameGovernedSkill: boolean;
  transferSolvedDeterministically: boolean;
  supportDeliveredOnTransfer: boolean;
}

export async function resolvePP10ProductionTransferContext(args: {
  identity: { schoolId: string; studentId: string; verifiedSchool: boolean };
  attemptId: string;
  originalProblemId: string | null;
  skillId: string | null;
  attemptOwner: {
    listPracticeAttempts?: (
      identity: { schoolId: string; studentId: string; verifiedSchool: boolean },
      options?: { skillId?: string; limit?: number },
    ) => Promise<
      Array<{ attemptId: string; problemId?: string | null; skillIds?: string[]; status?: string }>
    >;
  };
  checkStore: Pick<typeof practicePadCheckStore, 'listByAttempt'>;
}): Promise<PP10ProductionTransferContext | null> {
  try {
    const originalProblemId = (args.originalProblemId || '').trim();
    const skillId = (args.skillId || '').trim();
    if (!originalProblemId || !skillId) return null;
    if (typeof args.attemptOwner.listPracticeAttempts !== 'function') return null;
    const attempts = await args.attemptOwner.listPracticeAttempts(args.identity, { skillId, limit: 25 });
    const candidates = (attempts ?? []).filter(
      (a) =>
        a &&
        a.attemptId !== args.attemptId &&
        (a.problemId || '').trim() &&
        (a.problemId || '').trim() !== originalProblemId &&
        Array.isArray(a.skillIds) &&
        a.skillIds.includes(skillId),
    );
    for (const cand of candidates) {
      let recs: Awaited<ReturnType<typeof args.checkStore.listByAttempt>>;
      try {
        recs = await args.checkStore.listByAttempt(cand.attemptId);
      } catch {
        continue;
      }
      const checks = (recs ?? [])
        .filter((r) => r.schoolId === args.identity.schoolId && r.studentId === args.identity.studentId)
        .map(parseCheckResult);
      if (checks.length === 0) continue;
      const ordered = [...checks].sort((a, b) =>
        a.basedOnVersion !== b.basedOnVersion ? a.basedOnVersion - b.basedOnVersion : a.createdAt < b.createdAt ? -1 : 1,
      );
      const headVersion = Math.max(...ordered.map((c) => c.basedOnVersion));
      const head = ordered.filter((c) => c.basedOnVersion === headVersion).pop() ?? null;
      if (!head || head.status !== 'CONFIRMED_CORRECT') continue;
      if (typeof head.confidence === 'number' && head.confidence < 0.8) continue;
      // Support delivered BEFORE the deterministic solve. The solving
      // head check itself is excluded: deriveTrustedSupportHistory
      // resets on a confirmed recovery, so including it would wipe the
      // very support delivered before it (same law as the kernel).
      const support = deriveTrustedSupportHistory(
        ordered.filter((c) => c.checkId !== head.checkId && c.basedOnVersion <= headVersion),
      );
      return {
        originalProblemId,
        transferProblemId: (cand.problemId || '').trim(),
        sameGovernedSkill: true,
        transferSolvedDeterministically: true,
        supportDeliveredOnTransfer: support.length > 0,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/** Default bindings are the real canonical owners (test seams only override). */
export function __resolvePP10CanonicalBindings(overrides: PP10CanonicalOverrides = {}): {
  checkStore: Pick<typeof practicePadCheckStore, 'findByCheckId' | 'listByAttempt'>;
  attemptOwner: Pick<typeof practiceAttemptService, 'getPracticeAttempt'>;
  problemAuthority: Pick<typeof practicePadProblemAuthority, 'resolveForAttemptAsync'>;
  documentStore: Pick<typeof practicePadDocumentStore, 'getDocument' | 'getRevision'>;
  interpretationStore: Pick<typeof practicePadInterpretationStore, 'getInterpretation'>;
  integrityEvaluator: typeof evaluatePracticeIntegrity;
  evidenceOwner: typeof commitPracticeLearningEvidence;
  memoryOwner: PP10DownstreamOwners['recordLearnerMemory'];
  revisionOwner: PP10DownstreamOwners['scheduleRevisionReview'];
  growthOwner: PP10DownstreamOwners['recommendGrowth'];
  receiptStore: Pick<
    typeof practicePadProjectionReceiptStore,
    'ensureReceipt' | 'getReceipt' | 'markProjectionState' | 'claimReceipt' | 'releaseClaim'
  >;
} {
  const evidenceOwner =
    (overrides.evidenceOwner as { commitPracticeLearningEvidence?: typeof commitPracticeLearningEvidence } | undefined)
      ?.commitPracticeLearningEvidence ??
    (overrides.evidenceOwner as { commit?: typeof commitPracticeLearningEvidence } | undefined)?.commit ??
    commitPracticeLearningEvidence;
  return {
    checkStore: overrides.checkStore ?? practicePadCheckStore,
    attemptOwner: overrides.attemptOwner ?? practiceAttemptService,
    problemAuthority: overrides.problemAuthority ?? practicePadProblemAuthority,
    documentStore: overrides.documentStore ?? practicePadDocumentStore,
    interpretationStore: overrides.interpretationStore ?? practicePadInterpretationStore,
    integrityEvaluator: overrides.integrityEvaluator ?? evaluatePracticeIntegrity,
    evidenceOwner,
    memoryOwner: overrides.downstreamOwners?.recordLearnerMemory ?? pp10RecordLearnerMemoryDefault,
    revisionOwner: overrides.downstreamOwners?.scheduleRevisionReview ?? pp10ScheduleRevisionReviewDefault,
    growthOwner: overrides.downstreamOwners?.recommendGrowth ?? pp10RecommendGrowthDefault,
    receiptStore: overrides.receiptStore ?? practicePadProjectionReceiptStore,
  };
}

function pp10TextLengthOfSnapshot(snapshot: { blocks?: Array<{ kind?: string; content?: string | null }> }): number {
  let n = 0;
  for (const b of snapshot?.blocks ?? []) {
    // TEXT/EQUATION lengths only. DRAWING/IMAGE ink is never measured
    // here beyond its absence: raw vector ink never leaves document
    // ownership and is never copied into evidence.
    if (b && (b.kind === 'TEXT' || b.kind === 'EQUATION') && typeof b.content === 'string') n += b.content.length;
  }
  return n;
}

/**
 * PP-10 → PP-12 safe projection candidate. Allowlist of scalar,
 * already-admitted PP-10 facts ONLY. Never: raw PracticeDocument, raw
 * handwriting/ink, hidden answers, tab destination, integrity
 * accusation, chain of thought. The kernel candidate already carries
 * rawWorkIncluded/rawInkIncluded=false; this allowlist is the second
 * lock so even a future kernel field cannot leak into the receipt.
 */
export function buildPP10SafeProjectionCandidate(candidate: PP10EvidenceCandidate): Record<string, unknown> {
  return {
    attemptId: candidate.attemptId,
    problemId: candidate.problemId,
    problemVersion: candidate.problemVersion,
    documentVersion: candidate.documentVersion,
    checkId: candidate.checkId,
    skillId: candidate.skillId,
    curriculumRefs: candidate.curriculumRefs,
    deterministicOutcome: candidate.deterministicOutcome,
    firstDivergenceStepIndex: candidate.firstDivergenceStepIndex,
    firstDivergenceReasonCode: candidate.firstDivergenceReasonCode,
    confirmedPrefixCount: candidate.confirmedPrefixCount,
    supportQuality: candidate.supportQuality,
    recoveryClassification: candidate.recoveryClassification,
    transferIndependent: candidate.transferIndependent,
    transferReason: candidate.transferReason,
    ledgerEventType: candidate.ledgerEventType,
    masterySignal: candidate.masterySignal,
    interpretationId: candidate.interpretationId,
    interpretationSourceHash: candidate.interpretationSourceHash,
    representationClass: candidate.representationClass,
    integrityEvidenceId: candidate.integrityEvidenceId,
    integrityConcern: candidate.integrityConcern,
    integrityNextAction: candidate.integrityNextAction,
    evidenceQualityNote: candidate.evidenceQualityNote,
    createdAt: candidate.createdAt,
  };
}

/**
 * ONE production Practice Pad learning-integration entry point.
 * Small public input; canonical owners bound internally; PP-09 really
 * evaluated; canonical evidence owner really invoked; durable owner
 * controls replay; no duplicate mastery; integrity hold survives the
 * canonical commit; zero model calls.
 *
 * Production law (PP-10 → PP-12):
 *   canonical evidence commit
 *   → durable PracticePadProjectionReceipt
 *   → memory (durable memory=SUCCEEDED)
 *   → revision (durable revision=SUCCEEDED)
 *   → Growth (durable growth=SUCCEEDED)
 * Projection execution runs through executeClaimedProjectionReceipt —
 * the SAME claimed single-receipt executor the bounded batch reconciler uses.
 * Mastery is never invoked here: commitPracticeLearningEvidence already
 * owns the one canonical mastery consequence.
 */
export async function integratePracticePadLearningCanonical(
  input: PP10CanonicalInput,
  overrides: PP10CanonicalOverrides = {},
): Promise<PP10IntegrateResult> {
  const B = __resolvePP10CanonicalBindings(overrides);
  const identity = input.identity;
  const tutorIdentity = { schoolId: identity.schoolId, studentId: identity.studentId } as unknown as ResolvedTutorIdentity;
  const clock = overrides.clock;

  // Canonical loaders bound to real owners (never client values).
  let cachedAttempt: {
    problemId: string | null;
    problemVersion: number | null;
    skillId: string | null;
    subject: string | null;
    topic: string | null;
  } | null = null;
  const loadAttemptOnce = async () => {
    if (cachedAttempt) return cachedAttempt;
    const raw = await B.attemptOwner.getPracticeAttempt(tutorIdentity, input.attemptId);
    if (!raw) return null;
    cachedAttempt = {
      problemId: (raw.problemId ?? (raw as { sourceQuestionId?: string | null }).sourceQuestionId ?? null) as string | null,
      problemVersion: (raw.problemVersion ?? null) as number | null,
      skillId: (Array.isArray((raw as { skillIds?: string[] }).skillIds) ? (raw as { skillIds?: string[] }).skillIds![0] : null) ?? null,
      subject: ((raw as { subject?: string | null }).subject ?? null) as string | null,
      topic: ((raw as { topic?: string | null }).topic ?? null) as string | null,
    };
    return cachedAttempt;
  };

  const loadCheck: PP10IntegrateDeps['loadCheck'] = async (checkId) => {
    let rec: Awaited<ReturnType<typeof B.checkStore.findByCheckId>> = null;
    try {
      rec = await B.checkStore.findByCheckId(input.attemptId, checkId);
    } catch {
      return { check: null, isCurrent: false };
    }
    if (!rec || rec.schoolId !== identity.schoolId || rec.studentId !== identity.studentId) {
      return { check: null, isCurrent: false };
    }
    const check = parseCheckResult(rec);
    return { check, isCurrent: check.currentFeedbackEligible !== false };
  };

  const loadAttempt: PP10IntegrateDeps['loadAttempt'] = async (attemptId) => {
    let raw: Awaited<ReturnType<typeof B.attemptOwner.getPracticeAttempt>>;
    try {
      raw = await B.attemptOwner.getPracticeAttempt(tutorIdentity, attemptId);
    } catch {
      return null;
    }
    if (!raw) return null;
    await loadAttemptOnce();
    return {
      attemptId: raw.attemptId,
      schoolId: raw.schoolId,
      studentId: raw.studentId,
      problemId: cachedAttempt?.problemId ?? null,
      problemVersion: cachedAttempt?.problemVersion ?? null,
    };
  };

  const loadProblem: PP10IntegrateDeps['loadProblem'] = async (problemId) => {
    const att = await loadAttemptOnce().catch(() => null);
    try {
      const res = await B.problemAuthority.resolveForAttemptAsync({
        schoolId: identity.schoolId,
        problemId: problemId ?? att?.problemId ?? null,
        problemVersion: att?.problemVersion ?? null,
        attemptSourceQuestionId: att?.problemId ?? null,
        attemptSubject: att?.subject ?? null,
        attemptTopic: att?.topic ?? null,
      });
      if (!res) return null;
      // Durable authority resolves only READY problems exactly; the
      // explicit test double / derived minimal problem never confers
      // readiness in production (the double is never installed there).
      const ready = res.durable === true ? true : res.hasAuthoritativeAnswer === true;
      const skillId = att?.skillId ?? null;
      return {
        problemId: res.problem.problemId,
        problemVersion: res.problemVersion ?? att?.problemVersion ?? null,
        status: ready ? 'READY' : 'NOT_READY',
        skillId,
        curriculumRefs: skillId ? { skillId } : {},
      };
    } catch {
      return null;
    }
  };

  // Fail closed: document/revision truth that cannot be read is a
  // protected outage, never an empty stand-in. A missing document, an
  // unreadable document, or zero readable revisions while the document
  // claims versions exist all throw PP10DocumentStoreUnavailable.
  const loadRevisions: PP10IntegrateDeps['loadRevisions'] = async (attemptId) => {
    let doc: Awaited<ReturnType<typeof B.documentStore.getDocument>>;
    try {
      doc = await B.documentStore.getDocument(tutorIdentity, attemptId);
    } catch (err) {
      throw new PP10DocumentStoreUnavailable(
        `Practice document store unavailable (${(err as Error).message}); zero protected learning mutation.`,
      );
    }
    if (!doc) {
      throw new PP10DocumentStoreUnavailable('Practice document unavailable; zero protected learning mutation.');
    }
    const out: PP10CanonicalRevision[] = [];
    let unreadable = 0;
    for (let v = 1; v <= doc.currentVersion; v += 1) {
      let rev: Awaited<ReturnType<typeof B.documentStore.getRevision>> = null;
      try {
        rev = await B.documentStore.getRevision(tutorIdentity, attemptId, v);
      } catch {
        unreadable += 1;
        continue;
      }
      if (!rev) {
        unreadable += 1;
        continue;
      }
      out.push({ version: rev.version, workText: `text:${pp10TextLengthOfSnapshot(rev.snapshot as never)}`, contentHash: rev.contentHash ?? null });
    }
    if (out.length === 0 && doc.currentVersion >= 1) {
      throw new PP10DocumentStoreUnavailable(
        `No readable revision (${unreadable} unreadable of ${doc.currentVersion}); zero protected learning mutation.`,
      );
    }
    return out;
  };

  // Fail closed: check history that cannot be read is a protected
  // outage. Unavailable history is NEVER treated as "no support /
  // independent" — it throws PP10CheckHistoryUnavailable.
  const loadCheckHistory: PP10IntegrateDeps['loadCheckHistory'] = async (attemptId) => {
    try {
      const recs = await B.checkStore.listByAttempt(attemptId);
      return recs
        .filter((r) => r.schoolId === identity.schoolId && r.studentId === identity.studentId)
        .map(parseCheckResult);
    } catch (err) {
      throw new PP10CheckHistoryUnavailable(
        `Check-history store unavailable (${(err as Error).message}); history is never treated as no support.`,
      );
    }
  };

  // ── PP-09 pre-pass with backend-derived readers (mirrors the kernel
  // derivation so the REAL integrity engine sees real facts; the kernel
  // remains authoritative for the admitted candidate). Fail-closed
  // repair: canonical-truth outages (document/revision, check history)
  // return a protected failure with zero mutation; PP-09
  // unavailability returns INTEGRITY_EVIDENCE_UNAVAILABLE with the
  // already-saved mathematical check preserved and zero downstream
  // protected learning mutation. Concern is never fabricated.
  let integrityEvidence: PP10IntegrateDeps['integrityEvidence'] = null;
  let integrityUnavailable = false;
  let prePassStoreOutage: PP10DocumentStoreUnavailable | PP10CheckHistoryUnavailable | null = null;
  let resolvedTransfer: PP10ProductionTransferContext | null = null;

  // Transfer context: the explicit test seam wins when installed;
  // otherwise production derives from backend state (PracticeAttempt +
  // PracticePadCheck + governed skill + deterministic outcome + durable
  // support history). Absent proof → null → transferIndependent=false.
  const resolvePP10TransferForCanonical = async (): Promise<PP10ProductionTransferContext | null> => {
    if (overrides.loadTransferContext) {
      try {
        return (await overrides.loadTransferContext()) ?? null;
      } catch {
        return null;
      }
    }
    const att = await loadAttemptOnce().catch(() => null);
    return resolvePP10ProductionTransferContext({
      identity,
      attemptId: input.attemptId,
      originalProblemId: att?.problemId ?? null,
      skillId: att?.skillId ?? null,
      attemptOwner: B.attemptOwner as {
        listPracticeAttempts?: (
          identity: { schoolId: string; studentId: string; verifiedSchool: boolean },
          options?: { skillId?: string; limit?: number },
        ) => Promise<Array<{ attemptId: string; problemId?: string | null; skillIds?: string[]; status?: string }>>;
      },
      checkStore: B.checkStore,
    });
  };
  try {
    const loaded = await loadCheck(input.checkId);
    const check = loaded?.check ?? null;
    if (check) {
      const revisions = await loadRevisions(input.attemptId);
      const history = await loadCheckHistory(input.attemptId);
      const orderedHistory = [...history].sort((a, b) =>
        a.basedOnVersion !== b.basedOnVersion ? a.basedOnVersion - b.basedOnVersion : a.createdAt < b.createdAt ? -1 : 1,
      );
      const headVersion = revisions.length > 0 ? Math.max(...revisions.map((r) => r.version)) : check.basedOnVersion;
      const prior = [...orderedHistory].filter((h) => h.basedOnVersion < check.basedOnVersion).pop() ?? null;
      let recovery: PracticeRecoveryAnalysis | null = null;
      if (prior) {
        const priorHistory = orderedHistory.filter((h) => h.checkId !== check.checkId && h.basedOnVersion <= check.basedOnVersion);
        const trusted = deriveTrustedSupportHistory(priorHistory);
        const supportReceived = trusted.filter((p) => p.basedOnVersion >= prior.basedOnVersion && p.basedOnVersion <= check.basedOnVersion);
        recovery = classifyPracticeRecovery({
          priorCheckId: prior.checkId,
          currentCheckId: check.checkId,
          priorVersion: prior.basedOnVersion,
          currentVersion: check.basedOnVersion,
          priorStatus: prior.status,
          currentStatus: check.status,
          priorDivergence: prior.firstDivergence ? { stepIndex: prior.firstDivergence.stepIndex, reasonCode: prior.firstDivergence.reasonCode ?? null } : null,
          currentDivergence: check.firstDivergence ? { stepIndex: check.firstDivergence.stepIndex, reasonCode: check.firstDivergence.reasonCode ?? null } : null,
          supportReceived,
          supportHistoryAvailable: true,
        });
      }
      // Transfer context: explicit test seam wins when installed;
      // production derives from backend state. Absent proof keeps
      // transferIndependent=false (never strengthens mastery).
      let transferIndependent = false;
      {
        resolvedTransfer = await resolvePP10TransferForCanonical();
        if (resolvedTransfer && resolvedTransfer.transferProblemId) {
          transferIndependent = evaluateTransferSuccess({
            originalProblemId: resolvedTransfer.originalProblemId,
            transferProblemId: resolvedTransfer.transferProblemId,
            sameGovernedSkill: resolvedTransfer.sameGovernedSkill,
            transferSolvedDeterministically: resolvedTransfer.transferSolvedDeterministically,
            supportDeliveredOnTransfer: resolvedTransfer.supportDeliveredOnTransfer,
          }).independent;
        }
      }
      const readers = resolvePracticeIntegrityReadersFromCanonical({
        revisions,
        currentVersion: headVersion,
        checkHistory: orderedHistory,
        currentCheck: check,
        recovery,
        transferIndependent,
      });
      // PP-09 fail-closed: the evaluator throwing or reporting failure
      // means integrity evidence is UNAVAILABLE (never NONE/LOW, never
      // fabricated). The saved mathematical check is preserved; the
      // canonical entry returns INTEGRITY_EVIDENCE_UNAVAILABLE below
      // with zero downstream protected learning mutation.
      try {
        const evaluated = await B.integrityEvaluator(
          identity,
          { attemptId: input.attemptId, idempotencyKey: input.idempotencyKey },
          {
            ...(overrides.integrityStore ? { store: overrides.integrityStore } : {}),
            readers,
            ...(clock ? { clock } : {}),
          },
        );
        if (evaluated.ok && evaluated.evidence) {
          integrityEvidence = {
            integrityEvidenceId: evaluated.evidence.integrityEvidenceId,
            concernLevel: evaluated.evidence.concernLevel,
            signals: [...evaluated.evidence.signals],
            recommendedNextEvidenceAction: evaluated.evidence.recommendedNextEvidenceAction,
          };
        } else if (!evaluated.ok) {
          integrityUnavailable = true;
        } else {
          integrityEvidence = null;
        }
      } catch {
        integrityUnavailable = true;
      }
    }
  } catch (err) {
    if (err instanceof PP10DocumentStoreUnavailable || err instanceof PP10CheckHistoryUnavailable) {
      prePassStoreOutage = err;
    } else {
      integrityUnavailable = true;
    }
  }

  if (prePassStoreOutage) {
    return {
      ok: false,
      code: 'EVIDENCE_NOT_ADMISSIBLE',
      message: `${prePassStoreOutage.message} Zero evidence/mastery/memory/revision/Growth mutation.`,
      order: [],
    };
  }
  if (integrityUnavailable) {
    return {
      ok: false,
      code: 'INTEGRITY_EVIDENCE_UNAVAILABLE',
      message:
        'Practice integrity evidence is unavailable; the already-saved mathematical check is preserved ' +
        'and zero downstream protected learning mutation is performed. No concern is fabricated.',
      order: [],
    };
  }

  // ── Canonical evidence committer (the REAL owner). Stable logical
  // identity; MODERATE+correct without independent transfer defers
  // mastery while preserving correct math; CONFIRMED interpretation
  // provenance only; never raw work/ink.
  let canonicalDeduplicated = false;
  let enrichedInterpretation: { interpretationSourceHash: string | null; representationClass: string | null } = {
    interpretationSourceHash: null,
    representationClass: null,
  };
  const evidenceCommitter: PP10IntegrateDeps['evidenceCommitter'] = async (candidate) => {
    const deferMastery =
      candidate.integrityConcern === 'MODERATE' && candidate.deterministicOutcome === 'correct' && !candidate.transferIndependent;
    if (candidate.interpretationId) {
      try {
        const rec = await B.interpretationStore.getInterpretation(tutorIdentity, candidate.interpretationId);
        if (rec && rec.status === 'CONFIRMED' && rec.attemptId === input.attemptId) {
          enrichedInterpretation = { interpretationSourceHash: rec.sourceContentHash, representationClass: rec.representationClass as string };
        }
      } catch {
        enrichedInterpretation = { interpretationSourceHash: null, representationClass: null };
      }
    }
    const trustedOutcome =
      candidate.deterministicOutcome === 'correct' ? ('correct' as const) : candidate.deterministicOutcome === 'incorrect' ? ('incorrect' as const) : null;
    const hintsUsed =
      candidate.supportQuality === 'INDEPENDENT' || candidate.supportQuality === 'SELF_CORRECTED'
        ? 0
        : candidate.supportQuality === 'HEAVILY_SUPPORTED'
          ? 3
          : 1;
    let committed: Awaited<ReturnType<typeof commitPracticeLearningEvidence>>;
    try {
      committed = await B.evidenceOwner({
        schoolId: identity.schoolId,
        learnerId: identity.studentId,
        attemptId: candidate.attemptId,
        clientRequestId: pp10StableClientRequestId(candidate.attemptId, candidate.checkId),
        subject: null,
        topic: null,
        curriculumObjectiveId: candidate.curriculumRefs.objectiveId ?? null,
        curriculumSkillId: candidate.curriculumRefs.skillId ?? candidate.skillId ?? null,
        curriculumTopicId: candidate.curriculumRefs.topicId ?? null,
        hintsUsed,
        trustedOutcome,
        deferMastery: deferMastery ? true : undefined,
        practicePadProvenance: {
          checkId: candidate.checkId,
          problemId: candidate.problemId,
          problemVersion: candidate.problemVersion,
          documentVersion: candidate.documentVersion,
          firstDivergenceStepIndex: candidate.firstDivergenceStepIndex,
          firstDivergenceReasonCode: candidate.firstDivergenceReasonCode,
          supportQuality: candidate.supportQuality,
          recoveryClassification: candidate.recoveryClassification,
          transferIndependent: candidate.transferIndependent,
          transferReason: candidate.transferReason,
          interpretationId: candidate.interpretationId,
          interpretationSourceHash: enrichedInterpretation.interpretationSourceHash,
          representationClass: enrichedInterpretation.representationClass,
          integrityEvidenceId: candidate.integrityEvidenceId,
          integrityConcern: candidate.integrityConcern,
          integrityNextAction: candidate.integrityNextAction,
        },
      });
    } catch (err) {
      return { ok: false as const, code: 'EVIDENCE_COMMIT_FAILED', message: `Canonical evidence owner threw: ${(err as Error).message}` };
    }
    if (!committed.committedEvidenceId) {
      return { ok: false as const, code: 'EVIDENCE_COMMIT_FAILED', message: 'Canonical evidence owner returned no committed evidence.' };
    }
    canonicalDeduplicated = committed.deduplicated === true;
    return { ok: true as const, committedEvidenceId: committed.committedEvidenceId };
  };

  const kernelResult = await integratePracticePadLearning({
    identity,
    attemptId: input.attemptId,
    checkId: input.checkId,
    idempotencyKey: input.idempotencyKey,
    loadCheck,
    loadAttempt,
    loadProblem,
    loadRevisions,
    loadCheckHistory,
    loadTransferContext: async () => {
      if (resolvedTransfer) return resolvedTransfer;
      const att = await loadAttemptOnce().catch(() => null);
      return {
        originalProblemId: att?.problemId ?? '',
        transferProblemId: null,
        sameGovernedSkill: false,
        transferSolvedDeterministically: false,
        supportDeliveredOnTransfer: false,
      };
    },
    integrityEvidence,
    evidenceCommitter,
    // No projectors: the canonical evidence owner already applies the
    // one canonical mastery consequence. No seenEvidenceKeys: the
    // durable canonical receipt is the only replay authority.
    ...(clock ? { clock } : {}),
  });

  if (!kernelResult.ok) return kernelResult;
  // Confirmed PP-08 provenance survives on the admitted candidate.
  kernelResult.candidate.interpretationSourceHash = enrichedInterpretation.interpretationSourceHash;
  kernelResult.candidate.representationClass = enrichedInterpretation.representationClass;
  if (canonicalDeduplicated) kernelResult.deduplicated = true;

  // ── PP-12 durable projection receipt (production law). Canonical
  // evidence is committed at this point; NOTHING downstream runs before
  // one receipt is durably established. Deduplicated evidence replay
  // binds/reuses the SAME receipt and retries pending projections —
  // SUCCEEDED projections are never repeated (the shared executor owns
  // that law; no JS Set/Map authority; the receipt is the authority).
  const receiptStore = B.receiptStore;
  const safeCandidateJson = JSON.stringify(buildPP10SafeProjectionCandidate(kernelResult.candidate));
  let receiptKey: string;
  try {
    const receipt = await receiptStore.ensureReceipt({
      schoolId: identity.schoolId,
      studentId: identity.studentId,
      attemptId: kernelResult.candidate.attemptId,
      idempotencyKey: input.idempotencyKey,
      committedEvidenceId: kernelResult.committedEvidenceId,
      candidateJson: safeCandidateJson,
    });
    receiptKey = receipt.receiptKey;
  } catch (err) {
    // Receipt persistence failed: no optional projector runs; canonical
    // evidence remains authoritative; failure is observable.
    return {
      ok: false,
      code: 'DOWNSTREAM_PROJECTION_FAILED',
      message: `Projection receipt persistence failed (${(err as Error)?.message}); canonical evidence ${kernelResult.committedEvidenceId} remains authoritative.`,
      order: kernelResult.order,
    };
  }

  // ── Real downstream owners (existing canonical owners only), after
  // the successful canonical evidence commit AND the durable receipt.
  // Deduplicated replay never repeats a SUCCEEDED projection; pending
  // projections are retried through the same shared executor the batch
  // reconciler uses. Evidence commit failure never reaches this point
  // (the kernel returned early). A downstream failure keeps the
  // committed evidence authoritative and returns
  // DOWNSTREAM_PROJECTION_FAILED with no fake rollback.
  // Mastery is never invoked here: commitPracticeLearningEvidence
  // already owns the one canonical mastery consequence.
  const factsAttempt = await loadAttemptOnce().catch(() => null);
  const facts: PP10AdmittedLearningFacts = {
    committedEvidenceId: kernelResult.committedEvidenceId,
    attemptId: kernelResult.candidate.attemptId,
    schoolId: identity.schoolId,
    studentId: identity.studentId,
    checkId: kernelResult.candidate.checkId,
    documentVersion: kernelResult.candidate.documentVersion,
    skillId: kernelResult.candidate.skillId,
    subject: factsAttempt?.subject ?? null,
    topic: factsAttempt?.topic ?? null,
    deterministicOutcome: kernelResult.candidate.deterministicOutcome,
    supportQuality: kernelResult.candidate.supportQuality,
    recoveryClassification: kernelResult.candidate.recoveryClassification,
    transferIndependent: kernelResult.candidate.transferIndependent,
  };
  // Held evidence (MODERATE concern without independent transfer)
  // still commits the math truth but defers the strong memory
  // projection to transfer; revision/Growth receive the admitted
  // contextual evidence. The deferred memory stage resolves here as a
  // no-effect step (never a fabricated owner call).
  const heldForTransfer = kernelResult.evidenceHeldForTransfer === true;
  const execProjectors: PracticeProjectionProjectors = {
    memory: heldForTransfer
      ? async () => undefined
      : async () => {
          await B.memoryOwner(identity, facts);
        },
    revision: async () => {
      await B.revisionOwner(identity, facts);
    },
    growth: async () => {
      await B.growthOwner(identity, facts);
    },
  };
  try {
    // Fresh read: a replay whose receipt already completed (or a faster
    // concurrent run) must observe current durable truth, not a stale copy.
    // Claimed execution (the SAME shared path the batch reconciler uses):
    // acquire the PostgreSQL receipt claim under a bounded worker identity
    // derived from server-owned request identity (never client data), run
    // only incomplete projections, mark states conditional on the active
    // claim, then release. A claim loser executes ZERO projectors and
    // returns the truthful durable state — never a fake failure.
    const workerId = `pp10:${kernelResult.candidate.attemptId}:${kernelResult.candidate.checkId}`;
    const claimed = await executeClaimedProjectionReceipt({
      store: receiptStore,
      receiptKey,
      workerId,
      leaseMs: 60_000,
      nowMs: Date.now(),
      projectors: execProjectors,
    });
    if (claimed.claim === 'LOST') {
      // Another worker owns execution. Canonical evidence is committed
      // and authoritative; projections resume/complete under the owner
      // (retry or batch reconciliation). No projector ran here.
      kernelResult.deduplicated = true;
      return kernelResult;
    }
    if (claimed.outcome === 'MISSING') {
      return {
        ok: false,
        code: 'DOWNSTREAM_PROJECTION_FAILED',
        message: `Projection receipt missing after ensure; canonical evidence ${kernelResult.committedEvidenceId} remains authoritative.`,
        order: kernelResult.order,
      };
    }
    if (claimed.outcome !== 'COMPLETED') {
      return {
        ok: false,
        code: 'DOWNSTREAM_PROJECTION_FAILED',
        message: `Downstream projection ${claimed.outcome}; committed evidence ${kernelResult.committedEvidenceId} remains authoritative.`,
        order: kernelResult.order,
      };
    }
  } catch (err) {
    return {
      ok: false,
      code: 'DOWNSTREAM_PROJECTION_FAILED',
      message: `Downstream projection failed (${(err as Error)?.message}); committed evidence ${kernelResult.committedEvidenceId} remains authoritative.`,
      order: kernelResult.order,
    };
  }
  if (!heldForTransfer) {
    kernelResult.order.push('memory owner consequence');
  }
  kernelResult.order.push('revision owner consequence');
  kernelResult.order.push('Growth owner consequence');
  return kernelResult;
}
