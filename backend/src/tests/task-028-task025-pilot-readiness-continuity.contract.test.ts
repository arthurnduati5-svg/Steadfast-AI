import { describe, it, expect } from 'vitest';
import {
  TASK028_EXECUTION_STATUSES,
  TASK028_DEPENDENCY_GATE_STATUSES,
} from '../contracts/task028ControlledExpansionExecutionContracts';
import { verifyGovernanceContinuity } from '../services/task028GovernanceContinuityService';

describe('Task 028 - Task 025 Pilot Readiness Continuity', () => {
  it('requires pilot readiness continuity', () => {
    expect(TASK028_DEPENDENCY_GATE_STATUSES).toContain('failed_continuity');
  });

  it('requires preflight_pending status for readiness', () => {
    expect(TASK028_EXECUTION_STATUSES).toContain('preflight_pending');
    expect(TASK028_EXECUTION_STATUSES).toContain('ready');
  });

  it('governance continuity includes task025', async () => {
    const result = await verifyGovernanceContinuity('school-test');
    expect(result.continuityStatuses).toHaveProperty('task025');
  });
});
