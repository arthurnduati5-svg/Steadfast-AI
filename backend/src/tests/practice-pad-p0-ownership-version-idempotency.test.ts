// ─────────────────────────────────────────────────────────────
// Steadfast AI — Practice Pad P0 (1/3):
// canonical attempt ownership, versioning, idempotency.
// ─────────────────────────────────────────────────────────────

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Prisma before any imports to prevent network timeouts (same pattern
// as backend/src/tests/practice-attempt-service.test.ts).
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
  authorizePracticePadIdentity,
  _clearPracticePadCheckRecordsForTest,
  type PracticePadVerifiedIdentity,
} from '../services/practicePadRuntime/practicePadCheckRuntime';
import { practiceAttemptService, _clearAttemptStoreForTest, __setPracticeAttemptDurableForTest } from '../services/practiceAttemptService';
import { practicePadWorkVersionStore, __enablePracticePadWorkVersionMemoryForTest } from '../services/practicePadRuntime/practicePadWorkVersionStore';
import { __enablePracticePadCheckMemoryForTest } from '../services/practicePadRuntime/practicePadCheckStore';
import { practicePadProblemAuthority } from '../services/practicePadRuntime/practicePadProblemAuthority';

const SCHOOL_A = 'school-p0-a';
const SCHOOL_B = 'school-p0-b';
const LEARNER_1 = 'learner-p0-1';
const LEARNER_2 = 'learner-p0-2';

const identityA1: PracticePadVerifiedIdentity = { schoolId: SCHOOL_A, studentId: LEARNER_1, verifiedSchool: true };

async function createOwnedAttempt(schoolId: string, studentId: string, promptSummary: string): Promise<string> {
  const created = await practiceAttemptService.createPracticeAttempt(
    { schoolId, studentId },
    { kind: 'open_response', promptSummary, subject: 'maths', topic: 'linear equations', outcome: 'not_evaluated' },
  );
  const attemptId = created.attempt.attemptId;
  await practicePadWorkVersionStore.seedVersion(attemptId, 1);
  return attemptId;
}

function checkInput(attemptId: string, overrides: Record<string, unknown> = {}) {
  return {
    attemptId,
    basedOnVersion: 1,
    idempotencyKey: 'key-p0-ownership',
    workText: 'x = 4',
    selectedStep: null,
    ...overrides,
  };
}

describe('Practice Pad P0 — canonical ownership, versioning, idempotency', () => {
  beforeEach(async () => {
    // Explicit test doubles ONLY (production fails closed on DB failure;
    // Prisma is mocked unavailable in this file, so memory is installed
    // explicitly rather than inferred from the failure).
    __enablePracticePadCheckMemoryForTest();
    __enablePracticePadWorkVersionMemoryForTest();
    __setPracticeAttemptDurableForTest(true);
    _clearAttemptStoreForTest();
    await _clearPracticePadCheckRecordsForTest();
    await practicePadWorkVersionStore.resetForTest();
    practicePadProblemAuthority.resetForTest();
    vi.clearAllMocks();
  });

  it('verified same-school learner succeeds (one canonical owner reused)', async () => {
    const attemptId = await createOwnedAttempt(SCHOOL_A, LEARNER_1, 'Solve for x: 2x + 4 = 10');
    const outcome = await checkPracticePadStepCanonical(identityA1, checkInput(attemptId));
    expect(outcome.ok).toBe(true);
    if (outcome.ok) {
      expect(outcome.result.attemptId).toBe(attemptId);
      expect(outcome.result.currentFeedbackEligible).toBe(true);
    }
  });

  it('cross-school access fails closed', async () => {
    const attemptId = await createOwnedAttempt(SCHOOL_A, LEARNER_1, 'Solve for x: 2x + 4 = 10');
    const crossSchool: PracticePadVerifiedIdentity = { schoolId: SCHOOL_B, studentId: LEARNER_1, verifiedSchool: true };
    const outcome = await checkPracticePadStepCanonical(crossSchool, checkInput(attemptId, { idempotencyKey: 'k-x-school' }));
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.failureCategory).toBe('attempt_not_found');
  });

  it('cross-learner access fails closed', async () => {
    const attemptId = await createOwnedAttempt(SCHOOL_A, LEARNER_1, 'Solve for x: 2x + 4 = 10');
    const crossLearner: PracticePadVerifiedIdentity = { schoolId: SCHOOL_A, studentId: LEARNER_2, verifiedSchool: true };
    const outcome = await checkPracticePadStepCanonical(crossLearner, checkInput(attemptId, { idempotencyKey: 'k-x-learner' }));
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.failureCategory).toBe('attempt_not_found');
  });

  it('missing verified school identity fails closed before any learning-state use', () => {
    const unverified = authorizePracticePadIdentity({ schoolId: null, studentId: LEARNER_1, verifiedSchool: false });
    expect(unverified.ok).toBe(false);
    if (!unverified.ok) expect(unverified.failureCategory).toBe('missing_school_identity');
  });

  it('stale version cannot become current feedback (v7 check retained, v8 current)', async () => {
    const attemptId = await createOwnedAttempt(SCHOOL_A, LEARNER_1, 'Solve for x: 2x + 4 = 10');
    await practicePadWorkVersionStore.submitWork(attemptId); // v2 (== v7→v8 advance)
    const outcome = await checkPracticePadStepCanonical(
      identityA1,
      checkInput(attemptId, { basedOnVersion: 1, idempotencyKey: 'k-stale' }),
    );
    expect(outcome.ok).toBe(true);
    if (outcome.ok) {
      expect(outcome.result.status).toBe('STALE_VERSION');
      expect(outcome.result.currentFeedbackEligible).toBe(false);
      expect(outcome.result.evidenceCandidate).toBeNull();
    }
  });

  it('identical idempotent retry returns the same result without duplication', async () => {
    const attemptId = await createOwnedAttempt(SCHOOL_A, LEARNER_1, 'Solve for x: 2x + 4 = 10');
    const first = await checkPracticePadStepCanonical(identityA1, checkInput(attemptId, { idempotencyKey: 'k-idem' }));
    const second = await checkPracticePadStepCanonical(identityA1, checkInput(attemptId, { idempotencyKey: 'k-idem' }));
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (first.ok && second.ok) {
      expect(second.result.checkId).toBe(first.result.checkId);
      expect(second.result.deduplicated).toBe(true);
    }
  });

  it('same key with a different payload is an explicit conflict', async () => {
    const attemptId = await createOwnedAttempt(SCHOOL_A, LEARNER_1, 'Solve for x: 2x + 4 = 10');
    const first = await checkPracticePadStepCanonical(
      identityA1,
      checkInput(attemptId, { idempotencyKey: 'k-conflict', workText: 'x = 4' }),
    );
    expect(first.ok).toBe(true);
    const second = await checkPracticePadStepCanonical(
      identityA1,
      checkInput(attemptId, { idempotencyKey: 'k-conflict', workText: 'x = 9' }),
    );
    expect(second.ok).toBe(false);
    if (!second.ok) {
      expect(second.status).toBe('CONFLICT');
      expect(second.failureCategory).toBe('duplicate_conflict');
    }
  });
});
