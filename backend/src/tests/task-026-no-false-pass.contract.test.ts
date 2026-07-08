import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const TESTS_DIR = path.resolve(__dirname);

function getTestFiles(): string[] {
  return fs.readdirSync(TESTS_DIR)
    .filter((f) => f.startsWith('task-026') && f.endsWith('.test.ts'))
    .map((f) => path.join(TESTS_DIR, f));
}

describe('task026NoFalsePass', () => {
  const falsePassPatterns = [
    { pattern: /expect\s*\(\s*true\s*\)\s*\.\s*toBe\s*\(\s*true\s*\)\s*;?\s*$/m, label: 'expect(true).toBe(true)' },
    { pattern: /\b(test|it|describe)\s*\.\s*skip\s*\(/, label: '.skip' },
    { pattern: /\bxit\s*\(/, label: 'xit' },
    { pattern: /\bxdescribe\s*\(/, label: 'xdescribe' },
    { pattern: /\.\s*todo\s*\(/, label: '.todo' },
  ];

  const testFiles = getTestFiles();

  it('all task-026 test files exist for scanning', () => {
    expect(testFiles.length).toBeGreaterThan(0);
  });

  for (const fp of falsePassPatterns) {
    it(`no test file contains ${fp.label}`, () => {
      const violations: string[] = [];
      for (const file of testFiles) {
        const content = fs.readFileSync(file, 'utf-8');
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (fp.pattern.test(lines[i])) {
            violations.push(`${path.basename(file)}:${i + 1}`);
          }
        }
      }
      expect(violations).toEqual([]);
    });
  }

  it('every test file has at least one expect call', () => {
    for (const file of testFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const expectCount = (content.match(/\bexpect\s*\(/g) || []).length;
      expect(expectCount).toBeGreaterThan(0);
    }
  });
});
