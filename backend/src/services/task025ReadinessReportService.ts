import type { Task025SafeReadinessReport } from '../contracts/task025ControlledPilotReadinessContracts';
import { task025PilotReadinessRepository } from './task025PilotReadinessRepository';

export interface ReportGenerationInput {
  schoolId: string;
  schoolVerified: boolean;
  scopeGateStatus: string;
  cohortReadinessStatus: string;
  teacherWorkflowStatus: string;
  adminAcceptanceStatus: string;
  parentCommunicationStatus: string;
  safeguardingStatus: string;
  supportOperationsStatus: string;
  monitoringGateStatus: string;
  pauseRollbackStatus: string;
  dataPrivacyStatus: string;
  overallDecision: string;
  task026SafeToStart: boolean;
  requiredActions: string[];
}

export async function generateReadinessReport(
  input: ReportGenerationInput,
  actorRole: string,
  requestId: string,
): Promise<Task025SafeReadinessReport> {
  const diagnostics = task025PilotReadinessRepository.getReadinessDiagnostics(input.schoolId);

  task025PilotReadinessRepository.writeAuditEvent(
    input.schoolId,
    actorRole,
    'report_generated',
    `Readiness report generated. Decision: ${input.overallDecision}. Safe to start Task 026: ${input.task026SafeToStart}.`,
    requestId,
  );

  return {
    taskId: 'TASK-025',
    reportGeneratedAt: new Date().toISOString(),
    schoolId: input.schoolId,
    schoolVerified: input.schoolVerified,
    scopeGateStatus: input.scopeGateStatus,
    cohortReadinessStatus: input.cohortReadinessStatus,
    teacherWorkflowStatus: input.teacherWorkflowStatus,
    adminAcceptanceStatus: input.adminAcceptanceStatus,
    parentCommunicationStatus: input.parentCommunicationStatus,
    safeguardingStatus: input.safeguardingStatus,
    supportOperationsStatus: input.supportOperationsStatus,
    monitoringGateStatus: input.monitoringGateStatus,
    pauseRollbackStatus: input.pauseRollbackStatus,
    dataPrivacyStatus: input.dataPrivacyStatus,
    overallDecision: input.overallDecision,
    blockingBlockerCount: diagnostics.failedChecks,
    safeSummary: input.task026SafeToStart
      ? 'All readiness checks passed. The school is ready to begin a controlled pilot.'
      : `Readiness check identified ${diagnostics.failedChecks} blocking issue(s). The school is not yet ready for Task 026.`,
    requiredActions: input.requiredActions,
    task026SafeToStart: input.task026SafeToStart,
  };
}
