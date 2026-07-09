import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Task 030 - No Task 040 Backend Freeze Contract', () => {
  const baseDir = path.resolve(__dirname, '..');

  it('should not import task040 in task030 services', () => {
    const task030Files = fs.readdirSync(path.join(baseDir, 'services')).filter(f => f.startsWith('task030'));
    for (const file of task030Files) {
      const content = fs.readFileSync(path.join(baseDir, 'services', file), 'utf8');
      expect(content).not.toContain('task040');
    }
  });

  it('should not invoke freeze logic', () => {
    const task030Files = fs.readdirSync(path.join(baseDir, 'services')).filter(f => f.startsWith('task030'));
    for (const file of task030Files) {
      const content = fs.readFileSync(path.join(baseDir, 'services', file), 'utf8');
      expect(content).not.toContain('freezeBackend');
      expect(content).not.toContain('backendFreeze');
    }
  });

  it('should not reference task040 contracts', () => {
    const task030Files = fs.readdirSync(path.join(baseDir, 'services')).filter(f => f.startsWith('task030'));
    for (const file of task030Files) {
      const content = fs.readFileSync(path.join(baseDir, 'services', file), 'utf8');
      expect(content).not.toContain('Task040');
    }
  });

  it('should not have freeze routes', () => {
    const content = fs.readFileSync(path.join(baseDir, 'routes', 'task030ControlledStagingRehearsalRoutes.ts'), 'utf8');
    expect(content).not.toContain('/freeze');
    expect(content).not.toContain('backend-freeze');
  });

  it('should not freeze database from task030', () => {
    const task030Files = fs.readdirSync(path.join(baseDir, 'services')).filter(f => f.startsWith('task030'));
    for (const file of task030Files) {
      const content = fs.readFileSync(path.join(baseDir, 'services', file), 'utf8');
      expect(content).not.toContain('freezeDatabase');
    }
  });

  it('should not deploy freeze from task030', () => {
    const task030Files = fs.readdirSync(path.join(baseDir, 'services')).filter(f => f.startsWith('task030'));
    for (const file of task030Files) {
      const content = fs.readFileSync(path.join(baseDir, 'services', file), 'utf8');
      expect(content).not.toContain('freezeDeploy');
    }
  });
});
