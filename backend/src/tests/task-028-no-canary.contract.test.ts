import { describe, it, expect } from 'vitest';
import { TASK028_EXECUTION_STATUSES, TASK028_AUDIT_EVENTS, TASK028_BLOCKER_TYPES } from '../contracts/task028ControlledExpansionExecutionContracts';

describe('task028NoCanary', () => {
  it('no canary status in execution statuses', () => {
    const hasCanary = TASK028_EXECUTION_STATUSES.some(s => s.toLowerCase().includes('canary'));
    expect(hasCanary).toBe(false);
  });

  it('no canary audit event type', () => {
    const hasCanary = TASK028_AUDIT_EVENTS.some(e => e.toLowerCase().includes('canary'));
    expect(hasCanary).toBe(false);
  });

  it('no canary blocker type defined', () => {
    const hasCanary = TASK028_BLOCKER_TYPES.some(b => b.toLowerCase().includes('canary'));
    expect(hasCanary).toBe(false);
  });

  it('no canary field in forbidden fields', () => {
    const { TASK028_FORBIDDEN_FIELDS } = require('../contracts/task028ControlledExpansionExecutionContracts');
    const hasCanary = TASK028_FORBIDDEN_FIELDS.some(f => f.toLowerCase().includes('canary'));
    expect(hasCanary).toBe(false);
  });
});
