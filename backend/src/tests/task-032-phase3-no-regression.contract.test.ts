import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Task 032 - Phase 3 No Regression Contract', () => {
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
        } else if ((e.name.endsWith('.ts') || e.name.endsWith('.js') || e.name.endsWith('.cjs')) && (e.name.includes('task-032') || e.name.includes('task032')) && !e.name.endsWith('.test.ts') && !e.name.includes('Contracts') && !e.name.includes('Service') && !e.name.includes('Repository')) {
          acc.push(full);
        }
      }
    };
    gather(backendSrc, task032Files);
  });

  it('should not reintroduce school-wide cohort wildcard', () => {
    for (const f of task032Files) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/allowedCohortIds.*\*.*/);
    }
  });

  it('should not remove maxCanaryLearners cap', () => {
    const allContent = task032Files.map(f => fs.readFileSync(f, 'utf-8')).join('\n');
    expect(allContent).toMatch(/maxCanaryLearners/i);
  });

  it('should not weaken privacy boundary', () => {
    for (const f of task032Files) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/skip.*privacy/i);
    }
  });

  it('should not remove consent authorization', () => {
    const allContent = task032Files.map(f => fs.readFileSync(f, 'utf-8')).join('\n');
    expect(allContent).toMatch(/consentAuthorization/i);
  });

  it('should not remove runtime guard', () => {
    const allContent = task032Files.map(f => fs.readFileSync(f, 'utf-8')).join('\n');
    expect(allContent).toMatch(/runtimeGuard/i);
  });

  it('should not remove rollback proof capability', () => {
    const allContent = task032Files.map(f => fs.readFileSync(f, 'utf-8')).join('\n');
    expect(allContent).toMatch(/rollback/i);
  });

  it('should not remove incident bridge', () => {
    const allContent = task032Files.map(f => fs.readFileSync(f, 'utf-8')).join('\n');
    expect(allContent).toMatch(/incidentBridge/i);
  });

  it('should not remove health budget', () => {
    const allContent = task032Files.map(f => fs.readFileSync(f, 'utf-8')).join('\n');
    expect(allContent).toMatch(/healthBudget/i);
  });

  it('should not reintroduce AI before gates', () => {
    for (const f of task032Files) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/ai.*before.*gate/i);
    }
  });

  it('should not reintroduce memory before gates', () => {
    for (const f of task032Files) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/memory.*before.*gate/i);
    }
  });

  it('should not bypass Socratic gate', () => {
    for (const f of task032Files) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/bypass.*socratic/i);
    }
  });

  it('should not bypass Deen gate', () => {
    for (const f of task032Files) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/bypass.*deen/i);
    }
  });
});
