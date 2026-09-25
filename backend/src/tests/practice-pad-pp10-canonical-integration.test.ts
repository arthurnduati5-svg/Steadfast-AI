// PP-10 (A): canonical learning integration proofs. No DB, no models.
import { describe, it, expect, vi } from 'vitest';
import { createHash } from 'crypto';

vi.mock('../lib/prisma', () => ({
  default: {
    $queryRaw: vi.fn(),
    $executeRawUnsafe: vi.fn(),
    $queryRawUnsafe: vi.fn(),
    // Durability-seal stub: persistence succeeds in-mock so requireDurable
    // paths exercise the durable branch; in-memory maps stay authoritative
    // for assertions. Isolated-DB proof remains UNVERIFIED (no local PG).
    spacedReviewItem: {
      create: vi.fn(async () => ({})),
      findUnique: vi.fn(async () => null),
      findMany: vi.fn(async () => []),
    },
  },
}));

import {
  integratePracticePadLearning,
  PP10_LIVE_MODEL_CALLS,
  type PP10CanonicalProblem,
} from '../services/practicePadRuntime/practicePadLearningIntegrationService';
import type { PracticePadCheckResult } from '../services/practicePadRuntime/practicePadCheckContracts';

const ID = { schoolId: 's-pp10', studentId: 'l-pp10', verifiedSchool: true };

function check(over: Partial<PracticePadCheckResult> = {}): PracticePadCheckResult {
  return {
    checkId: 'chk-1',
    attemptId: 'att-1',
    basedOnVersion: 2,
    status: 'CONFIRMED_CORRECT',
    deterministicVerdict: 'correct',
    confirmedCorrectSteps: ['x = 1', 'x = 2'],
    confidence: 0.95,
    checkerPath: 'deterministic_exact',
    evidenceCandidate: null,
    misconceptionCandidate: null,
    currentFeedbackEligible: true,
    deduplicated: false,
    createdAt: '2026-09-23T00:00:00.000Z',
    ...over,
  };
}

const READY: PP10CanonicalProblem = { problemId: 'p-1', problemVersion: 3, status: 'READY', skillId: 'skill-add' };

function baseDeps(over: Record<string, unknown> = {}) {
  const order: string[] = [];
  const calls: string[] = [];
  const committer = vi.fn(async () => ({ ok: true as const, committedEvidenceId: 'ev-1' }));
  return {
    calls,
    committer,
    deps: {
      identity: ID,
      attemptId: 'att-1',
      checkId: 'chk-1',
      idempotencyKey: 'idem-pp10-a1',
      loadCheck: async () => ({ check: check(), isCurrent: true }),
      loadAttempt: async () => ({ attemptId: 'att-1', schoolId: 's-pp10', studentId: 'l-pp10', problemId: 'p-1', problemVersion: 3 }),
      loadProblem: async () => READY,
      loadRevisions: async () => [{ version: 1, workText: 'x=1' }, { version: 2, workText: 'x=1\nx=2 ok work trace long enough.........' }],
      loadCheckHistory: async () => [check({ checkId: 'chk-0', basedOnVersion: 1, status: 'CONFIRMED_CORRECT' })],
      evidenceCommitter: committer,
      projectors: {
        mastery: async () => { calls.push('mastery'); },
        memory: async () => { calls.push('memory'); },
        revision: async () => { calls.push('revision'); },
        growth: async () => { calls.push('growth'); },
      },
      seenEvidenceKeys: new Set<string>(),
      ...over,
    } as Parameters<typeof integratePracticePadLearning>[0],
  };
}

describe('PP-10 canonical learning integration', () => {
  it('independent correct check reaches canonical evidence owner; commit precedes downstream; zero model calls', async () => {
    const { deps, committer, calls } = baseDeps();
    const res = await integratePracticePadLearning(deps);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    // 1. reached canonical evidence owner
    expect(committer).toHaveBeenCalledTimes(1);
    // 3. commit before downstream
    expect(res.order.indexOf('canonical evidence commit')).toBeLessThan(res.order.indexOf('mastery consequence'));
    expect(calls).toEqual(['mastery', 'memory', 'revision', 'growth']);
    // 2. check alone did not directly mutate mastery (no mastery without commit path)
    expect(res.candidate.deterministicOutcome).toBe('correct');
    // 10. zero model calls
    expect(PP10_LIVE_MODEL_CALLS).toBe(0);
  });

  it('evidence commit failure blocks every downstream mutation', async () => {
    const { deps, calls } = baseDeps({
      idempotencyKey: 'idem-fail',
      evidenceCommitter: async () => ({ ok: false as const, code: 'EVIDENCE_STORE_DOWN', message: 'down' }),
    });
    const res = await integratePracticePadLearning(deps);
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.code).toBe('EVIDENCE_COMMIT_FAILED');
    expect(calls).toEqual([]);
  });

  it('duplicate replay yields idempotency conflict with no duplicate state', async () => {
    const seen = new Set<string>(['idem-replay']);
    const { deps, committer } = baseDeps({ idempotencyKey: 'idem-replay', seenEvidenceKeys: seen });
    const res = await integratePracticePadLearning(deps);
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.code).toBe('IDEMPOTENCY_CONFLICT');
    expect(committer).not.toHaveBeenCalled();
  });

  it('invalid problem blocks all negative learning mutation', async () => {
    const { deps, committer, calls } = baseDeps({
      idempotencyKey: 'idem-invalid',
      loadProblem: async () => ({ problemId: 'p-1', problemVersion: 3, status: 'AMBIGUOUS', skillId: 'skill-add' }),
    });
    const res = await integratePracticePadLearning(deps);
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.code).toBe('EVIDENCE_NOT_ADMISSIBLE');
    expect(committer).not.toHaveBeenCalled();
    expect(calls).toEqual([]);
  });

  it('unconfirmed handwriting interpretation yields zero mutation', async () => {
    const { deps, committer } = baseDeps({
      idempotencyKey: 'idem-ink',
      loadCheck: async () => ({
        check: check({ status: 'NEEDS_CLARIFICATION', deterministicVerdict: 'unknown', confidence: 0, interpretationRequired: true }),
        isCurrent: true,
      }),
    });
    const res = await integratePracticePadLearning(deps);
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.code).toBe('EVIDENCE_NOT_ADMISSIBLE');
    expect(committer).not.toHaveBeenCalled();
  });

  it('first-divergence is structural only and raw ink is never copied', async () => {
    const { deps } = baseDeps({
      idempotencyKey: 'idem-div',
      loadCheck: async () => ({
        check: check({
          status: 'CONFIRMED_INCORRECT',
          deterministicVerdict: 'incorrect',
          firstDivergence: { stepIndex: 1, expectedSummary: 'preserve math', observedSummary: '2x+3=14', reasonCode: 'NON_EQUIVALENT_REWRITE' },
        }),
        isCurrent: true,
      }),
      loadCheckHistory: async () => [],
    });
    const res = await integratePracticePadLearning(deps);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.candidate.firstDivergenceStepIndex).toBe(1);
    expect(res.candidate.firstDivergenceReasonCode).toBe('NON_EQUIVALENT_REWRITE');
    // no fabricated semantic misconception: candidate carries no label text
    expect(JSON.stringify(res.candidate)).not.toMatch(/does not understand/i);
    expect(res.candidate.rawWorkIncluded).toBe(false);
    expect(res.candidate.rawInkIncluded).toBe(false);
    expect(JSON.stringify(res.candidate)).not.toMatch(/stroke|ink|pathM/);
  });
});

// ── PP-10 production binding proofs (same files, no new package) ──

import {
  integratePracticePadLearningCanonical,
  pp10StableClientRequestId,
  __resolvePP10CanonicalBindings,
} from '../services/practicePadRuntime/practicePadLearningIntegrationService';
import {
  reconcilePracticePadLearningProjections,
  reconcilePracticePadLearningProjectionReceipt,
} from '../services/practicePadRuntime/practicePadProjectionReconciler';
import {
  practicePadProjectionReceiptStore,
  type PracticeProjectionReceipt,
} from '../services/practicePadRuntime/practicePadProjectionReceiptStore';
import { practicePadCheckStore } from '../services/practicePadRuntime/practicePadCheckStore';
import { practiceAttemptService } from '../services/practiceAttemptService';
import { practicePadProblemAuthority } from '../services/practicePadRuntime/practicePadProblemAuthority';
import { practicePadDocumentStore } from '../services/practicePadRuntime/practicePadDocumentStore';
import { practicePadInterpretationStore } from '../services/practicePadRuntime/practicePadInterpretationStore';
import { evaluatePracticeIntegrity } from '../services/practicePadRuntime/practicePadIntegrityEngine';
import { commitPracticeLearningEvidence } from '../services/practiceCanonicalLearningService';

const PROD_ID = { schoolId: 's-pp10', studentId: 'l-pp10', verifiedSchool: true };

function prodCheck(over: Partial<PracticePadCheckResult> = {}): PracticePadCheckResult {
  return {
    checkId: 'chk-1', attemptId: 'att-1', basedOnVersion: 2, status: 'CONFIRMED_CORRECT',
    deterministicVerdict: 'correct', confirmedCorrectSteps: ['x = 1', 'x = 2', 'x = 3'],
    confidence: 0.95, checkerPath: 'deterministic_exact', evidenceCandidate: null,
    misconceptionCandidate: null, currentFeedbackEligible: true, deduplicated: false,
    createdAt: '2026-09-23T00:00:00.000Z', ...over,
  };
}

function prodRecord(c: PracticePadCheckResult) {
  return {
    scopeHash: `scope-${c.checkId}`, checkId: c.checkId, schoolId: 's-pp10', studentId: 'l-pp10',
    attemptId: c.attemptId, basedOnVersion: c.basedOnVersion, idempotencyKey: `k-${c.checkId}`,
    fingerprint: `fp-${c.checkId}`, status: c.status, evaluationMode: 'deterministic' as const,
    evidenceEligible: true, resultJson: JSON.stringify(c),
    createdAt: '2026-09-23T00:00:00.000Z', resolvedAt: '2026-09-23T00:00:00.000Z',
  };
}

/** Durable fake canonical evidence owner: receipt keyed by clientRequestId. */
function fakeEvidenceOwner() {
  const receipts = new Map<string, { committedEvidenceId: string; masteryApplied: boolean }>();
  const inputs: Array<Parameters<typeof commitPracticeLearningEvidence>[0]> = [];
  let writes = 0;
  let masteryApplications = 0;
  return {
    inputs,
    receipts,
    get writes() { return writes; },
    get masteryApplications() { return masteryApplications; },
    commit: (async (input: Parameters<typeof commitPracticeLearningEvidence>[0]) => {
      inputs.push(input);
      const key = `practice_attempt:${input.schoolId}:${input.learnerId}:${input.clientRequestId}`;
      const existing = receipts.get(key);
      if (existing) {
        return { attemptId: input.attemptId, committedEvidenceId: existing.committedEvidenceId, evidenceCandidateId: null, masteryApplied: existing.masteryApplied, deduplicated: true };
      }
      writes += 1;
      const masteryApplied = input.deferMastery === true ? false : input.trustedOutcome === 'correct';
      if (masteryApplied) masteryApplications += 1;
      const committedEvidenceId = `ev-${writes}`;
      receipts.set(key, { committedEvidenceId, masteryApplied });
      return { attemptId: input.attemptId, committedEvidenceId, evidenceCandidateId: `cand-${writes}`, masteryApplied, deduplicated: false };
    }) as typeof commitPracticeLearningEvidence,
  };
}

function prodBindings(current: PracticePadCheckResult, history: PracticePadCheckResult[], extra: Record<string, unknown> = {}) {
  const evidence = fakeEvidenceOwner();
  const integrityCalls: Array<{ readers: Record<string, unknown> }> = [];
  const receiptStore = (extra.receiptStore as unknown) ?? createFakeReceiptStore();
  const revisions = [
    { revisionId: 'r1', version: 1, snapshot: { blocks: [{ blockId: 'b1', kind: 'TEXT', content: 'x=1 work trace' }] }, contentHash: 'h1' },
    { revisionId: 'r2', version: 2, snapshot: { blocks: [{ blockId: 'b1', kind: 'TEXT', content: 'x=1\nx=2 work trace long enough' }] }, contentHash: 'h2' },
  ];
  // Downstream-owner seam: production binds the real canonical owners;
  // tests record admitted-facts calls without touching a database.
  const downstreamCalls: Array<{ owner: string; facts: unknown }> = [];
  return {
    evidence,
    integrityCalls,
    downstreamCalls,
    receiptStore: receiptStore as ReturnType<typeof createFakeReceiptStore>,
    overrides: {
      checkStore: {
        findByCheckId: async (attemptId: string, checkId: string) =>
          checkId === current.checkId && attemptId === current.attemptId ? prodRecord(current) : null,
        listByAttempt: async () => history.map(prodRecord),
      },
      attemptOwner: {
        getPracticeAttempt: async () => ({
          attemptId: 'att-1', schoolId: 's-pp10', studentId: 'l-pp10',
          problemId: 'p-1', problemVersion: 3, skillIds: ['skill-add'],
          subject: null, topic: null,
        }),
      },
      problemAuthority: {
        resolveForAttemptAsync: async () => ({
          problem: { problemId: 'p-1' },
          learnerView: { problemId: 'p-1' },
          hasAuthoritativeAnswer: true, problemVersion: 3, durable: true,
        }),
      },
      documentStore: {
        getDocument: async () => ({ currentVersion: 2 }),
        getRevision: async (_id: unknown, _att: unknown, version: number) => revisions.find((r) => r.version === version) ?? null,
      },
      interpretationStore: { getInterpretation: async () => null },
      integrityEvaluator: (async (_id: unknown, _in: unknown, deps: { readers?: Record<string, unknown> }) => {
        integrityCalls.push({ readers: { ...(deps.readers ?? {}) } });
        return { ok: true as const, evidence: null };
      }) as unknown as typeof evaluatePracticeIntegrity,
      evidenceOwner: { commitPracticeLearningEvidence: evidence.commit },
      downstreamOwners: {
        recordLearnerMemory: async (_id: unknown, facts: unknown) => { downstreamCalls.push({ owner: 'memory', facts }); },
        scheduleRevisionReview: async (_id: unknown, facts: unknown) => { downstreamCalls.push({ owner: 'revision', facts }); },
        recommendGrowth: async (_id: unknown, facts: unknown) => { downstreamCalls.push({ owner: 'growth', facts }); },
      },
      receiptStore: receiptStore as never,
      ...extra,
    },
  };
}

/** In-memory PP-12 receipt double with production-equivalent semantics. */
function createFakeReceiptStore(shared?: Map<string, PracticeProjectionReceipt>) {
  // Shared-state injection models TWO independent store instances
  // (replicas) over one PostgreSQL truth: claim ownership is decided
  // by the shared row, never by instance identity.
  const rows = shared ?? new Map<string, PracticeProjectionReceipt>();
  const nowIso = () => new Date().toISOString();
  const keyFor = (attemptId: string, idempotencyKey: string) =>
    createHash('sha256').update(`${attemptId}::${idempotencyKey}`).digest('hex');
  return {
    rows,
    async ensureReceipt(input: {
      schoolId: string;
      studentId: string;
      attemptId: string;
      idempotencyKey: string;
      committedEvidenceId?: string | null;
      candidateJson?: string | null;
    }): Promise<PracticeProjectionReceipt> {
      const receiptKey = keyFor(input.attemptId, input.idempotencyKey);
      const existing = rows.get(receiptKey);
      if (!existing) {
        const row: PracticeProjectionReceipt = {
          receiptKey,
          schoolId: input.schoolId,
          studentId: input.studentId,
          attemptId: input.attemptId,
          idempotencyKey: input.idempotencyKey,
          committedEvidenceId: input.committedEvidenceId ?? null,
          candidateJson: input.candidateJson ?? '{}',
          memoryState: 'PENDING',
          revisionState: 'PENDING',
          growthState: 'PENDING',
          lastErrorJson: null,
          claimedBy: null,
          claimedAt: null,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        };
        rows.set(receiptKey, row);
        return { ...row };
      }
      if (input.committedEvidenceId && !existing.committedEvidenceId) {
        existing.committedEvidenceId = input.committedEvidenceId;
        if (input.candidateJson != null) existing.candidateJson = input.candidateJson;
        existing.updatedAt = nowIso();
      }
      return { ...existing };
    },
    async getReceipt(receiptKey: string): Promise<PracticeProjectionReceipt | null> {
      const row = rows.get(receiptKey);
      return row ? { ...row } : null;
    },
    async markProjectionState(
      receiptKey: string,
      projection: 'memory' | 'revision' | 'growth',
      state: 'PENDING' | 'SUCCEEDED' | 'FAILED',
      errorMessage?: string | null,
      expectedClaimedBy?: string | null,
    ): Promise<PracticeProjectionReceipt | null> {
      const row = rows.get(receiptKey);
      if (!row) return null;
      // Stale-lease guard mirrors the conditional SQL update: a worker
      // that lost its claim changes nothing and learns it via null.
      if (expectedClaimedBy != null && row.claimedBy !== expectedClaimedBy) return null;
      const column = projection === 'memory' ? 'memoryState' : projection === 'revision' ? 'revisionState' : 'growthState';
      row[column] = state;
      row.lastErrorJson = state === 'FAILED' ? JSON.stringify({ message: String(errorMessage || 'projection failed').slice(0, 500) }) : null;
      row.updatedAt = nowIso();
      return { ...row };
    },
    async findByCommittedEvidenceId(committedEvidenceId: string): Promise<PracticeProjectionReceipt | null> {
      for (const row of rows.values()) {
        if (row.committedEvidenceId === committedEvidenceId) return { ...row };
      }
      return null;
    },
    async claimReceipt(receiptKey: string, workerId: string, leaseMs?: number, nowMs?: number): Promise<boolean> {
      const row = rows.get(receiptKey);
      if (!row) return false;
      // Lease semantics mirror PostgreSQL: an unclaimed row, or a row
      // whose lease expired, is claimable; a live foreign claim loses.
      const lease = typeof leaseMs === 'number' && leaseMs > 0 ? leaseMs : 60_000;
      const now = typeof nowMs === 'number' ? nowMs : Date.now();
      if (row.claimedBy != null && row.claimedBy !== workerId) {
        const at = row.claimedAt ? Date.parse(row.claimedAt) : NaN;
        if (Number.isFinite(at) && now - at < lease) return false;
      }
      row.claimedBy = workerId;
      row.claimedAt = new Date(now).toISOString();
      row.updatedAt = nowIso();
      return true;
    },
    async releaseClaim(receiptKey: string, workerId: string): Promise<void> {
      const row = rows.get(receiptKey);
      if (row && row.claimedBy === workerId) row.claimedBy = null;
    },
    async listIncomplete(limit: number): Promise<PracticeProjectionReceipt[]> {
      const out: PracticeProjectionReceipt[] = [];
      for (const row of rows.values()) {
        if (
          row.committedEvidenceId &&
          (row.memoryState !== 'SUCCEEDED' || row.revisionState !== 'SUCCEEDED' || row.growthState !== 'SUCCEEDED')
        ) {
          out.push({ ...row });
        }
        if (out.length >= limit) break;
      }
      return out;
    },
  };
}

describe('PP-10 production binding', () => {
  it('production entry needs no injected loaders; defaults are the canonical owners', () => {
    expect(integratePracticePadLearningCanonical.length).toBe(1);
    const B = __resolvePP10CanonicalBindings();
    expect(B.checkStore).toBe(practicePadCheckStore);
    expect(B.attemptOwner).toBe(practiceAttemptService);
    expect(B.problemAuthority).toBe(practicePadProblemAuthority);
    expect(B.documentStore).toBe(practicePadDocumentStore);
    expect(B.interpretationStore).toBe(practicePadInterpretationStore);
    expect(B.integrityEvaluator).toBe(evaluatePracticeIntegrity);
    expect(B.evidenceOwner).toBe(commitPracticeLearningEvidence);
    expect(B.receiptStore).toBe(practicePadProjectionReceiptStore);
  });

  it('stable logical identity; identical replay uses canonical dedup with no duplicate downstream state', async () => {
    expect(pp10StableClientRequestId('att-1', 'chk-1')).toBe('pp10:att-1:chk-1');
    const current = prodCheck();
    const { evidence, overrides } = prodBindings(current, [prodCheck({ checkId: 'chk-0', basedOnVersion: 1 })]);
    const input = { identity: PROD_ID, attemptId: 'att-1', checkId: 'chk-1', idempotencyKey: 'idem-prod-1' };
    const first = await integratePracticePadLearningCanonical(input, overrides as never);
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.deduplicated).toBe(false);
    expect(evidence.inputs).toHaveLength(1);
    expect(evidence.inputs[0]!.clientRequestId).toBe('pp10:att-1:chk-1');
    // Identical logical replay: canonical owner deduplicates, no second write.
    const second = await integratePracticePadLearningCanonical(input, overrides as never);
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.deduplicated).toBe(true);
    expect(second.committedEvidenceId).toBe(first.committedEvidenceId);
    expect(evidence.writes).toBe(1);
    expect(evidence.masteryApplications).toBe(1);
  });

  it('production replay never consults a caller-owned Set (no IDEMPOTENCY_CONFLICT)', async () => {
    const current = prodCheck();
    const { overrides } = prodBindings(current, [prodCheck({ checkId: 'chk-0', basedOnVersion: 1 })]);
    const input = { identity: PROD_ID, attemptId: 'att-1', checkId: 'chk-1', idempotencyKey: 'idem-prod-noset' };
    const first = await integratePracticePadLearningCanonical(input, overrides as never);
    expect(first.ok).toBe(true);
    const second = await integratePracticePadLearningCanonical(input, overrides as never);
    // A caller Set would fail the replay with IDEMPOTENCY_CONFLICT; the
    // production path deduplicates through the durable canonical owner.
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect((second as { code?: string }).code).not.toBe('IDEMPOTENCY_CONFLICT');
    expect(second.deduplicated).toBe(true);
  });

  it('PP-09 is really evaluated with backend-derived readers', async () => {
    const current = prodCheck();
    const { integrityCalls, overrides } = prodBindings(current, [prodCheck({ checkId: 'chk-0', basedOnVersion: 1 })]);
    const res = await integratePracticePadLearningCanonical(
      { identity: PROD_ID, attemptId: 'att-1', checkId: 'chk-1', idempotencyKey: 'idem-prod-pp09' },
      overrides as never,
    );
    expect(res.ok).toBe(true);
    expect(integrityCalls).toHaveLength(1);
    const readers = integrityCalls[0]!.readers;
    expect(readers.revisionCount).toBe(2);
    expect(readers.reasoningSteps).toBe(3);
    expect(readers.workChars).toBeGreaterThan(0);
    expect(readers.attemptVersion).toBe(2);
  });

  it('canonical commit failure produces zero downstream mutation', async () => {
    const current = prodCheck();
    const { overrides } = prodBindings(current, [prodCheck({ checkId: 'chk-0', basedOnVersion: 1 })], {
      evidenceOwner: {
        commitPracticeLearningEvidence: (async () => {
          throw new Error('canonical store down');
        }) as unknown as typeof commitPracticeLearningEvidence,
      },
    });
    const res = await integratePracticePadLearningCanonical(
      { identity: PROD_ID, attemptId: 'att-1', checkId: 'chk-1', idempotencyKey: 'idem-prod-fail' },
      overrides as never,
    );
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.code).toBe('EVIDENCE_COMMIT_FAILED');
  });

  it('zero live model calls', () => {
    expect(PP10_LIVE_MODEL_CALLS).toBe(0);
  });
});

// ── PP-10 blocker repair proofs (A): fail-closed truth + real owners ──

import {
  pp10RecordLearnerMemoryDefault,
  pp10ScheduleRevisionReviewDefault,
  pp10RecommendGrowthDefault,
  type PP10AdmittedLearningFacts,
} from '../services/practicePadRuntime/practicePadLearningIntegrationService';
import prisma from '../lib/prisma';

const BLOCK_A_ID = { schoolId: 's-pp10', studentId: 'l-pp10', verifiedSchool: true };

const ADMITTED_FACTS: PP10AdmittedLearningFacts = {
  committedEvidenceId: 'ev-1',
  attemptId: 'att-1',
  schoolId: 's-pp10',
  studentId: 'l-pp10',
  checkId: 'chk-1',
  documentVersion: 2,
  skillId: 'skill-add',
  subject: null,
  topic: null,
  deterministicOutcome: 'correct',
  supportQuality: 'SELF_CORRECTED',
  recoveryClassification: 'SELF_CORRECTED',
  transferIndependent: false,
};

// Raw work, ink, integrity suspicion, cheating labels, and speculative
// misconception labels must never reach downstream owners.
const FORBIDDEN_DOWNSTREAM_CONTENT =
  /stroke|pathM|inkPoints|workText|snapshot|blocks|contentHash|tab-switch|cheat|VISIBILITY_INTERRUPTION|SUPPORT_USED_BEFORE_CORRECTION|misconception|rawAnswer|\bink\b/i;

function blockAHistory(): PracticePadCheckResult[] {
  return [prodCheck({ checkId: 'chk-0', basedOnVersion: 1 })];
}

describe('PP-10 blocker repair (A): fail-closed truth + real owners', () => {
  it('1. revision/document outage returns a protected failure with zero protected mutation', async () => {
    const built = prodBindings(prodCheck(), blockAHistory(), {
      documentStore: {
        getDocument: async () => { throw new Error('doc store down'); },
        getRevision: async () => null,
      },
    });
    const res = await integratePracticePadLearningCanonical(
      { identity: BLOCK_A_ID, attemptId: 'att-1', checkId: 'chk-1', idempotencyKey: 'idem-block-a1' },
      built.overrides as never,
    );
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.code).toBe('EVIDENCE_NOT_ADMISSIBLE');
    expect(built.evidence.inputs).toHaveLength(0);
    expect(built.evidence.writes).toBe(0);
    expect(built.downstreamCalls).toHaveLength(0);
  });

  it('2. check-history outage never becomes false independent/self-corrected evidence', async () => {
    const built = prodBindings(prodCheck(), blockAHistory());
    built.overrides.checkStore = {
      ...(built.overrides.checkStore as object),
      listByAttempt: async () => { throw new Error('history store down'); },
    } as never;
    const res = await integratePracticePadLearningCanonical(
      { identity: BLOCK_A_ID, attemptId: 'att-1', checkId: 'chk-1', idempotencyKey: 'idem-block-a2' },
      built.overrides as never,
    );
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.code).toBe('EVIDENCE_NOT_ADMISSIBLE');
    // No admitted candidate exists, so no independent/self-corrected claim was produced.
    expect('candidate' in res).toBe(false);
    expect(built.evidence.inputs).toHaveLength(0);
    expect(built.downstreamCalls).toHaveLength(0);
  });

  it('3a. PP-09 evaluator throw returns INTEGRITY_EVIDENCE_UNAVAILABLE with zero protected mutation', async () => {
    const built = prodBindings(prodCheck(), blockAHistory(), {
      integrityEvaluator: (async () => { throw new Error('pp09 down'); }) as never,
    });
    const res = await integratePracticePadLearningCanonical(
      { identity: BLOCK_A_ID, attemptId: 'att-1', checkId: 'chk-1', idempotencyKey: 'idem-block-a3a' },
      built.overrides as never,
    );
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.code).toBe('INTEGRITY_EVIDENCE_UNAVAILABLE');
    // No concern fabricated, no evidence committed, no downstream projection.
    expect(JSON.stringify(res)).not.toMatch(/NONE|LOW|MODERATE/);
    expect(built.evidence.inputs).toHaveLength(0);
    expect(built.downstreamCalls).toHaveLength(0);
  });

  it('3b. PP-09 evaluator failure outcome returns INTEGRITY_EVIDENCE_UNAVAILABLE with zero protected mutation', async () => {
    const built = prodBindings(prodCheck(), blockAHistory(), {
      integrityEvaluator: (async () => ({ ok: false as const, code: 'PERSISTENCE_FAILED', message: 'integrity store down' })) as never,
    });
    const res = await integratePracticePadLearningCanonical(
      { identity: BLOCK_A_ID, attemptId: 'att-1', checkId: 'chk-1', idempotencyKey: 'idem-block-a3b' },
      built.overrides as never,
    );
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.code).toBe('INTEGRITY_EVIDENCE_UNAVAILABLE');
    expect(built.evidence.inputs).toHaveLength(0);
    expect(built.downstreamCalls).toHaveLength(0);
  });

  it('4. real memory owner is bound by default and called after evidence commit', async () => {
    const B = __resolvePP10CanonicalBindings();
    expect(B.memoryOwner).toBe(pp10RecordLearnerMemoryDefault);
    const built = prodBindings(prodCheck(), blockAHistory());
    const res = await integratePracticePadLearningCanonical(
      { identity: BLOCK_A_ID, attemptId: 'att-1', checkId: 'chk-1', idempotencyKey: 'idem-block-a4' },
      built.overrides as never,
    );
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(built.evidence.inputs).toHaveLength(1);
    expect(built.downstreamCalls.map((c) => c.owner)).toEqual(['memory', 'revision', 'growth']);
    expect(res.order.indexOf('canonical evidence commit')).toBeLessThan(res.order.indexOf('memory owner consequence'));
    // The default adapter drives the EXISTING learnerMemoryService (DB driver stubbed).
    const create = vi.fn().mockResolvedValue({});
    (prisma as unknown as Record<string, unknown>).learnerMemoryItem = { create };
    try {
      await pp10RecordLearnerMemoryDefault(BLOCK_A_ID, ADMITTED_FACTS);
    } finally {
      delete (prisma as unknown as Record<string, unknown>).learnerMemoryItem;
    }
    expect(create).toHaveBeenCalledTimes(1);
    const data = (create.mock.calls[0] as Array<{ data: Record<string, unknown> }>)[0]!.data;
    expect(data.schoolId).toBe('s-pp10');
    expect(JSON.stringify(data)).toContain('skill-add');
    expect(JSON.stringify(data)).toContain('ev-1');
    expect(JSON.stringify(data)).not.toMatch(FORBIDDEN_DOWNSTREAM_CONTENT);
  });

  it('5. real revision owner is bound by default and called after evidence commit', async () => {
    const B = __resolvePP10CanonicalBindings();
    expect(B.revisionOwner).toBe(pp10ScheduleRevisionReviewDefault);
    const built = prodBindings(prodCheck(), blockAHistory());
    const res = await integratePracticePadLearningCanonical(
      { identity: BLOCK_A_ID, attemptId: 'att-1', checkId: 'chk-1', idempotencyKey: 'idem-block-a5' },
      built.overrides as never,
    );
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(built.downstreamCalls.map((c) => c.owner)).toContain('revision');
    expect(res.order.indexOf('canonical evidence commit')).toBeLessThan(res.order.indexOf('revision owner consequence'));
    // The default adapter drives the EXISTING spacedReviewService (fail-soft persistence).
    const review = (await pp10ScheduleRevisionReviewDefault(BLOCK_A_ID, ADMITTED_FACTS)) as { skillId?: string } | null;
    expect(review === null || review.skillId === 'skill-add').toBe(true);
  });

  it('6. real Growth owner is bound by default and called after evidence commit', async () => {
    const B = __resolvePP10CanonicalBindings();
    expect(B.growthOwner).toBe(pp10RecommendGrowthDefault);
    const built = prodBindings(prodCheck(), blockAHistory());
    const res = await integratePracticePadLearningCanonical(
      { identity: BLOCK_A_ID, attemptId: 'att-1', checkId: 'chk-1', idempotencyKey: 'idem-block-a6' },
      built.overrides as never,
    );
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(built.downstreamCalls.map((c) => c.owner)).toContain('growth');
    expect(res.order.indexOf('canonical evidence commit')).toBeLessThan(res.order.indexOf('Growth owner consequence'));
    // The default adapter drives the EXISTING nextPracticeService (read-only).
    const recs = await pp10RecommendGrowthDefault(BLOCK_A_ID, ADMITTED_FACTS);
    expect(Array.isArray(recs)).toBe(true);
  });

  it('7. only admitted learning facts reach downstream owners', async () => {
    const built = prodBindings(prodCheck(), blockAHistory());
    const res = await integratePracticePadLearningCanonical(
      { identity: BLOCK_A_ID, attemptId: 'att-1', checkId: 'chk-1', idempotencyKey: 'idem-block-a7' },
      built.overrides as never,
    );
    expect(res.ok).toBe(true);
    expect(built.downstreamCalls).toHaveLength(3);
    for (const call of built.downstreamCalls) {
      expect(Object.keys(call.facts as object).sort()).toEqual(
        [
          'attemptId', 'checkId', 'committedEvidenceId', 'deterministicOutcome', 'documentVersion',
          'recoveryClassification', 'schoolId', 'skillId', 'studentId', 'subject',
          'supportQuality', 'topic', 'transferIndependent',
        ].sort(),
      );
    }
    expect(JSON.stringify(built.downstreamCalls)).not.toMatch(FORBIDDEN_DOWNSTREAM_CONTENT);
  });

  it('10. canonical replay does not duplicate downstream state', async () => {
    const built = prodBindings(prodCheck(), blockAHistory());
    const input = { identity: BLOCK_A_ID, attemptId: 'att-1', checkId: 'chk-1', idempotencyKey: 'idem-block-a10' };
    const first = await integratePracticePadLearningCanonical(input, built.overrides as never);
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.deduplicated).toBe(false);
    expect(built.downstreamCalls).toHaveLength(3);
    const second = await integratePracticePadLearningCanonical(input, built.overrides as never);
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.deduplicated).toBe(true);
    expect(second.committedEvidenceId).toBe(first.committedEvidenceId);
    expect(built.evidence.writes).toBe(1);
    expect(built.downstreamCalls).toHaveLength(3);
  });

  it('11. evidence commit failure reaches zero downstream owners', async () => {
    const built = prodBindings(prodCheck(), blockAHistory(), {
      evidenceOwner: {
        commitPracticeLearningEvidence: (async () => { throw new Error('evidence store down'); }) as never,
      },
    });
    const res = await integratePracticePadLearningCanonical(
      { identity: BLOCK_A_ID, attemptId: 'att-1', checkId: 'chk-1', idempotencyKey: 'idem-block-a11' },
      built.overrides as never,
    );
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.code).toBe('EVIDENCE_COMMIT_FAILED');
    expect(built.downstreamCalls).toHaveLength(0);
  });

  it('12. downstream owner failure keeps committed evidence authoritative (DOWNSTREAM_PROJECTION_FAILED)', async () => {
    const built = prodBindings(prodCheck(), blockAHistory());
    (built.overrides as { downstreamOwners: object }).downstreamOwners = {
      recordLearnerMemory: async () => { throw new Error('memory owner down'); },
      scheduleRevisionReview: async (_id: unknown, facts: unknown) => { built.downstreamCalls.push({ owner: 'revision', facts }); },
      recommendGrowth: async (_id: unknown, facts: unknown) => { built.downstreamCalls.push({ owner: 'growth', facts }); },
    };
    const res = await integratePracticePadLearningCanonical(
      { identity: BLOCK_A_ID, attemptId: 'att-1', checkId: 'chk-1', idempotencyKey: 'idem-block-a12' },
      built.overrides as never,
    );
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.code).toBe('DOWNSTREAM_PROJECTION_FAILED');
    // Committed evidence remains authoritative: exactly one commit, no fake rollback.
    expect(built.evidence.inputs).toHaveLength(1);
    expect(built.evidence.writes).toBe(1);
  });

  it('13. canonical mastery is applied at most once and no second mastery projector is bound', async () => {
    const B = __resolvePP10CanonicalBindings();
    expect((B as Record<string, unknown>).masteryOwner).toBeUndefined();
    expect((B as Record<string, unknown>).mastery).toBeUndefined();
    const built = prodBindings(prodCheck(), blockAHistory());
    const input = { identity: BLOCK_A_ID, attemptId: 'att-1', checkId: 'chk-1', idempotencyKey: 'idem-block-a13' };
    expect(await integratePracticePadLearningCanonical(input, built.overrides as never)).toMatchObject({ ok: true });
    expect(await integratePracticePadLearningCanonical(input, built.overrides as never)).toMatchObject({ ok: true, deduplicated: true });
    expect(built.evidence.writes).toBe(1);
    expect(built.evidence.masteryApplications).toBe(1);
  });

  it('14. zero live model calls', () => {
    expect(PP10_LIVE_MODEL_CALLS).toBe(0);
  });
});

// ── PP-10 → PP-12 final seal: durable receipt before projectors,
// shared single-receipt executor, replay law, failure truth. ──

const SEAL_ID = { schoolId: 's-pp10', studentId: 'l-pp10', verifiedSchool: true };

function sealCheck(over: Partial<PracticePadCheckResult> = {}): PracticePadCheckResult {
  return {
    checkId: 'chk-seal', attemptId: 'att-seal', basedOnVersion: 2, status: 'CONFIRMED_CORRECT',
    deterministicVerdict: 'correct', confirmedCorrectSteps: ['x = 1', 'x = 2'],
    confidence: 0.95, checkerPath: 'deterministic_exact', evidenceCandidate: null,
    misconceptionCandidate: null, currentFeedbackEligible: true, deduplicated: false,
    createdAt: '2026-09-23T00:00:00.000Z', ...over,
  };
}

function sealRecord(c: PracticePadCheckResult) {
  return {
    scopeHash: `scope-${c.checkId}`, checkId: c.checkId, schoolId: 's-pp10', studentId: 'l-pp10',
    attemptId: c.attemptId, basedOnVersion: c.basedOnVersion, idempotencyKey: `k-${c.checkId}`,
    fingerprint: `fp-${c.checkId}`, status: c.status, evaluationMode: 'deterministic' as const,
    evidenceEligible: true, resultJson: JSON.stringify(c),
    createdAt: '2026-09-23T00:00:00.000Z', resolvedAt: '2026-09-23T00:00:00.000Z',
  };
}

/** Canonical bindings for the seal attempt/check identity. */
function sealBindings(current: PracticePadCheckResult, extra: Record<string, unknown> = {}) {
  const evidence = fakeEvidenceOwner();
  const receiptStore = (extra.receiptStore as unknown) ?? createFakeReceiptStore();
  const downstreamCalls: Array<{ owner: string; facts: unknown }> = [];
  const revisions = [
    { revisionId: 'r1', version: 1, snapshot: { blocks: [{ blockId: 'b1', kind: 'TEXT', content: 'x=1 work trace' }] }, contentHash: 'h1' },
    { revisionId: 'r2', version: 2, snapshot: { blocks: [{ blockId: 'b1', kind: 'TEXT', content: 'x=1\nx=2 work trace long enough' }] }, contentHash: 'h2' },
  ];
  return {
    evidence,
    downstreamCalls,
    receiptStore: receiptStore as ReturnType<typeof createFakeReceiptStore>,
    overrides: {
      checkStore: {
        findByCheckId: async (attemptId: string, checkId: string) =>
          checkId === current.checkId && attemptId === current.attemptId ? sealRecord(current) : null,
        listByAttempt: async () => [sealCheck({ checkId: 'chk-seal-0', basedOnVersion: 1 })].map(sealRecord),
      },
      attemptOwner: {
        getPracticeAttempt: async () => ({
          attemptId: 'att-seal', schoolId: 's-pp10', studentId: 'l-pp10',
          problemId: 'p-seal', problemVersion: 1, skillIds: ['skill-seal'],
          subject: null, topic: null,
        }),
      },
      problemAuthority: {
        resolveForAttemptAsync: async () => ({
          problem: { problemId: 'p-seal' },
          learnerView: { problemId: 'p-seal' },
          hasAuthoritativeAnswer: true, problemVersion: 1, durable: true,
        }),
      },
      documentStore: {
        getDocument: async () => ({ currentVersion: 2 }),
        getRevision: async (_id: unknown, _att: unknown, version: number) => revisions.find((r) => r.version === version) ?? null,
      },
      interpretationStore: { getInterpretation: async () => null },
      integrityEvaluator: (async () => ({ ok: true as const, evidence: null })) as unknown as typeof evaluatePracticeIntegrity,
      evidenceOwner: { commitPracticeLearningEvidence: evidence.commit },
      downstreamOwners: {
        recordLearnerMemory: async (_id: unknown, facts: unknown) => { downstreamCalls.push({ owner: 'memory', facts }); },
        scheduleRevisionReview: async (_id: unknown, facts: unknown) => { downstreamCalls.push({ owner: 'revision', facts }); },
        recommendGrowth: async (_id: unknown, facts: unknown) => { downstreamCalls.push({ owner: 'growth', facts }); },
      },
      receiptStore: receiptStore as never,
      ...extra,
    },
  };
}

const SEAL_SAFE_KEYS = [
  'attemptId', 'problemId', 'problemVersion', 'documentVersion', 'checkId', 'skillId',
  'curriculumRefs', 'deterministicOutcome', 'firstDivergenceStepIndex', 'firstDivergenceReasonCode',
  'confirmedPrefixCount', 'supportQuality', 'recoveryClassification', 'transferIndependent',
  'transferReason', 'ledgerEventType', 'masterySignal', 'interpretationId',
  'interpretationSourceHash', 'representationClass', 'integrityEvidenceId', 'integrityConcern',
  'integrityNextAction', 'evidenceQualityNote', 'createdAt',
].sort();

describe('PP-10 → PP-12 final seal', () => {
  it('commit precedes receipt; receipt precedes memory/revision/Growth; receipt carries only the safe candidate', async () => {
    const built = sealBindings(sealCheck());
    const order: string[] = [];
    const origCommit = built.evidence.commit;
    (built.overrides as { evidenceOwner: object }).evidenceOwner = {
      commitPracticeLearningEvidence: (async (input: Parameters<typeof commitPracticeLearningEvidence>[0]) => {
        order.push('commit');
        return origCommit(input);
      }) as typeof commitPracticeLearningEvidence,
    };
    const innerStore = built.receiptStore;
    const origEnsure = innerStore.ensureReceipt.bind(innerStore);
    (built.overrides as { receiptStore: object }).receiptStore = {
      ensureReceipt: async (input: Parameters<ReturnType<typeof createFakeReceiptStore>['ensureReceipt']>[0]) => {
        order.push('receipt');
        return origEnsure(input);
      },
      getReceipt: (...a: Parameters<ReturnType<typeof createFakeReceiptStore>['getReceipt']>) => innerStore.getReceipt(...a),
      markProjectionState: (...a: Parameters<ReturnType<typeof createFakeReceiptStore>['markProjectionState']>) =>
        innerStore.markProjectionState(...a),
      claimReceipt: (...a: Parameters<ReturnType<typeof createFakeReceiptStore>['claimReceipt']>) =>
        innerStore.claimReceipt(...a),
      releaseClaim: (...a: Parameters<ReturnType<typeof createFakeReceiptStore>['releaseClaim']>) =>
        innerStore.releaseClaim(...a),
    };
    const res = await integratePracticePadLearningCanonical(
      { identity: SEAL_ID, attemptId: 'att-seal', checkId: 'chk-seal', idempotencyKey: 'practice-pad-learning:chk-seal' },
      built.overrides as never,
    );
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    // Canonical evidence commit occurs before receipt/projectors.
    expect(order).toEqual(['commit', 'receipt']);
    expect(res.order.indexOf('canonical evidence commit')).toBeLessThan(res.order.indexOf('memory owner consequence'));
    expect(built.downstreamCalls.map((c) => c.owner)).toEqual(['memory', 'revision', 'growth']);
    // Receipt is durably established with server-owned identity + committed evidence.
    const receipt = await innerStore.findByCommittedEvidenceId(res.committedEvidenceId);
    expect(receipt).not.toBeNull();
    expect(receipt!.schoolId).toBe('s-pp10');
    expect(receipt!.studentId).toBe('l-pp10');
    expect(receipt!.attemptId).toBe('att-seal');
    expect(receipt!.idempotencyKey).toBe('practice-pad-learning:chk-seal');
    expect(receipt!.memoryState).toBe('SUCCEEDED');
    expect(receipt!.revisionState).toBe('SUCCEEDED');
    expect(receipt!.growthState).toBe('SUCCEEDED');
    // candidateJson carries ONLY the already-admitted safe candidate.
    const candidate = JSON.parse(receipt!.candidateJson) as Record<string, unknown>;
    expect(Object.keys(candidate).sort()).toEqual(SEAL_SAFE_KEYS);
    expect(JSON.stringify(candidate)).not.toMatch(/stroke|pathM|inkPoints|workText|snapshot|blocks|contentHash|tab-|chain of thought|accus|hidden answer|\bink\b/i);
  });

  it('memory SUCCEEDED + revision FAILED + Growth PENDING; replay retries revision without repeating memory', async () => {
    const built = sealBindings(sealCheck());
    (built.overrides as { downstreamOwners: object }).downstreamOwners = {
      recordLearnerMemory: async (_id: unknown, facts: unknown) => { built.downstreamCalls.push({ owner: 'memory', facts }); },
      scheduleRevisionReview: async (_id: unknown, facts: unknown) => {
        built.downstreamCalls.push({ owner: 'revision-attempted', facts });
        throw new Error('revision owner outage (injected)');
      },
      recommendGrowth: async (_id: unknown, facts: unknown) => { built.downstreamCalls.push({ owner: 'growth', facts }); },
    };
    const input = { identity: SEAL_ID, attemptId: 'att-seal', checkId: 'chk-seal', idempotencyKey: 'practice-pad-learning:chk-seal' };
    const failed = await integratePracticePadLearningCanonical(input, built.overrides as never);
    expect(failed.ok).toBe(false);
    if (failed.ok) return;
    expect(failed.code).toBe('DOWNSTREAM_PROJECTION_FAILED');
    // Canonical evidence remains committed (exactly one commit, one mastery).
    expect(built.evidence.writes).toBe(1);
    expect(built.evidence.masteryApplications).toBe(1);
    const partial = [...built.receiptStore.rows.values()][0]!;
    expect(partial.memoryState).toBe('SUCCEEDED');
    expect(partial.revisionState).toBe('FAILED');
    expect(partial.growthState).toBe('PENDING');
    // Same canonical check replay: canonical evidence deduplicates, memory
    // is NOT repeated, revision is retried, then Growth succeeds.
    (built.overrides as { downstreamOwners: object }).downstreamOwners = {
      recordLearnerMemory: async (_id: unknown, facts: unknown) => { built.downstreamCalls.push({ owner: 'memory', facts }); },
      scheduleRevisionReview: async (_id: unknown, facts: unknown) => { built.downstreamCalls.push({ owner: 'revision', facts }); },
      recommendGrowth: async (_id: unknown, facts: unknown) => { built.downstreamCalls.push({ owner: 'growth', facts }); },
    };
    const healed = await integratePracticePadLearningCanonical(input, built.overrides as never);
    expect(healed.ok).toBe(true);
    if (!healed.ok) return;
    expect(healed.deduplicated).toBe(true);
    expect(healed.committedEvidenceId).toBe(partial.committedEvidenceId);
    expect(built.downstreamCalls.filter((c) => c.owner === 'memory')).toHaveLength(1);
    expect(built.downstreamCalls.filter((c) => c.owner === 'revision')).toHaveLength(1);
    expect(built.downstreamCalls.filter((c) => c.owner === 'growth')).toHaveLength(1);
    expect(built.evidence.writes).toBe(1);
    expect(built.evidence.masteryApplications).toBe(1);
    const final = [...built.receiptStore.rows.values()][0]!;
    expect(final.memoryState).toBe('SUCCEEDED');
    expect(final.revisionState).toBe('SUCCEEDED');
    expect(final.growthState).toBe('SUCCEEDED');
    // Completed replay duplicates no downstream projection.
    const callsBefore = built.downstreamCalls.length;
    const quiet = await integratePracticePadLearningCanonical(input, built.overrides as never);
    expect(quiet.ok).toBe(true);
    expect(built.downstreamCalls).toHaveLength(callsBefore);
    expect(built.evidence.writes).toBe(1);
  });

  it('batch reconciler shares the same single-receipt executor and heals canonical partial receipts', async () => {
    expect(typeof reconcilePracticePadLearningProjectionReceipt).toBe('function');
    const built = sealBindings(sealCheck());
    (built.overrides as { downstreamOwners: object }).downstreamOwners = {
      recordLearnerMemory: async () => undefined,
      scheduleRevisionReview: async () => { throw new Error('revision owner outage (injected)'); },
      recommendGrowth: async () => undefined,
    };
    const input = { identity: SEAL_ID, attemptId: 'att-seal', checkId: 'chk-seal', idempotencyKey: 'practice-pad-learning:chk-seal' };
    const failed = await integratePracticePadLearningCanonical(input, built.overrides as never);
    expect(failed.ok).toBe(false);
    const calls = { memory: 0, revision: 0, growth: 0 };
    const healed = await reconcilePracticePadLearningProjections({
      store: built.receiptStore as never,
      projectors: {
        memory: async () => { calls.memory += 1; },
        revision: async () => { calls.revision += 1; },
        growth: async () => { calls.growth += 1; },
      },
      batchSize: 25,
      workerId: 'seal-batch',
    });
    expect(healed.processed).toBeGreaterThanOrEqual(1);
    // Memory is NOT repeated; only failed revision + pending Growth ran.
    expect(calls.memory).toBe(0);
    expect(calls.revision).toBe(1);
    expect(calls.growth).toBe(1);
    const final = [...built.receiptStore.rows.values()][0]!;
    expect(final.memoryState).toBe('SUCCEEDED');
    expect(final.revisionState).toBe('SUCCEEDED');
    expect(final.growthState).toBe('SUCCEEDED');
    // A quiet batch run performs zero duplicate effects.
    const quiet = await reconcilePracticePadLearningProjections({
      store: built.receiptStore as never,
      projectors: {
        memory: async () => { calls.memory += 1; },
        revision: async () => { calls.revision += 1; },
        growth: async () => { calls.growth += 1; },
      },
      batchSize: 25,
      workerId: 'seal-batch-quiet',
    });
    expect(quiet.processed).toBe(0);
    expect(calls).toEqual({ memory: 0, revision: 1, growth: 1 });
  });

  it('receipt persistence failure runs no projector and keeps evidence authoritative', async () => {
    const throwing = {
      ensureReceipt: async (): Promise<never> => { throw new Error('receipt store down (injected)'); },
      getReceipt: async (): Promise<null> => null,
      markProjectionState: async (): Promise<null> => null,
    };
    const built = sealBindings(sealCheck(), { receiptStore: throwing });
    const res = await integratePracticePadLearningCanonical(
      { identity: SEAL_ID, attemptId: 'att-seal', checkId: 'chk-seal', idempotencyKey: 'practice-pad-learning:chk-seal' },
      built.overrides as never,
    );
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.code).toBe('DOWNSTREAM_PROJECTION_FAILED');
    expect(built.downstreamCalls).toHaveLength(0);
    // Canonical evidence remains authoritative: exactly one commit, no fake rollback.
    expect(built.evidence.writes).toBe(1);
  });

  it('evidence commit failure creates no projection receipt and no downstream effects', async () => {
    const built = sealBindings(sealCheck(), {
      evidenceOwner: {
        commitPracticeLearningEvidence: (async () => { throw new Error('evidence store down (injected)'); }) as never,
      },
    });
    const res = await integratePracticePadLearningCanonical(
      { identity: SEAL_ID, attemptId: 'att-seal', checkId: 'chk-seal', idempotencyKey: 'practice-pad-learning:chk-seal' },
      built.overrides as never,
    );
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.code).toBe('EVIDENCE_COMMIT_FAILED');
    expect(built.receiptStore.rows.size).toBe(0);
    expect(built.downstreamCalls).toHaveLength(0);
  });

  it('zero live model calls', () => {
    expect(PP10_LIVE_MODEL_CALLS).toBe(0);
  });
});

// ── Durability seal: shared claimed executor + crash-idempotency ──
import { executeClaimedProjectionReceipt } from '../services/practicePadRuntime/practicePadProjectionReconciler';
import {
  pp10RevisionIdempotencyKey,
} from '../services/practicePadRuntime/practicePadLearningIntegrationService';
import { deterministicReviewId } from '../services/spacedReviewService';

describe('PP-10 durability seal: concurrency + crash-idempotency', () => {
  it('two simultaneous executions of the SAME receipt: one owner, zero duplicate effects, all SUCCEEDED', async () => {
    const shared = new Map();
    const storeA = createFakeReceiptStore(shared) as never;
    const storeB = createFakeReceiptStore(shared) as never;
    const seed = await (storeA as ReturnType<typeof createFakeReceiptStore>).ensureReceipt({
      schoolId: 's-dur',
      studentId: 'l-dur',
      attemptId: 'a-dur',
      idempotencyKey: 'k-dur',
      committedEvidenceId: 'ev-dur',
      candidateJson: '{}',
    });
    const calls = { memory: 0, revision: 0, growth: 0 };
    const projectors = {
      memory: async () => {
        calls.memory += 1;
        await new Promise((r) => setTimeout(r, 20));
      },
      revision: async () => {
        calls.revision += 1;
      },
      growth: async () => {
        calls.growth += 1;
      },
    };
    const [ra, rb] = await Promise.all([
      executeClaimedProjectionReceipt({
        store: storeA,
        receiptKey: seed.receiptKey,
        workerId: 'w-A',
        leaseMs: 60_000,
        nowMs: Date.now(),
        projectors,
      }),
      executeClaimedProjectionReceipt({
        store: storeB,
        receiptKey: seed.receiptKey,
        workerId: 'w-B',
        leaseMs: 60_000,
        nowMs: Date.now(),
        projectors,
      }),
    ]);
    const owned = [ra, rb].filter((r) => r.claim === 'OWNED');
    const lost = [ra, rb].filter((r) => r.claim === 'LOST');
    expect(owned).toHaveLength(1);
    expect(lost).toHaveLength(1);
    expect(owned[0].outcome).toBe('COMPLETED');
    expect(lost[0].ranEffects).toBe(0);
    expect(lost[0].outcome).toBe('IN_PROGRESS_CLAIMED');
    expect(calls).toEqual({ memory: 1, revision: 1, growth: 1 });
    const final = await (storeA as ReturnType<typeof createFakeReceiptStore>).getReceipt(seed.receiptKey);
    expect(final?.memoryState).toBe('SUCCEEDED');
    expect(final?.revisionState).toBe('SUCCEEDED');
    expect(final?.growthState).toBe('SUCCEEDED');
  });

  it('a stale worker cannot overwrite receipt truth after losing its lease', async () => {
    const store = createFakeReceiptStore() as unknown as ReturnType<typeof createFakeReceiptStore>;
    const seed = await store.ensureReceipt({
      schoolId: 's-dur',
      studentId: 'l-dur',
      attemptId: 'a-stale',
      idempotencyKey: 'k-stale',
      committedEvidenceId: 'ev-stale',
      candidateJson: '{}',
    });
    expect(await store.claimReceipt(seed.receiptKey, 'w-1', 60_000, 1_000)).toBe(true);
    // Lease expires; a second worker steals the claim (PostgreSQL truth).
    expect(await store.claimReceipt(seed.receiptKey, 'w-2', 60_000, 200_000)).toBe(true);
    // Stale worker's conditional transition is a no-op that reports loss.
    expect(await store.markProjectionState(seed.receiptKey, 'memory', 'SUCCEEDED', null, 'w-1')).toBeNull();
    const after = await store.getReceipt(seed.receiptKey);
    expect(after?.memoryState).toBe('PENDING');
    // Active owner still transitions normally.
    const marked = await store.markProjectionState(seed.receiptKey, 'memory', 'SUCCEEDED', null, 'w-2');
    expect(marked?.memoryState).toBe('SUCCEEDED');
  });

  it('A: memory durable effect succeeds then crash before receipt marker → retry appends no duplicate evidence', async () => {
    // Isolated modules: no database here, so force the explicit
    // in-memory fallback (fresh module state, availability probe fails).
    vi.resetModules();
    const prismaMod = (await import('../lib/prisma')) as { default: { $queryRaw: { mockRejectedValue: (e: unknown) => void } } };
    prismaMod.default.$queryRaw.mockRejectedValue(new Error('no db in durability proof'));
    const freshIntegration = (await import(
      '../services/practicePadRuntime/practicePadLearningIntegrationService'
    )) as typeof import('../services/practicePadRuntime/practicePadLearningIntegrationService');
    const freshMemory = (await import('../services/learnerMemoryService')) as typeof import('../services/learnerMemoryService');
    freshMemory._clearMemoryStoreForTest();
    const id = { schoolId: 's-crash-a', studentId: 'l-crash-a', verifiedSchool: true };
    const facts: PP10AdmittedLearningFacts = {
      committedEvidenceId: 'ev-crash-a',
      attemptId: 'a-crash-a',
      schoolId: id.schoolId,
      studentId: id.studentId,
      checkId: 'c-crash-a',
      documentVersion: 2,
      skillId: 'sk-a',
      subject: 'Math',
      topic: 'Add',
      deterministicOutcome: 'correct',
      supportQuality: 'INDEPENDENT',
      recoveryClassification: 'UNRESOLVED',
      transferIndependent: false,
    };
    await freshIntegration.pp10RecordLearnerMemoryDefault(id, facts);
    // Crash before the receipt memoryState=SUCCEEDED marker (receipt untouched).
    await freshIntegration.pp10RecordLearnerMemoryDefault(id, facts);
    const mems = await freshMemory.learnerMemoryService.listLearnerMemory(id as never, { limit: 10 });
    const marker = freshIntegration.pp10MemoryEvidenceMarker('ev-crash-a');
    const hits = mems.flatMap((m) => m.evidence).filter((e) => e.summary.includes(marker));
    expect(hits).toHaveLength(1);
  });

  it('B: revision durable effect succeeds then crash before receipt marker → retry reuses one review identity', async () => {
    const id = { schoolId: 's-crash-b', studentId: 'l-crash-b', verifiedSchool: true };
    const facts: PP10AdmittedLearningFacts = {
      committedEvidenceId: 'ev-crash-b',
      attemptId: 'a-crash-b',
      schoolId: id.schoolId,
      studentId: id.studentId,
      checkId: 'c-crash-b',
      documentVersion: 2,
      skillId: 'sk-b',
      subject: 'Math',
      topic: 'Add',
      deterministicOutcome: 'incorrect',
      supportQuality: 'SELF_CORRECTED',
      recoveryClassification: 'SELF_CORRECTED',
      transferIndependent: false,
    };
    const r1 = (await pp10ScheduleRevisionReviewDefault(id, facts)) as { reviewId: string } | null;
    // Crash before the receipt revisionState=SUCCEEDED marker.
    const r2 = (await pp10ScheduleRevisionReviewDefault(id, facts)) as { reviewId: string } | null;
    expect(r1).not.toBeNull();
    expect(r2).not.toBeNull();
    expect(r2?.reviewId).toBe(r1?.reviewId);
    expect(r1?.reviewId).toBe(deterministicReviewId(pp10RevisionIdempotencyKey('ev-crash-b', 'sk-b'), 'sk-b'));
  });

  it('C: DB persistence failure with requireDurable=true throws — revision is never marked SUCCEEDED on a swallowed write', async () => {
    vi.resetModules();
    const prismaMod = (await import('../lib/prisma')) as {
      default: Record<string, unknown>;
    };
    prismaMod.default.$queryRaw = Object.assign(async () => 1, { mockRejectedValue: () => undefined });
    (prismaMod.default as Record<string, unknown>).spacedReviewItem = {
      create: async () => {
        throw new Error('db down (injected)');
      },
      findUnique: async () => null,
      findMany: async () => [],
    };
    const fresh = (await import('../services/spacedReviewService')) as typeof import('../services/spacedReviewService');
    const id = { schoolId: 's-crash-c', studentId: 'l-crash-c' } as never;
    const attempt = {
      outcome: 'correct',
      skillIds: ['sk-c'],
      subject: 'Math',
      topic: 'Add',
    } as never;
    await expect(
      fresh.spacedReviewService.scheduleReviewFromAttempt(id, attempt, null, {
        idempotencyKey: 'pp10:ev-crash-c:sk-c',
        requireDurable: true,
      }),
    ).rejects.toThrow(/requireDurable/);
    // Legacy callers without options keep existing degrade-to-memory behavior
    // (different skill: the failed durable attempt already holds this window).
    const legacyAttempt = { outcome: 'correct', skillIds: ['sk-c2'], subject: 'Math', topic: 'Add' } as never;
    const legacy = await fresh.spacedReviewService.scheduleReviewFromAttempt(id, legacyAttempt, null);
    expect(legacy).not.toBeNull();
  });
});
