import { describe, it, expect, beforeEach } from 'vitest';
import { recordIncident } from '../services/task026IncidentWatchService';
import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';

describe('task026IncidentWatchService', () => {
  beforeEach(() => {
    task026PilotExecutionRepository.clearTask026StoresForTests();
  });

  it('rejects missing schoolId', async () => {
    const result = await recordIncident({ schoolId: '', pilotRunId: 'r1', severity: 'high', category: 'test', safeSummary: 'test' });
    expect(result.recorded).toBe(false);
  });

  it('rejects invalid severity', async () => {
    const result = await recordIncident({ schoolId: 's1', pilotRunId: 'r1', severity: 'invalid' as any, category: 'test', safeSummary: 'test' });
    expect(result.recorded).toBe(false);
  });

  it('rejects non-existent run', async () => {
    const result = await recordIncident({ schoolId: 's1', pilotRunId: 'nonexistent', severity: 'high', category: 'test', safeSummary: 'test' });
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
    const result = await recordIncident({ schoolId: 'school-2', pilotRunId: run.id, severity: 'medium', category: 'test', safeSummary: 'Mis' });
    expect(result.recorded).toBe(false);
    expect(result.safeMessage).toContain('School mismatch');
  });

  it('records low severity incident with continue_monitoring action', async () => {
    const run = await task026PilotExecutionRepository.createPilotRun({
      schoolId: 'school-1', pilotProgramId: 'pp-1', status: 'active_controlled',
      cohortIds: [], teacherOwnerId: 't1', supportOwnerId: 's1',
      safeguardingOwnerId: 'sg1', pauseOwnerId: 'p1', rollbackOwnerId: 'r1', monitoringOwnerId: 'm1',
      approvedCurriculumScopeIds: [], approvedSourceScopeIds: [],
      activatedAt: null, pausedAt: null, rolledBackAt: null, completedAt: null, cancelledAt: null,
      blockingIssues: [],
    });
    const result = await recordIncident({ schoolId: 'school-1', pilotRunId: run.id, severity: 'low', category: 'minor_issue', safeSummary: 'Low severity incident' });
    expect(result.recorded).toBe(true);
    expect(result.incidentId).toBeTruthy();
    expect(result.recommendedAction).toBe('continue_monitoring');
  });

  it('records high severity incident with pause_pilot action', async () => {
    const run = await task026PilotExecutionRepository.createPilotRun({
      schoolId: 'school-1', pilotProgramId: 'pp-1', status: 'active_controlled',
      cohortIds: [], teacherOwnerId: 't1', supportOwnerId: 's1',
      safeguardingOwnerId: 'sg1', pauseOwnerId: 'p1', rollbackOwnerId: 'r1', monitoringOwnerId: 'm1',
      approvedCurriculumScopeIds: [], approvedSourceScopeIds: [],
      activatedAt: null, pausedAt: null, rolledBackAt: null, completedAt: null, cancelledAt: null,
      blockingIssues: [],
    });
    const result = await recordIncident({ schoolId: 'school-1', pilotRunId: run.id, severity: 'high', category: 'serious_issue', safeSummary: 'High severity incident' });
    expect(result.recorded).toBe(true);
    expect(result.recommendedAction).toBe('pause_pilot');
  });

  it('records critical severity incident with block_execution action', async () => {
    const run = await task026PilotExecutionRepository.createPilotRun({
      schoolId: 'school-1', pilotProgramId: 'pp-1', status: 'active_controlled',
      cohortIds: [], teacherOwnerId: 't1', supportOwnerId: 's1',
      safeguardingOwnerId: 'sg1', pauseOwnerId: 'p1', rollbackOwnerId: 'r1', monitoringOwnerId: 'm1',
      approvedCurriculumScopeIds: [], approvedSourceScopeIds: [],
      activatedAt: null, pausedAt: null, rolledBackAt: null, completedAt: null, cancelledAt: null,
      blockingIssues: [],
    });
    const result = await recordIncident({ schoolId: 'school-1', pilotRunId: run.id, severity: 'critical', category: 'breach', safeSummary: 'Critical incident' });
    expect(result.recorded).toBe(true);
    expect(result.recommendedAction).toBe('block_execution');
  });

  it('records audit event on incident', async () => {
    const run = await task026PilotExecutionRepository.createPilotRun({
      schoolId: 'school-1', pilotProgramId: 'pp-1', status: 'active_controlled',
      cohortIds: [], teacherOwnerId: 't1', supportOwnerId: 's1',
      safeguardingOwnerId: 'sg1', pauseOwnerId: 'p1', rollbackOwnerId: 'r1', monitoringOwnerId: 'm1',
      approvedCurriculumScopeIds: [], approvedSourceScopeIds: [],
      activatedAt: null, pausedAt: null, rolledBackAt: null, completedAt: null, cancelledAt: null,
      blockingIssues: [],
    });
    await recordIncident({ schoolId: 'school-1', pilotRunId: run.id, severity: 'medium', category: 'test', safeSummary: 'Audit test' });
    const audits = await task026PilotExecutionRepository.listAuditEvents(run.id);
    expect(audits.length).toBeGreaterThanOrEqual(1);
    expect(audits.some(a => a.action === 'incident_watch_recorded')).toBe(true);
  });
});
