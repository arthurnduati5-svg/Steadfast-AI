import { describe, expect, it } from 'vitest';
import {
  buildMathNoFinalAnswerSocraticReply,
  buildMathRetryScaffold,
  buildMathSuccessFeedback,
  getMathWorkedExampleThreshold,
} from '../flows/emotional-ai-copilot.math';

describe('Socratic grade pacing contract', () => {
  it('uses deeper retry progression threshold for primary and faster escalation for secondary', () => {
    expect(getMathWorkedExampleThreshold('Primary')).toBe(6);
    expect(getMathWorkedExampleThreshold('Form 3')).toBe(4);
  });

  it('adapts retry coaching tone by grade level', () => {
    const primary = buildMathRetryScaffold('3/4 + 1/8', 1, 'english', 'fractions', 'Primary');
    const secondary = buildMathRetryScaffold('3/4 + 1/8', 1, 'english', 'fractions', 'Form 3');

    expect(primary).toContain('Let us slow down');
    expect(secondary).toContain('State the rule');
  });

  it('adapts final-answer refusal tone by grade level', () => {
    const primary = buildMathNoFinalAnswerSocraticReply({
      expression: '(3/4)/(2/5)',
      languageMode: 'english',
      gradeLevel: 'Primary',
    });
    const secondary = buildMathNoFinalAnswerSocraticReply({
      expression: '(3/4)/(2/5)',
      languageMode: 'english',
      gradeLevel: 'Form 3',
    });

    expect(primary.toLowerCase()).toContain('short steps');
    expect(secondary.toLowerCase()).toContain('coach your reasoning');
  });

  it('keeps success feedback Socratic and grade-aware', () => {
    const primary = buildMathSuccessFeedback('x + 3 = 9', 'english', 'equations', 'Primary');
    const secondary = buildMathSuccessFeedback('x + 3 = 9', 'english', 'equations', 'Form 2');

    expect(primary).toContain('Excellent effort');
    expect(secondary).toContain('Excellent reasoning');
  });
});
