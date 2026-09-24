// ─────────────────────────────────────────────────────────────
// Steadfast AI — Practice Pad PP-07 (B): recovery / transfer
// intelligence proofs. Pure deterministic analysis plus one
// no-duplicate runtime check. No DB writes beyond the focused
// in-memory doubles, no model calls, no mastery mutation.
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
  buildSupportProvenance,
  classifyPracticeRecovery,
  deriveSupportBetween,
  deriveTrustedSupportHistory,
  evaluateTransferSuccess,
  proposeRecoveryEvidenceCandidates,
  requirePracticeTransfer,
  type PracticeSupportProvenance,
} from '../services/practicePadRuntime/practicePadSupportProvenance';
import { proposePracticeIntervention } from '../services/practicePadRuntime/practicePadInterventionFeedback';

const SCHOOL = 'school-pp07b';
const LEARNER = 'learner-pp07b';
const identity: PracticePadVerifiedIdentity = { schoolId: SCHOOL, studentId: LEARNER, verifiedSchool: true };

const DIVERGENT = '2(x + 3) = 14\n2x + 3 = 14\n2x = 11\nx = 5.5';

function registerLinearProblem(): void {
  practicePadProblemAuthority.registerProblem({
    problemId: 'pp07b-linear',
    prompt: 'Solve for x: 2(x + 3) = 14',
    subject: 'maths',
    topic: 'linear equations',
    allowedResources: [],
    expectedAnswer: 'x = 4',
    evaluationPlan: 'pp07b-linear-equivalence',
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
      promptSummary: 'problem pp07b-linear',
      subject: 'maths',
      topic: 'pp07b',
      sourceQuestionId: 'pp07b-linear',
      outcome: 'not_evaluated',
    },
  );
  await practicePadWorkVersionStore.seedVersion(created.attempt.attemptId, 1);
  return created.attempt.attemptId;
}

function fakeSupport(version: number, checkId: string): PracticeSupportProvenance {
  const proposal = proposePracticeIntervention({
    checkStatus: 'CONFIRMED_INCORRECT',
    firstDivergenceStepIndex: 1,
    reasonCode: 'ALGEBRAIC_EQUIVALENCE_BROKEN',
    trustedSupportCount: 0,
  });
  return buildSupportProvenance({
    checkId,
    attemptId: 'att_pp07b',
    basedOnVersion: version,
    proposal,
    createdAt: '2026-09-22T00:00:00.000Z',
  });
}

const PRIOR = {
  priorCheckId: 'ppchk_prior',
  priorVersion: 1,
  priorStatus: 'CONFIRMED_INCORRECT' as const,
  priorDivergence: { stepIndex: 1, reasonCode: 'ALGEBRAIC_EQUIVALENCE_BROKEN', observedSummary: '2x + 3 = 14' },
};

describe('Practice Pad PP-07 (B) — recovery and transfer intelligence', () => {
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

  it('1. repaired divergence with no support classifies SELF_CORRECTED', () => {
    const analysis = classifyPracticeRecovery({
      ...PRIOR,
      currentCheckId: 'ppchk_now',
      currentVersion: 2,
      currentStatus: 'CONFIRMED_CORRECT',
      currentDivergence: null,
      supportReceived: [],
    });
    expect(analysis.classification).toBe('SELF_CORRECTED');
    expect(analysis.originalErrorResolved).toBe(true);
    expect(analysis.independentOfSupport).toBe(true);
  });

  it('2. repaired divergence after support classifies CORRECTED_AFTER_SUPPORT', () => {
    const support = [fakeSupport(1, 'ppchk_prior')];
    const analysis = classifyPracticeRecovery({
      ...PRIOR,
      currentCheckId: 'ppchk_now',
      currentVersion: 2,
      currentStatus: 'CONFIRMED_CORRECT',
      currentDivergence: null,
      supportReceived: support,
    });
    expect(analysis.classification).toBe('CORRECTED_AFTER_SUPPORT');
    expect(analysis.originalErrorResolved).toBe(true);
    expect(analysis.independentOfSupport).toBe(false);
    const candidates = proposeRecoveryEvidenceCandidates(analysis, { createdAt: '2026-09-22T00:00:00.000Z' });
    expect(candidates[0].masterySignal).toBe('correct_after_support');
    expect(candidates[0].ledgerEventType).toBe('correction_observed');
  });

  it('3. same structural deterministic error classifies SAME_ERROR_PATTERN, never a misconception', () => {
    const analysis = classifyPracticeRecovery({
      ...PRIOR,
      currentCheckId: 'ppchk_now',
      currentVersion: 2,
      currentStatus: 'CONFIRMED_INCORRECT',
      currentDivergence: { stepIndex: 1, reasonCode: 'ALGEBRAIC_EQUIVALENCE_BROKEN', observedSummary: '2x + 3 = 14' },
      supportReceived: [fakeSupport(1, 'ppchk_prior')],
    });
    expect(analysis.classification).toBe('SAME_ERROR_PATTERN');
    expect(analysis.originalErrorResolved).toBe(false);
    const candidates = proposeRecoveryEvidenceCandidates(analysis, { createdAt: '2026-09-22T00:00:00.000Z' });
    expect(candidates[0].masterySignal).toBe('repeated_mistake');
    const blob = JSON.stringify(analysis) + JSON.stringify(candidates);
    expect(blob).not.toMatch(/misconception/i);
  });

  it('4. original error repaired but a later divergence appears: PARTIAL_RECOVERY, not repetition', () => {
    const analysis = classifyPracticeRecovery({
      ...PRIOR,
      currentCheckId: 'ppchk_now',
      currentVersion: 2,
      currentStatus: 'CONFIRMED_INCORRECT',
      currentDivergence: { stepIndex: 3, reasonCode: 'VALUE_CHANGED', confirmedPrefixCount: 3 },
      supportReceived: [fakeSupport(1, 'ppchk_prior')],
    });
    expect(analysis.classification).toBe('PARTIAL_RECOVERY');
    expect(analysis.originalErrorResolved).toBe(true);
    const candidates = proposeRecoveryEvidenceCandidates(analysis, { createdAt: '2026-09-22T00:00:00.000Z' });
    expect(candidates[0].masterySignal).toBe('repeated_mistake_reduced');
  });

  it('5. ambiguous comparison yields UNRESOLVED and proposes nothing', () => {
    const sameVersion = classifyPracticeRecovery({
      ...PRIOR, currentCheckId: 'ppchk_now', currentVersion: 1,
      currentStatus: 'CONFIRMED_CORRECT', currentDivergence: null, supportReceived: [],
    });
    const undecidablePrior = classifyPracticeRecovery({
      ...PRIOR, priorStatus: 'NEEDS_SEMANTIC_ANALYSIS', priorDivergence: null,
      currentCheckId: 'ppchk_now', currentVersion: 2,
      currentStatus: 'CONFIRMED_CORRECT', currentDivergence: null, supportReceived: [],
    });
    const historyFailed = classifyPracticeRecovery({
      ...PRIOR, currentCheckId: 'ppchk_now', currentVersion: 2,
      currentStatus: 'CONFIRMED_CORRECT', currentDivergence: null,
      supportReceived: [], supportHistoryAvailable: false,
    });
    for (const analysis of [sameVersion, undecidablePrior, historyFailed]) {
      expect(analysis.classification).toBe('UNRESOLVED');
      expect(proposeRecoveryEvidenceCandidates(analysis, { createdAt: '2026-09-22T00:00:00.000Z' })).toEqual([]);
    }
  });

  it('6. same-problem correction never counts as transfer', () => {
    const verdict = evaluateTransferSuccess({
      originalProblemId: 'prob-a',
      transferProblemId: 'prob-a',
      sameGovernedSkill: true,
      transferSolvedDeterministically: true,
      supportDeliveredOnTransfer: false,
    });
    expect(verdict.independent).toBe(false);
    expect(verdict.reason).toBe('same_problem_correction_not_transfer');
    expect(verdict.masterySignal).toBeNull();
  });

  it('7. different governed problem plus same skill plus independent success proposes stronger evidence', () => {
    const requirement = requirePracticeTransfer({
      originalProblemId: 'prob-a',
      skillId: 'linear-equations',
      candidates: [
        { problemId: 'prob-a', skillId: 'linear-equations' },
        { problemId: 'prob-b', skillId: 'fractions' },
        { problemId: 'prob-c', skillId: 'linear-equations' },
      ],
    });
    expect(requirement.status).toBe('transfer_required');
    if (requirement.status !== 'transfer_required') return;
    expect(requirement.transferProblemId).toBe('prob-c');
    const verdict = evaluateTransferSuccess({
      originalProblemId: 'prob-a',
      transferProblemId: requirement.transferProblemId,
      sameGovernedSkill: true,
      transferSolvedDeterministically: true,
      supportDeliveredOnTransfer: false,
    });
    expect(verdict.independent).toBe(true);
    expect(verdict.masterySignal).toBe('similar_problem_success');
    const missing = requirePracticeTransfer({
      originalProblemId: 'prob-a',
      skillId: 'linear-equations',
      candidates: [{ problemId: 'prob-a', skillId: 'linear-equations' }],
    });
    expect(missing.status).toBe('transfer_required_but_unavailable');
  });

  it('8. supported transfer success is NOT independent transfer', () => {
    const verdict = evaluateTransferSuccess({
      originalProblemId: 'prob-a',
      transferProblemId: 'prob-c',
      sameGovernedSkill: true,
      transferSolvedDeterministically: true,
      supportDeliveredOnTransfer: true,
    });
    expect(verdict.independent).toBe(false);
    expect(verdict.reason).toBe('supported_transfer_not_independent');
    expect(verdict.masterySignal).toBeNull();
  });

  it('9. recovery and transfer outputs are evidence candidates only: no weights, no mastery mutation', () => {
    const analysis = classifyPracticeRecovery({
      ...PRIOR,
      currentCheckId: 'ppchk_now',
      currentVersion: 2,
      currentStatus: 'CONFIRMED_CORRECT',
      currentDivergence: null,
      supportReceived: [fakeSupport(1, 'ppchk_prior'), fakeSupport(1, 'ppchk_prior2')],
    });
    const candidates = proposeRecoveryEvidenceCandidates(analysis, { createdAt: '2026-09-22T00:00:00.000Z' });
    expect(candidates.length).toBeGreaterThan(0);
    for (const candidate of candidates) {
      expect('weight' in candidate).toBe(false);
      expect('eligibleForMastery' in candidate).toBe(false);
      // The reused signal label is vocabulary only: no numeric mastery
      // weight and no mastery-state prose accompany the candidate.
      expect(candidate.safeSummary).not.toMatch(/mastery|weight|score/i);
      expect(candidate.rawLearnerDataIncluded).toBe(false);
      expect(candidate.rawPromptIncluded).toBe(false);
      expect(candidate.rawAiResponseIncluded).toBe(false);
      expect(candidate.rawTranscriptIncluded).toBe(false);
    }
    // Deterministic IDs: re-analysis proposes the same candidates, never duplicates.
    const again = proposeRecoveryEvidenceCandidates(analysis, { createdAt: '2026-09-22T00:00:00.000Z' });
    expect(again.map((c) => c.candidateId)).toEqual(candidates.map((c) => c.candidateId));
    expect(practicePadSemanticPort.liveCallCount()).toBe(0);
  });

  it('10. duplicate retry produces no duplicate support or recovery evidence', async () => {
    const attemptId = await createAttempt();
    const first = await checkPracticePadStepCanonical(identity, {
      attemptId, basedOnVersion: 1, idempotencyKey: 'pp07b-dedupe', workText: DIVERGENT, selectedStep: null,
    });
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    const replay = await checkPracticePadStepCanonical(identity, {
      attemptId, basedOnVersion: 1, idempotencyKey: 'pp07b-dedupe', workText: DIVERGENT, selectedStep: null,
    });
    expect(replay.ok).toBe(true);
    if (!replay.ok) return;
    const records = await practicePadCheckStore.listByAttempt(attemptId);
    expect(records).toHaveLength(1);
    const history = deriveTrustedSupportHistory(records.map(parseCheckResult));
    expect(history).toHaveLength(1);
    // Same logical check compared with itself is not a retry event.
    const selfCompare = classifyPracticeRecovery({
      priorCheckId: first.result.checkId,
      currentCheckId: replay.result.checkId,
      priorVersion: first.result.basedOnVersion,
      currentVersion: replay.result.basedOnVersion,
      priorStatus: first.result.status,
      currentStatus: replay.result.status,
      priorDivergence: first.result.firstDivergence
        ? { stepIndex: first.result.firstDivergence.stepIndex, reasonCode: first.result.firstDivergence.reasonCode ?? null }
        : null,
      currentDivergence: replay.result.firstDivergence
        ? { stepIndex: replay.result.firstDivergence.stepIndex, reasonCode: replay.result.firstDivergence.reasonCode ?? null }
        : null,
      supportReceived: deriveSupportBetween(first.result.basedOnVersion, replay.result.basedOnVersion, history),
    });
    expect(selfCompare.classification).toBe('UNRESOLVED');
    expect(proposeRecoveryEvidenceCandidates(selfCompare, { createdAt: '2026-09-22T00:00:00.000Z' })).toEqual([]);
  });
});
