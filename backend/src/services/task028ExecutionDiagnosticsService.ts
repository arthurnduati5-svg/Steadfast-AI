import { task028ExpansionExecutionRepository } from '../repositories/task028ExpansionExecutionRepository';
import type { Task028ExecutionDiagnostics } from '../contracts/task028ControlledExpansionExecutionContracts';
import { nowISO } from '../contracts/task028ControlledExpansionExecutionContracts';
import { createSafeTask028ValidationError } from '../lib/task028ControlledExpansionExecutionValidation';

export async function generateDiagnostics(
  runId: string,
  schoolId: string,
): Promise<Task028ExecutionDiagnostics> {
  if (!runId) {
    throw createSafeTask028ValidationError('runId is required.', ['runId_required']);
  }
  if (!schoolId) {
    throw createSafeTask028ValidationError('schoolId is required.', ['schoolId_required']);
  }

  const run = await task028ExpansionExecutionRepository.getExecutionRun(runId);
  if (!run) {
    throw createSafeTask028ValidationError('Execution run not found.', ['execution_run_not_found']);
  }
  const runAny = run as any;

  if (runAny.schoolId !== schoolId) {
    throw createSafeTask028ValidationError('School ID mismatch.', ['school_mismatch']);
  }

  const participants = await task028ExpansionExecutionRepository.listExpandedParticipants(runId);
  const healthSnapshots = await task028ExpansionExecutionRepository.listHealthSnapshots(runId);
  const oversightItems = await task028ExpansionExecutionRepository.listOversightItems(runId);
  const interventions = await task028ExpansionExecutionRepository.listInterventionRecords(runId);
  const audits = await task028ExpansionExecutionRepository.listAuditRecords(runId);

  const createdAt = runAny.createdAt ? new Date(runAny.createdAt).getTime() : Date.now();
  const uptimeSeconds = Math.floor((Date.now() - createdAt) / 1000);

  return {
    runId,
    schoolId,
    runStatus: runAny.status,
    stateHistoryCount: Array.isArray(runAny.stateHistory) ? runAny.stateHistory.length : 0,
    activeCohortCount: participants.filter((p: any) => p.activationStatus === 'active').length,
    totalAccessDecisions: oversightItems.filter(
      (o: any) => o.itemType === 'blocked_student_access' || o.itemType === 'critical_safety_signal',
    ).length,
    healthSnapshotCount: healthSnapshots.length,
    interventionCount: interventions.length,
    incidentCount: oversightItems.filter(
      (o: any) => o.severity === 'high' || o.severity === 'critical',
    ).length,
    evidenceEventCount: participants.length,
    auditEventCount: audits.length,
    uptimeSeconds,
    safeMessage: `Diagnostics generated for run ${runId}. Status: ${runAny.status}. Uptime: ${uptimeSeconds}s.`,
  };
}
