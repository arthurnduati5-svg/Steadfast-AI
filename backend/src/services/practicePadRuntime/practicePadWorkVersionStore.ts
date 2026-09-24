// ─────────────────────────────────────────────────────────────
// Steadfast AI — Practice Pad PP-01: backend-owned work versions
//
// A check is bound to (attemptId, basedOnVersion). When learner work
// advances v7 → v8, a v7 result is retained historically but MUST NOT
// become current feedback/evidence for v8. The frontend cannot override
// this invariant; the runtime enforces it.
//
// Durability law (PP-01 §8, production fail-closed):
//   - PostgreSQL is the sole authority for the current version. The
//     provisioned "PracticePadWorkVersion" table (see prisma migration
//     20260924000000_pp01_practice_pad_durability) holds one row per
//     attemptId. Monotonic: versions never move backwards.
//   - Database/table/read/write failure in production THROWS
//     PracticePadPersistenceError. The runtime maps it to FAILED_CLOSED /
//     database_unavailable with no successful check. There is NO
//     process-local authoritative Map.
//   - This module NEVER creates tables at request time. A missing table
//     is a persistence failure, not CREATE TABLE.
//   - Process memory exists ONLY behind
//     __enablePracticePadWorkVersionMemoryForTest, an explicit test seam
//     used solely by focused PP-01 tests that run with Prisma mocked
//     unavailable. Production never enables it, and failure of the
//     database must never implicitly enable it.
// ─────────────────────────────────────────────────────────────

import prisma from '../../lib/prisma';
import { PracticePadPersistenceError } from './practicePadCheckContracts';

// ── Explicit test seam ONLY (focused PP-01 tests, Prisma mocked) ──
// Null in production: any database failure then throws instead of
// succeeding from memory.
let testMemory: Map<string, number> | null = null;

/**
 * Install an explicit in-memory test double. Focused PP-01 tests only.
 * Never called by production code; never inferred from a DB failure.
 */
export function __enablePracticePadWorkVersionMemoryForTest(): void {
  if (!testMemory) testMemory = new Map<string, number>();
}

/**
 * Additive PP-03 seam: reports whether the explicit PP-01 memory double
 * is installed. The PP-03 document store piggybacks on it so accepted
 * PP-01/PP-02 tests (which install only this seam) keep passing without
 * being reopened. Production never enables it.
 */
export function __isPracticePadWorkVersionMemoryEnabledForTest(): boolean {
  return testMemory !== null;
}

function persistenceFailure(operation: string, cause: unknown): PracticePadPersistenceError {
  return new PracticePadPersistenceError(
    `PracticePadWorkVersion store ${operation} failed; failing closed — no memory fallback. Cause: ${String((cause as Error)?.message || cause)}`,
  );
}

async function readDurableVersion(attemptId: string): Promise<number | null> {
  const rows = await (prisma as any).$queryRawUnsafe<any[]>(
    `SELECT "version" FROM "PracticePadWorkVersion" WHERE "attemptId" = $1 LIMIT 1`,
    attemptId,
  );
  if (rows[0] && Number.isInteger(Number(rows[0].version))) {
    return Math.max(1, Number(rows[0].version));
  }
  return null;
}

async function writeDurableVersion(attemptId: string, version: number): Promise<void> {
  await (prisma as any).$executeRawUnsafe(
    `INSERT INTO "PracticePadWorkVersion" ("attemptId", "version")
     VALUES ($1, $2)
     ON CONFLICT ("attemptId")
     DO UPDATE SET "version" = GREATEST("PracticePadWorkVersion"."version", $2),
                   "updatedAt" = CURRENT_TIMESTAMP`,
    attemptId,
    version,
  );
}

export const practicePadWorkVersionStore = {
  /**
   * Current backend-owned work version for an attempt (default 1 when the
   * reachable database holds no row yet). Throws
   * PracticePadPersistenceError when the database cannot answer and no
   * explicit test double is installed.
   */
  async getCurrentVersion(attemptId: string): Promise<number> {
    try {
      const durable = await readDurableVersion(attemptId);
      if (durable !== null) {
        if (testMemory) testMemory.set(attemptId, Math.max(testMemory.get(attemptId) ?? 1, durable));
        return durable;
      }
      // Reachable database with no row: version 1 is the durable truth.
      return 1;
    } catch (cause) {
      if (testMemory) return testMemory.get(attemptId) ?? 1;
      throw persistenceFailure('read', cause);
    }
  },

  /**
   * Record newly submitted learner work; advances the version.
   * Throws PracticePadPersistenceError when the version cannot be
   * durably read or written and no explicit test double is installed.
   */
  async submitWork(attemptId: string): Promise<number> {
    const current = await this.getCurrentVersion(attemptId);
    const next = current + 1;
    try {
      await writeDurableVersion(attemptId, next);
    } catch (cause) {
      if (!testMemory) throw persistenceFailure('write', cause);
    }
    if (testMemory) testMemory.set(attemptId, next);
    return next;
  },

  /**
   * Seed a known version (creation path, tests). Never moves backwards.
   * Throws PracticePadPersistenceError when the version cannot be
   * durably read or written and no explicit test double is installed.
   */
  async seedVersion(attemptId: string, version: number): Promise<number> {
    const current = await this.getCurrentVersion(attemptId);
    const resolved = Math.max(current, Math.max(1, Math.floor(version)));
    try {
      await writeDurableVersion(attemptId, resolved);
    } catch (cause) {
      if (!testMemory) throw persistenceFailure('write', cause);
    }
    if (testMemory) testMemory.set(attemptId, resolved);
    return resolved;
  },

  async resetForTest(): Promise<void> {
    if (testMemory) testMemory.clear();
    try {
      await (prisma as any).$executeRawUnsafe(`DELETE FROM "PracticePadWorkVersion"`);
    } catch {
      // Table may not exist in pure in-memory test runs.
    }
  },
};
