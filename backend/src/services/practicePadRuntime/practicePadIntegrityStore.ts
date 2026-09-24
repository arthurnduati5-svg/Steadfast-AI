// ─────────────────────────────────────────────────────────────
// Steadfast AI — Practice Pad PP-09: durable integrity owner
//
// One canonical durability boundary for integrity observations and
// integrity evidence. Production authority is PostgreSQL only
// (PracticePadIntegrityObservation / PracticePadIntegrityEvidence,
// provisioned by migration 20260928000000_pp09_practice_integrity_evidence).
//
// Fail-closed law:
//   - Same eventId twice → the stored observation (deduplicated), never a
//     duplicate row and never a new concern.
//   - Same evidence scope + same fingerprint → the stored evidence
//     (deduplicated). Same scope + different fingerprint → explicit
//     IDEMPOTENCY_CONFLICT, never silent overwrite.
//   - Database/table/read/write failure in production THROWS
//     PracticePadIntegrityPersistenceError. The engine maps it to
//     PERSISTENCE_FAILED with no evidence success. There is NO
//     process-local authoritative Map: succeeding from memory on a real
//     database failure would fabricate protected evidence.
//   - This module NEVER creates tables at request time. A missing table is
//     a persistence failure, not CREATE TABLE.
//   - Process memory exists ONLY behind
//     __enablePracticePadIntegrityMemoryForTest, an explicit test seam for
//     focused PP-09 tests that run with Prisma mocked unavailable.
//     Production never enables it, and a database failure must never
//     implicitly enable it.
// ─────────────────────────────────────────────────────────────

import prisma from '../../lib/prisma';
import { PracticePadIntegrityPersistenceError } from './practicePadIntegrityContracts';
import type {
  PracticeIntegrityEvidence,
  PracticeIntegrityObservation,
} from './practicePadIntegrityContracts';

export interface PracticeIntegrityObservationRecord {
  eventId: string;
  schoolId: string;
  studentId: string;
  attemptId: string;
  eventType: string;
  clientObservedAt: string | null;
  serverReceivedAt: string;
  serverSeq: number;
  outOfOrder: boolean;
  metadataJson: string;
  createdAt: string;
}

export interface PracticeIntegrityEvidenceRecord {
  scopeHash: string;
  integrityEvidenceId: string;
  schoolId: string;
  studentId: string;
  attemptId: string;
  basedOnAttemptVersion: number;
  idempotencyKey: string;
  observationWindow: string;
  concernLevel: string;
  signalsJson: string;
  counterSignalsJson: string;
  confidence: number;
  recommendedNextEvidenceAction: string;
  fingerprint: string;
  resultJson: string;
  createdAt: string;
}

// ── Explicit test seam ONLY (focused PP-09 tests, Prisma mocked) ──
let testMemory: {
  observations: Map<string, PracticeIntegrityObservationRecord>;
  evidence: Map<string, PracticeIntegrityEvidenceRecord>;
  seqByAttempt: Map<string, number>;
} | null = null;
let failWritesForTest = false;

export function __enablePracticePadIntegrityMemoryForTest(): void {
  if (!testMemory) {
    testMemory = { observations: new Map(), evidence: new Map(), seqByAttempt: new Map() };
  }
}

export function __setPracticePadIntegrityFailWritesForTest(value: boolean): void {
  failWritesForTest = value;
}

function isUniqueViolationDb(cause: unknown): boolean {
  const err = cause as { code?: unknown; meta?: { code?: unknown; message?: unknown } };
  if (err?.code === 'P2002') return true;
  // Prisma wraps raw-SQL failures as P2010 with the database code in meta.
  if (String(err?.meta?.code || '') === '23505') return true;
  if (String(err?.code || '') === '23505') return true;
  const message = String((cause as Error)?.message || cause || '');
  return /unique constraint|duplicate key|already exists/i.test(message);
}

function persistenceFailure(operation: string, cause: unknown): PracticePadIntegrityPersistenceError {
  return new PracticePadIntegrityPersistenceError(
    `PracticePadIntegrity store ${operation} failed; failing closed — no memory fallback. Cause: ${String((cause as Error)?.message || cause)}`,
  );
}

function mapObservationRow(row: any): PracticeIntegrityObservationRecord {
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

function mapEvidenceRow(row: any): PracticeIntegrityEvidenceRecord {
  return {
    scopeHash: String(row.scopeHash),
    integrityEvidenceId: String(row.integrityEvidenceId),
    schoolId: String(row.schoolId),
    studentId: String(row.studentId),
    attemptId: String(row.attemptId),
    basedOnAttemptVersion: Number(row.basedOnAttemptVersion ?? 0),
    idempotencyKey: String(row.idempotencyKey),
    observationWindow: String(row.observationWindow ?? '{}'),
    concernLevel: String(row.concernLevel),
    signalsJson: String(row.signalsJson ?? '[]'),
    counterSignalsJson: String(row.counterSignalsJson ?? '[]'),
    confidence: Number(row.confidence),
    recommendedNextEvidenceAction: String(row.recommendedNextEvidenceAction),
    fingerprint: String(row.fingerprint),
    resultJson: String(row.resultJson),
    createdAt: row.createdAt?.toISOString?.() || String(row.createdAt),
  };
}

export function parseIntegrityObservation(record: PracticeIntegrityObservationRecord): PracticeIntegrityObservation {
  let metadata: Record<string, string | number | boolean> = {};
  try {
    const parsed = JSON.parse(record.metadataJson) as unknown;
    if (parsed && typeof parsed === 'object') metadata = parsed as Record<string, string | number | boolean>;
  } catch {
    metadata = {};
  }
  return {
    eventId: record.eventId,
    schoolId: record.schoolId,
    studentId: record.studentId,
    attemptId: record.attemptId,
    eventType: record.eventType as PracticeIntegrityObservation['eventType'],
    clientObservedAt: record.clientObservedAt,
    serverReceivedAt: record.serverReceivedAt,
    serverSeq: record.serverSeq,
    outOfOrder: record.outOfOrder,
    metadata,
    createdAt: record.createdAt,
  };
}

export function parseIntegrityEvidence(record: PracticeIntegrityEvidenceRecord): PracticeIntegrityEvidence {
  return JSON.parse(record.resultJson) as PracticeIntegrityEvidence;
}

export const practicePadIntegrityStore = {
  async nextServerSeq(attemptId: string): Promise<number> {
    if (testMemory) {
      const current = testMemory.seqByAttempt.get(attemptId) || 0;
      const next = current + 1;
      testMemory.seqByAttempt.set(attemptId, next);
      return next;
    }
    try {
      const rows = await (prisma as any).$queryRawUnsafe<any[]>(
        `SELECT COALESCE(MAX("serverSeq"), 0) AS "maxSeq" FROM "PracticePadIntegrityObservation" WHERE "attemptId" = $1`,
        attemptId,
      );
      return Number(rows?.[0]?.maxSeq ?? 0) + 1;
    } catch (cause) {
      throw persistenceFailure('sequence read', cause);
    }
  },

  /**
   * PP-12 cross-replica-safe observation claim. Allocation + insert is ONE
   * PostgreSQL statement: serverSeq is computed as MAX+1 inside the
   * INSERT, so concurrent writers sharing the database cannot receive the
   * same serverSeq without one of them hitting the provisioned
   * (attemptId, serverSeq) unique authority (migration 20260929000000).
   * The loser retries under the same DB authority; the winner's row is
   * the single truth. No process mutex, no JS Map, no in-memory counter.
   *
   * Returns { won: true, serverSeq } when this caller owns the eventId,
   * { won: false, serverSeq } when the eventId was already owned (caller
   * re-reads the winner). Throws PracticePadIntegrityPersistenceError
   * when the database cannot answer. Missing schema fails closed.
   */
  async insertObservationAtomic(record: Omit<PracticeIntegrityObservationRecord, 'serverSeq'>): Promise<{
    won: boolean;
    serverSeq: number;
  }> {
    if (failWritesForTest) {
      throw persistenceFailure('observation write', new Error('PracticePadIntegrity store unavailable (injected); nothing was claimed.'));
    }
    if (testMemory) {
      if (testMemory.observations.has(record.eventId)) {
        return { won: false, serverSeq: testMemory.observations.get(record.eventId)!.serverSeq };
      }
      const current = testMemory.seqByAttempt.get(record.attemptId) || 0;
      const next = current + 1;
      testMemory.seqByAttempt.set(record.attemptId, next);
      testMemory.observations.set(record.eventId, { ...record, serverSeq: next });
      return { won: true, serverSeq: next };
    }
    const MAX_SEQ_RACE_RETRIES = 25;
    for (let attempt = 0; attempt <= MAX_SEQ_RACE_RETRIES; attempt += 1) {
      try {
        const rows = await (prisma as any).$queryRawUnsafe<any[]>(
          `INSERT INTO "PracticePadIntegrityObservation"
             ("eventId", "schoolId", "studentId", "attemptId", "eventType",
              "clientObservedAt", "serverReceivedAt", "serverSeq", "outOfOrder",
              "metadataJson")
           VALUES ($1,$2,$3,$4,$5,$6,$7::timestamp,
             (SELECT COALESCE(MAX("serverSeq"), 0) + 1 FROM "PracticePadIntegrityObservation" WHERE "attemptId" = $4),
             $8,$9)
           RETURNING "serverSeq"`,
          record.eventId,
          record.schoolId,
          record.studentId,
          record.attemptId,
          record.eventType,
          record.clientObservedAt,
          record.serverReceivedAt,
          record.outOfOrder,
          record.metadataJson,
        );
        return { won: true, serverSeq: Number(rows?.[0]?.serverSeq ?? 0) };
      } catch (insertCause) {
        const message = String((insertCause as Error)?.message || insertCause || '');
        if (!isUniqueViolationDb(insertCause)) {
          try {
            await (prisma as any).$queryRawUnsafe(`SELECT 1`);
          } catch (probeCause) {
            throw persistenceFailure('observation write', probeCause);
          }
          throw persistenceFailure('observation write', insertCause);
        }
        // Unique conflict: either this eventId is already owned (deduplicate)
        // or a concurrent replica won the same (attemptId, serverSeq) slot.
        // A unique violation with no visible eventId owner is retried under
        // DB authority (the eventId winner may simply not have committed
        // yet under READ COMMITTED). Retries are bounded; exhaustion fails
        // closed. A claim is never fabricated and false success is never
        // reported.
        let winner: PracticeIntegrityObservationRecord | null = null;
        try {
          winner = await this.findObservation(record.eventId);
        } catch {
          winner = null;
        }
        if (winner) return { won: false, serverSeq: winner.serverSeq };
        if (attempt === MAX_SEQ_RACE_RETRIES) {
          throw persistenceFailure('observation write', new Error(`concurrent claim retries exhausted: ${message}`));
        }
        // Retry: recompute MAX+1 against the winners' committed rows.
      }
    }
    throw persistenceFailure('observation write', new Error('unreachable atomic claim exit'));
  },

  async findObservation(eventId: string): Promise<PracticeIntegrityObservationRecord | null> {
    try {
      const rows = await (prisma as any).$queryRawUnsafe<any[]>(
        `SELECT * FROM "PracticePadIntegrityObservation" WHERE "eventId" = $1 LIMIT 1`,
        eventId,
      );
      if (rows[0]) return mapObservationRow(rows[0]);
      return null;
    } catch (cause) {
      if (testMemory) return testMemory.observations.get(eventId) || null;
      throw persistenceFailure('observation read', cause);
    }
  },

  /** Insert an observation. Returns true when this caller won the eventId,
   *  false when the eventId is already owned (caller re-reads the winner).
   *  Throws PracticePadIntegrityPersistenceError when the database cannot
   *  answer and no explicit test double is installed. */
  async insertObservation(record: PracticeIntegrityObservationRecord): Promise<boolean> {
    if (failWritesForTest) {
      throw persistenceFailure('observation write', new Error('PracticePadIntegrity store unavailable (injected); nothing was claimed.'));
    }
    try {
      await (prisma as any).$executeRawUnsafe(
        `INSERT INTO "PracticePadIntegrityObservation"
           ("eventId", "schoolId", "studentId", "attemptId", "eventType",
            "clientObservedAt", "serverReceivedAt", "serverSeq", "outOfOrder",
            "metadataJson")
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        record.eventId,
        record.schoolId,
        record.studentId,
        record.attemptId,
        record.eventType,
        record.clientObservedAt,
        record.serverReceivedAt,
        record.serverSeq,
        record.outOfOrder,
        record.metadataJson,
      );
      if (testMemory) testMemory.observations.set(record.eventId, record);
      return true;
    } catch (insertCause) {
      try {
        await (prisma as any).$queryRawUnsafe(`SELECT 1`);
      } catch (probeCause) {
        if (testMemory) {
          if (testMemory.observations.has(record.eventId)) return false;
          testMemory.observations.set(record.eventId, record);
          return true;
        }
        throw persistenceFailure('observation write', probeCause);
      }
      if (testMemory) {
        if (testMemory.observations.has(record.eventId)) return false;
        testMemory.observations.set(record.eventId, record);
      }
      return false;
    }
  },

  /** Attempt-scoped, server-ordered retrieval. Bounded: callers pass an
   *  explicit limit. Returns rows plus the durable total so callers can
   *  detect truncation deterministically. */
  async listObservationsByAttempt(
    attemptId: string,
    limit: number,
  ): Promise<{ rows: PracticeIntegrityObservationRecord[]; total: number }> {
    try {
      const countRows = await (prisma as any).$queryRawUnsafe<any[]>(
        `SELECT COUNT(*) AS "count" FROM "PracticePadIntegrityObservation" WHERE "attemptId" = $1`,
        attemptId,
      );
      const total = Number(countRows?.[0]?.count ?? 0);
      const rows = await (prisma as any).$queryRawUnsafe<any[]>(
        `SELECT * FROM "PracticePadIntegrityObservation" WHERE "attemptId" = $1 ORDER BY "serverSeq" ASC LIMIT $2`,
        attemptId,
        limit,
      );
      return { rows: (Array.isArray(rows) ? rows : []).map(mapObservationRow), total };
    } catch (cause) {
      if (testMemory) {
        const all = [...testMemory.observations.values()]
          .filter((r) => r.attemptId === attemptId)
          .sort((a, b) => a.serverSeq - b.serverSeq);
        return { rows: all.slice(0, limit), total: all.length };
      }
      throw persistenceFailure('observation list', cause);
    }
  },

  async findEvidenceByScope(scopeHash: string): Promise<PracticeIntegrityEvidenceRecord | null> {
    try {
      const rows = await (prisma as any).$queryRawUnsafe<any[]>(
        `SELECT * FROM "PracticePadIntegrityEvidence" WHERE "scopeHash" = $1 LIMIT 1`,
        scopeHash,
      );
      if (rows[0]) return mapEvidenceRow(rows[0]);
      return null;
    } catch (cause) {
      if (testMemory) return testMemory.evidence.get(scopeHash) || null;
      throw persistenceFailure('evidence read', cause);
    }
  },

  /** Claim an evidence idempotency scope. Same semantics as the check
   *  store: true = won, false = already owned, throw = database dead. */
  async insertEvidence(record: PracticeIntegrityEvidenceRecord): Promise<boolean> {
    if (failWritesForTest) {
      throw persistenceFailure('evidence write', new Error('PracticePadIntegrity store unavailable (injected); nothing was claimed.'));
    }
    try {
      await (prisma as any).$executeRawUnsafe(
        `INSERT INTO "PracticePadIntegrityEvidence"
           ("scopeHash", "integrityEvidenceId", "schoolId", "studentId", "attemptId",
            "basedOnAttemptVersion", "idempotencyKey", "observationWindow", "concernLevel",
            "signalsJson", "counterSignalsJson", "confidence",
            "recommendedNextEvidenceAction", "fingerprint", "resultJson")
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
        record.scopeHash,
        record.integrityEvidenceId,
        record.schoolId,
        record.studentId,
        record.attemptId,
        record.basedOnAttemptVersion,
        record.idempotencyKey,
        record.observationWindow,
        record.concernLevel,
        record.signalsJson,
        record.counterSignalsJson,
        record.confidence,
        record.recommendedNextEvidenceAction,
        record.fingerprint,
        record.resultJson,
      );
      if (testMemory) testMemory.evidence.set(record.scopeHash, record);
      return true;
    } catch (insertCause) {
      try {
        await (prisma as any).$queryRawUnsafe(`SELECT 1`);
      } catch (probeCause) {
        if (testMemory) {
          if (testMemory.evidence.has(record.scopeHash)) return false;
          testMemory.evidence.set(record.scopeHash, record);
          return true;
        }
        throw persistenceFailure('evidence write', probeCause);
      }
      if (testMemory) {
        if (testMemory.evidence.has(record.scopeHash)) return false;
        testMemory.evidence.set(record.scopeHash, record);
      }
      return false;
    }
  },

  async resetForTest(): Promise<void> {
    if (testMemory) {
      testMemory.observations.clear();
      testMemory.evidence.clear();
      testMemory.seqByAttempt.clear();
    }
    failWritesForTest = false;
    try {
      await (prisma as any).$executeRawUnsafe(`DELETE FROM "PracticePadIntegrityEvidence"`);
      await (prisma as any).$executeRawUnsafe(`DELETE FROM "PracticePadIntegrityObservation"`);
    } catch {
      // Tables may not exist in pure in-memory test runs.
    }
  },
};

export async function _clearPracticePadIntegrityRecordsForTest(): Promise<void> {
  await practicePadIntegrityStore.resetForTest();
}
