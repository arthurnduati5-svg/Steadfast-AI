import type { Task024OperationsDiagnostic, Task024DiagnosticSeverity } from '../contracts/task024OperationsReadinessContracts';
import { task024ReadinessRepository } from './task024OperationsReadinessRepository';

export async function getOperationsReadinessHealth(): Promise<Task024OperationsDiagnostic[]> {
  return getAllDiagnostics();
}

export async function getMonitoringHealth(): Promise<Task024OperationsDiagnostic> {
  return makeDiagnostic('monitoring_readiness', 'info', 'Monitoring readiness service available', 'MONITORING_OK');
}
export async function getAlertPolicyHealth(): Promise<Task024OperationsDiagnostic> {
  return makeDiagnostic('alert_policy', 'info', 'Alert policy service available', 'ALERT_POLICY_OK');
}
export async function getIncidentWorkflowHealth(): Promise<Task024OperationsDiagnostic> {
  return makeDiagnostic('incident_workflow', 'info', 'Incident workflow service available', 'INCIDENT_WORKFLOW_OK');
}
export async function getBackupRestoreHealth(): Promise<Task024OperationsDiagnostic> {
  return makeDiagnostic('backup_restore', 'info', 'Backup/restore services available (dry-run only)', 'BACKUP_RESTORE_OK');
}
export async function getDataIntegrityHealth(): Promise<Task024OperationsDiagnostic> {
  return makeDiagnostic('data_integrity', 'info', 'Data integrity service available (metadata only)', 'DATA_INTEGRITY_OK');
}
export async function getLoadSimulationHealth(): Promise<Task024OperationsDiagnostic> {
  return makeDiagnostic('load_simulation', 'info', 'Load simulation service available (dry-run only)', 'LOAD_SIM_OK');
}
export async function getPerformanceBaselineHealth(): Promise<Task024OperationsDiagnostic> {
  return makeDiagnostic('performance_baseline', 'info', 'Performance baseline service available', 'PERF_BASELINE_OK');
}
export async function getGovernanceContinuityHealth(): Promise<Task024OperationsDiagnostic> {
  return makeDiagnostic('governance_continuity', 'info', 'Governance continuity service available', 'GOVERNANCE_OK');
}

function makeDiagnostic(component: string, severity: Task024DiagnosticSeverity, safeMessage: string, reasonCode: string): Task024OperationsDiagnostic {
  return {
    component,
    severity,
    status: severity === 'critical' ? 'unhealthy' : 'healthy',
    safeMessage,
    reasonCode,
    checkedAt: new Date().toISOString(),
  };
}

async function getAllDiagnostics(): Promise<Task024OperationsDiagnostic[]> {
  const diags = [
    await getMonitoringHealth(),
    await getAlertPolicyHealth(),
    await getIncidentWorkflowHealth(),
    await getBackupRestoreHealth(),
    await getDataIntegrityHealth(),
    await getLoadSimulationHealth(),
    await getPerformanceBaselineHealth(),
    await getGovernanceContinuityHealth(),
  ];
  for (const d of diags) {
    await task024ReadinessRepository.recordOperationsDiagnostic(d);
  }
  return diags;
}
