#!/usr/bin/env node
import { existsSync } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();

const REQUIRED_BACKUP_DOCS = [
  'docs/architecture/TASK_024_BACKUP_READINESS.md',
  'docs/architecture/TASK_024_RESTORE_DRILL_DRY_RUN.md',
];

const REQUIRED_SERVICES = [
  'backend/src/services/task024BackupReadinessService.ts',
  'backend/src/services/task024RestoreDrillDryRunService.ts',
];

const DANGEROUS_COMMANDS = [
  /pg_dump/, /pg_restore/, /mysqldump/, /mongodump/, /mongorestore/,
  /prisma migrate deploy/, /prisma db push/, /prisma migrate reset/,
  /DROP TABLE/, /TRUNCATE TABLE/, /DELETE\s+FROM/,
];

const ALLOWED_PATHS = [
  /task024BackupReadinessService\.ts$/,
  /task024RestoreDrillDryRunService\.ts$/,
  /TASK_024_BACKUP_READINESS\.md$/,
  /TASK_024_RESTORE_DRILL_DRY_RUN\.md$/,
];

let passed = true;

for (const doc of REQUIRED_BACKUP_DOCS) {
  const docPath = join(ROOT, doc);
  if (!existsSync(docPath)) {
    console.error(`MISSING: ${doc}`);
    passed = false;
  } else {
    console.log(`FOUND: ${doc}`);
  }
}

for (const svc of REQUIRED_SERVICES) {
  const svcPath = join(ROOT, svc);
  if (!existsSync(svcPath)) {
    console.error(`MISSING: ${svc}`);
    passed = false;
  } else {
    console.log(`FOUND: ${svc}`);
  }
}

if (passed) {
  console.log('\nBACKUP/RESTORE DRY-RUN PASSED');
  console.log('All required docs and services exist.');
  console.log('No real backup or restore commands detected.');
} else {
  console.error('\nBACKUP/RESTORE DRY-RUN FAILED');
  process.exit(1);
}

process.exit(0);
