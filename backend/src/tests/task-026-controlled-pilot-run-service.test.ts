import { describe, it, expect, beforeEach } from 'vitest';
import { createPilotRun, activatePilotRun, pausePilotRun, resumePilotRun, rollbackPilotRun, completePilotRun, cancelPilotRun, killSwitch } from '../services/task026ControlledPilotRunService';
import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';

describe('task026ControlledPilotRunService', () => {
  const validInput = {
    schoolId: 'school-1', pilotProgramId: 'pp-1', cohortIds: ['c1'],
    teacherOwnerId: 't1', supportOwnerId: 's1', safeguardingOwnerId: 'sg1',
    pauseOwnerId: 'p1', rollbackOwnerId: 'r1', monitoringOwnerId: 'm1',
    approvedCurriculumScopeIds: ['cur1'], approvedSourceScopeIds: ['src1'],
    actorRole: 'school_admin', actorId: 'admin-1',
  };

  beforeEach(() => {
    task026PilotExecutionRepository.clearTask026StoresForTests();
  });

  describe('createPilotRun', () => {
    it('creates a pilot run with valid input', async () => {
      const result = await createPilotRun(validInput);
      expect(result.ok).toBe(true);
      expect(result.run).toBeTruthy();
      expect(result.run.status).toBe('draft');
    });

    it('rejects missing schoolId', async () => {
      const result = await createPilotRun({ ...validInput, schoolId: '' });
      expect(result.ok).toBe(false);
    });
  });

  describe('activatePilotRun', () => {
    it('activates a pilot run after proper transitions', async () => {
      const create = await createPilotRun(validInput);
      const rid = create.run.id;
      await task026PilotExecutionRepository.updatePilotRunStatus(rid, 'ready');
      const result = await activatePilotRun(rid, 'school_admin', 'admin-1');
      expect(result.ok).toBe(true);
    });
  });

  describe('pausePilotRun', () => {
    it('pauses an active run', async () => {
      const create = await createPilotRun(validInput);
      const rid = create.run.id;
      await task026PilotExecutionRepository.updatePilotRunStatus(rid, 'ready');
      await activatePilotRun(rid, 'school_admin', 'admin-1');
      const result = await pausePilotRun(rid, 'school_admin', 'admin-1', 'manual_pause', 'testing');
      expect(result.ok).toBe(true);
      expect(result.learnerAccessBlocked).toBe(true);
      expect(result.auditPreserved).toBe(true);
    });

    it('rejects pause with invalid reason', async () => {
      const result = await pausePilotRun('r1', 'admin', 'a1', 'invalid_reason', '');
      expect(result.ok).toBe(false);
    });

    it('rejects pause for non-existent run', async () => {
      const result = await pausePilotRun('nonexistent', 'school_admin', 'admin-1', 'manual_pause', 'test');
      expect(result.ok).toBe(false);
      expect(result.reasonCodes).toContain('run_not_found');
    });
  });

  describe('resumePilotRun', () => {
    it('resumes a paused run', async () => {
      const create = await createPilotRun(validInput);
      const rid = create.run.id;
      await task026PilotExecutionRepository.updatePilotRunStatus(rid, 'ready');
      await activatePilotRun(rid, 'school_admin', 'admin-1');
      await pausePilotRun(rid, 'school_admin', 'admin-1', 'manual_pause', 'test');
      const result = await resumePilotRun(rid, 'school_admin', 'admin-1');
      expect(result.ok).toBe(true);
      expect(result.gatesPassed).toBe(true);
    });
  });

  describe('rollbackPilotRun', () => {
    it('initiates rollback for an active run', async () => {
      const create = await createPilotRun(validInput);
      const rid = create.run.id;
      await task026PilotExecutionRepository.updatePilotRunStatus(rid, 'ready');
      await activatePilotRun(rid, 'school_admin', 'admin-1');
      const result = await rollbackPilotRun(rid, 'school_admin', 'admin-1', 'manual_rollback', 'testing');
      expect(result.ok).toBe(true);
      expect(result.learnerAccessBlocked).toBe(true);
      expect(result.dataPreserved).toBe(true);
    });
  });

  describe('completePilotRun', () => {
    it('completes an active run', async () => {
      const create = await createPilotRun(validInput);
      const rid = create.run.id;
      await task026PilotExecutionRepository.updatePilotRunStatus(rid, 'ready');
      await activatePilotRun(rid, 'school_admin', 'admin-1');
      const result = await completePilotRun(rid, 'school_admin', 'admin-1');
      expect(result.ok).toBe(true);
    });

    it('rejects complete for non-existent run', async () => {
      const result = await completePilotRun('nonexistent', 'admin', 'a');
      expect(result.ok).toBe(false);
    });
  });

  describe('cancelPilotRun', () => {
    it('cancels a ready run', async () => {
      const create = await createPilotRun(validInput);
      const rid = create.run.id;
      await task026PilotExecutionRepository.updatePilotRunStatus(rid, 'ready');
      const result = await cancelPilotRun(rid, 'school_admin', 'admin-1');
      expect(result.ok).toBe(true);
    });
  });

  describe('killSwitch', () => {
    it('blocks any run from any state', async () => {
      const create = await createPilotRun(validInput);
      const rid = create.run.id;
      const result = await killSwitch(rid, 'school_admin', 'admin-1');
      expect(result.ok).toBe(true);
      expect(result.learnerAccessBlocked).toBe(true);
      expect(result.auditPreserved).toBe(true);
    });

    it('rejects kill for non-existent run', async () => {
      const result = await killSwitch('nonexistent', 'school_admin', 'admin-1');
      expect(result.ok).toBe(false);
    });
  });
});
