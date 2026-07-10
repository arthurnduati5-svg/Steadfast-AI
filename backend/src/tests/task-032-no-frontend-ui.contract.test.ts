import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Task 032 - No Frontend UI References Contract', () => {
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
        } else if ((e.name.endsWith('.ts') || e.name.endsWith('.js') || e.name.endsWith('.cjs')) && (e.name.includes('task-032') || e.name.includes('task032')) && !e.name.endsWith('.test.ts')) {
          acc.push(full);
        }
      }
    };
    gather(task032Dir, task032Files);
  });

  it('should not contain React component references', () => {
    for (const f of task032Files) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/import.*React/i);
    }
  });

  it('should not contain JSX syntax', () => {
    for (const f of task032Files) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/(?<!\w)<[A-Z]\w*/);
    }
  });

  it('should not contain frontend component imports', () => {
    for (const f of task032Files) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/from.*frontend/i);
    }
  });

  it('should not contain UI component references', () => {
    for (const f of task032Files) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/component|Component/i);
    }
  });

  it('should not contain CSS references', () => {
    for (const f of task032Files) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/\.css|\.scss|\.less/i);
    }
  });

  it('should not contain HTML template references', () => {
    for (const f of task032Files) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/\.html|\.htm/i);
    }
  });

  it('should not contain frontend route references', () => {
    for (const f of task032Files) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/frontend.*route/i);
    }
  });

  it('should not contain frontend state management', () => {
    for (const f of task032Files) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/useState|useEffect|useReducer/i);
    }
  });

  it('should not contain frontend build tool references', () => {
    for (const f of task032Files) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/vite\.config|webpack|next\.config/i);
    }
  });

  it('should not contain frontend test framework references', () => {
    for (const f of task032Files) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/@testing-library|cypress|playwright/i);
    }
  });

  it('should not contain frontend API client references', () => {
    for (const f of task032Files) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/axios|fetch.*frontend/i);
    }
  });

  it('should not contain frontend component test references', () => {
    for (const f of task032Files) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/component.?test/i);
    }
  });
});
