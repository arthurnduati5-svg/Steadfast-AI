import { describe, it, expect } from 'vitest';
import { TASK034_FORBIDDEN_OUTPUT_FIELDS } from '../contracts/task034ControlledLimitedRolloutContracts';
import { rejectTask034ForbiddenFields } from '../lib/task034ControlledLimitedRolloutValidation';

describe('task034 no answer artifact leak', () => {
  it('forbidden fields contains answerKey', () => {
    expect(TASK034_FORBIDDEN_OUTPUT_FIELDS).toContain('answerKey');
  });

  it('forbidden fields contains correctAnswer', () => {
    expect(TASK034_FORBIDDEN_OUTPUT_FIELDS).toContain('correctAnswer');
  });

  it('forbidden fields contains modelAnswer', () => {
    expect(TASK034_FORBIDDEN_OUTPUT_FIELDS).toContain('modelAnswer');
  });

  it('rejectTask034ForbiddenFields matches answerKey', () => {
    const result = rejectTask034ForbiddenFields({ answerKey: 'secret' });
    expect(result.hasForbiddenFields).toBe(true);
    expect(result.matchedFields).toContain('answerKey');
  });

  it('rejectTask034ForbiddenFields matches correctAnswer', () => {
    const result = rejectTask034ForbiddenFields({ correctAnswer: '42' });
    expect(result.hasForbiddenFields).toBe(true);
    expect(result.matchedFields).toContain('correctAnswer');
  });

  it('rejectTask034ForbiddenFields matches modelAnswer', () => {
    const result = rejectTask034ForbiddenFields({ modelAnswer: 'some answer' });
    expect(result.hasForbiddenFields).toBe(true);
    expect(result.matchedFields).toContain('modelAnswer');
  });

  it('rejectTask034ForbiddenFields returns false for clean object', () => {
    const result = rejectTask034ForbiddenFields({ safeField: 'hello' });
    expect(result.hasForbiddenFields).toBe(false);
    expect(result.matchedFields).toEqual([]);
  });
});
