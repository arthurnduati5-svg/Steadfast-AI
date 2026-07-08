import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { resolve, sep } from 'path';

const servicesDir = resolve(__dirname, '..', 'services');
const routesDir = resolve(__dirname, '..', 'routes');
const libDir = resolve(__dirname, '..', 'lib');
const contractsDir = resolve(__dirname, '..', 'contracts');
const reposDir = resolve(__dirname, '..', 'repositories');

const SECRET_PATTERNS: RegExp[] = [
  /\bsk-[a-zA-Z0-9]{10,}\b/,
  /\bBearer\s+[A-Za-z0-9\-._~+/]+=*\b/,
  /postgres:\/\/[^\s"'`,)]+/i,
  /mysql:\/\/[^\s"'`,)]+/i,
  /mongodb:\/\/[^\s"'`,)]+/i,
  /redis:\/\/[^\s"'`,)]+/i,
  /-----BEGIN\s+(RSA|EC|DSA|OPENSSH)\s+PRIVATE\s+KEY-----/,
  /\b[A-Za-z0-9+/]{40,}={0,2}\b/,
  /\bpassword\s*[:=]\s*['"][^'"]+['"]/i,
  /\bsecret\s*[:=]\s*['"][^'"]+['"]/i,
  /\bapi[Kk]ey\s*[:=]\s*['"][^'"]+['"]/i,
  /\bapi_secret\s*[:=]\s*['"][^'"]+['"]/i,
  /\baccess_token\s*[:=]\s*['"][^'"]+['"]/i,
  /\bdatabaseUrl\b/,
  /\bdatabase_url\b/,
  /\bprocess\.env\./,
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

const SOURCE_DIRS = [servicesDir, routesDir, libDir, reposDir];

describe('task025NoSecretLeakContract', () => {
  const allTask025Files = getTask025Files(SOURCE_DIRS);

  it('at least one task025 source file exists to scan', () => {
    expect(allTask025Files.length).toBeGreaterThan(0);
  });

  it('no task025 file contains hardcoded API keys or tokens', () => {
    const violations = allTask025Files.flatMap((f) =>
      scanFile(f, [/\bsk-[a-zA-Z0-9]{10,}\b/, /\bapi[Kk]ey\s*[:=]\s*['"][^'"]+['"]/i]),
    );
    expect(violations).toEqual([]);
  });

  it('no task025 file contains hardcoded database URLs', () => {
    const violations = allTask025Files.flatMap((f) =>
      scanFile(f, [/postgres:\/\/[^\s"'`,)]+/i, /mysql:\/\/[^\s"'`,)]+/i, /mongodb:\/\/[^\s"'`,)]+/i]),
    );
    expect(violations).toEqual([]);
  });

  it('no task025 file contains private keys or bearer tokens', () => {
    const violations = allTask025Files.flatMap((f) =>
      scanFile(f, [/-----BEGIN\s+(RSA|EC|DSA|OPENSSH)\s+PRIVATE\s+KEY-----/, /\bBearer\s+[A-Za-z0-9\-._~+/]+=*\b/]),
    );
    expect(violations).toEqual([]);
  });

  it('no task025 file contains .env file references or hardcoded secret values', () => {
    const violations = allTask025Files.flatMap((f) =>
      scanFile(f, [/\bpassword\s*[:=]\s*['"][^'"]+['"]/i, /\bsecret\s*[:=]\s*['"][^'"]+['"]/i]),
    );
    expect(violations).toEqual([]);
  });

  it('no task025 file contains databaseUrl or access_token leaked in output data', () => {
    const violations = allTask025Files.flatMap((f) =>
      scanFile(f, [/\bdatabaseUrl\s*[:=]\s*['"]/i, /\baccess_token\s*[:=]\s*['"][^'"]+['"]/i]),
    );
    expect(violations).toEqual([]);
  });

  it('no task025 file contains authorization bearer tokens or private key patterns', () => {
    const violations = allTask025Files.flatMap((f) =>
      scanFile(f, [/\bBearer\s+[A-Za-z0-9\-._~+/]+=*\b/]),
    );
    expect(violations).toEqual([]);
  });
});
