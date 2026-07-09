import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Task 030 - No Task 034 Rollout Contract', () => {
  const baseDir = path.resolve(__dirname, '..');
  const task030Files = fs.readdirSync(path.join(baseDir, 'services')).filter(f => f.startsWith('task030'));

  it('should not import task034 services', () => {
    for (const file of task030Files) {
      const content = fs.readFileSync(path.join(baseDir, 'services', file), 'utf8');
      expect(content).not.toContain('task034');
    }
  });

  it('should not reference rollout logic', () => {
    for (const file of task030Files) {
      const content = fs.readFileSync(path.join(baseDir, 'services', file), 'utf8');
      expect(content).not.toContain('startRollout');
      expect(content).not.toContain('executeRollout');
    }
  });

  it('should not reference task034 contracts', () => {
    for (const file of task030Files) {
      const content = fs.readFileSync(path.join(baseDir, 'services', file), 'utf8');
      expect(content).not.toContain('Task034');
    }
  });

  it('should not have rollout routes', () => {
    const content = fs.readFileSync(path.join(baseDir, 'routes', 'task030ControlledStagingRehearsalRoutes.ts'), 'utf8');
    expect(content).not.toContain('rollout');
  });

  it('should not have rollout activation logic', () => {
    for (const file of task030Files) {
      const content = fs.readFileSync(path.join(baseDir, 'services', file), 'utf8');
      expect(content).not.toContain('rolloutActivation');
    }
  });

  it('should not configure rollout from task030', () => {
    for (const file of task030Files) {
      const content = fs.readFileSync(path.join(baseDir, 'services', file), 'utf8');
      expect(content).not.toContain('rolloutConfig');
    }
  });
});
