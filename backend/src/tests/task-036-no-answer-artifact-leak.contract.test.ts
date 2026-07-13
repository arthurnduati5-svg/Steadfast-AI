import { describe, it, expect } from 'vitest';
import { TASK036_FORBIDDEN_OUTPUT_FIELDS } from '../contracts/task036LiveSchoolLaunchContracts';
import { validateForbiddenOutputFields } from '../lib/task036LiveSchoolLaunchValidation';

describe('No Answer Artifact Leak Contract', () => {
  it('forbids answer key exposure', () => {
    expect(TASK036_FORBIDDEN_OUTPUT_FIELDS).toContain('answerKey');
  });

  it('forbids marking scheme exposure', () => {
    expect(TASK036_FORBIDDEN_OUTPUT_FIELDS).toContain('markingScheme');
  });

  it('forbids raw answer in output', () => {
    expect(TASK036_FORBIDDEN_OUTPUT_FIELDS).toContain('rawAnswer');
  });

  it('validateForbiddenOutputFields detects answer key', () => {
    const errors = validateForbiddenOutputFields({ answerKey: 'abc123', markingScheme: 'points' });
    expect(errors).toContain('forbidden_field_present:answerKey');
    expect(errors).toContain('forbidden_field_present:markingScheme');
  });

  it('validateForbiddenOutputFields detects raw answer', () => {
    const errors = validateForbiddenOutputFields({ rawAnswer: 'student answer text' });
    expect(errors).toContain('forbidden_field_present:rawAnswer');
  });
});
