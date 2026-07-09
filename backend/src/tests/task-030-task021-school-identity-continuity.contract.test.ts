import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Task 030 - Task 021 School Identity Continuity Contract', () => {
  const baseDir = path.resolve(__dirname, '..');

  it('should have task021 route file exist', () => {
    const routePath = path.join(baseDir, 'routes', 'task021SchoolIntegrationRoutes.ts');
    expect(fs.existsSync(routePath)).toBe(true);
  });

  it('should have task021 contract file exist', () => {
    const contractPath = path.join(baseDir, 'contracts', 'task021SchoolIntegrationContracts.ts');
    expect(fs.existsSync(contractPath)).toBe(true);
  });

  it('should have task021 service file exist', () => {
    const servicePath = path.join(baseDir, 'services', 'task021SchoolIntegrationService.ts');
    expect(fs.existsSync(servicePath)).toBe(true);
  });

  it('should not replace task021 school identity logic', () => {
    const content = fs.readFileSync(path.join(baseDir, 'routes', 'task030ControlledStagingRehearsalRoutes.ts'), 'utf8');
    expect(content).not.toContain('schoolIntegration');
  });

  it('should maintain continuity with school identity patterns', () => {
    const task021Services = fs.readdirSync(path.join(baseDir, 'services')).filter((f: string) => f.startsWith('task021'));
    expect(task021Services.length).toBeGreaterThan(0);
  });

  it('should not import task021 services into task030', () => {
    const task030Files = fs.readdirSync(path.join(baseDir, 'services')).filter((f: string) => f.startsWith('task030'));
    for (const file of task030Files) {
      const content = fs.readFileSync(path.join(baseDir, 'services', file), 'utf8');
      expect(content).not.toContain('task021');
    }
  });
});
