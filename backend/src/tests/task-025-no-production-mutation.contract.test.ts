import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { resolve, sep } from 'path';

const servicesDir = resolve(__dirname, '..', 'services');
const routesDir = resolve(__dirname, '..', 'routes');
const libDir = resolve(__dirname, '..', 'lib');

const MUTATION_PATTERNS: RegExp[] = [
  /\bprisma\.\$executeRaw\b/,
  /\bprisma\.\$executeRawUnsafe\b/,
  /\bprisma\.\$queryRawUnsafe\b/,
  /\bUPDATE\s+\w+\s+SET\b/i,
  /\bDELETE\s+FROM\b/i,
  /\bDROP\s+(TABLE|DATABASE|SCHEMA|INDEX|VIEW)\b/i,
  /\bALTER\s+TABLE\b/i,
  /\bTRUNCATE\s+\w+/i,
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

describe('task025NoProductionMutationContract', () => {
  const allTask025Files = getTask025Files([servicesDir, routesDir, libDir]);

  it('at least one task025 source file exists to scan', () => {
    expect(allTask025Files.length).toBeGreaterThan(0);
  });

  it('no task025 file contains raw Prisma mutation calls', () => {
    const violations = allTask025Files.flatMap((f) =>
      scanFile(f, [/\bprisma\.\$executeRaw\b/, /\bprisma\.\$executeRawUnsafe\b/, /\bprisma\.\$queryRawUnsafe\b/]),
    );
    expect(violations).toEqual([]);
  });

  it('no task025 file contains SQL data manipulation commands', () => {
    const violations = allTask025Files.flatMap((f) =>
      scanFile(f, [/\bUPDATE\s+\w+\s+SET\b/i, /\bDELETE\s+FROM\b/i, /\bTRUNCATE\s+\w+/i]),
    );
    expect(violations).toEqual([]);
  });

  it('no task025 file contains SQL schema mutation commands', () => {
    const violations = allTask025Files.flatMap((f) =>
      scanFile(f, [/\bDROP\s+(TABLE|DATABASE|SCHEMA|INDEX|VIEW)\b/i, /\bALTER\s+TABLE\b/i]),
    );
    expect(violations).toEqual([]);
  });

  it('no task025 file contains any production mutation patterns', () => {
    const combined = allTask025Files
      .map((f) => ({ file: f, content: readFileSync(f, 'utf-8') }))
      .filter(({ content }) => MUTATION_PATTERNS.some((p) => p.test(content)));
    expect(combined).toEqual([]);
  });
});
