import { describe, it, expect } from 'vitest';
import { TASK028_CONTROL_ROLES, TASK028_DENIED_ROLES, TASK028_ACTOR_ROLES } from '../contracts/task028ControlledExpansionExecutionContracts';
import { validateTask028ExecutionContext } from '../lib/task028ControlledExpansionExecutionValidation';

describe('task028RoutesControlScope', () => {
  it('school_admin is a control role', () => {
    expect(TASK028_CONTROL_ROLES).toContain('school_admin');
  });

  it('system_admin is a control role', () => {
    expect(TASK028_CONTROL_ROLES).toContain('system_admin');
  });

  it('internal_operator is a control role', () => {
    expect(TASK028_CONTROL_ROLES).toContain('internal_operator');
  });

  it('authorized_expansion_operator is a control role', () => {
    expect(TASK028_CONTROL_ROLES).toContain('authorized_expansion_operator');
  });

  it('denied roles include unauthenticated', () => {
    expect(TASK028_DENIED_ROLES).toContain('unauthenticated');
  });

  it('denied roles include parent', () => {
    expect(TASK028_DENIED_ROLES).toContain('parent');
  });

  it('denied roles include peer', () => {
    expect(TASK028_DENIED_ROLES).toContain('peer');
  });

  it('denied roles exclude school_admin', () => {
    expect(TASK028_DENIED_ROLES).not.toContain('school_admin');
  });

  it('validateTask028ExecutionContext rejects denied role', () => {
    const errors = validateTask028ExecutionContext({ schoolId: 's1', actorId: 'a1', actorRole: 'parent', schoolVerified: true });
    expect(errors).toContain('role_not_permitted');
  });

  it('validateTask028ExecutionContext accepts control role', () => {
    const errors = validateTask028ExecutionContext({ schoolId: 's1', actorId: 'a1', actorRole: 'school_admin', schoolVerified: true });
    expect(errors).not.toContain('role_not_permitted');
  });

  it('validateTask028ExecutionContext rejects unauthenticated', () => {
    const errors = validateTask028ExecutionContext({ schoolId: 's1', actorId: 'a1', actorRole: 'unauthenticated', schoolVerified: true });
    expect(errors).toContain('role_not_permitted');
  });

  it('TASK028_CONTROL_ROLES has at least 6 entries', () => {
    expect(TASK028_CONTROL_ROLES.length).toBeGreaterThanOrEqual(6);
  });
});
