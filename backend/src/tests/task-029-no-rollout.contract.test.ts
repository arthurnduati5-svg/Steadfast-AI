import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Task 029 – No Rollout Code', () => {
  it('routes must not have rollout endpoints', () => {
    const routePath = path.resolve(__dirname, '../routes/task029ExpansionOperationsRoutes.ts');
    const routeSource = fs.readFileSync(routePath, 'utf8');
    expect(routeSource).not.toMatch(/\/rollout/);
    expect(routeSource).not.toContain('execute_rollout');
  });

  it('control action service must not implement rollout action', () => {
    const controlPath = path.resolve(__dirname, '../services/task029ControlActionService.ts');
    const controlSource = fs.readFileSync(controlPath, 'utf8');
    expect(controlSource).not.toContain('execute_rollout');
    expect(controlSource).not.toContain("'rollout'");
  });

  it('preflight must track actionIsRollout as forbidden but not implement it', () => {
    const preflightPath = path.resolve(__dirname, '../services/task029ControlActionPreflightService.ts');
    const preflightSource = fs.readFileSync(preflightPath, 'utf8');
    expect(preflightSource).toContain('actionIsRollout');
    expect(preflightSource).not.toContain('execute_rollout');
  });

  it('rollback service must not contain rollout logic', () => {
    const rollbackPath = path.resolve(__dirname, '../services/task029RollbackCommandService.ts');
    const rollbackSource = fs.readFileSync(rollbackPath, 'utf8');
    expect(rollbackSource).not.toContain('execute_rollout');
    expect(rollbackSource).not.toMatch(/rollout/i);
  });

  it('learner own status must not reference rollout', () => {
    const learnerPath = path.resolve(__dirname, '../services/task029LearnerOwnStatusService.ts');
    const learnerSource = fs.readFileSync(learnerPath, 'utf8');
    expect(learnerSource).not.toMatch(/rollout/i);
  });

  it('repository must not contain rollout storage', () => {
    const repoPath = path.resolve(__dirname, '../repositories/task029ExpansionOperationsRepository.ts');
    const repoSource = fs.readFileSync(repoPath, 'utf8');
    expect(repoSource).not.toMatch(/rollout\b/i);
  });
});
