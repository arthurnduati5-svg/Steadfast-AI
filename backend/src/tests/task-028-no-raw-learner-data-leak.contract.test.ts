import { describe, it, expect } from 'vitest';
import { TASK028_FORBIDDEN_FIELDS } from '../contracts/task028ControlledExpansionExecutionContracts';
import { rejectTask028ForbiddenFields } from '../lib/task028ControlledExpansionExecutionValidation';

describe('task028NoRawLearnerDataLeak', () => {
  it('rawStudentData is a forbidden field', () => {
    expect(TASK028_FORBIDDEN_FIELDS).toContain('rawStudentData');
  });

  it('rawLearnerData is a forbidden field', () => {
    expect(TASK028_FORBIDDEN_FIELDS).toContain('rawLearnerData');
  });

  it('rawStudentProfile is a forbidden field', () => {
    expect(TASK028_FORBIDDEN_FIELDS).toContain('rawStudentProfile');
  });

  it('rawChat is a forbidden field', () => {
    expect(TASK028_FORBIDDEN_FIELDS).toContain('rawChat');
  });

  it('rawMessage is a forbidden field', () => {
    expect(TASK028_FORBIDDEN_FIELDS).toContain('rawMessage');
  });

  it('rawStudentAnswer is a forbidden field', () => {
    expect(TASK028_FORBIDDEN_FIELDS).toContain('rawStudentAnswer');
  });

  it('rawStudentWork is a forbidden field', () => {
    expect(TASK028_FORBIDDEN_FIELDS).toContain('rawStudentWork');
  });

  it('rejectTask028ForbiddenFields catches rawStudentData', () => {
    const errors: string[] = [];
    rejectTask028ForbiddenFields({ rawStudentData: { name: 'test' } }, errors);
    expect(errors).toContain('forbidden_field_rawStudentData');
  });

  it('rejectTask028ForbiddenFields catches rawChat', () => {
    const errors: string[] = [];
    rejectTask028ForbiddenFields({ rawChat: 'private chat' }, errors);
    expect(errors).toContain('forbidden_field_rawChat');
  });
});
