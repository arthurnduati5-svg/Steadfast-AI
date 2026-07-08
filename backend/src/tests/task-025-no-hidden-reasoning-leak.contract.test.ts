import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { resolve, sep } from 'path';

const servicesDir = resolve(__dirname, '..', 'services');
const routesDir = resolve(__dirname, '..', 'routes');
const libDir = resolve(__dirname, '..', 'lib');
const contractsDir = resolve(__dirname, '..', 'contracts');

const HIDDEN_REASONING_PATTERNS: RegExp[] = [
  /\bchainOfThought\b/,
  /\bhiddenReasoning\b/,
  /\bscratchpad\b/,
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
        matches.push(`Pattern "${pattern.source}" matched in ${filePath.split(sep).pop()}`);
      }
    }
    return matches;
  } catch {
    return [];
  }
}

const SOURCE_DIRS = [servicesDir, routesDir, libDir];

describe('task025NoHiddenReasoningLeakContract', () => {
  const allTask025Files = getTask025Files(SOURCE_DIRS);

  it('at least one task025 source file exists to scan', () => {
    expect(allTask025Files.length).toBeGreaterThan(0);
  });

  it('no task025 file contains chainOfThought field', () => {
    const violations = allTask025Files.flatMap((f) => scanFile(f, [/\bchainOfThought\b/]));
    expect(violations).toEqual([]);
  });

  it('no task025 file contains hiddenReasoning field', () => {
    const violations = allTask025Files.flatMap((f) => scanFile(f, [/\bhiddenReasoning\b/]));
    expect(violations).toEqual([]);
  });

  it('no task025 file contains scratchpad field', () => {
    const violations = allTask025Files.flatMap((f) => scanFile(f, [/\bscratchpad\b/]));
    expect(violations).toEqual([]);
  });

  it('no task025 file contains any hidden reasoning patterns', () => {
    const combined = allTask025Files
      .map((f) => ({ file: f, content: readFileSync(f, 'utf-8') }))
      .filter(({ content }) => HIDDEN_REASONING_PATTERNS.some((p) => p.test(content)));
    expect(combined).toEqual([]);
  });

  it('all hidden reasoning patterns from FORBIDDEN_FIELDS are covered', () => {
    const sources = HIDDEN_REASONING_PATTERNS.map((r) => r.source);
    expect(sources).toContain('\\bchainOfThought\\b');
    expect(sources).toContain('\\bhiddenReasoning\\b');
    expect(sources).toContain('\\bscratchpad\\b');
    expect(sources.length).toBe(3);
  });
});
