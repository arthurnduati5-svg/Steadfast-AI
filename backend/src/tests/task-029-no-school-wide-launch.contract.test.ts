import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Task 029 – No School-Wide Launch Code', () => {
  it('routes must not have school-wide launch endpoints', () => {
    const routePath = path.resolve(__dirname, '../routes/task029ExpansionOperationsRoutes.ts');
    const routeSource = fs.readFileSync(routePath, 'utf8');
    expect(routeSource).not.toContain('school_wide');
    expect(routeSource).not.toMatch(/school.?wide.?launch/i);
  });

  it('control action service must not implement school-wide launch', () => {
    const controlPath = path.resolve(__dirname, '../services/task029ControlActionService.ts');
    const controlSource = fs.readFileSync(controlPath, 'utf8');
    expect(controlSource).not.toContain('school_wide');
  });

  it('preflight must track actionIsSchoolWide as forbidden but not implement it', () => {
    const preflightPath = path.resolve(__dirname, '../services/task029ControlActionPreflightService.ts');
    const preflightSource = fs.readFileSync(preflightPath, 'utf8');
    expect(preflightSource).toContain('actionIsSchoolWide');
    expect(preflightSource).not.toContain('execute_school_wide');
  });

  it('rollback service must not implement school-wide logic', () => {
    const rollbackPath = path.resolve(__dirname, '../services/task029RollbackCommandService.ts');
    const rollbackSource = fs.readFileSync(rollbackPath, 'utf8');
    expect(rollbackSource).not.toContain('school_wide');
  });

  it('repository must not contain school-wide launch storage', () => {
    const repoPath = path.resolve(__dirname, '../repositories/task029ExpansionOperationsRepository.ts');
    const repoSource = fs.readFileSync(repoPath, 'utf8');
    expect(repoSource).not.toMatch(/school.?wide/i);
  });
});
