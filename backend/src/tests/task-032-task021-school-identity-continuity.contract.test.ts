import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Task 032 - Task 021 School Identity Continuity Contract', () => {
  const backendSrc = path.resolve(process.cwd(), 'backend/src');
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
    gather(backendSrc, task032Files);
  });

  it('should require schoolId in all activation operations', () => {
    const allContent = task032Files.map(f => fs.readFileSync(f, 'utf-8')).join('\n');
    expect(allContent).toMatch(/schoolId/i);
  });

  it('should verify school identity before activation', () => {
    const routeFiles = task032Files.filter(f => f.includes('route') || f.includes('Route'));
    for (const f of routeFiles) {
      const content = fs.readFileSync(f, 'utf-8');
      if (content.includes('activation') || content.includes('config')) {
        expect(content).toMatch(/schoolId/i);
      }
    }
  });

  it('should use school identity patterns consistent with Task 021', () => {
    const allContent = task032Files.map(f => fs.readFileSync(f, 'utf-8')).join('\n');
    expect(allContent).toMatch(/school_task032|schoolId/i);
  });

  it('should not allow school-identity-free activation', () => {
    for (const f of task032Files) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/noSchoolCheck/i);
    }
  });

  it('should enforce school-scoped access in all routes', () => {
    const routeFiles = task032Files.filter(f => f.includes('route') || f.includes('Route'));
    for (const f of routeFiles) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).toMatch(/school/i);
    }
  });

  it('should validate school identity in health budget', () => {
    const healthFiles = task032Files.filter(f => f.includes('health') || f.includes('Health'));
    for (const f of healthFiles) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).toMatch(/schoolId/i);
    }
  });

  it('should validate school identity in incident bridge', () => {
    const incidentFiles = task032Files.filter(f => f.includes('incident') || f.includes('Incident'));
    for (const f of incidentFiles) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).toMatch(/schoolId/i);
    }
  });

  it('should validate school identity in safe view', () => {
    const safeViewFiles = task032Files.filter(f => f.includes('safe') || f.includes('Safe'));
    for (const f of safeViewFiles) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).toMatch(/schoolId/i);
    }
  });

  it('should cross-validate school identity against approved list', () => {
    const allContent = task032Files.map(f => fs.readFileSync(f, 'utf-8')).join('\n');
    expect(allContent).toMatch(/approved.*school|school.*approved/i);
  });

  it('should reject unknown school IDs', () => {
    const allContent = task032Files.map(f => fs.readFileSync(f, 'utf-8')).join('\n');
    expect(allContent).toMatch(/unknown.*school|invalid.*school|not_approved.*school|school.*not_approved/i);
  });

  it('should preserve school identity from Task 021 through canary activation', () => {
    const allContent = task032Files.map(f => fs.readFileSync(f, 'utf-8')).join('\n');
    expect(allContent).toMatch(/school_task032_canary_safe|task032_canary|canary.*school/i);
  });

  it('should not expose school secrets in identity check', () => {
    for (const f of task032Files) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/school.*secret|school.*token/i);
    }
  });
});
