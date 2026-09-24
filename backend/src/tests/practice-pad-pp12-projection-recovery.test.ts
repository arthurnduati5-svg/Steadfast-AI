// ─────────────────────────────────────────────────────────────
// Steadfast AI — Practice Pad PP-12 (B):
// durable PP-10 projection recovery + restart + failure semantics.
//
// Same isolated-DB guard as PP-12 (A): PP12_TEST_DATABASE_URL must equal
// DATABASE_URL on localhost with a test-only name, else loud refusal
// (unset → skip, PP-12 recovery acceptance stays UNVERIFIED, never PASS).
//
// Proves PP-12 §22 (8–15) + §23 (16–21, minus backup): evidence commit
// precedes projection effects; committed evidence survives projection
// failure; success is durably remembered; failed projections resume
// after service restart using only PostgreSQL state; retry never
// duplicates success; concurrent reconcilers never duplicate an effect;
// bounded reconciliation; no false success; fail-closed DB semantics;
// stale/foreign state cannot mutate protected truth; bounded load with
// honest local timings. Zero live model calls.
// ─────────────────────────────────────────────────────────────

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import * as path from 'path';
import { config } from 'dotenv';

config({ path: path.resolve(__dirname, '../../.env') });

vi.mock('redis', () => {
  const mockClient = {
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue('OK'),
    setEx: vi.fn().mockResolvedValue('OK'),
    del: vi.fn().mockResolvedValue(1),
    exists: vi.fn().mockResolvedValue(0),
    expire: vi.fn().mockResolvedValue(true),
    ttl: vi.fn().mockResolvedValue(-1),
    on: vi.fn().mockReturnThis(),
    quit: vi.fn().mockResolvedValue('OK'),
    isOpen: false,
  };
  return {
    createClient: vi.fn().mockReturnValue(mockClient),
    default: { createClient: vi.fn().mockReturnValue(mockClient) },
  };
});

import { PrismaClient } from '@prisma/client';
import prisma from '../lib/prisma';
import { integratePracticePadLearning } from '../services/practicePadRuntime/practicePadLearningIntegrationService';
import {
  createPracticePadProjectionReceiptStore,
  practicePadProjectionReceiptStore,
  practiceProjectionReceiptKey,
} from '../services/practicePadRuntime/practicePadProjectionReceiptStore';
import {
  reconcilePracticePadLearningProjections,
  type PracticeProjectionProjectors,
} from '../services/practicePadRuntime/practicePadProjectionReconciler';
import { practicePadIntegrityStore } from '../services/practicePadRuntime/practicePadIntegrityStore';
import { recordIntegrityObservation } from '../services/practicePadRuntime/practicePadIntegrityEngine';

export const PP12_LIVE_MODEL_CALLS = 0 as const;

const TEST_URL = process.env.PP12_TEST_DATABASE_URL || '';
const ACTIVE_URL = process.env.DATABASE_URL || '';

function isIsolatedTestUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.hostname !== 'localhost' && u.hostname !== '127.0.0.1') return false;
    if (/supabase|neon|pooler|rds|amazonaws|cloudsql|azure|planetscale/i.test(url)) return false;
    if (!/test/i.test(u.pathname)) return false;
    return true;
  } catch {
    return false;
  }
}

if (TEST_URL && (ACTIVE_URL !== TEST_URL || !isIsolatedTestUrl(TEST_URL))) {
  throw new Error(
    'PP-12 real-DB proof refused: set PP12_TEST_DATABASE_URL to an isolated localhost test database URL ' +
    'AND set DATABASE_URL (and DIRECT_URL) to the same value. Refusing to run against any other database.',
  );
}

const RUN_REAL = !!TEST_URL && ACTIVE_URL === TEST_URL && isIsolatedTestUrl(TEST_URL);
const RUN_ID = `pp12b-${Date.now()}`;
const SCHOOL = `school-${RUN_ID}`;
const LEARNER = `learner-${RUN_ID}`;

function makeCheck(checkId: string, attemptId: string, version = 1): any {
  return {
    checkId,
    attemptId,
    schoolId: SCHOOL,
    studentId: LEARNER,
    basedOnVersion: version,
    status: 'CONFIRMED_CORRECT',
    confidence: 0.92,
    currentFeedbackEligible: true,
    confirmedCorrectSteps: [{ stepIndex: 0 }, { stepIndex: 1 }],
    firstDivergence: null,
    interpretationRequired: false,
    interpretation: null,
    createdAt: new Date().toISOString(),
  };
}

function makeKernelDeps(args: {
  attemptId: string;
  checkId: string;
  idempotencyKey: string;
  committer: (candidate: any) => Promise<{ ok: true; committedEvidenceId: string } | { ok: false; code: string; message: string }>;
  projectors: { memory: any; revision: any; growth: any };
  attemptSchool?: string;
  attemptStudent?: string;
  staleCheck?: boolean;
}) {
  const check = makeCheck(args.checkId, args.attemptId);
  return {
    identity: { schoolId: SCHOOL, studentId: LEARNER, verifiedSchool: true },
    attemptId: args.attemptId,
    checkId: args.checkId,
    idempotencyKey: args.idempotencyKey,
    loadCheck: async () => ({ check, isCurrent: !args.staleCheck }),
    loadAttempt: async () => ({
      attemptId: args.attemptId,
      schoolId: args.attemptSchool ?? SCHOOL,
      studentId: args.attemptStudent ?? LEARNER,
      problemId: `problem-${RUN_ID}`,
      problemVersion: 1,
    }),
    loadProblem: async () => ({
      problemId: `problem-${RUN_ID}`,
      problemVersion: 1,
      status: 'READY',
      skillId: `skill-${RUN_ID}`,
      curriculumRefs: { skillId: `skill-${RUN_ID}` },
    }),
    loadRevisions: async () => [{ version: 1, workText: 'text:64', contentHash: 'h-pp12b' }],
    loadCheckHistory: async () => [check],
    evidenceCommitter: args.committer,
    projectors: args.projectors,
  };
}

/** Receipt-tracking projector wrapper: durable per-projection outcome
 *  recorded in PostgreSQL around the real projector. */
function trackedProjectors(
  store: typeof practicePadProjectionReceiptStore,
  ids: { schoolId: string; studentId: string; attemptId: string; idempotencyKey: string },
  fns: { memory: () => Promise<unknown> | unknown; revision: () => Promise<unknown> | unknown; growth: () => Promise<unknown> | unknown },
  counters: Record<string, number>,
) {
  const receiptKey = practiceProjectionReceiptKey(ids.attemptId, ids.idempotencyKey);
  const wrap = (name: 'memory' | 'revision' | 'growth', fn: () => Promise<unknown> | unknown) => async (admitted: any) => {
    await store.ensureReceipt({
      ...ids,
      committedEvidenceId: admitted.committedEvidenceId,
      candidateJson: JSON.stringify(admitted.candidate ?? {}).slice(0, 20000),
    });
    counters[name] += 1;
    try {
      const out = await fn();
      await store.markProjectionState(receiptKey, name, 'SUCCEEDED');
      return out;
    } catch (err) {
      await store.markProjectionState(receiptKey, name, 'FAILED', (err as Error)?.message);
      throw err;
    }
  };
  return { memory: wrap('memory', fns.memory), revision: wrap('revision', fns.revision), growth: wrap('growth', fns.growth) };
}

describe.skipIf(!RUN_REAL)('Practice Pad PP-12 (B) — durable projection recovery', () => {
  let freshClient: PrismaClient | null = null;

  beforeAll(async () => {
    freshClient = new PrismaClient();
    // Isolated-DB run hygiene: PP-12 proofs accumulate rows across runs in
    // the disposable database; receipts are reaped here so bounded scans
    // and call-count assertions observe only this run's receipts.
    await (prisma as any).$executeRawUnsafe(`DELETE FROM "PracticePadProjectionReceipt"`);
  });

  afterAll(async () => {
    if (freshClient) await freshClient.$disconnect().catch(() => undefined);
    await (prisma as any).$disconnect().catch(() => undefined);
  });

  it('evidence commit precedes projections and success is durably remembered', async () => {
    const attemptId = `attempt-${RUN_ID}-ok`;
    const idempotencyKey = `idem-${RUN_ID}-ok`;
    const committedEvidenceId = `cev-${RUN_ID}-ok`;
    const calls: string[] = [];
    const counters = { memory: 0, revision: 0, growth: 0 };
    const projectors = trackedProjectors(
      practicePadProjectionReceiptStore,
      { schoolId: SCHOOL, studentId: LEARNER, attemptId, idempotencyKey },
      {
        memory: async () => { calls.push('memory'); },
        revision: async () => { calls.push('revision'); },
        growth: async () => { calls.push('growth'); },
      },
      counters,
    );
    const res = await integratePracticePadLearning(
      makeKernelDeps({
        attemptId,
        checkId: `check-${RUN_ID}-ok`,
        idempotencyKey,
        committer: async () => {
          // Committer runs BEFORE any projector: no projection may precede it.
          expect(calls).toEqual([]);
          return { ok: true, committedEvidenceId };
        },
        projectors: projectors as never,
      }) as never,
    );
    expect(res.ok).toBe(true);
    expect(calls).toEqual(['memory', 'revision', 'growth']);
    const receipt = await practicePadProjectionReceiptStore.findByCommittedEvidenceId(committedEvidenceId);
    expect(receipt).not.toBeNull();
    expect(receipt!.memoryState).toBe('SUCCEEDED');
    expect(receipt!.revisionState).toBe('SUCCEEDED');
    expect(receipt!.growthState).toBe('SUCCEEDED');
    expect(counters).toEqual({ memory: 1, revision: 1, growth: 1 });
  });

  it('revision failure keeps committed evidence, remembers memory, leaves Growth pending', async () => {
    const attemptId = `attempt-${RUN_ID}-fail`;
    const idempotencyKey = `idem-${RUN_ID}-fail`;
    const committedEvidenceId = `cev-${RUN_ID}-fail`;
    let committerCalls = 0;
    const counters = { memory: 0, revision: 0, growth: 0 };
    const projectors = trackedProjectors(
      practicePadProjectionReceiptStore,
      { schoolId: SCHOOL, studentId: LEARNER, attemptId, idempotencyKey },
      {
        memory: async () => undefined,
        revision: async () => { throw new Error('revision owner outage (injected)'); },
        growth: async () => undefined,
      },
      counters,
    );
    const res = await integratePracticePadLearning(
      makeKernelDeps({
        attemptId,
        checkId: `check-${RUN_ID}-fail`,
        idempotencyKey,
        committer: async () => {
          committerCalls += 1;
          return { ok: true, committedEvidenceId };
        },
        projectors: projectors as never,
      }) as never,
    );
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe('DOWNSTREAM_PROJECTION_FAILED');
    // One commit, never rolled back, never repeated.
    expect(committerCalls).toBe(1);
    expect(counters).toEqual({ memory: 1, revision: 1, growth: 0 });
    const receipt = await practicePadProjectionReceiptStore.findByCommittedEvidenceId(committedEvidenceId);
    expect(receipt).not.toBeNull();
    expect(receipt!.memoryState).toBe('SUCCEEDED');
    expect(receipt!.revisionState).toBe('FAILED');
    // Growth was never attempted and is NEVER falsely marked successful.
    expect(receipt!.growthState).toBe('PENDING');
    expect(receipt!.lastErrorJson).toContain('revision owner outage');

    // ── Restart recovery using ONLY PostgreSQL state ──
    // Discard every service reference; rebuild an independent store over a
    // fresh client (separate pool, no shared JS state) and reconcile.
    const replicaStore = createPracticePadProjectionReceiptStore(freshClient as never);
    const reloaded = await replicaStore.findByCommittedEvidenceId(committedEvidenceId);
    expect(reloaded).not.toBeNull();
    expect(reloaded!.memoryState).toBe('SUCCEEDED');
    expect(reloaded!.revisionState).toBe('FAILED');
    const reconcileCalls = { memory: 0, revision: 0, growth: 0 };
    const healed = await reconcilePracticePadLearningProjections({
      store: replicaStore,
      projectors: {
        memory: async () => { reconcileCalls.memory += 1; },
        revision: async () => { reconcileCalls.revision += 1; },
        growth: async () => { reconcileCalls.growth += 1; },
      },
      batchSize: 25,
      workerId: `pp12b-restart-${RUN_ID}`,
    });
    expect(healed.processed).toBeGreaterThanOrEqual(1);
    // Memory is NOT repeated; only the failed revision + pending Growth ran.
    expect(reconcileCalls.memory).toBe(0);
    expect(reconcileCalls.revision).toBe(1);
    expect(reconcileCalls.growth).toBe(1);
    const final = await replicaStore.findByCommittedEvidenceId(committedEvidenceId);
    expect(final!.memoryState).toBe('SUCCEEDED');
    expect(final!.revisionState).toBe('SUCCEEDED');
    expect(final!.growthState).toBe('SUCCEEDED');
    // Post-recovery reconcile performs zero duplicate effects.
    const quiet = await reconcilePracticePadLearningProjections({
      store: replicaStore,
      projectors: {
        memory: async () => { reconcileCalls.memory += 1; },
        revision: async () => { reconcileCalls.revision += 1; },
        growth: async () => { reconcileCalls.growth += 1; },
      },
      batchSize: 25,
      workerId: `pp12b-quiet-${RUN_ID}`,
    });
    expect(quiet.processed).toBe(0);
    expect(reconcileCalls).toEqual({ memory: 0, revision: 1, growth: 1 });
  });

  it('concurrent reconcilers never duplicate a projection effect', async () => {
    const attemptId = `attempt-${RUN_ID}-race`;
    const idempotencyKey = `idem-${RUN_ID}-race`;
    const committedEvidenceId = `cev-${RUN_ID}-race`;
    await practicePadProjectionReceiptStore.ensureReceipt({
      schoolId: SCHOOL,
      studentId: LEARNER,
      attemptId,
      idempotencyKey,
      committedEvidenceId,
      candidateJson: '{"attemptId":"race"}',
    });
    const storeA = createPracticePadProjectionReceiptStore(freshClient as never);
    const calls = { memory: 0, revision: 0, growth: 0 };
    const slowProjectors: PracticeProjectionProjectors = {
      memory: async () => { calls.memory += 1; await new Promise((r) => setTimeout(r, 50)); },
      revision: async () => { calls.revision += 1; await new Promise((r) => setTimeout(r, 50)); },
      growth: async () => { calls.growth += 1; await new Promise((r) => setTimeout(r, 50)); },
    };
    const [ra, rb] = await Promise.all([
      reconcilePracticePadLearningProjections({
        store: practicePadProjectionReceiptStore,
        projectors: slowProjectors,
        batchSize: 25,
        workerId: `pp12b-racer-A-${RUN_ID}`,
      }),
      reconcilePracticePadLearningProjections({
        store: storeA,
        projectors: slowProjectors,
        batchSize: 25,
        workerId: `pp12b-racer-B-${RUN_ID}`,
      }),
    ]);
    const totalProcessed = ra.processed + rb.processed;
    expect(totalProcessed).toBeGreaterThanOrEqual(1);
    // One logical memory / revision / Growth projection each — no doubles.
    expect(calls.memory).toBe(1);
    expect(calls.revision).toBe(1);
    expect(calls.growth).toBe(1);
    const final = await practicePadProjectionReceiptStore.findByCommittedEvidenceId(committedEvidenceId);
    expect(final!.memoryState).toBe('SUCCEEDED');
    expect(final!.revisionState).toBe('SUCCEEDED');
    expect(final!.growthState).toBe('SUCCEEDED');
  });

  it('failed commits, stale checks and foreign ownership mutate nothing', async () => {
    const noopProjectors = {
      memory: async () => undefined,
      revision: async () => undefined,
      growth: async () => undefined,
    };
    // Commit failure → zero downstream mutation.
    let projectorRan = 0;
    const counting = {
      memory: async () => { projectorRan += 1; },
      revision: async () => { projectorRan += 1; },
      growth: async () => { projectorRan += 1; },
    };
    const failed = await integratePracticePadLearning(
      makeKernelDeps({
        attemptId: `attempt-${RUN_ID}-nocommit`,
        checkId: `check-${RUN_ID}-nocommit`,
        idempotencyKey: `idem-${RUN_ID}-nocommit`,
        committer: async () => ({ ok: false, code: 'LEDGER_DOWN', message: 'ledger unavailable (injected)' }),
        projectors: counting as never,
      }) as never,
    );
    expect(failed.ok).toBe(false);
    if (!failed.ok) expect(failed.code).toBe('EVIDENCE_COMMIT_FAILED');
    expect(projectorRan).toBe(0);
    const throwing = await integratePracticePadLearning(
      makeKernelDeps({
        attemptId: `attempt-${RUN_ID}-throw`,
        checkId: `check-${RUN_ID}-throw`,
        idempotencyKey: `idem-${RUN_ID}-throw`,
        committer: async () => { throw new Error('DB unavailable before commit (injected)'); },
        projectors: counting as never,
      }) as never,
    );
    expect(throwing.ok).toBe(false);
    expect(projectorRan).toBe(0);
    // Stale check → committer never invoked.
    let committerRan = false;
    const stale = await integratePracticePadLearning(
      makeKernelDeps({
        attemptId: `attempt-${RUN_ID}-stale`,
        checkId: `check-${RUN_ID}-stale`,
        idempotencyKey: `idem-${RUN_ID}-stale`,
        committer: async () => {
          committerRan = true;
          return { ok: true, committedEvidenceId: `cev-${RUN_ID}-stale` };
        },
        projectors: noopProjectors as never,
        staleCheck: true,
      }) as never,
    );
    expect(stale.ok).toBe(false);
    expect(committerRan).toBe(false);
    // Foreign learner/school attempt → ownership binding fails closed.
    committerRan = false;
    const foreign = await integratePracticePadLearning(
      makeKernelDeps({
        attemptId: `attempt-${RUN_ID}-foreign`,
        checkId: `check-${RUN_ID}-foreign`,
        idempotencyKey: `idem-${RUN_ID}-foreign`,
        committer: async () => {
          committerRan = true;
          return { ok: true, committedEvidenceId: `cev-${RUN_ID}-foreign` };
        },
        projectors: noopProjectors as never,
        attemptSchool: 'other-school',
        attemptStudent: 'other-learner',
      }) as never,
    );
    expect(foreign.ok).toBe(false);
    expect(committerRan).toBe(false);
    // Foreign receipt is never reconciled under another learner's scope.
    await practicePadProjectionReceiptStore.ensureReceipt({
      schoolId: 'other-school',
      studentId: 'other-learner',
      attemptId: `attempt-${RUN_ID}-foreign`,
      idempotencyKey: `idem-${RUN_ID}-foreign`,
      committedEvidenceId: `cev-${RUN_ID}-foreign`,
      candidateJson: '{}',
    });
    const scoped = await reconcilePracticePadLearningProjections({
      store: practicePadProjectionReceiptStore,
      projectors: {
        memory: async () => { projectorRan += 1; },
        revision: async () => { projectorRan += 1; },
        growth: async () => { projectorRan += 1; },
      },
      batchSize: 25,
      workerId: `pp12b-scope-${RUN_ID}`,
      scope: { schoolId: SCHOOL, studentId: LEARNER },
    });
    expect(scoped.skippedScope).toBeGreaterThanOrEqual(1);
    const untouched = await practicePadProjectionReceiptStore.findByCommittedEvidenceId(`cev-${RUN_ID}-foreign`);
    expect(untouched!.memoryState).toBe('PENDING');
    expect(untouched!.revisionState).toBe('PENDING');
    expect(untouched!.growthState).toBe('PENDING');
  });

  it('bounded load completes without unbounded scans or retry loops', async () => {
    // 150 observations on one attempt: history reads respect caps.
    const attemptBound = `attempt-${RUN_ID}-bound`;
    const owner = {
      getPracticeAttempt: async (_id: unknown, id: string) =>
        id === attemptBound ? { attemptId: id, schoolId: SCHOOL, studentId: LEARNER } : null,
    };
    const t0 = Date.now();
    for (let i = 0; i < 150; i += 1) {
      const res = await recordIntegrityObservation(
        { schoolId: SCHOOL, studentId: LEARNER, verifiedSchool: true },
        { attemptId: attemptBound, eventId: `evt-${RUN_ID}-cap${i}`, eventType: 'PRACTICE_VISIBLE', metadata: { workChars: i } },
        { attemptOwner: owner as never },
      );
      expect(res.ok).toBe(true);
    }
    const capped = await practicePadIntegrityStore.listObservationsByAttempt(attemptBound, 50);
    expect(capped.total).toBe(150);
    expect(capped.rows.length).toBe(50);
    // 60 pending receipts, bounded batch of 20 per run.
    for (let i = 0; i < 60; i += 1) {
      await practicePadProjectionReceiptStore.ensureReceipt({
        schoolId: SCHOOL,
        studentId: LEARNER,
        attemptId: `attempt-${RUN_ID}-load${i}`,
        idempotencyKey: `idem-${RUN_ID}-load${i}`,
        committedEvidenceId: `cev-${RUN_ID}-load${i}`,
        candidateJson: '{}',
      });
    }
    const peek = await practicePadProjectionReceiptStore.listIncomplete(5);
    expect(peek.length).toBeLessThanOrEqual(5);
    const run1 = await reconcilePracticePadLearningProjections({
      store: practicePadProjectionReceiptStore,
      projectors: { memory: async () => undefined, revision: async () => undefined, growth: async () => undefined },
      batchSize: 20,
      workerId: `pp12b-load-${RUN_ID}`,
    });
    expect(run1.processed).toBeLessThanOrEqual(20);
    const elapsedMs = Date.now() - t0;
    // eslint-disable-next-line no-console
    console.log(`PP12-B bounded load: 150 observations + 60 receipts in ${elapsedMs}ms (LOCAL TEST OBSERVATION ONLY, not a production SLA).`);
  });
});
