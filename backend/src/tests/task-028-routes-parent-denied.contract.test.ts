import { describe, it, expect } from 'vitest';
import { TASK028_DENIED_ROLES, TASK028_ACTOR_ROLES } from '../contracts/task028ControlledExpansionExecutionContracts';
import { validateTask028ExecutionContext } from '../lib/task028ControlledExpansionExecutionValidation';

describe('task028RoutesParentDenied', () => {
  it('parent is in denied roles list', () => {
    expect(TASK028_DENIED_ROLES).toContain('parent');
  });

  it('parent is not in actor roles list', () => {
    expect(TASK028_ACTOR_ROLES).not.toContain('parent');
  });

  it('validateTask028ExecutionContext rejects parent role', () => {
    const errors = validateTask028ExecutionContext({ schoolId: 's1', actorId: 'p1', actorRole: 'parent', schoolVerified: true });
    expect(errors).toContain('role_not_permitted');
    expect(errors).not.toContain('schoolId_required');
  });

  it('parent is not in TASK028_CONTROL_ROLES', () => {
    const { TASK028_CONTROL_ROLES } = require('../contracts/task028ControlledExpansionExecutionContracts');
    expect(TASK028_CONTROL_ROLES).not.toContain('parent');
  });

  it('parent is blocked even with valid schoolId and actorId', () => {
    const errors = validateTask028ExecutionContext({ schoolId: 's1', actorId: 'p1', actorRole: 'parent', schoolVerified: true });
    expect(errors).toContain('role_not_permitted');
  });

  it('parent cannot perform any control action via execution context', () => {
    const parentErrors = validateTask028ExecutionContext({ schoolId: 's1', actorId: 'p1', actorRole: 'parent', schoolVerified: true });
    const adminErrors = validateTask028ExecutionContext({ schoolId: 's1', actorId: 'a1', actorRole: 'school_admin', schoolVerified: true });
    expect(parentErrors).toContain('role_not_permitted');
    expect(adminErrors).not.toContain('role_not_permitted');
  });
});
