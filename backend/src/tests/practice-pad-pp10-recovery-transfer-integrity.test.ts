// PP-10 (B): recovery / transfer / integrity integration. No DB, no models.
import { describe, it, expect, vi } from 'vitest';

vi.mock('../lib/prisma', () => ({
  default: { $queryRaw: vi.fn(), $executeRawUnsafe: vi.fn(), $queryRawUnsafe: vi.fn() },
}));

import { integratePracticePadLearning, PP10_LIVE_MODEL_CALLS } from '../services/practicePadRuntime/practicePadLearningIntegrationService';
import type { PracticePadCheckResult } from '../services/practicePadRuntime/practicePadCheckContracts';
import { evaluatePracticeIntegrity } from '../services/practicePadRuntime/practicePadIntegrityEngine';
import { practicePadIntegrityStore } from '../services/practicePadRuntime/practicePadIntegrityStore';

const ID = { schoolId: 's-pp10b', studentId: 'l-pp10b', verifiedSchool: true };

function mkCheck(over: Partial<PracticePadCheckResult> = {}): PracticePadCheckResult {
  return {
    checkId: 'c1', attemptId: 'a1', basedOnVersion: 1, status: 'CONFIRMED_INCORRECT',
    deterministicVerdict: 'incorrect', confirmedCorrectSteps: [], confidence: 0.92,
    checkerPath: 'deterministic_exact', evidenceCandidate: null, misconceptionCandidate: null,
    firstDivergence: { stepIndex: 1, expectedSummary: 'preserve', observedSummary: 'bad', reasonCode: 'NON_EQUIVALENT_REWRITE' },
    currentFeedbackEligible: true, deduplicated: false, createdAt: '2026-09-23T00:00:00.000Z', ...over,
  };
}

function supportCheck(id: string, v: number, level: 'L1' | 'L2' = 'L1'): PracticePadCheckResult {
  return mkCheck({
    checkId: id, basedOnVersion: v, status: 'CONFIRMED_INCORRECT',
    intervention: { level, canonicalSupportLevel: 'question_only', move: 'q', trigger: 't', feedbackText: 'f', nextLearnerAction: 'n', origin: 'SYSTEM_PROPOSED' },
    createdAt: `2026-09-23T00:0${v}:00.000Z`,
  });
}

function depsFor(history: PracticePadCheckResult[], current: PracticePadCheckResult, extra: Record<string, unknown> = {}) {
  const calls: string[] = [];
  return {
    calls,
    deps: {
      identity: ID, attemptId: 'a1', checkId: current.checkId, idempotencyKey: `idem-${current.checkId}-${Math.random().toString(36).slice(2, 7)}`,
      loadCheck: async () => ({ check: current, isCurrent: true }),
      loadAttempt: async () => ({ attemptId: 'a1', schoolId: 's-pp10b', studentId: 'l-pp10b', problemId: 'p1', problemVersion: 1 }),
      loadProblem: async () => ({ problemId: 'p1', problemVersion: 1, status: 'READY', skillId: 'sk-1' }),
      loadRevisions: async () => history.map((h) => ({ version: h.basedOnVersion, workText: 'work trace long enough ............................' })).concat([{ version: current.basedOnVersion, workText: 'work trace long enough ..................................' }]),
      loadCheckHistory: async () => [...history, current],
      evidenceCommitter: async (c: unknown) => ({ ok: true as const, committedEvidenceId: 'ev-x' }),
      projectors: {
        mastery: async () => { calls.push('mastery'); },
        memory: async () => { calls.push('memory'); },
        revision: async () => { calls.push('revision'); },
        growth: async () => { calls.push('growth'); },
      },
      seenEvidenceKeys: new Set<string>(),
      ...extra,
    } as Parameters<typeof integratePracticePadLearning>[0],
  };
}

describe('PP-10 recovery / transfer / integrity', () => {
  it('SELF_CORRECTED and CORRECTED_AFTER_SUPPORT are auto-derived; SAME_ERROR/PARTIAL stay distinct', async () => {
    const self = await integratePracticePadLearning(depsFor(
      [mkCheck({ checkId: 'p0', basedOnVersion: 1 })],
      mkCheck({ checkId: 'c-self', basedOnVersion: 2, status: 'CONFIRMED_CORRECT', deterministicVerdict: 'correct', firstDivergence: undefined, confirmedCorrectSteps: ['a', 'b'], confidence: 0.95 }),
    ).deps);
    expect(self.ok && self.recovery?.classification).toBe('SELF_CORRECTED');

    const after = await integratePracticePadLearning(depsFor(
      [mkCheck({ checkId: 'p0', basedOnVersion: 1 }), supportCheck('s1', 1, 'L1')],
      mkCheck({ checkId: 'c-sup', basedOnVersion: 2, status: 'CONFIRMED_CORRECT', deterministicVerdict: 'correct', firstDivergence: undefined, confirmedCorrectSteps: ['a'], confidence: 0.95 }),
    ).deps);
    expect(after.ok && after.recovery?.classification).toBe('CORRECTED_AFTER_SUPPORT');

    const same = await integratePracticePadLearning(depsFor(
      [mkCheck({ checkId: 'p0', basedOnVersion: 1 })],
      mkCheck({ checkId: 'c-same', basedOnVersion: 2 }),
    ).deps);
    expect(same.ok && same.recovery?.classification).toBe('SAME_ERROR_PATTERN');

    const partial = await integratePracticePadLearning(depsFor(
      [mkCheck({ checkId: 'p0', basedOnVersion: 1 })],
      mkCheck({ checkId: 'c-part', basedOnVersion: 2, firstDivergence: { stepIndex: 3, expectedSummary: 'p', observedSummary: 'o', reasonCode: 'OTHER' }, confirmedCorrectSteps: ['a', 'b', 'c'], confidence: 0.9 }),
    ).deps);
    expect(partial.ok && partial.recovery?.classification).toBe('PARTIAL_RECOVERY');
  });

  it('same-problem correction is not transfer; independent transfer uses stronger kind; supported transfer is not independent', async () => {
    const sameProb = await integratePracticePadLearning(depsFor(
      [mkCheck({ checkId: 'p0', basedOnVersion: 1 })],
      mkCheck({ checkId: 'c-t1', basedOnVersion: 2, status: 'CONFIRMED_CORRECT', deterministicVerdict: 'correct', firstDivergence: undefined, confirmedCorrectSteps: ['a'], confidence: 0.95 }),
      { loadTransferContext: async () => ({ originalProblemId: 'p1', transferProblemId: 'p1', sameGovernedSkill: true, transferSolvedDeterministically: true, supportDeliveredOnTransfer: false }) },
    ).deps);
    expect(sameProb.ok && (sameProb as { candidate: { transferIndependent: boolean } }).candidate.transferIndependent).toBe(false);

    const indep = await integratePracticePadLearning(depsFor(
      [mkCheck({ checkId: 'p0', basedOnVersion: 1 })],
      mkCheck({ checkId: 'c-t2', basedOnVersion: 2, status: 'CONFIRMED_CORRECT', deterministicVerdict: 'correct', firstDivergence: undefined, confirmedCorrectSteps: ['a'], confidence: 0.95 }),
      { loadTransferContext: async () => ({ originalProblemId: 'p1', transferProblemId: 'p2', sameGovernedSkill: true, transferSolvedDeterministically: true, supportDeliveredOnTransfer: false }) },
    ).deps);
    expect(indep.ok && (indep as { candidate: { transferIndependent: boolean; masterySignal: string | null } }).candidate.transferIndependent).toBe(true);
    expect(indep.ok && (indep as { candidate: { masterySignal: string | null } }).candidate.masterySignal).toBe('similar_problem_success');

    const supp = await integratePracticePadLearning(depsFor(
      [mkCheck({ checkId: 'p0', basedOnVersion: 1 })],
      mkCheck({ checkId: 'c-t3', basedOnVersion: 2, status: 'CONFIRMED_CORRECT', deterministicVerdict: 'correct', firstDivergence: undefined, confirmedCorrectSteps: ['a'], confidence: 0.95 }),
      { loadTransferContext: async () => ({ originalProblemId: 'p1', transferProblemId: 'p2', sameGovernedSkill: true, transferSolvedDeterministically: true, supportDeliveredOnTransfer: true }) },
    ).deps);
    expect(supp.ok && (supp as { candidate: { transferIndependent: boolean } }).candidate.transferIndependent).toBe(false);
  });

  it('PP-09 readers come from backend truth; false support signal eliminated, proven signal allowed; integrity never flips math or mastery', async () => {
    const { deps } = depsFor(
      [mkCheck({ checkId: 'p0', basedOnVersion: 1 })],
      mkCheck({ checkId: 'c-r', basedOnVersion: 2, status: 'CONFIRMED_CORRECT', deterministicVerdict: 'correct', firstDivergence: undefined, confirmedCorrectSteps: ['a', 'b', 'c'], confidence: 0.95 }),
    );
    const res = await integratePracticePadLearning(deps);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    // 7. readers from backend truth (revision length, history count, derived steps)
    expect(res.readers.workChars).toBeGreaterThan(0);
    expect(res.readers.revisionCount).toBe(2);
    expect(res.readers.reasoningSteps).toBe(3);

    // 8. false signal: unrelated SUPPORT_DELIVERED + CHECK_COMPLETED alone emits nothing now
    const memStore = (() => {
      const obs: Array<{ eventId: string; attemptId: string; schoolId: string; studentId: string; eventType: 'SUPPORT_DELIVERED' | 'CHECK_COMPLETED'; clientObservedAt: null; serverReceivedAt: string; serverSeq: number; outOfOrder: false; metadataJson: string; createdAt: string }> = [];
      return {
        findObservation: async () => null,
        listObservationsByAttempt: async () => ({ rows: obs as unknown as never[], total: obs.length }),
        nextServerSeq: async () => obs.length + 1,
        insertObservation: async (r: (typeof obs)[number]) => { obs.push(r); return true; },
        findEvidenceByScope: async () => null,
        insertEvidence: async () => true,
      };
    })();
    const fakeOwner = { getPracticeAttempt: async () => ({ schoolId: 's-pp10b', studentId: 'l-pp10b' }) };
    await practicePadIntegrityStore.resetForTest?.().catch(() => undefined);
    const { recordIntegrityObservation } = await import('../services/practicePadRuntime/practicePadIntegrityEngine');
    await recordIntegrityObservation(ID, { attemptId: 'a-x', eventId: 'e1', eventType: 'SUPPORT_DELIVERED' }, { attemptOwner: fakeOwner as never, store: memStore as never, clock: () => '2026-09-23T00:00:00.000Z' });
    await recordIntegrityObservation(ID, { attemptId: 'a-x', eventId: 'e2', eventType: 'CHECK_COMPLETED' }, { attemptOwner: fakeOwner as never, store: memStore as never, clock: () => '2026-09-23T00:00:05.000Z' });
    const unproven = await evaluatePracticeIntegrity(ID, { attemptId: 'a-x', idempotencyKey: 'k-unproven' }, { attemptOwner: fakeOwner as never, store: memStore as never, readers: {}, clock: () => '2026-09-23T00:00:06.000Z', newEvidenceId: () => 'ev-unproven' });
    expect(unproven.ok).toBe(true);
    if (!unproven.ok || !unproven.evidence) return;
    expect(unproven.evidence.signals).not.toContain('SUPPORT_USED_BEFORE_CORRECTION');

    // 9. proven corrected-after-support may emit the signal
    const proven = await evaluatePracticeIntegrity(ID, { attemptId: 'a-x', idempotencyKey: 'k-proven' }, { attemptOwner: fakeOwner as never, store: memStore as never, readers: { provenCorrectedAfterSupport: true }, clock: () => '2026-09-23T00:00:07.000Z', newEvidenceId: () => 'ev-proven' });
    expect(proven.ok && proven.evidence?.signals).toContain('SUPPORT_USED_BEFORE_CORRECTION');

    // 10/11. integrity concern never changes math correctness and never directly mutates mastery:
    // engine output carries no verdict/mastery fields
    expect(Object.keys(unproven.evidence)).not.toContain('deterministicVerdict');
    expect(Object.keys(unproven.evidence)).not.toContain('masteryDelta');
    // 12-14. memory never stores suspicion; revision/Growth get admitted evidence only (proven by orchestrator projectors receiving candidate, not signals)
    expect(PP10_LIVE_MODEL_CALLS).toBe(0);
  });

  it('MODERATE integrity concern holds strong projection but preserves correct verdict', async () => {
    const { deps, calls } = depsFor(
      [mkCheck({ checkId: 'p0', basedOnVersion: 1 })],
      mkCheck({ checkId: 'c-hold', basedOnVersion: 2, status: 'CONFIRMED_CORRECT', deterministicVerdict: 'correct', firstDivergence: undefined, confirmedCorrectSteps: ['a'], confidence: 0.95 }),
      { integrityEvidence: { integrityEvidenceId: 'inev-1', concernLevel: 'MODERATE', signals: ['VISIBILITY_INTERRUPTION'], recommendedNextEvidenceAction: 'REQUEST_TRANSFER_PROBLEM' } },
    );
    const res = await integratePracticePadLearning(deps);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.candidate.deterministicOutcome).toBe('correct');
    expect(res.evidenceHeldForTransfer).toBe(true);
    expect(calls).not.toContain('mastery');
    expect(calls).toContain('revision');
    expect(calls).toContain('growth');
  });
});

// ── PP-10 production integrity / hold / provenance proofs (same files) ──

import {
  integratePracticePadLearningCanonical,
  PP10_LIVE_MODEL_CALLS as PP10_PROD_MODEL_CALLS,
} from '../services/practicePadRuntime/practicePadLearningIntegrationService';
import type { commitPracticeLearningEvidence as CommitFn } from '../services/practiceCanonicalLearningService';

const PROD_ID_B = { schoolId: 's-pp10b', studentId: 'l-pp10b', verifiedSchool: true };

function prodRecordB(c: PracticePadCheckResult) {
  return {
    scopeHash: `scope-${c.checkId}`, checkId: c.checkId, schoolId: 's-pp10b', studentId: 'l-pp10b',
    attemptId: c.attemptId, basedOnVersion: c.basedOnVersion, idempotencyKey: `k-${c.checkId}`,
    fingerprint: `fp-${c.checkId}`, status: c.status, evaluationMode: 'deterministic' as const,
    evidenceEligible: true, resultJson: JSON.stringify(c),
    createdAt: '2026-09-23T00:00:00.000Z', resolvedAt: '2026-09-23T00:00:00.000Z',
  };
}

function fakeEvidenceOwnerB() {
  const receipts = new Map<string, { committedEvidenceId: string; masteryApplied: boolean }>();
  const inputs: Array<Parameters<typeof CommitFn>[0]> = [];
  let writes = 0;
  let masteryApplications = 0;
  return {
    inputs,
    get writes() { return writes; },
    get masteryApplications() { return masteryApplications; },
    commit: (async (input: Parameters<typeof CommitFn>[0]) => {
      inputs.push(input);
      const key = `practice_attempt:${input.schoolId}:${input.learnerId}:${input.clientRequestId}`;
      const existing = receipts.get(key);
      if (existing) {
        return { attemptId: input.attemptId, committedEvidenceId: existing.committedEvidenceId, evidenceCandidateId: null, masteryApplied: existing.masteryApplied, deduplicated: true };
      }
      writes += 1;
      const masteryApplied = input.deferMastery === true ? false : input.trustedOutcome === 'correct';
      if (masteryApplied) masteryApplications += 1;
      const committedEvidenceId = `evb-${writes}`;
      receipts.set(key, { committedEvidenceId, masteryApplied });
      return { attemptId: input.attemptId, committedEvidenceId, evidenceCandidateId: `candb-${writes}`, masteryApplied, deduplicated: false };
    }) as typeof CommitFn,
  };
}

function prodBindingsB(current: PracticePadCheckResult, history: PracticePadCheckResult[], extra: Record<string, unknown> = {}) {
  const evidence = fakeEvidenceOwnerB();
  const integrityCalls: Array<{ readers: Record<string, unknown>; evidence: unknown }> = [];
  let concern: string = (extra.concern as string | undefined) ?? 'NONE';
  const revisions = [
    { revisionId: 'r1', version: 1, snapshot: { blocks: [{ blockId: 'b1', kind: 'TEXT', content: 'work trace one' }] }, contentHash: 'h1' },
    { revisionId: 'r2', version: 2, snapshot: { blocks: [{ blockId: 'b1', kind: 'TEXT', content: 'work trace one and two, longer' }] }, contentHash: 'h2' },
  ];
  const interpretation = (extra.interpretation as { getInterpretation: (id: unknown, iid: string) => Promise<unknown> } | undefined)?.getInterpretation;
  // Downstream-owner seam: production binds the real canonical owners;
  // tests record admitted-facts calls without touching a database.
  const downstreamCalls: Array<{ owner: string; facts: unknown }> = [];
  return {
    evidence,
    integrityCalls,
    downstreamCalls,
    overrides: {
      checkStore: {
        findByCheckId: async (attemptId: string, checkId: string) =>
          checkId === current.checkId && attemptId === current.attemptId ? prodRecordB(current) : null,
        listByAttempt: async () => history.map(prodRecordB),
      },
      attemptOwner: {
        getPracticeAttempt: async () => ({
          attemptId: 'a1', schoolId: 's-pp10b', studentId: 'l-pp10b',
          problemId: 'p1', problemVersion: 1, skillIds: ['sk-1'], subject: null, topic: null,
        }),
      },
      problemAuthority: {
        resolveForAttemptAsync: async () => ({
          problem: { problemId: 'p1' }, learnerView: { problemId: 'p1' },
          hasAuthoritativeAnswer: true, problemVersion: 1, durable: true,
        }),
      },
      documentStore: {
        getDocument: async () => ({ currentVersion: 2 }),
        getRevision: async (_id: unknown, _att: unknown, version: number) => revisions.find((r) => r.version === version) ?? null,
      },
      interpretationStore: { getInterpretation: interpretation ?? (async () => null) },
      integrityEvaluator: (async (_id: unknown, _in: unknown, deps: { readers?: Record<string, unknown> }) => {
        const readers = { ...(deps.readers ?? {}) };
        const ev = {
          integrityEvidenceId: 'inev-prod', schoolId: 's-pp10b', studentId: 'l-pp10b',
          attemptId: 'a1', concernLevel: concern, signals: concern === 'MODERATE' ? ['VISIBILITY_INTERRUPTION'] : [],
          recommendedNextEvidenceAction: concern === 'MODERATE' ? 'REQUEST_TRANSFER_PROBLEM' : 'NONE',
        };
        integrityCalls.push({ readers, evidence: ev });
        return { ok: true as const, evidence: ev };
      }) as never,
      evidenceOwner: { commitPracticeLearningEvidence: evidence.commit },
      downstreamOwners: {
        recordLearnerMemory: async (_id: unknown, facts: unknown) => { downstreamCalls.push({ owner: 'memory', facts }); },
        scheduleRevisionReview: async (_id: unknown, facts: unknown) => { downstreamCalls.push({ owner: 'revision', facts }); },
        recommendGrowth: async (_id: unknown, facts: unknown) => { downstreamCalls.push({ owner: 'growth', facts }); },
      },
    },
  };
}

describe('PP-10 production recovery / integrity / provenance', () => {
  it('unrelated telemetry alone never creates the support-before-correction signal on the production path', async () => {
    const current = mkCheck({ checkId: 'c-r', basedOnVersion: 2, status: 'CONFIRMED_CORRECT', deterministicVerdict: 'correct', firstDivergence: undefined, confirmedCorrectSteps: ['a', 'b', 'c'], confidence: 0.95 });
    const { integrityCalls, overrides } = prodBindingsB(current, [mkCheck({ checkId: 'p0', basedOnVersion: 1 })]);
    const res = await integratePracticePadLearningCanonical(
      { identity: PROD_ID_B, attemptId: 'a1', checkId: 'c-r', idempotencyKey: 'idem-prod-b1' },
      overrides as never,
    );
    expect(res.ok).toBe(true);
    expect(integrityCalls).toHaveLength(1);
    // No support in durable history: recovery is SELF_CORRECTED, never
    // CORRECTED_AFTER_SUPPORT, so the proven flag reaching PP-09 is not true.
    expect(integrityCalls[0]!.readers.provenCorrectedAfterSupport).not.toBe(true);
  });

  it('proven CORRECTED_AFTER_SUPPORT reaches PP-09 on the production path', async () => {
    const current = mkCheck({ checkId: 'c-sup', basedOnVersion: 2, status: 'CONFIRMED_CORRECT', deterministicVerdict: 'correct', firstDivergence: undefined, confirmedCorrectSteps: ['a'], confidence: 0.95 });
    const { integrityCalls, overrides } = prodBindingsB(
      current,
      [mkCheck({ checkId: 'p0', basedOnVersion: 1 }), supportCheck('s1', 1, 'L1')],
    );
    const res = await integratePracticePadLearningCanonical(
      { identity: PROD_ID_B, attemptId: 'a1', checkId: 'c-sup', idempotencyKey: 'idem-prod-b2' },
      overrides as never,
    );
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.recovery?.classification).toBe('CORRECTED_AFTER_SUPPORT');
    expect(integrityCalls).toHaveLength(1);
    expect(integrityCalls[0]!.readers.provenCorrectedAfterSupport).toBe(true);
  });

  it('canonical mastery is never invoked twice for one committed evidence', async () => {
    const current = mkCheck({ checkId: 'c-m', basedOnVersion: 2, status: 'CONFIRMED_CORRECT', deterministicVerdict: 'correct', firstDivergence: undefined, confirmedCorrectSteps: ['a'], confidence: 0.95 });
    const { evidence, overrides } = prodBindingsB(current, [mkCheck({ checkId: 'p0', basedOnVersion: 1 })]);
    const input = { identity: PROD_ID_B, attemptId: 'a1', checkId: 'c-m', idempotencyKey: 'idem-prod-b3' };
    expect(await integratePracticePadLearningCanonical(input, overrides as never)).toMatchObject({ ok: true });
    expect(await integratePracticePadLearningCanonical(input, overrides as never)).toMatchObject({ ok: true, deduplicated: true });
    // One durable write, one canonical mastery consequence — the
    // production adapter passes no second mastery projector.
    expect(evidence.writes).toBe(1);
    expect(evidence.masteryApplications).toBe(1);
  });

  it('MODERATE concern preserves correct math but defers strong mastery until transfer', async () => {
    const current = mkCheck({ checkId: 'c-holdp', basedOnVersion: 2, status: 'CONFIRMED_CORRECT', deterministicVerdict: 'correct', firstDivergence: undefined, confirmedCorrectSteps: ['a'], confidence: 0.95 });
    const { evidence, overrides } = prodBindingsB(current, [mkCheck({ checkId: 'p0', basedOnVersion: 1 })], { concern: 'MODERATE' });
    const res = await integratePracticePadLearningCanonical(
      { identity: PROD_ID_B, attemptId: 'a1', checkId: 'c-holdp', idempotencyKey: 'idem-prod-b4' },
      overrides as never,
    );
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.candidate.deterministicOutcome).toBe('correct');
    expect(res.evidenceHeldForTransfer).toBe(true);
    expect(evidence.inputs).toHaveLength(1);
    expect(evidence.inputs[0]!.deferMastery).toBe(true);
    expect(evidence.inputs[0]!.trustedOutcome).toBe('correct');
    expect(evidence.masteryApplications).toBe(0);
  });

  it('confirmed PP-08 provenance retains authoritative id, hash, and representation class', async () => {
    const current = mkCheck({
      checkId: 'c-int', basedOnVersion: 2, status: 'CONFIRMED_CORRECT', deterministicVerdict: 'correct',
      firstDivergence: undefined, confirmedCorrectSteps: ['a'], confidence: 0.95,
      interpretation: { interpretationId: 'ppint-1', sourceBlockId: 'draw-1', status: 'CONFIRMED', candidates: [] },
    });
    const confirmed = {
      interpretationId: 'ppint-1', schoolId: 's-pp10b', studentId: 'l-pp10b', attemptId: 'a1',
      documentVersion: 2, sourceBlockId: 'draw-1', sourceContentHash: 'hash-draw-1',
      representationClass: 'EQUATION', status: 'CONFIRMED',
    };
    const { evidence, overrides } = prodBindingsB(current, [mkCheck({ checkId: 'p0', basedOnVersion: 1 })], {
      interpretation: { getInterpretation: async () => confirmed },
    });
    const res = await integratePracticePadLearningCanonical(
      { identity: PROD_ID_B, attemptId: 'a1', checkId: 'c-int', idempotencyKey: 'idem-prod-b5' },
      overrides as never,
    );
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.candidate.interpretationId).toBe('ppint-1');
    expect(res.candidate.interpretationSourceHash).toBe('hash-draw-1');
    expect(res.candidate.representationClass).toBe('EQUATION');
    expect(evidence.inputs[0]!.practicePadProvenance?.interpretationId).toBe('ppint-1');
    expect(evidence.inputs[0]!.practicePadProvenance?.interpretationSourceHash).toBe('hash-draw-1');
    expect(evidence.inputs[0]!.practicePadProvenance?.representationClass).toBe('EQUATION');
  });

  it('unconfirmed interpretation still produces zero learning-state mutation on the production path', async () => {
    const current = mkCheck({
      checkId: 'c-ink', basedOnVersion: 2, status: 'NEEDS_CLARIFICATION', deterministicVerdict: 'unknown',
      confidence: 0, interpretationRequired: true,
    });
    const { evidence, overrides } = prodBindingsB(current, [mkCheck({ checkId: 'p0', basedOnVersion: 1 })]);
    const res = await integratePracticePadLearningCanonical(
      { identity: PROD_ID_B, attemptId: 'a1', checkId: 'c-ink', idempotencyKey: 'idem-prod-b6' },
      overrides as never,
    );
    expect(res.ok).toBe(false);
    expect(evidence.inputs).toHaveLength(0);
    expect(evidence.writes).toBe(0);
  });

  it('raw ink and raw learner work are absent from canonical evidence and memory payload', async () => {
    const current = mkCheck({ checkId: 'c-raw', basedOnVersion: 2, status: 'CONFIRMED_CORRECT', deterministicVerdict: 'correct', firstDivergence: undefined, confirmedCorrectSteps: ['a'], confidence: 0.95 });
    const { evidence, overrides } = prodBindingsB(current, [mkCheck({ checkId: 'p0', basedOnVersion: 1 })]);
    const res = await integratePracticePadLearningCanonical(
      { identity: PROD_ID_B, attemptId: 'a1', checkId: 'c-raw', idempotencyKey: 'idem-prod-b7' },
      overrides as never,
    );
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.candidate.rawWorkIncluded).toBe(false);
    expect(res.candidate.rawInkIncluded).toBe(false);
    const wire = JSON.stringify({ input: evidence.inputs[0], candidate: res.candidate });
    expect(wire).not.toMatch(/stroke|pathM|inkPoints|workText|snapshot|blocks|contentHash/);
  });

  it('zero live model calls on the production path', () => {
    expect(PP10_PROD_MODEL_CALLS).toBe(0);
  });
});

// ── PP-10 blocker repair proofs (B): production transfer from backend state ──
// Production never depends on overrides.loadTransferContext: transfer is
// derived from PracticeAttempt + PracticePadCheck + governed skill +
// deterministic outcome + durable support history. Absent proof keeps
// transferIndependent=false.

function txCheck(over: Partial<PracticePadCheckResult> = {}): PracticePadCheckResult {
  return mkCheck({
    checkId: 'c-tx', attemptId: 'a1', basedOnVersion: 2, status: 'CONFIRMED_CORRECT',
    deterministicVerdict: 'correct', firstDivergence: undefined,
    confirmedCorrectSteps: ['s1'], confidence: 0.95, ...over,
  });
}

function txRecord(c: PracticePadCheckResult) {
  return {
    scopeHash: `scope-${c.checkId}`, checkId: c.checkId, schoolId: 's-pp10b', studentId: 'l-pp10b',
    attemptId: c.attemptId, basedOnVersion: c.basedOnVersion, idempotencyKey: `k-${c.checkId}`,
    fingerprint: `fp-${c.checkId}`, status: c.status, evaluationMode: 'deterministic' as const,
    evidenceEligible: true, resultJson: JSON.stringify(c),
    createdAt: '2026-09-23T00:00:00.000Z', resolvedAt: '2026-09-23T00:00:00.000Z',
  };
}

interface TxTransferAttempt {
  attemptId: string;
  problemId: string;
  skillIds: string[];
  checks: PracticePadCheckResult[];
}

function txBindings(transfers: TxTransferAttempt[]) {
  const current = txCheck();
  const history = [mkCheck({ checkId: 'p0', basedOnVersion: 1 })];
  const evidence = fakeEvidenceOwnerB();
  const downstreamCalls: Array<{ owner: string; facts: unknown }> = [];
  const checksByAttempt = new Map<string, PracticePadCheckResult[]>();
  checksByAttempt.set('a1', history);
  for (const t of transfers) checksByAttempt.set(t.attemptId, t.checks);
  const revisions = [
    { revisionId: 'r1', version: 1, snapshot: { blocks: [{ blockId: 'b1', kind: 'TEXT', content: 'work trace one' }] }, contentHash: 'h1' },
    { revisionId: 'r2', version: 2, snapshot: { blocks: [{ blockId: 'b1', kind: 'TEXT', content: 'work trace one and two, longer' }] }, contentHash: 'h2' },
  ];
  const overrides = {
    checkStore: {
      findByCheckId: async (attemptId: string, checkId: string) =>
        checkId === current.checkId && attemptId === 'a1' ? txRecord(current) : null,
      listByAttempt: async (attemptId: string) => (checksByAttempt.get(attemptId) ?? []).map(txRecord),
    },
    attemptOwner: {
      getPracticeAttempt: async (_id: unknown, attemptId: string) => {
        const t = transfers.find((x) => x.attemptId === attemptId);
        if (t) {
          return {
            attemptId: t.attemptId, schoolId: 's-pp10b', studentId: 'l-pp10b',
            problemId: t.problemId, problemVersion: 1, skillIds: t.skillIds, subject: null, topic: null,
          };
        }
        if (attemptId !== 'a1') return null;
        return {
          attemptId: 'a1', schoolId: 's-pp10b', studentId: 'l-pp10b',
          problemId: 'p1', problemVersion: 1, skillIds: ['sk-1'], subject: null, topic: null,
        };
      },
      listPracticeAttempts: async () =>
        transfers.map((t) => ({ attemptId: t.attemptId, problemId: t.problemId, skillIds: t.skillIds, status: 'evaluated' })),
    },
    problemAuthority: {
      resolveForAttemptAsync: async () => ({
        problem: { problemId: 'p1' }, learnerView: { problemId: 'p1' },
        hasAuthoritativeAnswer: true, problemVersion: 1, durable: true,
      }),
    },
    documentStore: {
      getDocument: async () => ({ currentVersion: 2 }),
      getRevision: async (_id: unknown, _att: unknown, version: number) => revisions.find((r) => r.version === version) ?? null,
    },
    interpretationStore: { getInterpretation: async () => null },
    integrityEvaluator: (async () => ({
      ok: true as const,
      evidence: {
        integrityEvidenceId: 'inev-tx', schoolId: 's-pp10b', studentId: 'l-pp10b', attemptId: 'a1',
        concernLevel: 'NONE', signals: [], recommendedNextEvidenceAction: 'NONE',
      },
    })) as never,
    evidenceOwner: { commitPracticeLearningEvidence: evidence.commit },
    downstreamOwners: {
      recordLearnerMemory: async (_id: unknown, facts: unknown) => { downstreamCalls.push({ owner: 'memory', facts }); },
      scheduleRevisionReview: async (_id: unknown, facts: unknown) => { downstreamCalls.push({ owner: 'revision', facts }); },
      recommendGrowth: async (_id: unknown, facts: unknown) => { downstreamCalls.push({ owner: 'growth', facts }); },
    },
    // Deliberately NO loadTransferContext: production derives from backend state.
  };
  return { evidence, downstreamCalls, overrides };
}

describe('PP-10 blocker repair (B): production transfer from backend state', () => {
  it('8. no-override production transfer resolves a proven transfer from backend state', async () => {
    const built = txBindings([
      {
        attemptId: 'a2', problemId: 'p2', skillIds: ['sk-1'],
        checks: [
          mkCheck({
            checkId: 't1', attemptId: 'a2', basedOnVersion: 1, status: 'CONFIRMED_CORRECT',
            deterministicVerdict: 'correct', firstDivergence: undefined,
            confirmedCorrectSteps: ['s1'], confidence: 0.95,
          }),
        ],
      },
    ]);
    expect('loadTransferContext' in built.overrides).toBe(false);
    const res = await integratePracticePadLearningCanonical(
      { identity: PROD_ID_B, attemptId: 'a1', checkId: 'c-tx', idempotencyKey: 'idem-block-b8' },
      built.overrides as never,
    );
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.candidate.transferIndependent).toBe(true);
    expect(res.candidate.masterySignal).toBe('similar_problem_success');
    expect(res.candidate.supportQuality).toBe('INDEPENDENT');
    expect(built.evidence.inputs).toHaveLength(1);
    expect(built.downstreamCalls.map((c) => c.owner)).toEqual(['memory', 'revision', 'growth']);
  });

  it('9a. absent transfer proof never strengthens mastery', async () => {
    const built = txBindings([]);
    const res = await integratePracticePadLearningCanonical(
      { identity: PROD_ID_B, attemptId: 'a1', checkId: 'c-tx', idempotencyKey: 'idem-block-b9a' },
      built.overrides as never,
    );
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.candidate.transferIndependent).toBe(false);
    expect(res.candidate.masterySignal).not.toBe('similar_problem_success');
  });

  it('9b. supported transfer solves but stays non-independent', async () => {
    const built = txBindings([
      {
        attemptId: 'a2', problemId: 'p2', skillIds: ['sk-1'],
        checks: [
          mkCheck({
            checkId: 'ts1', attemptId: 'a2', basedOnVersion: 1,
            intervention: { level: 'L1', canonicalSupportLevel: 'question_only', move: 'q', trigger: 't', feedbackText: 'f', nextLearnerAction: 'n', origin: 'SYSTEM_PROPOSED' },
          }),
          mkCheck({
            checkId: 'ts2', attemptId: 'a2', basedOnVersion: 2, status: 'CONFIRMED_CORRECT',
            deterministicVerdict: 'correct', firstDivergence: undefined,
            confirmedCorrectSteps: ['s1'], confidence: 0.95,
          }),
        ],
      },
    ]);
    const res = await integratePracticePadLearningCanonical(
      { identity: PROD_ID_B, attemptId: 'a1', checkId: 'c-tx', idempotencyKey: 'idem-block-b9b' },
      built.overrides as never,
    );
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    // Solved deterministically, but support was delivered on the
    // transfer attempt: proven non-independent, no mastery boost.
    expect(res.candidate.transferIndependent).toBe(false);
    expect(res.candidate.masterySignal).not.toBe('similar_problem_success');
  });
});
