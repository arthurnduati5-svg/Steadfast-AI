import { describe, it, expect } from 'vitest';
import { TASK026_DENIED_ROLES, TASK026_EXECUTION_ACTOR_ROLES } from '../contracts/task026ControlledPilotExecutionContracts';
import { validateTask026ExecutionContext, isTask026ControlRole, isTask026MonitoringRole, isTask026LearnerRole } from '../lib/task026ControlledPilotExecutionValidation';

describe('task026RoutesPeerDenied', () => {
  it('peer is in denied roles list', () => {
    expect(TASK026_DENIED_ROLES).toContain('peer');
  });

  it('peer is not in execution actor roles', () => {
    expect(TASK026_EXECUTION_ACTOR_ROLES).not.toContain('peer');
  });

  it('validateTask026ExecutionContext rejects peer role', () => {
    const result = validateTask026ExecutionContext({ schoolId: 's1', actorId: 'peer1', actorRole: 'peer', verifiedSchoolIdentity: true });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.code).toBe('ROLE_DENIED');
      expect(result.reasonCodes).toContain('role_denied');
    }
  });

  it('isTask026ControlRole returns false for peer', () => {
    expect(isTask026ControlRole('peer')).toBe(false);
  });

  it('isTask026MonitoringRole returns false for peer', () => {
    expect(isTask026MonitoringRole('peer')).toBe(false);
  });

  it('isTask026LearnerRole returns false for peer', () => {
    expect(isTask026LearnerRole('peer')).toBe(false);
  });

  it('learner_not_in_pilot is also in denied roles', () => {
    expect(TASK026_DENIED_ROLES).toContain('learner_not_in_pilot');
  });

  it('unknown role is in denied roles', () => {
    expect(TASK026_DENIED_ROLES).toContain('unknown');
  });

  it('unauthenticated role is in denied roles', () => {
    expect(TASK026_DENIED_ROLES).toContain('unauthenticated');
  });
});
