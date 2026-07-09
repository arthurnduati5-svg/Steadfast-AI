import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Task 030 - No Task 031 Canary Readiness Contract', () => {
  const baseDir = path.resolve(__dirname, '..');
  const task030Files = [
    ...fs.readdirSync(path.join(baseDir, 'services')).filter(f => f.startsWith('task030')).map(f => path.join('services', f)),
    path.join('routes', 'task030ControlledStagingRehearsalRoutes.ts'),
    path.join('contracts', 'task030ControlledStagingRehearsalContracts.ts'),
    path.join('lib', 'task030ControlledStagingRehearsalValidation.ts'),
  ];

  it('should not import task031 services in task030 files', () => {
    for (const file of task030Files) {
      const content = fs.readFileSync(path.join(baseDir, file), 'utf8');
      expect(content).not.toContain('task031');
    }
  });

  it('should not invoke task031 canary readiness logic', () => {
    for (const file of task030Files) {
      const content = fs.readFileSync(path.join(baseDir, file), 'utf8');
      expect(content).not.toContain('canaryReadiness');
      expect(content).not.toContain('canary_ready');
    }
  });

  it('should not reference task031 contracts', () => {
    for (const file of task030Files) {
      const content = fs.readFileSync(path.join(baseDir, file), 'utf8');
      expect(content).not.toContain('task031Contract');
      expect(content).not.toContain('Task031');
    }
  });

  it('should not have task031 canary activation logic', () => {
    for (const file of task030Files) {
      const content = fs.readFileSync(path.join(baseDir, file), 'utf8');
      expect(content).not.toContain('startCanary');
      expect(content).not.toContain('activateCanary');
    }
  });

  it('should not directly call canary services from task030', () => {
    const routeContent = fs.readFileSync(path.join(baseDir, 'routes', 'task030ControlledStagingRehearsalRoutes.ts'), 'utf8');
    expect(routeContent).not.toContain('canary');
  });

  it('should not configure canary environment from task030', () => {
    for (const file of task030Files) {
      const content = fs.readFileSync(path.join(baseDir, file), 'utf8');
      expect(content).not.toContain('canaryConfig');
    }
  });
});
