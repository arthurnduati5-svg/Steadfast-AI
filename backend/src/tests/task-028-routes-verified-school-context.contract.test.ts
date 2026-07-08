import { describe, it, expect } from 'vitest';
import { validateTask028ExecutionContext } from '../lib/task028ControlledExpansionExecutionValidation';

describe('task028RoutesVerifiedSchoolContext', () => {
  it('rejects when schoolVerified is false', () => {
    const errors = validateTask028ExecutionContext({ schoolId: 's1', actorId: 'a1', actorRole: 'school_admin', schoolVerified: false });
    expect(errors).toContain('school_not_verified');
  });

  it('passes when schoolVerified is true', () => {
    const errors = validateTask028ExecutionContext({ schoolId: 's1', actorId: 'a1', actorRole: 'school_admin', schoolVerified: true });
    expect(errors).not.toContain('school_not_verified');
  });

  it('rejects missing schoolId', () => {
    const errors = validateTask028ExecutionContext({ actorId: 'a1', actorRole: 'school_admin', schoolVerified: true });
    expect(errors).toContain('schoolId_required');
  });

  it('rejects missing actorId', () => {
    const errors = validateTask028ExecutionContext({ schoolId: 's1', actorRole: 'school_admin', schoolVerified: true });
    expect(errors).toContain('actorId_required');
  });

  it('rejects missing actorRole', () => {
    const errors = validateTask028ExecutionContext({ schoolId: 's1', actorId: 'a1', schoolVerified: true });
    expect(errors).toContain('actorRole_required');
  });

  it('rejects null input', () => {
    const errors = validateTask028ExecutionContext(null);
    expect(errors).toContain('input_required');
  });

  it('rejects non-object input', () => {
    const errors = validateTask028ExecutionContext('invalid');
    expect(errors).toContain('input_required');
  });
});
