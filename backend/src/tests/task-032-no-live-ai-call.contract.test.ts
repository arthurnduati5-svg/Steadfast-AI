import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { TASK032_FORBIDDEN_SIDE_EFFECT_PATTERNS } from '../contracts/task032ControlledCanaryActivationContracts';

describe('Task 032 - No Live AI Call Contract', () => {
  const servicesDir = path.resolve(__dirname, '../services');
  const routesDir = path.resolve(__dirname, '../routes');

  const dirsToScan = [servicesDir, routesDir].filter(d => fs.existsSync(d));

  function listTask032Files(): string[] {
    const files: string[] = [];
    for (const dir of dirsToScan) {
      const entries = fs.readdirSync(dir);
      for (const entry of entries) {
        if (entry.includes('task032') && entry.endsWith('.ts')) {
          files.push(path.join(dir, entry));
        }
      }
    }
    return files;
  }

  it('should have no callLiveAi in any Task 032 service file', () => {
    const files = listTask032Files();
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).not.toMatch(/\bcallLiveAi\b/);
    }
  });

  it('should have no direct OpenAI API calls in Task 032 code', () => {
    const files = listTask032Files();
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).not.toMatch(/openai/i);
      expect(content).not.toMatch(/api\.openai/i);
    }
  });

  it('should have no Anthropic API calls in Task 032 code', () => {
    const files = listTask032Files();
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).not.toMatch(/anthropic/i);
    }
  });

  it('should have no direct AI model imports in Task 032 code', () => {
    const files = listTask032Files();
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).not.toMatch(/from.*ai.*sdk/i);
      expect(content).not.toMatch(/from.*llm/i);
    }
  });

  it('should forbid callLiveAi in side effect patterns', () => {
    expect(TASK032_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('callLiveAi');
  });

  it('should have the environment gate block live AI', () => {
    expect(TASK032_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('callLiveAi');
  });

  it('should not import any AI completion service', () => {
    const files = listTask032Files();
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).not.toMatch(/createCompletion/i);
      expect(content).not.toMatch(/generateText/i);
      expect(content).not.toMatch(/streamText/i);
    }
  });

  it('should have runtime guard block live AI', () => {
    const guardPath = path.join(servicesDir, 'task032CanaryRuntimeGuardService.ts');
    if (fs.existsSync(guardPath)) {
      const content = fs.readFileSync(guardPath, 'utf8');
      expect(content).toContain('ai');
    }
  });

  it('should have no AI provider packages imported', () => {
    const files = listTask032Files();
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).not.toMatch(/@langchain/i);
      expect(content).not.toMatch(/langchain/i);
    }
  });
});
