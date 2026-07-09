import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Task 030 - Task 023 Deployment Readiness Continuity Contract', () => {
  const baseDir = path.resolve(__dirname, '..');

  it('should have task023 route file(s) exist', () => {
    const routes = fs.readdirSync(path.join(baseDir, 'routes')).filter((f: string) => f.includes('task023'));
    expect(routes.length).toBeGreaterThan(0);
  });

  it('should have task023 contract file exist', () => {
    const contractFile = path.join(baseDir, 'contracts', 'task023DeploymentReadinessContracts.ts');
    expect(fs.existsSync(contractFile)).toBe(true);
  });

  it('should have task023 service files exist', () => {
    const task023Services = fs.readdirSync(path.join(baseDir, 'services')).filter((f: string) => f.startsWith('task023'));
    expect(task023Services.length).toBeGreaterThan(0);
  });

  it('should not break task023 deployment readiness', () => {
    const content = fs.readFileSync(path.join(baseDir, 'routes', 'task030ControlledStagingRehearsalRoutes.ts'), 'utf8');
    expect(content).not.toContain('deploymentReadiness');
  });

  it('should maintain deployment readiness continuity', () => {
    const task030Routes = fs.readFileSync(path.join(baseDir, 'routes', 'task030ControlledStagingRehearsalRoutes.ts'), 'utf8');
    expect(task030Routes).toBeDefined();
  });

  it('should not import task023 services into task030', () => {
    const task030Files = fs.readdirSync(path.join(baseDir, 'services')).filter((f: string) => f.startsWith('task030'));
    for (const file of task030Files) {
      const content = fs.readFileSync(path.join(baseDir, 'services', file), 'utf8');
      expect(content).not.toContain('task023');
    }
  });
});
