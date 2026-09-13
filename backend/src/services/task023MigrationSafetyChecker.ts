import { existsSync, readdirSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { DeploymentReadinessStatus, ReadinessSeverity, MigrationSafetyResult, ReadinessCheckResult } from '../contracts/task023DeploymentReadinessContracts';

const DANGEROUS_PATTERNS = [
  { pattern: /DROP\s+TABLE/i, label: 'DROP TABLE' },
  { pattern: /DROP\s+COLUMN/i, label: 'DROP COLUMN' },
  { pattern: /TRUNCATE\s+/i, label: 'TRUNCATE' },
  { pattern: /DELETE\s+FROM/i, label: 'DELETE FROM' },
  { pattern: /ALTER\s+TABLE.*DROP/i, label: 'ALTER TABLE ... DROP' },
  { pattern: /DROP\s+INDEX/i, label: 'DROP INDEX' },
  { pattern: /CASCADE/i, label: 'CASCADE (review required)' },
  { pattern: /RESTART\s+IDENTITY/i, label: 'RESTART IDENTITY (destructive)' },
];

const SAFE_PATTERNS = [
  { pattern: /CREATE\s+TABLE/i, label: 'CREATE TABLE' },
  { pattern: /ALTER\s+TABLE.*ADD\s+(COLUMN\s+)?/i, label: 'ALTER TABLE ADD COLUMN' },
  { pattern: /CREATE\s+INDEX/i, label: 'CREATE INDEX' },
  { pattern: /CREATE\s+UNIQUE\s+INDEX/i, label: 'CREATE UNIQUE INDEX' },
  { pattern: /ALTER\s+TABLE.*ALTER\s+COLUMN/i, label: 'ALTER TABLE ALTER COLUMN' },
  { pattern: /CREATE\s+ENUM/i, label: 'CREATE ENUM' },
  { pattern: /ALTER\s+TABLE.*ADD\s+CONSTRAINT/i, label: 'ADD CONSTRAINT' },
];

export function getMigrationSafetyResult(): MigrationSafetyResult {
  const migrationsDir = resolve(__dirname, '../../prisma/migrations');
  if (!existsSync(migrationsDir)) {
    return {
      status: 'not_applicable',
      severity: 'info',
      migrationsExist: false,
      migrationCount: 0,
      dangerousPatternsFound: [],
      safePatternsFound: [],
      blocked: false,
      message: 'No migrations directory found. Schema is managed differently or migrations not yet created.',
    };
  }

  const entries = readdirSync(migrationsDir, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .filter(e => !e.name.startsWith('.'));

  if (entries.length === 0) {
    return {
      status: 'not_applicable',
      severity: 'info',
      migrationsExist: false,
      migrationCount: 0,
      dangerousPatternsFound: [],
      safePatternsFound: [],
      blocked: false,
      message: 'Migrations directory exists but contains no migration folders.',
    };
  }

  const dangerousPatternsFound: string[] = [];
  const safePatternsFound: string[] = [];
  const seenDangerous = new Set<string>();
  const seenSafe = new Set<string>();

  for (const entry of entries) {
    const migrationSqlPath = resolve(migrationsDir, entry.name, 'migration.sql');
    if (!existsSync(migrationSqlPath)) continue;

    const content = readFileSync(migrationSqlPath, 'utf-8');

    for (const danger of DANGEROUS_PATTERNS) {
      if (danger.pattern.test(content) && !seenDangerous.has(danger.label)) {
        dangerousPatternsFound.push(`${danger.label} (in ${entry.name})`);
        seenDangerous.add(danger.label);
      }
    }

    for (const safe of SAFE_PATTERNS) {
      if (safe.pattern.test(content) && !seenSafe.has(safe.label)) {
        safePatternsFound.push(safe.label);
        seenSafe.add(safe.label);
      }
    }
  }

  const blocked = dangerousPatternsFound.length > 0;
  return {
    status: blocked ? 'blocked' : 'ready',
    severity: blocked ? 'critical' : 'info',
    migrationsExist: true,
    migrationCount: entries.length,
    dangerousPatternsFound,
    safePatternsFound,
    blocked,
    message: blocked
      ? `BLOCKED: Dangerous patterns detected in migrations: ${dangerousPatternsFound.join(', ')}. Manual review required before deployment.`
      : `Migrations safe. ${entries.length} migration(s) checked. No destructive patterns found.`,
  };
}

export function getMigrationSafetyCheck(): ReadinessCheckResult {
  const result = getMigrationSafetyResult();
  return {
    name: 'migration-safety',
    status: result.status,
    severity: result.severity,
    required: true,
    message: result.message,
    details: {
      migrationsExist: result.migrationsExist,
      migrationCount: result.migrationCount,
      dangerousPatternsFound: result.dangerousPatternsFound,
      blocked: result.blocked,
    },
  };
}
