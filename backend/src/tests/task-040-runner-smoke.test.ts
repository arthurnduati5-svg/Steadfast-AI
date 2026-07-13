import { describe, it, expect } from 'vitest';
import { TASK040_REQUIRED_SCRIPTS, TASK040_REQUIRED_REPORTS } from '../contracts/task040BackendFreezeContracts';

describe('Task 040 - Runner Smoke', () => {
  it('defines required scripts', () => {
    expect(TASK040_REQUIRED_SCRIPTS.length).toBe(5);
    const names = TASK040_REQUIRED_SCRIPTS.map(s => s.split('/').pop());
    expect(names).toContain('verify-task040.ps1');
    expect(names).toContain('gen-task040-report.cjs');
    expect(names).toContain('task040-json-validate.cjs');
    expect(names).toContain('task040-privacy-scan.cjs');
    expect(names).toContain('run-task040-backend-freeze.cjs');
  });

  it('defines required reports', () => {
    expect(TASK040_REQUIRED_REPORTS.length).toBeGreaterThanOrEqual(5);
  });
});
