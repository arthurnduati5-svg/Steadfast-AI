import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Task 032 - No Private Deen Text Leak Contract', () => {
  const task032Dir = path.resolve(process.cwd(), 'backend/src');
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

  it('should not contain Quranic Arabic text in source files', () => {
    for (const f of task032Files) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/[\u0600-\u06FF]{20,}/);
    }
  });

  it('should not contain Deen-sensitive fatwa text', () => {
    for (const f of task032Files) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/fatwa/i);
    }
  });

  it('should not contain private Islamic rulings', () => {
    for (const f of task032Files) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/private.?islamic/i);
    }
  });

  it('should not contain Deen assessment answer keys', () => {
    for (const f of task032Files) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/deen.*answer.?key/i);
    }
  });

  it('should not contain Deen marking schemes', () => {
    for (const f of task032Files) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/deen.*marking/i);
    }
  });

  it('should not contain Deen sensitive private student responses', () => {
    for (const f of task032Files) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/private.?deen.?response/i);
    }
  });

  it('should not contain Deen-specific moderation data', () => {
    for (const f of task032Files) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/deen.?moderat/i);
    }
  });

  it('should not contain Deen governance override tokens', () => {
    for (const f of task032Files) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/deen.?governance.?override/i);
    }
  });

  it('should not contain private Deen boundary bypass', () => {
    for (const f of task032Files) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/deen.?boundary.?bypass/i);
    }
  });

  it('should not contain Deen private teacher notes', () => {
    for (const f of task032Files) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/private.?teacher.?notes.*deen/i);
    }
  });

  it('should not contain Deen hidden reasoning text', () => {
    for (const f of task032Files) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/deen.*hidden.*reason/i);
    }
  });

  it('should not contain Deen raw student profile text', () => {
    for (const f of task032Files) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/deen.*raw.*student/i);
    }
  });
});
