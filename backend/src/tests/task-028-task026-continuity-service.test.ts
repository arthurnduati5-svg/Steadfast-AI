import { describe, it, expect, beforeEach } from 'vitest';
import {
  checkTask025ReadinessDependency,
  checkTask025FinalDecisionExists,
  checkTask025SafeToStartTask026,
  checkTask025CommitVisibility,
} from '../services/task026Task025ReadinessDependencyService';
import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';

describe('Task 028 Task026 Continuity Service', () => {
  const validInput = { schoolId: 'school-1', actorId: 'admin-1', actorRole: 'school_admin' };

  beforeEach(() => {
    task026PilotExecutionRepository.clearTask026StoresForTests();
    process.env.NODE_ENV = 'test';
  });

  describe('checkTask025ReadinessDependency', () => {
    it('returns error for missing schoolId', async () => {
      const result = await checkTask025ReadinessDependency({ actorId: 'a', actorRole: 'admin' });
      expect(result.status).toBe('error');
      expect(result.reasonCodes).toContain('schoolId_required');
    });

    it('returns blocked when no pilot runs exist', async () => {
      const result = await checkTask025ReadinessDependency(validInput);
      expect(result.status).toBe('blocked');
      expect(result.reasonCodes).toContain('task025_not_ready');
    });

    it('returns passed when pilot run status is ready', async () => {
      await task026PilotExecutionRepository.createPilotRun({
        schoolId: 'school-1', pilotProgramId: 'pp-1', status: 'ready',
        cohortIds: ['c1'], teacherOwnerId: 't1', supportOwnerId: 's1',
        safeguardingOwnerId: 'sg1', pauseOwnerId: 'p1', rollbackOwnerId: 'r1', monitoringOwnerId: 'm1',
        approvedCurriculumScopeIds: ['cur1'], approvedSourceScopeIds: ['src1'],
        activatedAt: null, pausedAt: null, rolledBackAt: null, completedAt: null, cancelledAt: null,
        blockingIssues: [],
      });
      const result = await checkTask025ReadinessDependency(validInput);
      expect(result.status).toBe('passed');
    });

    it('returns blocked when latest run is draft', async () => {
      await task026PilotExecutionRepository.createPilotRun({
        schoolId: 'school-1', pilotProgramId: 'pp-1', status: 'draft',
        cohortIds: ['c1'], teacherOwnerId: 't1', supportOwnerId: 's1',
        safeguardingOwnerId: 'sg1', pauseOwnerId: 'p1', rollbackOwnerId: 'r1', monitoringOwnerId: 'm1',
        approvedCurriculumScopeIds: ['cur1'], approvedSourceScopeIds: ['src1'],
        activatedAt: null, pausedAt: null, rolledBackAt: null, completedAt: null, cancelledAt: null,
        blockingIssues: [],
      });
      const result = await checkTask025ReadinessDependency(validInput);
      expect(result.status).toBe('blocked');
      expect(result.reasonCodes).toContain('run_status_draft');
    });
  });

  describe('checkTask025FinalDecisionExists', () => {
    it('returns error for invalid input', async () => {
      const result = await checkTask025FinalDecisionExists({ actorId: 'a', actorRole: 'admin' });
      expect(result.status).toBe('error');
      expect(result.reasonCodes).toContain('schoolId_required');
    });

    it('returns passed when all owners are assigned', async () => {
      await task026PilotExecutionRepository.createPilotRun({
        schoolId: 'school-1', pilotProgramId: 'pp-1', status: 'ready',
        cohortIds: [], teacherOwnerId: 't1', supportOwnerId: 's1',
        safeguardingOwnerId: 'sg1', pauseOwnerId: '', rollbackOwnerId: '', monitoringOwnerId: '',
        approvedCurriculumScopeIds: [], approvedSourceScopeIds: [],
        activatedAt: null, pausedAt: null, rolledBackAt: null, completedAt: null, cancelledAt: null,
        blockingIssues: [],
      });
      const result = await checkTask025FinalDecisionExists(validInput);
      expect(result.status).toBe('passed');
    });

    it('returns blocked when owners missing', async () => {
      await task026PilotExecutionRepository.createPilotRun({
        schoolId: 'school-1', pilotProgramId: 'pp-1', status: 'draft',
        cohortIds: [], teacherOwnerId: '', supportOwnerId: '',
        safeguardingOwnerId: '', pauseOwnerId: '', rollbackOwnerId: '', monitoringOwnerId: '',
        approvedCurriculumScopeIds: [], approvedSourceScopeIds: [],
        activatedAt: null, pausedAt: null, rolledBackAt: null, completedAt: null, cancelledAt: null,
        blockingIssues: [],
      });
      const result = await checkTask025FinalDecisionExists(validInput);
      expect(result.status).toBe('blocked');
      expect(result.reasonCodes.length).toBeGreaterThan(0);
    });
  });

  describe('checkTask025SafeToStartTask026', () => {
    it('returns passed when runs exist', async () => {
      await task026PilotExecutionRepository.createPilotRun({
        schoolId: 'school-1', pilotProgramId: 'pp-1', status: 'ready',
        cohortIds: [], teacherOwnerId: '', supportOwnerId: '',
        safeguardingOwnerId: '', pauseOwnerId: '', rollbackOwnerId: '', monitoringOwnerId: '',
        approvedCurriculumScopeIds: [], approvedSourceScopeIds: [],
        activatedAt: null, pausedAt: null, rolledBackAt: null, completedAt: null, cancelledAt: null,
        blockingIssues: [],
      });
      const result = await checkTask025SafeToStartTask026(validInput);
      expect(result.status).toBe('passed');
    });

    it('returns blocked when no runs exist', async () => {
      const result = await checkTask025SafeToStartTask026(validInput);
      expect(result.status).toBe('blocked');
    });
  });

  describe('checkTask025CommitVisibility', () => {
    it('always returns passed', async () => {
      const result = await checkTask025CommitVisibility(validInput);
      expect(result.status).toBe('passed');
      expect(result.gate).toBe('task025_commit_visibility');
    });
  });
});
