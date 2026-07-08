import { describe, it, expect } from 'vitest';
import { TASK028_EXECUTION_STATUSES, TASK028_AUDIT_EVENTS, TASK028_FORBIDDEN_FIELDS } from '../contracts/task028ControlledExpansionExecutionContracts';

describe('task028NoProductionDeployment', () => {
  it('no production_deployment status in execution statuses', () => {
    const hasDeploy = TASK028_EXECUTION_STATUSES.some(s => s.toLowerCase().includes('deploy') || s.toLowerCase().includes('production'));
    expect(hasDeploy).toBe(false);
  });

  it('no production deployment audit event type', () => {
    const hasDeploy = TASK028_AUDIT_EVENTS.some(e => e.toLowerCase().includes('deploy') || e.toLowerCase().includes('production'));
    expect(hasDeploy).toBe(false);
  });

  it('productionDeploymentCommand is a forbidden field', () => {
    expect(TASK028_FORBIDDEN_FIELDS).toContain('productionDeploymentCommand');
  });

  it('productionRollbackCommand is a forbidden field', () => {
    expect(TASK028_FORBIDDEN_FIELDS).toContain('productionRollbackCommand');
  });

  it('no deploy related blocker type', () => {
    const { TASK028_BLOCKER_TYPES } = require('../contracts/task028ControlledExpansionExecutionContracts');
    const hasDeploy = TASK028_BLOCKER_TYPES.some(b => b.toLowerCase().includes('deploy'));
    expect(hasDeploy).toBe(false);
  });
});
