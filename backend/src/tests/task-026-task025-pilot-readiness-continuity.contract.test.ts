import { describe, it, expect, beforeEach } from 'vitest';
import { checkGovernanceContinuity } from '../services/task026GovernanceDependencyService';
import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';

describe('task026Task025PilotReadinessContinuity', () => {
  const validInput = { schoolId: 'school-1', actorId: 'admin-1', actorRole: 'school_admin' };

  beforeEach(() => {
    task026PilotExecutionRepository.clearTask026StoresForTests();
  });

  it('task025 gate always passes', async () => {
    const results = await checkGovernanceContinuity(validInput);
    const gate = results.find(r => r.gate === 'task025_readiness_continuity');
    expect(gate!.status).toBe('passed');
  });

  it('task025 gate has correct gate name', async () => {
    const results = await checkGovernanceContinuity(validInput);
    const gate = results.find(r => r.gate === 'task025_readiness_continuity');
    expect(gate!.gate).toBe('task025_readiness_continuity');
  });

  it('task025 gate has empty reasonCodes on pass', async () => {
    const results = await checkGovernanceContinuity(validInput);
    const gate = results.find(r => r.gate === 'task025_readiness_continuity');
    expect(gate!.reasonCodes).toEqual([]);
  });

  it('task025 gate confirms continuity in message', async () => {
    const results = await checkGovernanceContinuity(validInput);
    const gate = results.find(r => r.gate === 'task025_readiness_continuity');
    expect(gate!.safeMessage).toContain('Task 025 readiness continuity');
  });
});
