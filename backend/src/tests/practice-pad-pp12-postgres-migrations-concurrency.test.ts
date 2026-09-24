// ─────────────────────────────────────────────────────────────
// Steadfast AI — Practice Pad PP-12 (A):
// real PostgreSQL migration + concurrency proof.
//
// Runs ONLY against an explicitly provided isolated local test database:
//   PP12_TEST_DATABASE_URL must be set AND DATABASE_URL must equal it,
//   and the URL must be localhost with a test-only database name.
// Anything else refuses loudly instead of running. When
// PP12_TEST_DATABASE_URL is unset the suite skips and PP-12 database
// acceptance stays UNVERIFIED (never PASS).
//
// Required pre-step (isolated test DB only):
//   $env:PP12_TEST_DATABASE_URL='postgresql://postgres:postgres@localhost:8000/pp12_test?schema=public'
//   $env:DATABASE_URL=$env:PP12_TEST_DATABASE_URL
//   $env:DIRECT_URL=$env:PP12_TEST_DATABASE_URL
//   # apply the six Practice Pad migrations needed by PP-12
//   # (20260924 pp01, 20260925 pp02, 20260926 pp03, 20260927 pp08,
//   #  20260928 pp09, 20260929 pp12) via psql -f <migration.sql>
//   npx vitest run --config vitest.pp12-resilience.config.mts
// (Dedicated config installs NO global ../lib/prisma mock, so the
// production singleton talks to the isolated test database.)
//
// Proves PP-12 §21 (1–7): migrations applied, structures exist,
// request-path runtime DDL removed + fail-closed, concurrent writers
// cannot duplicate serverSeq, duplicate events idempotent, no
// process-local concurrency authority. Zero live model calls.
// ─────────────────────────────────────────────────────────────

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import * as path from 'path';
import * as fs from 'fs';
import { config } from 'dotenv';

// Backend .env supplies JWT_SECRET etc.; never overrides the operator's
// explicitly exported DATABASE_URL/PP12_TEST_DATABASE_URL wiring.
config({ path: path.resolve(__dirname, '../../.env') });

// Hermetic external dependency only. The persistence boundary
// (../lib/prisma) is deliberately NOT mocked: this is the real-DB proof.
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
import {
  practicePadIntegrityStore,
  __setPracticePadIntegrityFailWritesForTest,
  type PracticeIntegrityObservationRecord,
} from '../services/practicePadRuntime/practicePadIntegrityStore';
import {
  recordIntegrityObservation,
  type PracticePadIntegrityDependencies,
} from '../services/practicePadRuntime/practicePadIntegrityEngine';
import { PP09_MAX_OBSERVATIONS_PER_ATTEMPT } from '../services/practicePadRuntime/practicePadIntegrityContracts';

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
const RUN_ID = `pp12a-${Date.now()}`;
const SCHOOL = `school-${RUN_ID}`;
const LEARNER = `learner-${RUN_ID}`;
const ATTEMPT = `attempt-${RUN_ID}`;

function attemptOwnerFor(attemptId: string, schoolId = SCHOOL, studentId = LEARNER) {
  return {
    getPracticeAttempt: async (_id: unknown, id: string) =>
      id === attemptId ? { attemptId: id, schoolId, studentId } : null,
  };
}

async function tableExists(table: string): Promise<boolean> {
  const rows = await (prisma as any).$queryRawUnsafe<any[]>(
    `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1`,
    table,
  );
  return Array.isArray(rows) && rows.length > 0;
}

async function indexExists(index: string): Promise<boolean> {
  const rows = await (prisma as any).$queryRawUnsafe<any[]>(
    `SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = $1`,
    index,
  );
  return Array.isArray(rows) && rows.length > 0;
}

// ── Second independent replica: separate PrismaClient (own pool, no shared
// JS state with the production singleton) over the SAME isolated database.
// Coordination between replicas happens only inside PostgreSQL. ──
let replicaClient: PrismaClient | null = null;

function mapReplicaObservationRow(row: any): PracticeIntegrityObservationRecord {
  return {
    eventId: String(row.eventId),
    schoolId: String(row.schoolId),
    studentId: String(row.studentId),
    attemptId: String(row.attemptId),
    eventType: String(row.eventType),
    clientObservedAt: row.clientObservedAt ? String(row.clientObservedAt) : null,
    serverReceivedAt: row.serverReceivedAt?.toISOString?.() || String(row.serverReceivedAt),
    serverSeq: Number(row.serverSeq),
    outOfOrder: Boolean(row.outOfOrder),
    metadataJson: String(row.metadataJson ?? '{}'),
    createdAt: row.createdAt?.toISOString?.() || String(row.createdAt),
  };
}

async function replicaFind(client: PrismaClient, eventId: string) {
  try {
    const rows = await (client as any).$queryRawUnsafe<any[]>(
      `SELECT * FROM "PracticePadIntegrityObservation" WHERE "eventId" = $1 LIMIT 1`,
      eventId,
    );
    return rows[0] ? mapReplicaObservationRow(rows[0]) : null;
  } catch {
    return null;
  }
}

function makeReplicaIntegrityStore(client: PrismaClient) {
  return {
    async findObservation(eventId: string) {
      return replicaFind(client, eventId);
    },
    async listObservationsByAttempt(attemptId: string, limit: number) {
      const countRows = await (client as any).$queryRawUnsafe<any[]>(
        `SELECT COUNT(*) AS "count" FROM "PracticePadIntegrityObservation" WHERE "attemptId" = $1`,
        attemptId,
      );
      const total = Number(countRows?.[0]?.count ?? 0);
      const rows = await (client as any).$queryRawUnsafe<any[]>(
        `SELECT * FROM "PracticePadIntegrityObservation" WHERE "attemptId" = $1 ORDER BY "serverSeq" ASC LIMIT $2`,
        attemptId,
        limit,
      );
      return { rows: (Array.isArray(rows) ? rows : []).map(mapReplicaObservationRow), total };
    },
    async insertObservationAtomic(record: Omit<PracticeIntegrityObservationRecord, 'serverSeq'>) {
      // Same cross-replica contract as the production store: single
      // statement allocation + bounded retry under DB authority. No shared
      // JS state with the primary instance; PostgreSQL decides.
      for (let attempt = 0; attempt <= 25; attempt += 1) {
        try {
          const rows = await (client as any).$queryRawUnsafe<any[]>(
            `INSERT INTO "PracticePadIntegrityObservation"
               ("eventId", "schoolId", "studentId", "attemptId", "eventType",
                "clientObservedAt", "serverReceivedAt", "serverSeq", "outOfOrder",
                "metadataJson")
             VALUES ($1,$2,$3,$4,$5,$6,$7::timestamp,
               (SELECT COALESCE(MAX("serverSeq"), 0) + 1 FROM "PracticePadIntegrityObservation" WHERE "attemptId" = $4),
               $8,$9)
             RETURNING "serverSeq"`,
            record.eventId, record.schoolId, record.studentId, record.attemptId,
            record.eventType, record.clientObservedAt, record.serverReceivedAt,
            record.outOfOrder, record.metadataJson,
          );
          return { won: true, serverSeq: Number(rows?.[0]?.serverSeq ?? 0) };
        } catch (cause) {
          const existing = await replicaFind(client, record.eventId);
          if (existing) return { won: false, serverSeq: existing.serverSeq };
          if (attempt === 25) throw cause;
        }
      }
      throw new Error('unreachable replica atomic claim exit');
    },
  };
}

describe.skipIf(!RUN_REAL)('Practice Pad PP-12 (A) — real PostgreSQL migration + concurrency', () => {
  beforeAll(async () => {
    replicaClient = new PrismaClient();
  });

  afterAll(async () => {
    __setPracticePadIntegrityFailWritesForTest(false);
    if (replicaClient) await replicaClient.$disconnect().catch(() => undefined);
    await (prisma as any).$disconnect().catch(() => undefined);
  });

  it('PP-12 migrations provisioned every required durable structure', async () => {
    for (const table of [
      'PracticeProblem',
      'PracticePadWorkVersion',
      'PracticePadCheck',
      'PracticePadDocument',
      'PracticePadDocumentRevision',
      'PracticePadInterpretation',
      'PracticePadIntegrityObservation',
      'PracticePadIntegrityEvidence',
      'PracticeCanonicalIdempotency',
      'PracticePadProjectionReceipt',
    ]) {
      expect(await tableExists(table)).toBe(true);
    }
    // PP-12 cross-replica sequence authority + idempotency/receipt keys.
    expect(await indexExists('PracticePadIntegrityObservation_attempt_seq_uidx')).toBe(true);
    expect(await indexExists('PracticeCanonicalIdempotency_school_learner_hash_uidx')).toBe(true);
    expect(await indexExists('PracticePadProjectionReceipt_committedEvidenceId_uidx')).toBe(true);
  });

  it('durable Practice Pad reads/writes succeed through the migrated schema', async () => {
    const problemId = `problem-${RUN_ID}`;
    await (prisma as any).$executeRawUnsafe(
      `INSERT INTO "PracticeProblem"
         ("problemId","problemVersion","schoolId","sourceType","sourceRef","prompt","evaluationType","validationStatus")
       VALUES ($1,1,$2,'governed_bank','pp12-seed','Solve 2x+3=11 deterministically.','deterministic','READY')`,
      problemId, SCHOOL,
    );
    const docId = `doc-${RUN_ID}`;
    await (prisma as any).$executeRawUnsafe(
      `INSERT INTO "PracticePadDocument" ("documentId","attemptId","schoolId","studentId","currentVersion")
       VALUES ($1,$2,$3,$4,1)`,
      docId, ATTEMPT, SCHOOL, LEARNER,
    );
    await (prisma as any).$executeRawUnsafe(
      `INSERT INTO "PracticePadDocumentRevision"
         ("revisionId","documentId","attemptId","version","schoolId","studentId","contentJson","contentHash")
       VALUES ($1,$2,$3,1,$4,$5,'{"blocks":[]}','hash-pp12')`,
      `rev-${RUN_ID}`, docId, ATTEMPT, SCHOOL, LEARNER,
    );
    await (prisma as any).$executeRawUnsafe(
      `INSERT INTO "PracticePadCheck"
         ("scopeHash","checkId","schoolId","studentId","attemptId","basedOnVersion","idempotencyKey",
          "fingerprint","status","evaluationMode","evidenceEligible","resultJson")
       VALUES ($1,$2,$3,$4,$5,1,'idem-pp12','fp-pp12','CONFIRMED_CORRECT','deterministic',true,'{}')`,
      `scope-${RUN_ID}`, `check-${RUN_ID}`, SCHOOL, LEARNER, ATTEMPT,
    );
    await (prisma as any).$executeRawUnsafe(
      `INSERT INTO "PracticePadInterpretation"
         ("interpretationId","schoolId","studentId","attemptId","documentVersion",
          "sourceBlockId","sourceContentHash","candidatesJson","status")
       VALUES ($1,$2,$3,$4,1,'block-1','hash-pp12','[]','CONFIRMED')`,
      `interp-${RUN_ID}`, SCHOOL, LEARNER, ATTEMPT,
    );
    const problems = await (prisma as any).$queryRawUnsafe<any[]>(
      `SELECT "problemId" FROM "PracticeProblem" WHERE "problemId" = $1`, problemId,
    );
    expect(problems.length).toBe(1);
    const checks = await (prisma as any).$queryRawUnsafe<any[]>(
      `SELECT "checkId" FROM "PracticePadCheck" WHERE "attemptId" = $1`, ATTEMPT,
    );
    expect(checks.length).toBe(1);
    const interps = await (prisma as any).$queryRawUnsafe<any[]>(
      `SELECT "interpretationId" FROM "PracticePadInterpretation" WHERE "attemptId" = $1`, ATTEMPT,
    );
    expect(interps.length).toBe(1);
  });

  it('request-path runtime DDL is removed and missing schema fails closed', async () => {
    // Static law: the canonical request path contains no DDL.
    const servicePath = path.resolve(__dirname, '../services/practiceCanonicalLearningService.ts');
    const source = fs.readFileSync(servicePath, 'utf8');
    expect(source).not.toMatch(/CREATE\s+TABLE/i);
    expect(source).not.toMatch(/CREATE\s+(UNIQUE\s+)?INDEX/i);

    // Behavioral law: when the provisioned table is absent the service
    // throws instead of self-provisioning. Simulated by forcing a
    // missing-relation error; the issued SQL must contain no DDL.
    const { commitPracticeLearningEvidence } = await import('../services/practiceCanonicalLearningService');
    const issued: string[] = [];
    const origQuery = (prisma as any).$queryRawUnsafe;
    const origExec = (prisma as any).$executeRawUnsafe;
    (prisma as any).$queryRawUnsafe = async (sql: string, ...rest: unknown[]) => {
      issued.push(String(sql));
      const err: any = new Error('relation "PracticeCanonicalIdempotency" does not exist');
      err.code = '42P01';
      throw err;
    };
    (prisma as any).$executeRawUnsafe = async (sql: string, ...rest: unknown[]) => {
      issued.push(String(sql));
      const err: any = new Error('relation "PracticeCanonicalIdempotency" does not exist');
      err.code = '42P01';
      throw err;
    };
    try {
      await expect(
        commitPracticeLearningEvidence({
          schoolId: SCHOOL,
          learnerId: LEARNER,
          attemptId: `attempt-ddl-${RUN_ID}`,
          clientRequestId: `req-ddl-${RUN_ID}`,
          hintsUsed: 0,
          trustedOutcome: 'correct',
        }),
      ).rejects.toThrow();
    } finally {
      (prisma as any).$queryRawUnsafe = origQuery;
      (prisma as any).$executeRawUnsafe = origExec;
    }
    expect(issued.length).toBeGreaterThan(0);
    for (const sql of issued) {
      expect(sql).not.toMatch(/CREATE\s+TABLE/i);
      expect(sql).not.toMatch(/CREATE\s+(UNIQUE\s+)?INDEX/i);
    }
  });

  it('concurrent writers across two independent instances cannot duplicate serverSeq', async () => {
    const replicaStore = makeReplicaIntegrityStore(replicaClient!);
    const N_PRIMARY = 24;
    const N_REPLICA = 16;
    const attemptOwner = attemptOwnerFor(ATTEMPT);
    const primaryDeps: PracticePadIntegrityDependencies = { attemptOwner: attemptOwner as never };
    const replicaDeps: PracticePadIntegrityDependencies = {
      attemptOwner: attemptOwner as never,
      store: replicaStore as never,
    };
    const t0 = Date.now();
    const primaryCalls = Array.from({ length: N_PRIMARY }, (_, i) =>
      recordIntegrityObservation(
        { schoolId: SCHOOL, studentId: LEARNER, verifiedSchool: true },
        {
          attemptId: ATTEMPT,
          eventId: `evt-${RUN_ID}-p${i}`,
          eventType: 'PRACTICE_VISIBLE',
          clientObservedAt: new Date(t0 + i).toISOString(),
          metadata: { workChars: 100 + i },
        },
        primaryDeps,
      ),
    );
    const replicaCalls = Array.from({ length: N_REPLICA }, (_, i) =>
      recordIntegrityObservation(
        { schoolId: SCHOOL, studentId: LEARNER, verifiedSchool: true },
        {
          attemptId: ATTEMPT,
          eventId: `evt-${RUN_ID}-r${i}`,
          eventType: 'FOCUS_GAINED',
          clientObservedAt: new Date(t0 + 1000 + i).toISOString(),
          metadata: { workChars: 200 + i },
        },
        replicaDeps,
      ),
    );
    const results = await Promise.all([...primaryCalls, ...replicaCalls]);
    const elapsedMs = Date.now() - t0;
    // eslint-disable-next-line no-console
    console.log(`PP12-A concurrency observation: ${N_PRIMARY + N_REPLICA} concurrent writes completed in ${elapsedMs}ms (LOCAL TEST OBSERVATION ONLY, not a production SLA).`);
    for (const res of results) {
      expect(res.ok).toBe(true);
    }
    const { rows, total } = await practicePadIntegrityStore.listObservationsByAttempt(
      ATTEMPT,
      PP09_MAX_OBSERVATIONS_PER_ATTEMPT,
    );
    const ours = rows.filter((r) => r.eventId.startsWith(`evt-${RUN_ID}-p`) || r.eventId.startsWith(`evt-${RUN_ID}-r`));
    expect(total).toBeGreaterThanOrEqual(N_PRIMARY + N_REPLICA);
    expect(ours.length).toBe(N_PRIMARY + N_REPLICA);
    const seqs = ours.map((r) => r.serverSeq).sort((a, b) => a - b);
    expect(new Set(seqs).size).toBe(seqs.length); // unique: no duplicate serverSeq
    for (let i = 1; i < seqs.length; i += 1) {
      expect(seqs[i]).toBeGreaterThan(seqs[i - 1]); // strictly ordered, no lost rows
    }
  });

  it('concurrent duplicate eventId replays yield one durable observation', async () => {
    const attemptOwner = attemptOwnerFor(ATTEMPT);
    const deps: PracticePadIntegrityDependencies = { attemptOwner: attemptOwner as never };
    const sharedEventId = `evt-${RUN_ID}-dup`;
    const calls = Array.from({ length: 12 }, () =>
      recordIntegrityObservation(
        { schoolId: SCHOOL, studentId: LEARNER, verifiedSchool: true },
        {
          attemptId: ATTEMPT,
          eventId: sharedEventId,
          eventType: 'PRACTICE_VISIBLE',
          metadata: { workChars: 50 },
        },
        deps,
      ),
    );
    const results = await Promise.all(calls);
    for (const res of results) expect(res.ok).toBe(true);
    const winners = results.filter((r) => r.ok && !(r as { deduplicated?: boolean }).deduplicated);
    const deduped = results.filter((r) => r.ok && (r as { deduplicated?: boolean }).deduplicated);
    expect(winners.length).toBe(1);
    expect(deduped.length).toBe(11);
    const stored = await practicePadIntegrityStore.findObservation(sharedEventId);
    expect(stored).not.toBeNull();
    expect(stored!.attemptId).toBe(ATTEMPT);
  });

  it('attempt scopes stay isolated from each other', async () => {
    const attemptB = `attempt-${RUN_ID}-B`;
    const deps: PracticePadIntegrityDependencies = {
      attemptOwner: {
        getPracticeAttempt: async (_id: unknown, id: string) =>
          id === attemptB ? { attemptId: id, schoolId: SCHOOL, studentId: LEARNER } : null,
      } as never,
    };
    for (let i = 0; i < 3; i += 1) {
      const res = await recordIntegrityObservation(
        { schoolId: SCHOOL, studentId: LEARNER, verifiedSchool: true },
        { attemptId: attemptB, eventId: `evt-${RUN_ID}-b${i}`, eventType: 'PRACTICE_VISIBLE', metadata: { workChars: 10 } },
        deps,
      );
      expect(res.ok).toBe(true);
    }
    const snapB = await practicePadIntegrityStore.listObservationsByAttempt(attemptB, 10);
    expect(snapB.total).toBe(3);
    expect(snapB.rows.map((r) => r.serverSeq).sort((a, b) => a - b)).toEqual([1, 2, 3]);
    const snapA = await practicePadIntegrityStore.listObservationsByAttempt(ATTEMPT, 5);
    expect(snapA.rows.every((r) => r.attemptId === ATTEMPT)).toBe(true);
  });

  it('database failure fails closed and never punishes the learner', async () => {
    __setPracticePadIntegrityFailWritesForTest(true);
    try {
      const res = await recordIntegrityObservation(
        { schoolId: SCHOOL, studentId: LEARNER, verifiedSchool: true },
        { attemptId: ATTEMPT, eventId: `evt-${RUN_ID}-fail`, eventType: 'PRACTICE_HIDDEN', metadata: { stepCount: 5 } },
        { attemptOwner: attemptOwnerFor(ATTEMPT) as never },
      );
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.code).toBe('PERSISTENCE_FAILED');
        // Failure carries no concern, no evidence, no learner penalty.
        expect((res as { evidence?: unknown }).evidence).toBeUndefined();
        expect((res as { observation?: unknown }).observation).toBeUndefined();
      }
      const missing = await practicePadIntegrityStore
        .findObservation(`evt-${RUN_ID}-fail`)
        .catch(() => null);
      expect(missing).toBeNull();
    } finally {
      __setPracticePadIntegrityFailWritesForTest(false);
    }
  });
});
