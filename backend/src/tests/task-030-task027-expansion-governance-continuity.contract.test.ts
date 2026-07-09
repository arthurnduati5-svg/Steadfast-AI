import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Task 030 - Task 027 Expansion Governance Continuity Contract', () => {
  const baseDir = path.resolve(__dirname, '..');

  it('should have task027 route files exist', () => {
    const routes = fs.readdirSync(path.join(baseDir, 'routes')).filter((f: string) => f.includes('task027'));
    expect(routes.length).toBeGreaterThan(0);
  });

  it('should have task027 contract file exist', () => {
    const contractFile = path.join(baseDir, 'contracts', 'task027PilotExpansionGovernanceContracts.ts');
    expect(fs.existsSync(contractFile)).toBe(true);
  });

  it('should have task027 service files exist', () => {
    const task027Services = fs.readdirSync(path.join(baseDir, 'services')).filter((f: string) => f.startsWith('task027'));
    expect(task027Services.length).toBeGreaterThan(0);
  });

  it('should not break task027 expansion governance', () => {
    const content = fs.readFileSync(path.join(baseDir, 'routes', 'task030ControlledStagingRehearsalRoutes.ts'), 'utf8');
    expect(content).not.toContain('expansionGovernance');
  });

  it('should maintain expansion governance continuity', () => {
    const task027Files = fs.readdirSync(path.join(baseDir, 'services')).filter((f: string) => f.includes('task027'));
    expect(task027Files.length).toBeGreaterThan(0);
  });

  it('should not import task027 services into task030', () => {
    const task030Files = fs.readdirSync(path.join(baseDir, 'services')).filter((f: string) => f.startsWith('task030'));
    for (const file of task030Files) {
      const content = fs.readFileSync(path.join(baseDir, 'services', file), 'utf8');
      expect(content).not.toContain('task027');
    }
  });
});
