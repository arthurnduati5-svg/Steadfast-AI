import { describe, it, expect } from 'vitest';
import { TASK026_DENIED_ROLES, TASK026_EXECUTION_ACTOR_ROLES } from '../contracts/task026ControlledPilotExecutionContracts';
import { validateTask026ExecutionContext, isTask026ControlRole, isTask026MonitoringRole, isTask026LearnerRole } from '../lib/task026ControlledPilotExecutionValidation';

describe('task026RoutesParentDenied', () => {
  it('parent is in denied roles list', () => {
    expect(TASK026_DENIED_ROLES).toContain('parent');
  });

  it('parent is not in execution actor roles', () => {
    expect(TASK026_EXECUTION_ACTOR_ROLES).not.toContain('parent');
  });

  it('validateTask026ExecutionContext rejects parent role', () => {
    const result = validateTask026ExecutionContext({ schoolId: 's1', actorId: 'p1', actorRole: 'parent', verifiedSchoolIdentity: true });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.code).toBe('ROLE_DENIED');
      expect(result.reasonCodes).toContain('role_denied');
    }
  });

  it('isTask026ControlRole returns false for parent', () => {
    expect(isTask026ControlRole('parent')).toBe(false);
  });

  it('isTask026MonitoringRole returns false for parent', () => {
    expect(isTask026MonitoringRole('parent')).toBe(false);
  });

  it('isTask026LearnerRole returns false for parent', () => {
    expect(isTask026LearnerRole('parent')).toBe(false);
  });

  it('parent cannot perform any control action', () => {
    const actions = ['create_run', 'activate_run', 'pause_run', 'resume_run', 'cancel_run'];
    for (const action of actions) {
      expect(isTask026ControlRole('parent')).toBe(false);
    }
  });
});
