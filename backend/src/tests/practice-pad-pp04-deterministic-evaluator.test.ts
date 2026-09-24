// ─────────────────────────────────────────────────────────────
// Steadfast AI — Practice Pad PP-04 (A/2): deterministic evaluator proof.
//
// Focused proof for the bounded mathematical evaluation engine:
// numeric, rational, arithmetic, algebraic, linear equations, units,
// acceptable forms, resource bounds, and absence of dynamic execution.
// No DB. No migrations. No model calls.
// ─────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  evaluateMathDeterministically,
  MATH_MAX_EXPRESSION_LENGTH,
  MATH_MAX_PAREN_DEPTH,
} from '../services/practicePadRuntime/practicePadMathEvaluator';
import { checkDeterministically } from '../services/practicePadRuntime/practicePadDeterministicChecker';

describe('Practice Pad PP-04 — deterministic math evaluator', () => {
  it('numeric evaluation is reliable and bounded', () => {
    expect(evaluateMathDeterministically({ candidate: '42', expected: '42' }).status).toBe('CORRECT');
    expect(evaluateMathDeterministically({ candidate: '  -3 ', expected: '-3' }).status).toBe('CORRECT');
    expect(evaluateMathDeterministically({ candidate: '.5', expected: '0.5' }).status).toBe('CORRECT');
    const disproven = evaluateMathDeterministically({ candidate: '41.9', expected: '42' });
    expect(disproven.status).toBe('INCORRECT');
    expect(disproven.evaluator).toBe('NUMERIC');
    // Server numeric typing also decides plain integers.
    const typed = evaluateMathDeterministically({
      candidate: '42',
      expected: '42',
      serverEvaluationType: 'deterministic_numeric',
    });
    expect(typed.status).toBe('CORRECT');
  });

  it('rational equivalence is exact; denominator zero is invalid', () => {
    expect(evaluateMathDeterministically({ candidate: '2/4', expected: '1/2' }).status).toBe('CORRECT');
    expect(evaluateMathDeterministically({ candidate: '2/-3', expected: '-2/3' }).status).toBe('CORRECT');
    expect(evaluateMathDeterministically({ candidate: '1/3', expected: '1/2' }).status).toBe('INCORRECT');
    expect(
      evaluateMathDeterministically({ candidate: '0.5', expected: '3/6' }).status,
    ).toBe('CORRECT');
    const zeroDen = evaluateMathDeterministically({ candidate: '1/0', expected: '1/2' });
    expect(zeroDen.status).toBe('INVALID');
  });

  it('arithmetic parsing obeys precedence; malformed input cannot pass', () => {
    expect(evaluateMathDeterministically({ candidate: '2 + 3 * 4', expected: '14' }).status).toBe('CORRECT');
    expect(evaluateMathDeterministically({ candidate: '(2 + 3) * 4', expected: '20' }).status).toBe('CORRECT');
    expect(evaluateMathDeterministically({ candidate: '10 / 2', expected: '5' }).status).toBe('CORRECT');
    expect(evaluateMathDeterministically({ candidate: '2 + 3 * 4', expected: '20' }).status).toBe('INCORRECT');
    const malformed = evaluateMathDeterministically({ candidate: '2 + * 3', expected: '5' });
    expect(['INVALID', 'UNSUPPORTED']).toContain(malformed.status);
    // Extreme nesting and extreme length terminate as UNSUPPORTED, never a crash.
    const deep = evaluateMathDeterministically({
      candidate: `${'('.repeat(MATH_MAX_PAREN_DEPTH + 5)}1${')'.repeat(MATH_MAX_PAREN_DEPTH + 5)}`,
      expected: '1',
    });
    expect(deep.status).toBe('UNSUPPORTED');
    const long = evaluateMathDeterministically({
      candidate: `${'1+'.repeat(Math.ceil(MATH_MAX_EXPRESSION_LENGTH / 2))}1`,
      expected: '1',
    });
    expect(long.status).toBe('UNSUPPORTED');
  });

  it('supported algebraic alternative forms are recognized; non-equivalence is disproved', () => {
    expect(evaluateMathDeterministically({ candidate: '2(x + 3)', expected: '2x + 6' }).status).toBe('CORRECT');
    expect(evaluateMathDeterministically({ candidate: 'x + x', expected: '2x' }).status).toBe('CORRECT');
    expect(evaluateMathDeterministically({ candidate: '3(x - 2) + 6', expected: '3x' }).status).toBe('CORRECT');
    expect(evaluateMathDeterministically({ candidate: '2x + 3', expected: '2x + 4' }).status).toBe('INCORRECT');
    // Syntax outside the supported grammar is UNSUPPORTED, never incorrect.
    const trig = evaluateMathDeterministically({ candidate: 'sin(x)', expected: 'sin(x)' });
    expect(trig.status).toBe('UNSUPPORTED');
  });

  it('linear-equation solution equivalence is correct, including the distribution-error case', () => {
    expect(evaluateMathDeterministically({ candidate: '2x + 6 = 14', expected: 'x + 3 = 7' }).status).toBe('CORRECT');
    expect(evaluateMathDeterministically({ candidate: '2x + 6 = 14', expected: 'x = 4' }).status).toBe('CORRECT');
    // Distribution error changes the solution set: deterministically incorrect.
    expect(evaluateMathDeterministically({ candidate: '2x + 3 = 14', expected: '2(x + 3) = 14' }).status).toBe('INCORRECT');
    // Identity vs identity passes; identity vs single-solution fails.
    expect(evaluateMathDeterministically({ candidate: 'x + 1 = x + 1', expected: '2x + 2 = 2(x + 1)' }).status).toBe('CORRECT');
    expect(evaluateMathDeterministically({ candidate: 'x + 1 = x + 2', expected: '2x + 1 = 2x + 3' }).status).toBe('CORRECT');
    expect(evaluateMathDeterministically({ candidate: 'x + 1 = x + 1', expected: 'x = 4' }).status).toBe('INCORRECT');
  });

  it('unit-bearing answers are never misgraded as plain numbers', () => {
    const units = evaluateMathDeterministically({
      candidate: '5 m',
      expected: '5',
      serverEvaluationType: 'deterministic_numeric',
    });
    expect(units.status).toBe('UNSUPPORTED');
    const untyped = evaluateMathDeterministically({ candidate: '5 m', expected: '5' });
    expect(untyped.status).toBe('UNSUPPORTED');
    expect(untyped.status).not.toBe('INCORRECT');
  });

  it('server-owned acceptable forms pass without leaking the key', () => {
    const viaForm = evaluateMathDeterministically({
      candidate: '0.5',
      expected: '1/2',
      serverEvaluationType: 'deterministic_numeric',
      acceptableAnswerForms: ['2/4', '0.5'],
    });
    expect(viaForm.status).toBe('CORRECT');
    expect(viaForm.safeSummary || '').not.toContain('2/4');
    expect(viaForm.reasonCode || '').not.toContain('2/4');
  });

  it('checker maps engine verdicts onto the canonical deterministic contract', () => {
    const correct = checkDeterministically({ workText: '42', expectedAnswer: '42' });
    expect(correct.verdict).toBe('correct');
    const incorrect = checkDeterministically({ workText: '41.9', expectedAnswer: '42' });
    expect(incorrect.verdict).toBe('incorrect');
    const unsupported = checkDeterministically({ workText: '5 m', expectedAnswer: '5' });
    expect(unsupported.verdict).toBe('unknown');
    expect(unsupported.checkerPath).toBe('deterministic_unsupported');
    const invalid = checkDeterministically({ workText: '1/0', expectedAnswer: '1/2' });
    expect(invalid.verdict).toBe('unknown');
    expect(invalid.checkerPath).toBe('deterministic_invalid');
  });

  it('no dynamic JS execution in deterministic math evaluation', () => {
    const checkerSrc = readFileSync(
      join(process.cwd(), 'backend/src/services/practicePadRuntime/practicePadDeterministicChecker.ts'),
      'utf8',
    );
    const engineSrc = readFileSync(
      join(process.cwd(), 'backend/src/services/practicePadRuntime/practicePadMathEvaluator.ts'),
      'utf8',
    );
    // Strip comments: policy prose may name the forbidden paths, but no
    // executable code path may use them.
    const stripComments = (src: string): string =>
      src
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/(^|\n)\s*\/\/[^\n]*/g, '$1');
    for (const src of [stripComments(checkerSrc), stripComments(engineSrc)]) {
      expect(src).not.toContain('new Function(');
      expect(src).not.toContain('Function(');
      expect(src).not.toMatch(/(^|[^a-zA-Z])eval\(/);
    }
  });
});
