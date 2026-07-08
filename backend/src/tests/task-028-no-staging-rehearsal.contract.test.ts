import { describe, it, expect } from 'vitest';
import { TASK028_EXECUTION_STATUSES, TASK028_EXPANDED_COHORT_STATUSES, TASK028_EVIDENCE_EVENT_TYPES } from '../contracts/task028ControlledExpansionExecutionContracts';

describe('task028NoStagingRehearsal', () => {
  it('no rehearsal status in execution statuses', () => {
    const hasRehearsal = TASK028_EXECUTION_STATUSES.some(s => s.toLowerCase().includes('rehearsal'));
    expect(hasRehearsal).toBe(false);
  });

  it('no rehearsal status in expanded cohort statuses', () => {
    const hasRehearsal = TASK028_EXPANDED_COHORT_STATUSES.some(s => s.toLowerCase().includes('rehearsal'));
    expect(hasRehearsal).toBe(false);
  });

  it('no rehearsal evidence event type', () => {
    const hasRehearsal = TASK028_EVIDENCE_EVENT_TYPES.some(e => e.toLowerCase().includes('rehearsal'));
    expect(hasRehearsal).toBe(false);
  });

  it('no rehearsal transition defined', () => {
    const { VALID_STATE_TRANSITIONS } = require('../contracts/task028ControlledExpansionExecutionContracts');
    const hasRehearsalTransition = Object.keys(VALID_STATE_TRANSITIONS).some(k => k.toLowerCase().includes('rehearsal'));
    expect(hasRehearsalTransition).toBe(false);
  });

  it('no rehearsal blocker type defined', () => {
    const { TASK028_BLOCKER_TYPES } = require('../contracts/task028ControlledExpansionExecutionContracts');
    const hasRehearsal = TASK028_BLOCKER_TYPES.some(b => b.toLowerCase().includes('rehearsal'));
    expect(hasRehearsal).toBe(false);
  });
});
