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

const DEPLOYMENT_PATTERNS = [
  'prisma migrate deploy',
  'prisma db push',
  'prisma generate',
  'npm run build',
  'npm run deploy',
  'docker compose up',
  'docker compose down',
  'npx prisma migrate deploy',
  'npx prisma db push',
];

describe('task027NoProductionDeploymentContract', () => {
  it('governance files do not contain prisma migrate deploy', () => {
    const files = getGovernanceFiles();
    for (const filePath of files) {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).not.toContain('prisma migrate deploy');
    }
  });

  it('governance files do not contain prisma db push', () => {
    const files = getGovernanceFiles();
    for (const filePath of files) {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).not.toContain('prisma db push');
    }
  });

  it('governance files do not contain npm deploy commands', () => {
    const files = getGovernanceFiles();
    for (const filePath of files) {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).not.toContain('npm run deploy');
      expect(content).not.toContain('npm run build');
    }
  });

  it('governance files do not contain docker deployment commands', () => {
    const files = getGovernanceFiles();
    for (const filePath of files) {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).not.toContain('docker compose up');
      expect(content).not.toContain('docker compose down');
    }
  });
});
