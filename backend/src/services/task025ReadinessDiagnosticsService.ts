import type { Task025ReadinessDiagnostics, Task025PilotReadinessDecision } from '../contracts/task025ControlledPilotReadinessContracts';
import { task025PilotReadinessRepository } from './task025PilotReadinessRepository';

export interface DiagnosticsInput {
  schoolId: string;
  schoolVerified: boolean;
  scopeGatePassed: boolean;
  cohortReadinessPassed: boolean;
  teacherWorkflowPassed: boolean;
  adminAcceptancePassed: boolean;
  parentCommunicationPassed: boolean;
  safeguardingPassed: boolean;
  supportOperationsPassed: boolean;
  monitoringGatePassed: boolean;
  pauseRollbackPassed: boolean;
  dataPrivacyPassed: boolean;
  task020ContinuityPassed: boolean;
  task021ContinuityPassed: boolean;
  task022ContinuityPassed: boolean;
  task023ContinuityPassed: boolean;
  task024ContinuityPassed: boolean;
}

export async function generateReadinessDiagnostics(
  input: DiagnosticsInput,
): Promise<Task025ReadinessDiagnostics> {
  const storeDiagnostics = task025PilotReadinessRepository.getReadinessDiagnostics(input.schoolId);

  const allGates = [
    input.scopeGatePassed,
    input.cohortReadinessPassed,
    input.teacherWorkflowPassed,
    input.adminAcceptancePassed,
    input.parentCommunicationPassed,
    input.safeguardingPassed,
    input.supportOperationsPassed,
    input.monitoringGatePassed,
    input.pauseRollbackPassed,
    input.dataPrivacyPassed,
    input.task020ContinuityPassed,
    input.task021ContinuityPassed,
    input.task022ContinuityPassed,
    input.task023ContinuityPassed,
    input.task024ContinuityPassed,
  ];

  const passedCount = allGates.filter(Boolean).length;
  const failedCount = allGates.length - passedCount;

  let overallDecision: Task025PilotReadinessDecision;
  if (failedCount === 0) {
    overallDecision = 'ready_to_start_task026';
  } else if (failedCount <= 3) {
    overallDecision = 'manual_review_required';
  } else {
    overallDecision = 'not_ready';
  }

  const safeSummary = overallDecision === 'ready_to_start_task026'
    ? 'All readiness diagnostics passed.'
    : `${failedCount} of ${allGates.length} readiness diagnostics checks failed.`;

  return {
    schoolId: input.schoolId,
    schoolVerified: input.schoolVerified,
    scopeGatePassed: input.scopeGatePassed,
    cohortReadinessPassed: input.cohortReadinessPassed,
    teacherWorkflowPassed: input.teacherWorkflowPassed,
    adminAcceptancePassed: input.adminAcceptancePassed,
    parentCommunicationPassed: input.parentCommunicationPassed,
    safeguardingPassed: input.safeguardingPassed,
    supportOperationsPassed: input.supportOperationsPassed,
    monitoringGatePassed: input.monitoringGatePassed,
    pauseRollbackPassed: input.pauseRollbackPassed,
    dataPrivacyPassed: input.dataPrivacyPassed,
    task020ContinuityPassed: input.task020ContinuityPassed,
    task021ContinuityPassed: input.task021ContinuityPassed,
    task022ContinuityPassed: input.task022ContinuityPassed,
    task023ContinuityPassed: input.task023ContinuityPassed,
    task024ContinuityPassed: input.task024ContinuityPassed,
    overallDecision,
    blockingBlockerCount: storeDiagnostics.failedChecks,
    warningCount: storeDiagnostics.totalChecks - storeDiagnostics.passedChecks - storeDiagnostics.failedChecks,
    safeSummary,
  };
}
