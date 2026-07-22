import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { getRepositoryRoot } from '../test-utils/repositoryPaths';

describe('Task 032 - Task 023 Deployment Readiness Continuity Contract', () => {
  const backendSrc = path.join(getRepositoryRoot(), 'backend', 'src');
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

  it('should maintain deployment readiness patterns from Task 023', () => {
    const allContent = task032Files.map(f => fs.readFileSync(f, 'utf-8')).join('\n');
    expect(allContent).toMatch(/rollback|kill.?switch|pause/i);
  });

  it('should include rollback policy references', () => {
    const allContent = task032Files.map(f => fs.readFileSync(f, 'utf-8')).join('\n');
    expect(allContent).toMatch(/rollbackPolicyId/i);
  });

  it('should include incident policy references', () => {
    const allContent = task032Files.map(f => fs.readFileSync(f, 'utf-8')).join('\n');
    expect(allContent).toMatch(/incidentPolicyId/i);
  });

  it('should not bypass deployment readiness checks', () => {
    for (const f of task032Files) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/deployment.*bypass/i);
    }
  });

  it('should validate environment flags from Task 023', () => {
    const allContent = task032Files.map(f => fs.readFileSync(f, 'utf-8')).join('\n');
    expect(allContent).toMatch(/TASK032_CONTROLLED_CANARY|controlled_canary|controlledCanary/i);
  });

  it('should enforce live student protection flag', () => {
    const allContent = task032Files.map(f => fs.readFileSync(f, 'utf-8')).join('\n');
    expect(allContent).toMatch(/TASK032_LIVE_STUDENT_PROTECTION|liveStudentPrivacy|LiveStudentPrivacy/i);
  });

  it('should include health budget policy references', () => {
    const allContent = task032Files.map(f => fs.readFileSync(f, 'utf-8')).join('\n');
    expect(allContent).toMatch(/healthBudgetId/i);
  });

  it('should include privacy boundary policy references', () => {
    const allContent = task032Files.map(f => fs.readFileSync(f, 'utf-8')).join('\n');
    expect(allContent).toMatch(/privacyBoundaryId/i);
  });

  it('should include consent authorization policy references', () => {
    const allContent = task032Files.map(f => fs.readFileSync(f, 'utf-8')).join('\n');
    expect(allContent).toMatch(/consentAuthorizationPolicyId/i);
  });

  it('should maintain deployment gate ordering from Task 023', () => {
    const serviceFiles = task032Files.filter(f => f.includes('service') || f.includes('Service'));
    for (const f of serviceFiles) {
      const content = fs.readFileSync(f, 'utf-8');
      if (content.includes('gate') && content.includes('rollback')) {
        expect(content).toMatch(/pause|resume|kill|rollback/i);
      }
    }
  });

  it('should not include production deployment commands', () => {
    for (const f of task032Files) {
      if (f.includes('contracts') || f.includes('Validation') || f.includes('Contracts') || f.includes('Service') || f.includes('Routes')) continue;
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/deploy.*prod/i);
    }
  });

  it('should include runtime guard patterns from Task 023', () => {
    const allContent = task032Files.map(f => fs.readFileSync(f, 'utf-8')).join('\n');
    expect(allContent).toMatch(/runtimeGuard/i);
  });
});
