// ─────────────────────────────────────────────────────────────
// Steadfast AI — Practice Pad P0: canonical check-step runtime
//
// Authoritative substrate for Practice Pad check-step:
//
//   verified learner → canonical PracticeProblem/source
//   → canonical PracticeAttempt (single owner: practiceAttemptService)
//   → versioned work → check request → deterministic attempt inspection
//   → truthful check result → evidence CANDIDATE → backend validation
//
// Laws enforced:
//   - Verified school identity required (auth alone insufficient).
//   - Attempt ownership enforced (cross-student / cross-school fails closed).
//   - Backend version protects against stale feedback.
//   - Idempotent checks (same key+fingerprint → same result, no duplicate
//     evidence/hint counts); same key + different payload → conflict.
//   - Regex/text cues are supplementary only, never correctness authority.
//   - Unsupported work degrades to NEEDS_SEMANTIC_ANALYSIS, never fake
//     certainty.
//   - Check != completion; feedback != understanding; no positive mastery
//     from unsupported checks. This runtime never mutates mastery, memory,
//     revision, or weak-skill state; it only PROPOSES an evidence candidate
//     for the backend evidence owner to validate.
// ─────────────────────────────────────────────────────────────

import { createHash, randomUUID } from 'crypto';
import type {
  PracticePadCheckRequest,
  PracticePadCheckResult,
  PracticePadCheckOutcome,
  PracticePadCheckStatus,
  PracticePadEvidenceCandidate,
  PracticePadFailureCategory,
  PracticePadTelemetry,
} from './practicePadCheckContracts';
import {
  checkDeterministically,
  heuristicSupplementarySignal,
  requestFingerprint,
} from './practicePadDeterministicChecker';
import { practicePadSemanticPort } from './practicePadSemanticPort';
import { practicePadWorkVersionStore } from './practicePadWorkVersionStore';
import { practicePadProblemAuthority } from './practicePadProblemAuthority';
import { PracticeProblemError } from './practiceProblemContracts';
import {
  practicePadCheckStore,
  practicePadCheckScopeHash,
  parseCheckResult,
} from './practicePadCheckStore';
import { practicePadDocumentStore } from './practicePadDocumentStore';
import {
  blockContentHash,
  normalizeWorkContent,
  snapshotContainsSelection,
  snapshotContentHash,
  snapshotFromWorkText,
  snapshotToWorkText,
  validateWorkSnapshot,
  type PracticeWorkBlock,
  type PracticeWorkSnapshot,
} from './practicePadDocumentContracts';
import { practicePadInterpretationStore } from './practicePadInterpretationStore';
import {
  isCheckableRepresentation,
  toLearnerSafeCandidate,
} from './practicePadInterpretationContracts';
import { practicePadInkInterpreterPort } from './practicePadInkInterpreterPort';
import { analyzeReasoningGraph } from './practicePadReasoningGraph';
import type { ReasoningReasonCode } from './practicePadReasoningGraph';
import { practiceAttemptService } from '../practiceAttemptService';
import type { ResolvedTutorIdentity } from '../tutorStateContracts';
import {
  proposePracticeIntervention,
  type InterventionValidationSecrets,
} from './practicePadInterventionFeedback';
import { canonicalSupportForLevel, countTrustedSupport } from './practicePadSupportProvenance';
import type { PracticePadDeliveredIntervention } from './practicePadCheckContracts';

export interface PracticePadVerifiedIdentity extends ResolvedTutorIdentity {
  verifiedSchool: boolean;
}

export interface PracticePadCheckDependencies {
  attemptOwner?: typeof practiceAttemptService;
  versions?: typeof practicePadWorkVersionStore;
  problems?: typeof practicePadProblemAuthority;
  checks?: typeof practicePadCheckStore;
  documents?: typeof practicePadDocumentStore;
  interpretations?: typeof practicePadInterpretationStore;
  clock?: () => string;
  checkId?: () => string;
}

function fail(
  status: PracticePadCheckStatus,
  failureCategory: PracticePadFailureCategory,
  message: string,
): PracticePadCheckOutcome {
  return { ok: false, status, failureCategory, message, currentFeedbackEligible: false };
}

/**
 * PP-07: build the exact PP-06 intervention delivered with a check.
 * The validated (possibly safe-fallback) proposal is what the learner
 * receives, so provenance always describes the delivered support —
 * never a rejected candidate. Mandatory PP-06 validation runs inside
 * proposePracticeIntervention; a blocked candidate degrades to the
 * safe deterministic fallback before anything is attached or stored.
 */
function buildDeliveredIntervention(args: {
  status: PracticePadCheckStatus;
  firstDivergenceStepIndex: number | null;
  firstDivergenceBlockId?: string | null;
  reasonCode: ReasoningReasonCode | null;
  confirmedCorrectStepCount: number;
  trustedSupportCount: number;
  secrets: InterventionValidationSecrets;
}): PracticePadDeliveredIntervention {
  const proposal = proposePracticeIntervention(
    {
      checkStatus: args.status,
      firstDivergenceStepIndex: args.firstDivergenceStepIndex,
      ...(args.firstDivergenceBlockId ? { firstDivergenceBlockId: args.firstDivergenceBlockId } : {}),
      reasonCode: args.reasonCode,
      confirmedCorrectStepCount: args.confirmedCorrectStepCount,
      trustedSupportCount: args.trustedSupportCount,
    },
    args.secrets,
  );
  return {
    level: proposal.decision.level,
    canonicalSupportLevel: canonicalSupportForLevel(proposal.decision.level),
    move: proposal.decision.move,
    trigger: proposal.decision.trigger,
    ...(proposal.targetStepIndex !== undefined ? { targetStepIndex: proposal.targetStepIndex } : {}),
    ...(proposal.decision.targetBlockId ? { targetBlockId: proposal.decision.targetBlockId } : {}),
    feedbackText: proposal.feedbackText,
    nextLearnerAction: proposal.nextLearnerAction,
    origin: 'SYSTEM_PROPOSED',
  };
}

export function buildPracticePadTelemetry(args: {
  requestId: string;
  attemptId: string;
  checkId: string | null;
  basedOnVersion: number;
  checkerPath: PracticePadCheckResult['checkerPath'] | 'unknown';
  mode: PracticePadTelemetry['mode'];
  startedAtMs: number;
  failureCategory?: PracticePadFailureCategory;
}): PracticePadTelemetry {
  return {
    requestId: args.requestId,
    attemptId: args.attemptId,
    checkId: args.checkId,
    basedOnVersion: args.basedOnVersion,
    checkerPath: args.checkerPath,
    mode: args.mode,
    latencyMs: Math.max(0, Date.now() - args.startedAtMs),
    failureCategory: args.failureCategory,
  };
}

/**
 * Authorize a Practice Pad protected request. Authentication alone is
 * insufficient: a verified school/tenant context is required, and the
 * caller must own the referenced attempt.
 */
export function authorizePracticePadIdentity(args: {
  schoolId?: string | null;
  studentId?: string | null;
  verifiedSchool?: boolean;
}): { ok: true; identity: PracticePadVerifiedIdentity } | { ok: false; failureCategory: PracticePadFailureCategory; message: string } {
  const schoolId = (args.schoolId || '').trim();
  const studentId = (args.studentId || '').trim();
  if (!schoolId || !args.verifiedSchool) {
    return { ok: false, failureCategory: 'missing_school_identity', message: 'Verified school identity is required for Practice Pad protected context.' };
  }
  if (!studentId) {
    return { ok: false, failureCategory: 'wrong_learner', message: 'Verified learner identity is required.' };
  }
  return { ok: true, identity: { schoolId, studentId, verifiedSchool: true } };
}

export async function checkPracticePadStepCanonical(
  identity: PracticePadVerifiedIdentity,
  request: PracticePadCheckRequest,
  deps: PracticePadCheckDependencies = {},
): Promise<PracticePadCheckOutcome> {
  const attemptOwner = deps.attemptOwner ?? practiceAttemptService;
  const versions = deps.versions ?? practicePadWorkVersionStore;
  const problems = deps.problems ?? practicePadProblemAuthority;
  const checks = deps.checks ?? practicePadCheckStore;
  const documents = deps.documents ?? practicePadDocumentStore;
  const interpretations = deps.interpretations ?? practicePadInterpretationStore;
  const now = deps.clock ?? (() => new Date().toISOString());
  const newCheckId = deps.checkId ?? (() => `ppchk_${randomUUID()}`);

  // 1. Verified school authority (fail closed, no memory/evidence/mastery/AI).
  if (!identity.schoolId || !identity.studentId || !identity.verifiedSchool) {
    return fail('FAILED_CLOSED', 'missing_school_identity', 'Verified school identity is required.');
  }

  const attemptId = (request.attemptId || '').trim();
  const idempotencyKey = (request.idempotencyKey || '').trim();
  if (!attemptId) return fail('FAILED_CLOSED', 'attempt_not_found', 'attemptId is required.');
  if (!idempotencyKey) return fail('FAILED_CLOSED', 'invalid_request', 'idempotencyKey is required.');
  if (!Number.isInteger(request.basedOnVersion) || request.basedOnVersion < 1) {
    return fail('FAILED_CLOSED', 'invalid_request', 'basedOnVersion must be a positive integer.');
  }

  // 2. Authoritative attempt binding through the single canonical owner.
  // Cross-student / cross-school access fails closed (null = not found OR
  // not owned; callers must not distinguish to avoid an ownership oracle).
  let attempt: Awaited<ReturnType<typeof attemptOwner.getPracticeAttempt>>;
  try {
    attempt = await attemptOwner.getPracticeAttempt(
      { schoolId: identity.schoolId, studentId: identity.studentId },
      attemptId,
    );
  } catch {
    return fail('FAILED_CLOSED', 'database_unavailable', 'Attempt store unavailable; check cannot succeed.');
  }
  if (!attempt) {
    return fail('FAILED_CLOSED', 'attempt_not_found', 'Practice attempt not found for this learner and school.');
  }

  // 3. Problem/source authority. Client prompt/topic/work is context only.
  // PP-02: attempts carrying an exact (problemId, problemVersion) binding
  // resolve through the durable PracticeProblem authority itself; client
  // data can never override the binding. Unbound attempts keep accepted
  // PP-01 behavior. Invalid problems fail closed here and therefore never
  // create learner-negative evidence downstream.
  let resolution: Awaited<ReturnType<typeof problems.resolveForAttemptAsync>>;
  try {
    const attemptRecord = attempt as {
      sourceQuestionId?: string | null;
      problemId?: string | null;
      problemVersion?: number | null;
      promptSummary?: string | null;
      subject?: string | null;
      topic?: string | null;
    };
    resolution = await problems.resolveForAttemptAsync({
      schoolId: identity.schoolId,
      attemptSourceQuestionId: attemptRecord.sourceQuestionId ?? null,
      attemptPromptSummary: attemptRecord.promptSummary ?? null,
      attemptSubject: attemptRecord.subject ?? null,
      attemptTopic: attemptRecord.topic ?? null,
      problemId: attemptRecord.problemId ?? attemptRecord.sourceQuestionId ?? null,
      problemVersion: attemptRecord.problemVersion ?? null,
    });
  } catch (cause) {
    if (cause instanceof PracticeProblemError) {
      switch (cause.code) {
        case 'PROBLEM_PERSISTENCE_FAILED':
          return fail('FAILED_CLOSED', 'database_unavailable', `Authoritative problem store unavailable; check cannot succeed. ${cause.code}`);
        case 'PROBLEM_SCOPE_MISMATCH':
          return fail('FAILED_CLOSED', 'wrong_school', `Practice problem is not bound to this school. ${cause.code}`);
        case 'PROBLEM_NOT_FOUND':
        case 'PROBLEM_VERSION_NOT_FOUND':
          return fail('FAILED_CLOSED', 'problem_missing', `No authoritative problem is bound to this attempt. ${cause.code}`);
        case 'PROBLEM_REJECTED':
        case 'PROBLEM_NOT_READY':
        case 'PROBLEM_SOURCE_INVALID':
        case 'PROBLEM_EVALUATION_INVALID':
          return fail('FAILED_CLOSED', 'problem_missing', `No issuable authoritative problem is bound to this attempt. ${cause.code}`);
      }
    }
    return fail('FAILED_CLOSED', 'database_unavailable', 'Problem authority unavailable; check cannot succeed.');
  }
  if (!resolution) {
    return fail('FAILED_CLOSED', 'problem_missing', 'No authoritative problem is bound to this attempt.');
  }

  // 4. Backend version protection: stale work cannot become current feedback.
  // The version authority is durable (PP-01 §8); the frontend cannot override it.
  let currentVersion: number;
  try {
    currentVersion = await versions.getCurrentVersion(attemptId);
  } catch {
    return fail('FAILED_CLOSED', 'database_unavailable', 'Work version store unavailable; check cannot succeed.');
  }
  if (request.basedOnVersion < currentVersion) {
    const staleResult: PracticePadCheckResult = {
      checkId: newCheckId(),
      attemptId,
      basedOnVersion: request.basedOnVersion,
      status: 'STALE_VERSION',
      deterministicVerdict: 'unknown',
      confirmedCorrectSteps: [],
      suspectedIssue: `Learner work advanced to v${currentVersion}; this check of v${request.basedOnVersion} is retained historically and is not current feedback.`,
      confidence: 0,
      checkerPath: 'stale_version',
      evidenceCandidate: null,
      misconceptionCandidate: null,
      currentFeedbackEligible: false,
      deduplicated: false,
      createdAt: now(),
    };
    return { ok: true, result: staleResult };
  }
  if (request.basedOnVersion > currentVersion) {
    return fail('FAILED_CLOSED', 'stale_work_version', `basedOnVersion v${request.basedOnVersion} is ahead of backend work v${currentVersion}.`);
  }

  // 4b. PP-03 server-owned work authority. The deterministic checker
  // operates ONLY on a durable PracticeDocumentRevision. Request
  // workText is context, never truth (§10–§11):
  //   - stored revision matches the request → evaluate the stored work;
  //   - no stored revision for the current head (legacy clients) →
  //     persist the request through the canonical save path, then
  //     evaluate the new revision;
  //   - request differs from the stored revision for the current head →
  //     the request is a NEW submission: persist it as the next valid
  //     revision, then evaluate the new head. Stored history is never
  //     overwritten and foreign work is never silently evaluated.
  // Older versions never reach here (STALE above). Persistence failure
  // can never yield a successful check (§15 PERSISTENCE_FAILED).
  let serverWorkText: string;
  // PP-05: the authoritative PP-03 snapshot behind serverWorkText. The
  // reasoning analysis derives ONLY from this stored revision.
  let serverSnapshot: PracticeWorkSnapshot | null = null;
  let evaluatedVersion = request.basedOnVersion;
  const effectiveSelectedStep: string | null = request.selectedStep ?? null;
  const clarify = (suspectedIssue: string): PracticePadCheckOutcome => ({
    ok: true,
    result: {
      checkId: newCheckId(),
      attemptId,
      basedOnVersion: evaluatedVersion,
      status: 'NEEDS_CLARIFICATION',
      deterministicVerdict: 'unknown',
      confirmedCorrectSteps: [],
      suspectedIssue,
      confidence: 0,
      checkerPath: 'validation_failed',
      evidenceCandidate: null,
      misconceptionCandidate: null,
      // PP-07: clarification receives the L1 metacognitive request. The
      // NEEDS_CLARIFICATION policy branch ignores trusted history, so a
      // count of zero is exact here; this result is not durably
      // persisted and therefore never enters trusted support history.
      intervention: buildDeliveredIntervention({
        status: 'NEEDS_CLARIFICATION',
        firstDivergenceStepIndex: null,
        reasonCode: null,
        confirmedCorrectStepCount: 0,
        trustedSupportCount: 0,
        secrets: {
          expectedAnswer: resolution.problem.expectedAnswer ?? null,
          acceptableAnswerForms: resolution.problem.acceptableAnswerForms ?? [],
          evaluationPlan: resolution.problem.evaluationPlan ?? null,
        },
      }),
      currentFeedbackEligible: true,
      deduplicated: false,
      createdAt: now(),
    },
  });
  const persistSubmission = async (snapshot: ReturnType<typeof snapshotFromWorkText>): Promise<
    { ok: true; revision: { snapshot: Parameters<typeof snapshotToWorkText>[0]; version: number } } | { ok: false; outcome: PracticePadCheckOutcome }
  > => {
    const saved = await documents.savePracticeWork(
      {
        identity: { schoolId: identity.schoolId, studentId: identity.studentId },
        attemptId,
        expectedCurrentVersion: currentVersion,
        idempotencyKey: `check-autosave:${attemptId}:v${currentVersion}:${snapshotContentHash(snapshot)}`,
        snapshot,
      },
      { attemptOwner },
    );
    if (!saved.ok) {
      if (saved.code === 'VERSION_CONFLICT') {
        return { ok: false, outcome: fail('FAILED_CLOSED', 'stale_work_version', `Work advanced during this check: ${saved.message}`) };
      }
      if (saved.code === 'IDEMPOTENCY_CONFLICT') {
        return { ok: false, outcome: fail('CONFLICT', 'duplicate_conflict', saved.message) };
      }
      if (saved.code === 'INVALID_WORK_SNAPSHOT' || saved.code === 'WORK_TOO_LARGE') {
        return { ok: false, outcome: fail('FAILED_CLOSED', 'invalid_request', saved.message) };
      }
      return { ok: false, outcome: fail('FAILED_CLOSED', 'database_unavailable', `Practice work could not be durably saved; check cannot succeed. ${saved.code}`) };
    }
    return { ok: true, revision: saved.revision };
  };
  // PP-08 durability: every learner-visible canonical PP-08 outcome goes
  // through the SAME PracticeCheck persistence/idempotency owner. There
  // is no PracticeCheckV2 and no second idempotency layer — this helper
  // applies the exact scope/dedupe/conflict/persist semantics of the
  // ordinary path to PP-08 clarification/unsupported results, so PP-07
  // trusted support history stays truthful.
  const persistCanonicalPP08Check = async (args: {
    fingerprint: string;
    evaluatedVersion: number;
    status: PracticePadCheckResult['status'];
    evaluationMode: 'deterministic' | 'semantic' | 'degraded';
    evidenceEligible: boolean;
    build: (checkId: string) => PracticePadCheckResult;
  }): Promise<PracticePadCheckOutcome> => {
    const pp08ScopeHash = practicePadCheckScopeHash(attemptId, args.evaluatedVersion, idempotencyKey);
    let pp08Existing: Awaited<ReturnType<typeof checks.findByScope>>;
    try {
      pp08Existing = await checks.findByScope(pp08ScopeHash);
    } catch {
      return fail('FAILED_CLOSED', 'database_unavailable', 'Check store unavailable; check cannot succeed.');
    }
    if (pp08Existing) {
      if (pp08Existing.fingerprint === args.fingerprint) {
        const prior = parseCheckResult(pp08Existing);
        return { ok: true, result: { ...prior, deduplicated: true } };
      }
      return fail('CONFLICT', 'duplicate_conflict', 'Idempotency key was already used with a different payload.');
    }
    const checkId = newCheckId();
    const result = args.build(checkId);
    let pp08Claimed: boolean;
    try {
      pp08Claimed = await checks.insertRecord({
        scopeHash: pp08ScopeHash,
        checkId,
        schoolId: identity.schoolId,
        studentId: identity.studentId,
        attemptId,
        basedOnVersion: args.evaluatedVersion,
        idempotencyKey,
        fingerprint: args.fingerprint,
        status: args.status,
        evaluationMode: args.evaluationMode,
        evidenceEligible: args.evidenceEligible,
        resultJson: JSON.stringify(result),
        createdAt: result.createdAt,
        resolvedAt: result.createdAt,
      });
    } catch {
      return fail('FAILED_CLOSED', 'database_unavailable', 'Check persistence failed; no canonical success is returned.');
    }
    if (!pp08Claimed) {
      let winner: Awaited<ReturnType<typeof checks.findByScope>>;
      try {
        winner = await checks.findByScope(pp08ScopeHash);
      } catch {
        return fail('FAILED_CLOSED', 'database_unavailable', 'Check persistence failed; no canonical success is returned.');
      }
      if (winner) {
        if (winner.fingerprint === args.fingerprint) {
          const prior = parseCheckResult(winner);
          return { ok: true, result: { ...prior, deduplicated: true } };
        }
        return fail('CONFLICT', 'duplicate_conflict', 'Idempotency key was already used with a different payload.');
      }
      return fail('FAILED_CLOSED', 'database_unavailable', 'Check persistence failed; no canonical success is returned.');
    }
    return { ok: true, result };
  };
  // Authoritative PP-08 fingerprint: never only empty workText. Binds the
  // exact evaluated revision, source block hash, confirmed interpretation,
  // and selected scope so two different ink sources cannot collapse.
  const pp08Fingerprint = (args: {
    evaluatedVersion: number;
    sourceBlockId: string;
    sourceContentHash: string;
    interpretationId: string | null;
  }): string => {
    const base = requestFingerprint(serverWorkText, effectiveSelectedStep);
    return createHash('sha256')
      .update(
        `pp08|${base}|v${args.evaluatedVersion}|${args.sourceBlockId}|${args.sourceContentHash}|${args.interpretationId ?? 'none'}|${effectiveSelectedStep ?? ''}`,
      )
      .digest('hex');
  };
  try {
    const stored = await documents.getRevision(
      { schoolId: identity.schoolId, studentId: identity.studentId },
      attemptId,
      request.basedOnVersion,
    );
    if (stored) {
      const requestSnapshot = snapshotFromWorkText(request.workText);
      // PP-08: a stored non-text revision is never clobbered by a
      // text-only request projection (workText cannot express ink). The
      // stored revision stays authoritative and is evaluated as-is; new
      // learner submissions arrive through the canonical save path.
      // TEXT-only stored revisions keep accepted PP-03 behavior exactly.
      const storedHasNonText = stored.snapshot.blocks.some(
        (b) => b.kind === 'HANDWRITING' || b.kind === 'DRAWING' || b.kind === 'IMAGE' || b.kind === 'IMAGE_REF',
      );
      if (storedHasNonText && snapshotContentHash(requestSnapshot) !== stored.contentHash) {
        if (!snapshotContainsSelection(stored.snapshot, effectiveSelectedStep)) {
          return clarify('The selected step does not belong to the stored revision for this version.');
        }
        serverSnapshot = stored.snapshot;
        serverWorkText = snapshotToWorkText(stored.snapshot);
      } else if (snapshotContentHash(requestSnapshot) !== stored.contentHash) {
        const validation = validateWorkSnapshot(requestSnapshot);
        if (!validation.ok) {
          return fail('FAILED_CLOSED', 'invalid_request', `Learner work is not a valid snapshot: ${validation.message}`);
        }
        const persisted = await persistSubmission(validation.snapshot);
        if (!persisted.ok) return persisted.outcome;
        evaluatedVersion = persisted.revision.version;
        if (!snapshotContainsSelection(persisted.revision.snapshot, effectiveSelectedStep)) {
          return clarify('The selected step does not belong to the submitted work for this version.');
        }
        serverSnapshot = persisted.revision.snapshot;
        serverWorkText = snapshotToWorkText(persisted.revision.snapshot);
      } else {
        if (!snapshotContainsSelection(stored.snapshot, effectiveSelectedStep)) {
          return clarify('The selected step does not belong to the stored revision for this version.');
        }
        serverSnapshot = stored.snapshot;
        serverWorkText = snapshotToWorkText(stored.snapshot);
      }
    } else {
      const snapshot = snapshotFromWorkText(request.workText);
      const validation = validateWorkSnapshot(snapshot);
      if (!validation.ok) {
        return fail('FAILED_CLOSED', 'invalid_request', `Learner work is not a valid snapshot: ${validation.message}`);
      }
      if (!snapshotContainsSelection(snapshot, effectiveSelectedStep)) {
        return clarify('The selected step does not belong to the submitted work for this version.');
      }
      const persisted = await persistSubmission(validation.snapshot);
      if (!persisted.ok) return persisted.outcome;
      evaluatedVersion = persisted.revision.version;
      serverSnapshot = persisted.revision.snapshot;
      serverWorkText = snapshotToWorkText(persisted.revision.snapshot);
    }
  } catch {
    return fail('FAILED_CLOSED', 'database_unavailable', 'Practice work document unavailable; check cannot succeed.');
  }

  // 4c. PP-08 handwriting/drawing/image law. RAW WORK IS AUTHORITATIVE;
  // interpretation is derived and never guessed:
  //   A. TEXT/EQUATION-only work → existing PP-04/PP-05 path unchanged.
  //   B. requested step is an independent TEXT/EQUATION block → checked
  //      normally; uninterpreted ink elsewhere never poisons it.
  //   C. HANDWRITING/DRAWING/IMAGE_REF under check without a CONFIRMED
  //      interpretation → NEEDS_CLARIFICATION with interpretationRequired,
  //      zero evidence candidates, zero negative signal.
  //   D. CONFIRMED TEXT/EQUATION interpretation → derived representation
  //      feeds the existing PP-04/PP-05 path; raw work stays unchanged.
  //   E. CONFIRMED DIAGRAM the engine cannot reason about →
  //      NEEDS_SEMANTIC_ANALYSIS; never fabricated correct/incorrect.
  {
    const NON_TEXT = new Set(['HANDWRITING', 'DRAWING', 'IMAGE', 'IMAGE_REF']);
    const blocks = serverSnapshot?.blocks ?? [];
    const nonTextBlocks = blocks.filter((b) => NON_TEXT.has(b.kind));
    if (nonTextBlocks.length > 0) {
      const textBlocks = blocks.filter(
        (b) => (b.kind === 'TEXT' || b.kind === 'EQUATION') && String(b.content ?? '').trim(),
      );
      const sel = (effectiveSelectedStep ?? '').trim();
      const targeted: PracticeWorkBlock | null = sel
        ? blocks.find((b) => b.blockId === sel) ?? null
        : null;
      const independentTextCheck = (() => {
        if (targeted) return targeted.kind === 'TEXT' || targeted.kind === 'EQUATION';
        if (!sel) return false;
        const needle = normalizeWorkContent(sel).toLowerCase();
        if (!needle) return false;
        const hay = textBlocks.map((b) => normalizeWorkContent(String(b.content ?? ''))).join('\n').toLowerCase();
        return hay.includes(needle);
      })();
      if (!independentTextCheck) {
        const dependent: PracticeWorkBlock[] = targeted && NON_TEXT.has(targeted.kind) ? [targeted] : nonTextBlocks;
        // Provider-neutral seam: always unavailable in PP-08 (zero live calls).
        for (const b of dependent) {
          await practicePadInkInterpreterPort.interpretPracticeWork({ block: b });
        }
        let usable: { block: PracticeWorkBlock; normalizedValue: string; representationClass: 'TEXT' | 'EQUATION' } | null = null;
        let unsupportedConfirmed: { block: PracticeWorkBlock; interpretationId: string } | null = null;
        let pendingBlock: PracticeWorkBlock | null = null;
        for (const b of dependent) {
          let confirmed: Awaited<ReturnType<typeof interpretations.findConfirmedForSource>>;
          try {
            confirmed = await interpretations.findConfirmedForSource(
              { schoolId: identity.schoolId, studentId: identity.studentId },
              attemptId,
              evaluatedVersion,
              b.blockId,
              blockContentHash(b),
            );
          } catch {
            return fail('FAILED_CLOSED', 'database_unavailable', 'Interpretation store unavailable; check cannot succeed.');
          }
          if (!confirmed) {
            if (!pendingBlock) pendingBlock = b;
            continue;
          }
          const cand = confirmed.candidates.find((c) => c.candidateId === confirmed.confirmedCandidateId) ?? null;
          if (cand && isCheckableRepresentation(cand.representationClass)) {
            usable = { block: b, normalizedValue: cand.normalizedValue, representationClass: cand.representationClass };
            break;
          }
          if (cand) {
            unsupportedConfirmed = { block: b, interpretationId: confirmed.interpretationId };
            break;
          }
          if (!pendingBlock) pendingBlock = b;
        }
        if (unsupportedConfirmed) {
          const unsupportedBlockHash = blockContentHash(unsupportedConfirmed.block);
          const unsupportedFingerprint = pp08Fingerprint({
            evaluatedVersion,
            sourceBlockId: unsupportedConfirmed.block.blockId,
            sourceContentHash: unsupportedBlockHash,
            interpretationId: unsupportedConfirmed.interpretationId,
          });
          const unsupportedSecrets: InterventionValidationSecrets = {
            expectedAnswer: resolution.problem.expectedAnswer ?? null,
            acceptableAnswerForms: resolution.problem.acceptableAnswerForms ?? [],
            evaluationPlan: resolution.problem.evaluationPlan ?? null,
          };
          return persistCanonicalPP08Check({
            fingerprint: unsupportedFingerprint,
            evaluatedVersion,
            status: 'NEEDS_SEMANTIC_ANALYSIS',
            evaluationMode: 'degraded',
            evidenceEligible: false,
            build: (checkId) => ({
              checkId,
              attemptId,
              basedOnVersion: evaluatedVersion,
              status: 'NEEDS_SEMANTIC_ANALYSIS',
              deterministicVerdict: 'unknown',
              confirmedCorrectSteps: [],
              suspectedIssue: 'This diagram cannot be checked by the current deterministic engine; a confirmed interpretation is not mathematically decidable here.',
              confidence: 0,
              checkerPath: 'deterministic_unsupported',
              evidenceCandidate: null,
              misconceptionCandidate: null,
              intervention: buildDeliveredIntervention({
                status: 'NEEDS_SEMANTIC_ANALYSIS',
                firstDivergenceStepIndex: null,
                reasonCode: null,
                confirmedCorrectStepCount: 0,
                trustedSupportCount: 0,
                secrets: unsupportedSecrets,
              }),
              currentFeedbackEligible: true,
              deduplicated: false,
              createdAt: now(),
              interpretationRequired: false,
              interpretation: {
                interpretationId: unsupportedConfirmed.interpretationId,
                sourceBlockId: unsupportedConfirmed.block.blockId,
                status: 'CONFIRMED',
                candidates: [],
              },
            }),
          });
        }
        if (usable) {
          // Derived checkable representation from the CONFIRMED
          // interpretation. The stored raw revision is untouched — only the
          // local evaluation view is substituted.
          serverWorkText = usable.normalizedValue;
          serverSnapshot = {
            blocks: [
              {
                blockId: usable.block.blockId,
                kind: usable.representationClass,
                content: usable.normalizedValue,
                ref: null,
                order: 0,
              },
            ],
          };
        } else {
          const target = pendingBlock ?? dependent[0];
          let latest: Awaited<ReturnType<typeof interpretations.findLatestForSource>> = null;
          try {
            latest = await interpretations.findLatestForSource(
              { schoolId: identity.schoolId, studentId: identity.studentId },
              attemptId,
              evaluatedVersion,
              target.blockId,
              blockContentHash(target),
            );
          } catch {
            return fail('FAILED_CLOSED', 'database_unavailable', 'Interpretation store unavailable; check cannot succeed.');
          }
          const requiredSecrets: InterventionValidationSecrets = {
            expectedAnswer: resolution.problem.expectedAnswer ?? null,
            acceptableAnswerForms: resolution.problem.acceptableAnswerForms ?? [],
            evaluationPlan: resolution.problem.evaluationPlan ?? null,
          };
          const requiredFingerprint = pp08Fingerprint({
            evaluatedVersion,
            sourceBlockId: target.blockId,
            sourceContentHash: blockContentHash(target),
            interpretationId: latest ? latest.interpretationId : null,
          });
          return persistCanonicalPP08Check({
            fingerprint: requiredFingerprint,
            evaluatedVersion,
            status: 'NEEDS_CLARIFICATION',
            evaluationMode: 'degraded',
            evidenceEligible: false,
            build: (checkId) => ({
              checkId,
              attemptId,
              basedOnVersion: evaluatedVersion,
              status: 'NEEDS_CLARIFICATION',
              deterministicVerdict: 'unknown',
              confirmedCorrectSteps: [],
              suspectedIssue:
                'This handwritten, drawn or image work needs a confirmed interpretation before it can be checked. Confirm what was written first.',
              confidence: 0,
              checkerPath: 'validation_failed',
              evidenceCandidate: null,
              misconceptionCandidate: null,
              intervention: buildDeliveredIntervention({
                status: 'NEEDS_CLARIFICATION',
                firstDivergenceStepIndex: null,
                reasonCode: null,
                confirmedCorrectStepCount: 0,
                trustedSupportCount: 0,
                secrets: requiredSecrets,
              }),
              currentFeedbackEligible: true,
              deduplicated: false,
              createdAt: now(),
              interpretationRequired: true,
              interpretation: {
                interpretationId: latest ? latest.interpretationId : null,
                sourceBlockId: target.blockId,
                status: latest ? latest.status : 'UNINTERPRETED',
                candidates: latest ? latest.candidates.map(toLearnerSafeCandidate) : [],
              },
            }),
          });
        }
      }
    }
  }

  // 5. Durable idempotency (PP-01 §9–§10): same key + same fingerprint →
  // same logical check with no duplicate side effects; same key + different
  // payload → explicit conflict. The fingerprint is computed over the
  // SERVER-OWNED work resolved in 4b, never over raw request projection.
  // The PracticeCheck table owns the scope;
  // there is no process-local authoritative map.
  const fingerprint = requestFingerprint(serverWorkText, effectiveSelectedStep);
  const scopeHash = practicePadCheckScopeHash(attemptId, request.basedOnVersion, idempotencyKey);
  let existingRecord: Awaited<ReturnType<typeof checks.findByScope>>;
  try {
    existingRecord = await checks.findByScope(scopeHash);
  } catch {
    return fail('FAILED_CLOSED', 'database_unavailable', 'Check store unavailable; check cannot succeed.');
  }
  if (existingRecord) {
    if (existingRecord.fingerprint === fingerprint) {
      const prior = parseCheckResult(existingRecord);
      return { ok: true, result: { ...prior, deduplicated: true } };
    }
    return fail('CONFLICT', 'duplicate_conflict', 'Idempotency key was already used with a different payload.');
  }

  // 6. Deterministic inspection first, over server-owned work (PP-03 §10).
  // PP-04: the bounded math engine owns the verdict for decidable
  // mathematics. Server-owned evaluation metadata selects the evaluator;
  // client data can never choose a weaker one. Heuristic cues stay
  // supplementary.
  const deterministic = checkDeterministically({
    workText: serverWorkText,
    selectedStep: effectiveSelectedStep,
    expectedAnswer: resolution.problem.expectedAnswer ?? null,
    evaluationType: (resolution.problem.evaluationType ?? null) as
      | 'deterministic_exact'
      | 'deterministic_numeric'
      | 'deterministic_algebraic'
      | 'semantic_deferred'
      | null,
    acceptableAnswerForms: resolution.problem.acceptableAnswerForms ?? [],
  });
  const supplementary = heuristicSupplementarySignal({
    workText: serverWorkText,
    selectedStep: effectiveSelectedStep,
  });

  // 7. Semantic seam: present but unavailable in P0 (zero live model calls).
  // PP-04 mapping: deterministic CORRECT → CONFIRMED_CORRECT, deterministic
  // INCORRECT → CONFIRMED_INCORRECT, UNSUPPORTED → NEEDS_SEMANTIC_ANALYSIS,
  // INVALID/ambiguous → NEEDS_CLARIFICATION.
  // PP-05 overlay: the derived reasoning graph (anchored only in the
  // server-owned problem prompt, stepped only from the authoritative
  // PP-03 revision) supplies firstDivergence and the confirmed prefix.
  // A wrong final answer alone never claims a causal step.
  const reasoning = analyzeReasoningGraph({
    attemptId,
    basedOnVersion: evaluatedVersion,
    snapshot: serverSnapshot ?? snapshotFromWorkText(serverWorkText),
    problemPrompt: resolution.problem.prompt,
  });
  const confirmedPrefixSteps = reasoning.steps
    .slice(0, reasoning.confirmedPrefixCount)
    .map((s) => s.raw.slice(0, 280));

  let status: PracticePadCheckStatus;
  let finalVerdict: PracticePadCheckResult['deterministicVerdict'] = deterministic.verdict;
  let finalCheckerPath: PracticePadCheckResult['checkerPath'] = deterministic.checkerPath;
  let finalConfidence = deterministic.confidence;
  let finalSuspectedIssue = deterministic.suspectedIssue;

  if (deterministic.verdict === 'correct') {
    status = 'CONFIRMED_CORRECT';
  } else if (deterministic.verdict === 'incorrect') {
    status = 'CONFIRMED_INCORRECT';
  } else if (reasoning.firstDivergence) {
    // Anchored deterministic proof of the exact causal break (every
    // earlier transition VALID, this one INVALID). No semantic call can
    // add information; the verdict is already proven.
    status = 'CONFIRMED_INCORRECT';
  } else if (reasoning.status === 'ALL_VALID' && resolution.hasAuthoritativeAnswer && reasoning.steps.length > 0) {
    // Multi-step work is undecidable as one blob; the final mathematical
    // state is checked against the server-owned expected answer instead.
    const lastStep = reasoning.steps[reasoning.steps.length - 1];
    const lastCheck = checkDeterministically({
      workText: lastStep.raw,
      selectedStep: null,
      expectedAnswer: resolution.problem.expectedAnswer ?? null,
      evaluationType: (resolution.problem.evaluationType ?? null) as
        | 'deterministic_exact'
        | 'deterministic_numeric'
        | 'deterministic_algebraic'
        | 'semantic_deferred'
        | null,
      acceptableAnswerForms: resolution.problem.acceptableAnswerForms ?? [],
    });
    if (lastCheck.verdict === 'correct') {
      status = 'CONFIRMED_CORRECT';
      finalVerdict = 'correct';
      finalCheckerPath = lastCheck.checkerPath;
      finalConfidence = lastCheck.confidence;
      finalSuspectedIssue = undefined;
    } else if (lastCheck.verdict === 'incorrect') {
      // Valid prefix but a wrong final state: incorrect, with NO
      // fabricated causal step (the break is not localizable).
      status = 'CONFIRMED_INCORRECT';
      finalVerdict = 'incorrect';
      finalCheckerPath = lastCheck.checkerPath;
      finalConfidence = lastCheck.confidence;
      finalSuspectedIssue = lastCheck.suspectedIssue;
    } else {
      await practicePadSemanticPort.analyzeSemantics({
        workText: serverWorkText,
        selectedStep: effectiveSelectedStep,
        heuristicHint: supplementary.hint,
      });
      status = 'NEEDS_SEMANTIC_ANALYSIS';
      finalSuspectedIssue = reasoning.unresolvedReason ?? deterministic.suspectedIssue;
      finalConfidence = Math.min(deterministic.confidence, 0.2);
    }
  } else {
    await practicePadSemanticPort.analyzeSemantics({
      workText: serverWorkText,
      selectedStep: effectiveSelectedStep,
      heuristicHint: supplementary.hint,
    });
    const blankWork = !serverWorkText.trim() && !(effectiveSelectedStep || '').trim();
    status =
      deterministic.checkerPath === 'validation_failed' ||
      deterministic.checkerPath === 'deterministic_invalid' ||
      reasoning.status === 'NEEDS_CLARIFICATION' ||
      blankWork
        ? 'NEEDS_CLARIFICATION'
        : 'NEEDS_SEMANTIC_ANALYSIS';
  }

  // PP-05 first-divergence law applied to the check result: a divergence
  // is reported ONLY from the anchored analysis (full valid prefix +
  // deterministically invalid step). It never leaks server answer
  // material: generic expectation, learner's own observed line.
  let firstDivergence: PracticePadCheckResult['firstDivergence'];
  if (reasoning.firstDivergence) {
    if (status === 'CONFIRMED_INCORRECT') {
      finalVerdict = 'incorrect';
      finalCheckerPath = reasoning.checkerPath;
      finalConfidence = reasoning.confidence;
      finalSuspectedIssue = `Step ${reasoning.firstDivergence.stepIndex + 1} does not preserve the mathematics of the previous step.`;
    }
    firstDivergence = {
      stepIndex: reasoning.firstDivergence.stepIndex,
      expectedSummary: 'The next line must preserve the mathematics of the previous line.',
      observedSummary: reasoning.firstDivergence.observedSummary,
      reasonCode: reasoning.firstDivergence.reasonCode,
    };
  }

  // 8. Evidence LAW: the checker proposes; the backend evidence owner
  // disposes. A candidate is proposed ONLY for deterministic confirmation
  // against a server-owned expected answer. It is never completion,
  // understanding, or mastery (eligibleForMastery is always false here).
  let evidenceCandidate: PracticePadEvidenceCandidate | null = null;
  if (
    (status === 'CONFIRMED_CORRECT' || status === 'CONFIRMED_INCORRECT') &&
    resolution.hasAuthoritativeAnswer &&
    finalConfidence >= 0.8
  ) {
    evidenceCandidate = {
      candidateId: `ppev_${newCheckId()}`,
      attemptId,
      basedOnVersion: `v${evaluatedVersion}`,
      outcome: status === 'CONFIRMED_CORRECT' ? 'correct' : 'incorrect',
      eligibleForMastery: false,
      reason: 'Deterministic confirmation against server-owned expected answer; backend evidence owner must validate before any learning-state use.',
    };
  }

  const checkId = newCheckId();

  // PP-07: wire the PP-06 intervention into the canonical result BEFORE
  // durable persistence. The trusted support count is derived from
  // durable backend provenance only — the client MUST NOT provide it
  // and raw learner text never converts into history. Escalation is
  // therefore one rung per trusted prior support (L1 first, then at
  // most L2, L3, …) and idempotent replay returns the same logical
  // intervention because it is stored inside the persisted result.
  let trustedSupportCount = 0;
  try {
    if (typeof checks.listByAttempt === 'function') {
      const historyRecords = await checks.listByAttempt(attemptId);
      const historyResults: PracticePadCheckResult[] = [];
      for (const record of historyRecords) {
        try {
          historyResults.push(parseCheckResult(record));
        } catch {
          // Unreadable rows never become trusted history.
        }
      }
      trustedSupportCount = countTrustedSupport(historyResults);
    }
  } catch {
    // §20: history unavailable → weakest help now; downstream recovery
    // classification must yield UNRESOLVED rather than assume zero.
    trustedSupportCount = 0;
  }

  const interventionSecrets: InterventionValidationSecrets = {
    expectedAnswer: resolution.problem.expectedAnswer ?? null,
    acceptableAnswerForms: resolution.problem.acceptableAnswerForms ?? [],
    evaluationPlan: resolution.problem.evaluationPlan ?? null,
  };

  const result: PracticePadCheckResult = {
    checkId,
    attemptId,
    basedOnVersion: evaluatedVersion,
    status,
    deterministicVerdict: finalVerdict,
    firstDivergence,
    // PP-05: only the deterministically confirmed reasoning prefix. A
    // wrong final answer alone never manufactures a causal step.
    confirmedCorrectSteps: confirmedPrefixSteps,
    suspectedIssue: finalSuspectedIssue,
    confidence: finalVerdict === 'unknown' ? Math.min(finalConfidence, 0.2) : finalConfidence,
    checkerPath: finalCheckerPath,
    evidenceCandidate,
    misconceptionCandidate:
      status === 'CONFIRMED_INCORRECT' && supplementary.hint
        ? { label: supplementary.hint, summary: `Low-confidence supplementary cue: ${supplementary.hint}. Requires semantic confirmation.`, confidence: 0.2 }
        : null,
    intervention: buildDeliveredIntervention({
      status,
      firstDivergenceStepIndex: reasoning.firstDivergence ? reasoning.firstDivergence.stepIndex : null,
      firstDivergenceBlockId:
        reasoning.firstDivergence && reasoning.steps[reasoning.firstDivergence.stepIndex]
          ? reasoning.steps[reasoning.firstDivergence.stepIndex].blockId
          : null,
      reasonCode: reasoning.firstDivergence ? reasoning.firstDivergence.reasonCode : null,
      confirmedCorrectStepCount: confirmedPrefixSteps.length,
      trustedSupportCount,
      secrets: interventionSecrets,
    }),
    currentFeedbackEligible: true,
    deduplicated: false,
    createdAt: now(),
  };

  // Durable claim of the idempotency scope. Loser of a concurrent race
  // re-reads the winner: same fingerprint → winner's result (deduplicated),
  // different fingerprint → explicit conflict. Persistence failure here can
  // never return fake canonical success (§15 PERSISTENCE_FAILED).
  const evaluationMode = status === 'CONFIRMED_CORRECT' || status === 'CONFIRMED_INCORRECT'
    ? 'deterministic'
    : 'degraded';
  let claimed: boolean;
  try {
    claimed = await checks.insertRecord({
      scopeHash,
      checkId,
      schoolId: identity.schoolId,
      studentId: identity.studentId,
      attemptId,
      basedOnVersion: evaluatedVersion,
      idempotencyKey,
      fingerprint,
      status,
      evaluationMode,
      evidenceEligible: evidenceCandidate !== null,
      resultJson: JSON.stringify(result),
      createdAt: result.createdAt,
      resolvedAt: result.createdAt,
    });
  } catch {
    return fail('FAILED_CLOSED', 'database_unavailable', 'Check persistence failed; no canonical success is returned.');
  }
  if (!claimed) {
    let winner: Awaited<ReturnType<typeof checks.findByScope>>;
    try {
      winner = await checks.findByScope(scopeHash);
    } catch {
      return fail('FAILED_CLOSED', 'database_unavailable', 'Check persistence failed; no canonical success is returned.');
    }
    if (winner) {
      if (winner.fingerprint === fingerprint) {
        const prior = parseCheckResult(winner);
        return { ok: true, result: { ...prior, deduplicated: true } };
      }
      return fail('CONFLICT', 'duplicate_conflict', 'Idempotency key was already used with a different payload.');
    }
    return fail('FAILED_CLOSED', 'database_unavailable', 'Check persistence failed; no canonical success is returned.');
  }

  return { ok: true, result };
}

export async function _clearPracticePadCheckRecordsForTest(): Promise<void> {
  await practicePadCheckStore.resetForTest();
}
