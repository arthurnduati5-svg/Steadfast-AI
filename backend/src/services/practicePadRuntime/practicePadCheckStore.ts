// ─────────────────────────────────────────────────────────────
// Steadfast AI — Practice Pad PP-01: durable PracticeCheck owner
//
// One canonical PracticeCheck boundary. A check is bound to
// (attemptId, basedOnVersion, idempotencyKey) via scopeHash.
//
// Durability law (PP-01 §9–§10, production fail-closed):
//   - PostgreSQL is the sole authority. The provisioned
//     "PracticePadCheck" table (see prisma migration
//     20260924000000_pp01_practice_pad_durability) owns each idempotency
//     scope: a UNIQUE slot gives exactly-once logical behavior across
//     retries, restarts, and concurrent identical requests.
//   - Same scope + same fingerprint → same logical check (deduplicated,
//     no duplicate evidence/memory/mastery side effects).
//   - Same scope + different fingerprint → explicit conflict.
//   - Database/table/read/write failure in production THROWS
//     PracticePadPersistenceError. The runtime maps it to FAILED_CLOSED /
//     database_unavailable with no committed result. There is NO
//     process-local authoritative Map: falling back to memory on a real
//     database failure would fabricate protected success.
//   - This module NEVER creates tables at request time. A missing table
//     is a persistence failure, not CREATE TABLE.
//   - Process memory exists ONLY behind __enablePracticePadCheckMemoryForTest,
//     an explicit test seam used solely by focused PP-01 tests that run
//     with Prisma mocked unavailable. Production never enables it, and
//     failure of the database must never implicitly enable it.
//   - Never stores hidden model reasoning or protected answers: only the
//     learner-safe result projection is persisted.
// ─────────────────────────────────────────────────────────────

import { createHash } from 'crypto';
import prisma from '../../lib/prisma';
import type { PracticePadCheckResult } from './practicePadCheckContracts';
import { PracticePadPersistenceError } from './practicePadCheckContracts';

export interface PracticePadCheckRecord {
  scopeHash: string;
  checkId: string;
  schoolId: string;
  studentId: string;
  attemptId: string;
  basedOnVersion: number;
  idempotencyKey: string;
  fingerprint: string;
  status: string;
  evaluationMode: 'deterministic' | 'semantic' | 'degraded';
  evidenceEligible: boolean;
  resultJson: string;
  createdAt: string;
  resolvedAt: string;
}

// ── Explicit test seam ONLY (focused PP-01 tests, Prisma mocked) ──
// Null in production: any database failure then throws instead of
// succeeding from memory.
let testMemory: Map<string, PracticePadCheckRecord> | null = null;
let failWritesForTest = false;

/**
 * Install an explicit in-memory test double. Focused PP-01 tests only.
 * Never called by production code; never inferred from a DB failure.
 */
export function __enablePracticePadCheckMemoryForTest(): void {
  if (!testMemory) testMemory = new Map<string, PracticePadCheckRecord>();
}

/** Force write-path persistence failure. Focused PP-08 durability tests only. */
export function __setPracticePadCheckFailWritesForTest(value: boolean): void {
  failWritesForTest = value;
}

function nowISO(): string {
  return new Date().toISOString();
}

export function practicePadCheckScopeHash(attemptId: string, basedOnVersion: number, idempotencyKey: string): string {
  return createHash('sha256')
    .update(`${attemptId}::${basedOnVersion}::${idempotencyKey}`)
    .digest('hex');
}

function mapRowToRecord(row: any): PracticePadCheckRecord {
  return {
    scopeHash: String(row.scopeHash),
    checkId: String(row.checkId),
    schoolId: String(row.schoolId),
    studentId: String(row.studentId),
    attemptId: String(row.attemptId),
    basedOnVersion: Number(row.basedOnVersion),
    idempotencyKey: String(row.idempotencyKey),
    fingerprint: String(row.fingerprint),
    status: String(row.status),
    evaluationMode: row.evaluationMode as PracticePadCheckRecord['evaluationMode'],
    evidenceEligible: Boolean(row.evidenceEligible),
    resultJson: String(row.resultJson),
    createdAt: row.createdAt?.toISOString?.() || nowISO(),
    resolvedAt: row.resolvedAt?.toISOString?.() || nowISO(),
  };
}

function persistenceFailure(operation: string, cause: unknown): PracticePadPersistenceError {
  return new PracticePadPersistenceError(
    `PracticePadCheck store ${operation} failed; failing closed — no memory fallback. Cause: ${String((cause as Error)?.message || cause)}`,
  );
}

export function parseCheckResult(record: PracticePadCheckRecord): PracticePadCheckResult {
  return JSON.parse(record.resultJson) as PracticePadCheckResult;
}

export const practicePadCheckStore = {
  /**
   * Find the durable check record for an idempotency scope.
   * Throws PracticePadPersistenceError when the database cannot answer
   * and no explicit test double is installed.
   */
  async findByScope(scopeHash: string): Promise<PracticePadCheckRecord | null> {
    try {
      const rows = await (prisma as any).$queryRawUnsafe<any[]>(
        `SELECT * FROM "PracticePadCheck" WHERE "scopeHash" = $1 LIMIT 1`,
        scopeHash,
      );
      if (rows[0]) return mapRowToRecord(rows[0]);
      // Reachable database with no row: the scope is unclaimed. Memory is
      // never consulted here; it is only a fallback when the DB throws.
      return null;
    } catch (cause) {
      if (testMemory) return testMemory.get(scopeHash) || null;
      throw persistenceFailure('read', cause);
    }
  },

  /**
   * Claim an idempotency scope for a completed check.
   * Returns true when this caller won the scope; false when the scope is
   * already owned (caller must re-read the winner and apply same-key /
   * different-fingerprint semantics). Throws PracticePadPersistenceError
   * when the database cannot answer and no explicit test double is
   * installed — never a silent memory success in production.
   */
  async insertRecord(record: PracticePadCheckRecord): Promise<boolean> {
    if (failWritesForTest) {
      throw persistenceFailure('write', new Error('PracticePadCheck store unavailable (injected); nothing was claimed.'));
    }
    try {
      await (prisma as any).$executeRawUnsafe(
        `INSERT INTO "PracticePadCheck"
           ("scopeHash", "checkId", "schoolId", "studentId", "attemptId",
            "basedOnVersion", "idempotencyKey", "fingerprint", "status",
            "evaluationMode", "evidenceEligible", "resultJson")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        record.scopeHash,
        record.checkId,
        record.schoolId,
        record.studentId,
        record.attemptId,
        record.basedOnVersion,
        record.idempotencyKey,
        record.fingerprint,
        record.status,
        record.evaluationMode,
        record.evidenceEligible,
        record.resultJson,
      );
      if (testMemory) testMemory.set(record.scopeHash, record);
      return true;
    } catch (insertCause) {
      // Distinguish a lost race (unique violation, DB reachable → the
      // caller re-reads the winner) from a dead database (fail closed).
      try {
        await (prisma as any).$queryRawUnsafe(`SELECT 1`);
      } catch (probeCause) {
        if (testMemory) {
          if (testMemory.has(record.scopeHash)) return false;
          testMemory.set(record.scopeHash, record);
          return true;
        }
        throw persistenceFailure('write', probeCause);
      }
      if (testMemory) {
        if (testMemory.has(record.scopeHash)) return false;
        testMemory.set(record.scopeHash, record);
      }
      return false;
    }
  },

  /**
   * PP-10: smallest check-id read over existing PracticePadCheck storage.
   * Returns the durable record only when it belongs to the attempt.
   * No new table, no process Map. Throws PracticePadPersistenceError
   * when the database cannot answer and no explicit test double is
   * installed (same fail-closed law as the other reads).
   */
  async findByCheckId(attemptId: string, checkId: string): Promise<PracticePadCheckRecord | null> {
    try {
      const rows = await (prisma as any).$queryRawUnsafe<any[]>(
        `SELECT * FROM "PracticePadCheck" WHERE "checkId" = $1 LIMIT 1`,
        checkId,
      );
      const rec = rows[0] ? mapRowToRecord(rows[0]) : null;
      if (!rec || rec.attemptId !== attemptId) return null;
      return rec;
    } catch (cause) {
      if (testMemory) {
        for (const rec of testMemory.values()) {
          if (rec.checkId === checkId && rec.attemptId === attemptId) return rec;
        }
        return null;
      }
      throw persistenceFailure('read', cause);
    }
  },

  async resetForTest(): Promise<void> {
    if (testMemory) testMemory.clear();
    failWritesForTest = false;
    try {
      await (prisma as any).$executeRawUnsafe(`DELETE FROM "PracticePadCheck"`);
    } catch {
      // Table may not exist in pure in-memory test runs.
    }
  },

  /**
   * PP-07: list durable check records for one attempt in chronological
   * order. The smallest read capability needed to reconstruct trusted
   * support history from backend state. Throws
   * PracticePadPersistenceError when the database cannot answer and no
   * explicit test double is installed.
   */
  async listByAttempt(attemptId: string): Promise<PracticePadCheckRecord[]> {
    try {
      const rows = await (prisma as any).$queryRawUnsafe<any[]>(
        `SELECT * FROM "PracticePadCheck" WHERE "attemptId" = $1 ORDER BY "basedOnVersion" ASC, "createdAt" ASC`,
        attemptId,
      );
      if (Array.isArray(rows)) return rows.map(mapRowToRecord);
      return [];
    } catch (cause) {
      if (testMemory) {
        return [...testMemory.values()]
          .filter((r) => r.attemptId === attemptId)
          .sort((a, b) =>
            a.basedOnVersion !== b.basedOnVersion
              ? a.basedOnVersion - b.basedOnVersion
              : a.createdAt < b.createdAt
                ? -1
                : a.createdAt > b.createdAt
                  ? 1
                  : 0,
          );
      }
      throw persistenceFailure('read', cause);
    }
  },
};
