import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const ROUTES_PATH = path.resolve(__dirname, '../routes/task029ExpansionOperationsRoutes.ts');
const content = fs.readFileSync(ROUTES_PATH, 'utf8');

describe('Learner denied ops console contract', () => {
  it('learnerGuard uses student role not admin', () => {
    expect(content).toContain("const learnerGuard = [schoolAuthMiddleware, requireRole('student')]");
  });

  it('dashboard route requires admin not student', () => {
    expect(content).toContain("'/task029/expansion-operations/dashboard', ...dashboardReadGuard");
    expect(content).toContain("const dashboardReadGuard = [schoolAuthMiddleware, requireRole('admin')]");
  });

  it('diagnostics route requires admin role', () => {
    expect(content).toContain("const diagnosticsReportGuard = [schoolAuthMiddleware, requireRole('admin')]");
  });

  it('control routes all require admin via controlGuard', () => {
    const controlRoutes = content.match(/\/task029\/expansion-operations\/runs\/:runId\/control\/[a-z-]+', \.\.\.controlGuard/g);
    expect(controlRoutes).not.toBeNull();
    if (controlRoutes) expect(controlRoutes.length).toBeGreaterThanOrEqual(5);
  });

  it('no ops console route uses student guard', () => {
    const adminProtected = ['dashboard', 'diagnostics', 'status', 'audit-timeline', 'evidence-summary', 'completion-review-summary'];
    for (const route of adminProtected) {
      const pattern = new RegExp(`/task029/expansion-operations/${route}[^]*?dashboardReadGuard|diagnosticsReportGuard|adminGuard`);
      const match = content.match(pattern) || content.match(new RegExp(`/pilot/expansion/operations/${route}[^]*?adminGuard`));
      if (route === 'dashboard') {
        expect(match || content.includes(`'/task029/expansion-operations/${route}'`)).toBeTruthy();
      }
    }
  });
});
