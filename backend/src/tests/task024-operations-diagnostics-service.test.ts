import { describe, it, expect, beforeEach } from 'vitest';
import { getOperationsReadinessHealth, getMonitoringHealth, getAlertPolicyHealth, getBackupRestoreHealth, getDataIntegrityHealth, getLoadSimulationHealth } from '../services/task024OperationsDiagnosticsService';
import { task024ReadinessRepository } from '../services/task024OperationsReadinessRepository';

describe('Task024OperationsDiagnosticsService', () => {
  beforeEach(async () => {
    await task024ReadinessRepository.resetTask024OperationsReadinessRepositoryForTests();
  });

  it('should return diagnostics with safe metadata only', async () => {
    const diags = await getOperationsReadinessHealth();
    expect(diags.length).toBeGreaterThan(0);
    for (const d of diags) {
      expect(d.component).toBeTruthy();
      expect(d.safeMessage).toBeTruthy();
      expect(d.checkedAt).toBeTruthy();
      expect(d.safeMessage).not.toContain('sk-');
      expect(d.safeMessage).not.toContain('DATABASE_URL');
    }
  });

  it('monitoring health should return diagnostic', async () => {
    const d = await getMonitoringHealth();
    expect(d.component).toBe('monitoring_readiness');
    expect(d.severity).toBe('info');
  });

  it('alert policy health should return diagnostic', async () => {
    const d = await getAlertPolicyHealth();
    expect(d.component).toBe('alert_policy');
  });

  it('backup restore health should return diagnostic', async () => {
    const d = await getBackupRestoreHealth();
    expect(d.component).toBe('backup_restore');
  });

  it('data integrity health should return diagnostic', async () => {
    const d = await getDataIntegrityHealth();
    expect(d.component).toBe('data_integrity');
  });

  it('load simulation health should return diagnostic', async () => {
    const d = await getLoadSimulationHealth();
    expect(d.component).toBe('load_simulation');
  });
});
