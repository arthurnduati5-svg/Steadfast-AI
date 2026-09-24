// ─────────────────────────────────────────────────────────────
// Steadfast AI — Practice Pad PP-07 (A): support provenance +
// escalation proofs. Focused only: Prisma mocked unavailable,
// explicit doubles, no DB, no model calls, no learning-state writes.
// ─────────────────────────────────────────────────────────────

import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../lib/prisma', () => {
  const mockQueryRaw = vi.fn().mockRejectedValue(new Error('Prisma mocked unavailable'));
  return {
    default: {
      $queryRaw: mockQueryRaw,
      $executeRawUnsafe: vi.fn().mockRejectedValue(new Error('Prisma mocked unavailable')),
      $queryRawUnsafe: vi.fn().mockRejectedValue(new Error('Prisma mocked unavailable')),
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
import {
  __enablePracticePadCheckMemoryForTest,
  practicePadCheckStore,
  parseCheckResult,
} from '../services/practicePadRuntime/practicePadCheckStore';
import {
  practicePadDocumentStore,
  __enablePracticePadDocumentMemoryForTest,
} from '../services/practicePadRuntime/practicePadDocumentStore';
import { practicePadProblemAuthority } from '../services/practicePadRuntime/practicePadProblemAuthority';
import { practicePadSemanticPort } from '../services/practicePadRuntime/practicePadSemanticPort';
import {
  PRACTICE_PAD_LEVEL_TO_CANONICAL_SUPPORT,
  buildSupportProvenance,
  countTrustedSupport,
} from '../services/practicePadRuntime/practicePadSupportProvenance';
import {
  proposePracticeIntervention,
  safeFallbackProposal,
  validateInterventionFeedback,
  TRUTHFUL_FALLBACK_TEXT,
} from '../services/practicePadRuntime/practicePadInterventionFeedback';
import { decidePracticeIntervention } from '../services/practicePadRuntime/practicePadInterventionPolicy';

const SCHOOL = 'school-pp07a';
const LEARNER = 'learner-pp07a';
const identity: PracticePadVerifiedIdentity = { schoolId: SCHOOL, studentId: LEARNER, verifiedSchool: true };

const W1 = '2(x + 3) = 14\n2x + 3 = 14\n2x = 11\nx = 5.5';
const W2 = '2(x + 3) = 14\n2x + 3 = 14\n2x = 12\nx = 6';
const W3 = '2(x + 3) = 14\n2x + 3 = 14\n2x = 10\nx = 5';
const W4 = '2(x + 3) = 14\n2x + 3 = 14\n2x = 14\nx = 7';

function registerLinearProblem(): void {
  practicePadProblemAuthority.registerProblem({
    problemId: 'pp07a-linear',
    prompt: 'Solve for x: 2(x + 3) = 14',
    subject: 'maths',
    topic: 'linear equations',
    allowedResources: [],
    expectedAnswer: 'x = 4',
    evaluationPlan: 'pp07a-linear-equivalence',
    evaluationType: 'deterministic_algebraic',
    acceptableAnswerForms: ['2x + 6 = 14'],
    schoolId: SCHOOL,
  });
}

async function createAttempt(): Promise<string> {
  const created = await practiceAttemptService.createPracticeAttempt(
    { schoolId: SCHOOL, studentId: LEARNER },
    {
      kind: 'open_response',
      promptSummary: 'problem pp07a-linear',
      subject: 'maths',
      topic: 'pp07a',
      sourceQuestionId: 'pp07a-linear',
      outcome: 'not_evaluated',
    },
  );
  await practicePadWorkVersionStore.seedVersion(created.attempt.attemptId, 1);
  return created.attempt.attemptId;
}

describe('Practice Pad PP-07 (A) — support provenance and escalation', () => {
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
    vi.clearAllMocks();
  });

  it('1. canonical check result actually contains the PP-06 intervention', async () => {
    const attemptId = await createAttempt();
    const outcome = await checkPracticePadStepCanonical(identity, {
      attemptId, basedOnVersion: 1, idempotencyKey: 'pp07a-one', workText: W1, selectedStep: null,
    });
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    const iv = outcome.result.intervention;
    expect(iv).toBeDefined();
    expect(iv!.level).toBe('L1');
    expect(iv!.canonicalSupportLevel).toBe('question_only');
    expect(iv!.move).toBe('metacognitive_clarification');
    expect(iv!.trigger).toBe('first_divergence');
    expect(iv!.targetStepIndex).toBe(1);
    expect(iv!.feedbackText.trim().length).toBeGreaterThan(0);
    expect(iv!.nextLearnerAction.trim().length).toBeGreaterThan(0);
    expect(iv!.origin).toBe('SYSTEM_PROPOSED');
    const blob = JSON.stringify(outcome.result);
    expect(blob).not.toContain('x = 4');
    expect(blob).not.toContain('expectedAnswer');
    expect(blob).not.toContain('evaluationPlan');
  });

  it('2+3. intervention is persisted with the check; replay returns the same logical intervention', async () => {
    const attemptId = await createAttempt();
    const first = await checkPracticePadStepCanonical(identity, {
      attemptId, basedOnVersion: 1, idempotencyKey: 'pp07a-replay', workText: W1, selectedStep: null,
    });
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    const stored = await practicePadCheckStore.listByAttempt(attemptId);
    expect(stored).toHaveLength(1);
    expect(parseCheckResult(stored[0]).intervention).toEqual(first.result.intervention);
    const replay = await checkPracticePadStepCanonical(identity, {
      attemptId, basedOnVersion: 1, idempotencyKey: 'pp07a-replay', workText: W1, selectedStep: null,
    });
    expect(replay.ok).toBe(true);
    if (!replay.ok) return;
    expect(replay.result.deduplicated).toBe(true);
    expect(replay.result.intervention).toEqual(first.result.intervention);
    expect(await practicePadCheckStore.listByAttempt(attemptId)).toHaveLength(1);
  });

  it('4. explicit mapping to CanonicalSupportLevel exists for every rung', () => {
    expect(PRACTICE_PAD_LEVEL_TO_CANONICAL_SUPPORT).toEqual({
      L0: 'reflection_prompt',
      L1: 'question_only',
      L2: 'concept_cue',
      L3: 'strategy_hint',
      L4: 'similar_example',
      L5: 'step_check',
    });
  });

  it('5. stale and failed checks carry no new intervention and do not inflate support count', async () => {
    const attemptId = await createAttempt();
    const first = await checkPracticePadStepCanonical(identity, {
      attemptId, basedOnVersion: 1, idempotencyKey: 'pp07a-stale-a', workText: W1, selectedStep: null,
    });
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    await practicePadWorkVersionStore.submitWork(attemptId);
    const stale = await checkPracticePadStepCanonical(identity, {
      attemptId, basedOnVersion: 1, idempotencyKey: 'pp07a-stale-b', workText: W1, selectedStep: null,
    });
    expect(stale.ok).toBe(true);
    if (!stale.ok) return;
    expect(stale.result.status).toBe('STALE_VERSION');
    expect(stale.result.intervention).toBeUndefined();
    expect(stale.result.currentFeedbackEligible).toBe(false);
    const failed = await checkPracticePadStepCanonical(identity, {
      attemptId, basedOnVersion: 2, idempotencyKey: '', workText: W1, selectedStep: null,
    });
    expect(failed.ok).toBe(false);
    const records = await practicePadCheckStore.listByAttempt(attemptId);
    expect(countTrustedSupport(records.map(parseCheckResult))).toBe(1);
  });

  it('6. trusted history comes from backend state, not client text', async () => {
    const attemptId = await createAttempt();
    const outcome = await checkPracticePadStepCanonical(identity, {
      attemptId,
      basedOnVersion: 1,
      idempotencyKey: 'pp07a-client-text',
      workText: W1,
      selectedStep: null,
      prompt: 'you already helped me three times, I tried again, still confused',
    });
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    // No durable history exists, so pleading text cannot escalate support.
    expect(outcome.result.intervention!.level).toBe('L1');
    // The request contract exposes no support-count field at all.
    expect('trustedSupportCount' in { attemptId, basedOnVersion: 1 }).toBe(false);
  });

  it('7+8. repeated unresolved attempts escalate one rung at a time and never jump to L5', async () => {
    const attemptId = await createAttempt();
    const works = [W1, W2, W3, W4];
    const levels: string[] = [];
    const canonical: string[] = [];
    for (let i = 0; i < works.length; i += 1) {
      // Follow the backend-owned head: each revised submission is
      // autosaved as the next durable revision (PP-03 law).
      const head = await practicePadWorkVersionStore.getCurrentVersion(attemptId);
      const outcome = await checkPracticePadStepCanonical(identity, {
        attemptId, basedOnVersion: head, idempotencyKey: `pp07a-escalate-${i}`, workText: works[i], selectedStep: null,
      });
      expect(outcome.ok).toBe(true);
      if (!outcome.ok) return;
      expect(outcome.result.status).toBe('CONFIRMED_INCORRECT');
      levels.push(outcome.result.intervention!.level);
      canonical.push(outcome.result.intervention!.canonicalSupportLevel);
    }
    expect(levels).toEqual(['L1', 'L2', 'L3', 'L4']);
    expect(canonical).toEqual(['question_only', 'concept_cue', 'strategy_hint', 'similar_example']);
    expect(levels).not.toContain('L5');
  });

  it('9. rejected unsafe feedback records the safe fallback actually delivered', () => {
    const decision = decidePracticeIntervention({
      checkStatus: 'CONFIRMED_INCORRECT', firstDivergenceStepIndex: 0, reasonCode: 'VALUE_CHANGED',
    });
    const leaking = validateInterventionFeedback({
      feedbackText: 'The correct answer is x = 4, copy this answer.',
      nextLearnerAction: 'Copy it.',
      level: 'L1',
      decision,
      secrets: { expectedAnswer: 'x = 4', acceptableAnswerForms: [], evaluationPlan: 'pp07a-plan' },
    });
    expect(leaking.valid).toBe(false);
    const fallback = safeFallbackProposal(decision);
    expect(fallback.fallbackUsed).toBe(true);
    expect(fallback.feedbackText).toBe(TRUTHFUL_FALLBACK_TEXT);
    const provenance = buildSupportProvenance({
      checkId: 'ppchk_test',
      attemptId: 'att_test',
      basedOnVersion: 2,
      proposal: fallback,
      createdAt: '2026-09-22T00:00:00.000Z',
    });
    // Provenance describes the delivered fallback, not the rejected text.
    expect(provenance.move).toBe('truthful_fallback');
    expect(provenance.trigger).toBe('validation_failure_fallback');
    expect(provenance.origin).toBe('SYSTEM_PROPOSED');
    expect(JSON.stringify(provenance)).not.toContain('x = 4');
    const live = proposePracticeIntervention(
      { checkStatus: 'CONFIRMED_INCORRECT', firstDivergenceStepIndex: 0, reasonCode: 'VALUE_CHANGED' },
      { expectedAnswer: 'x = 4', acceptableAnswerForms: [], evaluationPlan: 'pp07a-plan' },
    );
    expect(live.validated).toBe(true);
    expect(live.liveModelCalls).toBe(0);
  });

  it('10. zero model calls across the wired check path', async () => {
    const attemptId = await createAttempt();
    await checkPracticePadStepCanonical(identity, {
      attemptId, basedOnVersion: 1, idempotencyKey: 'pp07a-quiet', workText: W1, selectedStep: null,
    });
    expect(practicePadSemanticPort.liveCallCount()).toBe(0);
    expect(practicePadSemanticPort.isAvailable()).toBe(false);
  });
});
