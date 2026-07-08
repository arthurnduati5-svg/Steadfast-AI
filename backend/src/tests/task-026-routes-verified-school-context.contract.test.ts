import { describe, it, expect } from 'vitest';
import { validateTask026ExecutionContext } from '../lib/task026ControlledPilotExecutionValidation';

describe('task026RoutesVerifiedSchoolContext', () => {
  it('rejects unverified school context', () => {
    const result = validateTask026ExecutionContext({ schoolId: 's1', actorId: 'a1', actorRole: 'school_admin', verifiedSchoolIdentity: false });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.code).toBe('UNVERIFIED_SCHOOL_CONTEXT');
      expect(result.reasonCodes).toContain('unverified_school_context');
    }
  });

  it('passes with verified school context', () => {
    const result = validateTask026ExecutionContext({ schoolId: 's1', actorId: 'a1', actorRole: 'school_admin', verifiedSchoolIdentity: true });
    expect(result.valid).toBe(true);
  });

  it('rejects missing schoolId', () => {
    const result = validateTask026ExecutionContext({ actorId: 'a1', actorRole: 'school_admin', verifiedSchoolIdentity: true });
    expect(result.valid).toBe(false);
  });

  it('rejects empty schoolId after trim', () => {
    const result = validateTask026ExecutionContext({ schoolId: '  ', actorId: 'a1', actorRole: 'school_admin', verifiedSchoolIdentity: true });
    expect(result.valid).toBe(false);
  });

  it('rejects missing actorId', () => {
    const result = validateTask026ExecutionContext({ schoolId: 's1', actorRole: 'school_admin', verifiedSchoolIdentity: true });
    expect(result.valid).toBe(false);
  });

  it('stores verifiedSchoolIdentity as true in data', () => {
    const result = validateTask026ExecutionContext({ schoolId: 's1', actorId: 'a1', actorRole: 'school_admin', verifiedSchoolIdentity: true });
    if (result.valid) {
      expect(result.data.verifiedSchoolIdentity).toBe(true);
    }
  });

  it('trims schoolId whitespace', () => {
    const result = validateTask026ExecutionContext({ schoolId: '  s1  ', actorId: 'a1', actorRole: 'school_admin', verifiedSchoolIdentity: true });
    if (result.valid) {
      expect(result.data.schoolId).toBe('s1');
    }
  });

  it('sets default requestId as unknown', () => {
    const result = validateTask026ExecutionContext({ schoolId: 's1', actorId: 'a1', actorRole: 'school_admin', verifiedSchoolIdentity: true });
    if (result.valid) {
      expect(result.data.requestId).toBe('unknown');
    }
  });
});
