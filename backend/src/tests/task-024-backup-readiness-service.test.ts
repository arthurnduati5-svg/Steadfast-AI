import { describe, it, expect } from 'vitest';
import { evaluateBackupReadiness } from '../services/task024BackupReadinessService';

describe('task024BackupReadinessService', () => {
  it('returns correct shape (Task024BackupReadinessResult)', async () => {
    const result = await evaluateBackupReadiness();

    expect(result).toBeDefined();
    expect(typeof result.status).toBe('string');
    expect(typeof result.scopeDefined).toBe('boolean');
    expect(typeof result.ownerDefined).toBe('boolean');
    expect(typeof result.scheduleDefined).toBe('boolean');
    expect(typeof result.integrityCheckDefined).toBe('boolean');
    expect(typeof result.privacyBoundaryDefined).toBe('boolean');
    expect(typeof result.noRawOutput).toBe('boolean');
    expect(typeof result.safeSummary).toBe('string');
  });

  it('result has all required fields', async () => {
    const result = await evaluateBackupReadiness();

    const expectedKeys = [
      'status',
      'scopeDefined',
      'ownerDefined',
      'scheduleDefined',
      'integrityCheckDefined',
      'privacyBoundaryDefined',
      'noRawOutput',
      'safeSummary',
    ];
    for (const key of expectedKeys) {
      expect(result).toHaveProperty(key);
    }
  });

  it('safeSummary does NOT expose raw database URLs or secrets', async () => {
    const result = await evaluateBackupReadiness();

    expect(result.safeSummary).not.toMatch(/:\/\//);
  });

  it('all readiness flags are true by default', async () => {
    const result = await evaluateBackupReadiness();

    expect(result.scopeDefined).toBe(true);
    expect(result.ownerDefined).toBe(true);
    expect(result.scheduleDefined).toBe(true);
    expect(result.integrityCheckDefined).toBe(true);
    expect(result.privacyBoundaryDefined).toBe(true);
    expect(result.noRawOutput).toBe(true);
  });

  it('status is ready when all checks pass', async () => {
    const result = await evaluateBackupReadiness();

    expect(result.status).toBe('ready');
    expect(result.safeSummary).toContain('all checks passed');
  });

  it('safeSummary mentions backup readiness', async () => {
    const result = await evaluateBackupReadiness();

    const summary = result.safeSummary.toLowerCase();
    expect(summary).toMatch(/backup|readiness/);
  });
});
