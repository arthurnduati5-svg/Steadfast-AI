// ─────────────────────────────────────────────────────────────
// Steadfast AI — Practice Pad PP-05 (A/2): deterministic reasoning
// engine proofs. Pure unit proofs over the derived
// reasoning graph: no DB, no model calls, no learning-state surface.
// ─────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest';
import {
  analyzeReasoningGraph,
  extractAnchorEquation,
  REASONING_MAX_STEPS,
} from '../services/practicePadRuntime/practicePadReasoningGraph';
import { snapshotFromWorkText } from '../services/practicePadRuntime/practicePadDocumentContracts';

const ATTEMPT = 'att-pp05-engine';

function analyze(workText: string, problemPrompt: string) {
  return analyzeReasoningGraph({
    attemptId: ATTEMPT,
    basedOnVersion: 1,
    snapshot: snapshotFromWorkText(workText),
    problemPrompt,
  });
}

const LINEAR_PROMPT = 'Solve for x: 2(x + 3) = 14';

describe('Practice Pad PP-05 — deterministic reasoning engine', () => {
  it('1. a valid alternative algebraic method has no divergence', () => {
    const analysis = analyze('2(x + 3) = 14\nx + 3 = 7\nx = 4', LINEAR_PROMPT);
    expect(analysis.anchored).toBe(true);
    expect(analysis.status).toBe('ALL_VALID');
    expect(analysis.firstDivergence).toBeUndefined();
    expect(analysis.confirmedPrefixCount).toBe(3);
  });

  it('2. the distribution example diverges first at step 1', () => {
    const analysis = analyze('2(x + 3) = 14\n2x + 3 = 14\n2x = 11\nx = 5.5', LINEAR_PROMPT);
    expect(analysis.anchored).toBe(true);
    expect(analysis.status).toBe('DIVERGED');
    expect(analysis.firstDivergence?.stepIndex).toBe(1);
    expect(analysis.firstDivergence?.reasonCode).toBe('SOLUTION_SET_CHANGED');
    expect(analysis.confirmedPrefixCount).toBe(1);
    // Structural reason codes only — never semantic misconception labels.
    expect(JSON.stringify(analysis)).not.toMatch(/distributive|misconception|does not understand|confuses/i);
  });

  it('3. several valid transitions then one invalid transition locates the exact later step', () => {
    const analysis = analyze(
      '2(x + 3) = 14\n2x + 6 = 14\n2x = 8\nx = 4\nx = 5',
      LINEAR_PROMPT,
    );
    expect(analysis.status).toBe('DIVERGED');
    expect(analysis.firstDivergence?.stepIndex).toBe(4);
    expect(analysis.confirmedPrefixCount).toBe(4);
  });

  it('4. an arithmetic reasoning sequence detects the first value-changing transition', () => {
    const analysis = analyze('3 + 4 = 7\n3 + 4 = 8', 'Evaluate: 3 + 4 = 7');
    expect(analysis.anchored).toBe(true);
    expect(analysis.status).toBe('DIVERGED');
    expect(analysis.firstDivergence?.stepIndex).toBe(1);
    expect(analysis.firstDivergence?.reasonCode).toBe('VALUE_CHANGED');
  });

  it('5. equivalent fraction transformations stay valid', () => {
    const analysis = analyze('2/4 = 1/2\n1/2 = 0.5', 'Simplify: 2/4 = 1/2');
    expect(analysis.anchored).toBe(true);
    expect(analysis.status).toBe('ALL_VALID');
    expect(analysis.firstDivergence).toBeUndefined();
    expect(analysis.confirmedPrefixCount).toBe(2);
  });

  it('6. an unsupported earlier transition blocks any later first-divergence claim', () => {
    const analysis = analyze('2(x + 3) = 14\nmove terms to isolate x\n2x = 11', LINEAR_PROMPT);
    expect(analysis.status).toBe('NEEDS_SEMANTIC_ANALYSIS');
    expect(analysis.firstDivergence).toBeUndefined();
    expect(analysis.confirmedPrefixCount).toBe(1);
  });

  it('7. a malformed step needs clarification, never misconception blame', () => {
    const analysis = analyze('2(x + 3) = 14\n2x + 3 = 14 +', LINEAR_PROMPT);
    expect(analysis.status).toBe('NEEDS_CLARIFICATION');
    expect(analysis.firstDivergence).toBeUndefined();
    expect(analysis.confirmedPrefixCount).toBe(1);
  });

  it('8. unanchored work never fabricates a causal divergence', () => {
    const analysis = analyze('x = 1\nx = 2', 'Prove the quadratic formula');
    expect(analysis.anchored).toBe(false);
    expect(analysis.status).toBe('NEEDS_SEMANTIC_ANALYSIS');
    expect(analysis.firstDivergence).toBeUndefined();
    expect(analysis.confirmedPrefixCount).toBe(0);
  });

  it('9. bounds terminate safely without divergence claims', () => {
    const manySteps = Array.from({ length: REASONING_MAX_STEPS + 1 }, (_, i) => `x = ${i}`).join('\n');
    const tooMany = analyze(manySteps, 'Solve for x: x = 0');
    expect(tooMany.status).toBe('NEEDS_SEMANTIC_ANALYSIS');
    expect(tooMany.firstDivergence).toBeUndefined();

    const oversize = analyze(`2(x + 3) = 14\nx = ${'1'.repeat(300)}`, LINEAR_PROMPT);
    expect(oversize.status).toBe('NEEDS_CLARIFICATION');
    expect(oversize.firstDivergence).toBeUndefined();
  });

  it('anchor extraction refuses ambiguous or unparseable prompts', () => {
    expect(extractAnchorEquation('Solve: x = 1 and y = 2')).toBeNull();
    expect(extractAnchorEquation('Prove the quadratic formula')).toBeNull();
    expect(extractAnchorEquation('Solve for x: 2(x + 3) = 14')).toBe('2(x + 3) = 14');
  });
});
