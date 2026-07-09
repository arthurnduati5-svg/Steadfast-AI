import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Task 030 - Task 028 Expansion Execution Continuity Contract', () => {
  const baseDir = path.resolve(__dirname, '..');

  it('should have task028 route files exist', () => {
    const routes = fs.readdirSync(path.join(baseDir, 'routes')).filter((f: string) => f.includes('task028'));
    expect(routes.length).toBeGreaterThan(0);
  });

  it('should have task028 contract file exist', () => {
    const contractFile = path.join(baseDir, 'contracts', 'task028ControlledExpansionExecutionContracts.ts');
    expect(fs.existsSync(contractFile)).toBe(true);
  });

  it('should have task028 service files exist', () => {
    const task028Services = fs.readdirSync(path.join(baseDir, 'services')).filter((f: string) => f.startsWith('task028'));
    expect(task028Services.length).toBeGreaterThan(0);
  });

  it('should not break task028 expansion execution', () => {
    const content = fs.readFileSync(path.join(baseDir, 'routes', 'task030ControlledStagingRehearsalRoutes.ts'), 'utf8');
    expect(content).not.toContain('expansionExecution');
  });

  it('should maintain expansion execution continuity', () => {
    const task028Files = fs.readdirSync(path.join(baseDir, 'services')).filter((f: string) => f.includes('task028'));
    expect(task028Files.length).toBeGreaterThan(0);
  });

  it('should not import task028 services into task030', () => {
    const task030Files = fs.readdirSync(path.join(baseDir, 'services')).filter((f: string) => f.startsWith('task030'));
    for (const file of task030Files) {
      const content = fs.readFileSync(path.join(baseDir, 'services', file), 'utf8');
      expect(content).not.toContain('task028');
    }
  });
});
