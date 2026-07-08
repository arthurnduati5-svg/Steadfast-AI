import { describe, it, expect } from 'vitest';
import { TASK028_EXECUTION_STATUSES, TASK028_AUDIT_EVENTS } from '../contracts/task028ControlledExpansionExecutionContracts';
import { getTask028PersistenceMode } from '../repositories/task028ExpansionExecutionRepository';

describe('task028NoProductionMutation', () => {
  it('no direct production mutation status in execution statuses', () => {
    const hasMutation = TASK028_EXECUTION_STATUSES.some(s => s.toLowerCase().includes('mutation') || s === 'production_mutate');
    expect(hasMutation).toBe(false);
  });

  it('no production mutation audit event type', () => {
    const hasMutation = TASK028_AUDIT_EVENTS.some(e => e.toLowerCase().includes('mutation') || e.includes('production_mutate'));
    expect(hasMutation).toBe(false);
  });

  it('persistence mode returns degraded_memory_fallback in test', () => {
    const mode = getTask028PersistenceMode();
    expect(mode.mode).toBe('degraded_memory_fallback');
    expect(mode.durable).toBe(false);
  });

  it('persistence mode fallback is used in test environment', () => {
    const mode = getTask028PersistenceMode();
    expect(mode.fallbackUsed).toBe(true);
  });
});
