import { describe, it, expect } from 'vitest';
import { TASK028_DENIED_ROLES, TASK028_ACTOR_ROLES, TASK028_CONTROL_ROLES } from '../contracts/task028ControlledExpansionExecutionContracts';
import { validateTask028ExecutionContext } from '../lib/task028ControlledExpansionExecutionValidation';

describe('task028RoutesPeerDenied', () => {
  it('peer is in denied roles list', () => {
    expect(TASK028_DENIED_ROLES).toContain('peer');
  });

  it('peer is not in actor roles list', () => {
    expect(TASK028_ACTOR_ROLES).not.toContain('peer');
  });

  it('peer is not in control roles list', () => {
    expect(TASK028_CONTROL_ROLES).not.toContain('peer');
  });

  it('validateTask028ExecutionContext rejects peer role', () => {
    const errors = validateTask028ExecutionContext({ schoolId: 's1', actorId: 'peer1', actorRole: 'peer', schoolVerified: true });
    expect(errors).toContain('role_not_permitted');
  });

  it('peer learner_not_in_expanded_cohort is in denied roles', () => {
    expect(TASK028_DENIED_ROLES).toContain('learner_not_in_expanded_cohort');
  });

  it('validateTask028ExecutionContext rejects learner_not_in_expanded_cohort', () => {
    const errors = validateTask028ExecutionContext({ schoolId: 's1', actorId: 'l1', actorRole: 'learner_not_in_expanded_cohort', schoolVerified: true });
    expect(errors).toContain('role_not_permitted');
  });

  it('validateTask028ExecutionContext rejects teacher_not_assigned_to_expansion', () => {
    const errors = validateTask028ExecutionContext({ schoolId: 's1', actorId: 't1', actorRole: 'teacher_not_assigned_to_expansion', schoolVerified: true });
    expect(errors).toContain('role_not_permitted');
  });
});
