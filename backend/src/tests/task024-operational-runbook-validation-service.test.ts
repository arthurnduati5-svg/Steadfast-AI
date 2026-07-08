import { describe, it, expect, beforeEach } from 'vitest';
import { validateOperationalRunbook } from '../services/task024OperationalRunbookValidationService';
import { task024ReadinessRepository } from '../services/task024OperationsReadinessRepository';

describe('Task024OperationalRunbookValidationService', () => {
  beforeEach(async () => {
    await task024ReadinessRepository.resetTask024OperationsReadinessRepositoryForTests();
  });

  it('should validate all runbook sections', async () => {
    const result = await validateOperationalRunbook();
    expect(result.status).toBe('passed');
    expect(result.monitoringRunbookValid).toBe(true);
    expect(result.incidentRunbookValid).toBe(true);
    expect(result.backupRunbookValid).toBe(true);
    expect(result.restoreRunbookValid).toBe(true);
    expect(result.dataIntegrityRunbookValid).toBe(true);
    expect(result.loadSimulationRunbookValid).toBe(true);
    expect(result.privacyEscalationRunbookValid).toBe(true);
  });

  it('should have no missing sections', async () => {
    const result = await validateOperationalRunbook();
    expect(result.missingSections).toHaveLength(0);
  });
});
