import { describe, it, expect, beforeEach } from 'vitest';
import { getTask030ControlledStagingDiagnostics } from '../services/task030ControlledStagingDiagnosticsService';
import { task030ControlledStagingRehearsalRepository } from '../repositories/task030ControlledStagingRehearsalRepository';

describe('Task 030 - Diagnostics', () => {
  beforeEach(async () => {
    await task030ControlledStagingRehearsalRepository.clearTask030StoresForTests();
  });

  it('should return diagnostics result with ok boolean', async () => {
    const result = await getTask030ControlledStagingDiagnostics({ schoolId: 'school_diag_001' });
    expect(typeof result.ok).toBe('boolean');
  });

  it('should have gate statuses', async () => {
    const result = await getTask030ControlledStagingDiagnostics({ schoolId: 'school_diag_002' });
    expect(result.task029ProofLoaderStatus).toMatch(/^(passed|failed|not_checked)$/);
    expect(result.stagingEnvironmentGateStatus).toMatch(/^(passed|failed|not_checked)$/);
    expect(result.fixtureServiceStatus).toMatch(/^(passed|failed|not_checked)$/);
  });

  it('should have role matrix status', async () => {
    const result = await getTask030ControlledStagingDiagnostics({ schoolId: 'school_diag_003' });
    expect(result.roleTokenMatrixStatus).toMatch(/^(passed|failed|not_checked)$/);
  });

  it('should have journey services status', async () => {
    const result = await getTask030ControlledStagingDiagnostics({ schoolId: 'school_diag_004' });
    expect(result.journeyServicesStatus).toMatch(/^(passed|failed|not_checked)$/);
  });

  it('should have operations console status', async () => {
    const result = await getTask030ControlledStagingDiagnostics({ schoolId: 'school_diag_005' });
    expect(result.operationsConsoleRehearsalStatus).toMatch(/^(passed|failed|not_checked)$/);
  });

  it('should have rollback drill status', async () => {
    const result = await getTask030ControlledStagingDiagnostics({ schoolId: 'school_diag_006' });
    expect(result.rollbackDrillStatus).toMatch(/^(passed|failed|not_checked)$/);
  });

  it('should have safety scan readiness', async () => {
    const result = await getTask030ControlledStagingDiagnostics({ schoolId: 'school_diag_007' });
    expect(result.safetyScanReadiness).toMatch(/^(passed|failed|not_checked)$/);
  });

  it('should have blockingIssues array', async () => {
    const result = await getTask030ControlledStagingDiagnostics({ schoolId: 'school_diag_008' });
    expect(Array.isArray(result.blockingIssues)).toBe(true);
  });
});
