import { describe, it, expect } from 'vitest';
import { runHardeningChecklist } from '../services/task024OperationalHardeningChecklistService';
import type { OperationalHardeningChecklistResult, OperationalHardeningChecklistItem } from '../contracts/task024OperationsContracts';

describe('runHardeningChecklist', () => {
  it('should run without throwing', async () => {
    await expect(runHardeningChecklist()).resolves.not.toThrow();
  });

  it('should return correct shape — OperationalHardeningChecklistResult', async () => {
    const result: OperationalHardeningChecklistResult = await runHardeningChecklist();
    expect(result).toBeDefined();
    expect(result).toHaveProperty('timestamp');
    expect(result).toHaveProperty('overallPass');
    expect(result).toHaveProperty('checks');
    expect(result).toHaveProperty('failedChecks');
  });

  it('should have timestamp as a non-empty string', async () => {
    const result = await runHardeningChecklist();
    expect(typeof result.timestamp).toBe('string');
    expect(result.timestamp.length).toBeGreaterThan(0);
  });

  it('should have overallPass as a boolean', async () => {
    const result = await runHardeningChecklist();
    expect(typeof result.overallPass).toBe('boolean');
  });

  it('should have checks as a non-empty array', async () => {
    const result = await runHardeningChecklist();
    expect(Array.isArray(result.checks)).toBe(true);
    expect(result.checks.length).toBeGreaterThan(0);
  });

  it('should have failedChecks as an array of strings', async () => {
    const result = await runHardeningChecklist();
    expect(Array.isArray(result.failedChecks)).toBe(true);
    for (const fc of result.failedChecks) {
      expect(typeof fc).toBe('string');
    }
  });

  it('each check should have check (string), passed (boolean), safeDetail (string)', async () => {
    const result = await runHardeningChecklist();
    for (const check of result.checks) {
      const item: OperationalHardeningChecklistItem = check;
      expect(typeof item.check).toBe('string');
      expect(item.check.length).toBeGreaterThan(0);
      expect(typeof item.passed).toBe('boolean');
      expect(typeof item.safeDetail).toBe('string');
      expect(item.safeDetail.length).toBeGreaterThan(0);
    }
  });

  it('should include environmentGateVerified check', async () => {
    const result = await runHardeningChecklist();
    const check = result.checks.find(c => c.check === 'environmentGateVerified');
    expect(check).toBeDefined();
    expect(check!.check).toBe('environmentGateVerified');
    expect(typeof check!.passed).toBe('boolean');
    expect(typeof check!.safeDetail).toBe('string');
  });

  it('should include secretMaskingVerified check', async () => {
    const result = await runHardeningChecklist();
    const check = result.checks.find(c => c.check === 'secretMaskingVerified');
    expect(check).toBeDefined();
    expect(check!.check).toBe('secretMaskingVerified');
    expect(typeof check!.passed).toBe('boolean');
    expect(typeof check!.safeDetail).toBe('string');
  });

  it('failedChecks should match the checks that did not pass', async () => {
    const result = await runHardeningChecklist();
    const expectedFailed = result.checks.filter(c => !c.passed).map(c => c.check);
    expect(result.failedChecks).toEqual(expectedFailed);
  });

  it('overallPass should be true only when failedChecks is empty', async () => {
    const result = await runHardeningChecklist();
    expect(result.overallPass).toBe(result.failedChecks.length === 0);
  });
});
