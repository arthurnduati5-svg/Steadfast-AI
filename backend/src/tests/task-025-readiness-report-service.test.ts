import { describe, it, expect, beforeEach } from 'vitest';
import { generateReadinessReport } from '../services/task025ReadinessReportService';
import { task025PilotReadinessRepository } from '../services/task025PilotReadinessRepository';
import type { ReportGenerationInput } from '../services/task025ReadinessReportService';

function makeInput(overrides: Partial<ReportGenerationInput> = {}): ReportGenerationInput {
  return {
    schoolId: 'school-001',
    schoolVerified: true,
    scopeGateStatus: 'scope_approved',
    cohortReadinessStatus: 'cohort_ready',
    teacherWorkflowStatus: 'passed',
    adminAcceptanceStatus: 'accepted',
    parentCommunicationStatus: 'completed',
    safeguardingStatus: 'passed',
    supportOperationsStatus: 'ready',
    monitoringGateStatus: 'passed',
    pauseRollbackStatus: 'configured',
    dataPrivacyStatus: 'passed',
    overallDecision: 'ready_to_start_task026',
    task026SafeToStart: true,
    requiredActions: [],
    ...overrides,
  };
}

describe('generateReadinessReport', () => {
  beforeEach(() => {
    task025PilotReadinessRepository.clearStores();
  });

  it('returns a complete report with all fields when safe to start', async () => {
    const report = await generateReadinessReport(makeInput(), 'admin', 'req-001');
    expect(report.taskId).toBe('TASK-025');
    expect(report.schoolId).toBe('school-001');
    expect(report.schoolVerified).toBe(true);
    expect(report.overallDecision).toBe('ready_to_start_task026');
    expect(report.task026SafeToStart).toBe(true);
    expect(report.safeSummary).toBe('All readiness checks passed. The school is ready to begin a controlled pilot.');
  });

  it('returns safe summary indicating blocking issues when not safe to start', async () => {
    await task025PilotReadinessRepository.writeReadinessCheck('school-001', 'scope', 'failed', 'Scope not approved.', ['missing scope']);
    await task025PilotReadinessRepository.writeReadinessCheck('school-001', 'cohort', 'failed', 'Cohort not ready.', ['no cohort']);

    const report = await generateReadinessReport(makeInput({
      overallDecision: 'not_ready',
      task026SafeToStart: false,
      requiredActions: ['Approve pilot scope', 'Configure cohort'],
    }), 'admin', 'req-002');

    expect(report.task026SafeToStart).toBe(false);
    expect(report.safeSummary).toContain('blocking issue(s)');
    expect(report.safeSummary).toContain('2');
    expect(report.requiredActions).toEqual(['Approve pilot scope', 'Configure cohort']);
  });

  it('writes an audit event when report is generated', async () => {
    await generateReadinessReport(makeInput(), 'internal_operator', 'req-003');
    const audit = await task025PilotReadinessRepository.listAuditEvents('school-001');
    expect(audit).toHaveLength(1);
    expect(audit[0].eventType).toBe('report_generated');
    expect(audit[0].actorRole).toBe('internal_operator');
    expect(audit[0].requestId).toBe('req-003');
  });

  it('returns reportGeneratedAt as a valid ISO timestamp', async () => {
    const report = await generateReadinessReport(makeInput(), 'admin', 'req-004');
    const parsed = new Date(report.reportGeneratedAt);
    expect(parsed.toISOString()).toBe(report.reportGeneratedAt);
  });

  it('propagates all status fields from input to report', async () => {
    const input = makeInput({
      scopeGateStatus: 'scope_blocked',
      cohortReadinessStatus: 'cohort_blocked',
      overallDecision: 'not_ready',
      task026SafeToStart: false,
    });
    const report = await generateReadinessReport(input, 'school_admin', 'req-005');
    expect(report.scopeGateStatus).toBe('scope_blocked');
    expect(report.cohortReadinessStatus).toBe('cohort_blocked');
    expect(report.overallDecision).toBe('not_ready');
    expect(report.task026SafeToStart).toBe(false);
  });

  it('includes blockingBlockerCount from stored diagnostics', async () => {
    await task025PilotReadinessRepository.writeReadinessCheck('school-001', 'scope', 'failed', 'Scope failed.', ['failed']);
    await task025PilotReadinessRepository.writeReadinessCheck('school-001', 'cohort', 'failed', 'Cohort failed.', ['failed']);
    await task025PilotReadinessRepository.writeReadinessCheck('school-001', 'teacher', 'passed', 'Teacher passed.', []);

    const report = await generateReadinessReport(makeInput({ task026SafeToStart: false }), 'admin', 'req-006');
    expect(report.blockingBlockerCount).toBe(2);
  });
});
