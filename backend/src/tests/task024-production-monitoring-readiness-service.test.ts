import { describe, it, expect, beforeEach } from 'vitest';
import { evaluateProductionMonitoringReadiness, checkHealthProbeCoverage, checkSchoolAuthGateMonitoring, checkTask020GovernanceMonitoring, checkAiEgressBlockMonitoring, checkPrivacyEventMonitoring } from '../services/task024ProductionMonitoringReadinessService';
import { task024ReadinessRepository } from '../services/task024OperationsReadinessRepository';

describe('Task024ProductionMonitoringReadinessService', () => {
  beforeEach(async () => {
    await task024ReadinessRepository.resetTask024OperationsReadinessRepositoryForTests();
  });

  it('should evaluate monitoring readiness with all probes', async () => {
    const result = await evaluateProductionMonitoringReadiness();
    expect(result.healthProbeCovered).toBe(true);
    expect(result.readinessProbeCovered).toBe(true);
    expect(result.schoolAuthGateMonitored).toBe(true);
    expect(result.task020GovernanceMonitored).toBe(true);
    expect(result.aiEgressBlockMonitored).toBe(true);
    expect(result.privacyEventMonitored).toBe(true);
    expect(result.status).toBe('healthy');
  });

  it('should report missing categories when probes are missing', async () => {
    const result = await evaluateProductionMonitoringReadiness();
    expect(result.missingCategories).toBeDefined();
    expect(Array.isArray(result.missingCategories)).toBe(true);
  });

  it('should have backupRestoreMonitored and dataIntegrityMonitored', async () => {
    const result = await evaluateProductionMonitoringReadiness();
    expect(result.backupRestoreMonitored).toBe(true);
    expect(result.dataIntegrityMonitored).toBe(true);
  });

  it('individual probe checks should return boolean', async () => {
    expect(await checkHealthProbeCoverage()).toBe(true);
    expect(await checkSchoolAuthGateMonitoring()).toBe(true);
    expect(await checkTask020GovernanceMonitoring()).toBe(true);
    expect(await checkAiEgressBlockMonitoring()).toBe(true);
    expect(await checkPrivacyEventMonitoring()).toBe(true);
  });
});
