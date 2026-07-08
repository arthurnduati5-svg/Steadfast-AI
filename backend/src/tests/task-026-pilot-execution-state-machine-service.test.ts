import { describe, it, expect, beforeEach } from 'vitest';
import { canTransition, assertAllowedTransition, transitionState, getCurrentStatus } from '../services/task026PilotExecutionStateMachineService';
import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';

describe('task026PilotExecutionStateMachineService', () => {
  let runId: string;

  beforeEach(async () => {
    task026PilotExecutionRepository.clearTask026StoresForTests();
    const run = await task026PilotExecutionRepository.createPilotRun({
      schoolId: 'school-1', pilotProgramId: 'pp-1', status: 'draft',
      cohortIds: ['c1'], teacherOwnerId: 't1', supportOwnerId: 's1',
      safeguardingOwnerId: 'sg1', pauseOwnerId: 'p1', rollbackOwnerId: 'r1', monitoringOwnerId: 'm1',
      approvedCurriculumScopeIds: ['cur1'], approvedSourceScopeIds: ['src1'],
      activatedAt: null, pausedAt: null, rolledBackAt: null, completedAt: null, cancelledAt: null,
      blockingIssues: [],
    });
    runId = run.id;
  });

  describe('canTransition', () => {
    it('allows draft -> preflight_pending', async () => {
      expect(await canTransition('draft', 'preflight_pending')).toBe(true);
    });

    it('denies draft -> active_controlled', async () => {
      expect(await canTransition('draft', 'active_controlled')).toBe(false);
    });

    it('allows ready -> active_controlled', async () => {
      expect(await canTransition('ready', 'active_controlled')).toBe(true);
    });

    it('allows active_controlled -> paused', async () => {
      expect(await canTransition('active_controlled', 'paused')).toBe(true);
    });

    it('allows paused -> active_controlled', async () => {
      expect(await canTransition('paused', 'active_controlled')).toBe(true);
    });

    it('denies blocked -> anything', async () => {
      expect(await canTransition('blocked', 'active_controlled')).toBe(false);
    });

    it('denies cancelled -> anything', async () => {
      expect(await canTransition('cancelled', 'active_controlled')).toBe(false);
    });

    it('allows active_controlled -> completed', async () => {
      expect(await canTransition('active_controlled', 'completed')).toBe(true);
    });

    it('allows active_controlled -> rollback_pending', async () => {
      expect(await canTransition('active_controlled', 'rollback_pending')).toBe(true);
    });

    it('allows rollback_pending -> rolled_back', async () => {
      expect(await canTransition('rollback_pending', 'rolled_back')).toBe(true);
    });
  });

  describe('assertAllowedTransition', () => {
    it('returns ok for allowed transition', async () => {
      const result = await assertAllowedTransition('draft', 'preflight_pending');
      expect(result.ok).toBe(true);
    });

    it('returns not ok for denied transition', async () => {
      const result = await assertAllowedTransition('draft', 'active_controlled');
      expect(result.ok).toBe(false);
      expect(result.reasonCodes).toContain('invalid_state_transition');
    });
  });

  describe('transitionState', () => {
    it('transitions draft -> preflight_pending', async () => {
      const result = await transitionState({ runId, fromStatus: 'draft', toStatus: 'preflight_pending', actorRole: 'school_admin', actorId: 'admin-1' });
      expect(result.ok).toBe(true);
      const run = await task026PilotExecutionRepository.getPilotRun(runId);
      expect(run!.status).toBe('preflight_pending');
    });

    it('rejects invalid transition', async () => {
      const result = await transitionState({ runId, fromStatus: 'draft', toStatus: 'active_controlled', actorRole: 'school_admin', actorId: 'admin-1' });
      expect(result.ok).toBe(false);
    });

    it('records audit event on transition', async () => {
      await transitionState({ runId, fromStatus: 'draft', toStatus: 'preflight_pending', actorRole: 'school_admin', actorId: 'admin-1' });
      const audits = await task026PilotExecutionRepository.listAuditEvents(runId);
      expect(audits.length).toBeGreaterThanOrEqual(1);
      expect(audits[0].action).toBeTruthy();
    });

    it('sets timestamps on relevant transitions', async () => {
      await transitionState({ runId, fromStatus: 'draft', toStatus: 'preflight_pending', actorRole: 'school_admin', actorId: 'admin-1' });
      await task026PilotExecutionRepository.updatePilotRunStatus(runId, 'ready');
      await transitionState({ runId, fromStatus: 'ready', toStatus: 'active_controlled', actorRole: 'school_admin', actorId: 'admin-1' });
      const run = await task026PilotExecutionRepository.getPilotRun(runId);
      expect(run!.activatedAt).toBeTruthy();
    });
  });

  describe('getCurrentStatus', () => {
    it('returns current status', async () => {
      const result = await getCurrentStatus(runId);
      expect(result.ok).toBe(true);
      expect(result.status).toBe('draft');
    });

    it('returns not ok for missing run', async () => {
      const result = await getCurrentStatus('nonexistent');
      expect(result.ok).toBe(false);
      expect(result.status).toBeNull();
    });
  });
});
