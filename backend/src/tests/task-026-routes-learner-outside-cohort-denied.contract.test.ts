import { describe, it, expect, beforeEach } from 'vitest';
import { evaluateLearnerAccess } from '../services/task026LearnerAccessGateService';
import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';

describe('task026RoutesLearnerOutsideCohortDenied', () => {
  beforeEach(() => {
    task026PilotExecutionRepository.clearTask026StoresForTests();
  });

  it('denies learner from different cohort in same school', async () => {
    const run = await task026PilotExecutionRepository.createPilotRun({
      schoolId: 'school-1', pilotProgramId: 'pp-1', status: 'active_controlled',
      cohortIds: ['cohort-a', 'cohort-b'], teacherOwnerId: 't1', supportOwnerId: 's1',
      safeguardingOwnerId: 'sg1', pauseOwnerId: 'p1', rollbackOwnerId: 'r1', monitoringOwnerId: 'm1',
      approvedCurriculumScopeIds: ['cur1'], approvedSourceScopeIds: ['src1'],
      activatedAt: null, pausedAt: null, rolledBackAt: null, completedAt: null, cancelledAt: null,
      blockingIssues: [],
    });
    const result = await evaluateLearnerAccess({ schoolId: 'school-1', learnerId: 'l1', cohortId: 'cohort-c', pilotRunId: run.id, requestedContentType: 'learning' });
    expect(result.allowed).toBe(false);
    expect(result.status).toBe('access_denied_not_in_cohort');
    expect(result.reasonCodes).toContain('learner_not_in_approved_cohort');
  });

  it('denies learner from completely different school', async () => {
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
    expect(result.status).toBe('access_denied_no_school');
  });

  it('denies learner when run is rolled_back', async () => {
    const run = await task026PilotExecutionRepository.createPilotRun({
      schoolId: 'school-1', pilotProgramId: 'pp-1', status: 'rolled_back',
      cohortIds: ['c1'], teacherOwnerId: 't1', supportOwnerId: 's1',
      safeguardingOwnerId: 'sg1', pauseOwnerId: 'p1', rollbackOwnerId: 'r1', monitoringOwnerId: 'm1',
      approvedCurriculumScopeIds: ['cur1'], approvedSourceScopeIds: ['src1'],
      activatedAt: null, pausedAt: null, rolledBackAt: null, completedAt: null, cancelledAt: null,
      blockingIssues: [],
    });
    const result = await evaluateLearnerAccess({ schoolId: 'school-1', learnerId: 'l1', cohortId: 'c1', pilotRunId: run.id, requestedContentType: 'learning' });
    expect(result.allowed).toBe(false);
    expect(result.status).toBe('access_denied_pilot_rolled_back');
  });

  it('denies learner when run is completed', async () => {
    const run = await task026PilotExecutionRepository.createPilotRun({
      schoolId: 'school-1', pilotProgramId: 'pp-1', status: 'completed',
      cohortIds: ['c1'], teacherOwnerId: 't1', supportOwnerId: 's1',
      safeguardingOwnerId: 'sg1', pauseOwnerId: 'p1', rollbackOwnerId: 'r1', monitoringOwnerId: 'm1',
      approvedCurriculumScopeIds: ['cur1'], approvedSourceScopeIds: ['src1'],
      activatedAt: null, pausedAt: null, rolledBackAt: null, completedAt: null, cancelledAt: null,
      blockingIssues: [],
    });
    const result = await evaluateLearnerAccess({ schoolId: 'school-1', learnerId: 'l1', cohortId: 'c1', pilotRunId: run.id, requestedContentType: 'learning' });
    expect(result.allowed).toBe(false);
    expect(result.status).toBe('access_denied_pilot_blocked');
  });
});
