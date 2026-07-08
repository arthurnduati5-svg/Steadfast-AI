import type { IncidentSignal } from '../contracts/task024OperationsContracts';

const INJECTED_SIGNALS: IncidentSignal[] = [];
const DETECTED_CACHE: IncidentSignal[] = [];

function makeSignal(
  signalType: string,
  component: string,
  safeSummary: string,
  metadata?: Record<string, unknown>,
): IncidentSignal {
  return {
    source: 'IncidentDetectionService',
    component,
    signalType,
    detectedAt: new Date().toISOString(),
    safeSummary,
    metadata,
  };
}

async function checkStartupGateBlocked(): Promise<IncidentSignal | null> {
  try {
    const blocked =
      process.env.PRODUCTION_STARTUP_GATE_BLOCKED === 'true' ||
      process.env.DEPLOYMENT_READINESS === 'blocked';
    if (blocked) {
      return makeSignal(
        'startupGateBlocked',
        'ProductionStartupGate',
        'Deployment readiness startup gate is blocked.',
        {
          productionStartupGateBlocked: process.env.PRODUCTION_STARTUP_GATE_BLOCKED,
          deploymentReadiness: process.env.DEPLOYMENT_READINESS,
        },
      );
    }
    return null;
  } catch {
    return makeSignal(
      'startupGateBlocked',
      'ProductionStartupGate',
      'Error checking startup gate status.',
      { error: 'check_failed' },
    );
  }
}

async function checkDatabaseUnavailable(): Promise<IncidentSignal | null> {
  try {
    const dbUrl = (process.env.DATABASE_URL || '').trim();
    if (!dbUrl) {
      return makeSignal(
        'databaseUnavailable',
        'Database',
        'DATABASE_URL is not configured.',
        { databaseUrlPresent: false },
      );
    }
    return null;
  } catch {
    return makeSignal(
      'databaseUnavailable',
      'Database',
      'Error checking database configuration.',
      { error: 'check_failed' },
    );
  }
}

async function checkPrismaReadinessFailure(): Promise<IncidentSignal | null> {
  try {
    const prismaModule = await import('../lib/prisma');
    const prisma = prismaModule.default;
    if (!prisma) {
      return makeSignal(
        'prismaReadinessFailure',
        'PrismaClient',
        'Prisma client import resolved but client is null or undefined.',
        { clientAvailable: false },
      );
    }
    return null;
  } catch {
    return makeSignal(
      'prismaReadinessFailure',
      'PrismaClient',
      'Prisma client import failed. Database operations unavailable.',
      { importError: true },
    );
  }
}

async function checkMigrationSafetyCritical(): Promise<IncidentSignal | null> {
  try {
    const migrationBlocked =
      process.env.MIGRATION_SAFETY === 'blocked' ||
      process.env.MIGRATION_SAFETY === 'failed';
    if (migrationBlocked) {
      return makeSignal(
        'migrationSafetyCritical',
        'MigrationSafety',
        'Migration safety check failed. Migration operations blocked.',
        { migrationSafety: process.env.MIGRATION_SAFETY },
      );
    }
    return null;
  } catch {
    return makeSignal(
      'migrationSafetyCritical',
      'MigrationSafety',
      'Error checking migration safety configuration.',
      { error: 'check_failed' },
    );
  }
}

async function checkSchoolIntegrationReadinessFailure(): Promise<IncidentSignal | null> {
  try {
    const schoolIntegrationEnabled = process.env.SCHOOL_INTEGRATION_ENABLED;
    const hasDb = !!(process.env.DATABASE_URL || '').trim();
    const blocked = schoolIntegrationEnabled === 'false' || !hasDb;
    if (blocked) {
      return makeSignal(
        'schoolIntegrationReadinessFailure',
        'SchoolIntegration',
        'School integration readiness is missing or blocked.',
        { schoolIntegrationEnabled, databaseAvailable: hasDb },
      );
    }
    return null;
  } catch {
    return makeSignal(
      'schoolIntegrationReadinessFailure',
      'SchoolIntegration',
      'Error checking school integration readiness.',
      { error: 'check_failed' },
    );
  }
}

async function checkContentGovernanceReadinessFailure(): Promise<IncidentSignal | null> {
  try {
    const hasDb = !!(process.env.DATABASE_URL || '').trim();
    const contentGovernanceDisabled =
      process.env.CONTENT_GOVERNANCE_DISABLED === 'true';
    const blocked = !hasDb || contentGovernanceDisabled;
    if (blocked) {
      return makeSignal(
        'contentGovernanceReadinessFailure',
        'ContentGovernance',
        'Content governance readiness is missing or blocked.',
        { databaseAvailable: hasDb, contentGovernanceDisabled },
      );
    }
    return null;
  } catch {
    return makeSignal(
      'contentGovernanceReadinessFailure',
      'ContentGovernance',
      'Error checking content governance readiness.',
      { error: 'check_failed' },
    );
  }
}

async function checkAiGatewayUnsafe(): Promise<IncidentSignal | null> {
  try {
    const aiProvider = process.env.AI_PROVIDER || '';
    const apiKey = process.env.AI_API_KEY || '';
    const unsafe = !aiProvider || !apiKey;
    if (unsafe) {
      return makeSignal(
        'aiGatewayUnsafe',
        'AiGateway',
        'AI gateway configuration is unsafe or unavailable.',
        {
          aiProviderConfigured: !!aiProvider,
          apiKeyConfigured: !!apiKey,
        },
      );
    }
    return null;
  } catch {
    return makeSignal(
      'aiGatewayUnsafe',
      'AiGateway',
      'Error checking AI gateway configuration.',
      { error: 'check_failed' },
    );
  }
}

async function checkPrivacyLeakDetected(): Promise<IncidentSignal | null> {
  try {
    const privacyLeak = process.env.PRIVACY_LEAK_DETECTED === 'true';
    if (privacyLeak) {
      return makeSignal(
        'privacyLeakDetected',
        'PrivacyGuard',
        'Privacy leak signal received.',
        { privacyLeakFlagged: true },
      );
    }
    return null;
  } catch {
    return null;
  }
}

async function checkSecretLeakDetected(): Promise<IncidentSignal | null> {
  try {
    const secretLeak = process.env.SECRET_LEAK_DETECTED === 'true';
    if (secretLeak) {
      return makeSignal(
        'secretLeakDetected',
        'SecretSafety',
        'Secret leak signal received.',
        { secretLeakFlagged: true },
      );
    }
    return null;
  } catch {
    return null;
  }
}

async function checkRateLimitAbuseSpike(): Promise<IncidentSignal | null> {
  try {
    const rateLimitSpike = process.env.RATE_LIMIT_ABUSE_SPIKE === 'true';
    if (rateLimitSpike) {
      return makeSignal(
        'rateLimitAbuseSpike',
        'RateLimit',
        'Rate limit abuse spike detected.',
        { rateLimitSpikeFlagged: true },
      );
    }
    return null;
  } catch {
    return null;
  }
}

async function checkBackupReadinessFailed(): Promise<IncidentSignal | null> {
  try {
    const backupReady = process.env.BACKUP_READINESS === 'ready';
    const backupFailed =
      process.env.BACKUP_READINESS === 'failed' ||
      process.env.BACKUP_READINESS === 'blocked';
    if (backupFailed || (!backupReady && !process.env.BACKUP_READINESS)) {
      return makeSignal(
        'backupReadinessFailed',
        'BackupReadiness',
        'Backup readiness check failed.',
        { backupReadiness: process.env.BACKUP_READINESS },
      );
    }
    return null;
  } catch {
    return makeSignal(
      'backupReadinessFailed',
      'BackupReadiness',
      'Error checking backup readiness.',
      { error: 'check_failed' },
    );
  }
}

async function checkRestoreDrillFailed(): Promise<IncidentSignal | null> {
  try {
    const restoreDrillStatus = process.env.RESTORE_DRILL_STATUS;
    const failed =
      restoreDrillStatus === 'failed' || restoreDrillStatus === 'blocked';
    if (failed) {
      return makeSignal(
        'restoreDrillFailed',
        'RestoreDrill',
        'Restore drill check failed.',
        { restoreDrillStatus },
      );
    }
    return null;
  } catch {
    return makeSignal(
      'restoreDrillFailed',
      'RestoreDrill',
      'Error checking restore drill status.',
      { error: 'check_failed' },
    );
  }
}

async function checkContentGapSpike(): Promise<IncidentSignal | null> {
  try {
    const contentGapSpike = process.env.CONTENT_GAP_SPIKE === 'true';
    if (contentGapSpike) {
      return makeSignal(
        'contentGapSpike',
        'ContentGovernance',
        'Content gap spike detected.',
        { contentGapSpikeFlagged: true },
      );
    }
    return null;
  } catch {
    return null;
  }
}

async function checkDeenGovernanceSourceUnavailable(): Promise<IncidentSignal | null> {
  try {
    const deenSourceAvailable =
      process.env.DEEN_GOVERNANCE_SOURCE_AVAILABLE === 'true';
    if (!deenSourceAvailable) {
      return makeSignal(
        'deenGovernanceSourceUnavailable',
        'DeenGovernance',
        'Deen governance source is unavailable.',
        { deenGovernanceSourceAvailable: false },
      );
    }
    return null;
  } catch {
    return makeSignal(
      'deenGovernanceSourceUnavailable',
      'DeenGovernance',
      'Error checking Deen governance source availability.',
      { error: 'check_failed' },
    );
  }
}

const DETECTION_CHECKS: Array<() => Promise<IncidentSignal | null>> = [
  checkStartupGateBlocked,
  checkDatabaseUnavailable,
  checkPrismaReadinessFailure,
  checkMigrationSafetyCritical,
  checkSchoolIntegrationReadinessFailure,
  checkContentGovernanceReadinessFailure,
  checkAiGatewayUnsafe,
  checkPrivacyLeakDetected,
  checkSecretLeakDetected,
  checkRateLimitAbuseSpike,
  checkBackupReadinessFailed,
  checkRestoreDrillFailed,
  checkContentGapSpike,
  checkDeenGovernanceSourceUnavailable,
];

const SIGNAL_TYPE_TO_CHECK: Record<string, () => Promise<IncidentSignal | null>> = {
  startupGateBlocked: checkStartupGateBlocked,
  databaseUnavailable: checkDatabaseUnavailable,
  prismaReadinessFailure: checkPrismaReadinessFailure,
  migrationSafetyCritical: checkMigrationSafetyCritical,
  schoolIntegrationReadinessFailure: checkSchoolIntegrationReadinessFailure,
  contentGovernanceReadinessFailure: checkContentGovernanceReadinessFailure,
  aiGatewayUnsafe: checkAiGatewayUnsafe,
  privacyLeakDetected: checkPrivacyLeakDetected,
  secretLeakDetected: checkSecretLeakDetected,
  rateLimitAbuseSpike: checkRateLimitAbuseSpike,
  backupReadinessFailed: checkBackupReadinessFailed,
  restoreDrillFailed: checkRestoreDrillFailed,
  contentGapSpike: checkContentGapSpike,
  deenGovernanceSourceUnavailable: checkDeenGovernanceSourceUnavailable,
};

export async function detectAllSignals(): Promise<IncidentSignal[]> {
  const results: IncidentSignal[] = [];
  for (const check of DETECTION_CHECKS) {
    try {
      const signal = await check();
      if (signal) {
        results.push(signal);
      }
    } catch {
      // individual check errors handled inside each check
    }
  }
  DETECTED_CACHE.length = 0;
  DETECTED_CACHE.push(...results, ...INJECTED_SIGNALS);
  return [...DETECTED_CACHE];
}

export async function detectSignal(
  signalType: string,
): Promise<IncidentSignal | null> {
  const check = SIGNAL_TYPE_TO_CHECK[signalType];
  if (!check) {
    return null;
  }
  try {
    return await check();
  } catch {
    return null;
  }
}

export function injectSignal(signal: IncidentSignal): void {
  INJECTED_SIGNALS.push(signal);
}

export function clearSignals(): void {
  INJECTED_SIGNALS.length = 0;
  DETECTED_CACHE.length = 0;
}

export function getDetectedSignals(): IncidentSignal[] {
  return [...DETECTED_CACHE];
}
