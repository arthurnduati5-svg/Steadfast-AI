import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generateReadinessDiagnostics } from '../services/task025ReadinessDiagnosticsService';
import { task025PilotReadinessRepository } from '../services/task025PilotReadinessRepository';
import type { DiagnosticsInput } from '../services/task025ReadinessDiagnosticsService';

function makeInput(overrides: Partial<DiagnosticsInput> = {}): DiagnosticsInput {
  return {
    schoolId: 'school-001',
    schoolVerified: true,
    scopeGatePassed: true,
    cohortReadinessPassed: true,
    teacherWorkflowPassed: true,
    adminAcceptancePassed: true,
    parentCommunicationPassed: true,
    safeguardingPassed: true,
    supportOperationsPassed: true,
    monitoringGatePassed: true,
    pauseRollbackPassed: true,
    dataPrivacyPassed: true,
    task020ContinuityPassed: true,
    task021ContinuityPassed: true,
    task022ContinuityPassed: true,
    task023ContinuityPassed: true,
    task024ContinuityPassed: true,
    ...overrides,
  };
}

describe('generateReadinessDiagnostics', () => {
  beforeEach(() => {
    task025PilotReadinessRepository.clearStores();
  });

  it('returns ready_to_start_task026 when all 15 gates pass', async () => {
    const result = await generateReadinessDiagnostics(makeInput());
    expect(result.overallDecision).toBe('ready_to_start_task026');
    expect(result.safeSummary).toBe('All readiness diagnostics passed.');
  });

  it('returns manual_review_required when 1 gate fails', async () => {
    const result = await generateReadinessDiagnostics(makeInput({ scopeGatePassed: false }));
    expect(result.overallDecision).toBe('manual_review_required');
    expect(result.safeSummary).toContain('1 of 15');
  });

  it('returns manual_review_required when exactly 3 gates fail', async () => {
    const result = await generateReadinessDiagnostics(makeInput({
      scopeGatePassed: false,
      cohortReadinessPassed: false,
      teacherWorkflowPassed: false,
    }));
    expect(result.overallDecision).toBe('manual_review_required');
    expect(result.safeSummary).toContain('3 of 15');
  });

  it('returns not_ready when 4 or more gates fail', async () => {
    const result = await generateReadinessDiagnostics(makeInput({
      scopeGatePassed: false,
      cohortReadinessPassed: false,
      teacherWorkflowPassed: false,
      adminAcceptancePassed: false,
      parentCommunicationPassed: false,
    }));
    expect(result.overallDecision).toBe('not_ready');
    expect(result.safeSummary).toContain('5 of 15');
  });

  it('returns not_ready when all 15 gates fail', async () => {
    const result = await generateReadinessDiagnostics(makeInput({
      scopeGatePassed: false,
      cohortReadinessPassed: false,
      teacherWorkflowPassed: false,
      adminAcceptancePassed: false,
      parentCommunicationPassed: false,
      safeguardingPassed: false,
      supportOperationsPassed: false,
      monitoringGatePassed: false,
      pauseRollbackPassed: false,
      dataPrivacyPassed: false,
      task020ContinuityPassed: false,
      task021ContinuityPassed: false,
      task022ContinuityPassed: false,
      task023ContinuityPassed: false,
      task024ContinuityPassed: false,
    }));
    expect(result.overallDecision).toBe('not_ready');
    expect(result.safeSummary).toContain('15 of 15');
  });

  it('passes through all gate booleans from input', async () => {
    const result = await generateReadinessDiagnostics(makeInput({
      scopeGatePassed: true,
      safeguardingPassed: false,
      dataPrivacyPassed: true,
    }));
    expect(result.schoolId).toBe('school-001');
    expect(result.schoolVerified).toBe(true);
    expect(result.scopeGatePassed).toBe(true);
    expect(result.safeguardingPassed).toBe(false);
    expect(result.dataPrivacyPassed).toBe(true);
  });
});
