import { describe, expect, it } from 'vitest';
import { validateMathTool } from '../tools/validateMath';
import { finalOutputCheckerTool } from '../tools/finalOutputChecker';

describe('Tool quality hardening', () => {
  it('validateMathTool computes safe arithmetic', async () => {
    const result = await validateMathTool({ expression: '(10 - 3) * 2' });
    expect(result.valid).toBe(true);
    expect(result.computed).toBe('14');
  });

  it('validateMathTool rejects unsafe expression', async () => {
    const result = await validateMathTool({ expression: '2 + process.exit(1)' });
    expect(result.valid).toBe(false);
  });

  it('finalOutputCheckerTool catches forbidden output tokens', async () => {
    const result = await finalOutputCheckerTool({
      candidateMessage: 'Here is math: \\frac{1}{2}. What do you notice?',
      languageMode: 'english',
    });
    expect(result.passed).toBe(false);
    expect(result.failures.length).toBeGreaterThan(0);
  });

  it('finalOutputCheckerTool catches internal/weak meta phrasing', async () => {
    const result = await finalOutputCheckerTool({
      candidateMessage:
        'The detailed mechanisms and full extent of photosynthesis processes are not fully specified here.',
      languageMode: 'english',
    });
    expect(result.passed).toBe(false);
    expect(result.failures.some((f) => f.includes('weak meta phrasing'))).toBe(true);
  });
});
