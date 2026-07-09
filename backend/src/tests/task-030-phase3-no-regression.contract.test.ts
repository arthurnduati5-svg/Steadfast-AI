import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Task 030 - Phase 3 No Regression Contract', () => {
  const baseDir = path.resolve(__dirname, '..');
  const testDir = path.resolve(__dirname);

  it('should have phase3 objective contract test file exist', () => {
    const file = path.join(testDir, 'phase3-objective-contracts.test.ts');
    expect(fs.existsSync(file)).toBe(true);
  });

  it('should have phase3 objective smoke test file exist', () => {
    const file = path.join(testDir, 'phase3-objective-smoke.test.ts');
    expect(fs.existsSync(file)).toBe(true);
  });

  it('should have phase3 daily learning feed contract test file exist', () => {
    const file = path.join(testDir, 'phase3-daily-learning-feed-contracts.test.ts');
    expect(fs.existsSync(file)).toBe(true);
  });

  it('should have phase3 study plan contract test file exist', () => {
    const file = path.join(testDir, 'phase3-study-plan-contracts.test.ts');
    expect(fs.existsSync(file)).toBe(true);
  });

  it('should have phase3 growth page contract test file exist', () => {
    const file = path.join(testDir, 'phase3-growth-page-contracts.test.ts');
    expect(fs.existsSync(file)).toBe(true);
  });

  it('should have phase3 living revision contract test file exist', () => {
    const file = path.join(testDir, 'phase3-living-revision-contracts.test.ts');
    expect(fs.existsSync(file)).toBe(true);
  });

  it('should have phase3 confidence recovery contract test file exist', () => {
    const file = path.join(testDir, 'phase3-confidence-recovery-contracts.test.ts');
    expect(fs.existsSync(file)).toBe(true);
  });

  it('should have phase3 parent support contract test file exist', () => {
    const file = path.join(testDir, 'phase3-parent-support-contracts.test.ts');
    expect(fs.existsSync(file)).toBe(true);
  });

  it('should have phase3 peer learning contract test file exist', () => {
    const file = path.join(testDir, 'phase3-peer-learning-contracts.test.ts');
    expect(fs.existsSync(file)).toBe(true);
  });

  it('should have at least 20 phase3 test files', () => {
    const allTests = fs.readdirSync(testDir).filter((f: string) => f.startsWith('phase3'));
    expect(allTests.length).toBeGreaterThanOrEqual(20);
  });
});
