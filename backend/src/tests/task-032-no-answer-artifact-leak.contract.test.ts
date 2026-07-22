import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { getRepositoryRoot } from '../test-utils/repositoryPaths';

describe('Task 032 - No Answer Artifact Leak Contract', () => {
  const task032Dir = path.join(getRepositoryRoot(), 'backend', 'src');
  const task032Files: string[] = [];

  beforeAll(() => {
    const gather = (dir: string, acc: string[]) => {
      if (!fs.existsSync(dir)) return;
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const e of entries) {
        const full = path.join(dir, e.name);
        if (e.isDirectory() && !e.name.startsWith('node_modules') && !e.name.startsWith('.git')) {
          gather(full, acc);
        } else if ((e.name.endsWith('.ts') || e.name.endsWith('.js') || e.name.endsWith('.cjs')) && (e.name.includes('task-032') || e.name.includes('task032')) && !e.name.endsWith('.test.ts') && !e.name.includes('Contracts') && !e.name.includes('Service') && !e.name.includes('Repository')) {
          acc.push(full);
        }
      }
    };
    gather(task032Dir, task032Files);
  });

  it('should not contain answer key artifacts', () => {
    for (const f of task032Files) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/answer.?key/i);
    }
  });

  it('should not contain marking scheme artifacts', () => {
    for (const f of task032Files) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/marking.?scheme/i);
    }
  });

  it('should not contain rubric answer artifacts', () => {
    for (const f of task032Files) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/rubric.*answer/i);
    }
  });

  it('should not contain model answer artifacts', () => {
    for (const f of task032Files) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/model.?answer/i);
    }
  });

  it('should not contain final answer artifacts', () => {
    for (const f of task032Files) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/final.?answer/i);
    }
  });

  it('should not contain solution artifacts', () => {
    for (const f of task032Files) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/solution.*artifact/i);
    }
  });

  it('should not contain grading key artifacts', () => {
    for (const f of task032Files) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/grading.?key/i);
    }
  });

  it('should not contain scoring guide artifacts', () => {
    for (const f of task032Files) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/scoring.?guide/i);
    }
  });

  it('should not contain answer sheet artifacts', () => {
    for (const f of task032Files) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/answer.?sheet/i);
    }
  });

  it('should not contain completed answer examples', () => {
    for (const f of task032Files) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/completed.?answer/i);
    }
  });

  it('should not contain teacher-only answer content', () => {
    for (const f of task032Files) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/teacher.?only.?answer/i);
    }
  });

  it('should not contain answer leak in router code', () => {
    const routerFiles = task032Files.filter(f => f.includes('route') || f.includes('Route'));
    for (const f of routerFiles) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/answer/i);
    }
  });
});
