// ─────────────────────────────────────────────────────────────
// Steadfast AI — Practice Pad PP-05 (B/2): canonical check integration
// for the deterministic reasoning graph. Proves the analysis derives
// from the authoritative PP-03 revision under the server-owned problem
// anchor, first divergence is exact, and no learning state mutates.
// Prisma mocked unavailable; explicit doubles only. No DB. No models.
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
import { snapshotToWorkText } from '../services/practicePadRuntime/practicePadDocumentContracts';
import { practicePadProblemAuthority } from '../services/practicePadRuntime/practicePadProblemAuthority';
import { practicePadSemanticPort } from '../services/practicePadRuntime/practicePadSemanticPort';
import { masteryService } from '../services/masteryService';
import { learnerMemoryService } from '../services/learnerMemoryService';
import { misconceptionService } from '../services/misconceptionService';
import { spacedReviewService } from '../services/spacedReviewService';
import { learningEventService } from '../services/learningEventService';

const SCHOOL = 'school-pp05';
const LEARNER = 'learner-pp05';
const identity: PracticePadVerifiedIdentity = { schoolId: SCHOOL, studentId: LEARNER, verifiedSchool: true };

const DIVERGENT_CHAIN = '2(x + 3) = 14\n2x + 3 = 14\n2x = 11\nx = 5.5';
const ALTERNATIVE_CHAIN = '2(x + 3) = 14\nx + 3 = 7\nx = 4';

function registerLinearProblem(): void {
  practicePadProblemAuthority.registerProblem({
    problemId: 'pp05-linear',
    prompt: 'Solve for x: 2(x + 3) = 14',
    subject: 'maths',
    topic: 'linear equations',
    allowedResources: [],
    expectedAnswer: 'x = 4',
    evaluationPlan: 'pp05-linear-equivalence',
    evaluationType: 'deterministic_algebraic',
    acceptableAnswerForms: ['2x + 6 = 14'],
    schoolId: SCHOOL,
  });
}

function registerArithmeticProblem(): void {
  practicePadProblemAuthority.registerProblem({
    problemId: 'pp05-arithmetic',
    prompt: 'What is 6 × 7?',
    subject: 'maths',
    topic: 'arithmetic',
    allowedResources: [],
    expectedAnswer: '42',
    evaluationPlan: 'pp05-numeric-equality',
    evaluationType: 'deterministic_numeric',
    acceptableAnswerForms: [],
    schoolId: SCHOOL,
  });
}

async function createAttemptFor(problemId: string): Promise<string> {
  const created = await practiceAttemptService.createPracticeAttempt(
    { schoolId: SCHOOL, studentId: LEARNER },
    {
      kind: 'open_response',
      promptSummary: `problem ${problemId}`,
      subject: 'maths',
      topic: 'pp05',
      sourceQuestionId: problemId,
      outcome: 'not_evaluated',
    },
  );
  await practicePadWorkVersionStore.seedVersion(created.attempt.attemptId, 1);
  return created.attempt.attemptId;
}

describe('Practice Pad PP-05 — canonical check integration', () => {
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
    registerLinearProblem();
    registerArithmeticProblem();
    vi.clearAllMocks();
  });

  it('1+2. analysis uses the authoritative PP-03 revision under the server-owned anchor; client prompt cannot substitute', async () => {
    const attemptId = await createAttemptFor('pp05-linear');
    const outcome = await checkPracticePadStepCanonical(identity, {
      attemptId,
      basedOnVersion: 1,
      idempotencyKey: 'pp05-authority',
      workText: ALTERNATIVE_CHAIN,
      selectedStep: null,
      prompt: '2+2=5',
    });
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    // A valid alternative method (divide first) is accepted end to end.
    expect(outcome.result.status).toBe('CONFIRMED_CORRECT');
    expect(outcome.result.firstDivergence).toBeUndefined();
    expect(outcome.result.confirmedCorrectSteps).toEqual(['2(x + 3) = 14', 'x + 3 = 7', 'x = 4']);
    // The evaluated work is the stored revision, not a raw projection.
    const stored = await practicePadDocumentStore.getRevision({ schoolId: SCHOOL, studentId: LEARNER }, attemptId, 1);
    expect(stored).not.toBeNull();
    expect(snapshotToWorkText(stored!.snapshot)).toBe(ALTERNATIVE_CHAIN);
  });

  it('3. a client-submitted sequence that differs from stored work becomes a new version; stored truth is never bypassed', async () => {
    const attemptId = await createAttemptFor('pp05-linear');
    const first = await checkPracticePadStepCanonical(identity, {
      attemptId, basedOnVersion: 1, idempotencyKey: 'pp05-submit-a', workText: ALTERNATIVE_CHAIN, selectedStep: null,
    });
    expect(first.ok).toBe(true);
    const second = await checkPracticePadStepCanonical(identity, {
      attemptId, basedOnVersion: 1, idempotencyKey: 'pp05-submit-b', workText: DIVERGENT_CHAIN, selectedStep: null,
    });
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    // Different server work cannot reuse the old version: it is persisted
    // as the next revision and the analysis follows the new stored truth.
    expect(second.result.basedOnVersion).toBe(2);
    expect(second.result.status).toBe('CONFIRMED_INCORRECT');
    expect(second.result.firstDivergence?.stepIndex).toBe(1);
  });

  it('4+5. CONFIRMED_INCORRECT carries the exact first divergence; confirmed prefix holds only valid steps', async () => {
    const attemptId = await createAttemptFor('pp05-linear');
    const outcome = await checkPracticePadStepCanonical(identity, {
      attemptId, basedOnVersion: 1, idempotencyKey: 'pp05-divergence', workText: DIVERGENT_CHAIN, selectedStep: null,
    });
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.result.status).toBe('CONFIRMED_INCORRECT');
    expect(outcome.result.deterministicVerdict).toBe('incorrect');
    expect(outcome.result.firstDivergence?.stepIndex).toBe(1);
    expect(outcome.result.confirmedCorrectSteps).toEqual(['2(x + 3) = 14']);
    expect(outcome.result.misconceptionCandidate).toBeNull();
  });

  it('8b. a wrong final answer alone never manufactures divergence step 0', async () => {
    const attemptId = await createAttemptFor('pp05-arithmetic');
    const outcome = await checkPracticePadStepCanonical(identity, {
      attemptId, basedOnVersion: 1, idempotencyKey: 'pp05-noanchor', workText: '43', selectedStep: null,
    });
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    // Decisively wrong final answer, but no trusted anchor exists in the
    // server-owned prompt — so no causal step may be claimed.
    expect(outcome.result.status).toBe('CONFIRMED_INCORRECT');
    expect(outcome.result.firstDivergence).toBeUndefined();
    expect(outcome.result.confirmedCorrectSteps).toEqual([]);
  });

  it('6. hidden expected answers and evaluation metadata never leak', async () => {
    const attemptId = await createAttemptFor('pp05-linear');
    const outcome = await checkPracticePadStepCanonical(identity, {
      attemptId, basedOnVersion: 1, idempotencyKey: 'pp05-leak', workText: DIVERGENT_CHAIN, selectedStep: null,
    });
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    const serialized = JSON.stringify(outcome.result);
    expect(serialized).not.toContain('expectedAnswer');
    expect(serialized).not.toContain('acceptableAnswerForms');
    expect(serialized).not.toContain('evaluationPlan');
    expect(serialized).not.toContain('evaluationType');
    expect(serialized).not.toContain('x = 4');
  });

  it('7+8. zero model calls and no mastery/memory/revision mutation', async () => {
    const spies = [
      vi.spyOn(masteryService, 'updateMasteryFromAttempt').mockResolvedValue([]),
      vi.spyOn(learnerMemoryService, 'createLearnerMemory').mockResolvedValue({} as never),
      vi.spyOn(learnerMemoryService, 'appendEvidenceToLearnerMemory').mockResolvedValue({} as never),
      vi.spyOn(misconceptionService, 'upsertMisconceptionsFromAttempt').mockResolvedValue(undefined as never),
      vi.spyOn(spacedReviewService, 'scheduleReviewFromAttempt').mockResolvedValue(null as never),
      vi.spyOn(learningEventService, 'createLearningEvent').mockResolvedValue({} as never),
    ];
    try {
      const attemptId = await createAttemptFor('pp05-linear');
      for (const [key, work] of [['a', ALTERNATIVE_CHAIN], ['b', DIVERGENT_CHAIN]] as const) {
        const outcome = await checkPracticePadStepCanonical(identity, {
          attemptId, basedOnVersion: 1, idempotencyKey: `pp05-quiet-${key}`, workText: work, selectedStep: null,
        });
        expect(outcome.ok).toBe(true);
      }
      expect(practicePadSemanticPort.liveCallCount()).toBe(0);
      for (const spy of spies) expect(spy).not.toHaveBeenCalled();
    } finally {
      for (const spy of spies) spy.mockRestore();
    }
  });
});
