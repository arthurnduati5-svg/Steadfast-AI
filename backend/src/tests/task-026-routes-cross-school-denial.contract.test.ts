import { describe, it, expect, beforeEach } from 'vitest';
import { evaluateGate } from '../services/task026PilotExecutionGateService';
import { evaluateLearnerAccess } from '../services/task026LearnerAccessGateService';
import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';

describe('task026RoutesCrossSchoolDenial', () => {
  beforeEach(() => {
    task026PilotExecutionRepository.clearTask026StoresForTests();
  });

  it('gate service rejects cross-school access via run_belongs_to_school', async () => {
    const run = await task026PilotExecutionRepository.createPilotRun({
      schoolId: 'school-1', pilotProgramId: 'pp-1', status: 'active_controlled',
      cohortIds: ['c1'], teacherOwnerId: 't1', supportOwnerId: 's1',
      safeguardingOwnerId: 'sg1', pauseOwnerId: 'p1', rollbackOwnerId: 'r1', monitoringOwnerId: 'm1',
      approvedCurriculumScopeIds: ['cur1'], approvedSourceScopeIds: ['src1'],
      activatedAt: null, pausedAt: null, rolledBackAt: null, completedAt: null, cancelledAt: null,
      blockingIssues: [],
    });
    const result = await evaluateGate({ runId: run.id, schoolId: 'school-2', actorRole: 'school_admin', action: 'activate_run' });
    expect(result.allowed).toBe(false);
    expect(result.gateResults.run_belongs_to_school).toBe(false);
    expect(result.reasonCodes).toContain('run_not_in_school');
  });

  it('learner access rejects cross-school school mismatch', async () => {
    const run = await task026PilotExecutionRepository.createPilotRun({
      schoolId: 'school-1', pilotProgramId: 'pp-1', status: 'active_controlled',
      cohortIds: ['c1'], teacherOwnerId: 't1', supportOwnerId: 's1',
      safeguardingOwnerId: 'sg1', pauseOwnerId: 'p1', rollbackOwnerId: 'r1', monitoringOwnerId: 'm1',
      approvedCurriculumScopeIds: ['cur1'], approvedSourceScopeIds: ['src1'],
      activatedAt: null, pausedAt: null, rolledBackAt: null, completedAt: null, cancelledAt: null,
      blockingIssues: [],
    });
    const result = await evaluateLearnerAccess({ schoolId: 'school-2', learnerId: 'l1', cohortId: 'c1', pilotRunId: run.id, requestedContentType: 'learning' });
    expect(result.allowed).toBe(false);
    expect(result.reasonCodes).toContain('school_mismatch');
  });

  it('denied roles include cross_school_actor', () => {
    const { TASK026_DENIED_ROLES } = require('../contracts/task026ControlledPilotExecutionContracts');
    expect(TASK026_DENIED_ROLES).toContain('cross_school_actor');
  });

  it('learner access denies non-existent run with correct status', async () => {
    const result = await evaluateLearnerAccess({ schoolId: 'school-1', learnerId: 'l1', cohortId: 'c1', pilotRunId: 'nonexistent', requestedContentType: 'learning' });
    expect(result.allowed).toBe(false);
    expect(result.status).toBe('access_denied_no_school');
  });

  it('gate service rejects when schoolId validation fails', async () => {
    const result = await evaluateGate({ runId: 'r1', schoolId: '', actorRole: 'school_admin', action: 'activate_run' });
    expect(result.allowed).toBe(false);
  });
});
