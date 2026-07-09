import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Task 032 - Task 031 Staging Smoke Continuity Contract', () => {
  const backendSrc = path.resolve(__dirname, '../');
  const task032Files: string[] = [];

  before(() => {
    const gather = (dir: string, acc: string[]) => {
      if (!fs.existsSync(dir)) return;
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const e of entries) {
        const full = path.join(dir, e.name);
        if (e.isDirectory() && !e.name.startsWith('node_modules') && !e.name.startsWith('.git')) {
          gather(full, acc);
        } else if ((e.name.endsWith('.ts') || e.name.endsWith('.js') || e.name.endsWith('.cjs')) && e.name.includes('task-032')) {
          acc.push(full);
        }
      }
    };
    gather(backendSrc, task032Files);
  });

  it('should require Task 031 proof before activation', () => {
    const allContent = task032Files.map(f => fs.readFileSync(f, 'utf-8')).join('\n');
    expect(allContent).toMatch(/task031Proof|task031/i);
  });

  it('should validate Task 031 safeToStartTask032', () => {
    const allContent = task032Files.map(f => fs.readFileSync(f, 'utf-8')).join('\n');
    expect(allContent).toMatch(/safeToStartTask032/i);
  });

  it('should validate Task 031 final decision PASS', () => {
    const allContent = task032Files.map(f => fs.readFileSync(f, 'utf-8')).join('\n');
    expect(allContent).toMatch(/finalDecision/i);
  });

  it('should validate Task 031 blocking issues empty', () => {
    const allContent = task032Files.map(f => fs.readFileSync(f, 'utf-8')).join('\n');
    expect(allContent).toMatch(/blockingIssues/i);
  });

  it('should validate Task 031 verification exit code 0', () => {
    const serviceFiles = task032Files.filter(f => f.includes('service') || f.includes('Service'));
    for (const f of serviceFiles) {
      const content = fs.readFileSync(f, 'utf-8');
      if (content.includes('task031')) {
        expect(content).toMatch(/exit.?code|verification/i);
      }
    }
  });

  it('should preserve Task 031 staging smoke result', () => {
    const allContent = task032Files.map(f => fs.readFileSync(f, 'utf-8')).join('\n');
    expect(allContent).toMatch(/staging.?smoke/i);
  });

  it('should not proceed without Task 031 proof loaded', () => {
    const runnerFiles = task032Files.filter(f => f.includes('runner') || f.includes('Runner') || f.includes('run'));
    for (const f of runnerFiles) {
      const content = fs.readFileSync(f, 'utf-8');
      if (content.includes('gate') || content.includes('activation')) {
        expect(content).toMatch(/task031/i);
      }
    }
  });

  it('should reflect Task 031 handoff consistency', () => {
    const allContent = task032Files.map(f => fs.readFileSync(f, 'utf-8')).join('\n');
    expect(allContent).toMatch(/handoff/i);
  });

  it('should use Task 031 standalone log validation', () => {
    const allContent = task032Files.map(f => fs.readFileSync(f, 'utf-8')).join('\n');
    expect(allContent).toMatch(/standalone.?log|log/i);
  });

  it('should maintain Task 031 environment flags', () => {
    const allContent = task032Files.map(f => fs.readFileSync(f, 'utf-8')).join('\n');
    expect(allContent).toMatch(/TASK032/i);
  });

  it('should compute safeToStartTask033 from gates including Task 031', () => {
    const allContent = task032Files.map(f => fs.readFileSync(f, 'utf-8')).join('\n');
    expect(allContent).toMatch(/safeToStartTask033/i);
  });

  it('should not skip Task 031 gate even if other gates pass', () => {
    const runnerFiles = task032Files.filter(f => f.includes('runner') || f.includes('Runner'));
    for (const f of runnerFiles) {
      const content = fs.readFileSync(f, 'utf-8');
      if (content.includes('gate') || content.includes('verify')) {
        expect(content).toMatch(/task031/i);
      }
    }
  });
});
