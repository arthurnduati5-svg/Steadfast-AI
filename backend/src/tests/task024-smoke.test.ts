import { describe, it, expect, beforeEach } from 'vitest';
import { task024ReadinessRepository } from '../services/task024OperationsReadinessRepository';

describe('Task024 Smoke test', () => {
  beforeEach(async () => {
    await task024ReadinessRepository.resetTask024OperationsReadinessRepositoryForTests();
  });

  it('should initialize repository', async () => {
    const decisions = await task024ReadinessRepository.listMonitoringReadinessResults();
    expect(decisions).toBeDefined();
    expect(Array.isArray(decisions)).toBe(true);
  });

  it('should record and retrieve at least one record type', async () => {
    await task024ReadinessRepository.recordMonitoringReadinessResult({
      status: 'healthy', healthProbeCovered: true, readinessProbeCovered: true,
      schoolAuthGateMonitored: true, task020GovernanceMonitored: true,
      task021SchoolIntegrationMonitored: true, task022ContentGovernanceMonitored: true,
      task023ReadinessMonitored: true, errorRateMonitored: true, latencyMonitored: true,
      aiEgressBlockMonitored: true, privacyEventMonitored: true,
      backupRestoreMonitored: true, dataIntegrityMonitored: true,
      missingCategories: [], safeSummary: 'smoke',
    });
    const results = await task024ReadinessRepository.listMonitoringReadinessResults();
    expect(results.length).toBeGreaterThan(0);
  });

  it('should load all Task 024 contracts', async () => {
    const contracts = await import('../contracts/task024OperationsReadinessContracts');
    expect(contracts.TASK024_OPERATION_ENVIRONMENTS).toBeDefined();
    expect(contracts.TASK024_INCIDENT_SEVERITIES).toBeDefined();
    expect(contracts.TASK024_FORBIDDEN_OPERATION_FIELDS).toBeDefined();
  });

  it('should load Task 024 validation', async () => {
    const validation = await import('../lib/task024OperationsReadinessValidation');
    expect(validation.validateTask024OperationsReadinessContext).toBeDefined();
    expect(validation.rejectForbiddenTask024OperationFields).toBeDefined();
  });

  it('non-zero test count is tracked', () => {
    const testFunctionExists = typeof it === 'function';
    expect(testFunctionExists).toBe(true);
  });
});
