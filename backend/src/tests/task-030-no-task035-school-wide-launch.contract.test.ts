import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Task 030 - No Task 035 School Wide Launch Contract', () => {
  const baseDir = path.resolve(__dirname, '..');
  const task030Files = fs.readdirSync(path.join(baseDir, 'services')).filter(f => f.startsWith('task030'));

  it('should not import task035 services', () => {
    for (const file of task030Files) {
      const content = fs.readFileSync(path.join(baseDir, 'services', file), 'utf8');
      expect(content).not.toContain('task035');
    }
  });

  it('should not reference school-wide launch logic', () => {
    for (const file of task030Files) {
      const content = fs.readFileSync(path.join(baseDir, 'services', file), 'utf8');
      expect(content).not.toContain('schoolWideLaunch');
      expect(content).not.toContain('launchSchool');
    }
  });

  it('should not reference task035 contracts', () => {
    for (const file of task030Files) {
      const content = fs.readFileSync(path.join(baseDir, 'services', file), 'utf8');
      expect(content).not.toContain('Task035');
    }
  });

  it('should not have launch routes', () => {
    const content = fs.readFileSync(path.join(baseDir, 'routes', 'task030ControlledStagingRehearsalRoutes.ts'), 'utf8');
    expect(content).not.toContain('/launch');
    expect(content).not.toContain('school-wide');
  });

  it('should not execute school launch from task030', () => {
    for (const file of task030Files) {
      const content = fs.readFileSync(path.join(baseDir, 'services', file), 'utf8');
      expect(content).not.toContain('launchSchoolWide');
    }
  });

  it('should not configure school-wide deployment', () => {
    for (const file of task030Files) {
      const content = fs.readFileSync(path.join(baseDir, 'services', file), 'utf8');
      expect(content).not.toContain('schoolWideDeploy');
    }
  });
});
