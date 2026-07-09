import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Task 030 - Task 024 Operations Readiness Continuity Contract', () => {
  const baseDir = path.resolve(__dirname, '..');

  it('should have task024 route files exist', () => {
    const routes = fs.readdirSync(path.join(baseDir, 'routes')).filter((f: string) => f.includes('task024'));
    expect(routes.length).toBeGreaterThan(0);
  });

  it('should have task024 contract file exist', () => {
    const contractFile = path.join(baseDir, 'contracts', 'task024OperationsContracts.ts');
    expect(fs.existsSync(contractFile)).toBe(true);
  });

  it('should have task024 service files exist', () => {
    const task024Services = fs.readdirSync(path.join(baseDir, 'services')).filter((f: string) => f.startsWith('task024'));
    expect(task024Services.length).toBeGreaterThan(0);
  });

  it('should not break task024 operations readiness', () => {
    const content = fs.readFileSync(path.join(baseDir, 'routes', 'task030ControlledStagingRehearsalRoutes.ts'), 'utf8');
    expect(content).toBeDefined();
    expect(content).not.toContain('operationsReadiness');
  });

  it('should maintain operations continuity', () => {
    const task030Services = fs.readdirSync(path.join(baseDir, 'services')).filter((f: string) => f.startsWith('task030'));
    expect(task030Services.length).toBeGreaterThan(0);
  });

  it('should not import task024 services into task030', () => {
    const task030Files = fs.readdirSync(path.join(baseDir, 'services')).filter((f: string) => f.startsWith('task030'));
    for (const file of task030Files) {
      const content = fs.readFileSync(path.join(baseDir, 'services', file), 'utf8');
      expect(content).not.toContain('task024');
    }
  });
});
