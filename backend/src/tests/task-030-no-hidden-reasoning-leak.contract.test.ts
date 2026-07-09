import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Task 030 - No Hidden Reasoning Leak Contract', () => {
  const baseDir = path.resolve(__dirname, '..');
  const dirs = ['services', 'contracts', 'lib', 'repositories', 'routes'];

  it('should not contain hiddenReasoning in task030 source files', () => {
    for (const dir of dirs) {
      const files = fs.readdirSync(path.join(baseDir, dir)).filter(f => f.startsWith('task030'));
      for (const file of files) {
        const content = fs.readFileSync(path.join(baseDir, dir, file), 'utf8');
        expect(content).not.toMatch(/\bhiddenReasoning\b/);
      }
    }
  });

  it('should not contain chainOfThought in task030 source files', () => {
    for (const dir of dirs) {
      const files = fs.readdirSync(path.join(baseDir, dir)).filter(f => f.startsWith('task030'));
      for (const file of files) {
        const content = fs.readFileSync(path.join(baseDir, dir, file), 'utf8');
        expect(content).not.toMatch(/\bchainOfThought\b/);
      }
    }
  });

  it('should not contain scratchpad in task030 source files', () => {
    for (const dir of dirs) {
      const files = fs.readdirSync(path.join(baseDir, dir)).filter(f => f.startsWith('task030'));
      for (const file of files) {
        const content = fs.readFileSync(path.join(baseDir, dir, file), 'utf8');
        expect(content).not.toMatch(/\bscratchpad\b/);
      }
    }
  });

  it('should not contain providerPrompt in task030 source files', () => {
    for (const dir of dirs) {
      const files = fs.readdirSync(path.join(baseDir, dir)).filter(f => f.startsWith('task030'));
      for (const file of files) {
        const content = fs.readFileSync(path.join(baseDir, dir, file), 'utf8');
        expect(content).not.toMatch(/\bproviderPrompt\b/);
      }
    }
  });

  it('should not contain providerResponse in task030 source files', () => {
    for (const dir of dirs) {
      const files = fs.readdirSync(path.join(baseDir, dir)).filter(f => f.startsWith('task030'));
      for (const file of files) {
        const content = fs.readFileSync(path.join(baseDir, dir, file), 'utf8');
        expect(content).not.toMatch(/\bproviderResponse\b/);
      }
    }
  });

  it('should not contain rawProviderResponse in task030 source files', () => {
    for (const dir of dirs) {
      const files = fs.readdirSync(path.join(baseDir, dir)).filter(f => f.startsWith('task030'));
      for (const file of files) {
        const content = fs.readFileSync(path.join(baseDir, dir, file), 'utf8');
        expect(content).not.toMatch(/\brawProviderResponse\b/);
      }
    }
  });
});
