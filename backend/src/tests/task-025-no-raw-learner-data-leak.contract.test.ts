import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { resolve, sep } from 'path';

const servicesDir = resolve(__dirname, '..', 'services');
const routesDir = resolve(__dirname, '..', 'routes');
const libDir = resolve(__dirname, '..', 'lib');
const contractsDir = resolve(__dirname, '..', 'contracts');

const RAW_LEARNER_PATTERNS: RegExp[] = [
  /\brawStudentData\b/,
  /\brawLearnerData\b/,
  /\brawParentData\b/,
  /\brawTeacherData\b/,
  /\brawChat\b/,
  /\brawMessage\b/,
  /\brawStudentAnswer\b/,
  /\brawStudentWork\b/,
  /\bstudentPhone\b/,
  /\bstudentEmail\b/,
  /\bparentPhone\b/,
  /\bparentEmail\b/,
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

describe('task025NoRawLearnerDataLeakContract', () => {
  const allTask025Files = getTask025Files(SOURCE_DIRS);

  it('at least one task025 source file exists to scan', () => {
    expect(allTask025Files.length).toBeGreaterThan(0);
  });

  it('no task025 file contains rawStudentData or rawLearnerData fields', () => {
    const violations = allTask025Files.flatMap((f) =>
      scanFile(f, [/\brawStudentData\b/, /\brawLearnerData\b/]),
    );
    expect(violations).toEqual([]);
  });

  it('no task025 file contains rawParentData or rawTeacherData fields', () => {
    const violations = allTask025Files.flatMap((f) =>
      scanFile(f, [/\brawParentData\b/, /\brawTeacherData\b/]),
    );
    expect(violations).toEqual([]);
  });

  it('no task025 file contains rawChat or rawMessage fields', () => {
    const violations = allTask025Files.flatMap((f) =>
      scanFile(f, [/\brawChat\b/, /\brawMessage\b/]),
    );
    expect(violations).toEqual([]);
  });

  it('no task025 file contains rawStudentAnswer or rawStudentWork fields', () => {
    const violations = allTask025Files.flatMap((f) =>
      scanFile(f, [/\brawStudentAnswer\b/, /\brawStudentWork\b/]),
    );
    expect(violations).toEqual([]);
  });

  it('no task025 file contains student or parent contact fields', () => {
    const violations = allTask025Files.flatMap((f) =>
      scanFile(f, [/\bstudentPhone\b/, /\bstudentEmail\b/, /\bparentPhone\b/, /\bparentEmail\b/]),
    );
    expect(violations).toEqual([]);
  });
});
