import { describe, it, expect, beforeEach } from 'vitest';
import { evaluateLearnerAccess } from '../services/task026LearnerAccessGateService';
import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';

describe('task026LearnerAccessGateService', () => {
  beforeEach(() => {
    task026PilotExecutionRepository.clearTask026StoresForTests();
  });

  it('rejects missing schoolId', async () => {
    const result = await evaluateLearnerAccess({ schoolId: '', learnerId: 'l1', cohortId: 'c1', pilotRunId: 'r1', requestedContentType: 'learning' });
    expect(result.allowed).toBe(false);
    expect(result.status).toBe('access_denied_no_school');
  });

  it('rejects missing learnerId', async () => {
    const result = await evaluateLearnerAccess({ schoolId: 's1', learnerId: '', cohortId: 'c1', pilotRunId: 'r1', requestedContentType: 'learning' });
    expect(result.allowed).toBe(false);
  });

  it('rejects non-existent run', async () => {
    const result = await evaluateLearnerAccess({ schoolId: 's1', learnerId: 'l1', cohortId: 'c1', pilotRunId: 'nonexistent', requestedContentType: 'learning' });
    expect(result.allowed).toBe(false);
    expect(result.reasonCodes).toContain('pilot_run_not_found');
  });

  it('rejects school mismatch', async () => {
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

  it('rejects learner not in approved cohort', async () => {
    const run = await task026PilotExecutionRepository.createPilotRun({
      schoolId: 'school-1', pilotProgramId: 'pp-1', status: 'active_controlled',
      cohortIds: ['c1'], teacherOwnerId: 't1', supportOwnerId: 's1',
      safeguardingOwnerId: 'sg1', pauseOwnerId: 'p1', rollbackOwnerId: 'r1', monitoringOwnerId: 'm1',
      approvedCurriculumScopeIds: ['cur1'], approvedSourceScopeIds: ['src1'],
      activatedAt: null, pausedAt: null, rolledBackAt: null, completedAt: null, cancelledAt: null,
      blockingIssues: [],
    });
    const result = await evaluateLearnerAccess({ schoolId: 'school-1', learnerId: 'l1', cohortId: 'c2', pilotRunId: run.id, requestedContentType: 'learning' });
    expect(result.allowed).toBe(false);
    expect(result.status).toBe('access_denied_not_in_cohort');
  });

  it('rejects access when run is paused', async () => {
    const run = await task026PilotExecutionRepository.createPilotRun({
      schoolId: 'school-1', pilotProgramId: 'pp-1', status: 'paused',
      cohortIds: ['c1'], teacherOwnerId: 't1', supportOwnerId: 's1',
      safeguardingOwnerId: 'sg1', pauseOwnerId: 'p1', rollbackOwnerId: 'r1', monitoringOwnerId: 'm1',
      approvedCurriculumScopeIds: ['cur1'], approvedSourceScopeIds: ['src1'],
      activatedAt: null, pausedAt: null, rolledBackAt: null, completedAt: null, cancelledAt: null,
      blockingIssues: [],
    });
    const result = await evaluateLearnerAccess({ schoolId: 'school-1', learnerId: 'l1', cohortId: 'c1', pilotRunId: run.id, requestedContentType: 'learning' });
    expect(result.allowed).toBe(false);
    expect(result.status).toBe('access_denied_pilot_paused');
  });

  it('rejects answer_key content type', async () => {
    const run = await task026PilotExecutionRepository.createPilotRun({
      schoolId: 'school-1', pilotProgramId: 'pp-1', status: 'active_controlled',
      cohortIds: ['c1'], teacherOwnerId: 't1', supportOwnerId: 's1',
      safeguardingOwnerId: 'sg1', pauseOwnerId: 'p1', rollbackOwnerId: 'r1', monitoringOwnerId: 'm1',
      approvedCurriculumScopeIds: ['cur1'], approvedSourceScopeIds: ['src1'],
      activatedAt: null, pausedAt: null, rolledBackAt: null, completedAt: null, cancelledAt: null,
      blockingIssues: [],
    });
    const result = await evaluateLearnerAccess({ schoolId: 'school-1', learnerId: 'l1', cohortId: 'c1', pilotRunId: run.id, requestedContentType: 'answer_key' });
    expect(result.allowed).toBe(false);
    expect(result.status).toBe('access_denied_answer_key_request');
  });

  it('grants access with valid setup', async () => {
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
  });
});
