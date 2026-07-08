import { describe, it, expect, beforeEach } from 'vitest';
import { checkGovernanceContinuity } from '../services/task026GovernanceDependencyService';
import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';

describe('task026Task020GovernanceContinuity', () => {
  const validInput = { schoolId: 'school-1', actorId: 'admin-1', actorRole: 'school_admin' };

  beforeEach(() => {
    task026PilotExecutionRepository.clearTask026StoresForTests();
  });

  it('task020 governance gate always passes', async () => {
    const results = await checkGovernanceContinuity(validInput);
    const gate = results.find(r => r.gate === 'task020_governance_continuity');
    expect(gate).toBeTruthy();
    expect(gate!.status).toBe('passed');
  });

  it('task020 gate has correct gate name', async () => {
    const results = await checkGovernanceContinuity(validInput);
    const gate = results.find(r => r.gate === 'task020_governance_continuity');
    expect(gate!.gate).toBe('task020_governance_continuity');
  });

  it('task020 gate has empty reason codes on pass', async () => {
    const results = await checkGovernanceContinuity(validInput);
    const gate = results.find(r => r.gate === 'task020_governance_continuity');
    expect(gate!.reasonCodes).toEqual([]);
  });

  it('task020 gate has safe message confirming continuity', async () => {
    const results = await checkGovernanceContinuity(validInput);
    const gate = results.find(r => r.gate === 'task020_governance_continuity');
    expect(gate!.safeMessage).toContain('Task 020 governance continuity');
  });
});
