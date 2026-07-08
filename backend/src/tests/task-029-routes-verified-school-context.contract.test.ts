import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const ROUTES_PATH = path.resolve(__dirname, '../routes/task029ExpansionOperationsRoutes.ts');
const content = fs.readFileSync(ROUTES_PATH, 'utf8');

describe('Verified school context contract', () => {
  it('getSchoolId helper extracts schoolId from request', () => {
    expect(content).toContain('(req as any).schoolId');
    expect(content).toContain('(req as any).verifiedSchoolIdentity?.schoolId');
  });

  it('dashboard route calls getSchoolId and checks for falsy', () => {
    const dashboardBlock = content.match(/\/task029\/expansion-operations\/dashboard[^]*?NO_SCHOOL_CONTEXT/);
    expect(dashboardBlock).not.toBeNull();
  });

  it('diagnostics route checks school context before running', () => {
    const diagBlock = content.match(/\/task029\/expansion-operations\/diagnostics[^]*?NO_SCHOOL_CONTEXT/);
    expect(diagBlock).not.toBeNull();
  });

  it('status routes under /runs/ all check school context', () => {
    const runRoutes = content.match(/\/task029\/expansion-operations\/runs\/:runId\/[a-z-]+[^]*?NO_SCHOOL_CONTEXT/g);
    expect(runRoutes).not.toBeNull();
    if (runRoutes) expect(runRoutes.length).toBeGreaterThanOrEqual(5);
  });

  it('control routes all check school context via getSchoolId', () => {
    const controlBlocks = content.match(/\/task029\/expansion-operations\/runs\/:runId\/control\/[a-z-]+[^]*?NO_SCHOOL_CONTEXT/g);
    expect(controlBlocks).not.toBeNull();
    if (controlBlocks) expect(controlBlocks.length).toBeGreaterThanOrEqual(5);
  });

  it('report generate route checks school context', () => {
    expect(content).toMatch(/\/task029\/expansion-operations\/report\/generate[^]*?NO_SCHOOL_CONTEXT/);
  });
});
