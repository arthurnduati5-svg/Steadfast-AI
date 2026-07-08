import { describe, it, expect, beforeEach } from 'vitest';
import { generateDailySummary } from '../services/task026DailyPilotSummaryService';
import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';

describe('task026DailyPilotSummaryService', () => {
  beforeEach(() => {
    task026PilotExecutionRepository.clearTask026StoresForTests();
  });

  it('rejects missing pilotRunId', async () => {
    const result = await generateDailySummary({ pilotRunId: '', schoolId: 's1' });
    expect(result.ok).toBe(false);
  });

  it('rejects non-existent run', async () => {
    const result = await generateDailySummary({ pilotRunId: 'nonexistent', schoolId: 's1' });
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('run_not_found');
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
    const result = await generateDailySummary({ pilotRunId: run.id, schoolId: 'school-2' });
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('school_mismatch');
  });

  it('generates summary for active run', async () => {
    const run = await task026PilotExecutionRepository.createPilotRun({
      schoolId: 'school-1', pilotProgramId: 'pp-1', status: 'active_controlled',
      cohortIds: ['c1'], teacherOwnerId: 't1', supportOwnerId: 's1',
      safeguardingOwnerId: 'sg1', pauseOwnerId: 'p1', rollbackOwnerId: 'r1', monitoringOwnerId: 'm1',
      approvedCurriculumScopeIds: ['cur1'], approvedSourceScopeIds: ['src1'],
      activatedAt: null, pausedAt: null, rolledBackAt: null, completedAt: null, cancelledAt: null,
      blockingIssues: [],
    });
    const result = await generateDailySummary({ pilotRunId: run.id, schoolId: 'school-1' });
    expect(result.ok).toBe(true);
    expect(result.summary).toBeTruthy();
    expect(result.summary!.pilotRunId).toBe(run.id);
    expect(result.summary!.cohortSafeCount).toBe(1);
    expect(result.summary!.pauseRollbackState).toBe('not_paused');
    expect(result.summary!.riskLevel).toBe('none');
  });

  it('calculates risk as high when incidents > 5', async () => {
    const run = await task026PilotExecutionRepository.createPilotRun({
      schoolId: 'school-1', pilotProgramId: 'pp-1', status: 'active_controlled',
      cohortIds: [], teacherOwnerId: 't1', supportOwnerId: 's1',
      safeguardingOwnerId: 'sg1', pauseOwnerId: 'p1', rollbackOwnerId: 'r1', monitoringOwnerId: 'm1',
      approvedCurriculumScopeIds: [], approvedSourceScopeIds: [],
      activatedAt: null, pausedAt: null, rolledBackAt: null, completedAt: null, cancelledAt: null,
      blockingIssues: [],
    });
    for (let i = 0; i < 6; i++) {
      await task026PilotExecutionRepository.recordIncidentSignal({ schoolId: 'school-1', pilotRunId: run.id, severity: 'medium', category: 'test', safeSummary: `Incident ${i}`, metadataSafeJson: {}, recommendedAction: 'manual_review' });
    }
    const result = await generateDailySummary({ pilotRunId: run.id, schoolId: 'school-1' });
    expect(result.ok).toBe(true);
    expect(result.summary!.riskLevel).toBe('high');
  });

  it('shows paused state correctly', async () => {
    const run = await task026PilotExecutionRepository.createPilotRun({
      schoolId: 'school-1', pilotProgramId: 'pp-1', status: 'paused',
      cohortIds: [], teacherOwnerId: 't1', supportOwnerId: 's1',
      safeguardingOwnerId: 'sg1', pauseOwnerId: 'p1', rollbackOwnerId: 'r1', monitoringOwnerId: 'm1',
      approvedCurriculumScopeIds: [], approvedSourceScopeIds: [],
      activatedAt: null, pausedAt: null, rolledBackAt: null, completedAt: null, cancelledAt: null,
      blockingIssues: [],
    });
    const result = await generateDailySummary({ pilotRunId: run.id, schoolId: 'school-1' });
    expect(result.summary!.pauseRollbackState).toBe('paused');
    expect(result.summary!.safeNextActions).toContain('review_pause_reason');
    expect(result.summary!.safeNextActions).toContain('evaluate_resume_gates');
  });

  it('counts sessions from evidence events', async () => {
    const run = await task026PilotExecutionRepository.createPilotRun({
      schoolId: 'school-1', pilotProgramId: 'pp-1', status: 'active_controlled',
      cohortIds: [], teacherOwnerId: 't1', supportOwnerId: 's1',
      safeguardingOwnerId: 'sg1', pauseOwnerId: 'p1', rollbackOwnerId: 'r1', monitoringOwnerId: 'm1',
      approvedCurriculumScopeIds: [], approvedSourceScopeIds: [],
      activatedAt: null, pausedAt: null, rolledBackAt: null, completedAt: null, cancelledAt: null,
      blockingIssues: [],
    });
    await task026PilotExecutionRepository.recordEvidenceEvent({ schoolId: 'school-1', pilotRunId: run.id, eventType: 'session_started', actorRole: 'learner', safeSummary: 'session', metadataSafeJson: {} });
    await task026PilotExecutionRepository.recordEvidenceEvent({ schoolId: 'school-1', pilotRunId: run.id, eventType: 'session_blocked', actorRole: 'learner', safeSummary: 'blocked', metadataSafeJson: {} });
    const result = await generateDailySummary({ pilotRunId: run.id, schoolId: 'school-1' });
    expect(result.summary!.sessionsStartedCount).toBe(1);
    expect(result.summary!.sessionsBlockedCount).toBe(1);
  });
});
