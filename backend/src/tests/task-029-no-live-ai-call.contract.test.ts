import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Task 029 – No Live AI Call Code', () => {
  const task029ServiceFiles = fs.readdirSync(path.resolve(__dirname, '../services'))
    .filter(f => f.startsWith('task029') && f.endsWith('.ts'));

  for (const file of task029ServiceFiles) {
    const fullPath = path.resolve(__dirname, '../services', file);
    const source = fs.readFileSync(fullPath, 'utf8');

    it(`${file} must not make direct AI provider calls`, () => {
      expect(source).not.toMatch(/openai/i);
      expect(source).not.toMatch(/anthropic/i);
      expect(source).not.toMatch(/gemini/i);
      expect(source).not.toMatch(/bedrock/i);
    });

    it(`${file} must not import AI provider SDKs`, () => {
      expect(source).not.toMatch(/from ['"]openai['"]/);
      expect(source).not.toMatch(/from ['"]@anthropic/);
      expect(source).not.toMatch(/from ['"]@google/);
    });
  }

  it('contract must have liveAiCallIntroduced boolean', () => {
    const contractPath = path.resolve(__dirname, '../contracts/task029ExpansionOperationsContracts.ts');
    const contractSource = fs.readFileSync(contractPath, 'utf8');
    expect(contractSource).toContain('liveAiCallIntroduced');
  });

  it('route file must not make direct AI provider calls', () => {
    const routePath = path.resolve(__dirname, '../routes/task029ExpansionOperationsRoutes.ts');
    const routeSource = fs.readFileSync(routePath, 'utf8');
    expect(routeSource).not.toContain('openai');
    expect(routeSource).not.toContain('anthropic');
    expect(routeSource).not.toContain('gemini');
  });
});
