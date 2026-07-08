import { describe, it, expect, beforeEach } from 'vitest';
import { checkGovernanceContinuity } from '../services/task026GovernanceDependencyService';
import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';

describe('task026Task023DeploymentReadinessContinuity', () => {
  const validInput = { schoolId: 'school-1', actorId: 'admin-1', actorRole: 'school_admin' };

  beforeEach(() => {
    task026PilotExecutionRepository.clearTask026StoresForTests();
  });

  it('task023 gate is blocked when owners missing', async () => {
    const results = await checkGovernanceContinuity(validInput);
    const gate = results.find(r => r.gate === 'task023_deployment_readiness_continuity');
    expect(gate!.status).toBe('blocked');
    expect(gate!.reasonCodes).toContain('missing_owners');
  });

  it('task023 gate passes when all owners assigned', async () => {
    await task026PilotExecutionRepository.createPilotRun({
      schoolId: 'school-1', pilotProgramId: 'pp-1', status: 'draft',
      cohortIds: [], teacherOwnerId: 't1', supportOwnerId: 's1',
      safeguardingOwnerId: 'sg1', pauseOwnerId: 'p1', rollbackOwnerId: 'r1', monitoringOwnerId: 'm1',
      approvedCurriculumScopeIds: [], approvedSourceScopeIds: [],
      activatedAt: null, pausedAt: null, rolledBackAt: null, completedAt: null, cancelledAt: null,
      blockingIssues: [],
    });
    const results = await checkGovernanceContinuity(validInput);
    const gate = results.find(r => r.gate === 'task023_deployment_readiness_continuity');
    expect(gate!.status).toBe('passed');
  });

  it('task023 gate has correct gate name', async () => {
    const results = await checkGovernanceContinuity(validInput);
    const gate = results.find(r => r.gate === 'task023_deployment_readiness_continuity');
    expect(gate!.gate).toBe('task023_deployment_readiness_continuity');
  });
});
