import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Task 030 - No Task 033 Canary Observation Contract', () => {
  const baseDir = path.resolve(__dirname, '..');
  const task030Files = fs.readdirSync(path.join(baseDir, 'services')).filter(f => f.startsWith('task030'));

  it('should not import task033 services', () => {
    for (const file of task030Files) {
      const content = fs.readFileSync(path.join(baseDir, 'services', file), 'utf8');
      expect(content).not.toContain('task033');
    }
  });

  it('should not reference task033 observation logic', () => {
    for (const file of task030Files) {
      const content = fs.readFileSync(path.join(baseDir, 'services', file), 'utf8');
      expect(content).not.toContain('observeCanary');
      expect(content).not.toContain('canaryObservation');
    }
  });

  it('should not reference task033 contracts', () => {
    for (const file of task030Files) {
      const content = fs.readFileSync(path.join(baseDir, 'services', file), 'utf8');
      expect(content).not.toContain('Task033');
    }
  });

  it('should not have canary observation routes in task030', () => {
    const content = fs.readFileSync(path.join(baseDir, 'routes', 'task030ControlledStagingRehearsalRoutes.ts'), 'utf8');
    expect(content).not.toContain('canary/observe');
    expect(content).not.toContain('canaryObservation');
  });

  it('should not call canary monitoring', () => {
    for (const file of task030Files) {
      const content = fs.readFileSync(path.join(baseDir, 'services', file), 'utf8');
      expect(content).not.toContain('canaryMonitor');
    }
  });

  it('should not configure canary observation', () => {
    for (const file of task030Files) {
      const content = fs.readFileSync(path.join(baseDir, 'services', file), 'utf8');
      expect(content).not.toContain('canaryConfig');
    }
  });
});
