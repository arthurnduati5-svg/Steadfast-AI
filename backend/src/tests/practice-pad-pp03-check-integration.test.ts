// ─────────────────────────────────────────────────────────────
// Steadfast AI — Practice Pad PP-03 (B/3):
// ownership + check integration over server-owned revisions.
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

import {
  checkPracticePadStepCanonical,
  buildPracticePadTelemetry,
  _clearPracticePadCheckRecordsForTest,
  type PracticePadVerifiedIdentity,
} from '../services/practicePadRuntime/practicePadCheckRuntime';
import { practiceAttemptService, _clearAttemptStoreForTest, __setPracticeAttemptDurableForTest } from '../services/practiceAttemptService';
import { practicePadWorkVersionStore, __enablePracticePadWorkVersionMemoryForTest } from '../services/practicePadRuntime/practicePadWorkVersionStore';
import { __enablePracticePadCheckMemoryForTest } from '../services/practicePadRuntime/practicePadCheckStore';
import {
  practicePadDocumentStore,
  __enablePracticePadDocumentMemoryForTest,
  __setPracticePadDocumentFailWritesForTest,
} from '../services/practicePadRuntime/practicePadDocumentStore';
import { snapshotFromWorkText } from '../services/practicePadRuntime/practicePadDocumentContracts';
import { practicePadProblemAuthority } from '../services/practicePadRuntime/practicePadProblemAuthority';
import { practicePadSemanticPort } from '../services/practicePadRuntime/practicePadSemanticPort';

const SCHOOL_A = 'school-pp03b-a';
const SCHOOL_B = 'school-pp03b-b';
const LEARNER_1 = 'learner-pp03b-1';
const LEARNER_2 = 'learner-pp03b-2';

const identityA1: PracticePadVerifiedIdentity = { schoolId: SCHOOL_A, studentId: LEARNER_1, verifiedSchool: true };

async function createOwnedAttempt(schoolId: string, studentId: string): Promise<string> {
  const created = await practiceAttemptService.createPracticeAttempt(
    { schoolId, studentId },
    { kind: 'open_response', promptSummary: 'Solve for x: 2x + 4 = 10', subject: 'maths', topic: 'linear equations', outcome: 'not_evaluated' },
  );
  const attemptId = created.attempt.attemptId;
  await practicePadWorkVersionStore.seedVersion(attemptId, 1);
  return attemptId;
}

async function saveServerWork(attemptId: string, workText: string, expected: number, key: string): Promise<void> {
  const saved = await practicePadDocumentStore.savePracticeWork({
    identity: { schoolId: SCHOOL_A, studentId: LEARNER_1 },
    attemptId,
    expectedCurrentVersion: expected,
    idempotencyKey: key,
    snapshot: snapshotFromWorkText(workText),
  });
  expect(saved.ok).toBe(true);
}

describe('Practice Pad PP-03 — ownership + check integration', () => {
  beforeEach(async () => {
    __enablePracticePadDocumentMemoryForTest();
    __enablePracticePadCheckMemoryForTest();
    __enablePracticePadWorkVersionMemoryForTest();
    __setPracticeAttemptDurableForTest(true);
    __setPracticePadDocumentFailWritesForTest(false);
    _clearAttemptStoreForTest();
    await _clearPracticePadCheckRecordsForTest();
    await practicePadDocumentStore.resetForTest();
    await practicePadWorkVersionStore.resetForTest();
    practicePadProblemAuthority.resetForTest();
    vi.clearAllMocks();
  });

  it('cross-school and cross-learner checks fail closed', async () => {
    const attemptId = await createOwnedAttempt(SCHOOL_A, LEARNER_1);
    const crossSchool = await checkPracticePadStepCanonical(
      { schoolId: SCHOOL_B, studentId: LEARNER_1, verifiedSchool: true },
      { attemptId, basedOnVersion: 1, idempotencyKey: 'pp03b-x-school', workText: 'x = 4', selectedStep: null },
    );
    expect(crossSchool.ok).toBe(false);
    const crossLearner = await checkPracticePadStepCanonical(
      { schoolId: SCHOOL_A, studentId: LEARNER_2, verifiedSchool: true },
      { attemptId, basedOnVersion: 1, idempotencyKey: 'pp03b-x-learner', workText: 'x = 4', selectedStep: null },
    );
    expect(crossLearner.ok).toBe(false);
  });

  it('check evaluates the server-owned revision; new work becomes the next revision, never an override', async () => {
    const attemptId = await createOwnedAttempt(SCHOOL_A, LEARNER_1);
    await saveServerWork(attemptId, 'x = 4', 1, 'pp03b-server-v1');
    const matching = await checkPracticePadStepCanonical(identityA1, {
      attemptId, basedOnVersion: 1, idempotencyKey: 'pp03b-match', workText: 'x = 4', selectedStep: null,
    });
    expect(matching.ok).toBe(true);
    // Differing work for the current head is a NEW submission: it is
    // persisted as the next valid revision and evaluated as the new head.
    const advanced = await checkPracticePadStepCanonical(identityA1, {
      attemptId, basedOnVersion: 1, idempotencyKey: 'pp03b-advance', workText: 'x = 9', selectedStep: null,
    });
    expect(advanced.ok).toBe(true);
    if (advanced.ok) expect(advanced.result.basedOnVersion).toBe(2);
    // Stored v1 was never overridden; v2 holds the new work.
    const v1 = await practicePadDocumentStore.getRevision({ schoolId: SCHOOL_A, studentId: LEARNER_1 }, attemptId, 1);
    const v2 = await practicePadDocumentStore.getRevision({ schoolId: SCHOOL_A, studentId: LEARNER_1 }, attemptId, 2);
    expect(v1).not.toBeNull();
    expect(v2).not.toBeNull();
    const { snapshotToWorkText } = await import('../services/practicePadRuntime/practicePadDocumentContracts');
    expect(snapshotToWorkText(v1!.snapshot)).toBe('x = 4');
    expect(snapshotToWorkText(v2!.snapshot)).toBe('x = 9');
    // The old version is now stale by law, even for the same key.
    const retryOld = await checkPracticePadStepCanonical(identityA1, {
      attemptId, basedOnVersion: 1, idempotencyKey: 'pp03b-advance', workText: 'x = 9', selectedStep: null,
    });
    expect(retryOld.ok).toBe(true);
    if (retryOld.ok) {
      expect(retryOld.result.status).toBe('STALE_VERSION');
      expect(retryOld.result.currentFeedbackEligible).toBe(false);
    }
    // Identical checks against the new head deduplicate.
    const head1 = await checkPracticePadStepCanonical(identityA1, {
      attemptId, basedOnVersion: 2, idempotencyKey: 'pp03b-head', workText: 'x = 9', selectedStep: null,
    });
    const head2 = await checkPracticePadStepCanonical(identityA1, {
      attemptId, basedOnVersion: 2, idempotencyKey: 'pp03b-head', workText: 'x = 9', selectedStep: null,
    });
    expect(head1.ok).toBe(true);
    expect(head2.ok).toBe(true);
    if (head1.ok && head2.ok) {
      expect(head2.result.checkId).toBe(head1.result.checkId);
      expect(head2.result.deduplicated).toBe(true);
    }
  });

  it('fabricated selected steps cannot become feedback', async () => {
    const attemptId = await createOwnedAttempt(SCHOOL_A, LEARNER_1);
    await saveServerWork(attemptId, 'x = 4', 1, 'pp03b-sel-v1');
    const outcome = await checkPracticePadStepCanonical(identityA1, {
      attemptId, basedOnVersion: 1, idempotencyKey: 'pp03b-sel', workText: 'x = 4', selectedStep: 'the moon is made of cheese step 99',
    });
    expect(outcome.ok).toBe(true);
    if (outcome.ok) {
      expect(outcome.result.status).toBe('NEEDS_CLARIFICATION');
      expect(outcome.result.evidenceCandidate).toBeNull();
    }
  });

  it('stale revision cannot become current feedback', async () => {
    const attemptId = await createOwnedAttempt(SCHOOL_A, LEARNER_1);
    await saveServerWork(attemptId, 'x = 4', 1, 'pp03b-stale-v1');
    await saveServerWork(attemptId, '2x = 8\nx = 4', 1, 'pp03b-stale-v2');
    const outcome = await checkPracticePadStepCanonical(identityA1, {
      attemptId, basedOnVersion: 1, idempotencyKey: 'pp03b-stale', workText: 'x = 4', selectedStep: null,
    });
    expect(outcome.ok).toBe(true);
    if (outcome.ok) {
      expect(outcome.result.status).toBe('STALE_VERSION');
      expect(outcome.result.currentFeedbackEligible).toBe(false);
      expect(outcome.result.evidenceCandidate).toBeNull();
    }
  });

  it('persistence failure cannot create check or evidence success', async () => {
    const attemptId = await createOwnedAttempt(SCHOOL_A, LEARNER_1);
    __setPracticePadDocumentFailWritesForTest(true);
    try {
      const outcome = await checkPracticePadStepCanonical(identityA1, {
        attemptId, basedOnVersion: 1, idempotencyKey: 'pp03b-persist', workText: 'x = 4', selectedStep: null,
      });
      expect(outcome.ok).toBe(false);
      if (!outcome.ok) expect(outcome.failureCategory).toBe('database_unavailable');
      if (outcome.ok) expect(outcome.result.evidenceCandidate).toBeNull();
    } finally {
      __setPracticePadDocumentFailWritesForTest(false);
    }
    // No fake revision was persisted by the failed save.
    expect(await practicePadDocumentStore.getRevision({ schoolId: SCHOOL_A, studentId: LEARNER_1 }, attemptId, 1)).toBeNull();
  });

  it('zero live model calls; telemetry carries no learner work', async () => {
    const attemptId = await createOwnedAttempt(SCHOOL_A, LEARNER_1);
    const workText = 'x = 4';
    const outcome = await checkPracticePadStepCanonical(identityA1, {
      attemptId, basedOnVersion: 1, idempotencyKey: 'pp03b-model', workText, selectedStep: null,
    });
    expect(outcome.ok).toBe(true);
    expect(practicePadSemanticPort.liveCallCount()).toBe(0);
    const telemetry = buildPracticePadTelemetry({
      requestId: 'req-pp03b',
      attemptId,
      checkId: outcome.ok ? outcome.result.checkId : null,
      basedOnVersion: 1,
      checkerPath: outcome.ok ? outcome.result.checkerPath : 'unknown',
      mode: 'degraded',
      startedAtMs: Date.now(),
    });
    expect(JSON.stringify(telemetry)).not.toContain(workText);
  });
});
