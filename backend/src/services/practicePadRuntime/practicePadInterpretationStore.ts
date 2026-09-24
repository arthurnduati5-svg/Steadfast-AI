// ─────────────────────────────────────────────────────────────
// Steadfast AI — Practice Pad PP-08: derived-interpretation owner.
//
// ONE owner for derived PracticeWorkInterpretation records. Raw
// PracticeDocumentRevision rows are NEVER mutated to install an
// interpretation: each interpretation is a separate derived record
// bound to (attemptId, documentVersion, sourceBlockId,
// sourceContentHash).
//
// Durability law (matches PP-01/PP-03 stores): PostgreSQL is the sole
// authority. Tables are provisioned by migration
// 20260927000000_pp08_practice_interpretation; this module NEVER
// creates tables. Unreachable-database outcomes with no explicit test
// double throw PracticePadPersistenceError (fail closed). Process
// memory exists ONLY behind __enablePracticePadInterpretationMemoryForTest.
// Production never enables it.
// ─────────────────────────────────────────────────────────────

import { randomUUID } from 'crypto';
import prisma from '../../lib/prisma';
import { PracticePadPersistenceError } from './practicePadCheckContracts';
import { blockContentHash } from './practicePadDocumentContracts';
import { practicePadDocumentStore } from './practicePadDocumentStore';
import {
  validateInterpretationCandidates,
  type PracticeInterpretationFailureCode,
  type PracticeWorkInterpretation,
} from './practicePadInterpretationContracts';
import type { ResolvedTutorIdentity } from '../tutorStateContracts';

export interface ProposeInterpretationArgs {
  identity: ResolvedTutorIdentity;
  attemptId: string;
  documentVersion: number;
  sourceBlockId: string;
  sourceContentHash: string;
  candidates: unknown;
  interpreter?: string;
  interpreterVersion?: string;
}

export type ProposeInterpretationOutcome =
  | { ok: true; interpretation: PracticeWorkInterpretation }
  | { ok: false; code: PracticeInterpretationFailureCode; message: string };

export interface ConfirmInterpretationArgs {
  identity: ResolvedTutorIdentity;
  attemptId: string;
  documentVersion: number;
  interpretationId: string;
  candidateId: string;
  /** Current raw source hash — stale sources cannot be confirmed. */
  sourceContentHash: string;
  sourceBlockId: string;
}

export type ConfirmInterpretationOutcome =
  | { ok: true; interpretation: PracticeWorkInterpretation }
  | { ok: false; code: PracticeInterpretationFailureCode; message: string };

function fail<T extends ProposeInterpretationOutcome | ConfirmInterpretationOutcome>(
  code: PracticeInterpretationFailureCode,
  message: string,
): Extract<T, { ok: false }> {
  return { ok: false, code, message } as Extract<T, { ok: false }>;
}

function nowISO(): string {
  return new Date().toISOString();
}

function persistenceFailure(operation: string, cause: unknown): PracticePadPersistenceError {
  return new PracticePadPersistenceError(
    `PracticeInterpretation store ${operation} failed; failing closed — no memory fallback. Cause: ${String((cause as Error)?.message || cause)}`,
  );
}

// ── Explicit test seams ONLY ──

let testMemory: Map<string, PracticeWorkInterpretation> | null = null;
let failWritesForTest = false;

/** Install an explicit in-memory test double. Focused PP-08 tests only. */
export function __enablePracticePadInterpretationMemoryForTest(): void {
  if (!testMemory) testMemory = new Map();
}

/** Force write-path persistence failure. Focused PP-08 tests only. */
export function __setPracticePadInterpretationFailWritesForTest(value: boolean): void {
  failWritesForTest = value;
}

function memoryActive(): boolean {
  return testMemory !== null;
}

function mem(): Map<string, PracticeWorkInterpretation> {
  if (!testMemory) testMemory = new Map();
  return testMemory;
}

function keyOf(interpretationId: string): string {
  return interpretationId;
}

// ── Durable row mapping ──

function mapRow(row: any): PracticeWorkInterpretation {
  let candidates: PracticeWorkInterpretation['candidates'] = [];
  try {
    candidates = JSON.parse(String(row.candidatesJson)) as PracticeWorkInterpretation['candidates'];
  } catch {
    candidates = [];
  }
  return {
    interpretationId: String(row.interpretationId),
    schoolId: String(row.schoolId),
    studentId: String(row.studentId),
    attemptId: String(row.attemptId),
    documentVersion: Number(row.documentVersion),
    sourceBlockId: String(row.sourceBlockId),
    sourceContentHash: String(row.sourceContentHash),
    representationClass: row.representationClass,
    candidates,
    status: row.status,
    interpreter: String(row.interpreter),
    interpreterVersion: String(row.interpreterVersion),
    createdAt: row.createdAt?.toISOString?.() || nowISO(),
    confirmedAt: row.confirmedAt?.toISOString?.() || null,
    confirmedCandidateId: row.confirmedCandidateId != null ? String(row.confirmedCandidateId) : null,
  };
}

function owned(rec: PracticeWorkInterpretation | null, identity: ResolvedTutorIdentity): PracticeWorkInterpretation | null {
  if (!rec) return null;
  if (rec.schoolId !== identity.schoolId || rec.studentId !== identity.studentId) return null;
  return rec;
}

async function readDurableById(interpretationId: string): Promise<PracticeWorkInterpretation | null> {
  const rows = await (prisma as any).$queryRawUnsafe<any[]>(
    `SELECT * FROM "PracticePadInterpretation" WHERE "interpretationId" = $1 LIMIT 1`,
    interpretationId,
  );
  return rows[0] ? mapRow(rows[0]) : null;
}

async function readDurableConfirmed(
  attemptId: string,
  documentVersion: number,
  sourceBlockId: string,
): Promise<PracticeWorkInterpretation | null> {
  const rows = await (prisma as any).$queryRawUnsafe<any[]>(
    `SELECT * FROM "PracticePadInterpretation" WHERE "attemptId" = $1 AND "documentVersion" = $2 AND "sourceBlockId" = $3 AND "status" = 'CONFIRMED' ORDER BY "createdAt" DESC LIMIT 1`,
    attemptId,
    documentVersion,
    sourceBlockId,
  );
  return rows[0] ? mapRow(rows[0]) : null;
}

export const practicePadInterpretationStore = {
  async proposeInterpretation(args: ProposeInterpretationArgs): Promise<ProposeInterpretationOutcome> {
    const attemptId = (args.attemptId || '').trim();
    const sourceBlockId = (args.sourceBlockId || '').trim();
    const callerHash = (args.sourceContentHash || '').trim();
    if (!attemptId || !sourceBlockId || !callerHash) {
      return fail('CANDIDATE_NOT_FOUND', 'attemptId, sourceBlockId and sourceContentHash are required.');
    }
    if (!Number.isInteger(args.documentVersion) || args.documentVersion < 1) {
      return fail('CANDIDATE_NOT_FOUND', 'documentVersion must be a positive integer.');
    }
    const validated = validateInterpretationCandidates(args.candidates);
    if (!validated.ok) return fail(validated.code, validated.message);
    if (failWritesForTest) return fail('PERSISTENCE_FAILED', 'Interpretation store unavailable (injected); nothing was saved.');

    // Canonical source authority: the PracticeDocumentRevision is
    // authoritative. The caller hash is optimistic context only and can
    // never install authority — the block hash is computed server-side.
    let revision: Awaited<ReturnType<typeof practicePadDocumentStore.getRevision>>;
    try {
      revision = await practicePadDocumentStore.getRevision(args.identity, attemptId, args.documentVersion);
    } catch {
      return fail('PERSISTENCE_FAILED', 'Practice document unavailable; interpretation cannot be proposed.');
    }
    if (!revision) {
      return fail('INTERPRETATION_NOT_FOUND', 'Canonical practice revision does not exist for this attempt and version.');
    }
    const sourceBlock = revision.snapshot.blocks.find((b) => b.blockId === sourceBlockId) ?? null;
    if (!sourceBlock) {
      return fail('CANDIDATE_NOT_FOUND', 'Source block does not exist in the canonical revision.');
    }
    if (sourceBlock.kind === 'TEXT' || sourceBlock.kind === 'EQUATION') {
      return fail('UNSUPPORTED_REPRESENTATION', 'Text and equation blocks are checked directly and are not eligible for interpretation.');
    }
    const sourceContentHash = blockContentHash(sourceBlock);
    if (callerHash !== sourceContentHash) {
      return fail('INTERPRETATION_STALE', 'Caller source hash does not match the canonical raw source; authority is server-computed.');
    }

    const interpretation: PracticeWorkInterpretation = {
      interpretationId: `ppint_${randomUUID()}`,
      schoolId: args.identity.schoolId,
      studentId: args.identity.studentId,
      attemptId,
      documentVersion: args.documentVersion,
      sourceBlockId,
      sourceContentHash,
      representationClass: 'UNKNOWN',
      candidates: validated.candidates,
      status: 'CONFIRMATION_REQUIRED',
      interpreter: args.interpreter ?? 'backend',
      interpreterVersion: args.interpreterVersion ?? 'pp08-1',
      createdAt: nowISO(),
      confirmedAt: null,
      confirmedCandidateId: null,
    };

    try {
      await (prisma as any).$executeRawUnsafe(
        `INSERT INTO "PracticePadInterpretation"
          ("interpretationId", "schoolId", "studentId", "attemptId", "documentVersion", "sourceBlockId", "sourceContentHash", "representationClass", "candidatesJson", "status", "interpreter", "interpreterVersion")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        interpretation.interpretationId, interpretation.schoolId, interpretation.studentId,
        interpretation.attemptId, interpretation.documentVersion, interpretation.sourceBlockId,
        interpretation.sourceContentHash, interpretation.representationClass,
        JSON.stringify(interpretation.candidates), interpretation.status,
        interpretation.interpreter, interpretation.interpreterVersion,
      );
      if (memoryActive()) mem().set(keyOf(interpretation.interpretationId), interpretation);
      return { ok: true, interpretation };
    } catch (cause) {
      if (memoryActive()) {
        mem().set(keyOf(interpretation.interpretationId), interpretation);
        return { ok: true, interpretation };
      }
      throw persistenceFailure('write', cause);
    }
  },

  async getInterpretation(
    identity: ResolvedTutorIdentity,
    interpretationId: string,
  ): Promise<PracticeWorkInterpretation | null> {
    try {
      return owned(await readDurableById(interpretationId), identity);
    } catch (cause) {
      if (memoryActive()) return owned(mem().get(keyOf(interpretationId)) || null, identity);
      throw persistenceFailure('read', cause);
    }
  },

  /**
   * Latest CONFIRMED interpretation for an exact raw source. A confirmed
   * record whose sourceContentHash no longer matches the current raw
   * block is STALE and is never returned here.
   */
  async findConfirmedForSource(
    identity: ResolvedTutorIdentity,
    attemptId: string,
    documentVersion: number,
    sourceBlockId: string,
    sourceContentHash: string,
  ): Promise<PracticeWorkInterpretation | null> {
    let rec: PracticeWorkInterpretation | null = null;
    try {
      rec = owned(await readDurableConfirmed(attemptId, documentVersion, sourceBlockId), identity);
    } catch (cause) {
      if (memoryActive()) {
        rec = null;
        for (const cand of mem().values()) {
          if (
            cand.attemptId === attemptId &&
            cand.documentVersion === documentVersion &&
            cand.sourceBlockId === sourceBlockId &&
            cand.status === 'CONFIRMED'
          ) {
            rec = owned(cand, identity);
            break;
          }
        }
      } else {
        throw persistenceFailure('read', cause);
      }
    }
    if (!rec) return null;
    // Stale law: exact hash must match the current raw source.
    if (rec.sourceContentHash !== sourceContentHash) return null;
    return rec;
  },

  /**
   * Latest interpretation (any status) for an exact raw source, for
   * learner-safe confirmation metadata. Stale hashes never match.
   */
  async findLatestForSource(
    identity: ResolvedTutorIdentity,
    attemptId: string,
    documentVersion: number,
    sourceBlockId: string,
    sourceContentHash: string,
  ): Promise<PracticeWorkInterpretation | null> {
    try {
      const rows = await (prisma as any).$queryRawUnsafe<any[]>(
        `SELECT * FROM "PracticePadInterpretation" WHERE "attemptId" = $1 AND "documentVersion" = $2 AND "sourceBlockId" = $3 AND "sourceContentHash" = $4 ORDER BY "createdAt" DESC LIMIT 1`,
        attemptId,
        documentVersion,
        sourceBlockId,
        sourceContentHash,
      );
      return owned(rows[0] ? mapRow(rows[0]) : null, identity);
    } catch (cause) {
      if (memoryActive()) {
        let best: PracticeWorkInterpretation | null = null;
        for (const cand of mem().values()) {
          if (
            cand.attemptId === attemptId &&
            cand.documentVersion === documentVersion &&
            cand.sourceBlockId === sourceBlockId &&
            cand.sourceContentHash === sourceContentHash
          ) {
            const o = owned(cand, identity);
            if (o && (!best || o.createdAt >= best.createdAt)) best = o;
          }
        }
        return best;
      }
      throw persistenceFailure('read', cause);
    }
  },

  /**
   * Backend confirmation boundary. The client selects ONE backend-owned
   * candidateId — it cannot invent normalized equations, confidence, or
   * provenance. Cross-school / cross-learner confirmation fails closed.
   */
  async confirmPracticeInterpretation(args: ConfirmInterpretationArgs): Promise<ConfirmInterpretationOutcome> {
    let rec: PracticeWorkInterpretation | null = null;
    try {
      rec = await readDurableById(args.interpretationId);
    } catch (cause) {
      if (memoryActive()) {
        rec = mem().get(keyOf(args.interpretationId)) || null;
      } else {
        throw persistenceFailure('read', cause);
      }
    }
    if (!rec) return fail('INTERPRETATION_NOT_FOUND', 'Interpretation not found.');
    if (rec.schoolId !== args.identity.schoolId || rec.studentId !== args.identity.studentId) {
      return fail('INTERPRETATION_FORBIDDEN', 'Interpretation belongs to a different learner or school.');
    }
    if (rec.attemptId !== args.attemptId) {
      return fail('INTERPRETATION_NOT_FOUND', 'Interpretation does not belong to this attempt.');
    }
    // Canonical re-verification: confirmation binds the exact raw source
    // in the backend-owned PP-03 revision. Caller metadata is optimistic
    // context only — version, block id, and content hash are recomputed
    // server-side and must match the stored interpretation exactly.
    let revision: Awaited<ReturnType<typeof practicePadDocumentStore.getRevision>>;
    try {
      revision = await practicePadDocumentStore.getRevision(args.identity, rec.attemptId, rec.documentVersion);
    } catch {
      return fail('PERSISTENCE_FAILED', 'Practice document unavailable; interpretation cannot be confirmed.');
    }
    if (!revision) {
      return fail('INTERPRETATION_STALE', 'Canonical practice revision no longer exists; recognition cannot carry across.');
    }
    const canonicalBlock = revision.snapshot.blocks.find((b) => b.blockId === rec.sourceBlockId) ?? null;
    if (!canonicalBlock) {
      return fail('INTERPRETATION_STALE', 'Canonical source block no longer exists; recognition cannot carry across.');
    }
    const canonicalHash = blockContentHash(canonicalBlock);
    if (rec.sourceContentHash !== canonicalHash) {
      return fail('INTERPRETATION_STALE', 'Raw work changed since interpretation; recognition cannot carry across.');
    }
    // Stale law: version, block, or content-hash drift all mean the raw
    // source changed — recognition can never carry across silently.
    if (
      rec.documentVersion !== args.documentVersion ||
      rec.sourceBlockId !== args.sourceBlockId ||
      rec.sourceContentHash !== args.sourceContentHash
    ) {
      return fail('INTERPRETATION_STALE', 'Raw work changed since interpretation; recognition cannot carry across.');
    }
    if (rec.status === 'CONFIRMED') {
      return fail('INTERPRETATION_STALE', 'Interpretation is already confirmed and cannot be reconfirmed.');
    }
    if (rec.status === 'REJECTED' || rec.status === 'UNSUPPORTED') {
      return fail('UNSUPPORTED_REPRESENTATION', 'Interpretation is not confirmable in its current state.');
    }
    const candidate = rec.candidates.find((c) => c.candidateId === args.candidateId);
    if (!candidate) return fail('CANDIDATE_NOT_FOUND', 'Candidate is not owned by this interpretation.');
    if (failWritesForTest) return fail('PERSISTENCE_FAILED', 'Interpretation store unavailable (injected); nothing was confirmed.');

    const confirmed: PracticeWorkInterpretation = {
      ...rec,
      representationClass: candidate.representationClass,
      status: 'CONFIRMED',
      confirmedAt: nowISO(),
      confirmedCandidateId: candidate.candidateId,
    };
    try {
      const updatedRows = await (prisma as any).$executeRawUnsafe(
        `UPDATE "PracticePadInterpretation" SET "status" = 'CONFIRMED', "representationClass" = $2, "confirmedCandidateId" = $3, "confirmedAt" = CURRENT_TIMESTAMP
          WHERE "interpretationId" = $1 AND "status" != 'CONFIRMED'`,
        rec.interpretationId, candidate.representationClass, candidate.candidateId,
      );
      if (Number(updatedRows) !== 1 && !memoryActive()) {
        return fail('INTERPRETATION_STALE', 'Interpretation changed concurrently; confirmation refused.');
      }
      if (memoryActive()) mem().set(keyOf(rec.interpretationId), confirmed);
      return { ok: true, interpretation: confirmed };
    } catch (cause) {
      if (memoryActive()) {
        mem().set(keyOf(rec.interpretationId), confirmed);
        return { ok: true, interpretation: confirmed };
      }
      throw persistenceFailure('write', cause);
    }
  },

  async resetForTest(): Promise<void> {
    if (testMemory) testMemory.clear();
    failWritesForTest = false;
    try {
      await (prisma as any).$executeRawUnsafe(`DELETE FROM "PracticePadInterpretation"`);
    } catch {
      // Table may not exist in pure in-memory test runs.
    }
  },
};
