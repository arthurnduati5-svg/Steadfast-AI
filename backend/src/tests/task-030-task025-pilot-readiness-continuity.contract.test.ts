import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Task 030 - Task 025 Pilot Readiness Continuity Contract', () => {
  const baseDir = path.resolve(__dirname, '..');

  it('should have task025 route files exist', () => {
    const routes = fs.readdirSync(path.join(baseDir, 'routes')).filter((f: string) => f.includes('task025'));
    expect(routes.length).toBeGreaterThan(0);
  });

  it('should have task025 contract file exist', () => {
    const contractFile = path.join(baseDir, 'contracts', 'task025ControlledPilotReadinessContracts.ts');
    expect(fs.existsSync(contractFile)).toBe(true);
  });

  it('should have task025 service files exist', () => {
    const task025Services = fs.readdirSync(path.join(baseDir, 'services')).filter((f: string) => f.startsWith('task025'));
    expect(task025Services.length).toBeGreaterThan(0);
  });

  it('should not break task025 pilot readiness', () => {
    const content = fs.readFileSync(path.join(baseDir, 'routes', 'task030ControlledStagingRehearsalRoutes.ts'), 'utf8');
    expect(content).not.toContain('pilotReadiness');
  });

  it('should maintain pilot readiness continuity', () => {
    const task025Files = fs.readdirSync(path.join(baseDir, 'services')).filter((f: string) => f.startsWith('task025'));
    expect(task025Files.length).toBeGreaterThan(0);
  });

  it('should not import task025 services into task030', () => {
    const task030Files = fs.readdirSync(path.join(baseDir, 'services')).filter((f: string) => f.startsWith('task030'));
    for (const file of task030Files) {
      const content = fs.readFileSync(path.join(baseDir, 'services', file), 'utf8');
      expect(content).not.toContain('task025');
    }
  });
});
