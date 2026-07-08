import { describe, it, expect, beforeEach } from 'vitest';
import { recordSafeguardingSignal } from '../services/task026SafeguardingEscalationRuntimeService';
import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';

describe('task026SafeguardingEscalationRuntimeService', () => {
  beforeEach(() => {
    task026PilotExecutionRepository.clearTask026StoresForTests();
  });

  it('rejects missing schoolId', async () => {
    const result = await recordSafeguardingSignal({ schoolId: '', pilotRunId: 'r1', signalType: 'concerning_learner_behavior', severity: 'medium', source: 'system', safeSummary: 'test', requiresPause: false, requiresHumanReview: false });
    expect(result.recorded).toBe(false);
  });

  it('rejects invalid signal type', async () => {
    const result = await recordSafeguardingSignal({ schoolId: 's1', pilotRunId: 'r1', signalType: 'invalid' as any, severity: 'medium', source: 'system', safeSummary: 'test', requiresPause: false, requiresHumanReview: false });
    expect(result.recorded).toBe(false);
  });

  it('rejects non-existent pilot run', async () => {
    const result = await recordSafeguardingSignal({ schoolId: 's1', pilotRunId: 'nonexistent', signalType: 'concerning_learner_behavior', severity: 'medium', source: 'system', safeSummary: 'test', requiresPause: false, requiresHumanReview: false });
    expect(result.recorded).toBe(false);
    expect(result.safeMessage).toContain('not found');
  });

  it('rejects school mismatch', async () => {
    const run = await task026PilotExecutionRepository.createPilotRun({
      schoolId: 'school-1', pilotProgramId: 'pp-1', status: 'active_controlled',
      cohortIds: [], teacherOwnerId: 't1', supportOwnerId: 's1',
      safeguardingOwnerId: 'sg1', pauseOwnerId: 'p1', rollbackOwnerId: 'r1', monitoringOwnerId: 'm1',
      approvedCurriculumScopeIds: [], approvedSourceScopeIds: [],
      activatedAt: null, pausedAt: null, rolledBackAt: null, completedAt: null, cancelledAt: null,
      blockingIssues: [],
    });
    const result = await recordSafeguardingSignal({ schoolId: 'school-2', pilotRunId: run.id, signalType: 'concerning_learner_behavior', severity: 'medium', source: 'system', safeSummary: 'test', requiresPause: false, requiresHumanReview: false });
    expect(result.recorded).toBe(false);
    expect(result.safeMessage).toContain('School mismatch');
  });

  it('rejects when no safeguarding owner assigned', async () => {
    const run = await task026PilotExecutionRepository.createPilotRun({
      schoolId: 'school-1', pilotProgramId: 'pp-1', status: 'active_controlled',
      cohortIds: [], teacherOwnerId: 't1', supportOwnerId: 's1',
      safeguardingOwnerId: '', pauseOwnerId: '', rollbackOwnerId: '', monitoringOwnerId: '',
      approvedCurriculumScopeIds: [], approvedSourceScopeIds: [],
      activatedAt: null, pausedAt: null, rolledBackAt: null, completedAt: null, cancelledAt: null,
      blockingIssues: [],
    });
    const result = await recordSafeguardingSignal({ schoolId: 'school-1', pilotRunId: run.id, signalType: 'concerning_learner_behavior', severity: 'medium', source: 'system', safeSummary: 'test', requiresPause: false, requiresHumanReview: false });
    expect(result.recorded).toBe(false);
    expect(result.safeMessage).toContain('No safeguarding owner');
  });

  it('records signal with proper setup', async () => {
    const run = await task026PilotExecutionRepository.createPilotRun({
      schoolId: 'school-1', pilotProgramId: 'pp-1', status: 'active_controlled',
      cohortIds: [], teacherOwnerId: 't1', supportOwnerId: 's1',
      safeguardingOwnerId: 'sg1', pauseOwnerId: 'p1', rollbackOwnerId: 'r1', monitoringOwnerId: 'm1',
      approvedCurriculumScopeIds: [], approvedSourceScopeIds: [],
      activatedAt: null, pausedAt: null, rolledBackAt: null, completedAt: null, cancelledAt: null,
      blockingIssues: [],
    });
    const result = await recordSafeguardingSignal({ schoolId: 'school-1', pilotRunId: run.id, signalType: 'concerning_learner_behavior', severity: 'high', source: 'system', safeSummary: 'Test signal', requiresPause: true, requiresHumanReview: true });
    expect(result.recorded).toBe(true);
    expect(result.signalId).toBeTruthy();
    expect(result.pauseRecommended).toBe(true);
    expect(result.humanReviewRequired).toBe(true);
  });

  it('records audit event on signal creation', async () => {
    const run = await task026PilotExecutionRepository.createPilotRun({
      schoolId: 'school-1', pilotProgramId: 'pp-1', status: 'active_controlled',
      cohortIds: [], teacherOwnerId: 't1', supportOwnerId: 's1',
      safeguardingOwnerId: 'sg1', pauseOwnerId: 'p1', rollbackOwnerId: 'r1', monitoringOwnerId: 'm1',
      approvedCurriculumScopeIds: [], approvedSourceScopeIds: [],
      activatedAt: null, pausedAt: null, rolledBackAt: null, completedAt: null, cancelledAt: null,
      blockingIssues: [],
    });
    await recordSafeguardingSignal({ schoolId: 'school-1', pilotRunId: run.id, signalType: 'privacy_violation_attempt', severity: 'critical', source: 'system', safeSummary: 'Privacy concern', requiresPause: true, requiresHumanReview: true });
    const audits = await task026PilotExecutionRepository.listAuditEvents(run.id);
    expect(audits.length).toBeGreaterThanOrEqual(1);
    expect(audits.some(a => a.action === 'safeguarding_signal_recorded')).toBe(true);
  });
});
