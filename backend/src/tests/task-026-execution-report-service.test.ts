import { describe, it, expect, beforeEach } from 'vitest';
import { generateReport } from '../services/task026ExecutionReportService';
import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';

describe('task026ExecutionReportService', () => {
  beforeEach(() => {
    task026PilotExecutionRepository.clearTask026StoresForTests();
  });

  it('rejects missing runId', async () => {
    const result = await generateReport('', { schoolId: 's1', actorId: 'a1', actorRole: 'school_admin' });
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('missing_run_id');
  });

  it('rejects non-existent run', async () => {
    const result = await generateReport('nonexistent', { schoolId: 's1', actorId: 'a1', actorRole: 'school_admin' });
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('run_not_found');
  });

  it('generates report with dependency gates', async () => {
    await task026PilotExecutionRepository.createPilotRun({
      schoolId: 'school-1', pilotProgramId: 'pp-1', status: 'active_controlled',
      cohortIds: ['c1'], teacherOwnerId: 't1', supportOwnerId: 's1',
      safeguardingOwnerId: 'sg1', pauseOwnerId: 'p1', rollbackOwnerId: 'r1', monitoringOwnerId: 'm1',
      approvedCurriculumScopeIds: ['cur1'], approvedSourceScopeIds: ['src1'],
      activatedAt: null, pausedAt: null, rolledBackAt: null, completedAt: null, cancelledAt: null,
      blockingIssues: [],
    });
    const result = await generateReport('run-1', { schoolId: 'school-1', actorId: 'a1', actorRole: 'school_admin' });
    expect(result.ok).toBe(true);
    expect(result.report).toBeTruthy();
    expect(result.report!.taskId).toBe('task026');
    expect(result.report!.dependencyGateResults.length).toBeGreaterThan(3);
    expect(result.report!.safeToStartTask027).toBe(false);
  });

  it('report includes all gate result shapes', async () => {
    await task026PilotExecutionRepository.createPilotRun({
      schoolId: 'school-1', pilotProgramId: 'pp-1', status: 'active_controlled',
      cohortIds: ['c1'], teacherOwnerId: 't1', supportOwnerId: 's1',
      safeguardingOwnerId: 'sg1', pauseOwnerId: 'p1', rollbackOwnerId: 'r1', monitoringOwnerId: 'm1',
      approvedCurriculumScopeIds: ['cur1'], approvedSourceScopeIds: ['src1'],
      activatedAt: null, pausedAt: null, rolledBackAt: null, completedAt: null, cancelledAt: null,
      blockingIssues: [],
    });
    const result = await generateReport('run-1', { schoolId: 'school-1', actorId: 'a1', actorRole: 'school_admin' });
    for (const gate of result.report!.dependencyGateResults) {
      expect(gate).toHaveProperty('gate');
      expect(gate).toHaveProperty('status');
      expect(gate).toHaveProperty('reasonCodes');
      expect(gate).toHaveProperty('safeMessage');
    }
  });

  it('report includes routeProtectionResult as routes_blocked when gates fail', async () => {
    const result = await generateReport('run-1', { schoolId: 'school-1', actorId: 'a1', actorRole: 'school_admin' });
    expect(result.report!.routeProtectionResult).toBe('routes_blocked');
  });

  it('records audit event on report generation', async () => {
    await task026PilotExecutionRepository.createPilotRun({
      schoolId: 'school-1', pilotProgramId: 'pp-1', status: 'active_controlled',
      cohortIds: [], teacherOwnerId: 't1', supportOwnerId: 's1',
      safeguardingOwnerId: 'sg1', pauseOwnerId: 'p1', rollbackOwnerId: 'r1', monitoringOwnerId: 'm1',
      approvedCurriculumScopeIds: [], approvedSourceScopeIds: [],
      activatedAt: null, pausedAt: null, rolledBackAt: null, completedAt: null, cancelledAt: null,
      blockingIssues: [],
    });
    await generateReport('run-1', { schoolId: 'school-1', actorId: 'a1', actorRole: 'school_admin' });
    const audits = await task026PilotExecutionRepository.listAuditEvents('run-1');
    expect(audits.some(a => a.action === 'report_viewed')).toBe(true);
  });

  it('safeToStartTask027 reflects all gates passed', async () => {
    const result = await generateReport('run-1', { schoolId: 'school-1', actorId: 'a1', actorRole: 'school_admin' });
    expect(typeof result.report!.safeToStartTask027).toBe('boolean');
    expect(result.report!.remainingBlockers.length).toBeGreaterThan(0);
  });
});
