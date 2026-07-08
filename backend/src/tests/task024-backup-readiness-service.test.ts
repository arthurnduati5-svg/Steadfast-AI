import { describe, it, expect, beforeEach } from 'vitest';
import { evaluateBackupReadiness, validateNoRawBackupOutput } from '../services/task024BackupReadinessService';
import { task024ReadinessRepository } from '../services/task024OperationsReadinessRepository';

describe('Task024BackupReadinessService', () => {
  beforeEach(async () => {
    await task024ReadinessRepository.resetTask024OperationsReadinessRepositoryForTests();
  });

  it('should return ready when all checks pass', async () => {
    const result = await evaluateBackupReadiness();
    expect(result.status).toBe('ready');
    expect(result.scopeDefined).toBe(true);
    expect(result.ownerDefined).toBe(true);
    expect(result.scheduleDefined).toBe(true);
    expect(result.integrityCheckDefined).toBe(true);
    expect(result.privacyBoundaryDefined).toBe(true);
  });

  it('should reject raw backup output', async () => {
    const result = await evaluateBackupReadiness();
    expect(result.noRawOutput).toBe(true);
  });

  it('validateNoRawBackupOutput should return true', async () => {
    expect(await validateNoRawBackupOutput()).toBe(true);
  });
});
