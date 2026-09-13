import { ReadinessCheckResult } from '../contracts/task023DeploymentReadinessContracts';
import { getMigrationSafetyResult } from './task023MigrationSafetyChecker';
import { getDatabaseReadinessResult } from './task023DatabaseReadinessService';

export async function getMigrationPreflightResult(): Promise<ReadinessCheckResult> {
  const safetyResult = getMigrationSafetyResult();
  const dbResult = await getDatabaseReadinessResult();

  const messages: string[] = [];

  if (!dbResult.connectionVerified) {
    messages.push('Database unreachable — cannot verify migration target.');
  } else {
    messages.push('Database reachable.');
  }

  if (safetyResult.blocked) {
    messages.push('MIGRATION BLOCKED: Destructive patterns found.');
  } else if (safetyResult.migrationsExist) {
    messages.push(`${safetyResult.migrationCount} migration(s) checked — safe to proceed.`);
  } else {
    messages.push('No migrations found. Manual migration review not applicable.');
  }

  const status = safetyResult.blocked || !dbResult.connectionVerified ? 'blocked' : 'ready';

  return {
    name: 'migration-preflight',
    status,
    severity: status === 'blocked' ? 'critical' : 'info',
    required: true,
    message: messages.join(' '),
    details: {
      databaseReachable: dbResult.connectionVerified,
      migrationsExist: safetyResult.migrationsExist,
      migrationCount: safetyResult.migrationCount,
      blocked: safetyResult.blocked,
    },
  };
}
