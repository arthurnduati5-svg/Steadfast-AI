import { describe, it, expect, beforeEach } from 'vitest';
import { getTeacherMonitoringSnapshot } from '../services/task026TeacherMonitoringBridgeService';
import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';

describe('task026TeacherMonitoringBridgeService', () => {
  beforeEach(() => {
    task026PilotExecutionRepository.clearTask026StoresForTests();
  });

  it('rejects missing schoolId', async () => {
    const result = await getTeacherMonitoringSnapshot({ schoolId: '', teacherId: 't1', pilotRunId: 'r1' });
    expect(result.status).toBe('monitoring_denied_not_assigned');
  });

  it('rejects missing teacherId', async () => {
    const result = await getTeacherMonitoringSnapshot({ schoolId: 's1', teacherId: '', pilotRunId: 'r1' });
    expect(result.status).toBe('monitoring_denied_not_assigned');
  });

  it('returns pilot_not_found for non-existent run', async () => {
    const result = await getTeacherMonitoringSnapshot({ schoolId: 's1', teacherId: 't1', pilotRunId: 'nonexistent' });
    expect(result.status).toBe('monitoring_denied_pilot_not_found');
  });

  it('returns denied_not_assigned when teacher does not own the run', async () => {
    const run = await task026PilotExecutionRepository.createPilotRun({
      schoolId: 'school-1', pilotProgramId: 'pp-1', status: 'active_controlled',
      cohortIds: ['c1'], teacherOwnerId: 't1', supportOwnerId: 's1',
      safeguardingOwnerId: 'sg1', pauseOwnerId: 'p1', rollbackOwnerId: 'r1', monitoringOwnerId: 'm1',
      approvedCurriculumScopeIds: ['cur1'], approvedSourceScopeIds: ['src1'],
      activatedAt: null, pausedAt: null, rolledBackAt: null, completedAt: null, cancelledAt: null,
      blockingIssues: [],
    });
    const result = await getTeacherMonitoringSnapshot({ schoolId: 'school-1', teacherId: 't2', pilotRunId: run.id });
    expect(result.status).toBe('monitoring_denied_not_assigned');
    expect(result.reasonCodes).toContain('teacher_not_assigned_to_pilot');
  });

  it('returns monitoring_allowed for valid teacher', async () => {
    const run = await task026PilotExecutionRepository.createPilotRun({
      schoolId: 'school-1', pilotProgramId: 'pp-1', status: 'active_controlled',
      cohortIds: ['c1'], teacherOwnerId: 't1', supportOwnerId: 's1',
      safeguardingOwnerId: 'sg1', pauseOwnerId: 'p1', rollbackOwnerId: 'r1', monitoringOwnerId: 'm1',
      approvedCurriculumScopeIds: ['cur1'], approvedSourceScopeIds: ['src1'],
      activatedAt: null, pausedAt: null, rolledBackAt: null, completedAt: null, cancelledAt: null,
      blockingIssues: [],
    });
    const result = await getTeacherMonitoringSnapshot({ schoolId: 'school-1', teacherId: 't1', pilotRunId: run.id });
    expect(result.status).toBe('monitoring_allowed');
    expect(result.pilotRunStatus).toBe('active_controlled');
    expect(result.cohortSafeCount).toBe(1);
  });

  it('includes safe next actions for active run', async () => {
    const run = await task026PilotExecutionRepository.createPilotRun({
      schoolId: 'school-1', pilotProgramId: 'pp-1', status: 'active_controlled',
      cohortIds: ['c1'], teacherOwnerId: 't1', supportOwnerId: 's1',
      safeguardingOwnerId: 'sg1', pauseOwnerId: 'p1', rollbackOwnerId: 'r1', monitoringOwnerId: 'm1',
      approvedCurriculumScopeIds: ['cur1'], approvedSourceScopeIds: ['src1'],
      activatedAt: null, pausedAt: null, rolledBackAt: null, completedAt: null, cancelledAt: null,
      blockingIssues: [],
    });
    const result = await getTeacherMonitoringSnapshot({ schoolId: 'school-1', teacherId: 't1', pilotRunId: run.id });
    expect(result.safeNextActions).toContain('monitor_learner_engagement');
    expect(result.safeNextActions).toContain('review_safeguarding_signals');
  });

  it('includes pause recommendation when signals exist', async () => {
    const run = await task026PilotExecutionRepository.createPilotRun({
      schoolId: 'school-1', pilotProgramId: 'pp-1', status: 'active_controlled',
      cohortIds: ['c1'], teacherOwnerId: 't1', supportOwnerId: 's1',
      safeguardingOwnerId: 'sg1', pauseOwnerId: 'p1', rollbackOwnerId: 'r1', monitoringOwnerId: 'm1',
      approvedCurriculumScopeIds: ['cur1'], approvedSourceScopeIds: ['src1'],
      activatedAt: null, pausedAt: null, rolledBackAt: null, completedAt: null, cancelledAt: null,
      blockingIssues: [],
    });
    await task026PilotExecutionRepository.recordSafeguardingSignal({
      schoolId: 'school-1', pilotRunId: run.id, signalType: 'concerning_learner_behavior', severity: 'medium', source: 'system', safeSummary: 'test', requiresPause: true, requiresHumanReview: true, humanReviewPathExists: true, status: 'active',
    });
    const result = await getTeacherMonitoringSnapshot({ schoolId: 'school-1', teacherId: 't1', pilotRunId: run.id });
    expect(result.pauseRecommendationMetadata.pauseRecommended).toBe(true);
  });

  it('counts blocked events correctly', async () => {
    const run = await task026PilotExecutionRepository.createPilotRun({
      schoolId: 'school-1', pilotProgramId: 'pp-1', status: 'active_controlled',
      cohortIds: ['c1'], teacherOwnerId: 't1', supportOwnerId: 's1',
      safeguardingOwnerId: 'sg1', pauseOwnerId: 'p1', rollbackOwnerId: 'r1', monitoringOwnerId: 'm1',
      approvedCurriculumScopeIds: ['cur1'], approvedSourceScopeIds: ['src1'],
      activatedAt: null, pausedAt: null, rolledBackAt: null, completedAt: null, cancelledAt: null,
      blockingIssues: [],
    });
    await task026PilotExecutionRepository.recordEvidenceEvent({ schoolId: 'school-1', pilotRunId: run.id, eventType: 'session_blocked', actorRole: 'learner', safeSummary: 'Blocked', metadataSafeJson: {} });
    await task026PilotExecutionRepository.recordEvidenceEvent({ schoolId: 'school-1', pilotRunId: run.id, eventType: 'support_needed', actorRole: 'learner', safeSummary: 'Support', metadataSafeJson: {} });
    const result = await getTeacherMonitoringSnapshot({ schoolId: 'school-1', teacherId: 't1', pilotRunId: run.id });
    expect(result.blockedEventCount).toBe(1);
    expect(result.supportNeededCount).toBe(1);
  });
});
