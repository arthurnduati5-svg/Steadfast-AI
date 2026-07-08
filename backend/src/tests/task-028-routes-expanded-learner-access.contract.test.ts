import { describe, it, expect } from 'vitest';
import { TASK028_EXPANDED_LEARNER_ACCESS_STATUSES, TASK028_ACTOR_ROLES } from '../contracts/task028ControlledExpansionExecutionContracts';
import { validateTask028ExpandedLearnerAccessGateInput } from '../lib/task028ControlledExpansionExecutionValidation';

describe('task028RoutesExpandedLearnerAccess', () => {
  it('allowed status is defined', () => {
    expect(TASK028_EXPANDED_LEARNER_ACCESS_STATUSES).toContain('allowed');
  });

  it('denied_not_in_cohort status is defined', () => {
    expect(TASK028_EXPANDED_LEARNER_ACCESS_STATUSES).toContain('denied_not_in_cohort');
  });

  it('denied_run_not_active status is defined', () => {
    expect(TASK028_EXPANDED_LEARNER_ACCESS_STATUSES).toContain('denied_run_not_active');
  });

  it('denied_school_context status is defined', () => {
    expect(TASK028_EXPANDED_LEARNER_ACCESS_STATUSES).toContain('denied_school_context');
  });

  it('learner_in_approved_expanded_cohort is a valid actor role', () => {
    expect(TASK028_ACTOR_ROLES).toContain('learner_in_approved_expanded_cohort');
  });

  it('validateTask028ExpandedLearnerAccessGateInput requires learnerId', () => {
    const errors = validateTask028ExpandedLearnerAccessGateInput({ schoolId: 's1', runId: 'r1', requestType: 'learning' });
    expect(errors).toContain('learnerId_required');
  });

  it('validateTask028ExpandedLearnerAccessGateInput requires requestType', () => {
    const errors = validateTask028ExpandedLearnerAccessGateInput({ schoolId: 's1', learnerId: 'l1', runId: 'r1' });
    expect(errors).toContain('requestType_required');
  });

  it('validateTask028ExpandedLearnerAccessGateInput rejects forbidden fields', () => {
    const errors = validateTask028ExpandedLearnerAccessGateInput({ schoolId: 's1', learnerId: 'l1', runId: 'r1', requestType: 'learning', rawStudentData: 'forbidden' });
    expect(errors).toContain('forbidden_field_rawStudentData');
  });
});
