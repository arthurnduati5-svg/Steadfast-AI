import { describe, it, expect } from 'vitest';
import { TASK028_EXECUTION_STATUSES, TASK028_AUDIT_EVENTS, TASK028_BLOCKER_TYPES, TASK028_EVIDENCE_EVENT_TYPES } from '../contracts/task028ControlledExpansionExecutionContracts';

describe('task028NoRollout', () => {
  it('no rollout status in execution statuses', () => {
    const hasRollout = TASK028_EXECUTION_STATUSES.some(s => s.toLowerCase().includes('rollout'));
    expect(hasRollout).toBe(false);
  });

  it('no rollout audit event type', () => {
    const hasRollout = TASK028_AUDIT_EVENTS.some(e => e.toLowerCase().includes('rollout'));
    expect(hasRollout).toBe(false);
  });

  it('no rollout blocker type defined', () => {
    const hasRollout = TASK028_BLOCKER_TYPES.some(b => b.toLowerCase().includes('rollout'));
    expect(hasRollout).toBe(false);
  });

  it('no rollout evidence event type', () => {
    const hasRollout = TASK028_EVIDENCE_EVENT_TYPES.some(e => e.toLowerCase().includes('rollout'));
    expect(hasRollout).toBe(false);
  });
});
