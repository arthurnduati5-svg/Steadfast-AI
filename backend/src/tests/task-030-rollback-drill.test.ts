import { describe, it, expect, beforeEach } from 'vitest';
import { runTask030RollbackDrill } from '../services/task030RollbackDrillService';
import { task030ControlledStagingRehearsalRepository } from '../repositories/task030ControlledStagingRehearsalRepository';

describe('Task 030 - Rollback Drill', () => {
  beforeEach(async () => {
    await task030ControlledStagingRehearsalRepository.clearTask030StoresForTests();
  });

  it('should complete with ok result', async () => {
    const result = await runTask030RollbackDrill({ runId: 'run_rollback_001' });
    expect(result.ok).toBe(true);
  });

  it('should have allPassed true', async () => {
    const result = await runTask030RollbackDrill({ runId: 'run_rollback_002' });
    expect(result.allPassed).toBe(true);
  });

  it('should have 4 drill steps', async () => {
    const result = await runTask030RollbackDrill({ runId: 'run_rollback_003' });
    expect(result.drillSteps).toHaveLength(4);
  });

  it('should include verify_synthetic_only step', async () => {
    const result = await runTask030RollbackDrill({ runId: 'run_rollback_004' });
    const names = result.drillSteps.map(s => s.stepName);
    expect(names).toContain('verify_synthetic_only');
  });

  it('should have destructiveDeletePrevented true', async () => {
    const result = await runTask030RollbackDrill({ runId: 'run_rollback_005' });
    expect(result.destructiveDeletePrevented).toBe(true);
  });

  it('should have auditPreserved true', async () => {
    const result = await runTask030RollbackDrill({ runId: 'run_rollback_006' });
    expect(result.auditPreserved).toBe(true);
  });

  it('should mark all steps as dry-run executed', async () => {
    const result = await runTask030RollbackDrill({ runId: 'run_rollback_007' });
    result.drillSteps.forEach(s => {
      expect(s.dryRunExecuted).toBe(true);
      expect(s.passed).toBe(true);
    });
  });

  it('should have safeSummary', async () => {
    const result = await runTask030RollbackDrill({ runId: 'run_rollback_008' });
    expect(typeof result.safeSummary).toBe('string');
  });
});
