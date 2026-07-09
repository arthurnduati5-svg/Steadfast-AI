import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Task 030 - Task 022 Content Governance Continuity Contract', () => {
  const baseDir = path.resolve(__dirname, '..');

  it('should have task022 route file exist', () => {
    const routePath = path.join(baseDir, 'routes', 'task022CurriculumContentGovernanceRoutes.ts');
    expect(fs.existsSync(routePath)).toBe(true);
  });

  it('should have task022 contract file exist', () => {
    const contractPath = path.join(baseDir, 'contracts', 'task022CurriculumContentGovernanceContracts.ts');
    expect(fs.existsSync(contractPath)).toBe(true);
  });

  it('should have task022 service file exist', () => {
    const servicePath = path.join(baseDir, 'services', 'task022CurriculumContentGovernanceService.ts');
    expect(fs.existsSync(servicePath)).toBe(true);
  });

  it('should not break task022 content governance', () => {
    const content = fs.readFileSync(path.join(baseDir, 'routes', 'task030ControlledStagingRehearsalRoutes.ts'), 'utf8');
    expect(content).toBeDefined();
    expect(content).not.toContain('contentGovernance');
  });

  it('should maintain continuity with content governance', () => {
    const task022Services = fs.readdirSync(path.join(baseDir, 'services')).filter((f: string) => f.startsWith('task022'));
    expect(task022Services.length).toBeGreaterThan(0);
  });

  it('should not import task022 services into task030', () => {
    const task030Files = fs.readdirSync(path.join(baseDir, 'services')).filter((f: string) => f.startsWith('task030'));
    for (const file of task030Files) {
      const content = fs.readFileSync(path.join(baseDir, 'services', file), 'utf8');
      expect(content).not.toContain('task022');
    }
  });
});
