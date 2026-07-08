import { describe, it, expect, beforeEach } from 'vitest';
import { runRestoreDrill, getDrillHistory } from '../services/task024RestoreDrillService';
import { task024OpsRepository } from '../repositories/task024OpsRepository';

describe('task024RestoreDrillService', () => {
  beforeEach(() => {
    task024OpsRepository._clearMemory();
    delete process.env.RESTORE_PROCEDURE_DOCUMENTED;
  });

  it('returns correct shape', async () => {
    const result = await runRestoreDrill({ useTestFixture: true, fixtureName: 'test_fixture_default' });
    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('drillType');
    expect(result).toHaveProperty('dataSource');
    expect(result).toHaveProperty('recordsRestored');
    expect(result).toHaveProperty('integrityChecksPassed');
    expect(result).toHaveProperty('integrityCheckDetails');
    expect(result).toHaveProperty('destructiveCommandExecuted');
    expect(result).toHaveProperty('realProductionDataOverwritten');
    expect(result).toHaveProperty('manualApprovalBeforeRestore');
    expect(result).toHaveProperty('safeSummary');
    expect(result).toHaveProperty('persistedId');
    expect(result).toHaveProperty('drillId');
  });

  it('result shows success (simulated)', async () => {
    process.env.RESTORE_PROCEDURE_DOCUMENTED = 'true';
    const result = await runRestoreDrill({ useTestFixture: true });
    expect(result.success).toBe(true);
  });

  it('destructiveCommandExecuted is false', async () => {
    const result = await runRestoreDrill({ useTestFixture: true });
    expect(result.destructiveCommandExecuted).toBe(false);
  });

  it('realProductionDataOverwritten is false', async () => {
    const result = await runRestoreDrill({ useTestFixture: true });
    expect(result.realProductionDataOverwritten).toBe(false);
  });

  it('manualApprovalBeforeRestore is true', async () => {
    const result = await runRestoreDrill({ useTestFixture: true });
    expect(result.manualApprovalBeforeRestore).toBe(true);
  });

  it('drillType is test_fixture_restore with default fixture', async () => {
    const result = await runRestoreDrill({ useTestFixture: true });
    expect(result.drillType).toBe('test_fixture_restore');
  });

  it('drillType is simulated_validation when fixture not used', async () => {
    const result = await runRestoreDrill({ useTestFixture: false });
    expect(result.drillType).toBe('simulated_validation');
  });

  it('restores correct record count from fixture', async () => {
    const result = await runRestoreDrill({ useTestFixture: true, fixtureName: 'test_fixture_default' });
    expect(result.recordsRestored).toBe(42);
  });

  it('returns zero records restored when fixture not used', async () => {
    const result = await runRestoreDrill({ useTestFixture: false });
    expect(result.recordsRestored).toBe(0);
  });

  it('multiple drills can be run and history tracked', async () => {
    process.env.RESTORE_PROCEDURE_DOCUMENTED = 'true';
    await runRestoreDrill({ useTestFixture: true, fixtureName: 'test_fixture_default' });
    await runRestoreDrill({ useTestFixture: true, fixtureName: 'test_fixture_curriculum' });

    const history = await getDrillHistory(10);
    expect(history.length).toBeGreaterThanOrEqual(2);
  });

  it('getDrillHistory returns previous results', async () => {
    process.env.RESTORE_PROCEDURE_DOCUMENTED = 'true';
    await runRestoreDrill({ useTestFixture: true, fixtureName: 'test_fixture_default' });
    const history = await getDrillHistory(10);
    expect(history.length).toBeGreaterThanOrEqual(1);
  });

  it('safeSummary contains fixture info when procedure documented', async () => {
    process.env.RESTORE_PROCEDURE_DOCUMENTED = 'true';
    const result = await runRestoreDrill({ useTestFixture: true, fixtureName: 'test_fixture_default' });
    expect(result.safeSummary).toContain('test_fixture_default');
    expect(result.safeSummary).toContain('42');
  });

  it('safeSummary indicates simulated mode when no procedure', async () => {
    const result = await runRestoreDrill({ useTestFixture: true });
    expect(result.safeSummary).toContain('simulated');
  });
});
