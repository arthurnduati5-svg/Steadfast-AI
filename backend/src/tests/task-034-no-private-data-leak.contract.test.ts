import { describe, it, expect } from 'vitest';
import { TASK034_FORBIDDEN_OUTPUT_FIELDS } from '../contracts/task034ControlledLimitedRolloutContracts';
import { rejectTask034ForbiddenFields } from '../lib/task034ControlledLimitedRolloutValidation';

describe('task034 no private data leak', () => {
  it('forbidden fields contains studentName', () => {
    expect(TASK034_FORBIDDEN_OUTPUT_FIELDS).toContain('studentName');
  });

  it('forbidden fields contains studentEmail', () => {
    expect(TASK034_FORBIDDEN_OUTPUT_FIELDS).toContain('studentEmail');
  });

  it('forbidden fields contains studentPhone', () => {
    expect(TASK034_FORBIDDEN_OUTPUT_FIELDS).toContain('studentPhone');
  });

  it('forbidden fields contains parentName', () => {
    expect(TASK034_FORBIDDEN_OUTPUT_FIELDS).toContain('parentName');
  });

  it('forbidden fields contains parentEmail', () => {
    expect(TASK034_FORBIDDEN_OUTPUT_FIELDS).toContain('parentEmail');
  });

  it('forbidden fields contains parentPhone', () => {
    expect(TASK034_FORBIDDEN_OUTPUT_FIELDS).toContain('parentPhone');
  });

  it('rejectTask034ForbiddenFields matches studentName and studentEmail', () => {
    const result = rejectTask034ForbiddenFields({ studentName: 'John', studentEmail: 'j@test.com' });
    expect(result.hasForbiddenFields).toBe(true);
    expect(result.matchedFields).toContain('studentName');
    expect(result.matchedFields).toContain('studentEmail');
  });

  it('rejectTask034ForbiddenFields matches parentName', () => {
    const result = rejectTask034ForbiddenFields({ parentName: 'Jane' });
    expect(result.hasForbiddenFields).toBe(true);
    expect(result.matchedFields).toContain('parentName');
  });

  it('rejectTask034ForbiddenFields matches parentPhone', () => {
    const result = rejectTask034ForbiddenFields({ parentPhone: '+1234567890' });
    expect(result.hasForbiddenFields).toBe(true);
    expect(result.matchedFields).toContain('parentPhone');
  });

  it('rejectTask034ForbiddenFields returns false for safe object', () => {
    const result = rejectTask034ForbiddenFields({ safeReasonCodes: ['R1'], safeSummary: 'ok' });
    expect(result.hasForbiddenFields).toBe(false);
  });

  it('rejectTask034ForbiddenFields handles null input', () => {
    const result = rejectTask034ForbiddenFields(null);
    expect(result.hasForbiddenFields).toBe(false);
  });
});
