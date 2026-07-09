import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Task 030 - No False Pass Contract', () => {
  const testDir = path.resolve(__dirname);

  it('should have meaningful assertion in every task030 test file', () => {
    const task030Files = fs.readdirSync(testDir).filter((f: string) => f.startsWith('task-030') && f.endsWith('.test.ts'));
    expect(task030Files.length).toBeGreaterThan(0);
    for (const file of task030Files) {
      const content = fs.readFileSync(path.join(testDir, file), 'utf8');
      expect(content).toContain('.toBe(');
      expect(content).toContain('.toContain(');
      expect(content).not.toContain('expect(true).toBe(true)');
      expect(content).not.toContain('expect(1).toBe(1)');
    }
  });

  it('should not have any .skip in task030 test files', () => {
    const task030Files = fs.readdirSync(testDir).filter((f: string) => f.startsWith('task-030') && f.endsWith('.test.ts'));
    for (const file of task030Files) {
      const content = fs.readFileSync(path.join(testDir, file), 'utf8');
      expect(content).not.toContain('describe.skip');
      expect(content).not.toContain('it.skip');
      expect(content).not.toContain('test.skip');
      expect(content).not.toContain('xit(');
      expect(content).not.toContain('xdescribe(');
    }
  });

  it('should have no placeholder tests in task030 files', () => {
    const task030Files = fs.readdirSync(testDir).filter((f: string) => f.startsWith('task-030') && f.endsWith('.test.ts'));
    for (const file of task030Files) {
      const content = fs.readFileSync(path.join(testDir, file), 'utf8');
      expect(content).not.toContain('// TODO');
      expect(content).not.toContain('// FIXME');
    }
  });

  it('should have route contract tests verifying actual routes', () => {
    const fsModule = require('fs');
    const routeContractFiles = fsModule.readdirSync(testDir).filter((f: string) =>
      f.startsWith('task-030-routes') && f.endsWith('.contract.test.ts')
    );
    expect(routeContractFiles.length).toBeGreaterThan(5);
    for (const file of routeContractFiles) {
      const content = fs.readFileSync(path.join(testDir, file), 'utf8');
      expect(content).toContain('import task030Routes');
    }
  });

  it('should have no-hardcoded test names that skip logic', () => {
    const task030Files = fs.readdirSync(testDir).filter((f: string) => f.startsWith('task-030') && f.endsWith('.test.ts'));
    for (const file of task030Files) {
      const content = fs.readFileSync(path.join(testDir, file), 'utf8');
      expect(content).not.toContain('test.skip(');
    }
  });
});
