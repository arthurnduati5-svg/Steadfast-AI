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

const SENSITIVE_PATTERNS = [
  'DATABASE_URL',
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
  'GEMINI_API_KEY',
  'JWT_SECRET',
  'REDIS_PASSWORD',
  'AWS_ACCESS_KEY',
  'AWS_SECRET_ACCESS_KEY',
  'S3_BUCKET',
  'POSTGRES_PASSWORD',
  'MONGODB_URI',
  'SENDGRID_API_KEY',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
];

describe('task027NoSecretLeakContract', () => {
  it('service files do not contain DATABASE_URL', () => {
    const files = getGovernanceFiles();
    for (const filePath of files) {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).not.toContain('DATABASE_URL');
    }
  });

  it('service files do not contain OPENAI_API_KEY or ANTHROPIC_API_KEY', () => {
    const files = getGovernanceFiles();
    for (const filePath of files) {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).not.toContain('OPENAI_API_KEY');
      expect(content).not.toContain('ANTHROPIC_API_KEY');
    }
  });

  it('service files do not contain JWT_SECRET or REDIS_PASSWORD', () => {
    const files = getGovernanceFiles();
    for (const filePath of files) {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).not.toContain('JWT_SECRET');
      expect(content).not.toContain('REDIS_PASSWORD');
    }
  });

  it('service files do not contain AWS credential patterns', () => {
    const files = getGovernanceFiles();
    for (const filePath of files) {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).not.toContain('AWS_ACCESS_KEY');
      expect(content).not.toContain('AWS_SECRET_ACCESS_KEY');
    }
  });

  it('service files do not contain SENDGRID_API_KEY or TWILIO secrets', () => {
    const files = getGovernanceFiles();
    for (const filePath of files) {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).not.toContain('SENDGRID_API_KEY');
      expect(content).not.toContain('TWILIO_ACCOUNT_SID');
      expect(content).not.toContain('TWILIO_AUTH_TOKEN');
    }
  });

  it('contracts file defines TASK027_FORBIDDEN_FIELDS as constants not secrets', () => {
    const contractsPath = resolve(__dirname, '../contracts/task027PilotExpansionGovernanceContracts.ts');
    const content = readFileSync(contractsPath, 'utf-8');
    expect(content).toContain('TASK027_FORBIDDEN_FIELDS');
    expect(content).not.toContain('DATABASE_URL');
    expect(content).not.toContain('OPENAI_API_KEY');
  });
});
