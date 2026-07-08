import { describe, it, expect, beforeEach } from 'vitest';
import { checkGovernanceContinuity } from '../services/task026GovernanceDependencyService';
import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';

describe('task026Task022ContentGovernanceContinuity', () => {
  const validInput = { schoolId: 'school-1', actorId: 'admin-1', actorRole: 'school_admin' };

  beforeEach(() => {
    task026PilotExecutionRepository.clearTask026StoresForTests();
  });

  it('task022 gate always passes', async () => {
    const results = await checkGovernanceContinuity(validInput);
    const gate = results.find(r => r.gate === 'task022_content_governance_continuity');
    expect(gate!.status).toBe('passed');
  });

  it('task022 gate has correct gate name', async () => {
    const results = await checkGovernanceContinuity(validInput);
    const gate = results.find(r => r.gate === 'task022_content_governance_continuity');
    expect(gate!.gate).toBe('task022_content_governance_continuity');
  });

  it('task022 gate has empty reasonCodes on pass', async () => {
    const results = await checkGovernanceContinuity(validInput);
    const gate = results.find(r => r.gate === 'task022_content_governance_continuity');
    expect(gate!.reasonCodes).toEqual([]);
  });

  it('task022 gate confirms continuity in message', async () => {
    const results = await checkGovernanceContinuity(validInput);
    const gate = results.find(r => r.gate === 'task022_content_governance_continuity');
    expect(gate!.safeMessage).toContain('Task 022 content governance continuity');
  });
});
