// ─────────────────────────────────────────────────────────────
// Steadfast AI — Practice Pad PP-12 (C):
// isolated backup → restore proof.
//
// Same isolated-DB guard as PP-12 (A/B). Seeds representative Practice
// Pad durable state into the isolated test database, backs it up with
// PostgreSQL-native tooling, restores into a DIFFERENT isolated
// database, and reads the restored lineage back through authoritative
// queries. Backup-file existence alone is never proof.
//
// Requires pg_dump + pg_restore on PATH; when genuinely unavailable the
// suite skips and PP-12 backup/restore acceptance stays BLOCKED (never
// PASS). Never touches owner/dev databases; never prints credentials.
// ─────────────────────────────────────────────────────────────

import { describe, it, expect, afterAll, vi } from 'vitest';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { execFileSync } from 'child_process';
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

function pgToolsAvailable(): boolean {
  try {
    execFileSync('pg_dump', ['--version'], { stdio: 'ignore' });
    execFileSync('pg_restore', ['--version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

const RUN_TOOLS = pgToolsAvailable();
const RUN_ID = `pp12c-${Date.now()}`;
const SCHOOL = `school-${RUN_ID}`;
const LEARNER = `learner-${RUN_ID}`;
const ATTEMPT = `attempt-${RUN_ID}`;

const PP_TABLES = [
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
];

function dbParts(url: string): { host: string; port: string; user: string; password: string; database: string } {
  const u = new URL(url);
  return {
    host: u.hostname,
    port: u.port || '5432',
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: u.pathname.replace(/^\//, '').split('?')[0],
  };
}

describe.skipIf(!RUN_REAL || !RUN_TOOLS)('Practice Pad PP-12 (C) — isolated backup restores lineage', () => {
  afterAll(async () => {
    await (prisma as any).$disconnect().catch(() => undefined);
  });

  it('representative state backs up and restores into a separate database', async () => {
    const parts = dbParts(TEST_URL);
    const env = { ...process.env, PGPASSWORD: parts.password };
    const backupFile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'pp12-backup-')), 'pp12.dump');

    // 1. Seed representative durable state (RUN_ID-scoped).
    await (prisma as any).$executeRawUnsafe(
      `INSERT INTO "PracticeProblem"
         ("problemId","problemVersion","schoolId","sourceType","sourceRef","prompt","evaluationType","validationStatus")
       VALUES ($1,1,$2,'governed_bank','pp12c-seed','Restore 2x+3=11.','deterministic','READY')`,
      `problem-${RUN_ID}`, SCHOOL,
    );
    await (prisma as any).$executeRawUnsafe(
      `INSERT INTO "PracticePadDocument" ("documentId","attemptId","schoolId","studentId","currentVersion")
       VALUES ($1,$2,$3,$4,2)`,
      `doc-${RUN_ID}`, ATTEMPT, SCHOOL, LEARNER,
    );
    for (const v of [1, 2]) {
      await (prisma as any).$executeRawUnsafe(
        `INSERT INTO "PracticePadDocumentRevision"
           ("revisionId","documentId","attemptId","version","schoolId","studentId","contentJson","contentHash")
         VALUES ($1,$2,$3,$4,$5,$6,'{"blocks":[]}',$7)`,
        `rev-${RUN_ID}-v${v}`, `doc-${RUN_ID}`, ATTEMPT, v, SCHOOL, LEARNER, `hash-${RUN_ID}-v${v}`,
      );
    }
    await (prisma as any).$executeRawUnsafe(
      `INSERT INTO "PracticePadCheck"
         ("scopeHash","checkId","schoolId","studentId","attemptId","basedOnVersion","idempotencyKey",
          "fingerprint","status","evaluationMode","evidenceEligible","resultJson")
       VALUES ($1,$2,$3,$4,$5,2,'idem-pp12c','fp-pp12c','CONFIRMED_CORRECT','deterministic',true,'{}')`,
      `scope-${RUN_ID}`, `check-${RUN_ID}`, SCHOOL, LEARNER, ATTEMPT,
    );
    await (prisma as any).$executeRawUnsafe(
      `INSERT INTO "PracticePadInterpretation"
         ("interpretationId","schoolId","studentId","attemptId","documentVersion",
          "sourceBlockId","sourceContentHash","candidatesJson","status")
       VALUES ($1,$2,$3,$4,2,'block-1',$5,'[]','CONFIRMED')`,
      `interp-${RUN_ID}`, SCHOOL, LEARNER, ATTEMPT, `hash-${RUN_ID}-v2`,
    );
    await (prisma as any).$executeRawUnsafe(
      `INSERT INTO "PracticePadIntegrityObservation"
         ("eventId","schoolId","studentId","attemptId","eventType","serverSeq","metadataJson")
       VALUES ($1,$2,$3,$4,'PRACTICE_VISIBLE',1,'{}')`,
      `evt-${RUN_ID}`, SCHOOL, LEARNER, ATTEMPT,
    );
    await (prisma as any).$executeRawUnsafe(
      `INSERT INTO "PracticePadIntegrityEvidence"
         ("scopeHash","integrityEvidenceId","schoolId","studentId","attemptId",
          "basedOnAttemptVersion","idempotencyKey","concernLevel","confidence",
          "recommendedNextEvidenceAction","fingerprint","resultJson")
       VALUES ($1,$2,$3,$4,$5,2,'idem-pp12c','LOW',0.4,'collect_more_evidence','fp-ev-pp12c','{}')`,
      `evscope-${RUN_ID}`, `inev-${RUN_ID}`, SCHOOL, LEARNER, ATTEMPT,
    );
    await (prisma as any).$executeRawUnsafe(
      `INSERT INTO "PracticeCanonicalIdempotency"
         ("id","schoolId","learnerId","requestHash","attemptId","committedEvidenceId","masteryApplied")
       VALUES ($1,$2,$3,$4,$5,$6,true)`,
      `idemrow-${RUN_ID}`, SCHOOL, LEARNER, `hash-${RUN_ID}`, ATTEMPT, `cev-${RUN_ID}`,
    );
    await (prisma as any).$executeRawUnsafe(
      `INSERT INTO "PracticePadProjectionReceipt"
         ("receiptKey","schoolId","studentId","attemptId","idempotencyKey",
          "committedEvidenceId","candidateJson","memoryState","revisionState","growthState")
       VALUES ($1,$2,$3,$4,'idem-pp12c',$5,'{}','SUCCEEDED','SUCCEEDED','PENDING')`,
      `receipt-${RUN_ID}`, SCHOOL, LEARNER, ATTEMPT, `cev-${RUN_ID}`,
    );
    const before: Record<string, number> = {};
    for (const table of PP_TABLES) {
      const rows = await (prisma as any).$queryRawUnsafe<any[]>(
        `SELECT COUNT(*) AS "count" FROM "${table}" WHERE ("schoolId" = $1 OR "learnerId" = $1)`,
        // PracticeCanonicalIdempotency uses learnerId instead of studentId.
        SCHOOL,
      ).catch(() => null);
      before[table] = rows ? Number(rows[0]?.count ?? 0) : -1;
    }

    // 2. Back up ONLY the Practice Pad tables (never the whole server).
    const dumpArgs = [
      '-h', parts.host, '-p', parts.port, '-U', parts.user, '-d', parts.database,
      '-F', 'c', '-f', backupFile,
      ...PP_TABLES.flatMap((t) => ['-t', `public."${t}"`]),
    ];
    execFileSync('pg_dump', dumpArgs, { env, stdio: 'pipe' });
    const stat = fs.statSync(backupFile);
    expect(stat.size).toBeGreaterThan(0);

    // 3. Restore into the DIFFERENT isolated database.
    const restoreUrl = TEST_URL.replace(parts.database, 'pp12_restore_test');
    const rparts = dbParts(restoreUrl);
    const renv = { ...process.env, PGPASSWORD: rparts.password };
    const dropSql = PP_TABLES.map((t) => `DROP TABLE IF EXISTS "${t}" CASCADE;`).join('\n');
    execFileSync('psql', ['-h', rparts.host, '-p', rparts.port, '-U', rparts.user, '-d', rparts.database, '-c', dropSql], { env: renv, stdio: 'pipe' });
    execFileSync(
      'pg_restore',
      ['-h', rparts.host, '-p', rparts.port, '-U', rparts.user, '-d', rparts.database, backupFile],
      { env: renv, stdio: 'pipe' },
    );

    // 4. Read the restored lineage through a fresh client.
    const restoreClient = new PrismaClient({ datasources: { db: { url: restoreUrl } } });
    try {
      const q = (sql: string, ...args: unknown[]) => (restoreClient as any).$queryRawUnsafe(sql, ...args);
      const problem = await q(`SELECT "problemId","validationStatus" FROM "PracticeProblem" WHERE "problemId" = $1`, `problem-${RUN_ID}`);
      expect(problem.length).toBe(1);
      expect(problem[0].validationStatus).toBe('READY');
      const revs = await q(
        `SELECT "version","contentHash" FROM "PracticePadDocumentRevision" WHERE "attemptId" = $1 ORDER BY "version" ASC`,
        ATTEMPT,
      );
      expect(revs.length).toBe(2);
      expect(revs[1].contentHash).toBe(`hash-${RUN_ID}-v2`);
      const doc = await q(`SELECT "currentVersion" FROM "PracticePadDocument" WHERE "attemptId" = $1`, ATTEMPT);
      expect(Number(doc[0].currentVersion)).toBe(2); // document head ↔ revision lineage survives
      const check = await q(`SELECT "status","basedOnVersion" FROM "PracticePadCheck" WHERE "attemptId" = $1`, ATTEMPT);
      expect(check.length).toBe(1);
      expect(check[0].status).toBe('CONFIRMED_CORRECT');
      expect(Number(check[0].basedOnVersion)).toBe(2); // check ↔ document version lineage survives
      const interp = await q(`SELECT "status" FROM "PracticePadInterpretation" WHERE "attemptId" = $1`, ATTEMPT);
      expect(interp[0].status).toBe('CONFIRMED');
      const obs = await q(`SELECT "serverSeq" FROM "PracticePadIntegrityObservation" WHERE "eventId" = $1`, `evt-${RUN_ID}`);
      expect(Number(obs[0].serverSeq)).toBe(1);
      const inev = await q(`SELECT "concernLevel" FROM "PracticePadIntegrityEvidence" WHERE "integrityEvidenceId" = $1`, `inev-${RUN_ID}`);
      expect(inev[0].concernLevel).toBe('LOW');
      const idem = await q(`SELECT "committedEvidenceId","masteryApplied" FROM "PracticeCanonicalIdempotency" WHERE "id" = $1`, `idemrow-${RUN_ID}`);
      expect(idem[0].committedEvidenceId).toBe(`cev-${RUN_ID}`);
      expect(idem[0].masteryApplied).toBe(true);
      const receipt = await q(`SELECT "memoryState","revisionState","growthState" FROM "PracticePadProjectionReceipt" WHERE "receiptKey" = $1`, `receipt-${RUN_ID}`);
      expect(receipt[0]).toMatchObject({ memoryState: 'SUCCEEDED', revisionState: 'SUCCEEDED', growthState: 'PENDING' });
    } finally {
      await restoreClient.$disconnect().catch(() => undefined);
    }
    // eslint-disable-next-line no-console
    console.log(`PP12-C backup/restore: dump bytes=${stat.size} (LOCAL TEST OBSERVATION ONLY).`);
  });
});
