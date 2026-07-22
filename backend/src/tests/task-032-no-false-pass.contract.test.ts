import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { getRepositoryRoot } from '../test-utils/repositoryPaths';

describe('Task 032 - No False Pass Contract', () => {
  const task032TestDir = path.join(getRepositoryRoot(), 'backend', 'src', 'tests');
  const task032TestFiles: string[] = [];

  const selfName = 'task-032-no-false-pass.contract.test.ts';

  beforeAll(() => {
    if (!fs.existsSync(task032TestDir)) return;
    const entries = fs.readdirSync(task032TestDir, { withFileTypes: true });
    for (const e of entries) {
      if (e.name.startsWith('task-032') && e.name.endsWith('.test.ts') && e.name !== selfName) {
        task032TestFiles.push(path.join(task032TestDir, e.name));
      }
    }
  });

  it('should not contain expect(true).toBe(true) in any Task 032 test', () => {
    for (const f of task032TestFiles) {
      const content = fs.readFileSync(f, 'utf-8');
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('expect(true).toBe(true)')) {
          throw new Error(`Placeholder assertion found in ${f} at line ${i + 1}`);
        }
      }
    }
  });

  it('should not contain expect(false).toBe(false) in any Task 032 test', () => {
    for (const f of task032TestFiles) {
      const content = fs.readFileSync(f, 'utf-8');
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('expect(false).toBe(false)')) {
          throw new Error(`Placeholder assertion found in ${f} at line ${i + 1}`);
        }
      }
    }
  });

  it('should not contain expect(1).toBe(1) in any Task 032 test', () => {
    for (const f of task032TestFiles) {
      const content = fs.readFileSync(f, 'utf-8');
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('expect(1).toBe(1)')) {
          throw new Error(`Placeholder assertion found in ${f} at line ${i + 1}`);
        }
      }
    }
  });

  it('should not contain .skip in any Task 032 test', () => {
    for (const f of task032TestFiles) {
      const content = fs.readFileSync(f, 'utf-8');
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('.skip(')) {
          throw new Error(`Skipped test found in ${f} at line ${i + 1}`);
        }
      }
    }
  });

  it('should not contain describe.skip in any Task 032 test', () => {
    for (const f of task032TestFiles) {
      const content = fs.readFileSync(f, 'utf-8');
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('describe.skip')) {
          throw new Error(`Skipped describe found in ${f} at line ${i + 1}`);
        }
      }
    }
  });

  it('should not contain it.skip in any Task 032 test', () => {
    for (const f of task032TestFiles) {
      const content = fs.readFileSync(f, 'utf-8');
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('it.skip')) {
          throw new Error(`Skipped it block found in ${f} at line ${i + 1}`);
        }
      }
    }
  });

  it('should not contain xdescribe in any Task 032 test', () => {
    for (const f of task032TestFiles) {
      const content = fs.readFileSync(f, 'utf-8');
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('xdescribe')) {
          throw new Error(`Excluded describe found in ${f} at line ${i + 1}`);
        }
      }
    }
  });

  it('should not contain xit in any Task 032 test', () => {
    for (const f of task032TestFiles) {
      const content = fs.readFileSync(f, 'utf-8');
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('xit(')) {
          throw new Error(`Excluded test found in ${f} at line ${i + 1}`);
        }
      }
    }
  });

  it('should not contain TODO comments in test bodies', () => {
    for (const f of task032TestFiles) {
      const content = fs.readFileSync(f, 'utf-8');
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('TODO') && !lines[i].includes('// TODO')) {
          continue;
        }
        if (lines[i].includes('// TODO') || lines[i].includes('/* TODO')) {
          const trimmed = lines[i].trim();
          if (trimmed.includes('test') || trimmed.includes('assert') || trimmed.includes('write')) {
            throw new Error(`TODO placeholder found in ${f} at line ${i + 1}`);
          }
        }
      }
    }
  });

  it('should not contain placeholder test descriptions like "placeholder" or "stub"', () => {
    for (const f of task032TestFiles) {
      const content = fs.readFileSync(f, 'utf-8');
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes("'placeholder'") || lines[i].includes('"placeholder"') ||
            lines[i].includes("'stub'") || lines[i].includes('"stub"') ||
            lines[i].includes("'TODO'") || lines[i].includes('"TODO"')) {
          throw new Error(`Placeholder test description found in ${f} at line ${i + 1}`);
        }
      }
    }
  });

  it('should not contain .todo in any Task 032 test', () => {
    for (const f of task032TestFiles) {
      const content = fs.readFileSync(f, 'utf-8');
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('.todo(')) {
          throw new Error(`TODO test found in ${f} at line ${i + 1}`);
        }
      }
    }
  });

  it('every test should have at least one real assertion', () => {
    for (const f of task032TestFiles) {
      const content = fs.readFileSync(f, 'utf-8');
      const itMatches = content.match(/it\(/g);
      const expectMatches = content.match(/expect\(/g);
      if (itMatches && expectMatches) {
        const itCount = itMatches.length;
        const expectCount = expectMatches.length;
        expect(expectCount).toBeGreaterThanOrEqual(itCount);
      }
    }
  });
});
