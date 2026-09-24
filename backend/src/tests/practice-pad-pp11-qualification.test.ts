// Steadfast AI — Practice Pad PP-11: qualification harness proof.
// Focused ONLY on the new PP-11 harness. No PP-01…PP-10 suites run here.
// No live model calls. No provider. No DB. No network.
import { describe, expect, it } from 'vitest';
import {
  PP11_CORPUS,
  PP11_CORPUS_VERSION,
} from '../services/practicePadRuntime/practicePadQualificationCorpusV1';
import {
  applyCriticalOverride,
  runPracticePadQualification,
} from '../services/practicePadRuntime/practicePadQualificationHarness';
import { validateInterventionFeedback } from '../services/practicePadRuntime/practicePadInterventionFeedback';
import { evaluateTransferSuccess } from '../services/practicePadRuntime/practicePadSupportProvenance';
import { practicePadSemanticPort } from '../services/practicePadRuntime/practicePadSemanticPort';

describe('Practice Pad PP-11 qualification', () => {
  it('represents every required dimension with stable unique IDs in a bounded corpus', () => {
    const ids = PP11_CORPUS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => /^PP11-[A-Z]+-\d+$/.test(id))).toBe(true);
    expect(PP11_CORPUS.length).toBeGreaterThanOrEqual(60);
    expect(PP11_CORPUS.length).toBeLessThanOrEqual(80);

    const count = (kind: string) => PP11_CORPUS.filter((c) => c.kind === kind).length;
    expect(count('math')).toBeGreaterThanOrEqual(10); // A + E-math
    expect(PP11_CORPUS.filter((c) => c.category === 'B').length).toBeGreaterThanOrEqual(8);
    for (const n of ['PP11-D-01', 'PP11-D-02', 'PP11-D-03', 'PP11-D-04', 'PP11-D-05', 'PP11-D-06', 'PP11-D-07', 'PP11-D-08']) {
      expect(ids).toContain(n); // 8 first-divergence cases
    }
    for (const n of ['PP11-M-13', 'PP11-M-14', 'PP11-D-06', 'PP11-D-07', 'PP11-D-08']) {
      expect(ids).toContain(n); // 5 ambiguity / malformed / unsupported cases
    }
    expect(count('intervention') + count('leakage')).toBeGreaterThanOrEqual(6);
    expect(count('recovery')).toBeGreaterThanOrEqual(6);
    expect(count('transfer')).toBeGreaterThanOrEqual(5);
    expect(count('interpretation')).toBeGreaterThanOrEqual(4);
    expect(count('integrity')).toBeGreaterThanOrEqual(6);
    expect(count('evidence')).toBeGreaterThanOrEqual(6);
    // every case carries observable expectations and critical tags
    for (const c of PP11_CORPUS) {
      expect(c.criticalFailureTags.length).toBeGreaterThan(0);
      expect(Object.keys(c.expected as object).length).toBeGreaterThan(0);
    }
  });

  it('critical failures override any aggregate pass', () => {
    expect(applyCriticalOverride(0, 0)).toBe('PASS');
    expect(applyCriticalOverride(0, 1)).toBe('FAIL');
    expect(applyCriticalOverride(3, 0)).toBe('FAIL');
    expect(applyCriticalOverride(2, 2)).toBe('FAIL');
  });

  it('qualifies the accepted runtime against the full corpus with zero model calls', async () => {
    const liveBefore = practicePadSemanticPort.liveCallCount();
    const report = await runPracticePadQualification();
    const liveAfter = practicePadSemanticPort.liveCallCount();

    expect(report.corpusVersion).toBe(PP11_CORPUS_VERSION);
    expect(report.caseCount).toBe(PP11_CORPUS.length);
    expect(report.liveModelCalls).toBe(0);
    expect(liveAfter - liveBefore).toBe(0);
    expect(report.modelCost).toBe(0);
    expect(typeof report.durationMs).toBe('number');
    expect(Object.keys(report.dimensionResults).length).toBeGreaterThan(0);

    // metric contract: every required metric computed
    for (const key of [
      'deterministicVerdictAccuracy',
      'exactStepAccuracy',
      'falseDivergenceRate',
      'missedDivergenceRate',
      'correctTargetStepRate',
      'minimumNecessarySupportRate',
      'answerLeakageRate',
      'unsafeEscalationRate',
      'recoveryAccuracy',
      'independentTransferPrecision',
      'independentTransferRecall',
      'interpretationAuthorityAccuracy',
      'falseConcernOnBenignCases',
      'evidenceSeekingActionRate',
      'punitiveActionRate',
      'evidenceAdmissionAccuracy',
    ]) {
      expect(typeof report.metrics[key]).toBe('number');
    }

    // frozen thresholds on deterministic corpus
    expect(report.metrics.deterministicVerdictAccuracy).toBe(1);
    expect(report.metrics.exactStepAccuracy).toBe(1);
    expect(report.metrics.falseDivergenceRate).toBe(0);
    expect(report.metrics.missedDivergenceRate).toBe(0);
    expect(report.metrics.answerLeakageRate).toBe(0);
    expect(report.metrics.independentTransferPrecision).toBe(1);
    expect(report.metrics.punitiveActionRate).toBe(0);
    expect(report.metrics.falseConcernOnBenignCases).toBe(0);
    expect(report.criticalFailures).toEqual([]);
    expect(report.failures).toEqual([]);
    expect(report.status).toBe('PASS');

    // calibration honesty is explicit
    expect(report.calibrationNotes.some((n) => n.includes('PILOT_CALIBRATION_REQUIRED'))).toBe(true);
  }, 60000);

  it('detects answer-key leakage in feedback the policy did not render', () => {
    const secret = 'x = 7';
    const validation = validateInterventionFeedback({
      feedbackText: 'Just write x=7 and move on.',
      nextLearnerAction: 'Show your steps.',
      level: 'L1',
      decision: {
        level: 'L1',
        move: 'metacognitive_clarification',
        trigger: 'first_divergence',
        reasoningStatus: 'CONFIRMED_INCORRECT',
        supportReason: 'structural candidate only',
        learnerActionRequired: 'Show your steps.',
        mayRevealFinalAnswer: false,
        semanticLanguageRequired: false,
      },
      secrets: { expectedAnswer: secret },
    });
    expect(validation.valid).toBe(false);
    expect(validation.reasons.join(' ').toLowerCase()).toContain('expected answer');
  });

  it('detects false independent transfer on same-problem correction', () => {
    const verdict = evaluateTransferSuccess({
      originalProblemId: 'prob-same',
      transferProblemId: 'prob-same',
      sameGovernedSkill: true,
      transferSolvedDeterministically: true,
      supportDeliveredOnTransfer: false,
    });
    expect(verdict.independent).toBe(false);
    expect(verdict.reason).toBe('same_problem_correction_not_transfer');
  });
});
