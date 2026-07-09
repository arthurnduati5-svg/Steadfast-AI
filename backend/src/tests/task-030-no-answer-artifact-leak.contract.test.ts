import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Task 030 - No Answer Artifact Leak Contract', () => {
  const baseDir = path.resolve(__dirname, '..');
  const dirs = ['services', 'contracts', 'lib', 'repositories', 'routes'];

  it('should not contain answerKey in task030 source files', () => {
    for (const dir of dirs) {
      const files = fs.readdirSync(path.join(baseDir, dir)).filter(f => f.startsWith('task030'));
      for (const file of files) {
        const content = fs.readFileSync(path.join(baseDir, dir, file), 'utf8');
        expect(content).not.toMatch(/\banswerKey\b/);
      }
    }
  });

  it('should not contain correctAnswer in task030 source files', () => {
    for (const dir of dirs) {
      const files = fs.readdirSync(path.join(baseDir, dir)).filter(f => f.startsWith('task030'));
      for (const file of files) {
        const content = fs.readFileSync(path.join(baseDir, dir, file), 'utf8');
        expect(content).not.toMatch(/\bcorrectAnswer\b/);
      }
    }
  });

  it('should not contain modelAnswer in task030 source files', () => {
    for (const dir of dirs) {
      const files = fs.readdirSync(path.join(baseDir, dir)).filter(f => f.startsWith('task030'));
      for (const file of files) {
        const content = fs.readFileSync(path.join(baseDir, dir, file), 'utf8');
        expect(content).not.toMatch(/\bmodelAnswer\b/);
      }
    }
  });

  it('should not contain markingScheme in task030 source files', () => {
    for (const dir of dirs) {
      const files = fs.readdirSync(path.join(baseDir, dir)).filter(f => f.startsWith('task030'));
      for (const file of files) {
        const content = fs.readFileSync(path.join(baseDir, dir, file), 'utf8');
        expect(content).not.toMatch(/\bmarkingScheme\b/);
      }
    }
  });

  it('should not leak answer keys in routes', () => {
    const content = fs.readFileSync(path.join(baseDir, 'routes', 'task030ControlledStagingRehearsalRoutes.ts'), 'utf8');
    expect(content).not.toContain('answer_key');
    expect(content).not.toContain('answerKey');
  });

  it('should not leak answer keys in services', () => {
    const content = fs.readFileSync(path.join(baseDir, 'services', 'task030ControlledStagingRehearsalService.ts'), 'utf8');
    expect(content).not.toContain('answer_key');
  });
});
