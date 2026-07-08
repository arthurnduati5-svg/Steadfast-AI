import { describe, it, expect } from 'vitest';
import {
  VALID_STATE_TRANSITIONS,
  TASK028_EXECUTION_STATUSES,
  TASK028_FORBIDDEN_FIELDS,
} from '../contracts/task028ControlledExpansionExecutionContracts';
import {
  isValidTransition,
  redactTask028SensitiveValue,
  rejectTask028ForbiddenFields,
} from '../lib/task028ControlledExpansionExecutionValidation';

describe('Task 028 - No False Pass', () => {
  it('rejects invalid transitions', () => {
    expect(isValidTransition('draft', 'active_controlled_expansion')).toBe(false);
    expect(isValidTransition('rolled_back', 'active_controlled_expansion')).toBe(false);
    expect(isValidTransition('completed', 'active_controlled_expansion')).toBe(false);
    expect(isValidTransition('cancelled', 'active_controlled_expansion')).toBe(false);
    expect(isValidTransition('blocked', 'active_controlled_expansion')).toBe(false);
  });

  it('accepts valid transitions', () => {
    expect(isValidTransition('draft', 'preflight_pending')).toBe(true);
    expect(isValidTransition('ready', 'active_controlled_expansion')).toBe(true);
    expect(isValidTransition('active_controlled_expansion', 'paused')).toBe(true);
  });

  it('rejects invalid statuses', () => {
    const invalid = 'canary_activation';
    expect(TASK028_EXECUTION_STATUSES.includes(invalid as any)).toBe(false);
  });

  it('REJECTS school_wide in statuses', () => {
    const schoolWide = 'school_wide_launch';
    expect(TASK028_EXECUTION_STATUSES.includes(schoolWide as any)).toBe(false);
  });

  it('contains forbidden fields for safety', () => {
    expect(TASK028_FORBIDDEN_FIELDS).toContain('rawStudentData');
    expect(TASK028_FORBIDDEN_FIELDS).toContain('answerKey');
    expect(TASK028_FORBIDDEN_FIELDS).toContain('hiddenReasoning');
  });

  it('redact function works', () => {
    expect(redactTask028SensitiveValue('hello123')).toBe('he****23');
    expect(redactTask028SensitiveValue('ab')).toBe('****');
  });

  it('rejectForbiddenFields detects raw data', () => {
    const errors: string[] = [];
    rejectTask028ForbiddenFields({ rawStudentData: 'test' }, errors);
    expect(errors).toContain('forbidden_field_rawStudentData');
  });

  it('direct to active_controlled_expansion from draft is blocked by state machine', () => {
    expect(VALID_STATE_TRANSITIONS['draft']).not.toContain('active_controlled_expansion');
  });
});
