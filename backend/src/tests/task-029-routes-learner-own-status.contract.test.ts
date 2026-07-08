import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const ROUTES_PATH = path.resolve(__dirname, '../routes/task029ExpansionOperationsRoutes.ts');
const content = fs.readFileSync(ROUTES_PATH, 'utf8');

describe('Learner own status route contract', () => {
  it('learner own status route exists under new prefix', () => {
    expect(content).toContain("router.get('/task029/expansion-operations/learner/own-status'");
  });

  it('learner own status route uses learnerGuard with student role', () => {
    expect(content).toContain("'/task029/expansion-operations/learner/own-status', ...learnerGuard");
  });

  it('learner own status checks school context', () => {
    expect(content).toMatch(/\/task029\/expansion-operations\/learner\/own-status[^]*?NO_SCHOOL_CONTEXT/);
  });

  it('learner own status uses getLearnerOwnStatus service', () => {
    expect(content).toContain("getLearnerOwnStatus");
  });

  it('learner own status returns status in response', () => {
    expect(content).toContain("status: result.data");
  });

  it('old student own status path also exists', () => {
    expect(content).toContain("router.get('/pilot/expansion/operations/student/own-status'");
  });
});
