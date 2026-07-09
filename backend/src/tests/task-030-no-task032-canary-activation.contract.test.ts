import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Task 030 - No Task 032 Canary Activation Contract', () => {
  const baseDir = path.resolve(__dirname, '..');
  const task030Files = [
    ...fs.readdirSync(path.join(baseDir, 'services')).filter(f => f.startsWith('task030')).map(f => path.join('services', f)),
    path.join('routes', 'task030ControlledStagingRehearsalRoutes.ts'),
  ];

  it('should not import task032 services in task030 files', () => {
    for (const file of task030Files) {
      const content = fs.readFileSync(path.join(baseDir, file), 'utf8');
      expect(content).not.toContain('task032');
    }
  });

  it('should not invoke task032 canary activation', () => {
    for (const file of task030Files) {
      const content = fs.readFileSync(path.join(baseDir, file), 'utf8');
      expect(content).not.toContain('activateTask032');
      expect(content).not.toContain('startTask032');
    }
  });

  it('should not reference task032 activation logic', () => {
    for (const file of task030Files) {
      const content = fs.readFileSync(path.join(baseDir, file), 'utf8');
      expect(content).not.toContain('task032Activation');
    }
  });

  it('should not configure canary cohorts', () => {
    for (const file of task030Files) {
      const content = fs.readFileSync(path.join(baseDir, file), 'utf8');
      expect(content).not.toContain('canaryCohort');
    }
  });

  it('should not reference task032 contracts', () => {
    for (const file of task030Files) {
      const content = fs.readFileSync(path.join(baseDir, file), 'utf8');
      expect(content).not.toContain('Task032');
    }
  });

  it('should not have canary activation routes', () => {
    const content = fs.readFileSync(path.join(baseDir, 'routes', 'task030ControlledStagingRehearsalRoutes.ts'), 'utf8');
    expect(content).not.toContain('canary/activate');
    expect(content).not.toContain('canary/start');
  });
});
