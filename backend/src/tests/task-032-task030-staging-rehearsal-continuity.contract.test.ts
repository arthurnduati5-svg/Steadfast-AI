import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Task 032 - Task 030 Staging Rehearsal Continuity Contract', () => {
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

  it('should preserve Task 030 staging patterns', () => {
    const allContent = task032Files.map(f => fs.readFileSync(f, 'utf-8')).join('\n');
    expect(allContent).toMatch(/canary|activation/i);
  });

  it('should use Task 030 environment configuration', () => {
    const allContent = task032Files.map(f => fs.readFileSync(f, 'utf-8')).join('\n');
    expect(allContent).toMatch(/canaryStartWindow|canaryEndWindow/i);
  });

  it('should respect staging-only constraints from Task 030', () => {
    for (const f of task032Files) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/production.*staging/i);
    }
  });

  it('should include monitoring snapshot from Task 030', () => {
    const allContent = task032Files.map(f => fs.readFileSync(f, 'utf-8')).join('\n');
    expect(allContent).toMatch(/monitoringSnapshot/i);
  });

  it('should include canary cap from Task 030', () => {
    const allContent = task032Files.map(f => fs.readFileSync(f, 'utf-8')).join('\n');
    expect(allContent).toMatch(/canaryCap|maxCanaryLearners/i);
  });

  it('should maintain rehearsal identity from Task 030', () => {
    const allContent = task032Files.map(f => fs.readFileSync(f, 'utf-8')).join('\n');
    expect(allContent).toMatch(/controlled.?canary/i);
  });

  it('should not escalate canary beyond staging limits', () => {
    const configTests = task032Files.filter(f => f.includes('config') || f.includes('Config'));
    for (const f of configTests) {
      const content = fs.readFileSync(f, 'utf-8');
      if (content.includes('maxCanaryLearners')) {
        expect(content).not.toMatch(/1000|unlimited/i);
      }
    }
  });

  it('should include activation state machine patterns from Task 030', () => {
    const allContent = task032Files.map(f => fs.readFileSync(f, 'utf-8')).join('\n');
    expect(allContent).toMatch(/activationState|activation.?state.?machine/i);
  });

  it('should validate allowed class IDs from Task 030', () => {
    const allContent = task032Files.map(f => fs.readFileSync(f, 'utf-8')).join('\n');
    expect(allContent).toMatch(/allowedClassIds/i);
  });

  it('should not bypass cohort eligibility from Task 030', () => {
    for (const f of task032Files) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/bypass.*cohort/i);
    }
  });

  it('should reference Task 030 proof of staging', () => {
    const allContent = task032Files.map(f => fs.readFileSync(f, 'utf-8')).join('\n');
    expect(allContent).toMatch(/task031|Task.?031/i);
  });

  it('should use staging-safe school identifiers', () => {
    const allContent = task032Files.map(f => fs.readFileSync(f, 'utf-8')).join('\n');
    expect(allContent).toMatch(/school_task032/i);
  });
});
