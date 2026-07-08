import { describe, it, expect } from 'vitest';
import { TASK028_FORBIDDEN_FIELDS } from '../contracts/task028ControlledExpansionExecutionContracts';
import { rejectTask028ForbiddenFields } from '../lib/task028ControlledExpansionExecutionValidation';

describe('task028NoAnswerArtifactLeak', () => {
  it('answerKey is a forbidden field', () => {
    expect(TASK028_FORBIDDEN_FIELDS).toContain('answerKey');
  });

  it('correctAnswer is a forbidden field', () => {
    expect(TASK028_FORBIDDEN_FIELDS).toContain('correctAnswer');
  });

  it('modelAnswer is a forbidden field', () => {
    expect(TASK028_FORBIDDEN_FIELDS).toContain('modelAnswer');
  });

  it('markingScheme is a forbidden field', () => {
    expect(TASK028_FORBIDDEN_FIELDS).toContain('markingScheme');
  });

  it('rejectTask028ForbiddenFields catches answerKey', () => {
    const errors: string[] = [];
    rejectTask028ForbiddenFields({ answerKey: 'A,B,C,D' }, errors);
    expect(errors).toContain('forbidden_field_answerKey');
  });

  it('rejectTask028ForbiddenFields catches correctAnswer', () => {
    const errors: string[] = [];
    rejectTask028ForbiddenFields({ correctAnswer: '42' }, errors);
    expect(errors).toContain('forbidden_field_correctAnswer');
  });

  it('rejectTask028ForbiddenFields catches markingScheme', () => {
    const errors: string[] = [];
    rejectTask028ForbiddenFields({ markingScheme: 'rubric' }, errors);
    expect(errors).toContain('forbidden_field_markingScheme');
  });
});
