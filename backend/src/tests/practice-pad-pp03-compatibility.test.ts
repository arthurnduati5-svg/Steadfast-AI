// ─────────────────────────────────────────────────────────────
// Steadfast AI — Practice Pad PP-03 (C/3):
// backward-compatible check route shape.
// The existing practice-pad/check-step request shape keeps working;
// the backend persists/resolves authoritative work before checking.
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
  _clearPracticePadCheckRecordsForTest,
  type PracticePadVerifiedIdentity,
} from '../services/practicePadRuntime/practicePadCheckRuntime';
import { practiceAttemptService, _clearAttemptStoreForTest, __setPracticeAttemptDurableForTest } from '../services/practiceAttemptService';
import { practicePadWorkVersionStore, __enablePracticePadWorkVersionMemoryForTest } from '../services/practicePadRuntime/practicePadWorkVersionStore';
import { __enablePracticePadCheckMemoryForTest } from '../services/practicePadRuntime/practicePadCheckStore';
import {
  practicePadDocumentStore,
  __enablePracticePadDocumentMemoryForTest,
} from '../services/practicePadRuntime/practicePadDocumentStore';
import { snapshotContentHash, snapshotFromWorkText } from '../services/practicePadRuntime/practicePadDocumentContracts';
import { practicePadProblemAuthority } from '../services/practicePadRuntime/practicePadProblemAuthority';

const SCHOOL = 'school-pp03c';
const LEARNER = 'learner-pp03c';
const identity: PracticePadVerifiedIdentity = { schoolId: SCHOOL, studentId: LEARNER, verifiedSchool: true };

describe('Practice Pad PP-03 — compatibility regression', () => {
  beforeEach(async () => {
    __enablePracticePadDocumentMemoryForTest();
    __enablePracticePadCheckMemoryForTest();
    __enablePracticePadWorkVersionMemoryForTest();
    __setPracticeAttemptDurableForTest(true);
    _clearAttemptStoreForTest();
    await _clearPracticePadCheckRecordsForTest();
    await practicePadDocumentStore.resetForTest();
    await practicePadWorkVersionStore.resetForTest();
    practicePadProblemAuthority.resetForTest();
    vi.clearAllMocks();
  });

  it('legacy request shape persists authoritative work before checking', async () => {
    const created = await practiceAttemptService.createPracticeAttempt(
      { schoolId: SCHOOL, studentId: LEARNER },
      { kind: 'open_response', promptSummary: 'Solve for x: 2x + 4 = 10', subject: 'maths', topic: 'linear equations', outcome: 'not_evaluated' },
    );
    const attemptId = created.attempt.attemptId;
    await practicePadWorkVersionStore.seedVersion(attemptId, 1);

    // Existing client shape: workText projection only, no snapshot field.
    const workText = '2x + 4 = 10\n2x = 6\nx = 3';
    const first = await checkPracticePadStepCanonical(identity, {
      attemptId,
      basedOnVersion: 1,
      idempotencyKey: 'legacy-k1',
      workText,
      selectedStep: null,
    });
    expect(first.ok).toBe(true);

    // Backend resolved authoritative work before checking: the durable
    // revision exists and matches the submitted work hash.
    const stored = await practicePadDocumentStore.getRevision({ schoolId: SCHOOL, studentId: LEARNER }, attemptId, 1);
    expect(stored).not.toBeNull();
    expect(stored?.contentHash).toBe(snapshotContentHash(snapshotFromWorkText(workText)));

    // Identical legacy retry deduplicates to the same logical check.
    const second = await checkPracticePadStepCanonical(identity, {
      attemptId,
      basedOnVersion: 1,
      idempotencyKey: 'legacy-k1',
      workText,
      selectedStep: null,
    });
    expect(second.ok).toBe(true);
    if (first.ok && second.ok) {
      expect(second.result.checkId).toBe(first.result.checkId);
      expect(second.result.deduplicated).toBe(true);
    }

    // Same key with different work remains an explicit conflict.
    const conflict = await checkPracticePadStepCanonical(identity, {
      attemptId,
      basedOnVersion: 1,
      idempotencyKey: 'legacy-k1',
      workText: 'x = 99',
      selectedStep: null,
    });
    expect(conflict.ok).toBe(false);
  });
});
