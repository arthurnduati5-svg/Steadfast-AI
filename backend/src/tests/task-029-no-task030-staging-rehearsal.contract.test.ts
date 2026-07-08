import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Task 029 – No Task 030 Staging Rehearsal Code', () => {
  const routePath = path.resolve(__dirname, '../routes/task029ExpansionOperationsRoutes.ts');
  const routeSource = fs.readFileSync(routePath, 'utf8');

  it('routes must not contain staging rehearsal endpoints', () => {
    expect(routeSource).not.toMatch(/staging.?rehearsal/i);
    expect(routeSource).not.toMatch(/\/staging/);
  });

  it('routes must not implement stage activation or deployment commands', () => {
    expect(routeSource).not.toContain('staging_rehearsal');
    expect(routeSource).not.toContain('execute_staging');
  });

  it('control action service must not implement staging rehearsal action', () => {
    const controlPath = path.resolve(__dirname, '../services/task029ControlActionService.ts');
    const controlSource = fs.readFileSync(controlPath, 'utf8');
    expect(controlSource).not.toContain('staging_rehearsal');
    expect(controlSource).not.toContain('stagingRehearsal');
  });

  it('repository must not contain staging rehearsal storage', () => {
    const repoPath = path.resolve(__dirname, '../repositories/task029ExpansionOperationsRepository.ts');
    const repoSource = fs.readFileSync(repoPath, 'utf8');
    expect(repoSource).not.toMatch(/staging.?rehearsal/i);
  });

  it('preflight must block staging_rehearsal in FORBIDDEN_ACTION_TYPES', () => {
    const preflightPath = path.resolve(__dirname, '../services/task029ControlActionPreflightService.ts');
    const preflightSource = fs.readFileSync(preflightPath, 'utf8');
    expect(preflightSource).toContain("'staging_rehearsal'");
  });
});
