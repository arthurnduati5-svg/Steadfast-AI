import { describe, it, expect } from 'vitest';
import { TASK028_EXECUTION_STATUSES, TASK028_AUDIT_EVENTS } from '../contracts/task028ControlledExpansionExecutionContracts';

describe('task028NoTask029Console', () => {
  it('no operations console event type in audit events', () => {
    const hasConsoleEvent = TASK028_AUDIT_EVENTS.some(e => e.toLowerCase().includes('console'));
    expect(hasConsoleEvent).toBe(false);
  });

  it('no operations console status in execution statuses', () => {
    const hasConsoleStatus = TASK028_EXECUTION_STATUSES.some(s => s.toLowerCase().includes('console'));
    expect(hasConsoleStatus).toBe(false);
  });

  it('does not export operations console contract', () => {
    const contracts = Object.keys(require('../contracts/task028ControlledExpansionExecutionContracts'));
    const consoleExports = contracts.filter(k => k.toLowerCase().includes('console'));
    expect(consoleExports).toHaveLength(0);
  });

  it('task029 specific actions are not in audit events', () => {
    const task029Actions = TASK028_AUDIT_EVENTS.filter(e =>
      e.includes('console') || e.includes('dashboard') || e.includes('ops_view')
    );
    expect(task029Actions).toHaveLength(0);
  });
});
