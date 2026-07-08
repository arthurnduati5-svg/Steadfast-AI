import { describe, it, expect } from 'vitest';
import { TASK026_ALLOWED_HIGH_CONTROL_ROLES, TASK026_DENIED_ROLES, TASK026_EXECUTION_CONTROL_ACTIONS, isTask026ControlRole } from '../lib/task026ControlledPilotExecutionValidation';
import { TASK026_EXECUTION_ACTOR_ROLES } from '../contracts/task026ControlledPilotExecutionContracts';

describe('task026RoutesAdminControl', () => {
  it('school_admin is a control role', () => {
    expect(TASK026_ALLOWED_HIGH_CONTROL_ROLES).toContain('school_admin');
  });

  it('system_admin is a control role', () => {
    expect(TASK026_ALLOWED_HIGH_CONTROL_ROLES).toContain('system_admin');
  });

  it('internal_operator is a control role', () => {
    expect(TASK026_ALLOWED_HIGH_CONTROL_ROLES).toContain('internal_operator');
  });

  it('authorized_pilot_coordinator is a control role', () => {
    expect(TASK026_ALLOWED_HIGH_CONTROL_ROLES).toContain('authorized_pilot_coordinator');
  });

  it('denied roles include unauthenticated', () => {
    expect(TASK026_DENIED_ROLES).toContain('unauthenticated');
  });

  it('denied roles include parent', () => {
    expect(TASK026_DENIED_ROLES).toContain('parent');
  });

  it('denied roles include peer', () => {
    expect(TASK026_DENIED_ROLES).toContain('peer');
  });

  it('denied roles exclude school_admin', () => {
    expect(TASK026_DENIED_ROLES).not.toContain('school_admin');
  });

  it('control actions include create_run', () => {
    expect(TASK026_EXECUTION_CONTROL_ACTIONS).toContain('create_run');
  });

  it('control actions include activate_run', () => {
    expect(TASK026_EXECUTION_CONTROL_ACTIONS).toContain('activate_run');
  });

  it('isTask026ControlRole returns true for school_admin', () => {
    expect(isTask026ControlRole('school_admin')).toBe(true);
  });

  it('isTask026ControlRole returns false for parent', () => {
    expect(isTask026ControlRole('parent')).toBe(false);
  });

  it('only 4 roles are high control roles', () => {
    expect(TASK026_ALLOWED_HIGH_CONTROL_ROLES.length).toBe(4);
  });
});
