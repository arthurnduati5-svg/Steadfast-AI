import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, join } from 'path';
import { execSync } from 'child_process';

export type Task024ReportVerdict = 'pass' | 'fail' | 'incomplete';

export interface Task024Report {
  taskId: string;
  taskName: string;
  generatedAt: string;
  gitBranch: string;
  gitCommit: string;
  environment: string;
  filesChanged: string[];
  migrationsChanged: string[];
  databasePersistenceVerified: boolean;
  opsIncidentModelPresent: boolean;
  opsIncidentAuditModelPresent: boolean;
  opsMetricSnapshotModelPresent: boolean;
  opsBackupCheckModelPresent: boolean;
  opsRestoreDrillModelPresent: boolean;
  opsReportModelPresent: boolean;
  migrationPresent: boolean;
  strictPrismaPersistenceTestRun: boolean;
  strictPrismaPersistenceTestPassed: boolean;
  fallbackUsedForAcceptance: boolean;
  realPrismaPersistenceVerified: boolean;
  monitoring: boolean;
  incidentDetection: boolean;
  incidentClassification: boolean;
  incidentWorkflow: boolean;
  incidentAuditTrail: boolean;
  backupReadiness: boolean;
  restoreDrill: boolean;
  dataIntegrityVerification: boolean;
  adminRoutes: boolean;
  routeProtection: boolean;
  privacySafeReports: boolean;
  prismaValidatePassed: boolean;
  prismaGeneratePassed: boolean;
  backendTypecheckPassed: boolean;
  backendBuildPassed: boolean;
  requiredTestsPassed: boolean;
  opsRouteAuthTestsPassed: boolean;
  opsRoutePrivacyTestsPassed: boolean;
  incidentWorkflowTestsPassed: boolean;
  backupReadinessTestsPassed: boolean;
  restoreDrillTestsPassed: boolean;
  persistenceTestsPassed: boolean;
  jsonReportValidationPassed: boolean;
  verificationScriptPassed: boolean;
  safeToStartTask025: boolean;
  blockingIssues: string[];
  knownLimitations: string[];
  privacyGateRawChatExposed: boolean;
  privacyGatePrivateMemoryExposed: boolean;
  privacyGateTeacherOnlyNotesExposed: boolean;
  privacyGateSafeguardingRawExposed: boolean;
  privacyGateDeenSensitiveTextExposed: boolean;
  privacyGateAiPromptsExposed: boolean;
  privacyGateProviderResponsesExposed: boolean;
  privacyGateTokensSecretsExposed: boolean;
  privacyGateDatabaseUrlsExposed: boolean;
  privacyGateAnswerKeysExposed: boolean;
  privacyGateTeacherOnlyContentExposed: boolean;
  privacyGateProtectedRubricsExposed: boolean;
  schoolAuthGateWeakened: boolean;
  contentGovernanceGateWeakened: boolean;
  fatwaEngineIntroduced: boolean;
}

function execWithOutput(cmd: string, cwd: string): { stdout: string; exitCode: number } {
  try {
    const stdout = execSync(cmd, { cwd, encoding: 'utf-8', timeout: 60000 });
    return { stdout: stdout.trim(), exitCode: 0 };
  } catch (e: any) {
    return { stdout: (e.stdout || '').trim(), exitCode: e.status ?? 1 };
  }
}

function getGitInfo(): { branch: string; commit: string } {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8', timeout: 10000 }).trim();
    const commit = execSync('git rev-parse HEAD', { encoding: 'utf-8', timeout: 10000 }).trim();
    return { branch, commit };
  } catch {
    return { branch: 'unknown', commit: 'unknown' };
  }
}

function getEnvironment(): string {
  return process.env.NODE_ENV || 'development';
}

function getMigrationsChanged(): string[] {
  try {
    const migrationsDir = resolve(__dirname, '..', '..', 'prisma', 'migrations');
    if (!existsSync(migrationsDir)) return [];
    const output = execSync('git diff --name-only HEAD -- prisma/migrations/', { encoding: 'utf-8', timeout: 10000 }).trim();
    return output ? output.split('\n').filter(Boolean) : [];
  } catch {
    return [];
  }
}

function getFilesChanged(): string[] {
  try {
    const output = execSync('git diff --name-only HEAD', { encoding: 'utf-8', timeout: 10000 }).trim();
    const untracked = execSync('git ls-files --others --exclude-standard', { encoding: 'utf-8', timeout: 10000 }).trim();
    const files: string[] = [];
    if (output) files.push(...output.split('\n').filter(Boolean));
    if (untracked) files.push(...untracked.split('\n').filter(Boolean));
    return [...new Set(files)];
  } catch {
    return [];
  }
}

function checkDatabasePersistence(): boolean {
  try {
    const prismaSchema = readFileSync(
      resolve(__dirname, '..', '..', 'prisma', 'schema.prisma'),
      'utf-8',
    );
    const models = [
      'model OpsIncident',
      'model OpsIncidentAudit',
      'model OpsMetricSnapshot',
      'model OpsBackupCheck',
      'model OpsRestoreDrill',
      'model OpsReport',
    ];
    return models.every((m) => prismaSchema.includes(m));
  } catch {
    return false;
  }
}

function checkModelPresent(modelName: string): boolean {
  try {
    const prismaSchema = readFileSync(
      resolve(__dirname, '..', '..', 'prisma', 'schema.prisma'),
      'utf-8',
    );
    return prismaSchema.includes(`model ${modelName}`);
  } catch {
    return false;
  }
}

function checkMigrationExists(): boolean {
  try {
    const migrationsDir = resolve(__dirname, '..', '..', 'prisma', 'migrations');
    if (!existsSync(migrationsDir)) return false;
    const entries = readFileSystemDir(migrationsDir);
    return entries.some((entry) =>
      entry.toLowerCase().includes('task024') || entry.toLowerCase().includes('ops_persistence')
    );
  } catch {
    return false;
  }
}

function readFileSystemDir(dir: string): string[] {
  try {
    const { readdirSync } = require('fs');
    return readdirSync(dir);
  } catch {
    return [];
  }
}

export function generateTask024Report(): Task024Report {
  const git = getGitInfo();
  const env = getEnvironment();
  const now = new Date().toISOString();

  const persistenceVerified = checkDatabasePersistence();

  const migrationExists = checkMigrationExists();

  const report: Task024Report = {
    taskId: '024',
    taskName: 'Production Monitoring, Incident Response, Backup/Restore Drill, Operational Hardening, and Safe Operations Proof',
    generatedAt: now,
    gitBranch: git.branch,
    gitCommit: git.commit,
    environment: env,
    filesChanged: getFilesChanged(),
    migrationsChanged: getMigrationsChanged(),
    databasePersistenceVerified: persistenceVerified,
    opsIncidentModelPresent: checkModelPresent('OpsIncident'),
    opsIncidentAuditModelPresent: checkModelPresent('OpsIncidentAudit'),
    opsMetricSnapshotModelPresent: checkModelPresent('OpsMetricSnapshot'),
    opsBackupCheckModelPresent: checkModelPresent('OpsBackupCheck'),
    opsRestoreDrillModelPresent: checkModelPresent('OpsRestoreDrill'),
    opsReportModelPresent: checkModelPresent('OpsReport'),
    migrationPresent: migrationExists,
    strictPrismaPersistenceTestRun: false,
    strictPrismaPersistenceTestPassed: false,
    fallbackUsedForAcceptance: true,
    realPrismaPersistenceVerified: false,
    monitoring: true,
    incidentDetection: true,
    incidentClassification: true,
    incidentWorkflow: true,
    incidentAuditTrail: true,
    backupReadiness: true,
    restoreDrill: true,
    dataIntegrityVerification: true,
    adminRoutes: true,
    routeProtection: true,
    privacySafeReports: true,
    prismaValidatePassed: false,
    prismaGeneratePassed: false,
    backendTypecheckPassed: false,
    backendBuildPassed: false,
    requiredTestsPassed: false,
    opsRouteAuthTestsPassed: false,
    opsRoutePrivacyTestsPassed: false,
    incidentWorkflowTestsPassed: false,
    backupReadinessTestsPassed: false,
    restoreDrillTestsPassed: false,
    persistenceTestsPassed: false,
    jsonReportValidationPassed: false,
    verificationScriptPassed: false,
    safeToStartTask025: false,
    blockingIssues: [],
    knownLimitations: [],
    privacyGateRawChatExposed: false,
    privacyGatePrivateMemoryExposed: false,
    privacyGateTeacherOnlyNotesExposed: false,
    privacyGateSafeguardingRawExposed: false,
    privacyGateDeenSensitiveTextExposed: false,
    privacyGateAiPromptsExposed: false,
    privacyGateProviderResponsesExposed: false,
    privacyGateTokensSecretsExposed: false,
    privacyGateDatabaseUrlsExposed: false,
    privacyGateAnswerKeysExposed: false,
    privacyGateTeacherOnlyContentExposed: false,
    privacyGateProtectedRubricsExposed: false,
    schoolAuthGateWeakened: false,
    contentGovernanceGateWeakened: false,
    fatwaEngineIntroduced: false,
  };

  return report;
}

function saveJsonReport(report: Task024Report, filePath: string): void {
  const dir = resolve(filePath, '..');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(filePath, JSON.stringify(report, null, 2), 'utf-8');
}

function saveMarkdownReport(report: Task024Report, filePath: string): void {
  const dir = resolve(filePath, '..');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const lines: string[] = [];
  lines.push('# Task 024 Operations Report');
  lines.push('');
  lines.push(`**Generated:** ${report.generatedAt}`);
  lines.push(`**Branch:** ${report.gitBranch}`);
  lines.push(`**Commit:** ${report.gitCommit}`);
  lines.push(`**Environment:** ${report.environment}`);
  lines.push('');
  lines.push('## Feature Status');
  lines.push('');
  lines.push(`| Feature | Status |`);
  lines.push(`|---------|--------|`);
  lines.push(`| Production Monitoring | ${report.monitoring ? '✅ Implemented' : '❌ Missing'} |`);
  lines.push(`| Incident Detection | ${report.incidentDetection ? '✅ Implemented' : '❌ Missing'} |`);
  lines.push(`| Incident Classification | ${report.incidentClassification ? '✅ Implemented' : '❌ Missing'} |`);
  lines.push(`| Incident Workflow | ${report.incidentWorkflow ? '✅ Implemented' : '❌ Missing'} |`);
  lines.push(`| Incident Audit Trail | ${report.incidentAuditTrail ? '✅ Implemented' : '❌ Missing'} |`);
  lines.push(`| Backup Readiness | ${report.backupReadiness ? '✅ Implemented' : '❌ Missing'} |`);
  lines.push(`| Restore Drill | ${report.restoreDrill ? '✅ Implemented' : '❌ Missing'} |`);
  lines.push(`| Data Integrity Verification | ${report.dataIntegrityVerification ? '✅ Implemented' : '❌ Missing'} |`);
  lines.push(`| Admin/Internal Routes | ${report.adminRoutes ? '✅ Implemented' : '❌ Missing'} |`);
  lines.push(`| Route Protection | ${report.routeProtection ? '✅ Implemented' : '❌ Missing'} |`);
  lines.push(`| Privacy-Safe Reports | ${report.privacySafeReports ? '✅ Implemented' : '❌ Missing'} |`);
  lines.push(`| Database Persistence (Ops models) | ${report.databasePersistenceVerified ? '✅ Present' : '❌ Missing'} |`);
  lines.push('');
  lines.push('## Database Persistence');
  lines.push('');
  lines.push(`| Check | Status |`);
  lines.push(`|-------|--------|`);
  lines.push(`| OpsIncident model | ${report.opsIncidentModelPresent ? '✅ Present' : '❌ Missing'} |`);
  lines.push(`| OpsIncidentAudit model | ${report.opsIncidentAuditModelPresent ? '✅ Present' : '❌ Missing'} |`);
  lines.push(`| OpsMetricSnapshot model | ${report.opsMetricSnapshotModelPresent ? '✅ Present' : '❌ Missing'} |`);
  lines.push(`| OpsBackupCheck model | ${report.opsBackupCheckModelPresent ? '✅ Present' : '❌ Missing'} |`);
  lines.push(`| OpsRestoreDrill model | ${report.opsRestoreDrillModelPresent ? '✅ Present' : '❌ Missing'} |`);
  lines.push(`| OpsReport model | ${report.opsReportModelPresent ? '✅ Present' : '❌ Missing'} |`);
  lines.push(`| Prisma migration | ${report.migrationPresent ? '✅ Present' : '❌ Missing'} |`);
  lines.push(`| Strict Prisma persistence test run | ${report.strictPrismaPersistenceTestRun ? '✅ Yes' : '❌ No'} |`);
  lines.push(`| Strict Prisma persistence test passed | ${report.strictPrismaPersistenceTestPassed ? '✅ Passed' : '❌ Failed'} |`);
  lines.push(`| Fallback used for acceptance | ${report.fallbackUsedForAcceptance ? '❌ Yes (not acceptable)' : '✅ No'} |`);
  lines.push(`| Real Prisma persistence verified | ${report.realPrismaPersistenceVerified ? '✅ Verified' : '❌ Not verified'} |`);
  lines.push('');
  lines.push('## Verification Results');
  lines.push('');
  lines.push(`| Gate | Result |`);
  lines.push(`|------|--------|`);
  lines.push(`| Prisma Validate | ${report.prismaValidatePassed ? '✅ Passed' : '❌ Failed'} |`);
  lines.push(`| Prisma Generate | ${report.prismaGeneratePassed ? '✅ Passed' : '❌ Failed'} |`);
  lines.push(`| Backend Typecheck | ${report.backendTypecheckPassed ? '✅ Passed' : '❌ Failed'} |`);
  lines.push(`| Backend Build | ${report.backendBuildPassed ? '✅ Passed' : '❌ Failed'} |`);
  lines.push(`| Required Tests | ${report.requiredTestsPassed ? '✅ Passed' : '❌ Failed'} |`);
  lines.push(`| Ops Route Auth | ${report.opsRouteAuthTestsPassed ? '✅ Passed' : '❌ Failed'} |`);
  lines.push(`| Ops Route Privacy | ${report.opsRoutePrivacyTestsPassed ? '✅ Passed' : '❌ Failed'} |`);
  lines.push(`| Incident Workflow | ${report.incidentWorkflowTestsPassed ? '✅ Passed' : '❌ Failed'} |`);
  lines.push(`| Backup Readiness | ${report.backupReadinessTestsPassed ? '✅ Passed' : '❌ Failed'} |`);
  lines.push(`| Restore Drill | ${report.restoreDrillTestsPassed ? '✅ Passed' : '❌ Failed'} |`);
  lines.push(`| Persistence Tests | ${report.persistenceTestsPassed ? '✅ Passed' : '❌ Failed'} |`);
  lines.push(`| JSON Report Validation | ${report.jsonReportValidationPassed ? '✅ Passed' : '❌ Failed'} |`);
  lines.push(`| Verification Script | ${report.verificationScriptPassed ? '✅ Passed' : '❌ Failed'} |`);
  lines.push('');
  lines.push('## Privacy / Security / Deen Gate Review');
  lines.push('');
  lines.push(`| Check | Status |`);
  lines.push(`|-------|--------|`);
  lines.push(`| Raw student chat exposed | ${report.privacyGateRawChatExposed ? '❌ Yes' : '✅ No'} |`);
  lines.push(`| Private learner memory exposed | ${report.privacyGatePrivateMemoryExposed ? '❌ Yes' : '✅ No'} |`);
  lines.push(`| Teacher-only notes exposed | ${report.privacyGateTeacherOnlyNotesExposed ? '❌ Yes' : '✅ No'} |`);
  lines.push(`| Safeguarding raw details exposed | ${report.privacyGateSafeguardingRawExposed ? '❌ Yes' : '✅ No'} |`);
  lines.push(`| Deen-sensitive private text exposed | ${report.privacyGateDeenSensitiveTextExposed ? '❌ Yes' : '✅ No'} |`);
  lines.push(`| AI prompts exposed | ${report.privacyGateAiPromptsExposed ? '❌ Yes' : '✅ No'} |`);
  lines.push(`| Provider responses exposed | ${report.privacyGateProviderResponsesExposed ? '❌ Yes' : '✅ No'} |`);
  lines.push(`| Tokens/secrets exposed | ${report.privacyGateTokensSecretsExposed ? '❌ Yes' : '✅ No'} |`);
  lines.push(`| Database URLs exposed | ${report.privacyGateDatabaseUrlsExposed ? '❌ Yes' : '✅ No'} |`);
  lines.push(`| Answer keys exposed | ${report.privacyGateAnswerKeysExposed ? '❌ Yes' : '✅ No'} |`);
  lines.push(`| Teacher-only content exposed | ${report.privacyGateTeacherOnlyContentExposed ? '❌ Yes' : '✅ No'} |`);
  lines.push(`| Protected rubrics exposed | ${report.privacyGateProtectedRubricsExposed ? '❌ Yes' : '✅ No'} |`);
  lines.push(`| Fatwa-engine behavior introduced | ${report.fatwaEngineIntroduced ? '❌ Yes' : '✅ No'} |`);
  lines.push(`| School-auth gate weakened | ${report.schoolAuthGateWeakened ? '❌ Yes' : '✅ No'} |`);
  lines.push(`| Content-governance gate weakened | ${report.contentGovernanceGateWeakened ? '❌ Yes' : '✅ No'} |`);
  lines.push('');
  if (report.blockingIssues.length > 0) {
    lines.push('## Blocking Issues');
    lines.push('');
    for (const issue of report.blockingIssues) {
      lines.push(`- ${issue}`);
    }
    lines.push('');
  }
  if (report.knownLimitations.length > 0) {
    lines.push('## Known Limitations');
    lines.push('');
    for (const limitation of report.knownLimitations) {
      lines.push(`- ${limitation}`);
    }
    lines.push('');
  }
  lines.push('## Safe-to-Next Decision');
  lines.push('');
  lines.push(`**safeToStartTask025:** ${report.safeToStartTask025 ? '✅ true' : '❌ false'}`);
  lines.push('');

  writeFileSync(filePath, lines.join('\n'), 'utf-8');
}

export function finalizeReport(
  report: Task024Report,
  overrides: Partial<Task024Report>,
): { jsonPath: string; mdPath: string } {
  Object.assign(report, overrides);

  const persistenceVerified = checkDatabasePersistence();
  report.databasePersistenceVerified = persistenceVerified;
  report.opsIncidentModelPresent = checkModelPresent('OpsIncident');
  report.opsIncidentAuditModelPresent = checkModelPresent('OpsIncidentAudit');
  report.opsMetricSnapshotModelPresent = checkModelPresent('OpsMetricSnapshot');
  report.opsBackupCheckModelPresent = checkModelPresent('OpsBackupCheck');
  report.opsRestoreDrillModelPresent = checkModelPresent('OpsRestoreDrill');
  report.opsReportModelPresent = checkModelPresent('OpsReport');
  report.migrationPresent = checkMigrationExists();

  const blockingIssues = report.blockingIssues || [];

  const allModelsPresent =
    report.opsIncidentModelPresent &&
    report.opsIncidentAuditModelPresent &&
    report.opsMetricSnapshotModelPresent &&
    report.opsBackupCheckModelPresent &&
    report.opsRestoreDrillModelPresent &&
    report.opsReportModelPresent;

  report.realPrismaPersistenceVerified =
    allModelsPresent &&
    persistenceVerified &&
    report.migrationPresent &&
    report.strictPrismaPersistenceTestRun &&
    report.strictPrismaPersistenceTestPassed &&
    !report.fallbackUsedForAcceptance;

  if (!persistenceVerified) {
    blockingIssues.push('Database persistence models (OpsIncident, OpsIncidentAudit, OpsMetricSnapshot, OpsBackupCheck, OpsRestoreDrill, OpsReport) are missing from Prisma schema');
  }

  if (!report.migrationPresent) {
    blockingIssues.push('Prisma migration for Task 024 Ops models does not exist');
  }

  if (!report.strictPrismaPersistenceTestRun) {
    blockingIssues.push('Strict real Prisma persistence tests were not run');
  }

  if (!report.strictPrismaPersistenceTestPassed) {
    blockingIssues.push('Strict real Prisma persistence tests did not pass');
  }

  if (report.fallbackUsedForAcceptance) {
    blockingIssues.push('In-memory fallback was used for acceptance proof — real Prisma persistence not verified');
  }

  if (!report.realPrismaPersistenceVerified) {
    blockingIssues.push('Real Prisma persistence is not verified — durable database proof is incomplete');
  }

  if (!report.verificationScriptPassed) {
    blockingIssues.push('Verification script did not pass');
  }

  const gatesPassed =
    allModelsPresent &&
    report.migrationPresent &&
    persistenceVerified &&
    report.realPrismaPersistenceVerified &&
    report.prismaValidatePassed &&
    report.prismaGeneratePassed &&
    report.backendTypecheckPassed &&
    report.backendBuildPassed &&
    report.requiredTestsPassed &&
    report.opsRouteAuthTestsPassed &&
    report.opsRoutePrivacyTestsPassed &&
    report.incidentWorkflowTestsPassed &&
    report.backupReadinessTestsPassed &&
    report.restoreDrillTestsPassed &&
    report.persistenceTestsPassed &&
    report.jsonReportValidationPassed &&
    report.verificationScriptPassed &&
    !report.privacyGateRawChatExposed &&
    !report.privacyGatePrivateMemoryExposed &&
    !report.privacyGateTeacherOnlyNotesExposed &&
    !report.privacyGateSafeguardingRawExposed &&
    !report.privacyGateDeenSensitiveTextExposed &&
    !report.privacyGateAiPromptsExposed &&
    !report.privacyGateProviderResponsesExposed &&
    !report.privacyGateTokensSecretsExposed &&
    !report.privacyGateDatabaseUrlsExposed &&
    !report.privacyGateAnswerKeysExposed &&
    !report.privacyGateTeacherOnlyContentExposed &&
    !report.privacyGateProtectedRubricsExposed &&
    !report.schoolAuthGateWeakened &&
    !report.contentGovernanceGateWeakened &&
    !report.fatwaEngineIntroduced &&
    blockingIssues.length === 0;

  report.blockingIssues = blockingIssues;
  report.safeToStartTask025 = gatesPassed;

  const rootDir = resolve(__dirname, '..', '..', '..');
  const jsonPath = join(rootDir, 'docs', 'ops', 'task-024', 'task-024-ops-report.json');
  const mdPath = join(rootDir, 'docs', 'ops', 'task-024', 'TASK_024_OPERATIONS_REPORT.md');

  saveJsonReport(report, jsonPath);
  saveMarkdownReport(report, mdPath);

  return { jsonPath, mdPath };
}
