// ─────────────────────────────────────────────────────────────
// Steadfast AI — Practice Pad PP-02 (3/3):
// PP-01 check integration through the durable problem authority.
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

vi.mock('../services/practiceCanonicalLearningService', () => ({
  commitPracticeLearningEvidence: vi.fn().mockResolvedValue({
    attemptId: 'att_mocked',
    committedEvidenceId: null,
    evidenceCandidateId: null,
    masteryApplied: false,
    deduplicated: false,
  }),
}));

import {
  checkPracticePadStepCanonical,
  _clearPracticePadCheckRecordsForTest,
  type PracticePadVerifiedIdentity,
} from '../services/practicePadRuntime/practicePadCheckRuntime';
import { practiceAttemptService, _clearAttemptStoreForTest, __setPracticeAttemptDurableForTest } from '../services/practiceAttemptService';
import { practicePadWorkVersionStore, __enablePracticePadWorkVersionMemoryForTest } from '../services/practicePadRuntime/practicePadWorkVersionStore';
import { __enablePracticePadCheckMemoryForTest } from '../services/practicePadRuntime/practicePadCheckStore';
import {
  practiceProblemStore,
  __enablePracticeProblemMemoryForTest,
} from '../services/practicePadRuntime/practiceProblemStore';
import { practicePadProblemAuthority } from '../services/practicePadRuntime/practicePadProblemAuthority';
import { practicePadSemanticPort } from '../services/practicePadRuntime/practicePadSemanticPort';
import { commitPracticeLearningEvidence } from '../services/practiceCanonicalLearningService';
import { learningEventService } from '../services/learningEventService';
import { masteryService } from '../services/masteryService';
import { misconceptionService } from '../services/misconceptionService';
import { spacedReviewService } from '../services/spacedReviewService';
import { nextPracticeService } from '../services/nextPracticeService';
import { learnerMemoryService } from '../services/learnerMemoryService';

const SCHOOL = 'school-pp02-check';
const LEARNER = 'learner-pp02-check';
const identity: PracticePadVerifiedIdentity = { schoolId: SCHOOL, studentId: LEARNER, verifiedSchool: true };

async function issueNumericProblem(problemId: string, expectedAnswer: string): Promise<void> {
  await practiceProblemStore.proposeProblem({
    problemId,
    schoolId: SCHOOL,
    sourceType: 'QUESTION_BANK',
    sourceRef: 'qb-check-q:qb-check-v1',
    subject: 'maths',
    topic: 'arithmetic',
    prompt: 'What is six times seven? Answer in digits.',
    allowedResources: [],
    evaluationType: 'deterministic_numeric',
    evaluationPlan: 'numeric-equality-tolerance-1e-9',
    expectedAnswer,
  });
  await practiceProblemStore.validateProblem(problemId, 1);
}

async function createBoundAttempt(problemId: string, problemVersion: number): Promise<string> {
  const created = await practiceAttemptService.createPracticeAttempt(
    { schoolId: SCHOOL, studentId: LEARNER },
    {
      kind: 'open_response',
      promptSummary: 'What is six times seven? Answer in digits.',
      subject: 'maths',
      topic: 'arithmetic',
      sourceQuestionId: problemId,
      problemId,
      problemVersion,
      outcome: 'not_evaluated',
    },
  );
  expect(created.attempt.problemVersion).toBe(problemVersion);
  await practicePadWorkVersionStore.seedVersion(created.attempt.attemptId, 1);
  return created.attempt.attemptId;
}

describe('Practice Pad PP-02 — check integration through durable authority', () => {
  beforeEach(async () => {
    __enablePracticePadCheckMemoryForTest();
    __enablePracticePadWorkVersionMemoryForTest();
    __enablePracticeProblemMemoryForTest();
    __setPracticeAttemptDurableForTest(true);
    _clearAttemptStoreForTest();
    await _clearPracticePadCheckRecordsForTest();
    await practicePadWorkVersionStore.resetForTest();
    await practiceProblemStore.resetForTest();
    practicePadProblemAuthority.resetForTest();
    vi.clearAllMocks();
  });

  it('check runtime resolves the canonical problem/version itself (proof 10)', async () => {
    await issueNumericProblem('prob-check-1', '42');
    const attemptId = await createBoundAttempt('prob-check-1', 1);
    const correct = await checkPracticePadStepCanonical(identity, {
      attemptId,
      basedOnVersion: 1,
      idempotencyKey: 'k-pp02-correct',
      workText: '42.0',
      selectedStep: null,
    });
    expect(correct.ok).toBe(true);
    if (correct.ok) {
      expect(correct.result.status).toBe('CONFIRMED_CORRECT');
      expect(correct.result.checkerPath).toBe('deterministic_numeric');
      expect(correct.result.evidenceCandidate?.eligibleForMastery).toBe(false);
    }
    const wrong = await checkPracticePadStepCanonical(identity, {
      attemptId,
      basedOnVersion: 1,
      idempotencyKey: 'k-pp02-wrong',
      workText: '43',
      selectedStep: null,
    });
    expect(wrong.ok).toBe(true);
    if (wrong.ok) expect(wrong.result.status).toBe('CONFIRMED_INCORRECT');
  });

  it('client prompt/answer cannot override the canonical binding (proof 8)', async () => {
    await issueNumericProblem('prob-check-2', '42');
    const attemptId = await createBoundAttempt('prob-check-2', 1);
    // Client claims a different problem and ships a wrong answer for the
    // real one: the server-owned binding still decides.
    const outcome = await checkPracticePadStepCanonical(identity, {
      attemptId,
      basedOnVersion: 1,
      idempotencyKey: 'k-pp02-override',
      workText: '43',
      selectedStep: null,
      prompt: 'What is one plus one? Answer 2.',
      topic: 'addition',
      subject: 'maths',
    });
    expect(outcome.ok).toBe(true);
    if (outcome.ok) {
      expect(outcome.result.status).toBe('CONFIRMED_INCORRECT');
      expect(outcome.result.checkerPath).toBe('deterministic_numeric');
    }
  });

  it('version pinning: old attempt checks against v1 after v2 issues', async () => {
    await issueNumericProblem('prob-check-3', '42');
    const oldAttemptId = await createBoundAttempt('prob-check-3', 1);
    await practiceProblemStore.createNextVersion('prob-check-3', { expectedAnswer: '43' });
    await practiceProblemStore.validateProblem('prob-check-3', 2);
    const newAttemptId = await createBoundAttempt('prob-check-3', 2);

    const oldCheck = await checkPracticePadStepCanonical(identity, {
      attemptId: oldAttemptId,
      basedOnVersion: 1,
      idempotencyKey: 'k-pp02-oldver',
      workText: '42',
      selectedStep: null,
    });
    expect(oldCheck.ok).toBe(true);
    if (oldCheck.ok) expect(oldCheck.result.status).toBe('CONFIRMED_CORRECT');

    const newCheck = await checkPracticePadStepCanonical(identity, {
      attemptId: newAttemptId,
      basedOnVersion: 1,
      idempotencyKey: 'k-pp02-newver',
      workText: '42',
      selectedStep: null,
    });
    expect(newCheck.ok).toBe(true);
    if (newCheck.ok) expect(newCheck.result.status).toBe('CONFIRMED_INCORRECT');
  });

  it('non-READY and rejected problems fail closed with explicit codes', async () => {
    await practiceProblemStore.proposeProblem({
      problemId: 'prob-check-4',
      schoolId: SCHOOL,
      sourceType: 'TUTOR_GENERATED',
      sourceRef: 'tutor-session-1',
      subject: 'maths',
      topic: 'arithmetic',
      prompt: 'What is six times seven? Answer in digits.',
      allowedResources: [],
      evaluationType: 'deterministic_numeric',
      evaluationPlan: 'numeric-equality-tolerance-1e-9',
      expectedAnswer: '42',
    });
    const attemptId = await createBoundAttempt('prob-check-4', 1);
    const held = await checkPracticePadStepCanonical(identity, {
      attemptId,
      basedOnVersion: 1,
      idempotencyKey: 'k-pp02-notready',
      workText: '42',
      selectedStep: null,
    });
    expect(held.ok).toBe(false);
    if (!held.ok) {
      expect(held.currentFeedbackEligible).toBe(false);
      expect(held.message).toMatch(/PROBLEM_NOT_READY/);
    }
  });

  it('cross-school problem binding fails closed', async () => {
    await issueNumericProblem('prob-check-5', '42');
    const foreignAttempt = {
      attemptId: 'att-foreign',
      schoolId: SCHOOL,
      studentId: LEARNER,
      sourceQuestionId: 'prob-check-5',
      problemId: 'prob-check-5',
      problemVersion: 1,
      promptSummary: 'What is six times seven? Answer in digits.',
      subject: 'maths',
      topic: 'arithmetic',
    };
    const crossSchool: PracticePadVerifiedIdentity = {
      schoolId: 'school-pp02-intruder',
      studentId: LEARNER,
      verifiedSchool: true,
    };
    const outcome = await checkPracticePadStepCanonical(
      crossSchool,
      { attemptId: 'att-foreign', basedOnVersion: 1, idempotencyKey: 'k-pp02-scope', workText: '42' },
      { attemptOwner: { getPracticeAttempt: async () => foreignAttempt } as never },
    );
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.failureCategory).toBe('wrong_school');
      expect(outcome.message).toMatch(/PROBLEM_SCOPE_MISMATCH/);
    }
  });

  it('invalid problem creates zero learner-negative evidence (proof 9)', async () => {
    await practiceProblemStore.proposeProblem({
      problemId: 'prob-check-6',
      schoolId: SCHOOL,
      sourceType: 'QUESTION_BANK',
      sourceRef: 'qb-bad-q:qb-bad-v1',
      subject: 'maths',
      topic: 'arithmetic',
      prompt: 'What is six times seven? The answer 42 is shown here.',
      allowedResources: [],
      evaluationType: 'deterministic_numeric',
      evaluationPlan: 'numeric-equality-tolerance-1e-9',
      expectedAnswer: '42',
    });
    const { record } = await practiceProblemStore.validateProblem('prob-check-6', 1);
    expect(record.validationStatus).toBe('REJECTED');
    const attemptId = await createBoundAttempt('prob-check-6', 1);

    const commit = vi.mocked(commitPracticeLearningEvidence);
    const spies = [
      vi.spyOn(learningEventService, 'createLearningEvent').mockResolvedValue({} as never),
      vi.spyOn(masteryService, 'updateMasteryFromAttempt').mockResolvedValue([]),
      vi.spyOn(learnerMemoryService, 'createLearnerMemory').mockResolvedValue({} as never),
      vi.spyOn(learnerMemoryService, 'appendEvidenceToLearnerMemory').mockResolvedValue({} as never),
      vi.spyOn(learnerMemoryService, 'listLearnerMemory').mockResolvedValue([]),
      vi.spyOn(misconceptionService, 'upsertMisconceptionsFromAttempt').mockResolvedValue(undefined as never),
      vi.spyOn(spacedReviewService, 'scheduleReviewFromAttempt').mockResolvedValue(null as never),
      vi.spyOn(nextPracticeService, 'recommendNextPractice').mockResolvedValue([]),
    ];
    try {
      const outcome = await checkPracticePadStepCanonical(identity, {
        attemptId,
        basedOnVersion: 1,
        idempotencyKey: 'k-pp02-invalid',
        workText: '42',
        selectedStep: null,
      });
      // Rejected problem: no check success, no evidence, no learning effect.
      expect(outcome.ok).toBe(false);
      if (!outcome.ok) {
        expect(outcome.message).toMatch(/PROBLEM_REJECTED/);
        expect(outcome.currentFeedbackEligible).toBe(false);
      }
      expect(commit).not.toHaveBeenCalled();
      for (const spy of spies) expect(spy).not.toHaveBeenCalled();
    } finally {
      for (const spy of spies) spy.mockRestore();
    }
  });

  it('zero model calls across the PP-02 check flow (proof 12)', async () => {
    await issueNumericProblem('prob-check-7', '42');
    const attemptId = await createBoundAttempt('prob-check-7', 1);
    await checkPracticePadStepCanonical(identity, {
      attemptId,
      basedOnVersion: 1,
      idempotencyKey: 'k-pp02-nomodel',
      workText: 'not sure where to start with this one',
      selectedStep: null,
    });
    expect(practicePadSemanticPort.isAvailable()).toBe(false);
    expect(practicePadSemanticPort.liveCallCount()).toBe(0);
    const analysis = await practicePadSemanticPort.analyzeSemantics({ workText: '42' });
    expect(analysis.available).toBe(false);
    expect(analysis.liveModelCalls).toBe(0);
  });
});
