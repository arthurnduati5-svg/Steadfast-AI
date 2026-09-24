// ─────────────────────────────────────────────────────────────
// Steadfast AI — Practice Pad PP-04 (B/2):
// canonical check integration over the deterministic math engine.
//
// Proves: stored PP-03 revision is work truth; deterministic verdicts
// integrate into the canonical check; unsupported/invalid degrade
// truthfully; no answer-key leakage; zero model calls; check proposes a
// candidate only and never mutates mastery. Prisma mocked unavailable;
// explicit doubles only. No DB. No migrations.
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

const SCHOOL = 'school-pp04';
const LEARNER = 'learner-pp04';
const identity: PracticePadVerifiedIdentity = { schoolId: SCHOOL, studentId: LEARNER, verifiedSchool: true };

function registerAlgebraProblem(): void {
  practicePadProblemAuthority.registerProblem({
    problemId: 'pp04-linear',
    prompt: 'Solve for x: 2(x + 3) = 14',
    subject: 'maths',
    topic: 'linear equations',
    allowedResources: [],
    expectedAnswer: 'x = 4',
    evaluationPlan: 'pp04-linear-equivalence',
    evaluationType: 'deterministic_algebraic',
    acceptableAnswerForms: ['2x + 6 = 14'],
    schoolId: SCHOOL,
  });
}

function registerNumericProblem(): void {
  practicePadProblemAuthority.registerProblem({
    problemId: 'pp04-numeric',
    prompt: 'What is one half as a decimal?',
    subject: 'maths',
    topic: 'fractions',
    allowedResources: [],
    expectedAnswer: '1/2',
    evaluationPlan: 'pp04-rational-equivalence',
    evaluationType: 'deterministic_numeric',
    acceptableAnswerForms: ['0.5'],
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
      topic: 'pp04',
      sourceQuestionId: problemId,
      outcome: 'not_evaluated',
    },
  );
  await practicePadWorkVersionStore.seedVersion(created.attempt.attemptId, 1);
  return created.attempt.attemptId;
}

describe('Practice Pad PP-04 — canonical check integration', () => {
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
    registerAlgebraProblem();
    registerNumericProblem();
    vi.clearAllMocks();
  });

  it('canonical stored revision is evaluated; deterministic correct becomes CONFIRMED_CORRECT', async () => {
    const attemptId = await createAttemptFor('pp04-linear');
    const outcome = await checkPracticePadStepCanonical(identity, {
      attemptId, basedOnVersion: 1, idempotencyKey: 'pp04-correct', workText: '2x + 6 = 14', selectedStep: null,
    });
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.result.status).toBe('CONFIRMED_CORRECT');
    expect(outcome.result.deterministicVerdict).toBe('correct');
    // The stored revision holds the evaluated work; request text never bypasses it.
    const stored = await practicePadDocumentStore.getRevision({ schoolId: SCHOOL, studentId: LEARNER }, attemptId, 1);
    expect(stored).not.toBeNull();
    expect(snapshotToWorkText(stored!.snapshot)).toContain('2x + 6 = 14');
  });

  it('deterministically disproved work becomes CONFIRMED_INCORRECT (distribution error)', async () => {
    const attemptId = await createAttemptFor('pp04-linear');
    const outcome = await checkPracticePadStepCanonical(identity, {
      attemptId, basedOnVersion: 1, idempotencyKey: 'pp04-wrong', workText: '2x + 3 = 14', selectedStep: null,
    });
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.result.status).toBe('CONFIRMED_INCORRECT');
    expect(outcome.result.deterministicVerdict).toBe('incorrect');
  });

  it('unsupported work degrades to NEEDS_SEMANTIC_ANALYSIS, never false incorrect', async () => {
    const attemptId = await createAttemptFor('pp04-numeric');
    const outcome = await checkPracticePadStepCanonical(identity, {
      attemptId, basedOnVersion: 1, idempotencyKey: 'pp04-unsupported', workText: '5 m', selectedStep: null,
    });
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    // Expected "1/2" is numeric; "5 m" is unit-bearing and undecidable here.
    expect(outcome.result.status).toBe('NEEDS_SEMANTIC_ANALYSIS');
    expect(outcome.result.deterministicVerdict).toBe('unknown');
    expect(outcome.result.evidenceCandidate).toBeNull();
  });

  it('invalid work degrades to NEEDS_CLARIFICATION, never misconception proof', async () => {
    const attemptId = await createAttemptFor('pp04-numeric');
    const outcome = await checkPracticePadStepCanonical(identity, {
      attemptId, basedOnVersion: 1, idempotencyKey: 'pp04-invalid', workText: '1/0', selectedStep: null,
    });
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.result.status).toBe('NEEDS_CLARIFICATION');
    expect(outcome.result.misconceptionCandidate).toBeNull();
  });

  it('acceptable server forms pass and the answer key never leaks', async () => {
    const attemptId = await createAttemptFor('pp04-numeric');
    const outcome = await checkPracticePadStepCanonical(identity, {
      attemptId, basedOnVersion: 1, idempotencyKey: 'pp04-form', workText: '0.5', selectedStep: null,
    });
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.result.status).toBe('CONFIRMED_CORRECT');
    const serialized = JSON.stringify(outcome.result);
    // The server-owned expected answer ("1/2") must never reach the learner.
    expect(serialized).not.toContain('1/2');
    expect(serialized).not.toContain('acceptableAnswerForms');
    expect(serialized).not.toContain('expectedAnswer');
  });

  it('zero model calls; check proposes a candidate only and never mastery', async () => {
    const attemptId = await createAttemptFor('pp04-linear');
    const outcome = await checkPracticePadStepCanonical(identity, {
      attemptId, basedOnVersion: 1, idempotencyKey: 'pp04-mastery', workText: 'x = 4', selectedStep: null,
    });
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.result.status).toBe('CONFIRMED_CORRECT');
    expect(practicePadSemanticPort.liveCallCount()).toBe(0);
    expect(outcome.result.evidenceCandidate).not.toBeNull();
    expect(outcome.result.evidenceCandidate?.eligibleForMastery).toBe(false);
    // A check result carries no mastery mutation surface.
    expect('mastery' in outcome.result).toBe(false);
  });
});
