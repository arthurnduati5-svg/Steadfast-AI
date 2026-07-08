import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const ROUTES_PATH = path.resolve(__dirname, '../routes/task029ExpansionOperationsRoutes.ts');
const content = fs.readFileSync(ROUTES_PATH, 'utf8');

describe('Dashboard route contract', () => {
  it('dashboard route GET exists under new prefix', () => {
    expect(content).toContain("router.get('/task029/expansion-operations/dashboard'");
  });

  it('dashboard route uses dashboardReadGuard', () => {
    expect(content).toContain("'/task029/expansion-operations/dashboard', ...dashboardReadGuard");
  });

  it('dashboard route checks for school context', () => {
    const dashIdx = content.indexOf("'/task029/expansion-operations/dashboard'");
    expect(dashIdx).toBeGreaterThanOrEqual(0);
    const afterDash = content.substring(dashIdx, dashIdx + 500);
    expect(afterDash).toContain('schoolId');
    expect(afterDash).toContain('NO_SCHOOL_CONTEXT');
  });

  it('dashboard route responds with dashboard data on success', () => {
    expect(content).toContain("dashboard: result.data");
  });

  it('dashboard route includes safeMessage and blockingIssues', () => {
    const dashboardBlock = content.match(/\/task029\/expansion-operations\/dashboard[^]*?(?=\n\/\/|$)/);
    expect(dashboardBlock).not.toBeNull();
    if (dashboardBlock) {
      expect(dashboardBlock[0]).toContain('safeMessage');
      expect(dashboardBlock[0]).toContain('blockingIssues');
    }
  });

  it('old dashboard path also exists', () => {
    expect(content).toContain("router.get('/pilot/expansion/operations/dashboard'");
  });
});
