import { describe, it, expect } from 'vitest';
import { TASK028_EXECUTION_STATUSES, TASK028_BLOCKER_TYPES, TASK028_EVIDENCE_EVENT_TYPES } from '../contracts/task028ControlledExpansionExecutionContracts';

describe('task028NoSchoolWideLaunch', () => {
  it('no school_wide status in execution statuses', () => {
    const hasLaunch = TASK028_EXECUTION_STATUSES.some(s => s.toLowerCase().includes('school_wide') || s.toLowerCase().includes('launch'));
    expect(hasLaunch).toBe(false);
  });

  it('no school_wide blocker type defined', () => {
    const hasLaunch = TASK028_BLOCKER_TYPES.some(b => b.toLowerCase().includes('school_wide') || b.toLowerCase().includes('launch'));
    expect(hasLaunch).toBe(false);
  });

  it('no school_wide evidence event type', () => {
    const hasLaunch = TASK028_EVIDENCE_EVENT_TYPES.some(e => e.toLowerCase().includes('school_wide') || e.toLowerCase().includes('launch'));
    expect(hasLaunch).toBe(false);
  });

  it('validateTask028ExpandedCohortActivationInput rejects cohort sets larger than 50', () => {
    const { validateTask028ExpandedCohortActivationInput } = require('../lib/task028ControlledExpansionExecutionValidation');
    const errors = validateTask028ExpandedCohortActivationInput({
      runId: 'r1', schoolId: 's1',
      cohortIds: new Array(51).fill('c'),
      learnerSafeRefs: ['l1'],
    });
    expect(errors).toContain('cohort_set_too_large_no_school_wide');
  });

  it('schoolWideActivationPayload is a forbidden field', () => {
    const { TASK028_FORBIDDEN_FIELDS } = require('../contracts/task028ControlledExpansionExecutionContracts');
    expect(TASK028_FORBIDDEN_FIELDS).toContain('schoolWideActivationPayload');
  });
});
