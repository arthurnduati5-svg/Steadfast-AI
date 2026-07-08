import { describe, it, expect, beforeEach } from 'vitest';
import { checkGovernanceContinuity } from '../services/task026GovernanceDependencyService';
import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';

describe('task026Task021SchoolIntegrationContinuity', () => {
  const validInput = { schoolId: 'school-1', actorId: 'admin-1', actorRole: 'school_admin' };

  beforeEach(() => {
    task026PilotExecutionRepository.clearTask026StoresForTests();
  });

  it('task021 gate always passes', async () => {
    const results = await checkGovernanceContinuity(validInput);
    const gate = results.find(r => r.gate === 'task021_school_integration_continuity');
    expect(gate!.status).toBe('passed');
  });

  it('task021 gate has correct gate name', async () => {
    const results = await checkGovernanceContinuity(validInput);
    const gate = results.find(r => r.gate === 'task021_school_integration_continuity');
    expect(gate!.gate).toBe('task021_school_integration_continuity');
  });

  it('task021 gate has empty reasonCodes on pass', async () => {
    const results = await checkGovernanceContinuity(validInput);
    const gate = results.find(r => r.gate === 'task021_school_integration_continuity');
    expect(gate!.reasonCodes).toEqual([]);
  });

  it('task021 gate confirms continuity in message', async () => {
    const results = await checkGovernanceContinuity(validInput);
    const gate = results.find(r => r.gate === 'task021_school_integration_continuity');
    expect(gate!.safeMessage).toContain('Task 021 school integration continuity');
  });
});
