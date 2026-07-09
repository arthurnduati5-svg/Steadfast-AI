import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Task 032 - No Production Deployment Contract', () => {
  const task032Dir = path.resolve(__dirname, '../../');
  const task032Files: string[] = [];

  before(() => {
    const gather = (dir: string, acc: string[]) => {
      if (!fs.existsSync(dir)) return;
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const e of entries) {
        const full = path.join(dir, e.name);
        if (e.isDirectory() && !e.name.startsWith('node_modules') && !e.name.startsWith('.git') && !e.name.startsWith('.planning')) {
          gather(full, acc);
        } else if ((e.name.endsWith('.ts') || e.name.endsWith('.js') || e.name.endsWith('.cjs')) && e.name.includes('task-032')) {
          acc.push(full);
        }
      }
    };
    gather(task032Dir, task032Files);
  });

  it('should not contain production deployment scripts', () => {
    for (const f of task032Files) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/deploy.*prod/i);
    }
  });

  it('should not contain production environment references', () => {
    for (const f of task032Files) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/production.*env/i);
    }
  });

  it('should not contain live deployment commands', () => {
    for (const f of task032Files) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/npm.*deploy/i);
    }
  });

  it('should not contain production database mutations', () => {
    for (const f of task032Files) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/production.*db/i);
    }
  });

  it('should not contain production API key references', () => {
    for (const f of task032Files) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/prod.*api.?key/i);
    }
  });

  it('should not contain production URL references', () => {
    for (const f of task032Files) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/production.*url/i);
    }
  });

  it('should not contain production secrets or tokens', () => {
    for (const f of task032Files) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/production.*secret/i);
    }
  });

  it('should not contain production Kubernetes manifests', () => {
    for (const f of task032Files) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/k8s.*prod/i);
    }
  });

  it('should not contain production CI/CD references', () => {
    for (const f of task032Files) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/prod.*ci.?cd/i);
    }
  });

  it('should not contain production Docker references', () => {
    for (const f of task032Files) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/prod.*docker/i);
    }
  });

  it('should not contain production Terraform references', () => {
    for (const f of task032Files) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/prod.*terraform/i);
    }
  });

  it('should not contain production rollout references', () => {
    for (const f of task032Files) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/prod.*rollout/i);
    }
  });
});
