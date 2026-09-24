// ─────────────────────────────────────────────────────────────
// Steadfast AI — Practice Pad PP-03: PracticeDocument owner
//
// ONE Practice Pad work authority. Exactly one active
// PracticeDocument per PracticeAttempt; each saved work state is an
// immutable PracticeDocumentRevision keyed by (attemptId, version).
//
// Head reconciliation: PracticePadWorkVersion REMAINS the canonical
// monotonic head. This store reads the head from it and advances it
// (via seedVersion, never backwards) whenever a new revision wins.
// There is no competing counter.
//
// Concurrency law (§9): two writers must never both claim the same
// next version. Production correctness comes from the database:
// UNIQUE(attemptId, version) plus a conditional head update. The
// loser observes a unique violation / zero-row update and receives
// VERSION_CONFLICT. There is no process-local mutex.
//
// Durability law (matches PP-01 stores): PostgreSQL is the sole
// authority. Tables are provisioned by migration
// 20260926000000_pp03_practice_document; this module NEVER creates
// tables. Any unreachable-database outcome with no explicit test
// double throws PracticePadPersistenceError (fail closed).
// Process memory exists ONLY behind
// __enablePracticePadDocumentMemoryForTest — or, without reopening
// accepted PP-01/PP-02 tests that already install the PP-01 work-version
// seam, while that seam is active. Production never enables either.
//
// Privacy (§14): telemetry helpers expose ids/counts/sizes only.
// Full learner work is never logged here.
// ─────────────────────────────────────────────────────────────

import prisma from '../../lib/prisma';
import { PracticePadPersistenceError } from './practicePadCheckContracts';
import {
  isScopedMediaRefForScope,
  snapshotContentHash,
  validateWorkSnapshot,
  type PracticeDocumentFailureCode,
  type PracticeWorkSnapshot,
} from './practicePadDocumentContracts';
import { practicePadWorkVersionStore, __isPracticePadWorkVersionMemoryEnabledForTest } from './practicePadWorkVersionStore';
import { practiceAttemptService } from '../practiceAttemptService';
import type { ResolvedTutorIdentity } from '../tutorStateContracts';

export interface PracticeDocumentRecord {
  documentId: string;
  attemptId: string;
  schoolId: string;
  studentId: string;
  currentVersion: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface PracticeDocumentRevisionRecord {
  revisionId: string;
  documentId: string;
  attemptId: string;
  version: number;
  schoolId: string;
  studentId: string;
  snapshot: PracticeWorkSnapshot;
  contentHash: string;
  clientSubmissionId: string | null;
  createdAt: string;
}

export interface SavePracticeWorkArgs {
  identity: ResolvedTutorIdentity;
  attemptId: string;
  expectedCurrentVersion?: number | null;
  idempotencyKey?: string | null;
  snapshot: unknown;
}

export type SavePracticeWorkOutcome =
  | {
      ok: true;
      document: PracticeDocumentRecord;
      revision: PracticeDocumentRevisionRecord;
      deduplicated: boolean;
    }
  | { ok: false; code: PracticeDocumentFailureCode; message: string };

function fail(code: PracticeDocumentFailureCode, message: string): SavePracticeWorkOutcome {
  return { ok: false, code, message };
}

function nowISO(): string {
  return new Date().toISOString();
}

function persistenceFailure(operation: string, cause: unknown): PracticePadPersistenceError {
  return new PracticePadPersistenceError(
    `PracticeDocument store ${operation} failed; failing closed — no memory fallback. Cause: ${String((cause as Error)?.message || cause)}`,
  );
}

// ── Explicit test seams ONLY ──

interface DocumentMemory {
  docs: Map<string, PracticeDocumentRecord>;
  revs: Map<string, PracticeDocumentRevisionRecord>;
  idem: Map<string, { contentHash: string; revisionId: string }>;
}

let testMemory: DocumentMemory | null = null;
let failWritesForTest = false;

/** Install an explicit in-memory test double. Focused PP-03 tests only. */
export function __enablePracticePadDocumentMemoryForTest(): void {
  if (!testMemory) testMemory = { docs: new Map(), revs: new Map(), idem: new Map() };
}

/** Force write-path persistence failure. Focused PP-03 tests only. */
export function __setPracticePadDocumentFailWritesForTest(value: boolean): void {
  failWritesForTest = value;
}

function memoryActive(): boolean {
  return testMemory !== null || __isPracticePadWorkVersionMemoryEnabledForTest();
}

function mem(): DocumentMemory {
  if (!testMemory) testMemory = { docs: new Map(), revs: new Map(), idem: new Map() };
  return testMemory;
}

function revKey(attemptId: string, version: number): string {
  return `${attemptId}::v${version}`;
}

function idemKey(attemptId: string, idempotencyKey: string): string {
  return `${attemptId}::${idempotencyKey}`;
}

// ── Durable row mapping ──

function mapDocRow(row: any): PracticeDocumentRecord {
  return {
    documentId: String(row.documentId),
    attemptId: String(row.attemptId),
    schoolId: String(row.schoolId),
    studentId: String(row.studentId),
    currentVersion: Number(row.currentVersion),
    status: String(row.status),
    createdAt: row.createdAt?.toISOString?.() || nowISO(),
    updatedAt: row.updatedAt?.toISOString?.() || nowISO(),
  };
}

function mapRevRow(row: any): PracticeDocumentRevisionRecord {
  let snapshot: PracticeWorkSnapshot = { blocks: [] };
  try {
    snapshot = JSON.parse(String(row.contentJson)) as PracticeWorkSnapshot;
  } catch {
    snapshot = { blocks: [] };
  }
  return {
    revisionId: String(row.revisionId),
    documentId: String(row.documentId),
    attemptId: String(row.attemptId),
    version: Number(row.version),
    schoolId: String(row.schoolId),
    studentId: String(row.studentId),
    snapshot,
    contentHash: String(row.contentHash),
    clientSubmissionId: row.clientSubmissionId != null ? String(row.clientSubmissionId) : null,
    createdAt: row.createdAt?.toISOString?.() || nowISO(),
  };
}

// ── Durable primitives (raw provisioned tables, no CREATE TABLE) ──

async function readDurableDoc(attemptId: string): Promise<PracticeDocumentRecord | null> {
  const rows = await (prisma as any).$queryRawUnsafe<any[]>(
    `SELECT * FROM "PracticePadDocument" WHERE "attemptId" = $1 LIMIT 1`,
    attemptId,
  );
  return rows[0] ? mapDocRow(rows[0]) : null;
}

async function readDurableRev(attemptId: string, version: number): Promise<PracticeDocumentRevisionRecord | null> {
  const rows = await (prisma as any).$queryRawUnsafe<any[]>(
    `SELECT * FROM "PracticePadDocumentRevision" WHERE "attemptId" = $1 AND "version" = $2 LIMIT 1`,
    attemptId,
    version,
  );
  return rows[0] ? mapRevRow(rows[0]) : null;
}

async function readDurableIdem(attemptId: string, key: string): Promise<PracticeDocumentRevisionRecord | null> {
  const rows = await (prisma as any).$queryRawUnsafe<any[]>(
    `SELECT * FROM "PracticePadDocumentRevision" WHERE "attemptId" = $1 AND "clientSubmissionId" = $2 LIMIT 1`,
    attemptId,
    key,
  );
  return rows[0] ? mapRevRow(rows[0]) : null;
}

function ownedDoc(doc: PracticeDocumentRecord | null, identity: ResolvedTutorIdentity): PracticeDocumentRecord | null {
  if (!doc) return null;
  if (doc.schoolId !== identity.schoolId || doc.studentId !== identity.studentId) return null;
  return doc;
}

function ownedRev(rev: PracticeDocumentRevisionRecord | null, identity: ResolvedTutorIdentity): PracticeDocumentRevisionRecord | null {
  if (!rev) return null;
  if (rev.schoolId !== identity.schoolId || rev.studentId !== identity.studentId) return null;
  return rev;
}

export const practicePadDocumentStore = {
  async getDocument(identity: ResolvedTutorIdentity, attemptId: string): Promise<PracticeDocumentRecord | null> {
    try {
      return ownedDoc(await readDurableDoc(attemptId), identity);
    } catch (cause) {
      if (memoryActive()) return ownedDoc(mem().docs.get(attemptId) || null, identity);
      throw persistenceFailure('read', cause);
    }
  },

  async getRevision(
    identity: ResolvedTutorIdentity,
    attemptId: string,
    version: number,
  ): Promise<PracticeDocumentRevisionRecord | null> {
    try {
      return ownedRev(await readDurableRev(attemptId, version), identity);
    } catch (cause) {
      if (memoryActive()) return ownedRev(mem().revs.get(revKey(attemptId, version)) || null, identity);
      throw persistenceFailure('read', cause);
    }
  },

  /**
   * Canonical save (§8):
   * A. no revision yet → persist revision for the current seeded version.
   * B. identical snapshot retry → same logical revision, no duplicate.
   * C. changed work + expected == current → exactly one new revision.
   * D. expected != current → VERSION_CONFLICT, never overwrite.
   * Same idempotency key + changed payload → IDEMPOTENCY_CONFLICT.
   */
  async savePracticeWork(
    args: SavePracticeWorkArgs,
    deps: { attemptOwner?: typeof practiceAttemptService } = {},
  ): Promise<SavePracticeWorkOutcome> {
    const attemptId = (args.attemptId || '').trim();
    if (!attemptId) return fail('DOCUMENT_NOT_FOUND', 'attemptId is required.');
    const key = typeof args.idempotencyKey === 'string' && args.idempotencyKey.trim() ? args.idempotencyKey.trim() : null;

    const validated = validateWorkSnapshot(args.snapshot);
    if (!validated.ok) return fail(validated.code, validated.message);
    const snapshot = validated.snapshot;
    // PP-08 media authority: on this protected save path every media
    // reference must be scoped to exactly this school/learner/attempt.
    // Unschemed opaque tokens and wrong-scope refs are rejected here;
    // legacy opaque acceptance in validateWorkSnapshot is back-compat
    // only and never confers PP-08 authority. Nothing is fetched.
    for (const block of snapshot.blocks) {
      if (block.kind === 'DRAWING' || block.kind === 'IMAGE' || block.kind === 'IMAGE_REF') {
        const scoped = isScopedMediaRefForScope(String(block.ref ?? ''), {
          schoolId: args.identity.schoolId,
          studentId: args.identity.studentId,
          attemptId,
        });
        if (!scoped) {
          return fail(
            'INVALID_WORK_SNAPSHOT',
            `Block ${block.blockId} media ref must be scoped to this school/learner/attempt (<scheme>:<schoolId>/<studentId>/<attemptId>/<id>).`,
          );
        }
      }
    }
    const contentHash = snapshotContentHash(snapshot);

    // Attempt ownership is authoritative. Scoped lookup returns null for
    // missing OR not-owned attempts (no ownership oracle).
    const attemptOwner = deps.attemptOwner ?? practiceAttemptService;
    let attempt: Awaited<ReturnType<typeof attemptOwner.getPracticeAttempt>>;
    try {
      attempt = await attemptOwner.getPracticeAttempt(
        { schoolId: args.identity.schoolId, studentId: args.identity.studentId },
        attemptId,
      );
    } catch (cause) {
      return fail('PERSISTENCE_FAILED', `Attempt ownership could not be verified; nothing was saved. Cause: ${String((cause as Error)?.message || cause)}`);
    }
    if (!attempt) return fail('DOCUMENT_NOT_FOUND', 'Practice attempt not found for this learner and school; nothing was saved.');

    // Canonical head (PP-01 authority). Failure → no fake saved revision.
    let head: number;
    try {
      head = await practicePadWorkVersionStore.getCurrentVersion(attemptId);
    } catch (cause) {
      return fail('PERSISTENCE_FAILED', `Work version head unavailable; nothing was saved. Cause: ${String((cause as Error)?.message || cause)}`);
    }

    // Same-key replay check first: identical → dedupe, changed → conflict.
    if (key) {
      let prior: PracticeDocumentRevisionRecord | null = null;
      try {
        prior = ownedRev(await readDurableIdem(attemptId, key), args.identity);
      } catch (cause) {
        if (memoryActive()) {
          prior = null;
          for (const rev of mem().revs.values()) {
            if (rev.attemptId === attemptId && rev.clientSubmissionId === key) {
              prior = ownedRev(rev, args.identity);
              break;
            }
          }
        } else {
          return fail('PERSISTENCE_FAILED', `Idempotency lookup failed; nothing was saved. Cause: ${String((cause as Error)?.message || cause)}`);
        }
      }
      if (prior) {
        if (prior.contentHash === contentHash) {
          const doc = await this.getDocument(args.identity, attemptId).catch(() => null);
          if (!doc) return fail('PERSISTENCE_FAILED', 'Idempotent replay found a revision without a document; nothing was saved.');
          return { ok: true, document: doc, revision: prior, deduplicated: true };
        }
        return fail('IDEMPOTENCY_CONFLICT', 'Idempotency key was already used with different work.');
      }
    }

    const createdAt = nowISO();
    const documentId = `ppdoc_${attemptId}`;

    const buildDoc = (version: number, stamp: string): PracticeDocumentRecord => ({
      documentId,
      attemptId,
      schoolId: attempt.schoolId,
      studentId: attempt.studentId,
      currentVersion: version,
      status: 'active',
      createdAt: stamp,
      updatedAt: stamp,
    });

    const buildRev = (document: PracticeDocumentRecord, version: number): PracticeDocumentRevisionRecord => ({
      revisionId: `pprev_${attemptId}_v${version}`,
      documentId: document.documentId,
      attemptId,
      version,
      schoolId: attempt.schoolId,
      studentId: attempt.studentId,
      snapshot,
      contentHash,
      clientSubmissionId: key,
      createdAt,
    });

    // Load the current document + head revision (durable first).
    let doc: PracticeDocumentRecord | null = null;
    let headRev: PracticeDocumentRevisionRecord | null = null;
    let durableReachable = true;
    try {
      doc = await readDurableDoc(attemptId);
      headRev = await readDurableRev(attemptId, head);
    } catch {
      durableReachable = false;
      if (!memoryActive()) return fail('PERSISTENCE_FAILED', 'Practice work store unavailable; nothing was saved.');
      doc = mem().docs.get(attemptId) || null;
      headRev = mem().revs.get(revKey(attemptId, head)) || null;
    }
    if (failWritesForTest) return fail('PERSISTENCE_FAILED', 'Practice work store unavailable (injected); nothing was saved.');
    if (doc && (doc.schoolId !== args.identity.schoolId || doc.studentId !== args.identity.studentId)) {
      return fail('DOCUMENT_FORBIDDEN', 'Practice document belongs to a different learner or school.');
    }

    // B. Identical snapshot retry (different key): same logical revision.
    if (doc && headRev && headRev.contentHash === contentHash) {
      if (headRev.schoolId !== args.identity.schoolId || headRev.studentId !== args.identity.studentId) {
        return fail('DOCUMENT_FORBIDDEN', 'Practice revision belongs to a different learner or school.');
      }
      return { ok: true, document: ownedDoc(doc, args.identity) as PracticeDocumentRecord, revision: headRev, deduplicated: true };
    }

    const expected = args.expectedCurrentVersion ?? null;
    if (doc) {
      // Document exists but its head must agree with the version authority.
      const effectiveHead = Math.max(head, doc.currentVersion);
      if (expected !== null && expected !== effectiveHead) {
        return fail('VERSION_CONFLICT', `Expected v${expected} but durable work is v${effectiveHead}; newer work is never overwritten.`);
      }
      if (!headRev) {
        // Head revision missing while a document exists: cannot fabricate.
        return fail('PERSISTENCE_FAILED', 'Current revision is missing; nothing was saved.');
      }
      const next = effectiveHead + 1;
      const updated: PracticeDocumentRecord = { ...doc, currentVersion: next, updatedAt: createdAt };
      const rev = buildRev(updated, next);
      if (durableReachable) {
        try {
          await (prisma as any).$executeRawUnsafe(
            `INSERT INTO "PracticePadDocumentRevision"
               ("revisionId", "documentId", "attemptId", "version", "schoolId", "studentId", "contentJson", "contentHash", "clientSubmissionId")
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
            rev.revisionId, rev.documentId, rev.attemptId, rev.version, rev.schoolId, rev.studentId,
            JSON.stringify(snapshot), rev.contentHash, rev.clientSubmissionId,
          );
          const updatedRows = await (prisma as any).$executeRawUnsafe(
            `UPDATE "PracticePadDocument" SET "currentVersion" = $2, "updatedAt" = CURRENT_TIMESTAMP
              WHERE "attemptId" = $1 AND "currentVersion" = $3`,
            attemptId, next, doc.currentVersion,
          );
          if (Number(updatedRows) !== 1) {
            return fail('VERSION_CONFLICT', 'Concurrent writer advanced the work first; newer work is never overwritten.');
          }
          await practicePadWorkVersionStore.seedVersion(attemptId, next);
          if (memoryActive()) {
            mem().docs.set(attemptId, updated);
            mem().revs.set(revKey(attemptId, next), rev);
            if (key) mem().idem.set(idemKey(attemptId, key), { contentHash, revisionId: rev.revisionId });
          }
          return { ok: true, document: updated, revision: rev, deduplicated: false };
        } catch (cause) {
          if (memoryActive()) {
            // Fall through to the memory claim below.
          } else {
            const msg = String((cause as Error)?.message || cause);
            if (/unique|duplicate|conflict/i.test(msg)) {
              return fail('VERSION_CONFLICT', 'Concurrent writer claimed the next version first.');
            }
            return fail('PERSISTENCE_FAILED', `Practice work could not be durably saved; nothing was saved. Cause: ${msg}`);
          }
        }
      }
      // Explicit test-double claim (also covers the lost-race path above).
      if (memoryActive()) {
        const m = mem();
        if (m.revs.has(revKey(attemptId, next))) {
          return fail('VERSION_CONFLICT', 'Concurrent writer claimed the next version first.');
        }
        const live = m.docs.get(attemptId) || doc;
        if (live.currentVersion !== doc.currentVersion) {
          return fail('VERSION_CONFLICT', 'Concurrent writer advanced the work first; newer work is never overwritten.');
        }
        m.docs.set(attemptId, updated);
        m.revs.set(revKey(attemptId, next), rev);
        if (key) m.idem.set(idemKey(attemptId, key), { contentHash, revisionId: rev.revisionId });
        try {
          await practicePadWorkVersionStore.seedVersion(attemptId, next);
        } catch {
          // Memory claim already atomic for the test double; version head
          // mirrors it through the shared PP-01 seam.
        }
        return { ok: true, document: updated, revision: rev, deduplicated: false };
      }
      return fail('PERSISTENCE_FAILED', 'Practice work could not be durably saved; nothing was saved.');
    }

    // A. No document yet → persist the first revision for the seeded head.
    if (expected !== null && expected !== head) {
      return fail('VERSION_CONFLICT', `Expected v${expected} but durable work is v${head}; newer work is never overwritten.`);
    }
    const seeded = buildDoc(head, createdAt);
    const first = buildRev(seeded, head);
    if (durableReachable) {
      try {
        await (prisma as any).$executeRawUnsafe(
          `INSERT INTO "PracticePadDocument" ("documentId", "attemptId", "schoolId", "studentId", "currentVersion", "status")
           VALUES ($1,$2,$3,$4,$5,'active') ON CONFLICT ("attemptId") DO NOTHING`,
          seeded.documentId, seeded.attemptId, seeded.schoolId, seeded.studentId, seeded.currentVersion,
        );
        await (prisma as any).$executeRawUnsafe(
          `INSERT INTO "PracticePadDocumentRevision"
             ("revisionId", "documentId", "attemptId", "version", "schoolId", "studentId", "contentJson", "contentHash", "clientSubmissionId")
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          first.revisionId, first.documentId, first.attemptId, first.version, first.schoolId, first.studentId,
          JSON.stringify(snapshot), first.contentHash, first.clientSubmissionId,
        );
        const winner = await readDurableDoc(attemptId);
        if (memoryActive() && winner) {
          mem().docs.set(attemptId, winner);
          mem().revs.set(revKey(attemptId, head), first);
          if (key) mem().idem.set(idemKey(attemptId, key), { contentHash, revisionId: first.revisionId });
        }
        return { ok: true, document: winner ?? seeded, revision: first, deduplicated: false };
      } catch (cause) {
        if (!memoryActive()) {
          const msg = String((cause as Error)?.message || cause);
          if (/unique|duplicate|conflict/i.test(msg)) {
            return fail('VERSION_CONFLICT', 'Concurrent writer claimed the work first.');
          }
          return fail('PERSISTENCE_FAILED', `Practice work could not be durably saved; nothing was saved. Cause: ${msg}`);
        }
        // Fall through to the memory claim below.
      }
    }
    if (memoryActive()) {
      const m = mem();
      const live = m.docs.get(attemptId);
      if (live) {
        // A concurrent first-writer won inside the test double.
        return fail('VERSION_CONFLICT', 'Concurrent writer claimed the work first.');
      }
      m.docs.set(attemptId, seeded);
      m.revs.set(revKey(attemptId, head), first);
      if (key) m.idem.set(idemKey(attemptId, key), { contentHash, revisionId: first.revisionId });
      return { ok: true, document: seeded, revision: first, deduplicated: false };
    }
    return fail('PERSISTENCE_FAILED', 'Practice work could not be durably saved; nothing was saved.');
  },

  async resetForTest(): Promise<void> {
    if (testMemory) {
      testMemory.docs.clear();
      testMemory.revs.clear();
      testMemory.idem.clear();
    }
    failWritesForTest = false;
    try {
      await (prisma as any).$executeRawUnsafe(`DELETE FROM "PracticePadDocumentRevision"`);
      await (prisma as any).$executeRawUnsafe(`DELETE FROM "PracticePadDocument"`);
    } catch {
      // Tables may not exist in pure in-memory test runs.
    }
  },
};

/** Safe telemetry projection (§14): ids and size buckets only, never work content. */
export function buildPracticeDocumentTelemetry(args: {
  attemptId: string;
  documentId: string | null;
  revisionId: string | null;
  version: number;
  snapshot: PracticeWorkSnapshot | null;
  failureCode?: PracticeDocumentFailureCode;
}): {
  attemptId: string;
  documentId: string | null;
  revisionId: string | null;
  version: number;
  blockCount: number;
  textBlockCount: number;
  equationBlockCount: number;
  mediaRefCount: number;
  contentSizeBucket: 'empty' | 'small' | 'medium' | 'large';
  failureCode?: PracticeDocumentFailureCode;
} {
  const blocks = args.snapshot?.blocks ?? [];
  let bytes = 0;
  let text = 0;
  let equations = 0;
  let media = 0;
  for (const b of blocks) {
    if (b.kind === 'TEXT') {
      text += 1;
      bytes += (b.content || '').length;
    } else if (b.kind === 'EQUATION') {
      equations += 1;
      bytes += (b.content || '').length;
    } else {
      media += 1;
    }
  }
  return {
    attemptId: args.attemptId,
    documentId: args.documentId,
    revisionId: args.revisionId,
    version: args.version,
    blockCount: blocks.length,
    textBlockCount: text,
    equationBlockCount: equations,
    mediaRefCount: media,
    contentSizeBucket: bytes === 0 ? 'empty' : bytes <= 512 ? 'small' : bytes <= 4096 ? 'medium' : 'large',
    ...(args.failureCode ? { failureCode: args.failureCode } : {}),
  };
}
