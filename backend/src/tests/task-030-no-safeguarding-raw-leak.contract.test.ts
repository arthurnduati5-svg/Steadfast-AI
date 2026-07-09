import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Task 030 - No Safeguarding Raw Leak Contract', () => {
  const baseDir = path.resolve(__dirname, '..');
  const dirs = ['services', 'contracts', 'lib', 'repositories', 'routes'];

  it('should not contain safeguardingRaw in any task030 source file', () => {
    for (const dir of dirs) {
      const files = fs.readdirSync(path.join(baseDir, dir)).filter(f => f.startsWith('task030'));
      for (const file of files) {
        const content = fs.readFileSync(path.join(baseDir, dir, file), 'utf8');
        expect(content).not.toMatch(/\bsafeguardingRaw\b/);
      }
    }
  });

  it('should not contain rawSafeguarding in any task030 source file', () => {
    for (const dir of dirs) {
      const files = fs.readdirSync(path.join(baseDir, dir)).filter(f => f.startsWith('task030'));
      for (const file of files) {
        const content = fs.readFileSync(path.join(baseDir, dir, file), 'utf8');
        expect(content).not.toMatch(/\brawSafeguarding\b/);
      }
    }
  });

  it('should not contain rawChat in any task030 source file as value', () => {
    for (const dir of dirs) {
      const files = fs.readdirSync(path.join(baseDir, dir)).filter(f => f.startsWith('task030'));
      for (const file of files) {
        const content = fs.readFileSync(path.join(baseDir, dir, file), 'utf8');
        expect(content).not.toMatch(/\brawChat\b/);
      }
    }
  });

  it('should not contain rawStudentWork in any task030 source file', () => {
    for (const dir of dirs) {
      const files = fs.readdirSync(path.join(baseDir, dir)).filter(f => f.startsWith('task030'));
      for (const file of files) {
        const content = fs.readFileSync(path.join(baseDir, dir, file), 'utf8');
        expect(content).not.toMatch(/\brawStudentWork\b/);
      }
    }
  });

  it('should not contain rawStudentAnswer in any task030 source file', () => {
    for (const dir of dirs) {
      const files = fs.readdirSync(path.join(baseDir, dir)).filter(f => f.startsWith('task030'));
      for (const file of files) {
        const content = fs.readFileSync(path.join(baseDir, dir, file), 'utf8');
        expect(content).not.toMatch(/\brawStudentAnswer\b/);
      }
    }
  });

  it('should not contain rawLearnerData in any task030 source file', () => {
    for (const dir of dirs) {
      const files = fs.readdirSync(path.join(baseDir, dir)).filter(f => f.startsWith('task030'));
      for (const file of files) {
        const content = fs.readFileSync(path.join(baseDir, dir, file), 'utf8');
        expect(content).not.toMatch(/\brawLearnerData\b/);
      }
    }
  });
});
