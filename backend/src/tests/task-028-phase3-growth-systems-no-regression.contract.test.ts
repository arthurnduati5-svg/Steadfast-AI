import { describe, it, expect } from 'vitest';
import {
  TASK028_EXECUTION_STATUSES,
  TASK028_EXECUTION_DECISIONS,
  TASK028_ACTOR_ROLES,
  TASK028_EXPANDED_LEARNER_ACCESS_STATUSES,
  TASK028_DENIED_ROLES,
} from '../contracts/task028ControlledExpansionExecutionContracts';
import {
  validateTask028ExecutionContext,
  validateTask028ExpandedLearnerAccessGateInput,
} from '../lib/task028ControlledExpansionExecutionValidation';

describe('Task 028 - Phase 3 Growth Systems No Regression', () => {
  it('preserves learner_in_approved_expanded_cohort role', () => {
    expect(TASK028_ACTOR_ROLES).toContain('learner_in_approved_expanded_cohort');
  });

  it('maintains denied roles for phase 3', () => {
    expect(TASK028_DENIED_ROLES).toContain('learner_not_in_expanded_cohort');
    expect(TASK028_DENIED_ROLES).toContain('parent');
    expect(TASK028_DENIED_ROLES).toContain('peer');
  });

  it('controlled expansion status exists', () => {
    expect(TASK028_EXECUTION_STATUSES).toContain('active_controlled_expansion');
  });

  it('completion decision exists', () => {
    expect(TASK028_EXECUTION_DECISIONS).toContain('complete_expansion');
  });

  it('learner access statuses include cohort denial', () => {
    expect(TASK028_EXPANDED_LEARNER_ACCESS_STATUSES).toContain('denied_not_in_cohort');
  });

  it('validation rejects cross-school actor', () => {
    const errors = validateTask028ExecutionContext({
      schoolId: 'school-a', actorId: 'user-1',
      actorRole: 'cross_school_actor', schoolVerified: true,
    });
    expect(errors).toContain('role_not_permitted');
  });

  it('validation rejects missing school context', () => {
    const errors = validateTask028ExecutionContext({ actorId: 'user-1', actorRole: 'admin' });
    expect(errors).toContain('schoolId_required');
  });

  it('learner access gate validates required fields', () => {
    const errors = validateTask028ExpandedLearnerAccessGateInput({ schoolId: 's1' });
    expect(errors).toContain('learnerId_required');
  });
});
