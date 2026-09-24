// ─────────────────────────────────────────────────────────────
// Steadfast AI — Practice Pad PP-06 (A): intervention policy proofs.
// Pure deterministic proofs: no DB, no model calls, no mutations.
// ─────────────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest';
import { decidePracticeIntervention, maxLevelIndexForTrustedSupport } from '../services/practicePadRuntime/practicePadInterventionPolicy';
import { renderInterventionFeedback } from '../services/practicePadRuntime/practicePadInterventionFeedback';

describe('Practice Pad PP-06 (A) — intervention policy', () => {
  it('1. confirmed correct work receives no hint (L0 acknowledge)', () => {
    const d = decidePracticeIntervention({ checkStatus: 'CONFIRMED_CORRECT' });
    expect(d.level).toBe('L0');
    expect(d.move).toBe('acknowledge_and_extend');
    expect(d.mayRevealFinalAnswer).toBe(false);
    const r = renderInterventionFeedback(d);
    expect(r.feedbackText).not.toMatch(/hint|try this|answer is/i);
    expect(r.nextLearnerAction.length).toBeGreaterThan(0);
  });

  it('2. first divergence receives the weakest useful help (L1)', () => {
    const d = decidePracticeIntervention({
      checkStatus: 'CONFIRMED_INCORRECT',
      firstDivergenceStepIndex: 1,
      reasonCode: 'SOLUTION_SET_CHANGED',
    });
    expect(d.level).toBe('L1');
    expect(d.trigger).toBe('first_divergence');
    expect(d.targetStepIndex).toBe(1);
  });

  it('3. intervention targets first divergence, not later wrong work', () => {
    const d = decidePracticeIntervention({
      checkStatus: 'CONFIRMED_INCORRECT',
      firstDivergenceStepIndex: 1,
      reasonCode: 'VALUE_CHANGED',
    });
    const r = renderInterventionFeedback(d);
    expect(d.targetStepIndex).toBe(1);
    expect(r.feedbackText).toMatch(/step 2/i);
  });

  it('4. clarification produces L1 metacognitive request', () => {
    const d = decidePracticeIntervention({ checkStatus: 'NEEDS_CLARIFICATION' });
    expect(d.level).toBe('L1');
    expect(d.move).toBe('metacognitive_clarification');
    expect(d.learnerActionRequired).toMatch(/rewrite|explain/i);
  });

  it('5. unsupported reasoning with semantic AI disabled returns truthful safe fallback', () => {
    const d = decidePracticeIntervention({ checkStatus: 'NEEDS_SEMANTIC_ANALYSIS' });
    expect(d.level).toBe('L1');
    expect(d.semanticLanguageRequired).toBe(true);
    expect(d.learnerActionRequired).toMatch(/show or explain/i);
    expect(JSON.stringify(d)).not.toMatch(/misconception|does not understand/i);
  });

  it('6. escalation never jumps directly to L5 without trusted support history', () => {
    const fresh = decidePracticeIntervention({
      checkStatus: 'CONFIRMED_INCORRECT',
      firstDivergenceStepIndex: 2,
      reasonCode: 'INVALID_TRANSFORMATION',
      trustedSupportCount: 0,
    });
    expect(fresh.level).toBe('L1');
    expect(maxLevelIndexForTrustedSupport(0)).toBe(1);
    expect(maxLevelIndexForTrustedSupport(4)).toBe(5);
    // Raw text is never a count: undefined history stays capped at L1.
    const noHistory = decidePracticeIntervention({
      checkStatus: 'CONFIRMED_INCORRECT',
      firstDivergenceStepIndex: 2,
    });
    expect(noHistory.level).toBe('L1');
  });

  it('7. structural reason code does not become a canonical misconception', () => {
    const d = decidePracticeIntervention({
      checkStatus: 'CONFIRMED_INCORRECT',
      firstDivergenceStepIndex: 1,
      reasonCode: 'ALGEBRAIC_EQUIVALENCE_BROKEN',
    });
    const blob = JSON.stringify(d) + renderInterventionFeedback(d).feedbackText;
    expect(blob).not.toMatch(/distributive|misconception|does not understand|inverse-operations/i);
    expect(d.supportReason).toMatch(/ALGEBRAIC_EQUIVALENCE_BROKEN/);
  });

  it('8. output always requires learner action', () => {
    const inputs = [
      { checkStatus: 'CONFIRMED_CORRECT' as const },
      { checkStatus: 'CONFIRMED_INCORRECT' as const, firstDivergenceStepIndex: 0 },
      { checkStatus: 'NEEDS_CLARIFICATION' as const },
      { checkStatus: 'NEEDS_SEMANTIC_ANALYSIS' as const },
      { checkStatus: 'FAILED_CLOSED' as const },
    ];
    for (const input of inputs) {
      const d = decidePracticeIntervention(input);
      const r = renderInterventionFeedback(d);
      expect(d.learnerActionRequired.trim().length).toBeGreaterThan(0);
      expect(r.nextLearnerAction.trim().length).toBeGreaterThan(0);
      expect(r.feedbackText.trim().length).toBeGreaterThan(0);
    }
  });
});
