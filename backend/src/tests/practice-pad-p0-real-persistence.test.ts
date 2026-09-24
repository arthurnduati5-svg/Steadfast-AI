// ─────────────────────────────────────────────────────────────
// Steadfast AI — Practice Pad PP-01 (R4):
// real PostgreSQL durability proof.
//
// Runs ONLY against an explicitly provided isolated local test database:
//   PP01_TEST_DATABASE_URL must be set AND DATABASE_URL must equal it,
//   and the URL must be localhost with a test-only database name.
// Anything else (notably the root managed Supabase database) refuses
// loudly instead of running. When PP01_TEST_DATABASE_URL is unset the
// suite skips and durability stays UNVERIFIED.
//
// Run (PowerShell):
//   $env:PP01_TEST_DATABASE_URL='postgresql://postgres@localhost:8000/steadfast_learning_evidence_test'
//   $env:DATABASE_URL=$env:PP01_TEST_DATABASE_URL
//   $env:DIRECT_URL=$env:PP01_TEST_DATABASE_URL
//   npx prisma migrate deploy   # normal migration mechanism (test DB only)
//   npx vitest run --config vitest.pp01-persistence.config.mts
// (The dedicated config installs NO global ../lib/prisma mock, mirroring
// the r8g3a-d1c real-DB precedent, so the production singleton talks to
// the isolated test database.)
//
// Proves: seed→read-back, monotonic advance, idempotent claim, identical
// replay, conflicting replay rejection, fresh-context reread from
// PostgreSQL, fail-closed on database failure (never a Map fallback),
// and no successful create-through-owner without durable persistence.
// Zero live model calls.
// ─────────────────────────────────────────────────────────────

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import * as path from 'path';
import { config } from 'dotenv';

// Backend .env supplies JWT_SECRET etc.; never overrides the operator's
// explicitly exported DATABASE_URL/PP01_TEST_DATABASE_URL wiring.
config({ path: path.resolve(__dirname, '../../.env') });

// Hermetic external dependency only (mirrors the default setup file).
// The persistence boundary (../lib/prisma) is deliberately NOT mocked.
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
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import prisma from '../lib/prisma';
import { practiceAttemptService, _clearAttemptStoreForTest } from '../services/practiceAttemptService';
import { practicePadWorkVersionStore } from '../services/practicePadRuntime/practicePadWorkVersionStore';
import {
  practicePadCheckStore,
  practicePadCheckScopeHash,
} from '../services/practicePadRuntime/practicePadCheckStore';
import {
  checkPracticePadStepCanonical,
  type PracticePadVerifiedIdentity,
} from '../services/practicePadRuntime/practicePadCheckRuntime';
import { PracticePadPersistenceError } from '../services/practicePadRuntime/practicePadCheckContracts';
import { practicePadProblemAuthority } from '../services/practicePadRuntime/practicePadProblemAuthority';
import aiAssessmentRoutes from '../routes/ai/ai-assessment.routes';

const TEST_URL = process.env.PP01_TEST_DATABASE_URL || '';
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

// Loud refusal when an operator explicitly asked for the proof but the
// wiring is unsafe; silent skip when the proof was never requested.
if (TEST_URL && (ACTIVE_URL !== TEST_URL || !isIsolatedTestUrl(TEST_URL))) {
  throw new Error(
    'PP-01 real-DB proof refused: set PP01_TEST_DATABASE_URL to an isolated localhost test database URL ' +
    'AND set DATABASE_URL (and DIRECT_URL) to the same value. Refusing to run against any other database.',
  );
}

const RUN_REAL = !!TEST_URL && ACTIVE_URL === TEST_URL && isIsolatedTestUrl(TEST_URL);

const RUN_ID = `pp01real-${Date.now()}`;
const SCHOOL = `school-${RUN_ID}`;
const LEARNER = `learner-${RUN_ID}`;
const identity: PracticePadVerifiedIdentity = { schoolId: SCHOOL, studentId: LEARNER, verifiedSchool: true };

const createdAttemptIds: string[] = [];
let freshClient: PrismaClient | null = null;

async function rawVersion(client: { $queryRawUnsafe: (sql: string, ...args: unknown[]) => Promise<any[]> }, attemptId: string): Promise<number | null> {
  const rows = await client.$queryRawUnsafe(`SELECT "version" FROM "PracticePadWorkVersion" WHERE "attemptId" = $1 LIMIT 1`, attemptId);
  return rows[0] ? Number(rows[0].version) : null;
}

describe.skipIf(!RUN_REAL)('Practice Pad PP-01 — real PostgreSQL durability proof', () => {
  beforeAll(async () => {
    // The PP-01 additive migration must already be applied through the
    // normal migration mechanism (prisma migrate deploy on the test DB).
    // Missing table = hard failure here, never CREATE TABLE from runtime.
    await (prisma as any).$queryRawUnsafe(`SELECT 1 FROM "PracticePadCheck" LIMIT 1`);
    await (prisma as any).$queryRawUnsafe(`SELECT 1 FROM "PracticePadWorkVersion" LIMIT 1`);
    practicePadProblemAuthority.registerProblem({
      problemId: `prob-${RUN_ID}`,
      prompt: 'What is 6 × 7?',
      subject: 'maths',
      topic: 'arithmetic',
      allowedResources: [],
      expectedAnswer: '42',
      evaluationPlan: 'numeric-equality',
      schoolId: SCHOOL,
    });
  });

  afterAll(async () => {
    try {
      for (const attemptId of createdAttemptIds) {
        await (prisma as any).$executeRawUnsafe(`DELETE FROM "PracticePadCheck" WHERE "attemptId" = $1`, attemptId).catch(() => {});
        await (prisma as any).$executeRawUnsafe(`DELETE FROM "PracticePadWorkVersion" WHERE "attemptId" = $1`, attemptId).catch(() => {});
        await (prisma as any).practiceAttempt.deleteMany({ where: { id: attemptId } }).catch(() => {});
      }
    } finally {
      if (freshClient) await freshClient.$disconnect().catch(() => {});
    }
  });

  it('attempt creation through the canonical owner is durably persisted', async () => {
    const created = await practiceAttemptService.createPracticeAttempt(
      { schoolId: SCHOOL, studentId: LEARNER },
      {
        kind: 'open_response',
        promptSummary: 'What is 6 × 7?',
        subject: 'maths',
        topic: 'arithmetic',
        sourceQuestionId: `prob-${RUN_ID}`,
        outcome: 'not_evaluated',
      },
    );
    expect(created.persisted).toBe(true);
    createdAttemptIds.push(created.attempt.attemptId);
    const row = await (prisma as any).practiceAttempt.findUnique({ where: { id: created.attempt.attemptId } });
    expect(row).not.toBeNull();
    expect(row.schoolId).toBe(SCHOOL);
  });

  it('seeds a work version and reads it back from PostgreSQL', async () => {
    const attemptId = createdAttemptIds[0];
    const seeded = await practicePadWorkVersionStore.seedVersion(attemptId, 1);
    expect(seeded).toBe(1);
    expect(await rawVersion(prisma as any, attemptId)).toBe(1);
  });

  it('identical idempotent replay resolves the same logical check; conflict is rejected', async () => {
    const attemptId = createdAttemptIds[0];
    const base = { attemptId, basedOnVersion: 1, idempotencyKey: `k-${RUN_ID}`, workText: '42', selectedStep: null };
    const first = await checkPracticePadStepCanonical(identity, base);
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.result.status).toBe('CONFIRMED_CORRECT');

    const record = await practicePadCheckStore.findByScope(
      practicePadCheckScopeHash(attemptId, 1, `k-${RUN_ID}`),
    );
    expect(record).not.toBeNull();
    expect(record!.checkId).toBe(first.result.checkId);

    const replay = await checkPracticePadStepCanonical(identity, base);
    expect(replay.ok).toBe(true);
    if (replay.ok) {
      expect(replay.result.checkId).toBe(first.result.checkId);
      expect(replay.result.deduplicated).toBe(true);
    }

    const conflict = await checkPracticePadStepCanonical(identity, { ...base, workText: '43' });
    expect(conflict.ok).toBe(false);
    if (!conflict.ok) {
      expect(conflict.status).toBe('CONFLICT');
      expect(conflict.failureCategory).toBe('duplicate_conflict');
      expect(conflict.currentFeedbackEligible).toBe(false);
    }
  });

  it('version advances monotonically and never moves backwards', async () => {
    const attemptId = createdAttemptIds[0];
    expect(await practicePadWorkVersionStore.submitWork(attemptId)).toBe(2);
    expect(await rawVersion(prisma as any, attemptId)).toBe(2);
    expect(await practicePadWorkVersionStore.seedVersion(attemptId, 1)).toBe(2);
    expect(await rawVersion(prisma as any, attemptId)).toBe(2);
  });

  it('a stale-version check is retained historically, never current feedback', async () => {
    const attemptId = createdAttemptIds[0];
    const stale = await checkPracticePadStepCanonical(identity, {
      attemptId,
      basedOnVersion: 1,
      idempotencyKey: `k-stale-${RUN_ID}`,
      workText: '42',
      selectedStep: null,
    });
    expect(stale.ok).toBe(true);
    if (stale.ok) {
      expect(stale.result.status).toBe('STALE_VERSION');
      expect(stale.result.currentFeedbackEligible).toBe(false);
      expect(stale.result.evidenceCandidate).toBeNull();
    }
  });

  it('a fresh owner context rereads the same version and check from PostgreSQL', async () => {
    const attemptId = createdAttemptIds[0];
    // Fresh connection, no shared process state: durability must live in
    // PostgreSQL, not in any process-local cache.
    freshClient = new PrismaClient({ datasources: { db: { url: TEST_URL } } });
    await freshClient.$connect();
    expect(await rawVersion(freshClient as any, attemptId)).toBe(2);
    const rows = await (freshClient as any).$queryRawUnsafe<any[]>(
      `SELECT "checkId", "fingerprint" FROM "PracticePadCheck" WHERE "attemptId" = $1 AND "basedOnVersion" = 1 AND "idempotencyKey" = $2 LIMIT 1`,
      attemptId,
      `k-${RUN_ID}`,
    );
    expect(rows[0]).toBeDefined();
    const winner = await practicePadCheckStore.findByScope(
      practicePadCheckScopeHash(attemptId, 1, `k-${RUN_ID}`),
    );
    expect(winner!.checkId).toBe(String(rows[0].checkId));
  });

  it('protected runtime fails closed when persistence answers with failure', async () => {
    const attemptId = createdAttemptIds[0];
    const req = { attemptId, basedOnVersion: 2, idempotencyKey: `k-fc-${RUN_ID}`, workText: '42', selectedStep: null };

    const versionsDown = { getCurrentVersion: async () => { throw new Error('db down'); } };
    const checksDown = {
      findByScope: async () => { throw new Error('db down'); },
      insertRecord: async () => { throw new Error('db down'); },
    };
    const ownerDown = { getPracticeAttempt: async () => { throw new Error('db down'); } };

    for (const deps of [{ versions: versionsDown }, { checks: checksDown }, { attemptOwner: ownerDown }]) {
      const outcome = await checkPracticePadStepCanonical(identity, req, deps as never);
      expect(outcome.ok).toBe(false);
      if (!outcome.ok) {
        expect(outcome.status).toBe('FAILED_CLOSED');
        expect(outcome.failureCategory).toBe('database_unavailable');
        expect(outcome.currentFeedbackEligible).toBe(false);
      }
    }
    // No evidence candidate could have been committed by a failed check:
    // the scope was never claimed.
    expect(
      await practicePadCheckStore.findByScope(practicePadCheckScopeHash(attemptId, 2, `k-fc-${RUN_ID}`)),
    ).toBeNull();
  });

  it('stores throw typed persistence failures (no Map fallback) and create-through-owner cannot succeed undurably', async () => {
    // Simulate a dead database at the exact driver boundary the stores
    // use. (Prisma auto-reconnects after $disconnect, so a network-level
    // drop is simulated by making the driver throw; the stores must map
    // that to a typed failure, never to a memory success.)
    const singleton = prisma as any;
    const origQueryRawUnsafe = singleton.$queryRawUnsafe.bind(singleton);
    const origExecuteRawUnsafe = singleton.$executeRawUnsafe.bind(singleton);
    const origQueryRaw = singleton.$queryRaw.bind(singleton);
    const origAttemptCreate = singleton.practiceAttempt.create.bind(singleton.practiceAttempt);
    const dbDown = async (): Promise<never> => {
      throw new Error('simulated database outage');
    };
    singleton.$queryRawUnsafe = dbDown;
    singleton.$executeRawUnsafe = dbDown;
    singleton.$queryRaw = dbDown;
    singleton.practiceAttempt.create = dbDown;
    try {
      await expect(practicePadCheckStore.findByScope('dead-scope')).rejects.toBeInstanceOf(PracticePadPersistenceError);
      await expect(practicePadWorkVersionStore.getCurrentVersion('dead-attempt')).rejects.toBeInstanceOf(
        PracticePadPersistenceError,
      );

      const created = await practiceAttemptService.createPracticeAttempt(
        { schoolId: SCHOOL, studentId: LEARNER },
        { kind: 'open_response', promptSummary: 'undurable probe', outcome: 'not_evaluated' },
      );
      expect(created.persisted).toBe(false);
      _clearAttemptStoreForTest();

      const app = express();
      app.use(express.json());
      app.use('/api/ai', aiAssessmentRoutes);
      const token = jwt.sign(
        { userId: LEARNER, role: 'student', schoolId: SCHOOL },
        String(process.env.JWT_SECRET || 'test-secret'),
      );
      const res = await request(app)
        .post('/api/ai/practice-pad/check-step')
        .set('Authorization', `Bearer ${token}`)
        .send({ prompt: 'What is 6 × 7?', workText: '42', idempotencyKey: `k-route-${RUN_ID}` });
      expect(res.status).toBe(503);
      expect(res.body.failureCategory).toBe('database_unavailable');
      expect(res.body.code).toBe('PERSISTENCE_FAILED');
      expect(res.body.currentFeedbackEligible).toBe(false);
    } finally {
      singleton.$queryRawUnsafe = origQueryRawUnsafe;
      singleton.$executeRawUnsafe = origExecuteRawUnsafe;
      singleton.$queryRaw = origQueryRaw;
      singleton.practiceAttempt.create = origAttemptCreate;
      await (prisma as any).$connect();
    }
  });
});
