import type {
  Task025MonitoringReadinessStatus,
  Task025ReadinessBlocker,
  Task025RiskLevel,
} from '../contracts/task025ControlledPilotReadinessContracts';

export interface MonitoringGateResult {
  monitoringStatus: Task025MonitoringReadinessStatus;
  riskLevel: Task025RiskLevel;
  safeSummary: string;
  safeBlockers: Task025ReadinessBlocker[];
  task024MonitoringReady: boolean;
  incidentDrillAvailable: boolean;
  backupRestoreDrillAvailable: boolean;
  operationalPrivacyScanAvailable: boolean;
  pauseSignalPathDefined: boolean;
  rollbackSignalPathDefined: boolean;
  readinessDiagnosticsSafeMetadataOnly: boolean;
}

export async function checkMonitoringGateReadiness(params: {
  task024MonitoringReady: boolean;
  incidentDrillAvailable: boolean;
  backupRestoreDrillAvailable: boolean;
  operationalPrivacyScanAvailable: boolean;
  pauseSignalPathDefined: boolean;
  rollbackSignalPathDefined: boolean;
  readinessDiagnosticsSafeMetadataOnly: boolean;
}): Promise<MonitoringGateResult> {
  const blockers: Task025ReadinessBlocker[] = [];

  if (!params.task024MonitoringReady) {
    blockers.push({
      type: 'monitoring_gate',
      severity: 'high',
      safeDescription: 'Task 024 monitoring readiness is not available.',
      requiredAction: 'Complete Task 024 monitoring readiness before proceeding.',
    });
  }

  if (!params.incidentDrillAvailable) {
    blockers.push({
      type: 'monitoring_gate',
      severity: 'high',
      safeDescription: 'Incident drill dry-run is not available.',
      requiredAction: 'Conduct an incident drill dry-run before pilot.',
    });
  }

  if (!params.backupRestoreDrillAvailable) {
    blockers.push({
      type: 'monitoring_gate',
      severity: 'high',
      safeDescription: 'Backup and restore drill is not available.',
      requiredAction: 'Conduct a backup and restore drill before pilot.',
    });
  }

  if (!params.operationalPrivacyScanAvailable) {
    blockers.push({
      type: 'monitoring_gate',
      severity: 'medium',
      safeDescription: 'Operational privacy scan is not available.',
      requiredAction: 'Set up operational privacy scanning capability.',
    });
  }

  if (!params.pauseSignalPathDefined) {
    blockers.push({
      type: 'monitoring_gate',
      severity: 'high',
      safeDescription: 'Pause signal path is not defined.',
      requiredAction: 'Define the pause signal path.',
    });
  }

  if (!params.rollbackSignalPathDefined) {
    blockers.push({
      type: 'monitoring_gate',
      severity: 'high',
      safeDescription: 'Rollback signal path is not defined.',
      requiredAction: 'Define the rollback signal path.',
    });
  }

  if (!params.readinessDiagnosticsSafeMetadataOnly) {
    blockers.push({
      type: 'monitoring_gate',
      severity: 'high',
      safeDescription: 'Readiness diagnostics are not restricted to safe metadata only.',
      requiredAction: 'Ensure diagnostics only return safe metadata.',
    });
  }

  const hasHighBlocker = blockers.some((b) => b.severity === 'high');
  const status: Task025MonitoringReadinessStatus = hasHighBlocker
    ? 'monitoring_blocked'
    : 'monitoring_ready';
  const riskLevel: Task025RiskLevel = hasHighBlocker ? 'high' : 'low';

  return {
    monitoringStatus: status,
    riskLevel,
    safeSummary: status === 'monitoring_ready'
      ? 'Monitoring gate readiness confirmed. Task 024 dependency is available.'
      : `Monitoring gate readiness has ${blockers.length} blocker(s).`,
    safeBlockers: blockers,
    task024MonitoringReady: params.task024MonitoringReady,
    incidentDrillAvailable: params.incidentDrillAvailable,
    backupRestoreDrillAvailable: params.backupRestoreDrillAvailable,
    operationalPrivacyScanAvailable: params.operationalPrivacyScanAvailable,
    pauseSignalPathDefined: params.pauseSignalPathDefined,
    rollbackSignalPathDefined: params.rollbackSignalPathDefined,
    readinessDiagnosticsSafeMetadataOnly: params.readinessDiagnosticsSafeMetadataOnly,
  };
}
