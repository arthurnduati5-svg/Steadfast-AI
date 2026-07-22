import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { getRepositoryRoot } from '../test-utils/repositoryPaths';

describe('Task 032 - No Hidden Reasoning Leak Contract', () => {
  const task032Dir = path.join(getRepositoryRoot(), 'backend', 'src');
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
    gather(task032Dir, task032Files);
  });

  it('should not contain hidden reasoning content', () => {
    for (const f of task032Files) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/hidden.?reasoning/i);
    }
  });

  it('should not contain provider prompt content', () => {
    for (const f of task032Files) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/provider.?prompt/i);
    }
  });

  it('should not contain provider response content', () => {
    for (const f of task032Files) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/provider.?response/i);
    }
  });

  it('should not contain raw AI model output', () => {
    for (const f of task032Files) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/raw.?ai.?output/i);
    }
  });

  it('should not contain model chain-of-thought text', () => {
    for (const f of task032Files) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/chain.?of.?thought/i);
    }
  });

  it('should not contain internal model reasoning', () => {
    for (const f of task032Files) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/internal.?reasoning/i);
    }
  });

  it('should not contain LLM raw inference output', () => {
    for (const f of task032Files) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/raw.?inference/i);
    }
  });

  it('should not contain model logprobs or token data', () => {
    for (const f of task032Files) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/logprob/i);
    }
  });

  it('should not contain raw provider metadata', () => {
    for (const f of task032Files) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/provider.?metadata/i);
    }
  });

  it('should not contain system prompt content', () => {
    for (const f of task032Files) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/system.?prompt/i);
    }
  });

  it('should not contain hidden model configuration', () => {
    for (const f of task032Files) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/hidden.?model.?config/i);
    }
  });

  it('should not contain hidden reasoning in route handlers', () => {
    const routeFiles = task032Files.filter(f => f.includes('route') || f.includes('Route'));
    for (const f of routeFiles) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content).not.toMatch(/reasoning/i);
    }
  });
});
