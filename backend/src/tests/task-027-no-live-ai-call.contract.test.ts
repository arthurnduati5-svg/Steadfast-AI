import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const SERVICES_DIR = resolve(__dirname, '../services');

function getTask027ServiceFiles(): string[] {
  return readdirSync(SERVICES_DIR)
    .filter(f => f.startsWith('task027') && f.endsWith('.ts'))
    .map(f => resolve(SERVICES_DIR, f));
}

const AI_PROVIDER_PATTERNS = [
  { pattern: /fetch\(/, label: 'fetch call' },
  { pattern: /axios\./, label: 'axios call' },
  { pattern: /openai\./, label: 'openai client call' },
  { pattern: /OpenAI/, label: 'OpenAI class reference' },
  { pattern: /anthropic/, label: 'anthropic client call' },
  { pattern: /gemini/, label: 'gemini client call' },
];

describe('task027NoLiveAiCallContract', () => {
  it('governance files contain no fetch calls', () => {
    const files = getTask027ServiceFiles();
    for (const filePath of files) {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).not.toMatch(/fetch\(/);
    }
  });

  it('governance files contain no axios calls', () => {
    const files = getTask027ServiceFiles();
    for (const filePath of files) {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).not.toMatch(/axios\./);
    }
  });

  it('governance files contain no OpenAI client usage', () => {
    const files = getTask027ServiceFiles();
    for (const filePath of files) {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).not.toMatch(/openai\./i);
    }
  });

  it('governance files contain no anthropic or gemini references', () => {
    const files = getTask027ServiceFiles();
    for (const filePath of files) {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).not.toMatch(/anthropic/i);
      expect(content).not.toMatch(/gemini/i);
    }
  });

  it('contracts file references only safe forbidden field strings, not actual AI calls', () => {
    const contractsPath = resolve(__dirname, '../contracts/task027PilotExpansionGovernanceContracts.ts');
    const content = readFileSync(contractsPath, 'utf-8');
    expect(content).not.toMatch(/fetch\(/);
    expect(content).not.toMatch(/openai\./i);
    expect(content).not.toMatch(/anthropic/i);
  });
});
