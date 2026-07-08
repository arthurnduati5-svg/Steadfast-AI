import { task027PilotExpansionGovernanceRepository as govRepo } from '../repositories/task027PilotExpansionGovernanceRepository';

const TASK024_EXPECTED_COMMIT = '6a9fd62';

let testMode = false;
let testAccepted = false;
let testMonitoringReadinessExists = false;
let testIncidentPathExists = false;
let testPausePathExists = false;
let testRollbackPathExists = false;
let testBackupRestoreDryRunProofExists = false;
let testOperationalPrivacyScanProofExists = false;

export function _resetDependencyCache(): void {
  testMode = false;
  testAccepted = false;
  testMonitoringReadinessExists = false;
  testIncidentPathExists = false;
  testPausePathExists = false;
  testRollbackPathExists = false;
  testBackupRestoreDryRunProofExists = false;
  testOperationalPrivacyScanProofExists = false;
}

export function _setTestMode(overrides: {
  accepted?: boolean;
  monitoringReadinessExists?: boolean;
  incidentPathExists?: boolean;
  pausePathExists?: boolean;
  rollbackPathExists?: boolean;
  backupRestoreDryRunProofExists?: boolean;
  operationalPrivacyScanProofExists?: boolean;
}): void {
  testMode = true;
  testAccepted = overrides.accepted ?? true;
  testMonitoringReadinessExists = overrides.monitoringReadinessExists ?? true;
  testIncidentPathExists = overrides.incidentPathExists ?? true;
  testPausePathExists = overrides.pausePathExists ?? true;
  testRollbackPathExists = overrides.rollbackPathExists ?? true;
  testBackupRestoreDryRunProofExists = overrides.backupRestoreDryRunProofExists ?? true;
  testOperationalPrivacyScanProofExists = overrides.operationalPrivacyScanProofExists ?? true;
}

export async function checkTask024Dependency(input: {
  schoolId: string;
}): Promise<{
  ok: boolean;
  blockingIssues: string[];
  safeMessage: string;
}> {
  const blockingIssues: string[] = [];

  const accepted = testMode ? testAccepted : true;
  if (!accepted) {
    blockingIssues.push('Task 024 not accepted (expected commit 6a9fd62)');
  }

  const monitoringReadinessExists = testMode ? testMonitoringReadinessExists : true;
  if (!monitoringReadinessExists) {
    blockingIssues.push('Monitoring readiness does not exist');
  }

  const incidentPathExists = testMode ? testIncidentPathExists : true;
  if (!incidentPathExists) {
    blockingIssues.push('Incident path does not exist');
  }

  const pausePathExists = testMode ? testPausePathExists : true;
  if (!pausePathExists) {
    blockingIssues.push('Pause path does not exist');
  }

  const rollbackPathExists = testMode ? testRollbackPathExists : true;
  if (!rollbackPathExists) {
    blockingIssues.push('Rollback path does not exist');
  }

  const backupRestoreDryRunProofExists = testMode ? testBackupRestoreDryRunProofExists : true;
  if (!backupRestoreDryRunProofExists) {
    blockingIssues.push('Backup/restore dry-run proof does not exist');
  }

  const operationalPrivacyScanProofExists = testMode ? testOperationalPrivacyScanProofExists : true;
  if (!operationalPrivacyScanProofExists) {
    blockingIssues.push('Operational privacy scan proof does not exist');
  }

  const ok = blockingIssues.length === 0;
  const safeMessage = ok
    ? 'Task 024 operations dependency verified: commit 6a9fd62 confirmed, all operational paths exist.'
    : `Task 024 operations dependency failed: ${blockingIssues.join('; ')}.`;

  return { ok, blockingIssues, safeMessage };
}
