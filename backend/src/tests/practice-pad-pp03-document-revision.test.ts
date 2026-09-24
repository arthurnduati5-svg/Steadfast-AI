// ─────────────────────────────────────────────────────────────
// Steadfast AI — Practice Pad PP-03 (A/3):
// document / immutable revision semantics.
// Zero model calls. Prisma mocked unavailable; explicit doubles only.
// ─────────────────────────────────────────────────────────────

import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../lib/prisma', () => {
  const mockQueryRaw = vi.fn().mockRejectedValue(new Error('Prisma mocked unavailable'));
  return {
    default: {
      $queryRaw: mockQueryRaw,
      $executeRawUnsafe: vi.fn().mockRejectedValue(new Error('Prisma mocked unavailable')),
      $queryRawUnsafe: vi.fn().mockRejectedValue(new Error('Prisma mocked unavailable')),
      practiceAttempt: {
        create: vi.fn().mockRejectedValue(new Error('Prisma mocked unavailable')),
        findMany: vi.fn().mockRejectedValue(new Error('Prisma mocked unavailable')),
        findUnique: vi.fn().mockRejectedValue(new Error('Prisma mocked unavailable')),
      },
    },
  };
});

import { practiceAttemptService, _clearAttemptStoreForTest, __setPracticeAttemptDurableForTest } from '../services/practiceAttemptService';
import { practicePadWorkVersionStore, __enablePracticePadWorkVersionMemoryForTest } from '../services/practicePadRuntime/practicePadWorkVersionStore';
import {
  practicePadDocumentStore,
  buildPracticeDocumentTelemetry,
  __enablePracticePadDocumentMemoryForTest,
} from '../services/practicePadRuntime/practicePadDocumentStore';
import {
  snapshotContentHash,
  snapshotFromWorkText,
  snapshotToWorkText,
  PRACTICE_WORK_MAX_BLOCKS,
  PRACTICE_WORK_MAX_TEXT_PER_BLOCK,
} from '../services/practicePadRuntime/practicePadDocumentContracts';

const SCHOOL_A = 'school-pp03-a';
const SCHOOL_B = 'school-pp03-b';
const LEARNER_1 = 'learner-pp03-1';
const LEARNER_2 = 'learner-pp03-2';

async function createAttempt(schoolId: string, studentId: string): Promise<string> {
  const created = await practiceAttemptService.createPracticeAttempt(
    { schoolId, studentId },
    { kind: 'open_response', promptSummary: 'Solve for x: 2x + 4 = 10', subject: 'maths', topic: 'linear equations', outcome: 'not_evaluated' },
  );
  const attemptId = created.attempt.attemptId;
  await practicePadWorkVersionStore.seedVersion(attemptId, 1);
  return attemptId;
}

describe('Practice Pad PP-03 — document / immutable revision semantics', () => {
  beforeEach(async () => {
    __enablePracticePadDocumentMemoryForTest();
    __enablePracticePadWorkVersionMemoryForTest();
    __setPracticeAttemptDurableForTest(true);
    _clearAttemptStoreForTest();
    await practicePadDocumentStore.resetForTest();
    await practicePadWorkVersionStore.resetForTest();
    vi.clearAllMocks();
  });

  it('exactly one canonical document per attempt; first revision at the seeded head', async () => {
    const attemptId = await createAttempt(SCHOOL_A, LEARNER_1);
    const saved = await practicePadDocumentStore.savePracticeWork({
      identity: { schoolId: SCHOOL_A, studentId: LEARNER_1 },
      attemptId,
      expectedCurrentVersion: 1,
      idempotencyKey: 'doc-k-first',
      snapshot: snapshotFromWorkText('x = 4'),
    });
    expect(saved.ok).toBe(true);
    if (!saved.ok) return;
    expect(saved.revision.version).toBe(1);
    expect(saved.deduplicated).toBe(false);
    const again = await practicePadDocumentStore.getDocument({ schoolId: SCHOOL_A, studentId: LEARNER_1 }, attemptId);
    expect(again?.documentId).toBe(saved.document.documentId);
    // Head reconciled, not duplicated: document head == version authority head.
    expect(saved.document.currentVersion).toBe(await practicePadWorkVersionStore.getCurrentVersion(attemptId));
  });

  it('identical snapshot retry deduplicates without a new revision', async () => {
    const attemptId = await createAttempt(SCHOOL_A, LEARNER_1);
    const first = await practicePadDocumentStore.savePracticeWork({
      identity: { schoolId: SCHOOL_A, studentId: LEARNER_1 },
      attemptId,
      expectedCurrentVersion: 1,
      idempotencyKey: 'doc-k-a',
      snapshot: snapshotFromWorkText('x = 4'),
    });
    expect(first.ok).toBe(true);
    const retry = await practicePadDocumentStore.savePracticeWork({
      identity: { schoolId: SCHOOL_A, studentId: LEARNER_1 },
      attemptId,
      expectedCurrentVersion: 1,
      idempotencyKey: 'doc-k-b',
      snapshot: snapshotFromWorkText('x = 4'),
    });
    expect(retry.ok).toBe(true);
    if (!retry.ok || !first.ok) return;
    expect(retry.deduplicated).toBe(true);
    expect(retry.revision.revisionId).toBe(first.revision.revisionId);
    expect(retry.document.currentVersion).toBe(1);
  });

  it('changed work advances v1 -> v2; stale writer conflicts; old revision stays readable', async () => {
    const attemptId = await createAttempt(SCHOOL_A, LEARNER_1);
    const v1 = await practicePadDocumentStore.savePracticeWork({
      identity: { schoolId: SCHOOL_A, studentId: LEARNER_1 },
      attemptId,
      expectedCurrentVersion: 1,
      idempotencyKey: 'doc-k-v1',
      snapshot: snapshotFromWorkText('x = 4'),
    });
    expect(v1.ok).toBe(true);
    const v2 = await practicePadDocumentStore.savePracticeWork({
      identity: { schoolId: SCHOOL_A, studentId: LEARNER_1 },
      attemptId,
      expectedCurrentVersion: 1,
      idempotencyKey: 'doc-k-v2',
      snapshot: snapshotFromWorkText('2x = 8\nx = 4'),
    });
    expect(v2.ok).toBe(true);
    if (!v2.ok) return;
    expect(v2.revision.version).toBe(2);
    expect(v2.deduplicated).toBe(false);
    // Stale writer (expected v1, head is v2) can never overwrite newer work.
    const stale = await practicePadDocumentStore.savePracticeWork({
      identity: { schoolId: SCHOOL_A, studentId: LEARNER_1 },
      attemptId,
      expectedCurrentVersion: 1,
      idempotencyKey: 'doc-k-stale',
      snapshot: snapshotFromWorkText('x = 5'),
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.code).toBe('VERSION_CONFLICT');
    // Immutable old revision remains recoverable with exact content.
    const old = await practicePadDocumentStore.getRevision({ schoolId: SCHOOL_A, studentId: LEARNER_1 }, attemptId, 1);
    expect(old?.contentHash).toBe(v1.ok ? v1.revision.contentHash : 'unreachable');
    expect(snapshotToWorkText(old!.snapshot)).toBe('x = 4');
    expect(snapshotContentHash(old!.snapshot)).toBe(old!.contentHash);
  });

  it('same idempotency key with changed payload conflicts', async () => {
    const attemptId = await createAttempt(SCHOOL_A, LEARNER_1);
    const first = await practicePadDocumentStore.savePracticeWork({
      identity: { schoolId: SCHOOL_A, studentId: LEARNER_1 },
      attemptId,
      expectedCurrentVersion: 1,
      idempotencyKey: 'doc-k-replay',
      snapshot: snapshotFromWorkText('x = 4'),
    });
    expect(first.ok).toBe(true);
    const replaySame = await practicePadDocumentStore.savePracticeWork({
      identity: { schoolId: SCHOOL_A, studentId: LEARNER_1 },
      attemptId,
      expectedCurrentVersion: 1,
      idempotencyKey: 'doc-k-replay',
      snapshot: snapshotFromWorkText('x = 4'),
    });
    expect(replaySame.ok).toBe(true);
    if (replaySame.ok && first.ok) {
      expect(replaySame.deduplicated).toBe(true);
      expect(replaySame.revision.revisionId).toBe(first.revision.revisionId);
    }
    const replayChanged = await practicePadDocumentStore.savePracticeWork({
      identity: { schoolId: SCHOOL_A, studentId: LEARNER_1 },
      attemptId,
      expectedCurrentVersion: 1,
      idempotencyKey: 'doc-k-replay',
      snapshot: snapshotFromWorkText('x = 9'),
    });
    expect(replayChanged.ok).toBe(false);
    if (!replayChanged.ok) expect(replayChanged.code).toBe('IDEMPOTENCY_CONFLICT');
  });

  it('work bounds are enforced explicitly, never silently truncated', async () => {
    const attemptId = await createAttempt(SCHOOL_A, LEARNER_1);
    const tooMany = await practicePadDocumentStore.savePracticeWork({
      identity: { schoolId: SCHOOL_A, studentId: LEARNER_1 },
      attemptId,
      expectedCurrentVersion: 1,
      idempotencyKey: 'doc-k-bounds-blocks',
      snapshot: { blocks: Array.from({ length: PRACTICE_WORK_MAX_BLOCKS + 1 }, (_, i) => ({ blockId: `b${i}`, kind: 'TEXT', content: 'x', order: i })) },
    });
    expect(tooMany.ok).toBe(false);
    if (!tooMany.ok) expect(tooMany.code).toBe('WORK_TOO_LARGE');
    const tooLong = await practicePadDocumentStore.savePracticeWork({
      identity: { schoolId: SCHOOL_A, studentId: LEARNER_1 },
      attemptId,
      expectedCurrentVersion: 1,
      idempotencyKey: 'doc-k-bounds-text',
      snapshot: snapshotFromWorkText('y = ' + '1'.repeat(PRACTICE_WORK_MAX_TEXT_PER_BLOCK + 1)),
    });
    expect(tooLong.ok).toBe(false);
    if (!tooLong.ok) expect(tooLong.code).toBe('WORK_TOO_LARGE');
    const badKind = await practicePadDocumentStore.savePracticeWork({
      identity: { schoolId: SCHOOL_A, studentId: LEARNER_1 },
      attemptId,
      expectedCurrentVersion: 1,
      idempotencyKey: 'doc-k-bounds-kind',
      snapshot: { blocks: [{ blockId: 'b1', kind: 'VIDEO', content: 'x', order: 0 }] },
    });
    expect(badKind.ok).toBe(false);
    if (!badKind.ok) expect(badKind.code).toBe('INVALID_WORK_SNAPSHOT');
    // Nothing was persisted by the rejected saves.
    expect(await practicePadDocumentStore.getDocument({ schoolId: SCHOOL_A, studentId: LEARNER_1 }, attemptId)).toBeNull();
  });

  it('cross-school and cross-learner access fails closed', async () => {
    const attemptId = await createAttempt(SCHOOL_A, LEARNER_1);
    const crossSchool = await practicePadDocumentStore.savePracticeWork({
      identity: { schoolId: SCHOOL_B, studentId: LEARNER_1 },
      attemptId,
      expectedCurrentVersion: 1,
      idempotencyKey: 'doc-k-x',
      snapshot: snapshotFromWorkText('x = 4'),
    });
    expect(crossSchool.ok).toBe(false);
    const crossLearner = await practicePadDocumentStore.savePracticeWork({
      identity: { schoolId: SCHOOL_A, studentId: LEARNER_2 },
      attemptId,
      expectedCurrentVersion: 1,
      idempotencyKey: 'doc-k-x',
      snapshot: snapshotFromWorkText('x = 4'),
    });
    expect(crossLearner.ok).toBe(false);
  });

  it('telemetry never carries learner work content', async () => {
    const attemptId = await createAttempt(SCHOOL_A, LEARNER_1);
    const secret = 'uniqueworkcontent-pp03-9z7q';
    const saved = await practicePadDocumentStore.savePracticeWork({
      identity: { schoolId: SCHOOL_A, studentId: LEARNER_1 },
      attemptId,
      expectedCurrentVersion: 1,
      idempotencyKey: 'doc-k-tel',
      snapshot: snapshotFromWorkText(secret),
    });
    expect(saved.ok).toBe(true);
    if (!saved.ok) return;
    const telemetry = buildPracticeDocumentTelemetry({
      attemptId,
      documentId: saved.document.documentId,
      revisionId: saved.revision.revisionId,
      version: saved.revision.version,
      snapshot: saved.revision.snapshot,
    });
    expect(JSON.stringify(telemetry)).not.toContain(secret);
    expect(telemetry.blockCount).toBe(1);
  });
});
