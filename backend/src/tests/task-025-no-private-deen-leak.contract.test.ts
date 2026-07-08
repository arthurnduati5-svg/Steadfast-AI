import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { resolve, sep } from 'path';

const servicesDir = resolve(__dirname, '..', 'services');
const routesDir = resolve(__dirname, '..', 'routes');
const libDir = resolve(__dirname, '..', 'lib');
const contractsDir = resolve(__dirname, '..', 'contracts');

const DEEN_PATTERNS: RegExp[] = [
  /\bprivateDeenText\b/,
  /\bdeenSensitiveRaw\b/,
  /\bdeen_sensitive\b/,
  /\bfatwa\b/i,
  /\bsectarian\b/i,
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

describe('task025NoPrivateDeenLeakContract', () => {
  const allTask025Files = getTask025Files(SOURCE_DIRS);

  it('at least one task025 source file exists to scan', () => {
    expect(allTask025Files.length).toBeGreaterThan(0);
  });

  it('no task025 file contains privateDeenText field', () => {
    const violations = allTask025Files.flatMap((f) => scanFile(f, [/\bprivateDeenText\b/]));
    expect(violations).toEqual([]);
  });

  it('no task025 file contains deenSensitiveRaw field', () => {
    const violations = allTask025Files.flatMap((f) => scanFile(f, [/\bdeenSensitiveRaw\b/]));
    expect(violations).toEqual([]);
  });

  it('no task025 file contains deen_sensitive field', () => {
    const violations = allTask025Files.flatMap((f) => scanFile(f, [/\bdeen_sensitive\b/]));
    expect(violations).toEqual([]);
  });

  it('no task025 file contains fatwa references', () => {
    const violations = allTask025Files.flatMap((f) => scanFile(f, [/\bfatwa\b/i]));
    expect(violations).toEqual([]);
  });

  it('no task025 file contains sectarian references', () => {
    const violations = allTask025Files.flatMap((f) => scanFile(f, [/\bsectarian\b/i]));
    expect(violations).toEqual([]);
  });
});
