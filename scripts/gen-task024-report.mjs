import { generateTask024Report, finalizeReport } from '../backend/src/services/task024ReportService';
import { getTask024PersistenceMode } from '../backend/src/repositories/task024OpsRepository';
import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const report = generateTask024Report();
const persistenceMode = getTask024PersistenceMode();

// Run actual commands to determine gate status
function execCheck(cmd: string, cwd?: string): boolean {
  try {
    execSync(cmd, { cwd, encoding: 'utf-8', timeout: 60000, stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

const backendDir = resolve(__dirname, '..', 'backend');
const prismaValidateOk = execCheck('npx prisma validate --schema prisma/schema.prisma', backendDir);
const prismaGenerateOk = execCheck('npx prisma generate --schema prisma/schema.prisma', backendDir);

// Check migration exists
const migrationExists = existsSync(resolve(backendDir, 'prisma/migrations/20260628130000_task024_ops_persistence'));

// Check all Ops models in Prisma schema
const schemaPath = resolve(backendDir, 'prisma/schema.prisma');
const schema = readFileSync(schemaPath, 'utf-8');
const opsModels = ['OpsIncident', 'OpsIncidentAudit', 'OpsMetricSnapshot', 'OpsBackupCheck', 'OpsRestoreDrill', 'OpsReport'];
const allModelsPresent = opsModels.every(m => schema.includes(`model ${m}`));

finalizeReport(report, {
  prismaValidatePassed: prismaValidateOk,
  prismaGeneratePassed: prismaGenerateOk,
  backendTypecheckPassed: false,
  backendBuildPassed: false,
  requiredTestsPassed: false,
  persistenceTestsPassed: false,
  strictPrismaPersistenceTestRun: false,
  strictPrismaPersistenceTestPassed: false,
  fallbackUsedForAcceptance: persistenceMode.fallbackUsed,
  realPrismaPersistenceVerified: false,
  opsRouteAuthTestsPassed: false,
  opsRoutePrivacyTestsPassed: false,
  incidentWorkflowTestsPassed: false,
  backupReadinessTestsPassed: false,
  restoreDrillTestsPassed: false,
  jsonReportValidationPassed: true,
  verificationScriptPassed: false,
  migrationPresent: migrationExists,
  knownLimitations: [
    'Backup/restore uses local drill mode (fixture-based simulation), not live cloud provider backup',
    'Prisma migration created manually (migration SQL available at backend/prisma/migrations/20260628130000_task024_ops_persistence/)',
    'Backend typecheck, build, and comprehensive test results must be verified separately',
    'Strict real Prisma persistence tests not yet run during report generation',
  ],
});

console.log('Report generated successfully');
console.log('safeToStartTask025:', report.safeToStartTask025);
console.log('Prisma validate:', prismaValidateOk ? 'PASS' : 'FAIL');
console.log('Prisma generate:', prismaGenerateOk ? 'PASS' : 'FAIL');
console.log('Migration exists:', migrationExists ? 'YES' : 'NO');
console.log('All Ops models present:', allModelsPresent ? 'YES' : 'NO');
console.log('Persistence mode:', persistenceMode.mode);
console.log('Durable:', persistenceMode.durable);
