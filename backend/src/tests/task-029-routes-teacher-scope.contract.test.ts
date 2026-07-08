import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const ROUTES_PATH = path.resolve(__dirname, '../routes/task029ExpansionOperationsRoutes.ts');
const content = fs.readFileSync(ROUTES_PATH, 'utf8');

describe('Teacher scope contract', () => {
  it('teacherOversightGuard is defined with admin role', () => {
    expect(content).toContain("const teacherOversightGuard = [schoolAuthMiddleware, requireRole('admin')]");
  });

  it('teacher oversight route exists under run prefix', () => {
    expect(content).toContain("'/task029/expansion-operations/runs/:runId/teacher-oversight'");
  });

  it('teacher oversight route uses teacherOversightGuard', () => {
    expect(content).toContain("teacher-oversight', ...teacherOversightGuard");
  });

  it('teacher oversight checks school context', () => {
    expect(content).toMatch(/teacher-oversight[^]*?schoolId[^]*?NO_SCHOOL_CONTEXT/);
  });

  it('teacher oversight returns teacherOversight data', () => {
    expect(content).toContain("teacherOversight: result.data");
  });
});
