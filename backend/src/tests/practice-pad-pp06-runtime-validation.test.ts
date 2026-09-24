// ─────────────────────────────────────────────────────────────
// Steadfast AI — Practice Pad PP-06 (B): runtime/validation proofs.
// Pure proofs: no DB, no model calls, no learning-state mutation.
// ─────────────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest';
import {
  proposePracticeIntervention,
  validateInterventionFeedback,
  safeFallbackProposal,
  TRUTHFUL_FALLBACK_TEXT,
} from '../services/practicePadRuntime/practicePadInterventionFeedback';
import { decidePracticeIntervention } from '../services/practicePadRuntime/practicePadInterventionPolicy';
import { practicePadSemanticPort } from '../services/practicePadRuntime/practicePadSemanticPort';

const SECRETS = {
  expectedAnswer: 'x = 4',
  acceptableAnswerForms: ['x=4', '4'],
  evaluationPlan: 'deterministic_linear_solution_set',
};

describe('Practice Pad PP-06 (B) — runtime and validation', () => {
  it('1. PP-05 firstDivergence drives targetStepIndex', () => {
    const p = proposePracticeIntervention(
      { checkStatus: 'CONFIRMED_INCORRECT', firstDivergenceStepIndex: 1, reasonCode: 'SOLUTION_SET_CHANGED' },
      SECRETS,
    );
    expect(p.targetStepIndex).toBe(1);
    expect(p.decision.targetStepIndex).toBe(1);
    expect(p.validated).toBe(true);
  });

  it('2. confirmed prefix is respected, not retaught', () => {
    const p = proposePracticeIntervention(
      { checkStatus: 'CONFIRMED_INCORRECT', firstDivergenceStepIndex: 1, confirmedCorrectStepCount: 1 },
      SECRETS,
    );
    // Targets the divergence (step 2), never the confirmed prefix (step 1).
    expect(p.targetStepIndex).toBe(1);
    expect(p.feedbackText).toMatch(/step 2/i);
    expect(p.feedbackText).not.toMatch(/step 1[^0-9]/i);
  });

  it('3. protected expected answer never appears in feedback', () => {
    const p = proposePracticeIntervention(
      { checkStatus: 'CONFIRMED_INCORRECT', firstDivergenceStepIndex: 0 },
      SECRETS,
    );
    const norm = p.feedbackText.toLowerCase().replace(/\s+/g, '');
    expect(norm).not.toContain('x=4');
    expect(p.feedbackText).not.toMatch(/answer is/i);
  });

  it('4. acceptableAnswerForms and evaluation plan never appear', () => {
    const p = proposePracticeIntervention(
      { checkStatus: 'CONFIRMED_INCORRECT', firstDivergenceStepIndex: 0 },
      SECRETS,
    );
    expect(p.feedbackText).not.toContain('deterministic_linear_solution_set');
    const v = validateInterventionFeedback({
      feedbackText: `The solution is ${SECRETS.expectedAnswer} per ${SECRETS.evaluationPlan}`,
      nextLearnerAction: 'Copy it.',
      level: 'L1',
      decision: decidePracticeIntervention({ checkStatus: 'CONFIRMED_INCORRECT', firstDivergenceStepIndex: 0 }),
      secrets: SECRETS,
    });
    expect(v.valid).toBe(false);
  });

  it('5. final-answer validator blocks leaking feedback', () => {
    const v = validateInterventionFeedback({
      feedbackText: 'The correct answer is x = 4, copy this answer.',
      nextLearnerAction: 'Copy it.',
      level: 'L1',
      decision: decidePracticeIntervention({ checkStatus: 'CONFIRMED_INCORRECT', firstDivergenceStepIndex: 0 }),
      secrets: SECRETS,
    });
    expect(v.valid).toBe(false);
    expect(v.reasons.join(' ')).toMatch(/blocked|exposes/i);
  });

  it('6. blocked feedback degrades to deterministic safe fallback', () => {
    const d = decidePracticeIntervention({ checkStatus: 'CONFIRMED_INCORRECT', firstDivergenceStepIndex: 0 });
    const f = safeFallbackProposal(d);
    expect(f.fallbackUsed).toBe(true);
    expect(f.feedbackText).toBe(TRUTHFUL_FALLBACK_TEXT);
    expect(f.decision.mayRevealFinalAnswer).toBe(false);
    expect(f.nextLearnerAction.trim().length).toBeGreaterThan(0);
    // The rejected candidate is never exposed through the fallback.
    expect(f.feedbackText).not.toContain('x = 4');
  });

  it('7. check/intervention creates zero mastery/memory/revision mutation', () => {
    const input = { checkStatus: 'CONFIRMED_INCORRECT' as const, firstDivergenceStepIndex: 1 };
    const a = proposePracticeIntervention(input, SECRETS);
    const b = proposePracticeIntervention(input, SECRETS);
    expect(a).toEqual(b); // pure: no hidden state, no writes
    expect(JSON.stringify(a)).not.toMatch(/mastery|memory|revision|evidenceStrength/i);
  });

  it('8. semantic port liveCallCount = 0', () => {
    expect(practicePadSemanticPort.isAvailable()).toBe(false);
    expect(practicePadSemanticPort.liveCallCount()).toBe(0);
    const p = proposePracticeIntervention(
      { checkStatus: 'NEEDS_SEMANTIC_ANALYSIS' },
      SECRETS,
    );
    expect(p.liveModelCalls).toBe(0);
    expect(practicePadSemanticPort.liveCallCount()).toBe(0);
  });
});
