import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const ROUTES_PATH = path.resolve(__dirname, '../routes/task029ExpansionOperationsRoutes.ts');
const content = fs.readFileSync(ROUTES_PATH, 'utf8');

describe('Control preflight route contract', () => {
  it('control preflight route exists', () => {
    expect(content).toContain("router.post('/task029/expansion-operations/runs/:runId/control/preflight'");
  });

  it('control preflight uses controlGuard', () => {
    expect(content).toContain("'/task029/expansion-operations/runs/:runId/control/preflight', ...controlGuard");
  });

  it('control preflight checks school context', () => {
    expect(content).toMatch(/control\/preflight[^]*?NO_SCHOOL_CONTEXT/);
  });

  it('control preflight validates action in request body', () => {
    expect(content).toContain("const { action } = req.body");
    expect(content).toContain("action is required in request body");
  });

  it('control preflight calls runControlActionPreflight service', () => {
    expect(content).toContain("runControlActionPreflight");
  });

  it('control preflight returns preflight result', () => {
    expect(content).toContain("preflight: result");
  });
});
