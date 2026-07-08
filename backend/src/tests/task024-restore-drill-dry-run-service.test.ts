import { describe, it, expect, beforeEach } from 'vitest';
import { evaluateRestoreDrillDryRun, blockRealRestoreAttempt } from '../services/task024RestoreDrillDryRunService';
import { task024ReadinessRepository } from '../services/task024OperationsReadinessRepository';

describe('Task024RestoreDrillDryRunService', () => {
  beforeEach(async () => {
    await task024ReadinessRepository.resetTask024OperationsReadinessRepositoryForTests();
  });

  it('should pass dry-run with real restore blocked', async () => {
    const result = await evaluateRestoreDrillDryRun();
    expect(result.status).toBe('dry_run_passed');
    expect(result.dryRunMode).toBe(true);
    expect(result.realRestoreBlocked).toBe(true);
  });

  it('should have restore plan, owner, integrity verification, privacy boundary', async () => {
    const result = await evaluateRestoreDrillDryRun();
    expect(result.restorePlanDefined).toBe(true);
    expect(result.ownerDefined).toBe(true);
    expect(result.integrityVerificationDefined).toBe(true);
    expect(result.privacyBoundaryDefined).toBe(true);
    expect(result.rollbackDefined).toBe(true);
  });

  it('should block real restore attempt', async () => {
    expect(await blockRealRestoreAttempt()).toBe(true);
  });
});
