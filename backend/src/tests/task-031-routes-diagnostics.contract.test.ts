import { describe, it, expect } from 'vitest';
import { getTask031Diagnostics } from '../services/task031DiagnosticsService';

describe('Task 031 - GET /diagnostics contract', () => {
  it('should return all diagnostics fields with defaults', async () => {
    const diag = await getTask031Diagnostics({});
    expect(diag.task030ProofStatus).toBe('loaded');
    expect(diag.environmentGateStatus).toBe('passed');
    expect(diag.noLiveStudentGuardStatus).toBe('passed');
    expect(diag.fixtureStatus).toBe('valid');
    expect(diag.roleMatrixStatus).toBe('verified');
  });

  it('should include all smoke statuses', async () => {
    const diag = await getTask031Diagnostics({});
    expect(diag.backendRouteSmokeStatus).toBe('passed');
    expect(diag.copilotBootstrapSmokeStatus).toBe('passed');
    expect(diag.tutorContextSmokeStatus).toBe('passed');
    expect(diag.embedHandoffSmokeStatus).toBe('passed');
    expect(diag.studentPreflightSmokeStatus).toBe('passed');
  });

  it('should include oversight and monitoring results', async () => {
    const diag = await getTask031Diagnostics({});
    expect(diag.teacherOversightSmokeStatus).toBe('passed');
    expect(diag.adminOperatorMonitoringSmokeStatus).toBe('passed');
    expect(diag.operationsConsoleSmokeStatus).toBe('passed');
  });

  it('should include observability and readiness decision', async () => {
    const diag = await getTask031Diagnostics({});
    expect(diag.observabilityBaselineStatus).toBe('captured');
    expect(diag.latencyErrorBudgetStatus).toBe('passed');
    expect(diag.canaryReadinessDecisionStatus).toBe('computed');
  });

  it('should include report and route mount status', async () => {
    const diag = await getTask031Diagnostics({});
    expect(diag.reportStatus).toBe('generated');
    expect(diag.routeMountStatus).toBe('mounted');
  });

  it('should accept overrides for any status', async () => {
    const diag = await getTask031Diagnostics({ task030ProofStatus: 'failed' });
    expect(diag.task030ProofStatus).toBe('failed');
    expect(diag.environmentGateStatus).toBe('passed');
  });
});
