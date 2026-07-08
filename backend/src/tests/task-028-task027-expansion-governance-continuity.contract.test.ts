import { describe, it, expect } from 'vitest';
import {
  TASK028_DEPENDENCY_GATE_STATUSES,
} from '../contracts/task028ControlledExpansionExecutionContracts';
import { loadTask027Proof } from '../services/task028Task027ProofLoaderService';
import { verifyGovernanceContinuity } from '../services/task028GovernanceContinuityService';

describe('Task 028 - Task 027 Expansion Governance Continuity', () => {
  it('requires expansion governance continuity', () => {
    expect(TASK028_DEPENDENCY_GATE_STATUSES).toContain('failed_continuity');
  });

  it('governance continuity includes task027', async () => {
    const result = await verifyGovernanceContinuity('school-test');
    expect(result.continuityStatuses).toHaveProperty('task027');
  });

  it('task027 proof loader returns expected shape', async () => {
    const proof = await loadTask027Proof();
    expect(proof).toHaveProperty('safeToExecuteExpansion');
    expect(proof).toHaveProperty('blockingIssues');
    expect(proof).toHaveProperty('proofSummary');
  });
});
