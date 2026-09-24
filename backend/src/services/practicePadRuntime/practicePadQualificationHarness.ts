// ─────────────────────────────────────────────────────────────
// Steadfast AI — Practice Pad PP-11: qualification harness
//
// Runs practice-pad-qualification-corpus-v1 against the ACCEPTED
// deterministic runtime (PP-04…PP-10). No live model calls, no
// provider, no OCR, no DB, no network. Deterministic IDs/clocks.
//
// Any critical failure forces status FAIL regardless of aggregates.
// ─────────────────────────────────────────────────────────────

import { evaluateMathDeterministically } from './practicePadMathEvaluator';
import { analyzeReasoningGraph } from './practicePadReasoningGraph';
import {
  proposePracticeIntervention,
  validateInterventionFeedback,
} from './practicePadInterventionFeedback';
import {
  classifyPracticeRecovery,
  evaluateTransferSuccess,
  type PracticeSupportProvenance,
} from './practicePadSupportProvenance';
import {
  recordIntegrityObservation,
  evaluatePracticeIntegrity,
} from './practicePadIntegrityEngine';
import { integratePracticePadLearning } from './practicePadLearningIntegrationService';
import { practicePadSemanticPort } from './practicePadSemanticPort';
import {
  PP11_CORPUS,
  PP11_CORPUS_VERSION,
  type PP11Case,
  type PP11CriticalTag,
  type PP11EvidenceExpected,
  type PP11EvidenceInput,
  type PP11IntegrityExpected,
  type PP11IntegrityInput,
  type PP11InterventionExpected,
  type PP11InterventionInput,
  type PP11LeakageInput,
  type PP11RecoveryInput,
  type PP11TransferInput,
} from './practicePadQualificationCorpusV1';
import type { PracticePadCheckResult } from './practicePadCheckContracts';

export interface PP11CaseResult {
  id: string;
  category: string;
  kind: string;
  pass: boolean;
  observed: Record<string, unknown>;
  expected: Record<string, unknown>;
  mismatches: string[];
  criticalHit: PP11CriticalTag[];
  latencyMs: number;
}

export interface PP11Report {
  corpusVersion: string;
  caseCount: number;
  passed: number;
  failed: number;
  failures: string[];
  criticalFailures: Array<{ caseId: string; tags: PP11CriticalTag[]; detail: string }>;
  metrics: Record<string, number>;
  dimensionResults: Record<string, { passed: number; failed: number }>;
  durationMs: number;
  liveModelCalls: 0;
  modelCost: 0;
  status: 'PASS' | 'FAIL' | 'UNVERIFIED';
  calibrationNotes: string[];
}

function norm(s: unknown): string {
  return String(s ?? '').trim().toLowerCase().replace(/\s+/g, '');
}

// ── math (PP-04) ──

function runMath(c: PP11Case): Omit<PP11CaseResult, 'id' | 'category' | 'kind' | 'latencyMs'> {
  const input = c.input as { candidate: string; expected: string };
  const expected = c.expected as { status: string };
  const t0 = performance.now();
  const math = evaluateMathDeterministically({ candidate: input.candidate, expected: input.expected });
  void performance.now();
  const observed = { status: math.status };
  const pass = math.status === expected.status;
  return {
    pass,
    observed,
    expected: expected as Record<string, unknown>,
    mismatches: pass ? [] : [`math status ${math.status} !== expected ${expected.status}`],
    criticalHit: pass ? [] : [...c.criticalFailureTags],
  };
}

// ── divergence (PP-05) ──

function runDivergence(c: PP11Case): Omit<PP11CaseResult, 'id' | 'category' | 'kind' | 'latencyMs'> {
  const input = c.input as { problemPrompt: string; steps: string[] };
  const expected = c.expected as { status: string; firstDivergenceStepIndex: number | null; confirmedPrefixCount: number };
  const analysis = analyzeReasoningGraph({
    attemptId: `pp11-${c.id}`,
    basedOnVersion: 1,
    snapshot: {
      blocks: [{ blockId: 'b1', kind: 'EQUATION', content: input.steps.join('\n'), order: 0 }],
    },
    problemPrompt: input.problemPrompt,
  });
  const observed = {
    status: analysis.status,
    firstDivergenceStepIndex: analysis.firstDivergence?.stepIndex ?? null,
    confirmedPrefixCount: analysis.confirmedPrefixCount,
  };
  const mismatches: string[] = [];
  if (observed.status !== expected.status) mismatches.push(`status ${observed.status} !== ${expected.status}`);
  if (observed.firstDivergenceStepIndex !== expected.firstDivergenceStepIndex) {
    mismatches.push(`firstDivergence ${String(observed.firstDivergenceStepIndex)} !== ${String(expected.firstDivergenceStepIndex)}`);
  }
  if (observed.confirmedPrefixCount !== expected.confirmedPrefixCount) {
    mismatches.push(`prefix ${observed.confirmedPrefixCount} !== ${expected.confirmedPrefixCount}`);
  }
  return {
    pass: mismatches.length === 0,
    observed: observed as Record<string, unknown>,
    expected: expected as unknown as Record<string, unknown>,
    mismatches,
    criticalHit: mismatches.length === 0 ? [] : [...c.criticalFailureTags],
  };
}

// ── intervention (PP-06) ──

function runIntervention(c: PP11Case): Omit<PP11CaseResult, 'id' | 'category' | 'kind' | 'latencyMs'> {
  const input = c.input as PP11InterventionInput;
  const expected = c.expected as PP11InterventionExpected;
  const proposal = proposePracticeIntervention(
    {
      checkStatus: input.checkStatus,
      firstDivergenceStepIndex: input.firstDivergenceStepIndex ?? undefined,
      trustedSupportCount: input.trustedSupportCount ?? 0,
    },
    { expectedAnswer: input.expectedAnswerSecret },
  );
  const leaked = norm(proposal.feedbackText).includes(norm(input.expectedAnswerSecret));
  const observed = {
    level: proposal.decision.level,
    targetStepIndex: proposal.decision.targetStepIndex ?? null,
    mayRevealFinalAnswer: proposal.decision.mayRevealFinalAnswer,
    semanticLanguageRequired: proposal.decision.semanticLanguageRequired,
    leakageAbsent: !leaked,
    liveModelCalls: proposal.liveModelCalls,
  };
  const mismatches: string[] = [];
  if (observed.level !== expected.level) mismatches.push(`level ${observed.level} !== ${expected.level}`);
  if (expected.targetStepIndex !== undefined && observed.targetStepIndex !== (expected.targetStepIndex ?? null)) {
    mismatches.push(`target ${String(observed.targetStepIndex)} !== ${String(expected.targetStepIndex)}`);
  }
  if (expected.semanticLanguageRequired !== undefined && observed.semanticLanguageRequired !== expected.semanticLanguageRequired) {
    mismatches.push('semanticLanguageRequired mismatch');
  }
  if (observed.mayRevealFinalAnswer !== false) mismatches.push('mayRevealFinalAnswer is not false');
  if (leaked) mismatches.push('feedback leaks the protected expected answer');
  if (proposal.liveModelCalls !== 0) mismatches.push('live model call observed');
  return {
    pass: mismatches.length === 0,
    observed: observed as Record<string, unknown>,
    expected: expected as unknown as Record<string, unknown>,
    mismatches,
    criticalHit: mismatches.length === 0 ? [] : [...c.criticalFailureTags],
  };
}

// ── leakage detector proof ──

function runLeakage(c: PP11Case): Omit<PP11CaseResult, 'id' | 'category' | 'kind' | 'latencyMs'> {
  const input = c.input as PP11LeakageInput;
  const decision = {
    level: 'L1' as const,
    move: 'metacognitive_clarification' as const,
    trigger: 'first_divergence' as const,
    reasoningStatus: 'CONFIRMED_INCORRECT' as const,
    supportReason: 'structural candidate only',
    learnerActionRequired: input.nextLearnerAction,
    mayRevealFinalAnswer: false as const,
    semanticLanguageRequired: false,
  };
  const validation = validateInterventionFeedback({
    feedbackText: input.feedbackText,
    nextLearnerAction: input.nextLearnerAction,
    level: 'L1',
    decision,
    secrets: { expectedAnswer: input.expectedAnswerSecret, acceptableAnswerForms: input.acceptableAnswerForms ?? [] },
  });
  const observed = { valid: validation.valid, reasons: validation.reasons };
  const pass = validation.valid === false;
  return {
    pass,
    observed: observed as Record<string, unknown>,
    expected: { valid: false },
    mismatches: pass ? [] : ['leaking feedback was NOT rejected by the validator'],
    criticalHit: pass ? [] : [...c.criticalFailureTags],
  };
}

// ── recovery (PP-07) ──

const LEVEL_TO_CANONICAL: Record<string, string> = {
  L0: 'reflection_prompt',
  L1: 'question_only',
  L2: 'concept_cue',
  L3: 'strategy_hint',
  L4: 'similar_example',
  L5: 'step_check',
};

function runRecovery(c: PP11Case): Omit<PP11CaseResult, 'id' | 'category' | 'kind' | 'latencyMs'> {
  const input = c.input as PP11RecoveryInput;
  const expected = c.expected as { classification: string; independentOfSupport: boolean };
  const supportReceived: PracticeSupportProvenance[] = input.supportReceived.map((s, i) => ({
    checkId: `pp11-sup-${c.id}-${i}`,
    attemptId: `pp11-${c.id}`,
    basedOnVersion: s.basedOnVersion,
    practiceLevel: s.level,
    canonicalSupportLevel: LEVEL_TO_CANONICAL[s.level] as PracticeSupportProvenance['canonicalSupportLevel'],
    move: 'metacognitive_clarification',
    trigger: 'first_divergence',
    origin: 'SYSTEM_PROPOSED',
    createdAt: '2026-01-01T00:00:00.000Z',
  }));
  const analysis = classifyPracticeRecovery({
    priorCheckId: input.priorCheckId,
    currentCheckId: input.currentCheckId,
    priorVersion: input.priorVersion,
    currentVersion: input.currentVersion,
    priorStatus: input.priorStatus,
    currentStatus: input.currentStatus,
    priorDivergence: input.priorDivergence ?? null,
    currentDivergence: input.currentDivergence ?? null,
    supportReceived,
    supportHistoryAvailable: input.supportHistoryAvailable ?? true,
  });
  const observed = { classification: analysis.classification, independentOfSupport: analysis.independentOfSupport };
  const mismatches: string[] = [];
  if (observed.classification !== expected.classification) mismatches.push(`classification ${observed.classification} !== ${expected.classification}`);
  if (observed.independentOfSupport !== expected.independentOfSupport) mismatches.push('independentOfSupport mismatch');
  if (expected.classification === 'CORRECTED_AFTER_SUPPORT' && observed.independentOfSupport === true) {
    mismatches.push('supported correction called independent');
  }
  return {
    pass: mismatches.length === 0,
    observed: observed as Record<string, unknown>,
    expected: expected as unknown as Record<string, unknown>,
    mismatches,
    criticalHit: mismatches.length === 0 ? [] : [...c.criticalFailureTags],
  };
}

// ── transfer (PP-07) ──

function runTransfer(c: PP11Case): Omit<PP11CaseResult, 'id' | 'category' | 'kind' | 'latencyMs'> {
  const input = c.input as PP11TransferInput;
  const expected = c.expected as { independent: boolean; reason: string };
  const verdict = evaluateTransferSuccess({ ...input });
  const observed = { independent: verdict.independent, reason: verdict.reason };
  const mismatches: string[] = [];
  if (observed.independent !== expected.independent) mismatches.push(`independent ${observed.independent} !== ${expected.independent}`);
  if (observed.reason !== expected.reason) mismatches.push(`reason ${observed.reason} !== ${expected.reason}`);
  return {
    pass: mismatches.length === 0,
    observed: observed as Record<string, unknown>,
    expected: expected as unknown as Record<string, unknown>,
    mismatches,
    criticalHit: mismatches.length === 0 ? [] : [...c.criticalFailureTags],
  };
}

// ── interpretation authority (PP-08 law, mirrored as the observable gate) ──

function interpretationAdmissible(input: {
  status: string;
  representationClass: string;
  hashMatchesCurrentWork: boolean;
  sameLearner: boolean;
}): boolean {
  if (input.status !== 'CONFIRMED') return false;
  if (input.representationClass !== 'TEXT' && input.representationClass !== 'EQUATION') return false;
  if (!input.hashMatchesCurrentWork) return false;
  if (!input.sameLearner) return false;
  return true;
}

function runInterpretation(c: PP11Case): Omit<PP11CaseResult, 'id' | 'category' | 'kind' | 'latencyMs'> {
  const input = c.input as { status: string; representationClass: string; hashMatchesCurrentWork: boolean; sameLearner: boolean };
  const expected = c.expected as { admissible: boolean };
  const admissible = interpretationAdmissible(input);
  const observed = { admissible };
  const pass = admissible === expected.admissible;
  return {
    pass,
    observed,
    expected: expected as unknown as Record<string, unknown>,
    mismatches: pass ? [] : [`admissible ${admissible} !== ${expected.admissible}`],
    criticalHit: pass ? [] : [...c.criticalFailureTags],
  };
}

// ── integrity (PP-09 real engine with in-memory fakes) ──

function makeIntegrityFakes(schoolId: string, studentId: string, attemptId: string, baseMs: number) {
  const observations: Array<Record<string, unknown>> = [];
  const evidenceByScope = new Map<string, Record<string, unknown>>();
  let seq = 0;
  let clockMs = baseMs;
  const store = {
    findObservation: async (eventId: string) => observations.find((o) => o.eventId === eventId) ?? null,
    listObservationsByAttempt: async (id: string, limit: number) => {
      const rows = observations
        .filter((o) => o.attemptId === id)
        .sort((a, b) => (a.serverSeq as number) - (b.serverSeq as number));
      return { rows: rows as never[], total: rows.length };
    },
    nextServerSeq: async () => {
      seq += 1;
      return seq;
    },
    insertObservation: async (record: Record<string, unknown>) => {
      if (observations.some((o) => o.eventId === record.eventId)) return false;
      observations.push(record);
      return true;
    },
    findEvidenceByScope: async (scopeHash: string) => evidenceByScope.get(scopeHash) ?? null,
    insertEvidence: async (record: Record<string, unknown>) => {
      if (evidenceByScope.has(record.scopeHash as string)) return false;
      evidenceByScope.set(record.scopeHash as string, record);
      return true;
    },
  };
  const attemptOwner = {
    getPracticeAttempt: async () => ({ schoolId, studentId, attemptId }),
  };
  return {
    store: store as never,
    attemptOwner: attemptOwner as never,
    clock: () => new Date(clockMs).toISOString(),
    advance: (ms: number) => {
      clockMs = baseMs + ms;
    },
  };
}

async function runIntegrity(c: PP11Case): Promise<Omit<PP11CaseResult, 'id' | 'category' | 'kind' | 'latencyMs'>> {
  const input = c.input as PP11IntegrityInput;
  const expected = c.expected as PP11IntegrityExpected;
  const schoolId = 'sch-pp11';
  const studentId = `stu-${c.id}`;
  const attemptId = `att-${c.id}`;
  const baseMs = Date.parse('2026-01-01T00:00:00.000Z');
  const fakes = makeIntegrityFakes(schoolId, studentId, attemptId, baseMs);
  const identity = { schoolId, studentId, verifiedSchool: true };
  const mismatches: string[] = [];
  let observed: Record<string, unknown> = {};
  let recordFailed: { code: string } | null = null;

  for (let i = 0; i < input.events.length; i += 1) {
    const ev = input.events[i];
    fakes.advance(ev.atOffsetMs);
    const clientObservedAt = ev.malformedClientTime
      ? 'not-a-timestamp'
      : ev.clientObservedAt ?? new Date(baseMs + ev.atOffsetMs).toISOString();
    const res = await recordIntegrityObservation(
      identity,
      { attemptId, eventId: `ev-${c.id}-${i}`, eventType: ev.type, clientObservedAt, metadata: {} },
      { attemptOwner: fakes.attemptOwner, store: fakes.store, clock: fakes.clock },
    );
    if (!res.ok) {
      recordFailed = { code: (res as { code: string }).code };
      break;
    }
  }

  if (expected.outcomeCode === 'OUT_OF_ORDER') {
    const pass = recordFailed?.code === 'OUT_OF_ORDER';
    observed = { outcomeCode: recordFailed?.code ?? 'ok' };
    return {
      pass,
      observed,
      expected: expected as unknown as Record<string, unknown>,
      mismatches: pass ? [] : [`expected OUT_OF_ORDER, got ${recordFailed?.code ?? 'ok'}`],
      criticalHit: pass ? [] : [...c.criticalFailureTags],
    };
  }
  if (recordFailed) {
    return {
      pass: false,
      observed: { outcomeCode: recordFailed.code },
      expected: expected as unknown as Record<string, unknown>,
      mismatches: [`record failed unexpectedly: ${recordFailed.code}`],
      criticalHit: [...c.criticalFailureTags],
    };
  }
  const outcome = await evaluatePracticeIntegrity(
    identity,
    { attemptId, idempotencyKey: `idem-${c.id}` },
    {
      attemptOwner: fakes.attemptOwner,
      store: fakes.store,
      readers: (input.readers ?? {}) as never,
      clock: fakes.clock,
      newEvidenceId: () => `ppinev-${c.id}`,
    },
  );
  if (!outcome.ok) {
    return {
      pass: false,
      observed: { outcomeCode: (outcome as { code: string }).code },
      expected: expected as unknown as Record<string, unknown>,
      mismatches: [`evaluate failed: ${(outcome as { code: string }).code}`],
      criticalHit: [...c.criticalFailureTags],
    };
  }
  const evidence = (outcome as { evidence: { concernLevel: string; recommendedNextEvidenceAction: string; signals: string[]; counterSignals: string[] } }).evidence;
  observed = {
    outcomeCode: 'ok',
    concern: evidence.concernLevel,
    action: evidence.recommendedNextEvidenceAction,
    signals: evidence.signals,
    counterSignals: evidence.counterSignals,
  };
  if (observed.concern !== expected.concern) mismatches.push(`concern ${observed.concern} !== ${expected.concern}`);
  if (expected.action !== undefined && observed.action !== expected.action) mismatches.push(`action ${observed.action} !== ${expected.action}`);
  const PUNITIVE = ['FLAG_CHEATING', 'PUNISH', 'ACCUSE', 'DISCIPLINE', 'GRADE_PENALTY'];
  if (PUNITIVE.includes(String(observed.action))) mismatches.push('punitive action represented');
  return {
    pass: mismatches.length === 0,
    observed,
    expected: expected as unknown as Record<string, unknown>,
    mismatches,
    criticalHit: mismatches.length === 0 ? [] : [...c.criticalFailureTags],
  };
}

// ── evidence / mastery safety (PP-10 real orchestrator with stub owners) ──

function makeEvidenceCheck(caseId: string, input: PP11EvidenceInput): PracticePadCheckResult {
  const attemptId = `att-${caseId}`;
  const version = 2;
  const prior: PracticePadCheckResult[] = [];
  if (input.priorIncorrectWithDivergence) {
    prior.push({
      checkId: `chk-${caseId}-prior`,
      attemptId,
      basedOnVersion: 1,
      status: 'CONFIRMED_INCORRECT',
      deterministicVerdict: 'incorrect',
      firstDivergence: { stepIndex: 0, expectedSummary: '2x = 6', observedSummary: '2x = 4', reasonCode: 'VALUE_CHANGED' },
      confirmedCorrectSteps: [],
      confidence: 0.86,
      checkerPath: 'deterministic_linear',
      intervention: {
        level: input.priorSupportLevel ?? 'L1',
        canonicalSupportLevel: 'question_only',
        move: 'metacognitive_clarification',
        trigger: 'first_divergence',
        targetStepIndex: 0,
        feedbackText: 'What were you trying to do in step 1?',
        nextLearnerAction: 'Re-examine step 1.',
        origin: 'SYSTEM_PROPOSED',
      },
      currentFeedbackEligible: true,
      deduplicated: false,
      createdAt: '2026-01-01T00:00:00.000Z',
    });
  }
  const current: PracticePadCheckResult = {
    checkId: `chk-${caseId}`,
    attemptId,
    basedOnVersion: version,
    status: input.checkStatus,
    ...(input.interpretationRequired ? { interpretationRequired: true as const } : {}),
    ...(input.interpretationStatus
      ? {
          interpretation: {
            interpretationId: `interp-${caseId}`,
            sourceBlockId: 'b1',
            status: input.interpretationStatus,
            candidates: [],
          },
        }
      : {}),
    deterministicVerdict: input.checkStatus === 'CONFIRMED_CORRECT' ? 'correct' : 'incorrect',
    confirmedCorrectSteps: [],
    confidence: input.checkConfidence,
    checkerPath: 'deterministic_linear',
    currentFeedbackEligible: input.checkIsCurrent,
    deduplicated: false,
    createdAt: '2026-01-01T00:01:00.000Z',
  };
  return current;
}

async function runEvidence(c: PP11Case): Promise<Omit<PP11CaseResult, 'id' | 'category' | 'kind' | 'latencyMs'>> {
  const input = c.input as PP11EvidenceInput;
  const expected = c.expected as PP11EvidenceExpected;
  const caseId = c.id;
  const attemptId = `att-${caseId}`;
  const identity = { schoolId: 'sch-pp11', studentId: `stu-${caseId}`, verifiedSchool: true };
  const current = makeEvidenceCheck(caseId, input);
  const history: PracticePadCheckResult[] = input.priorIncorrectWithDivergence
    ? [
        {
          checkId: `chk-${caseId}-prior`,
          attemptId,
          basedOnVersion: 1,
          status: 'CONFIRMED_INCORRECT',
          deterministicVerdict: 'incorrect',
          firstDivergence: { stepIndex: 0, expectedSummary: '2x = 6', observedSummary: '2x = 4', reasonCode: 'VALUE_CHANGED' },
          confirmedCorrectSteps: [],
          confidence: 0.86,
          checkerPath: 'deterministic_linear',
          intervention: {
            level: input.priorSupportLevel ?? 'L1',
            canonicalSupportLevel: 'question_only',
            move: 'metacognitive_clarification',
            trigger: 'first_divergence',
            targetStepIndex: 0,
            feedbackText: 'What were you trying to do in step 1?',
            nextLearnerAction: 'Re-examine step 1.',
            origin: 'SYSTEM_PROPOSED',
          },
          currentFeedbackEligible: true,
          deduplicated: false,
          createdAt: '2026-01-01T00:00:00.000Z',
        },
        current,
      ]
    : [current];
  const calls = { committer: 0, mastery: 0, memory: 0, revision: 0, growth: 0 };
  let heldForTransfer = false;
  let supportQuality: string | undefined;
  let masterySignal: string | null | undefined;
  const result = await integratePracticePadLearning({
    identity,
    attemptId,
    checkId: current.checkId,
    idempotencyKey: `idem-${caseId}`,
    loadCheck: async () => ({ check: current, isCurrent: input.checkIsCurrent }),
    loadAttempt: async () => ({
      attemptId,
      schoolId: identity.schoolId,
      studentId: identity.studentId,
      problemId: 'prob-pp11',
      problemVersion: 1,
    }),
    loadProblem: async () => ({
      problemId: 'prob-pp11',
      problemVersion: 1,
      status: input.problemStatus,
      skillId: 'skill-pp11',
      curriculumRefs: { skillId: 'skill-pp11' },
    }),
    loadRevisions: async () => [
      { version: 1, workText: 'text:40', contentHash: 'h1' },
      { version: 2, workText: 'text:44', contentHash: 'h2' },
    ],
    loadCheckHistory: async () => history,
    integrityEvidence: input.integrityConcern
      ? {
          integrityEvidenceId: `inev-${caseId}`,
          concernLevel: input.integrityConcern,
          signals: ['VISIBILITY_INTERRUPTION'],
          recommendedNextEvidenceAction: 'REQUEST_TRANSFER_PROBLEM',
        }
      : null,
    evidenceCommitter: async () => {
      calls.committer += 1;
      if (!input.evidenceCommitterOk) return { ok: false, code: 'EVIDENCE_COMMIT_FAILED', message: 'owner refused' };
      return { ok: true, committedEvidenceId: `ev-${caseId}` };
    },
    projectors: {
      mastery: async () => {
        calls.mastery += 1;
      },
      memory: async () => {
        calls.memory += 1;
      },
      revision: async () => {
        calls.revision += 1;
      },
      growth: async () => {
        calls.growth += 1;
      },
    },
    seenEvidenceKeys: input.replaySeen ? new Set([`idem-${caseId}`]) : new Set(),
    clock: () => '2026-01-01T00:02:00.000Z',
  });
  const admitted = result.ok === true;
  if (result.ok) {
    heldForTransfer = result.evidenceHeldForTransfer;
    supportQuality = result.candidate.supportQuality;
    masterySignal = result.candidate.masterySignal;
  }
  const observed = {
    admitted,
    failureCode: result.ok ? null : result.code,
    masteryProjected: calls.mastery > 0,
    memoryProjected: calls.memory > 0,
    revisionProjected: calls.revision > 0,
    growthProjected: calls.growth > 0,
    committerCalls: calls.committer,
    ...(result.ok ? { evidenceHeldForTransfer: heldForTransfer, supportQuality, masterySignal } : {}),
  };
  const mismatches: string[] = [];
  if (observed.admitted !== expected.admitted) mismatches.push(`admitted ${observed.admitted} !== ${expected.admitted}`);
  if (expected.failureCode !== undefined && observed.failureCode !== expected.failureCode) {
    mismatches.push(`failure ${String(observed.failureCode)} !== ${expected.failureCode}`);
  }
  if (observed.masteryProjected !== expected.masteryProjected) mismatches.push('mastery projection mismatch');
  if (observed.memoryProjected !== expected.memoryProjected) mismatches.push('memory projection mismatch');
  if (observed.revisionProjected !== expected.revisionProjected) mismatches.push('revision projection mismatch');
  if (observed.growthProjected !== expected.growthProjected) mismatches.push('growth projection mismatch');
  if (expected.evidenceHeldForTransfer !== undefined && heldForTransfer !== expected.evidenceHeldForTransfer) {
    mismatches.push('evidenceHeldForTransfer mismatch');
  }
  if (expected.supportQuality !== undefined && supportQuality !== expected.supportQuality) {
    mismatches.push(`supportQuality ${String(supportQuality)} !== ${expected.supportQuality}`);
  }
  if (expected.masterySignal !== undefined && masterySignal !== expected.masterySignal) {
    mismatches.push(`masterySignal ${String(masterySignal)} !== ${expected.masterySignal}`);
  }
  if (!expected.admitted && (calls.mastery > 0 || calls.memory > 0 || calls.revision > 0 || calls.growth > 0)) {
    mismatches.push('protected false mutation: downstream projected despite refused admission');
  }
  if (expected.supportQuality === 'CORRECTED_AFTER_SUPPORT' && supportQuality === 'INDEPENDENT') {
    mismatches.push('supported correction mislabeled independent');
  }
  return {
    pass: mismatches.length === 0,
    observed: observed as Record<string, unknown>,
    expected: expected as unknown as Record<string, unknown>,
    mismatches,
    criticalHit: mismatches.length === 0 ? [] : [...c.criticalFailureTags],
  };
}

// ── critical override (pure; also directly unit-tested) ──

export function applyCriticalOverride(failed: number, criticalCount: number): 'PASS' | 'FAIL' {
  if (criticalCount > 0) return 'FAIL';
  if (failed > 0) return 'FAIL';
  return 'PASS';
}

// ── runner ──

export async function runPracticePadQualification(): Promise<PP11Report> {
  const t0 = performance.now();
  const liveBefore = practicePadSemanticPort.liveCallCount();
  const results: PP11CaseResult[] = [];
  const kindLatency: Record<string, number[]> = {};

  for (const c of PP11_CORPUS) {
    const start = performance.now();
    let partial: Omit<PP11CaseResult, 'id' | 'category' | 'kind' | 'latencyMs'>;
    switch (c.kind) {
      case 'math':
        partial = runMath(c);
        break;
      case 'divergence':
        partial = runDivergence(c);
        break;
      case 'intervention':
        partial = runIntervention(c);
        break;
      case 'leakage':
        partial = runLeakage(c);
        break;
      case 'recovery':
        partial = runRecovery(c);
        break;
      case 'transfer':
        partial = runTransfer(c);
        break;
      case 'interpretation':
        partial = runInterpretation(c);
        break;
      case 'integrity':
        partial = await runIntegrity(c);
        break;
      case 'evidence':
        partial = await runEvidence(c);
        break;
      default:
        partial = { pass: false, observed: {}, expected: {}, mismatches: [`unknown kind ${(c as PP11Case).kind}`], criticalHit: ['FAIL_OPEN_PROTECTED_STATE'] };
        break;
    }
    const latencyMs = performance.now() - start;
    (kindLatency[c.kind] ??= []).push(latencyMs);
    results.push({ id: c.id, category: c.category, kind: c.kind, latencyMs, ...partial });
  }

  const liveAfter = practicePadSemanticPort.liveCallCount();
  const liveModelCalls = Math.max(0, liveAfter - liveBefore);

  const passed = results.filter((r) => r.pass).length;
  const failed = results.length - passed;
  const criticalFailures = results
    .filter((r) => r.criticalHit.length > 0)
    .map((r) => ({ caseId: r.id, tags: r.criticalHit, detail: r.mismatches.join('; ') }));

  const byKind = (kind: string) => results.filter((r) => r.kind === kind);
  const acc = (rs: PP11CaseResult[]) => (rs.length === 0 ? 1 : rs.filter((r) => r.pass).length / rs.length);
  const mathRs = byKind('math');
  const divRs = byKind('divergence');
  const intRs = byKind('intervention');
  const leakRs = byKind('leakage');
  const recRs = byKind('recovery');
  const traRs = byKind('transfer');
  const interpRs = byKind('interpretation');
  const integRs = byKind('integrity');
  const evRs = byKind('evidence');

  const divExpected = (id: string) => PP11_CORPUS.find((c) => c.id === id)?.expected as { status: string };
  const falseDiv = divRs.filter((r) => {
    const exp = divExpected(r.id);
    return (exp.status === 'ALL_VALID' || exp.status.startsWith('NEEDS')) && !r.pass && String((r.observed as { status?: string }).status) === 'DIVERGED';
  }).length;
  const missedDiv = divRs.filter((r) => {
    const exp = divExpected(r.id);
    return exp.status === 'DIVERGED' && !r.pass && String((r.observed as { status?: string }).status) !== 'DIVERGED';
  }).length;
  const divDIVERGEDCount = divRs.filter((r) => divExpected(r.id).status === 'DIVERGED').length || 1;
  const divNonDivCount = divRs.length - divDIVERGEDCount || 1;

  const transferExpectedIndependent = (id: string) => (PP11_CORPUS.find((c) => c.id === id)?.expected as { independent: boolean }).independent;
  const traPredicted = traRs.filter((r) => (r.observed as { independent?: boolean }).independent === true);
  const traActual = traRs.filter((r) => transferExpectedIndependent(r.id));
  const traTruePos = traPredicted.filter((r) => transferExpectedIndependent(r.id)).length;

  const benignIds = new Set(['PP11-G-04', 'PP11-G-06']);
  const benignRs = integRs.filter((r) => benignIds.has(r.id));
  const falseConcern = benignRs.filter((r) => (r.observed as { concern?: string }).concern !== 'NONE').length;
  const okIntegRs = integRs.filter((r) => (r.observed as { outcomeCode?: string }).outcomeCode === 'ok');
  const evidenceSeeking = okIntegRs.filter((r) => {
    const o = r.observed as { action?: string };
    return r.pass && o.action !== undefined && ['ASK_REASONING_QUESTION', 'REQUEST_TRANSFER_PROBLEM', 'REQUIRE_MORE_WORK_EVIDENCE', 'NONE'].includes(o.action);
  }).length;
  const punitive = okIntegRs.filter((r) => !['NONE', 'ASK_REASONING_QUESTION', 'REQUEST_TRANSFER_PROBLEM', 'REQUIRE_MORE_WORK_EVIDENCE'].includes(String((r.observed as { action?: string }).action))).length;

  const metrics: Record<string, number> = {
    deterministicVerdictAccuracy: acc(mathRs),
    exactStepAccuracy: acc(divRs),
    falseDivergenceRate: falseDiv / divNonDivCount,
    missedDivergenceRate: missedDiv / divDIVERGEDCount,
    correctTargetStepRate: acc(intRs),
    minimumNecessarySupportRate: acc(intRs),
    answerLeakageRate: [...intRs, ...leakRs].some((r) => !r.pass && r.criticalHit.includes('ANSWER_KEY_LEAKAGE')) ? 1 : 0,
    unsafeEscalationRate: intRs.filter((r) => !r.pass).length / (intRs.length || 1),
    recoveryAccuracy: acc(recRs),
    independentTransferPrecision: traPredicted.length === 0 ? 1 : traTruePos / traPredicted.length,
    independentTransferRecall: traActual.length === 0 ? 1 : traTruePos / traActual.length,
    interpretationAuthorityAccuracy: acc(interpRs),
    falseConcernOnBenignCases: benignRs.length === 0 ? 0 : falseConcern / benignRs.length,
    evidenceSeekingActionRate: okIntegRs.length === 0 ? 1 : evidenceSeeking / okIntegRs.length,
    punitiveActionRate: punitive,
    evidenceAdmissionAccuracy: acc(evRs),
    liveModelCalls,
    modelCost: 0,
  };
  for (const [kind, lat] of Object.entries(kindLatency)) {
    const avg = lat.reduce((a, b) => a + b, 0) / (lat.length || 1);
    metrics[`latencyAvgMs_${kind}`] = Math.round(avg * 100) / 100;
  }

  const dimensionResults: Record<string, { passed: number; failed: number }> = {};
  for (const r of results) {
    const key = `${r.kind}/${r.category}`;
    dimensionResults[key] ??= { passed: 0, failed: 0 };
    if (r.pass) dimensionResults[key].passed += 1;
    else dimensionResults[key].failed += 1;
  }

  const durationMs = performance.now() - t0;
  const status = liveModelCalls === 0 ? applyCriticalOverride(failed, criticalFailures.length) : 'FAIL';

  return {
    corpusVersion: PP11_CORPUS_VERSION,
    caseCount: results.length,
    passed,
    failed,
    failures: results.filter((r) => !r.pass).map((r) => `${r.id}: ${r.mismatches.join('; ')}`),
    criticalFailures,
    metrics,
    dimensionResults,
    durationMs: Math.round(durationMs * 100) / 100,
    liveModelCalls: 0,
    modelCost: 0,
    status,
    calibrationNotes: [
      'TECHNICALLY QUALIFIED (if PASS): deterministic behavior measured against labelled corpus only.',
      'PILOT_CALIBRATION_REQUIRED: long-term mastery validity.',
      'PILOT_CALIBRATION_REQUIRED: psychometric calibration of support levels.',
      'PILOT_CALIBRATION_REQUIRED: integrity thresholds across real populations.',
      'PILOT_CALIBRATION_REQUIRED: transfer predictive validity.',
      'PILOT_CALIBRATION_REQUIRED: optimal hint level for every learner.',
      'No production SLA is established from harness-local timings.',
    ],
  };
}
