// ─────────────────────────────────────────────────────────────
// Steadfast AI — Practice Pad PP-08 (A/2):
// raw work + interpretation authority.
//
// Proves: ink is first-class authoritative raw evidence; raw !=
// interpretation; confirmation boundary; stale law; governed media
// refs. Zero model calls. Prisma mocked unavailable; explicit doubles
// only. No DB. No migrations. No frontend. No OCR.
// ─────────────────────────────────────────────────────────────

import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../lib/prisma', () => {
  return {
    default: {
      $queryRaw: vi.fn().mockRejectedValue(new Error('Prisma mocked unavailable')),
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
  __enablePracticePadDocumentMemoryForTest,
} from '../services/practicePadRuntime/practicePadDocumentStore';
import {
  blockContentHash,
  validateWorkSnapshot,
} from '../services/practicePadRuntime/practicePadDocumentContracts';
import {
  practicePadInterpretationStore,
  __enablePracticePadInterpretationMemoryForTest,
} from '../services/practicePadRuntime/practicePadInterpretationStore';
import { practicePadInkInterpreterPort } from '../services/practicePadRuntime/practicePadInkInterpreterPort';

const SCHOOL_A = 'school-pp08-a';
const SCHOOL_B = 'school-pp08-b';
const LEARNER_1 = 'learner-pp08-1';
const LEARNER_2 = 'learner-pp08-2';

function inkSnapshot(blockId = 'ink1') {
  return {
    blocks: [
      {
        blockId,
        kind: 'HANDWRITING',
        order: 0,
        ink: [
          {
            strokeId: 's1',
            points: [
              { x: 10, y: 20, timestampOffsetMs: 0, pressure: 0.5, pointerType: 'pen', tiltX: 10, tiltY: -5 },
              { x: 30, y: 40, timestampOffsetMs: 120 },
            ],
          },
          {
            strokeId: 's2',
            points: [{ x: 50, y: 60, timestampOffsetMs: 0 }],
          },
        ],
      },
    ],
  };
}

async function createAttempt(schoolId: string, studentId: string): Promise<string> {
  const created = await practiceAttemptService.createPracticeAttempt(
    { schoolId, studentId },
    { kind: 'open_response', promptSummary: 'Solve for x: 2x + 4 = 10', subject: 'maths', topic: 'linear equations', outcome: 'not_evaluated' },
  );
  const attemptId = created.attempt.attemptId;
  await practicePadWorkVersionStore.seedVersion(attemptId, 1);
  return attemptId;
}

describe('Practice Pad PP-08 (A) — raw work + interpretation authority', () => {
  beforeEach(async () => {
    __enablePracticePadDocumentMemoryForTest();
    __enablePracticePadWorkVersionMemoryForTest();
    __enablePracticePadInterpretationMemoryForTest();
    __setPracticeAttemptDurableForTest(true);
    _clearAttemptStoreForTest();
    await practicePadDocumentStore.resetForTest();
    await practicePadWorkVersionStore.resetForTest();
    await practicePadInterpretationStore.resetForTest();
    vi.clearAllMocks();
  });

  it('1. vector ink preserves stroke and point order exactly', async () => {
    const attemptId = await createAttempt(SCHOOL_A, LEARNER_1);
    const saved = await practicePadDocumentStore.savePracticeWork({
      identity: { schoolId: SCHOOL_A, studentId: LEARNER_1 },
      attemptId,
      expectedCurrentVersion: 1,
      idempotencyKey: 'pp08-ink-order',
      snapshot: inkSnapshot(),
    });
    expect(saved.ok).toBe(true);
    if (!saved.ok) return;
    const rev = await practicePadDocumentStore.getRevision({ schoolId: SCHOOL_A, studentId: LEARNER_1 }, attemptId, 1);
    const ink = rev?.snapshot.blocks[0]?.ink ?? [];
    expect(ink.map((s) => s.strokeId)).toEqual(['s1', 's2']);
    expect(ink[0].points.map((p) => [p.x, p.y])).toEqual([[10, 20], [30, 40]]);
    expect(ink[1].points.map((p) => [p.x, p.y])).toEqual([[50, 60]]);
  });

  it('2. pressure/pointer metadata survives when supplied', async () => {
    const attemptId = await createAttempt(SCHOOL_A, LEARNER_1);
    const saved = await practicePadDocumentStore.savePracticeWork({
      identity: { schoolId: SCHOOL_A, studentId: LEARNER_1 },
      attemptId,
      expectedCurrentVersion: 1,
      idempotencyKey: 'pp08-ink-meta',
      snapshot: inkSnapshot(),
    });
    expect(saved.ok).toBe(true);
    if (!saved.ok) return;
    const rev = await practicePadDocumentStore.getRevision({ schoolId: SCHOOL_A, studentId: LEARNER_1 }, attemptId, 1);
    const first = rev?.snapshot.blocks[0]?.ink?.[0]?.points[0];
    expect(first?.pressure).toBe(0.5);
    expect(first?.pointerType).toBe('pen');
    expect(first?.tiltX).toBe(10);
    expect(first?.tiltY).toBe(-5);
  });

  it('3. invalid/non-finite points are rejected explicitly', async () => {
    const bad = inkSnapshot();
    (bad.blocks[0] as any).ink[0].points[0].x = Number.NaN;
    const direct = validateWorkSnapshot(bad);
    expect(direct.ok).toBe(false);
    if (direct.ok) return;
    expect(direct.code).toBe('INVALID_WORK_SNAPSHOT');
    const attemptId = await createAttempt(SCHOOL_A, LEARNER_1);
    const saved = await practicePadDocumentStore.savePracticeWork({
      identity: { schoolId: SCHOOL_A, studentId: LEARNER_1 },
      attemptId,
      expectedCurrentVersion: 1,
      idempotencyKey: 'pp08-ink-nan',
      snapshot: bad,
    });
    expect(saved.ok).toBe(false);
  });

  it('4. bounds enforced without silent truncation (oversized ink rejected, nothing saved)', async () => {
    const big = inkSnapshot();
    (big.blocks[0] as any).ink[0].points = Array.from({ length: 513 }, (_, i) => ({ x: i, y: i, timestampOffsetMs: i }));
    const direct = validateWorkSnapshot(big);
    expect(direct.ok).toBe(false);
    if (direct.ok) return;
    expect(direct.code).toBe('WORK_TOO_LARGE');
    const attemptId = await createAttempt(SCHOOL_A, LEARNER_1);
    const saved = await practicePadDocumentStore.savePracticeWork({
      identity: { schoolId: SCHOOL_A, studentId: LEARNER_1 },
      attemptId,
      expectedCurrentVersion: 1,
      idempotencyKey: 'pp08-ink-big',
      snapshot: big,
    });
    expect(saved.ok).toBe(false);
    if (saved.ok) return;
    expect(saved.code).toBe('WORK_TOO_LARGE');
    const missing = await practicePadDocumentStore.getRevision({ schoolId: SCHOOL_A, studentId: LEARNER_1 }, attemptId, 1);
    expect(missing).toBeNull();
  });

  it('5. interpretation candidate never replaces raw work', async () => {
    const attemptId = await createAttempt(SCHOOL_A, LEARNER_1);
    const saved = await practicePadDocumentStore.savePracticeWork({
      identity: { schoolId: SCHOOL_A, studentId: LEARNER_1 },
      attemptId,
      expectedCurrentVersion: 1,
      idempotencyKey: 'pp08-raw-kept',
      snapshot: inkSnapshot(),
    });
    expect(saved.ok).toBe(true);
    if (!saved.ok) return;
    const block = saved.revision.snapshot.blocks[0];
    const proposed = await practicePadInterpretationStore.proposeInterpretation({
      identity: { schoolId: SCHOOL_A, studentId: LEARNER_1 },
      attemptId,
      documentVersion: 1,
      sourceBlockId: block.blockId,
      sourceContentHash: blockContentHash(block),
      candidates: [{ candidateId: 'c1', representationClass: 'EQUATION', normalizedValue: 'x = 4', confidence: 0.9, provenance: 'backend-test' }],
    });
    expect(proposed.ok).toBe(true);
    if (!proposed.ok) return;
    const confirmed = await practicePadInterpretationStore.confirmPracticeInterpretation({
      identity: { schoolId: SCHOOL_A, studentId: LEARNER_1 },
      attemptId,
      documentVersion: 1,
      interpretationId: proposed.interpretation.interpretationId,
      candidateId: 'c1',
      sourceBlockId: block.blockId,
      sourceContentHash: blockContentHash(block),
    });
    expect(confirmed.ok).toBe(true);
    const rev = await practicePadDocumentStore.getRevision({ schoolId: SCHOOL_A, studentId: LEARNER_1 }, attemptId, 1);
    expect(rev?.snapshot.blocks[0]?.kind).toBe('HANDWRITING');
    expect(rev?.snapshot.blocks[0]?.ink?.map((s) => s.strokeId)).toEqual(['s1', 's2']);
    expect(rev?.snapshot.blocks[0]?.content ?? null).toBeNull();
  });

  it('6. candidate is not confirmed truth until confirmation', async () => {
    const attemptId = await createAttempt(SCHOOL_A, LEARNER_1);
    const saved = await practicePadDocumentStore.savePracticeWork({
      identity: { schoolId: SCHOOL_A, studentId: LEARNER_1 },
      attemptId,
      expectedCurrentVersion: 1,
      idempotencyKey: 'pp08-unconfirmed',
      snapshot: inkSnapshot(),
    });
    expect(saved.ok).toBe(true);
    if (!saved.ok) return;
    const block = saved.revision.snapshot.blocks[0];
    const proposed = await practicePadInterpretationStore.proposeInterpretation({
      identity: { schoolId: SCHOOL_A, studentId: LEARNER_1 },
      attemptId,
      documentVersion: 1,
      sourceBlockId: block.blockId,
      sourceContentHash: blockContentHash(block),
      candidates: [{ candidateId: 'c1', representationClass: 'EQUATION', normalizedValue: 'x = 4', confidence: 0.9, provenance: 'backend-test' }],
    });
    expect(proposed.ok).toBe(true);
    if (!proposed.ok) return;
    expect(proposed.interpretation.status).toBe('CONFIRMATION_REQUIRED');
    expect(proposed.interpretation.confirmedCandidateId).toBeNull();
    const usable = await practicePadInterpretationStore.findConfirmedForSource(
      { schoolId: SCHOOL_A, studentId: LEARNER_1 },
      attemptId,
      1,
      block.blockId,
      blockContentHash(block),
    );
    expect(usable).toBeNull();
  });

  it('7. confirmation selects only a backend-owned candidate', async () => {
    const attemptId = await createAttempt(SCHOOL_A, LEARNER_1);
    const saved = await practicePadDocumentStore.savePracticeWork({
      identity: { schoolId: SCHOOL_A, studentId: LEARNER_1 },
      attemptId,
      expectedCurrentVersion: 1,
      idempotencyKey: 'pp08-owned-cand',
      snapshot: inkSnapshot(),
    });
    expect(saved.ok).toBe(true);
    if (!saved.ok) return;
    const block = saved.revision.snapshot.blocks[0];
    const proposed = await practicePadInterpretationStore.proposeInterpretation({
      identity: { schoolId: SCHOOL_A, studentId: LEARNER_1 },
      attemptId,
      documentVersion: 1,
      sourceBlockId: block.blockId,
      sourceContentHash: blockContentHash(block),
      candidates: [{ candidateId: 'c1', representationClass: 'EQUATION', normalizedValue: 'x = 4', confidence: 0.9, provenance: 'backend-test' }],
    });
    expect(proposed.ok).toBe(true);
    if (!proposed.ok) return;
    const invented = await practicePadInterpretationStore.confirmPracticeInterpretation({
      identity: { schoolId: SCHOOL_A, studentId: LEARNER_1 },
      attemptId,
      documentVersion: 1,
      interpretationId: proposed.interpretation.interpretationId,
      candidateId: 'client-invented-x-equals-99',
      sourceBlockId: block.blockId,
      sourceContentHash: blockContentHash(block),
    });
    expect(invented.ok).toBe(false);
    if (invented.ok) return;
    expect(invented.code).toBe('CANDIDATE_NOT_FOUND');
  });

  it('8. cross-school/cross-learner confirmation denied', async () => {
    const attemptId = await createAttempt(SCHOOL_A, LEARNER_1);
    const saved = await practicePadDocumentStore.savePracticeWork({
      identity: { schoolId: SCHOOL_A, studentId: LEARNER_1 },
      attemptId,
      expectedCurrentVersion: 1,
      idempotencyKey: 'pp08-xauth',
      snapshot: inkSnapshot(),
    });
    expect(saved.ok).toBe(true);
    if (!saved.ok) return;
    const block = saved.revision.snapshot.blocks[0];
    const proposed = await practicePadInterpretationStore.proposeInterpretation({
      identity: { schoolId: SCHOOL_A, studentId: LEARNER_1 },
      attemptId,
      documentVersion: 1,
      sourceBlockId: block.blockId,
      sourceContentHash: blockContentHash(block),
      candidates: [{ candidateId: 'c1', representationClass: 'EQUATION', normalizedValue: 'x = 4', confidence: 0.9, provenance: 'backend-test' }],
    });
    expect(proposed.ok).toBe(true);
    if (!proposed.ok) return;
    const hash = blockContentHash(block);
    const crossSchool = await practicePadInterpretationStore.confirmPracticeInterpretation({
      identity: { schoolId: SCHOOL_B, studentId: LEARNER_1 },
      attemptId,
      documentVersion: 1,
      interpretationId: proposed.interpretation.interpretationId,
      candidateId: 'c1',
      sourceBlockId: block.blockId,
      sourceContentHash: hash,
    });
    expect(crossSchool.ok).toBe(false);
    if (crossSchool.ok) return;
    expect(crossSchool.code).toBe('INTERPRETATION_FORBIDDEN');
    const crossLearner = await practicePadInterpretationStore.confirmPracticeInterpretation({
      identity: { schoolId: SCHOOL_A, studentId: LEARNER_2 },
      attemptId,
      documentVersion: 1,
      interpretationId: proposed.interpretation.interpretationId,
      candidateId: 'c1',
      sourceBlockId: block.blockId,
      sourceContentHash: hash,
    });
    expect(crossLearner.ok).toBe(false);
    if (crossLearner.ok) return;
    expect(crossLearner.code).toBe('INTERPRETATION_FORBIDDEN');
  });

  it('9. changed raw block/version makes the old interpretation stale', async () => {
    const attemptId = await createAttempt(SCHOOL_A, LEARNER_1);
    const v1 = await practicePadDocumentStore.savePracticeWork({
      identity: { schoolId: SCHOOL_A, studentId: LEARNER_1 },
      attemptId,
      expectedCurrentVersion: 1,
      idempotencyKey: 'pp08-stale-v1',
      snapshot: inkSnapshot(),
    });
    expect(v1.ok).toBe(true);
    if (!v1.ok) return;
    const blockV1 = v1.revision.snapshot.blocks[0];
    const hashV1 = blockContentHash(blockV1);
    const proposed = await practicePadInterpretationStore.proposeInterpretation({
      identity: { schoolId: SCHOOL_A, studentId: LEARNER_1 },
      attemptId,
      documentVersion: 1,
      sourceBlockId: blockV1.blockId,
      sourceContentHash: hashV1,
      candidates: [{ candidateId: 'c1', representationClass: 'EQUATION', normalizedValue: 'x = 4', confidence: 0.9, provenance: 'backend-test' }],
    });
    expect(proposed.ok).toBe(true);
    if (!proposed.ok) return;
    const changed = inkSnapshot();
    (changed.blocks[0] as any).ink.push({ strokeId: 's3-crossout', points: [{ x: 1, y: 1, timestampOffsetMs: 0 }] });
    const v2 = await practicePadDocumentStore.savePracticeWork({
      identity: { schoolId: SCHOOL_A, studentId: LEARNER_1 },
      attemptId,
      expectedCurrentVersion: 1,
      idempotencyKey: 'pp08-stale-v2',
      snapshot: changed,
    });
    expect(v2.ok).toBe(true);
    if (!v2.ok) return;
    const blockV2 = v2.revision.snapshot.blocks[0];
    expect(blockContentHash(blockV2)).not.toBe(hashV1);
    const staleConfirm = await practicePadInterpretationStore.confirmPracticeInterpretation({
      identity: { schoolId: SCHOOL_A, studentId: LEARNER_1 },
      attemptId,
      documentVersion: 2,
      interpretationId: proposed.interpretation.interpretationId,
      candidateId: 'c1',
      sourceBlockId: blockV2.blockId,
      sourceContentHash: blockContentHash(blockV2),
    });
    expect(staleConfirm.ok).toBe(false);
    if (staleConfirm.ok) return;
    expect(staleConfirm.code).toBe('INTERPRETATION_STALE');
    const carried = await practicePadInterpretationStore.findConfirmedForSource(
      { schoolId: SCHOOL_A, studentId: LEARNER_1 },
      attemptId,
      2,
      blockV2.blockId,
      blockContentHash(blockV2),
    );
    expect(carried).toBeNull();
  });

  it('10. image/drawing refs are governed, never arbitrary URL authority', async () => {
    const attemptId = await createAttempt(SCHOOL_A, LEARNER_1);
    const evil = await practicePadDocumentStore.savePracticeWork({
      identity: { schoolId: SCHOOL_A, studentId: LEARNER_1 },
      attemptId,
      expectedCurrentVersion: 1,
      idempotencyKey: 'pp08-evil-url',
      snapshot: { blocks: [{ blockId: 'img1', kind: 'IMAGE', ref: 'https://evil.example/capture.png', order: 0 }] },
    });
    expect(evil.ok).toBe(false);
    const attemptId2 = await createAttempt(SCHOOL_A, LEARNER_1);
    const dataUrl = await practicePadDocumentStore.savePracticeWork({
      identity: { schoolId: SCHOOL_A, studentId: LEARNER_1 },
      attemptId: attemptId2,
      expectedCurrentVersion: 1,
      idempotencyKey: 'pp08-data-url',
      snapshot: { blocks: [{ blockId: 'img1', kind: 'DRAWING', ref: 'data:image/png;base64,AAAA', order: 0 }] },
    });
    expect(dataUrl.ok).toBe(false);
    const attemptId3 = await createAttempt(SCHOOL_A, LEARNER_1);
    const governed = await practicePadDocumentStore.savePracticeWork({
      identity: { schoolId: SCHOOL_A, studentId: LEARNER_1 },
      attemptId: attemptId3,
      expectedCurrentVersion: 1,
      idempotencyKey: 'pp08-governed',
      snapshot: { blocks: [{ blockId: 'img1', kind: 'IMAGE_REF', ref: `ppmedia:${SCHOOL_A}/${LEARNER_1}/${attemptId3}/img-001`, order: 0 }] },
    });
    expect(governed.ok).toBe(true);
  });

  it('10a. unschemed opaque media ref is rejected on the protected PP-08 save', async () => {
    const attemptId = await createAttempt(SCHOOL_A, LEARNER_1);
    const saved = await practicePadDocumentStore.savePracticeWork({
      identity: { schoolId: SCHOOL_A, studentId: LEARNER_1 },
      attemptId,
      expectedCurrentVersion: 1,
      idempotencyKey: 'pp08-opaque-ref',
      snapshot: { blocks: [{ blockId: 'img1', kind: 'IMAGE_REF', ref: 'opaque-token-123', order: 0 }] },
    });
    expect(saved.ok).toBe(false);
  });

  it('10b. wrong school/learner/attempt scope and malformed refs are rejected; exact scope accepted', async () => {
    const attemptId = await createAttempt(SCHOOL_A, LEARNER_1);
    const otherAttempt = await createAttempt(SCHOOL_A, LEARNER_1);
    const scoped = (school: string, learner: string, attempt: string): string =>
      `ppmedia:${school}/${learner}/${attempt}/img-001`;
    const badRefs = [
      scoped(SCHOOL_B, LEARNER_1, attemptId),
      scoped(SCHOOL_A, LEARNER_2, attemptId),
      scoped(SCHOOL_A, LEARNER_1, otherAttempt),
      'ppmedia:only-two/segments',
      'https://evil.example/scoped.png',
    ];
    for (let i = 0; i < badRefs.length; i += 1) {
      const saved = await practicePadDocumentStore.savePracticeWork({
        identity: { schoolId: SCHOOL_A, studentId: LEARNER_1 },
        attemptId,
        expectedCurrentVersion: 1,
        idempotencyKey: `pp08-scope-bad-${i}`,
        snapshot: { blocks: [{ blockId: 'img1', kind: 'IMAGE_REF', ref: badRefs[i], order: 0 }] },
      });
      expect(saved.ok).toBe(false);
    }
    const exact = await practicePadDocumentStore.savePracticeWork({
      identity: { schoolId: SCHOOL_A, studentId: LEARNER_1 },
      attemptId,
      expectedCurrentVersion: 1,
      idempotencyKey: 'pp08-scope-exact',
      snapshot: { blocks: [{ blockId: 'img1', kind: 'IMAGE_REF', ref: scoped(SCHOOL_A, LEARNER_1, attemptId), order: 0 }] },
    });
    expect(exact.ok).toBe(true);
  });

  it('11. proposal with fabricated sourceBlockId is rejected', async () => {
    const attemptId = await createAttempt(SCHOOL_A, LEARNER_1);
    const saved = await practicePadDocumentStore.savePracticeWork({
      identity: { schoolId: SCHOOL_A, studentId: LEARNER_1 },
      attemptId,
      expectedCurrentVersion: 1,
      idempotencyKey: 'pp08-fab-block',
      snapshot: inkSnapshot(),
    });
    expect(saved.ok).toBe(true);
    if (!saved.ok) return;
    const block = saved.revision.snapshot.blocks[0];
    const proposed = await practicePadInterpretationStore.proposeInterpretation({
      identity: { schoolId: SCHOOL_A, studentId: LEARNER_1 },
      attemptId,
      documentVersion: 1,
      sourceBlockId: 'fabricated-block',
      sourceContentHash: blockContentHash(block),
      candidates: [{ candidateId: 'c1', representationClass: 'EQUATION', normalizedValue: 'x = 4', confidence: 0.9, provenance: 'backend-test' }],
    });
    expect(proposed.ok).toBe(false);
  });

  it('12. fabricated source hash installs nothing; nonexistent revision is rejected', async () => {
    const attemptId = await createAttempt(SCHOOL_A, LEARNER_1);
    const saved = await practicePadDocumentStore.savePracticeWork({
      identity: { schoolId: SCHOOL_A, studentId: LEARNER_1 },
      attemptId,
      expectedCurrentVersion: 1,
      idempotencyKey: 'pp08-fab-hash',
      snapshot: inkSnapshot(),
    });
    expect(saved.ok).toBe(true);
    if (!saved.ok) return;
    const block = saved.revision.snapshot.blocks[0];
    const canonical = blockContentHash(block);
    const fabricated = await practicePadInterpretationStore.proposeInterpretation({
      identity: { schoolId: SCHOOL_A, studentId: LEARNER_1 },
      attemptId,
      documentVersion: 1,
      sourceBlockId: block.blockId,
      sourceContentHash: '0'.repeat(64),
      candidates: [{ candidateId: 'c-evil', representationClass: 'EQUATION', normalizedValue: 'x = 99', confidence: 1, provenance: 'client' }],
    });
    expect(fabricated.ok).toBe(false);
    if (fabricated.ok) return;
    expect(fabricated.code).toBe('INTERPRETATION_STALE');
    const missing = await practicePadInterpretationStore.proposeInterpretation({
      identity: { schoolId: SCHOOL_A, studentId: LEARNER_1 },
      attemptId,
      documentVersion: 99,
      sourceBlockId: block.blockId,
      sourceContentHash: canonical,
      candidates: [{ candidateId: 'c1', representationClass: 'EQUATION', normalizedValue: 'x = 4', confidence: 0.9, provenance: 'backend-test' }],
    });
    expect(missing.ok).toBe(false);
    if (missing.ok) return;
    expect(missing.code).toBe('INTERPRETATION_NOT_FOUND');
    const installed = await practicePadInterpretationStore.findLatestForSource(
      { schoolId: SCHOOL_A, studentId: LEARNER_1 },
      attemptId,
      1,
      block.blockId,
      canonical,
    );
    expect(installed).toBeNull();
  });

  it('13. confirmation re-verifies canonical source and persists confirmedAt', async () => {
    const attemptId = await createAttempt(SCHOOL_A, LEARNER_1);
    const saved = await practicePadDocumentStore.savePracticeWork({
      identity: { schoolId: SCHOOL_A, studentId: LEARNER_1 },
      attemptId,
      expectedCurrentVersion: 1,
      idempotencyKey: 'pp08-confirmed-at',
      snapshot: inkSnapshot(),
    });
    expect(saved.ok).toBe(true);
    if (!saved.ok) return;
    const block = saved.revision.snapshot.blocks[0];
    const canonical = blockContentHash(block);
    const proposed = await practicePadInterpretationStore.proposeInterpretation({
      identity: { schoolId: SCHOOL_A, studentId: LEARNER_1 },
      attemptId,
      documentVersion: 1,
      sourceBlockId: block.blockId,
      sourceContentHash: canonical,
      candidates: [{ candidateId: 'c1', representationClass: 'EQUATION', normalizedValue: 'x = 4', confidence: 0.9, provenance: 'backend-test' }],
    });
    expect(proposed.ok).toBe(true);
    if (!proposed.ok) return;
    const confirmed = await practicePadInterpretationStore.confirmPracticeInterpretation({
      identity: { schoolId: SCHOOL_A, studentId: LEARNER_1 },
      attemptId,
      documentVersion: 1,
      interpretationId: proposed.interpretation.interpretationId,
      candidateId: 'c1',
      sourceBlockId: block.blockId,
      sourceContentHash: canonical,
    });
    expect(confirmed.ok).toBe(true);
    if (!confirmed.ok) return;
    expect(confirmed.interpretation.confirmedAt).not.toBeNull();
    const stored = await practicePadInterpretationStore.getInterpretation(
      { schoolId: SCHOOL_A, studentId: LEARNER_1 },
      proposed.interpretation.interpretationId,
    );
    expect(stored?.status).toBe('CONFIRMED');
    expect(stored?.confirmedAt).not.toBeNull();
    expect(stored?.confirmedCandidateId).toBe('c1');
  });

  it('14. text blocks are not eligible for interpretation', async () => {
    const attemptId = await createAttempt(SCHOOL_A, LEARNER_1);
    const saved = await practicePadDocumentStore.savePracticeWork({
      identity: { schoolId: SCHOOL_A, studentId: LEARNER_1 },
      attemptId,
      expectedCurrentVersion: 1,
      idempotencyKey: 'pp08-text-elig',
      snapshot: { blocks: [{ blockId: 't1', kind: 'TEXT', content: 'x = 4', order: 0 }] },
    });
    expect(saved.ok).toBe(true);
    if (!saved.ok) return;
    const proposed = await practicePadInterpretationStore.proposeInterpretation({
      identity: { schoolId: SCHOOL_A, studentId: LEARNER_1 },
      attemptId,
      documentVersion: 1,
      sourceBlockId: 't1',
      sourceContentHash: blockContentHash(saved.revision.snapshot.blocks[0]),
      candidates: [{ candidateId: 'c1', representationClass: 'EQUATION', normalizedValue: 'x = 4', confidence: 0.9, provenance: 'backend-test' }],
    });
    expect(proposed.ok).toBe(false);
    if (proposed.ok) return;
    expect(proposed.code).toBe('UNSUPPORTED_REPRESENTATION');
  });

  it('interpreter port performs zero live model calls', async () => {
    const result = await practicePadInkInterpreterPort.interpretPracticeWork({
      block: { blockId: 'ink1', kind: 'HANDWRITING', content: null, ref: null, ink: [], order: 0 },
    });
    expect(result.available).toBe(false);
    expect(result.liveModelCalls).toBe(0);
    expect(practicePadInkInterpreterPort.liveCallCount()).toBe(0);
  });
});
