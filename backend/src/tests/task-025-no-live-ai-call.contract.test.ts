import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { resolve, sep } from 'path';

const servicesDir = resolve(__dirname, '..', 'services');
const routesDir = resolve(__dirname, '..', 'routes');
const libDir = resolve(__dirname, '..', 'lib');
const contractsDir = resolve(__dirname, '..', 'contracts');

const AI_PATTERNS: RegExp[] = [
  /\bopenai\b/i,
  /\banthropic\b/i,
  /\bcohere\b/i,
  /\bangolia\b/i,
  /\baiProvider\b/,
  /\baiProviderFactory\b/,
  /\blangchain\b/i,
  /\bllm\b/i,
  /\bproviderPrompt\b/,
  /\bproviderResponse\b/,
  /\brawProviderResponse\b/,
  /\bcreateAiProvider\b/,
  /\bAiProviderClient\b/,
  /\bliveAiCall\b/,
  /\bfrom\s+['"]openai['"]/i,
  /\bfrom\s+['"]@anthropic-ai\/sdk['"]/i,
  /\bfrom\s+['"].*\/aiProvider/i,
  /\bfrom\s+['"]langchain/i,
];

function getTask025Files(dirs: string[]): string[] {
  const files: string[] = [];
  for (const dir of dirs) {
    try {
      const entries = readdirSync(dir);
      for (const entry of entries) {
        if (entry.startsWith('task025') && entry.endsWith('.ts')) {
          files.push(resolve(dir, entry));
        }
      }
    } catch {
      // directory does not exist
    }
  }
  return files;
}

function scanFile(filePath: string, patterns: RegExp[]): string[] {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const matches: string[] = [];
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        matches.push(`Pattern "${pattern.source}" matched "${match[0]}" in ${filePath.split(sep).pop()}`);
      }
    }
    return matches;
  } catch {
    return [];
  }
}

const SOURCE_DIRS = [servicesDir, routesDir, libDir];

describe('task025NoLiveAiCallContract', () => {
  const allTask025Files = getTask025Files(SOURCE_DIRS);

  it('at least one task025 source file exists to scan', () => {
    expect(allTask025Files.length).toBeGreaterThan(0);
  });

  it('no task025 file imports or references OpenAI SDK', () => {
    const violations = allTask025Files.flatMap((f) =>
      scanFile(f, [/\bopenai\b/i, /\bfrom\s+['"]openai['"]/i]),
    );
    expect(violations).toEqual([]);
  });

  it('no task025 file imports or references Anthropic SDK', () => {
    const violations = allTask025Files.flatMap((f) =>
      scanFile(f, [/\banthropic\b/i, /\bfrom\s+['"]@anthropic-ai\/sdk['"]/i]),
    );
    expect(violations).toEqual([]);
  });

  it('no task025 file references aiProvider or aiProviderFactory', () => {
    const violations = allTask025Files.flatMap((f) =>
      scanFile(f, [/\baiProvider\b/, /\baiProviderFactory\b/, /\bcreateAiProvider\b/, /\bAiProviderClient\b/]),
    );
    expect(violations).toEqual([]);
  });

  it('no task025 file references provider prompts or raw provider responses', () => {
    const violations = allTask025Files.flatMap((f) =>
      scanFile(f, [/\bproviderPrompt\b/, /\bproviderResponse\b/, /\brawProviderResponse\b/]),
    );
    expect(violations).toEqual([]);
  });

  it('no task025 file contains langchain or generic llm references', () => {
    const violations = allTask025Files.flatMap((f) =>
      scanFile(f, [/\blangchain\b/i, /\bllm\b/i, /\bliveAiCall\b/]),
    );
    expect(violations).toEqual([]);
  });
});
