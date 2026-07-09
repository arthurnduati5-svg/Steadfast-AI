import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Task 030 - No Frontend UI Contract', () => {
  const baseDir = path.resolve(__dirname, '..');

  it('should not import React in task030 routes', () => {
    const content = fs.readFileSync(path.join(baseDir, 'routes', 'task030ControlledStagingRehearsalRoutes.ts'), 'utf8');
    expect(content).not.toContain('react');
    expect(content).not.toContain('jsx');
  });

  it('should not contain HTML in task030 routes', () => {
    const content = fs.readFileSync(path.join(baseDir, 'routes', 'task030ControlledStagingRehearsalRoutes.ts'), 'utf8');
    expect(content).not.toContain('<div');
    expect(content).not.toContain('<span');
  });

  it('should not reference frontend components in services', () => {
    const files = fs.readdirSync(path.join(baseDir, 'services')).filter(f => f.startsWith('task030'));
    for (const file of files) {
      const content = fs.readFileSync(path.join(baseDir, 'services', file), 'utf8');
      expect(content).not.toContain('Component');
      expect(content).not.toContain('.tsx');
    }
  });

  it('should not contain CSS in task030 routes', () => {
    const content = fs.readFileSync(path.join(baseDir, 'routes', 'task030ControlledStagingRehearsalRoutes.ts'), 'utf8');
    expect(content).not.toContain('className');
    expect(content).not.toContain('style={');
  });

  it('should not contain JSX in any task030 source', () => {
    const dirs = ['services', 'contracts', 'lib', 'repositories', 'routes'];
    for (const dir of dirs) {
      const files = fs.readdirSync(path.join(baseDir, dir)).filter(f => f.startsWith('task030'));
      for (const file of files) {
        const content = fs.readFileSync(path.join(baseDir, dir, file), 'utf8');
        expect(content).not.toContain('return (');
      }
    }
  });

  it('should not use frontend URL patterns in task030 files', () => {
    const files = fs.readdirSync(path.join(baseDir, 'services')).filter(f => f.startsWith('task030'));
    for (const file of files) {
      const content = fs.readFileSync(path.join(baseDir, 'services', file), 'utf8');
      expect(content).not.toContain('window.');
      expect(content).not.toContain('document.');
    }
  });
});
