import { describe, it, expect, beforeEach } from 'vitest';
import { pauseRun, resumeRun, rollbackRun, completeRollback } from '../services/task026PauseResumeRollbackService';
import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';

describe('task026PauseResumeRollbackService', () => {
  beforeEach(() => {
    task026PilotExecutionRepository.clearTask026StoresForTests();
  });

  describe('pauseRun', () => {
    it('rejects invalid pause reason', async () => {
      const result = await pauseRun({ runId: 'r1', actorRole: 'admin', actorId: 'a1', reason: 'invalid_reason' as any, details: '' });
      expect(result.ok).toBe(false);
    });

    it('rejects non-existent run', async () => {
      const result = await pauseRun({ runId: 'nonexistent', actorRole: 'school_admin', actorId: 'a1', reason: 'manual_pause', details: 'test' });
      expect(result.ok).toBe(false);
      expect(result.reasonCodes).toContain('run_not_found');
    });

    it('pauses an active controlled run', async () => {
      const run = await task026PilotExecutionRepository.createPilotRun({
        schoolId: 'school-1', pilotProgramId: 'pp-1', status: 'active_controlled',
        cohortIds: ['c1'], teacherOwnerId: 't1', supportOwnerId: 's1',
        safeguardingOwnerId: 'sg1', pauseOwnerId: 'p1', rollbackOwnerId: 'r1', monitoringOwnerId: 'm1',
        approvedCurriculumScopeIds: ['cur1'], approvedSourceScopeIds: ['src1'],
        activatedAt: null, pausedAt: null, rolledBackAt: null, completedAt: null, cancelledAt: null,
        blockingIssues: [],
      });
      const result = await pauseRun({ runId: run.id, actorRole: 'school_admin', actorId: 'a1', reason: 'manual_pause', details: 'Testing pause' });
      expect(result.ok).toBe(true);
      expect(result.learnerAccessBlocked).toBe(true);
      expect(result.auditPreserved).toBe(true);
    });
  });

  describe('resumeRun', () => {
    it('rejects non-existent run', async () => {
      const result = await resumeRun({ runId: 'nonexistent', actorRole: 'school_admin', actorId: 'a1', gatesRevalidated: true });
      expect(result.ok).toBe(false);
    });

    it('resumes a paused run with gate revalidation', async () => {
      const run = await task026PilotExecutionRepository.createPilotRun({
        schoolId: 'school-1', pilotProgramId: 'pp-1', status: 'paused',
        cohortIds: ['c1'], teacherOwnerId: 't1', supportOwnerId: 's1',
        safeguardingOwnerId: 'sg1', pauseOwnerId: 'p1', rollbackOwnerId: 'r1', monitoringOwnerId: 'm1',
        approvedCurriculumScopeIds: ['cur1'], approvedSourceScopeIds: ['src1'],
        activatedAt: null, pausedAt: null, rolledBackAt: null, completedAt: null, cancelledAt: null,
        blockingIssues: [],
      });
      const result = await resumeRun({ runId: run.id, actorRole: 'school_admin', actorId: 'a1', gatesRevalidated: true });
      expect(result.ok).toBe(true);
      expect(result.gatesPassed).toBe(true);
    });
  });

  describe('rollbackRun', () => {
    it('rejects invalid rollback reason', async () => {
      const result = await rollbackRun({ runId: 'r1', actorRole: 'admin', actorId: 'a1', reason: 'invalid_reason' as any, details: '' });
      expect(result.ok).toBe(false);
    });

    it('rolls back an active controlled run', async () => {
      const run = await task026PilotExecutionRepository.createPilotRun({
        schoolId: 'school-1', pilotProgramId: 'pp-1', status: 'active_controlled',
        cohortIds: ['c1'], teacherOwnerId: 't1', supportOwnerId: 's1',
        safeguardingOwnerId: 'sg1', pauseOwnerId: 'p1', rollbackOwnerId: 'r1', monitoringOwnerId: 'm1',
        approvedCurriculumScopeIds: ['cur1'], approvedSourceScopeIds: ['src1'],
        activatedAt: null, pausedAt: null, rolledBackAt: null, completedAt: null, cancelledAt: null,
        blockingIssues: [],
      });
      const result = await rollbackRun({ runId: run.id, actorRole: 'school_admin', actorId: 'a1', reason: 'manual_rollback', details: 'Testing rollback' });
      expect(result.ok).toBe(true);
      expect(result.learnerAccessBlocked).toBe(true);
      expect(result.dataPreserved).toBe(true);
      expect(result.auditPreserved).toBe(true);
    });
  });

  describe('completeRollback', () => {
    it('rejects non-existent run', async () => {
      const result = await completeRollback('nonexistent', 'school_admin', 'a1');
      expect(result.ok).toBe(false);
    });

    it('completes rollback from rollback_pending', async () => {
      const run = await task026PilotExecutionRepository.createPilotRun({
        schoolId: 'school-1', pilotProgramId: 'pp-1', status: 'rollback_pending',
        cohortIds: ['c1'], teacherOwnerId: 't1', supportOwnerId: 's1',
        safeguardingOwnerId: 'sg1', pauseOwnerId: 'p1', rollbackOwnerId: 'r1', monitoringOwnerId: 'm1',
        approvedCurriculumScopeIds: ['cur1'], approvedSourceScopeIds: ['src1'],
        activatedAt: null, pausedAt: null, rolledBackAt: null, completedAt: null, cancelledAt: null,
        blockingIssues: [],
      });
      const result = await completeRollback(run.id, 'school_admin', 'a1');
      expect(result.ok).toBe(true);
      expect(result.learnerAccessBlocked).toBe(true);
      expect(result.dataPreserved).toBe(true);
    });
  });
});
