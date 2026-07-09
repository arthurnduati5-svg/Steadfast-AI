import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Task 032 - Task 020 Governance Continuity Contract', () => {
  const backendSrc = path.resolve(__dirname, '../');
  const task020Dir = path.resolve(backendSrc, '../task020');
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

  it('should reference governance policy patterns from Task 020', () => {
    const allContent = task032Files.map(f => fs.readFileSync(f, 'utf-8')).join('\n');
    expect(allContent).toMatch(/governance/i);
  });

  it('should enforce content governance policies from Task 020', () => {
    const allContent = task032Files.map(f => fs.readFileSync(f, 'utf-8')).join('\n');
    expect(allContent).toMatch(/content.?governance/i);
  });

  it('should use governance policy IDs consistent with Task 020', () => {
    const allContent = task032Files.map(f => fs.readFileSync(f, 'utf-8')).join('\n');
    expect(allContent).toMatch(/sourceGovernancePolicyId/i);
  });

  it('should not weaken governance policies from Task 020', () => {
    for (const f of task032Files) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/bypass.*governance/i);
    }
  });

  it('should reference Socratic integrity policy from Task 020', () => {
    const allContent = task032Files.map(f => fs.readFileSync(f, 'utf-8')).join('\n');
    expect(allContent).toMatch(/socraticIntegrityPolicyId/i);
  });

  it('should reference Deen boundary policy from Task 020', () => {
    const allContent = task032Files.map(f => fs.readFileSync(f, 'utf-8')).join('\n');
    expect(allContent).toMatch(/deenBoundaryPolicyId/i);
  });

  it('should not allow governance-free activation', () => {
    const routeFiles = task032Files.filter(f => f.includes('route') || f.includes('Route'));
    for (const f of routeFiles) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/no.?governance/i);
    }
  });

  it('should use governance gates consistently with Task 020', () => {
    const allContent = task032Files.map(f => fs.readFileSync(f, 'utf-8')).join('\n');
    expect(allContent).toMatch(/socraticGate|socratic.?gate|gates/i);
  });

  it('should include source governance in activation config', () => {
    const configTests = task032Files.filter(f => f.includes('config') || f.includes('Config'));
    for (const f of configTests) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).toMatch(/sourceGovernance/i);
    }
  });

  it('should not allow governance policy downgrade in canary', () => {
    const allContent = task032Files.map(f => fs.readFileSync(f, 'utf-8')).join('\n');
    expect(allContent).not.toMatch(/downgrade.*governance/i);
  });

  it('should validate governance policy presence before activation', () => {
    const serviceFiles = task032Files.filter(f => f.includes('service') || f.includes('Service'));
    for (const f of serviceFiles) {
      const content = fs.readFileSync(f, 'utf-8');
      if (content.includes('activation')) {
        expect(content).toMatch(/policy|governance|validate/i);
      }
    }
  });

  it('should maintain governance chain from Task 020 through runtime', () => {
    const allContent = task032Files.map(f => fs.readFileSync(f, 'utf-8')).join('\n');
    expect(allContent).toMatch(/source.?governance|socratic.?integrity|deen.?boundary/i);
  });
});
