import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { resolve, sep } from 'path';

const servicesDir = resolve(__dirname, '..', 'services');
const routesDir = resolve(__dirname, '..', 'routes');
const libDir = resolve(__dirname, '..', 'lib');
const contractsDir = resolve(__dirname, '..', 'contracts');

const CONNECTOR_PATTERNS: RegExp[] = [
  /\bschoolConnectorWrite\b/,
  /\bliveSchoolConnector\b/,
  /\bwriteToSchoolSystem\b/,
  /\brosterSync\b/,
  /\bschoolSystemWrite\b/,
  /\bconnectorWrite\b/,
  /\bschoolApiClient\b/,
  /\bschoolHttpClient\b/,
  /\bsisConnector\b/,
  /\bschoolDataWrite\b/,
  /\bpushToSchoolSystem\b/,
  /\bsendToSchoolApi\b/,
  /\bliveSchoolWrite\b/,
  /\bliveRosterSync\b/,
  /\bwriteBackToSis\b/,
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

describe('task025NoLiveSchoolConnectorWriteContract', () => {
  const allTask025Files = getTask025Files(SOURCE_DIRS);

  it('at least one task025 source file exists to scan', () => {
    expect(allTask025Files.length).toBeGreaterThan(0);
  });

  it('no task025 file references schoolConnectorWrite or liveSchoolConnector', () => {
    const violations = allTask025Files.flatMap((f) =>
      scanFile(f, [/\bschoolConnectorWrite\b/, /\bliveSchoolConnector\b/]),
    );
    expect(violations).toEqual([]);
  });

  it('no task025 file references writeToSchoolSystem or schoolSystemWrite', () => {
    const violations = allTask025Files.flatMap((f) =>
      scanFile(f, [/\bwriteToSchoolSystem\b/, /\bschoolSystemWrite\b/, /\bwriteBackToSis\b/]),
    );
    expect(violations).toEqual([]);
  });

  it('no task025 file references rosterSync or liveRosterSync', () => {
    const violations = allTask025Files.flatMap((f) =>
      scanFile(f, [/\brosterSync\b/, /\bliveRosterSync\b/]),
    );
    expect(violations).toEqual([]);
  });

  it('no task025 file references school API clients or connectors', () => {
    const violations = allTask025Files.flatMap((f) =>
      scanFile(f, [/\bschoolApiClient\b/, /\bschoolHttpClient\b/, /\bsisConnector\b/]),
    );
    expect(violations).toEqual([]);
  });

  it('no task025 file contains live school write patterns', () => {
    const violations = allTask025Files.flatMap((f) =>
      scanFile(f, [/\bschoolDataWrite\b/, /\bpushToSchoolSystem\b/, /\bsendToSchoolApi\b/, /\bliveSchoolWrite\b/]),
    );
    expect(violations).toEqual([]);
  });
});
