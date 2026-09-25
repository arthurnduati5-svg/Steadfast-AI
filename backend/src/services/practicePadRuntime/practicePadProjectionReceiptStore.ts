// ─────────────────────────────────────────────────────────────
// Steadfast AI — Practice Pad PP-12: durable projection receipt store.
//
// ONE small Practice Pad-specific durability boundary for PP-10
// downstream projection recovery (memory / revision / Growth). NOT a
// generic outbox / reconciliation framework.
//
// Law:
//   - Canonical evidence commit precedes ALL projection effects.
//   - Committed evidence is never rolled back for a projection failure.
//   - Per committed evidence: memory / revision / Growth each carry
//     PENDING | SUCCEEDED | FAILED durable state.
//   - Mastery is NOT tracked here: commitPracticeLearningEvidence already
//     owns the canonical mastery consequence.
//   - PostgreSQL is the sole authority (PracticePadProjectionReceipt,
//     provisioned by migration 20260929000000_pp12_production_resilience).
//     Missing schema fails closed; this module never issues CREATE TABLE
//     or CREATE INDEX on the request path.
//   - Concurrent reconcilers claim via PostgreSQL (claimedBy/claimedAt
//     lease + row-ownership check), never a process mutex or JS Map.
//   - No raw learner work is stored: candidateJson carries only the
//     already-admitted safe candidate (scalar ids / codes / counts).
// ─────────────────────────────────────────────────────────────

import { createHash } from 'crypto';
import prisma from '../../lib/prisma';

export type PracticeProjectionName = 'memory' | 'revision' | 'growth';
export type PracticeProjectionState = 'PENDING' | 'SUCCEEDED' | 'FAILED';

export interface PracticeProjectionReceipt {
  receiptKey: string;
  schoolId: string;
  studentId: string;
  attemptId: string;
  idempotencyKey: string;
  committedEvidenceId: string | null;
  candidateJson: string;
  memoryState: PracticeProjectionState;
  revisionState: PracticeProjectionState;
  growthState: PracticeProjectionState;
  lastErrorJson: string | null;
  claimedBy: string | null;
  claimedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export class PracticeProjectionReceiptPersistenceError extends Error {
  readonly code = 'PROJECTION_RECEIPT_PERSISTENCE_FAILED' as const;
  constructor(message: string) {
    super(message);
    this.name = 'PracticeProjectionReceiptPersistenceError';
  }
}

function persistenceFailure(operation: string, cause: unknown): PracticeProjectionReceiptPersistenceError {
  return new PracticeProjectionReceiptPersistenceError(
    `PracticePadProjectionReceipt store ${operation} failed; failing closed. Cause: ${String((cause as Error)?.message || cause)}`,
  );
}

function asState(value: unknown): PracticeProjectionState {
  return value === 'SUCCEEDED' || value === 'FAILED' ? value : 'PENDING';
}

function mapRow(row: any): PracticeProjectionReceipt {
  return {
    receiptKey: String(row.receiptKey),
    schoolId: String(row.schoolId),
    studentId: String(row.studentId),
    attemptId: String(row.attemptId),
    idempotencyKey: String(row.idempotencyKey),
    committedEvidenceId: row.committedEvidenceId ? String(row.committedEvidenceId) : null,
    candidateJson: String(row.candidateJson ?? '{}'),
    memoryState: asState(row.memoryState),
    revisionState: asState(row.revisionState),
    growthState: asState(row.growthState),
    lastErrorJson: row.lastErrorJson ? String(row.lastErrorJson) : null,
    claimedBy: row.claimedBy ? String(row.claimedBy) : null,
    claimedAt: row.claimedAt?.toISOString?.() || (row.claimedAt ? String(row.claimedAt) : null),
    createdAt: row.createdAt?.toISOString?.() || String(row.createdAt),
    updatedAt: row.updatedAt?.toISOString?.() || String(row.updatedAt),
  };
}

export function practiceProjectionReceiptKey(attemptId: string, idempotencyKey: string): string {
  return createHash('sha256').update(`${attemptId}::${idempotencyKey}`).digest('hex');
}

function projectionColumn(name: PracticeProjectionName): string {
  if (name === 'memory') return 'memoryState';
  if (name === 'revision') return 'revisionState';
  return 'growthState';
}

export interface PracticeProjectionReceiptDb {
  $executeRawUnsafe: (sql: string, ...args: unknown[]) => Promise<unknown>;
  $queryRawUnsafe: <T>(sql: string, ...args: unknown[]) => Promise<T>;
}

/** Factory: independent store instances share only PostgreSQL (restart /
 *  multi-replica proofs create a second instance over a fresh client). */
export function createPracticePadProjectionReceiptStore(db: PracticeProjectionReceiptDb) {
  const store = {
    async ensureReceipt(input: {
      schoolId: string;
      studentId: string;
      attemptId: string;
      idempotencyKey: string;
      committedEvidenceId?: string | null;
      candidateJson?: string | null;
    }): Promise<PracticeProjectionReceipt> {
      const receiptKey = practiceProjectionReceiptKey(input.attemptId, input.idempotencyKey);
      try {
        await db.$executeRawUnsafe(
          `INSERT INTO "PracticePadProjectionReceipt"
             ("receiptKey", "schoolId", "studentId", "attemptId", "idempotencyKey",
              "committedEvidenceId", "candidateJson")
           VALUES ($1,$2,$3,$4,$5,$6,$7)
           ON CONFLICT ("receiptKey") DO NOTHING`,
          receiptKey,
          input.schoolId,
          input.studentId,
          input.attemptId,
          input.idempotencyKey,
          input.committedEvidenceId ?? null,
          input.candidateJson ?? '{}',
        );
        if (input.committedEvidenceId) {
          // Bind the canonical evidence identity once known; never overwrite
          // an already-bound identity and never touch projection states here.
          await db.$executeRawUnsafe(
            `UPDATE "PracticePadProjectionReceipt"
             SET "committedEvidenceId" = $2,
                 "candidateJson" = CASE WHEN $3 IS NOT NULL THEN $3 ELSE "candidateJson" END,
                 "updatedAt" = CURRENT_TIMESTAMP
             WHERE "receiptKey" = $1 AND "committedEvidenceId" IS NULL`,
            receiptKey,
            input.committedEvidenceId,
            input.candidateJson ?? null,
          );
        }
        const rows = await db.$queryRawUnsafe<any[]>(
          `SELECT * FROM "PracticePadProjectionReceipt" WHERE "receiptKey" = $1 LIMIT 1`,
          receiptKey,
        );
        if (!rows[0]) throw new Error('receipt missing after ensure');
        return mapRow(rows[0]);
      } catch (cause) {
        if (cause instanceof PracticeProjectionReceiptPersistenceError) throw cause;
        throw persistenceFailure('ensure', cause);
      }
    },

    async getReceipt(receiptKey: string): Promise<PracticeProjectionReceipt | null> {
      try {
        const rows = await db.$queryRawUnsafe<any[]>(
          `SELECT * FROM "PracticePadProjectionReceipt" WHERE "receiptKey" = $1 LIMIT 1`,
          receiptKey,
        );
        return rows[0] ? mapRow(rows[0]) : null;
      } catch (cause) {
        throw persistenceFailure('read', cause);
      }
    },

    async findByCommittedEvidenceId(committedEvidenceId: string): Promise<PracticeProjectionReceipt | null> {
      try {
        const rows = await db.$queryRawUnsafe<any[]>(
          `SELECT * FROM "PracticePadProjectionReceipt" WHERE "committedEvidenceId" = $1 LIMIT 1`,
          committedEvidenceId,
        );
        return rows[0] ? mapRow(rows[0]) : null;
      } catch (cause) {
        throw persistenceFailure('read', cause);
      }
    },

    async markProjectionState(
      receiptKey: string,
      projection: PracticeProjectionName,
      state: PracticeProjectionState,
      errorMessage?: string | null,
      /**
       * Stale-lease guard. When supplied, the state transition applies
       * ONLY while this worker still owns the PostgreSQL claim; a worker
       * that lost its lease gets null back and must re-read instead of
       * overwriting receipt truth. Omitted callers keep legacy behavior.
       */
      expectedClaimedBy?: string | null,
    ): Promise<PracticeProjectionReceipt | null> {
      const column = projectionColumn(projection);
      try {
        const errorJson =
          state === 'FAILED' ? JSON.stringify({ message: String(errorMessage || 'projection failed').slice(0, 500) }) : null;
        if (expectedClaimedBy != null) {
          const affected = (await db.$executeRawUnsafe(
            `UPDATE "PracticePadProjectionReceipt"
             SET "${column}" = $2, "lastErrorJson" = $3, "updatedAt" = CURRENT_TIMESTAMP
             WHERE "receiptKey" = $1 AND "claimedBy" = $4`,
            receiptKey,
            state,
            errorJson,
            expectedClaimedBy,
          )) as unknown as number;
          if (Number(affected) === 0) return null;
        } else {
          await db.$executeRawUnsafe(
            `UPDATE "PracticePadProjectionReceipt"
             SET "${column}" = $2, "lastErrorJson" = $3, "updatedAt" = CURRENT_TIMESTAMP
             WHERE "receiptKey" = $1`,
            receiptKey,
            state,
            errorJson,
          );
        }
        return store.getReceipt(receiptKey);
      } catch (cause) {
        throw persistenceFailure('state update', cause);
      }
    },

    /**
     * PostgreSQL-authoritative worker claim. Exactly one replica wins the
     * lease; losers must skip the receipt in this run (another run/replica
     * resumes after lease expiry). No process mutex.
     */
    async claimReceipt(receiptKey: string, workerId: string, leaseMs: number, nowMs: number): Promise<boolean> {
      try {
        const cutoff = new Date(nowMs - leaseMs).toISOString();
        const rows = await db.$queryRawUnsafe<any[]>(
          `UPDATE "PracticePadProjectionReceipt"
           SET "claimedBy" = $2, "claimedAt" = $3::timestamp, "updatedAt" = CURRENT_TIMESTAMP
           WHERE "receiptKey" = $1 AND ("claimedBy" IS NULL OR "claimedAt" IS NULL OR "claimedAt" < $4::timestamp)
           RETURNING "receiptKey"`,
          receiptKey,
          workerId,
          new Date(nowMs).toISOString(),
          cutoff,
        );
        return Array.isArray(rows) && rows.length > 0;
      } catch (cause) {
        throw persistenceFailure('claim', cause);
      }
    },

    async releaseClaim(receiptKey: string, workerId: string): Promise<void> {
      try {
        await db.$executeRawUnsafe(
          `UPDATE "PracticePadProjectionReceipt"
           SET "claimedBy" = NULL, "claimedAt" = NULL, "updatedAt" = CURRENT_TIMESTAMP
           WHERE "receiptKey" = $1 AND "claimedBy" = $2`,
          receiptKey,
          workerId,
        );
      } catch (cause) {
        throw persistenceFailure('release', cause);
      }
    },

    /** Bounded incomplete scan. Callers must claim each row before working it. */
    async listIncomplete(limit: number): Promise<PracticeProjectionReceipt[]> {
      const bounded = Math.max(1, Math.min(100, Math.floor(limit) || 25));
      try {
        const rows = await db.$queryRawUnsafe<any[]>(
          `SELECT * FROM "PracticePadProjectionReceipt"
           WHERE "committedEvidenceId" IS NOT NULL
             AND ("memoryState" <> 'SUCCEEDED' OR "revisionState" <> 'SUCCEEDED' OR "growthState" <> 'SUCCEEDED')
           ORDER BY "updatedAt" ASC
           LIMIT $1`,
          bounded,
        );
        return (Array.isArray(rows) ? rows : []).map(mapRow);
      } catch (cause) {
        throw persistenceFailure('incomplete scan', cause);
      }
    },

    async resetForTest(): Promise<void> {
      try {
        await db.$executeRawUnsafe(`DELETE FROM "PracticePadProjectionReceipt"`);
      } catch {
        // Table may not exist in pure in-memory test runs.
      }
    },
  };
  return store;
}

export const practicePadProjectionReceiptStore =
  createPracticePadProjectionReceiptStore(prisma as unknown as PracticeProjectionReceiptDb);

export type PracticePadProjectionReceiptStore = ReturnType<typeof createPracticePadProjectionReceiptStore>;
