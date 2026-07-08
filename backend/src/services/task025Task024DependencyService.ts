import type { Task025ReadinessBlocker } from '../contracts/task025ControlledPilotReadinessContracts';

export interface Task024DependencyResult {
  dependencyMet: boolean;
  safeSummary: string;
  safeBlockers: Task025ReadinessBlocker[];
  task024Status: string;
  monitoringReady: boolean;
  incidentDrillDryRunAvailable: boolean;
  backupRestoreDryRunAvailable: boolean;
  operationalPrivacyScanAvailable: boolean;
  pauseSignalPathDefined: boolean;
  rollbackSignalPathDefined: boolean;
  readinessDiagnosticsSafe: boolean;
}

export async function checkTask024Dependency(params: {
  task024MonitoringReady: boolean;
  task024IncidentDrillDryRunAvailable: boolean;
  task024BackupRestoreDryRunAvailable: boolean;
  task024OperationalPrivacyScanAvailable: boolean;
  task024PauseSignalPathDefined: boolean;
  task024RollbackSignalPathDefined: boolean;
  task024ReadinessDiagnosticsSafe: boolean;
  task024CommitPresent: boolean;
}): Promise<Task024DependencyResult> {
  const blockers: Task025ReadinessBlocker[] = [];

  if (!params.task024CommitPresent) {
    blockers.push({
      type: 'operations_readiness',
      severity: 'high',
      safeDescription: 'Task 024 commit dependency is not satisfied.',
      requiredAction: 'Ensure Task 024 is committed and accepted before Task 025 readiness.',
    });
  }

  if (!params.task024MonitoringReady) {
    blockers.push({
      type: 'operations_readiness',
      severity: 'high',
      safeDescription: 'Task 024 monitoring readiness is not available.',
      requiredAction: 'Complete Task 024 monitoring readiness.',
    });
  }

  if (!params.task024IncidentDrillDryRunAvailable) {
    blockers.push({
      type: 'operations_readiness',
      severity: 'high',
      safeDescription: 'Task 024 incident drill dry-run is not available.',
      requiredAction: 'Complete Task 024 incident drill dry-run.',
    });
  }

  if (!params.task024BackupRestoreDryRunAvailable) {
    blockers.push({
      type: 'operations_readiness',
      severity: 'high',
      safeDescription: 'Task 024 backup/restore dry-run is not available.',
      requiredAction: 'Complete Task 024 backup/restore dry-run.',
    });
  }

  if (!params.task024OperationalPrivacyScanAvailable) {
    blockers.push({
      type: 'operations_readiness',
      severity: 'medium',
      safeDescription: 'Task 024 operational privacy scan is not available.',
      requiredAction: 'Complete Task 024 operational privacy scan.',
    });
  }

  if (!params.task024PauseSignalPathDefined) {
    blockers.push({
      type: 'operations_readiness',
      severity: 'high',
      safeDescription: 'Task 024 pause signal path is not defined.',
      requiredAction: 'Define pause signal path in Task 024.',
    });
  }

  if (!params.task024RollbackSignalPathDefined) {
    blockers.push({
      type: 'operations_readiness',
      severity: 'high',
      safeDescription: 'Task 024 rollback signal path is not defined.',
      requiredAction: 'Define rollback signal path in Task 024.',
    });
  }

  if (!params.task024ReadinessDiagnosticsSafe) {
    blockers.push({
      type: 'operations_readiness',
      severity: 'high',
      safeDescription: 'Task 024 readiness diagnostics are not safe metadata only.',
      requiredAction: 'Ensure Task 024 diagnostics return only safe metadata.',
    });
  }

  const dependencyMet = blockers.length === 0;
  const task024Status = dependencyMet ? 'ready' : blockers.some((b) => b.severity === 'high') ? 'blocked' : 'partial';

  return {
    dependencyMet,
    safeSummary: dependencyMet
      ? 'Task 024 dependency is fully satisfied.'
      : `Task 024 dependency has ${blockers.length} issue(s).`,
    safeBlockers: blockers,
    task024Status,
    monitoringReady: params.task024MonitoringReady,
    incidentDrillDryRunAvailable: params.task024IncidentDrillDryRunAvailable,
    backupRestoreDryRunAvailable: params.task024BackupRestoreDryRunAvailable,
    operationalPrivacyScanAvailable: params.task024OperationalPrivacyScanAvailable,
    pauseSignalPathDefined: params.task024PauseSignalPathDefined,
    rollbackSignalPathDefined: params.task024RollbackSignalPathDefined,
    readinessDiagnosticsSafe: params.task024ReadinessDiagnosticsSafe,
  };
}
