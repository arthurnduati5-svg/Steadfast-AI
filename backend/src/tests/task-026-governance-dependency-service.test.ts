import { describe, it, expect, beforeEach } from 'vitest';
import { checkGovernanceContinuity } from '../services/task026GovernanceDependencyService';
import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';

describe('task026GovernanceDependencyService', () => {
  const validInput = { schoolId: 'school-1', actorId: 'admin-1', actorRole: 'school_admin' };

  beforeEach(() => {
    task026PilotExecutionRepository.clearTask026StoresForTests();
  });

  it('returns error gate for missing schoolId', async () => {
    const results = await checkGovernanceContinuity({ actorId: 'a', actorRole: 'admin' });
    expect(results.length).toBe(1);
    expect(results[0].status).toBe('error');
  });

  it('returns all 6 gates when input is valid', async () => {
    const results = await checkGovernanceContinuity(validInput);
    expect(results.length).toBe(6);
  });

  it('task020 and task021 and task022 gates always pass', async () => {
    const results = await checkGovernanceContinuity(validInput);
    const t020 = results.find(r => r.gate === 'task020_governance_continuity');
    const t021 = results.find(r => r.gate === 'task021_school_integration_continuity');
    const t022 = results.find(r => r.gate === 'task022_content_governance_continuity');
    expect(t020!.status).toBe('passed');
    expect(t021!.status).toBe('passed');
    expect(t022!.status).toBe('passed');
  });

  it('task023 and task024 gates are blocked when owners missing', async () => {
    const results = await checkGovernanceContinuity(validInput);
    const t023 = results.find(r => r.gate === 'task023_deployment_readiness_continuity');
    const t024 = results.find(r => r.gate === 'task024_operations_continuity');
    expect(t023!.status).toBe('blocked');
    expect(t024!.status).toBe('blocked');
    expect(t023!.reasonCodes).toContain('missing_owners');
  });

  it('task025 gate always passes', async () => {
    const results = await checkGovernanceContinuity(validInput);
    const t025 = results.find(r => r.gate === 'task025_readiness_continuity');
    expect(t025!.status).toBe('passed');
  });

  it('task023 and task024 gates pass when all owners assigned', async () => {
    await task026PilotExecutionRepository.createPilotRun({
      schoolId: 'school-1', pilotProgramId: 'pp-1', status: 'ready',
      cohortIds: [], teacherOwnerId: 't1', supportOwnerId: 's1',
      safeguardingOwnerId: 'sg1', pauseOwnerId: 'p1', rollbackOwnerId: 'r1', monitoringOwnerId: 'm1',
      approvedCurriculumScopeIds: [], approvedSourceScopeIds: [],
      activatedAt: null, pausedAt: null, rolledBackAt: null, completedAt: null, cancelledAt: null,
      blockingIssues: [],
    });
    const results = await checkGovernanceContinuity(validInput);
    const t023 = results.find(r => r.gate === 'task023_deployment_readiness_continuity');
    const t024 = results.find(r => r.gate === 'task024_operations_continuity');
    expect(t023!.status).toBe('passed');
    expect(t024!.status).toBe('passed');
  });

  it('all gates have correct shape', async () => {
    const results = await checkGovernanceContinuity(validInput);
    for (const gate of results) {
      expect(gate).toHaveProperty('gate');
      expect(gate).toHaveProperty('status');
      expect(gate).toHaveProperty('reasonCodes');
      expect(gate).toHaveProperty('safeMessage');
      expect(Array.isArray(gate.reasonCodes)).toBe(true);
    }
  });
});
