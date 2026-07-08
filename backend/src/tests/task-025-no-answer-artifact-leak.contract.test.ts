import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { resolve, sep } from 'path';

const servicesDir = resolve(__dirname, '..', 'services');
const routesDir = resolve(__dirname, '..', 'routes');
const libDir = resolve(__dirname, '..', 'lib');
const contractsDir = resolve(__dirname, '..', 'contracts');

const ANSWER_ARTIFACT_PATTERNS: RegExp[] = [
  /\banswerKey\b/,
  /\bcorrectAnswer\b/,
  /\bmodelAnswer\b/,
  /\bmarkingScheme\b/,
  /\bteacherOnlyContent\b/,
  /\bteacherOnlyNote\b/,
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

describe('task025NoAnswerArtifactLeakContract', () => {
  const allTask025Files = getTask025Files(SOURCE_DIRS);

  it('at least one task025 source file exists to scan', () => {
    expect(allTask025Files.length).toBeGreaterThan(0);
  });

  it('no task025 file contains answerKey or correctAnswer fields', () => {
    const violations = allTask025Files.flatMap((f) =>
      scanFile(f, [/\banswerKey\b/, /\bcorrectAnswer\b/]),
    );
    expect(violations).toEqual([]);
  });

  it('no task025 file contains modelAnswer or markingScheme fields', () => {
    const violations = allTask025Files.flatMap((f) =>
      scanFile(f, [/\bmodelAnswer\b/, /\bmarkingScheme\b/]),
    );
    expect(violations).toEqual([]);
  });

  it('no task025 file contains teacherOnlyContent field', () => {
    const violations = allTask025Files.flatMap((f) => scanFile(f, [/\bteacherOnlyContent\b/]));
    expect(violations).toEqual([]);
  });

  it('no task025 file contains teacherOnlyNote field', () => {
    const violations = allTask025Files.flatMap((f) => scanFile(f, [/\bteacherOnlyNote\b/]));
    expect(violations).toEqual([]);
  });

  it('no task025 file contains any answer artifact patterns', () => {
    const combined = allTask025Files
      .map((f) => ({ file: f, content: readFileSync(f, 'utf-8') }))
      .filter(({ content }) => ANSWER_ARTIFACT_PATTERNS.some((p) => p.test(content)));
    expect(combined).toEqual([]);
  });
});
