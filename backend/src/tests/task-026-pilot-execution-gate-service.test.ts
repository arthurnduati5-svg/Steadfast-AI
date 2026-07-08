import { describe, it, expect, beforeEach } from 'vitest';
import { evaluateGate } from '../services/task026PilotExecutionGateService';
import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';

describe('task026PilotExecutionGateService', () => {
  beforeEach(() => {
    task026PilotExecutionRepository.clearTask026StoresForTests();
  });

  it('rejects missing runId', async () => {
    const result = await evaluateGate({ runId: '', schoolId: 's1', actorRole: 'admin', action: 'activate_run' });
    expect(result.allowed).toBe(false);
  });

  it('rejects missing schoolId', async () => {
    const result = await evaluateGate({ runId: 'r1', schoolId: '', actorRole: 'admin', action: 'activate_run' });
    expect(result.allowed).toBe(false);
  });

  it('rejects non-existent run', async () => {
    const result = await evaluateGate({ runId: 'nonexistent', schoolId: 'school-1', actorRole: 'school_admin', action: 'activate_run' });
    expect(result.allowed).toBe(false);
  });

  it('rejects unauthorized role', async () => {
    const run = await task026PilotExecutionRepository.createPilotRun({
      schoolId: 'school-1', pilotProgramId: 'pp-1', status: 'ready',
      cohortIds: ['c1'], teacherOwnerId: 't1', supportOwnerId: 's1',
      safeguardingOwnerId: 'sg1', pauseOwnerId: 'p1', rollbackOwnerId: 'r1', monitoringOwnerId: 'm1',
      approvedCurriculumScopeIds: ['cur1'], approvedSourceScopeIds: ['src1'],
      activatedAt: null, pausedAt: null, rolledBackAt: null, completedAt: null, cancelledAt: null,
      blockingIssues: [],
    });
    const result = await evaluateGate({ runId: run.id, schoolId: 'school-1', actorRole: 'learner_in_approved_pilot_cohort', action: 'activate_run' });
    expect(result.allowed).toBe(false);
    expect(result.gateResults.actor_authorized).toBe(false);
  });

  it('passes all gates with valid setup', async () => {
    const run = await task026PilotExecutionRepository.createPilotRun({
      schoolId: 'school-1', pilotProgramId: 'pp-1', status: 'active_controlled',
      cohortIds: ['c1'], teacherOwnerId: 't1', supportOwnerId: 's1',
      safeguardingOwnerId: 'sg1', pauseOwnerId: 'p1', rollbackOwnerId: 'r1', monitoringOwnerId: 'm1',
      approvedCurriculumScopeIds: ['cur1'], approvedSourceScopeIds: ['src1'],
      activatedAt: null, pausedAt: null, rolledBackAt: null, completedAt: null, cancelledAt: null,
      blockingIssues: [],
    });
    const result = await evaluateGate({ runId: run.id, schoolId: 'school-1', actorRole: 'school_admin', action: 'activate_run' });
    expect(result.allowed).toBe(true);
    expect(result.gateResults.school_verified).toBe(true);
    expect(result.gateResults.task025_ready).toBe(true);
    expect(result.gateResults.actor_authorized).toBe(true);
  });

  it('rejects when run is rolled_back', async () => {
    const run = await task026PilotExecutionRepository.createPilotRun({
      schoolId: 'school-1', pilotProgramId: 'pp-1', status: 'rolled_back',
      cohortIds: [], teacherOwnerId: '', supportOwnerId: '',
      safeguardingOwnerId: '', pauseOwnerId: '', rollbackOwnerId: '', monitoringOwnerId: '',
      approvedCurriculumScopeIds: [], approvedSourceScopeIds: [],
      activatedAt: null, pausedAt: null, rolledBackAt: null, completedAt: null, cancelledAt: null,
      blockingIssues: [],
    });
    const result = await evaluateGate({ runId: run.id, schoolId: 'school-1', actorRole: 'school_admin', action: 'activate_run' });
    expect(result.allowed).toBe(false);
    expect(result.gateResults.status_allows_action).toBe(false);
  });

  it('rejects when school does not match', async () => {
    const run = await task026PilotExecutionRepository.createPilotRun({
      schoolId: 'school-1', pilotProgramId: 'pp-1', status: 'ready',
      cohortIds: [], teacherOwnerId: '', supportOwnerId: '',
      safeguardingOwnerId: '', pauseOwnerId: '', rollbackOwnerId: '', monitoringOwnerId: '',
      approvedCurriculumScopeIds: [], approvedSourceScopeIds: [],
      activatedAt: null, pausedAt: null, rolledBackAt: null, completedAt: null, cancelledAt: null,
      blockingIssues: [],
    });
    const result = await evaluateGate({ runId: run.id, schoolId: 'school-2', actorRole: 'school_admin', action: 'activate_run' });
    expect(result.allowed).toBe(false);
    expect(result.gateResults.run_belongs_to_school).toBe(false);
  });

  it('returns all gate results in response', async () => {
    const result = await evaluateGate({ runId: 'nonexistent', schoolId: 'school-1', actorRole: 'school_admin', action: 'activate_run' });
    expect(result).toHaveProperty('gateResults');
    expect(Object.keys(result.gateResults).length).toBeGreaterThan(5);
  });
});
