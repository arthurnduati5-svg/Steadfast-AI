import { describe, expect, it } from 'vitest';
import {
  buildMathKickoffPrompt,
  getMathKickoffExpectedAnswers,
} from '../flows/emotional-ai-copilot.math';

describe('Math kickoff personalization contract', () => {
  it('uses student fraction numbers instead of hardcoded defaults in kickoff prompt', () => {
    const output = buildMathKickoffPrompt('((3/4))((2/5)).', 'english', 'fractions');
    expect(output).toContain('3/4');
    expect(output).not.toContain('fraction 5/8');
  });

  it('derives kickoff expected answer from the student fraction when no fraction-division parse is available', () => {
    const expected = getMathKickoffExpectedAnswers('fractions', '((3/4))((2/5)).');
    expect(expected).toContain('3');
    expect(expected).not.toContain('5');
  });
});
