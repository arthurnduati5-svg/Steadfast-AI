import { DeploymentReadinessStatus, ReadinessSeverity, RollbackReadinessResult, ReadinessCheckResult } from '../contracts/task023DeploymentReadinessContracts';
import { getDeploymentEnvironment } from './task023EnvironmentGateService';

const ROLLBACK_CHECKLIST = [
  'Verify the previous deployment version is stable and healthy',
  'Run health and readiness checks on the current (to-be-rolled-back) deployment',
  'Notify stakeholders before rollback',
  'Run database rollback if migration was part of deployment',
  'Restore previous environment configuration',
  'Restore previous AI provider configuration if changed',
  'Re-route traffic to previous deployment',
  'Verify health and readiness on the rolled-back version',
  'Run smoke tests on the rolled-back version',
  'Document rollback incident and timeline',
];

const DATABASE_ROLLBACK_CAVEATS = [
  'Migrations that drop columns or tables cannot be fully rolled back without data loss',
  'Migrations with destructive DDL require manual data restoration from backup',
  'Prisma migrate does not support automated rollback — manual SQL may be required',
  'Data written after a non-backwards-compatible migration may be lost on rollback',
  'Database rollback typically requires a point-in-time recovery or backup restore',
];

const MIGRATION_ROLLBACK_CAVEATS = [
  'Prisma Migrate does not have a built-in rollback command',
  'Rollback requires manually writing and applying a down-migration SQL script',
  'Sequential migration rollbacks must be applied in reverse order',
  'Migrations involving data transformation must be reversed carefully to prevent data corruption',
  'Schema-only rollbacks are safer than data-transformation rollbacks',
];

const CONFIG_ROLLBACK_CAVEATS = [
  'Restore previous .env or secrets configuration',
  'Verify CORS origins match the rollback target',
  'Verify AI provider keys match the rollback target',
  'Verify Redis/Pinecone connection strings are correct for rollback target',
  'Feature flags must be rolled back if they were toggled during deployment',
];

const KNOWN_NON_ROLLBACKABLE = [
  'Irreversible column type changes (e.g., VARCHAR → INT with data loss)',
  'Data removal migrations that do not preserve a backup',
  'Third-party API configuration changes that cannot be reverted',
  'External school-system integration changes',
  'Production AI model deployment changes (rollback requires redeployment)',
];

const MANUAL_APPROVAL_ITEMS = [
  'Database rollback with potential data loss',
  'Destructive migration rollback',
  'External school-system integration rollback',
  'Changes affecting active student sessions',
  'Changes to privacy/safeguarding/Deen boundaries',
];

export function getRollbackReadinessResult(): RollbackReadinessResult {
  const env = getDeploymentEnvironment();
  const isProd = env === 'production';

  return {
    status: 'ready',
    severity: 'info',
    rollbackChecklist: ROLLBACK_CHECKLIST,
    databaseRollbackCaveats: DATABASE_ROLLBACK_CAVEATS,
    migrationRollbackCaveats: MIGRATION_ROLLBACK_CAVEATS,
    configRollbackCaveats: CONFIG_ROLLBACK_CAVEATS,
    knownNonRollbackableOperations: KNOWN_NON_ROLLBACKABLE,
    manualApprovalRequired: isProd ? MANUAL_APPROVAL_ITEMS : [],
    message: isProd
      ? 'Rollback readiness documented. Manual approval required for production rollback operations involving data loss or external integrations.'
      : 'Rollback readiness documented. Non-production environment — reduced manual approval requirements.',
  };
}

export function getRollbackReadinessCheck(): ReadinessCheckResult {
  const result = getRollbackReadinessResult();
  return {
    name: 'rollback-readiness',
    status: result.status,
    severity: result.severity,
    required: false,
    message: result.message,
    details: {
      checklistItems: result.rollbackChecklist.length,
      databaseCaveats: result.databaseRollbackCaveats.length,
      migrationCaveats: result.migrationRollbackCaveats.length,
      configCaveats: result.configRollbackCaveats.length,
      nonRollbackableCount: result.knownNonRollbackableOperations.length,
      manualApprovalCount: result.manualApprovalRequired.length,
    },
  };
}
