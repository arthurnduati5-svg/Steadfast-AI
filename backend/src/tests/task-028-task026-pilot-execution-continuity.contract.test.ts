import { describe, it, expect } from 'vitest';
import {
  TASK028_DEPENDENCY_GATE_STATUSES,
} from '../contracts/task028ControlledExpansionExecutionContracts';
import { verifyTask026Continuity } from '../services/task028Task026ContinuityService';
import { verifyGovernanceContinuity } from '../services/task028GovernanceContinuityService';

describe('Task 028 - Task 026 Pilot Execution Continuity', () => {
  it('requires pilot execution continuity', () => {
    expect(TASK028_DEPENDENCY_GATE_STATUSES).toContain('failed_continuity');
  });

  it('task026 continuity service returns expected shape', async () => {
    const result = await verifyTask026Continuity('school-test');
    expect(result).toHaveProperty('ok');
    expect(result).toHaveProperty('reasonCodes');
    expect(result).toHaveProperty('evidenceSummary');
  });

  it('governance continuity includes task026', async () => {
    const result = await verifyGovernanceContinuity('school-test');
    expect(result.continuityStatuses).toHaveProperty('task026');
  });
});
