import { describe, it, expect } from 'vitest';
import { getTask031Diagnostics } from '../services/task031DiagnosticsService';

describe('Task 031 - Diagnostics', () => {
  it('should return all status fields with defaults', async () => {
    const diag = await getTask031Diagnostics({});
    expect(diag.task030ProofStatus).toBe('loaded');
    expect(diag.environmentGateStatus).toBe('passed');
    expect(diag.noLiveStudentGuardStatus).toBe('passed');
    expect(diag.fixtureStatus).toBe('valid');
    expect(diag.roleMatrixStatus).toBe('verified');
    expect(diag.backendRouteSmokeStatus).toBe('passed');
    expect(diag.copilotBootstrapSmokeStatus).toBe('passed');
    expect(diag.tutorContextSmokeStatus).toBe('passed');
    expect(diag.embedHandoffSmokeStatus).toBe('passed');
    expect(diag.studentPreflightSmokeStatus).toBe('passed');
  });

  it('should return teacher oversight smoke status', async () => {
    const diag = await getTask031Diagnostics({});
    expect(diag.teacherOversightSmokeStatus).toBe('passed');
  });

  it('should return admin operator monitoring status', async () => {
    const diag = await getTask031Diagnostics({});
    expect(diag.adminOperatorMonitoringSmokeStatus).toBe('passed');
  });

  it('should return operations console smoke status', async () => {
    const diag = await getTask031Diagnostics({});
    expect(diag.operationsConsoleSmokeStatus).toBe('passed');
  });

  it('should return observability baseline status', async () => {
    const diag = await getTask031Diagnostics({});
    expect(diag.observabilityBaselineStatus).toBe('captured');
  });

  it('should return latency error budget status', async () => {
    const diag = await getTask031Diagnostics({});
    expect(diag.latencyErrorBudgetStatus).toBe('passed');
  });

  it('should return canary readiness decision status', async () => {
    const diag = await getTask031Diagnostics({});
    expect(diag.canaryReadinessDecisionStatus).toBe('computed');
  });

  it('should return report status', async () => {
    const diag = await getTask031Diagnostics({});
    expect(diag.reportStatus).toBe('generated');
  });

  it('should return route mount status', async () => {
    const diag = await getTask031Diagnostics({});
    expect(diag.routeMountStatus).toBe('mounted');
  });

  it('should override individual fields', async () => {
    const diag = await getTask031Diagnostics({ environmentGateStatus: 'failed' });
    expect(diag.environmentGateStatus).toBe('failed');
    expect(diag.task030ProofStatus).toBe('loaded');
  });
});