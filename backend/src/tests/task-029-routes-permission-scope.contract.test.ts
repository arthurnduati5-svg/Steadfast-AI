import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const ROUTES_PATH = path.resolve(__dirname, '../routes/task029ExpansionOperationsRoutes.ts');
const content = fs.readFileSync(ROUTES_PATH, 'utf8');

describe('Route permission scoping contract', () => {
  it('dashboardReadGuard is defined using schoolAuthMiddleware and admin role', () => {
    const match = content.match(/const dashboardReadGuard\s*=\s*\[schoolAuthMiddleware,\s*requireRole\('(\w+)'\)\]/);
    expect(match).not.toBeNull();
    if (match) expect(match[1]).toBe('admin');
  });

  it('adminGuard is defined for admin-only ops', () => {
    expect(content).toContain("const adminGuard = [schoolAuthMiddleware, requireRole('admin')]");
  });

  it('controlGuard is defined and requires admin role', () => {
    expect(content).toContain("const controlGuard = [schoolAuthMiddleware, requireRole('admin')]");
  });

  it('diagnosticsReportGuard requires admin role', () => {
    expect(content).toContain("const diagnosticsReportGuard = [schoolAuthMiddleware, requireRole('admin')]");
  });

  it('learnerGuard is defined with student role', () => {
    expect(content).toContain("const learnerGuard = [schoolAuthMiddleware, requireRole('student')]");
  });
});
