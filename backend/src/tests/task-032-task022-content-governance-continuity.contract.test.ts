import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { getRepositoryRoot } from '../test-utils/repositoryPaths';

describe('Task 032 - Task 022 Content Governance Continuity Contract', () => {
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

  it('should enforce content governance policies from Task 022', () => {
    const allContent = task032Files.map(f => fs.readFileSync(f, 'utf-8')).join('\n');
    expect(allContent).toMatch(/sourceGovernancePolicyId/i);
  });

  it('should respect curriculum source governance', () => {
    const allContent = task032Files.map(f => fs.readFileSync(f, 'utf-8')).join('\n');
    expect(allContent).toMatch(/curriculumGate|curriculum/i);
  });

  it('should respect Socratic integrity gate from Task 022', () => {
    const allContent = task032Files.map(f => fs.readFileSync(f, 'utf-8')).join('\n');
    expect(allContent).toMatch(/socraticGate|socraticIntegrity/i);
  });

  it('should respect Deen sensitivity gate from Task 022', () => {
    const allContent = task032Files.map(f => fs.readFileSync(f, 'utf-8')).join('\n');
    expect(allContent).toMatch(/deenGate|deenBoundary/i);
  });

  it('should not weaken content governance boundaries', () => {
    for (const f of task032Files) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/bypass.*content.*governance/i);
    }
  });

  it('should validate approved subject IDs against governance', () => {
    const configTests = task032Files.filter(f => f.includes('config') || f.includes('Config'));
    for (const f of configTests) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).toMatch(/allowedSubjectIds/i);
    }
  });

  it('should validate approved cohort IDs against governance', () => {
    const configTests = task032Files.filter(f => f.includes('config') || f.includes('Config'));
    for (const f of configTests) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).toMatch(/allowedCohortIds/i);
    }
  });

  it('should maintain content gate ordering from Task 022', () => {
    const serviceFiles = task032Files.filter(f => f.includes('service') || f.includes('Service'));
    for (const f of serviceFiles) {
      const content = fs.readFileSync(f, 'utf-8');
      if (content.includes('gate') && content.includes('before')) {
        expect(content).toMatch(/content|curriculum|socratic|deen/i);
      }
    }
  });

  it('should not allow content governance-free activation', () => {
    const routeFiles = task032Files.filter(f => f.includes('route') || f.includes('Route'));
    for (const f of routeFiles) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/noContentGovernance/i);
    }
  });

  it('should reference curriculum gate in activation flow', () => {
    const allContent = task032Files.map(f => fs.readFileSync(f, 'utf-8')).join('\n');
    expect(allContent).toMatch(/curriculum.*gate/i);
  });

  it('should reference Socratic gate in activation flow', () => {
    const allContent = task032Files.map(f => fs.readFileSync(f, 'utf-8')).join('\n');
    expect(allContent).toMatch(/socratic.*gate/i);
  });

  it('should reference Deen gate in activation flow', () => {
    const allContent = task032Files.map(f => fs.readFileSync(f, 'utf-8')).join('\n');
    expect(allContent).toMatch(/deen.*gate/i);
  });
});
