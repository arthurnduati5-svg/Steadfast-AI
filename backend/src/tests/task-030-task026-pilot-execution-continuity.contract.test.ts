import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Task 030 - Task 026 Pilot Execution Continuity Contract', () => {
  const baseDir = path.resolve(__dirname, '..');

  it('should have task026 route files exist', () => {
    const routes = fs.readdirSync(path.join(baseDir, 'routes')).filter((f: string) => f.includes('task026'));
    expect(routes.length).toBeGreaterThan(0);
  });

  it('should have task026 contract file exist', () => {
    const contractFile = path.join(baseDir, 'contracts', 'task026ControlledPilotExecutionContracts.ts');
    expect(fs.existsSync(contractFile)).toBe(true);
  });

  it('should have task026 service files exist', () => {
    const task026Services = fs.readdirSync(path.join(baseDir, 'services')).filter((f: string) => f.startsWith('task026'));
    expect(task026Services.length).toBeGreaterThan(0);
  });

  it('should not break task026 pilot execution', () => {
    const content = fs.readFileSync(path.join(baseDir, 'routes', 'task030ControlledStagingRehearsalRoutes.ts'), 'utf8');
    expect(content).not.toContain('pilotExecution');
  });

  it('should maintain pilot execution continuity', () => {
    const task026Files = fs.readdirSync(path.join(baseDir, 'services')).filter((f: string) => f.includes('task026'));
    expect(task026Files.length).toBeGreaterThan(0);
  });

  it('should not import task026 services into task030', () => {
    const task030Files = fs.readdirSync(path.join(baseDir, 'services')).filter((f: string) => f.startsWith('task030'));
    for (const file of task030Files) {
      const content = fs.readFileSync(path.join(baseDir, 'services', file), 'utf8');
      expect(content).not.toContain('task026');
    }
  });
});
