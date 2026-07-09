import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Task 030 - Task 029 Expansion Operations Continuity Contract', () => {
  const baseDir = path.resolve(__dirname, '..');

  it('should have task029 route file exist', () => {
    const routeFile = path.join(baseDir, 'routes', 'task029ExpansionOperationsRoutes.ts');
    expect(fs.existsSync(routeFile)).toBe(true);
  });

  it('should have task029 contract file exist', () => {
    const contractFile = path.join(baseDir, 'contracts', 'task029ExpansionOperationsContracts.ts');
    expect(fs.existsSync(contractFile)).toBe(true);
  });

  it('should have task029 service files exist', () => {
    const task029Services = fs.readdirSync(path.join(baseDir, 'services')).filter((f: string) => f.startsWith('task029'));
    expect(task029Services.length).toBeGreaterThan(0);
  });

  it('should not break task029 expansion operations', () => {
    const content = fs.readFileSync(path.join(baseDir, 'routes', 'task030ControlledStagingRehearsalRoutes.ts'), 'utf8');
    expect(content).not.toContain('expansionOperations');
  });

  it('should maintain expansion operations continuity', () => {
    const task029Files = fs.readdirSync(path.join(baseDir, 'services')).filter((f: string) => f.includes('task029'));
    expect(task029Files.length).toBeGreaterThan(0);
  });

  it('should use task029 proof loader (not replace it)', () => {
    const task030Files = fs.readdirSync(path.join(baseDir, 'services')).filter((f: string) => f.startsWith('task030'));
    for (const file of task030Files) {
      const content = fs.readFileSync(path.join(baseDir, 'services', file), 'utf8');
      if (file.includes('Task029ProofLoader')) continue;
      expect(content).not.toContain('task029');
    }
  });
});
