import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const GOVERNANCE_DIRS = [
  resolve(__dirname, '../services'),
  resolve(__dirname, '../contracts'),
  resolve(__dirname, '../routes'),
];

function getGovernanceFiles(): string[] {
  const files: string[] = [];
  for (const dir of GOVERNANCE_DIRS) {
    const entries = readdirSync(dir).filter(f =>
      f.startsWith('task027') && f.endsWith('.ts')
    );
    for (const entry of entries) {
      files.push(resolve(dir, entry));
    }
  }
  return files;
}

describe('task027NoProductionMutationContract', () => {
  it('governance files do not contain DROP TABLE or DROP DATABASE', () => {
    const files = getGovernanceFiles();
    for (const filePath of files) {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).not.toMatch(/DROP\s+TABLE/i);
      expect(content).not.toMatch(/DROP\s+DATABASE/i);
    }
  });

  it('governance files do not contain DELETE FROM or TRUNCATE', () => {
    const files = getGovernanceFiles();
    for (const filePath of files) {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).not.toMatch(/DELETE\s+FROM/i);
      expect(content).not.toMatch(/TRUNCATE\s+/i);
    }
  });

  it('governance files do not contain ALTER TABLE', () => {
    const files = getGovernanceFiles();
    for (const filePath of files) {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).not.toMatch(/ALTER\s+TABLE/i);
    }
  });

  it('governance files do not contain backup or restore commands', () => {
    const files = getGovernanceFiles();
    for (const filePath of files) {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).not.toContain('pg_dump');
      expect(content).not.toContain('pg_restore');
      expect(content).not.toContain('mysqldump');
      expect(content).not.toContain('mongodump');
      expect(content).not.toContain('mongorestore');
    }
  });

  it('pause rollback readiness service does not execute destructive operations', () => {
    const pausePath = resolve(__dirname, '../services/task027PauseRollbackReadinessReviewService.ts');
    const content = readFileSync(pausePath, 'utf-8');
    expect(content).not.toContain('prisma');
    expect(content).not.toContain('DROP');
  });
});
