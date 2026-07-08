import { describe, it, expect, beforeEach } from 'vitest';
import { evaluateLearnerAccess } from '../services/task026LearnerAccessGateService';
import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';

describe('task026RoutesLearnerAccessGate', () => {
  beforeEach(() => {
    task026PilotExecutionRepository.clearTask026StoresForTests();
  });

  it('grants access when learner is in approved cohort', async () => {
    const run = await task026PilotExecutionRepository.createPilotRun({
      schoolId: 'school-1', pilotProgramId: 'pp-1', status: 'active_controlled',
      cohortIds: ['c1'], teacherOwnerId: 't1', supportOwnerId: 's1',
      safeguardingOwnerId: 'sg1', pauseOwnerId: 'p1', rollbackOwnerId: 'r1', monitoringOwnerId: 'm1',
      approvedCurriculumScopeIds: ['cur1'], approvedSourceScopeIds: ['src1'],
      activatedAt: null, pausedAt: null, rolledBackAt: null, completedAt: null, cancelledAt: null,
      blockingIssues: [],
    });
    const result = await evaluateLearnerAccess({ schoolId: 'school-1', learnerId: 'l1', cohortId: 'c1', pilotRunId: run.id, requestedContentType: 'learning' });
    expect(result.allowed).toBe(true);
    expect(result.status).toBe('access_allowed');
    expect(result.reasonCodes).toEqual([]);
  });

  it('denies access for learner not in cohort', async () => {
    const run = await task026PilotExecutionRepository.createPilotRun({
      schoolId: 'school-1', pilotProgramId: 'pp-1', status: 'active_controlled',
      cohortIds: ['c1', 'c2'], teacherOwnerId: 't1', supportOwnerId: 's1',
      safeguardingOwnerId: 'sg1', pauseOwnerId: 'p1', rollbackOwnerId: 'r1', monitoringOwnerId: 'm1',
      approvedCurriculumScopeIds: ['cur1'], approvedSourceScopeIds: ['src1'],
      activatedAt: null, pausedAt: null, rolledBackAt: null, completedAt: null, cancelledAt: null,
      blockingIssues: [],
    });
    const result = await evaluateLearnerAccess({ schoolId: 'school-1', learnerId: 'l1', cohortId: 'c3', pilotRunId: run.id, requestedContentType: 'learning' });
    expect(result.allowed).toBe(false);
    expect(result.status).toBe('access_denied_not_in_cohort');
  });

  it('denies access when pilot is draft', async () => {
    const run = await task026PilotExecutionRepository.createPilotRun({
      schoolId: 'school-1', pilotProgramId: 'pp-1', status: 'draft',
      cohortIds: ['c1'], teacherOwnerId: 't1', supportOwnerId: 's1',
      safeguardingOwnerId: 'sg1', pauseOwnerId: 'p1', rollbackOwnerId: 'r1', monitoringOwnerId: 'm1',
      approvedCurriculumScopeIds: ['cur1'], approvedSourceScopeIds: ['src1'],
      activatedAt: null, pausedAt: null, rolledBackAt: null, completedAt: null, cancelledAt: null,
      blockingIssues: [],
    });
    const result = await evaluateLearnerAccess({ schoolId: 'school-1', learnerId: 'l1', cohortId: 'c1', pilotRunId: run.id, requestedContentType: 'learning' });
    expect(result.allowed).toBe(false);
    expect(result.status).toBe('access_denied_pilot_not_active');
  });

  it('denies teacher-only content requests', async () => {
    const run = await task026PilotExecutionRepository.createPilotRun({
      schoolId: 'school-1', pilotProgramId: 'pp-1', status: 'active_controlled',
      cohortIds: ['c1'], teacherOwnerId: 't1', supportOwnerId: 's1',
      safeguardingOwnerId: 'sg1', pauseOwnerId: 'p1', rollbackOwnerId: 'r1', monitoringOwnerId: 'm1',
      approvedCurriculumScopeIds: ['cur1'], approvedSourceScopeIds: ['src1'],
      activatedAt: null, pausedAt: null, rolledBackAt: null, completedAt: null, cancelledAt: null,
      blockingIssues: [],
    });
    const result = await evaluateLearnerAccess({ schoolId: 'school-1', learnerId: 'l1', cohortId: 'c1', pilotRunId: run.id, requestedContentType: 'teacher_only' });
    expect(result.allowed).toBe(false);
    expect(result.status).toBe('access_denied_teacher_only_request');
  });

  it('denies access when no curriculum scope approved', async () => {
    const run = await task026PilotExecutionRepository.createPilotRun({
      schoolId: 'school-1', pilotProgramId: 'pp-1', status: 'active_controlled',
      cohortIds: ['c1'], teacherOwnerId: 't1', supportOwnerId: 's1',
      safeguardingOwnerId: 'sg1', pauseOwnerId: 'p1', rollbackOwnerId: 'r1', monitoringOwnerId: 'm1',
      approvedCurriculumScopeIds: [], approvedSourceScopeIds: [],
      activatedAt: null, pausedAt: null, rolledBackAt: null, completedAt: null, cancelledAt: null,
      blockingIssues: [],
    });
    const result = await evaluateLearnerAccess({ schoolId: 'school-1', learnerId: 'l1', cohortId: 'c1', pilotRunId: run.id, requestedContentType: 'learning' });
    expect(result.allowed).toBe(false);
    expect(result.status).toBe('access_denied_no_curriculum');
  });
});
