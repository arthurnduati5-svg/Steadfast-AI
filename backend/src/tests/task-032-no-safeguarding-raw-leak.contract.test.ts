import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { getRepositoryRoot } from '../test-utils/repositoryPaths';

describe('Task 032 - No Safeguarding Raw Data Leak Contract', () => {
  const task032Dir = path.join(getRepositoryRoot(), 'backend', 'src');
  const testFiles: string[] = [];
  const srcFiles: string[] = [];

  beforeAll(() => {
    const gatherFiles = (dir: string, ext: string, acc: string[]) => {
      if (!fs.existsSync(dir)) return;
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const e of entries) {
        const full = path.join(dir, e.name);
        if (e.isDirectory() && !e.name.startsWith('node_modules') && !e.name.startsWith('.git')) {
          gatherFiles(full, ext, acc);
        } else if (e.name.endsWith(ext) && (e.name.includes('task-032') || e.name.includes('task032')) && !e.name.endsWith('.test.ts')) {
          acc.push(full);
        }
      }
    };
    gatherFiles(task032Dir, '.test.ts', testFiles);
    gatherFiles(task032Dir, '.ts', srcFiles);
  });

  it('should not contain safeguarding raw details in any test file', () => {
    for (const f of testFiles) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/safeguarding.*raw/i);
      expect(content).not.toMatch(/raw.*safeguarding/i);
    }
  });

  it('should not contain safeguarding notes in any test file', () => {
    for (const f of testFiles) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/safeguarding.?notes/i);
    }
  });

  it('should not contain child-protection details in test files', () => {
    for (const f of testFiles) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/child.?protection.?detail/i);
    }
  });

  it('should not contain safeguarding referral data in test files', () => {
    for (const f of testFiles) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/safeguarding.?referral/i);
    }
  });

  it('should not export safeguarding raw data from services', () => {
    const serviceFiles = testFiles.filter(f => f.includes('service') || f.includes('Service'));
    for (const f of serviceFiles) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/raw.?safeguarding/i);
    }
  });

  it('should not expose safeguarding incident details in contracts', () => {
    const contractFiles = testFiles.filter(f => f.includes('contract'));
    for (const f of contractFiles) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/safeguarding.?incident/i);
    }
  });

  it('should not contain real safeguarding officer names', () => {
    for (const f of testFiles) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/safeguarding.?officer/i);
    }
  });

  it('should not expose safeguarding case IDs', () => {
    for (const f of testFiles) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/safeguarding.?case.?id/i);
    }
  });

  it('should not expose safeguarding risk assessments', () => {
    for (const f of testFiles) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/risk.?assessment/i);
    }
  });

  it('should not expose safeguarding action plans', () => {
    for (const f of testFiles) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/safeguarding.?action.?plan/i);
    }
  });

  it('should not leak safeguarding data in route tests', () => {
    const routeTests = testFiles.filter(f => f.includes('routes') || f.includes('Routes'));
    for (const f of routeTests) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/safeguarding.*detail/i);
    }
  });

  it('should not contain safeguarding data in runner scripts', () => {
    const runnerFiles = testFiles.filter(f => f.includes('runner') || f.includes('Runner'));
    for (const f of runnerFiles) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/safeguarding/i);
    }
  });
});
