import { describe, it, expect } from 'vitest';
import { TASK028_FORBIDDEN_FIELDS } from '../contracts/task028ControlledExpansionExecutionContracts';
import { rejectTask028ForbiddenFields } from '../lib/task028ControlledExpansionExecutionValidation';

describe('task028NoPrivateDeenLeak', () => {
  it('privateDeenText is a forbidden field', () => {
    expect(TASK028_FORBIDDEN_FIELDS).toContain('privateDeenText');
  });

  it('deenSensitiveRaw is a forbidden field', () => {
    expect(TASK028_FORBIDDEN_FIELDS).toContain('deenSensitiveRaw');
  });

  it('teacherOnlyContent is a forbidden field', () => {
    expect(TASK028_FORBIDDEN_FIELDS).toContain('teacherOnlyContent');
  });

  it('teacherOnlyNote is a forbidden field', () => {
    expect(TASK028_FORBIDDEN_FIELDS).toContain('teacherOnlyNote');
  });

  it('rejectTask028ForbiddenFields catches privateDeenText', () => {
    const errors: string[] = [];
    rejectTask028ForbiddenFields({ privateDeenText: 'sensitive deen content' }, errors);
    expect(errors).toContain('forbidden_field_privateDeenText');
  });

  it('rejectTask028ForbiddenFields catches deenSensitiveRaw', () => {
    const errors: string[] = [];
    rejectTask028ForbiddenFields({ deenSensitiveRaw: 'sensitive' }, errors);
    expect(errors).toContain('forbidden_field_deenSensitiveRaw');
  });
});
