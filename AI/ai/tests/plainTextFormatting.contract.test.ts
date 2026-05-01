import { describe, expect, it } from 'vitest';
import { applyLanguageOutputRules } from '../flows/emotional-ai-copilot.teaching';

describe('Plain text output formatting contract', () => {
  it('strips markdown and latex tokens from student-facing output', () => {
    const input = [
      '### Fraction Lesson',
      '**Given** `x = 4`, solve:',
      '- \\frac{1}{2}x + \\sqrt{9}',
    ].join('\n');

    const output = applyLanguageOutputRules(input, 'english');

    expect(output).not.toMatch(/[#$*`]/);
    expect(output).not.toContain('\\frac');
    expect(output).not.toContain('\\sqrt');
    expect(output).not.toContain('{');
    expect(output).not.toContain('}');
    expect(output).toContain('1/2x + sqrt(9)');
  });

  it('collapses redundant parentheses in math expressions', () => {
    const output = applyLanguageOutputRules('Simplify ((3/4)) + (((2/5))).', 'english');
    expect(output).not.toContain('((');
    expect(output).not.toContain('))');
    expect(output).toContain('(3/4)');
    expect(output).toContain('(2/5)');
  });

  it('removes braces and square brackets while keeping meaning readable', () => {
    const output = applyLanguageOutputRules('Solve [x + 2] = {7} and then [3/4] + [1/4].', 'english');
    expect(output).not.toMatch(/[\[\]{}]/);
    expect(output).toContain('(x + 2) = 7');
    expect(output).toContain('(3/4) + (1/4)');
  });

  it('balances stray unmatched parentheses', () => {
    const output = applyLanguageOutputRules('First do (2 + 3)) and then ((4 - 1).', 'english');
    expect(output).not.toContain('))');
    expect(output).not.toContain('((');
  });
});
