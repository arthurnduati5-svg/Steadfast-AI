import { describe, it, expect, beforeEach } from 'vitest';
import { checkTask024OperationsDependency } from '../services/task026Task024OperationsDependencyService';
import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';

describe('task026Task024OperationsDependencyService', () => {
  const validInput = { schoolId: 'school-1', actorId: 'admin-1', actorRole: 'school_admin' };

  beforeEach(() => {
    task026PilotExecutionRepository.clearTask026StoresForTests();
  });

  it('returns error for missing schoolId', async () => {
    const result = await checkTask024OperationsDependency({ actorId: 'a', actorRole: 'admin' });
    expect(result.status).toBe('error');
  });

  it('returns blocked when no runs exist (operations readiness fails)', async () => {
    const result = await checkTask024OperationsDependency(validInput);
    expect(result.status).toBe('blocked');
    expect(result.reasonCodes).toContain('task024_not_ready');
  });

  it('returns blocked when runs exist but no pause owner', async () => {
    await task026PilotExecutionRepository.createPilotRun({
      schoolId: 'school-1', pilotProgramId: 'pp-1', status: 'ready',
      cohortIds: [], teacherOwnerId: 't1', supportOwnerId: 's1',
      safeguardingOwnerId: '', pauseOwnerId: '', rollbackOwnerId: '', monitoringOwnerId: '',
      approvedCurriculumScopeIds: [], approvedSourceScopeIds: [],
      activatedAt: null, pausedAt: null, rolledBackAt: null, completedAt: null, cancelledAt: null,
      blockingIssues: [],
    });
    const result = await checkTask024OperationsDependency(validInput);
    expect(result.status).toBe('blocked');
    expect(result.reasonCodes).toContain('no_pause_owner');
  });

  it('returns blocked when no rollback owner', async () => {
    await task026PilotExecutionRepository.createPilotRun({
      schoolId: 'school-1', pilotProgramId: 'pp-1', status: 'ready',
      cohortIds: [], teacherOwnerId: 't1', supportOwnerId: 's1',
      safeguardingOwnerId: '', pauseOwnerId: 'p1', rollbackOwnerId: '', monitoringOwnerId: '',
      approvedCurriculumScopeIds: [], approvedSourceScopeIds: [],
      activatedAt: null, pausedAt: null, rolledBackAt: null, completedAt: null, cancelledAt: null,
      blockingIssues: [],
    });
    const result = await checkTask024OperationsDependency(validInput);
    expect(result.status).toBe('blocked');
    expect(result.reasonCodes).toContain('no_rollback_owner');
  });

  it('returns blocked when no safeguarding owner', async () => {
    await task026PilotExecutionRepository.createPilotRun({
      schoolId: 'school-1', pilotProgramId: 'pp-1', status: 'ready',
      cohortIds: [], teacherOwnerId: 't1', supportOwnerId: 's1',
      safeguardingOwnerId: '', pauseOwnerId: 'p1', rollbackOwnerId: 'r1', monitoringOwnerId: '',
      approvedCurriculumScopeIds: [], approvedSourceScopeIds: [],
      activatedAt: null, pausedAt: null, rolledBackAt: null, completedAt: null, cancelledAt: null,
      blockingIssues: [],
    });
    const result = await checkTask024OperationsDependency(validInput);
    expect(result.status).toBe('blocked');
    expect(result.reasonCodes).toContain('no_safeguarding_owner');
  });

  it('returns passed when all owners assigned', async () => {
    await task026PilotExecutionRepository.createPilotRun({
      schoolId: 'school-1', pilotProgramId: 'pp-1', status: 'ready',
      cohortIds: [], teacherOwnerId: 't1', supportOwnerId: 's1',
      safeguardingOwnerId: 'sg1', pauseOwnerId: 'p1', rollbackOwnerId: 'r1', monitoringOwnerId: 'm1',
      approvedCurriculumScopeIds: [], approvedSourceScopeIds: [],
      activatedAt: null, pausedAt: null, rolledBackAt: null, completedAt: null, cancelledAt: null,
      blockingIssues: [],
    });
    const result = await checkTask024OperationsDependency(validInput);
    expect(result.status).toBe('passed');
    expect(result.gate).toBe('task024_operations');
  });
});
