// ─────────────────────────────────────────────────────────────
// Steadfast AI — Practice Pad P0 (2/3):
// truthfulness and evidence boundary.
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

// Canonical evidence boundary is observed, never bypassed: capture the exact
// trusted outcome the attempt owner forwards to the canonical chain.
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
import { practicePadProblemAuthority } from '../services/practicePadRuntime/practicePadProblemAuthority';
import { practicePadSemanticPort } from '../services/practicePadRuntime/practicePadSemanticPort';
import { commitPracticeLearningEvidence } from '../services/practiceCanonicalLearningService';
import { learningEventService } from '../services/learningEventService';
import { masteryService } from '../services/masteryService';
import { misconceptionService } from '../services/misconceptionService';
import { spacedReviewService } from '../services/spacedReviewService';
import { nextPracticeService } from '../services/nextPracticeService';
import { learnerMemoryService } from '../services/learnerMemoryService';

const SCHOOL = 'school-p0-truth';
const LEARNER = 'learner-p0-truth';
const identity: PracticePadVerifiedIdentity = { schoolId: SCHOOL, studentId: LEARNER, verifiedSchool: true };

async function createAttempt(promptSummary: string, sourceQuestionId?: string): Promise<string> {
  const created = await practiceAttemptService.createPracticeAttempt(
    { schoolId: SCHOOL, studentId: LEARNER },
    { kind: 'open_response', promptSummary, subject: 'maths', topic: 'linear equations', outcome: 'not_evaluated', sourceQuestionId: sourceQuestionId ?? null },
  );
  await practicePadWorkVersionStore.seedVersion(created.attempt.attemptId, 1);
  return created.attempt.attemptId;
}

describe('Practice Pad P0 — truthfulness and evidence boundary', () => {
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

  it('heuristic phrase alone cannot establish mathematical correctness', async () => {
    const attemptId = await createAttempt('Solve for x: 2x + 4 = 10');
    const outcome = await checkPracticePadStepCanonical(identity, {
      attemptId,
      basedOnVersion: 1,
      idempotencyKey: 'k-heuristic',
      workText: 'I used the wrong formula and I am confused about the method',
      selectedStep: null,
    });
    expect(outcome.ok).toBe(true);
    if (outcome.ok) {
      expect(['NEEDS_SEMANTIC_ANALYSIS', 'NEEDS_CLARIFICATION']).toContain(outcome.result.status);
      expect(outcome.result.status).not.toBe('CONFIRMED_CORRECT');
      expect(outcome.result.status).not.toBe('CONFIRMED_INCORRECT');
      expect(outcome.result.confidence).toBeLessThanOrEqual(0.2);
    }
  });

  it('distributive error is caught deterministically, not by keywords (2(x+3)=14 vs 2x+3=14)', async () => {
    practicePadProblemAuthority.registerProblem({
      problemId: 'prob-linear-1',
      prompt: 'Solve for x: 2(x + 3) = 14',
      subject: 'maths',
      topic: 'linear equations',
      allowedResources: [],
      expectedAnswer: '2(x + 3) = 14',
      evaluationPlan: 'linear-equivalence-sample-probe',
      schoolId: SCHOOL,
    });
    const attemptId = await createAttempt('Solve for x: 2(x + 3) = 14', 'prob-linear-1');
    const outcome = await checkPracticePadStepCanonical(identity, {
      attemptId,
      basedOnVersion: 1,
      idempotencyKey: 'k-distributive',
      // PP-05 reconciliation: the selected step must actually exist in the
      // authoritative stored work (PP-03 containment, unchanged). Stored
      // work is now the two-line learner derivation.
      workText: '2(x + 3) = 14\n2x + 3 = 14',
      selectedStep: '2x + 3 = 14',
    });
    expect(outcome.ok).toBe(true);
    if (outcome.ok) {
      // Must be a deterministic verdict about the mathematics…
      // PP-05 reconciliation: now that math executes, the truthful path
      // for equation solution-set comparison is deterministic_linear.
      expect(outcome.result.checkerPath).toBe('deterministic_linear');
      expect(outcome.result.status).toBe('CONFIRMED_INCORRECT');
      // …never a keyword-driven diagnosis.
      expect(outcome.result.suspectedIssue).not.toMatch(/wrong formula|confused/i);
    }
  });

  it('unsupported math degrades truthfully instead of faking a result', async () => {
    const attemptId = await createAttempt('Explain why the area of a circle is πr²');
    const outcome = await checkPracticePadStepCanonical(identity, {
      attemptId,
      basedOnVersion: 1,
      idempotencyKey: 'k-unsupported',
      workText: 'the circle is round so area is pi r squared because of slices',
      selectedStep: null,
    });
    expect(outcome.ok).toBe(true);
    if (outcome.ok) {
      expect(outcome.result.status).toBe('NEEDS_SEMANTIC_ANALYSIS');
      expect(outcome.result.deterministicVerdict).toBe('unknown');
      expect(outcome.result.evidenceCandidate).toBeNull();
    }
  });

  it('check result alone never means practice_completed / concept_understood / mastered', async () => {
    practicePadProblemAuthority.registerProblem({
      problemId: 'prob-num-1',
      prompt: 'What is 6 × 7?',
      subject: 'maths',
      topic: 'arithmetic',
      allowedResources: [],
      expectedAnswer: '42',
      evaluationPlan: 'numeric-equality',
      schoolId: SCHOOL,
    });
    const attemptId = await createAttempt('What is 6 × 7?', 'prob-num-1');
    const outcome = await checkPracticePadStepCanonical(identity, {
      attemptId,
      basedOnVersion: 1,
      idempotencyKey: 'k-completion',
      workText: '42',
      selectedStep: null,
    });
    expect(outcome.ok).toBe(true);
    if (outcome.ok) {
      const serialized = JSON.stringify(outcome.result);
      expect(serialized).not.toMatch(/practice_completed|concept_understood|mastered/i);
      expect(outcome.result.status).toBe('CONFIRMED_CORRECT');
      // Even a confirmed check only PROPOSES a candidate; mastery stays false.
      expect(outcome.result.evidenceCandidate?.eligibleForMastery).toBe(false);
    }
  });

  it('unsupported checks produce no positive mastery evidence', async () => {
    const attemptId = await createAttempt('Prove the quadratic formula');
    const outcome = await checkPracticePadStepCanonical(identity, {
      attemptId,
      basedOnVersion: 1,
      idempotencyKey: 'k-no-mastery',
      workText: 'not sure where to start with this proof',
      selectedStep: null,
    });
    expect(outcome.ok).toBe(true);
    if (outcome.ok) {
      expect(outcome.result.evidenceCandidate).toBeNull();
      expect(outcome.result.misconceptionCandidate).toBeNull();
    }
  });

  it('client-supplied outcome=correct alone cannot create positive canonical mastery', async () => {
    const commit = vi.mocked(commitPracticeLearningEvidence);
    const created = await practiceAttemptService.createPracticeAttempt(
      { schoolId: SCHOOL, studentId: LEARNER },
      {
        kind: 'open_response',
        promptSummary: 'What is 6 × 7?',
        subject: 'maths',
        topic: 'arithmetic',
        skillIds: ['arithmetic-mult'],
        outcome: 'correct',
      },
    );
    expect(created.attempt.outcome).toBe('correct');
    expect(commit).toHaveBeenCalledTimes(1);
    const forwarded = commit.mock.calls[0]?.[0] as { trustedOutcome?: unknown } | undefined;
    // No trusted server-owned evaluator exists on this path: the canonical
    // chain must receive an unscored (null) outcome, so the client field
    // alone can never derive positive canonical mastery.
    expect(forwarded?.trustedOutcome == null).toBe(true);
  });

  it('not_evaluated create-through-owner creates no learning outcome (PP-01 R1)', async () => {
    // CHECK REQUESTED != PRACTICE COMPLETED: a mere check request must
    // persist/bind the attempt and produce no learning outcome at all.
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
      const created = await practiceAttemptService.createPracticeAttempt(
        { schoolId: SCHOOL, studentId: LEARNER },
        {
          kind: 'open_response',
          promptSummary: 'Solve for x: 2x + 4 = 10',
          subject: 'maths',
          topic: 'linear equations',
          skillIds: ['linear-equations'],
          outcome: 'not_evaluated',
        },
        { requireDurableBeforeEffects: true },
      );
      expect(created.attempt.outcome).toBe('not_evaluated');
      expect(created.persisted).toBe(true);
      // No canonical evidence, no learning event (never completed_practice).
      expect(commit).not.toHaveBeenCalled();
      for (const spy of spies) expect(spy).not.toHaveBeenCalled();
      // No outcome mutation of any kind.
      expect(created.masteryUpdates).toEqual([]);
      expect(created.memoryUpdates).toEqual([]);
      expect(created.reviewItems).toEqual([]);
      expect(created.recommendations).toEqual([]);
    } finally {
      for (const spy of spies) spy.mockRestore();
    }
  });

  it('evaluated outcome mappings are preserved; unevaluated mapping throws (PP-01 R3)', async () => {
    const svc = practiceAttemptService as unknown as {
      _outcomeToEventKind(outcome: string, kind: string): string;
    };
    expect(svc._outcomeToEventKind('correct', 'open_response')).toBe('corrected_mistake');
    expect(svc._outcomeToEventKind('partially_correct', 'open_response')).toBe('answered_question');
    expect(svc._outcomeToEventKind('incorrect', 'open_response')).toBe('made_mistake');
    expect(svc._outcomeToEventKind('unclear', 'open_response')).toBe('answered_question');
    // NOT_EVALUATED != COMPLETED PRACTICE: no silent manufacture.
    expect(() => svc._outcomeToEventKind('not_evaluated', 'open_response')).toThrow(/unevaluated/i);
  });

  it('database failure cannot return a canonical-success state', async () => {
    const failingOwner = {
      getPracticeAttempt: async () => {
        throw new Error('store unavailable');
      },
    };
    const outcome = await checkPracticePadStepCanonical(
      identity,
      { attemptId: 'att_missing', basedOnVersion: 1, idempotencyKey: 'k-dbfail', workText: 'x = 1' },
      { attemptOwner: failingOwner as never },
    );
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.failureCategory).toBe('database_unavailable');
      expect(outcome.currentFeedbackEligible).toBe(false);
    }
  });

  it('semantic seam exists but makes zero live model calls', async () => {
    expect(practicePadSemanticPort.isAvailable()).toBe(false);
    const analysis = await practicePadSemanticPort.analyzeSemantics({ workText: 'x = 4' });
    expect(analysis.available).toBe(false);
    expect(analysis.liveModelCalls).toBe(0);
    expect(practicePadSemanticPort.liveCallCount()).toBe(0);
  });
});
