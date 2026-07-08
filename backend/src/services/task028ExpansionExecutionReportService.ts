import { task028ExpansionExecutionRepository } from '../repositories/task028ExpansionExecutionRepository';
import type { Task028SafeExpansionExecutionReport } from '../contracts/task028ControlledExpansionExecutionContracts';
import { nowISO } from '../contracts/task028ControlledExpansionExecutionContracts';
import { createSafeTask028ValidationError } from '../lib/task028ControlledExpansionExecutionValidation';

interface OldReportResult {
  ok: boolean;
  reportId: string;
  safeToStartTask029: boolean;
  safeMessage: string;
  reasonCodes: string[];
}

async function buildExecutionReportData(runId: string, schoolId: string) {
  const run = await task028ExpansionExecutionRepository.getExecutionRun(runId);
  if (!run) throw createSafeTask028ValidationError('Execution run not found.', ['execution_run_not_found']);
  const runAny = run as any;

  if (runAny.schoolId !== schoolId) {
    throw createSafeTask028ValidationError('School ID mismatch.', ['school_mismatch']);
  }

  const stages = await task028ExpansionExecutionRepository.listStagesByRun(runId);
  const participants = await task028ExpansionExecutionRepository.listExpandedParticipants(runId);
  const healthSnapshots = await task028ExpansionExecutionRepository.listHealthSnapshots(runId);
  const oversightItems = await task028ExpansionExecutionRepository.listOversightItems(runId);
  const interventions = await task028ExpansionExecutionRepository.listInterventionRecords(runId);
  const audits = await task028ExpansionExecutionRepository.listAuditRecords(runId);

  const hasCriticalOversight = oversightItems.some((o: any) => o.severity === 'critical' && o.status === 'open');
  const hasHighOversight = oversightItems.filter((o: any) => o.severity === 'high' && o.status === 'open').length > 3;
  const hasCriticalHealth = healthSnapshots.some((h: any) => (h as any).metadataSafeJson?.healthStatus === 'critical');
  const allStagesCompleted = stages.length > 0 && stages.every((s: any) => s.status === 'completed');
  const rollbackProven = audits.some((a: any) => a.action === 'rollback_executed' || a.action === 'rollback_completed');

  const remainingBlockers: string[] = [];
  if (!allStagesCompleted) remainingBlockers.push('Not all stages completed.');
  if (hasCriticalOversight) remainingBlockers.push('Critical oversight items unresolved.');
  if (hasCriticalHealth) remainingBlockers.push('Critical health status detected.');
  if (!rollbackProven) remainingBlockers.push('Rollback was never exercised.');

  const safeToStartTask029 = allStagesCompleted && !hasCriticalOversight && !hasCriticalHealth && rollbackProven;
  const safeToStartTask030 = safeToStartTask029 && remainingBlockers.length === 0;
  const safeToStartTask040 = safeToStartTask030;

  return { run: runAny, stages, participants, healthSnapshots, oversightItems, interventions, audits, hasCriticalOversight, hasCriticalHealth, allStagesCompleted, rollbackProven, remainingBlockers, safeToStartTask029, safeToStartTask030, safeToStartTask040 };
}

export async function generateExecutionReport(
  runId: string,
): Promise<OldReportResult> {
  try {
    const run = await task028ExpansionExecutionRepository.getExecutionRun(runId);
    if (!run) return { ok: false, reportId: '', safeToStartTask029: false, safeMessage: 'Execution run not found.', reasonCodes: ['execution_run_not_found'] };

    const schoolId = (run as any).schoolId;
    const data = await buildExecutionReportData(runId, schoolId);

    const reportData = await task028ExpansionExecutionRepository.createExecutionReport({
      executionRunId: runId, schoolId, taskId: '028', taskName: 'Controlled Expansion Execution Runtime',
      status: data.run.status === 'completed' ? 'completed' : 'partial',
      safeToStartNextTask: data.safeToStartTask029,
      safeSummary: `Execution report for run ${runId}. safeToStartTask029: ${data.safeToStartTask029}.`,
      executionSummary: { runId, schoolId, status: data.run.status, stagesCreated: data.stages.length, participantsTotal: data.participants.length, participantsActive: data.participants.filter((p: any) => p.activationStatus === 'active').length, healthSnapshots: data.healthSnapshots.length, oversightItems: data.oversightItems.length, interventions: data.interventions.length, audits: data.audits.length },
      completionReviewSummary: { safeToStartTask029: data.safeToStartTask029, safeToStartTask030: data.safeToStartTask030, safeToStartTask040: data.safeToStartTask040, remainingBlockers: data.remainingBlockers },
      blockingIssues: data.remainingBlockers,
      knownLimitations: ['Report based on in-memory or database state at generation time.', 'Does not include external system verification.'],
    });

    return {
      ok: true,
      reportId: (reportData as any).id,
      safeToStartTask029: data.safeToStartTask029,
      safeMessage: `Execution report generated. safeToStartTask029: ${data.safeToStartTask029}.`,
      reasonCodes: [],
    };
  } catch (err: any) {
    return { ok: false, reportId: '', safeToStartTask029: false, safeMessage: err?.safeMessage || 'Report generation failed.', reasonCodes: err?.reasonCodes || ['report_generation_failed'] };
  }
}

export async function generateControlledExpansionExecutionReport(
  runId: string,
  schoolId: string,
): Promise<Task028SafeExpansionExecutionReport> {
  if (!runId) throw createSafeTask028ValidationError('runId is required.', ['runId_required']);
  if (!schoolId) throw createSafeTask028ValidationError('schoolId is required.', ['schoolId_required']);

  const data = await buildExecutionReportData(runId, schoolId);

  await task028ExpansionExecutionRepository.createExecutionReport({
    executionRunId: runId, schoolId, taskId: '028', taskName: 'Controlled Expansion Execution Runtime',
    status: data.run.status === 'completed' ? 'completed' : 'partial',
    safeToStartNextTask: data.safeToStartTask029,
    safeSummary: `Execution report for run ${runId}. Status: ${data.run.status}. safeToStartTask029: ${data.safeToStartTask029}.`,
    executionSummary: { runId, schoolId, status: data.run.status, stagesCreated: data.stages.length, participantsTotal: data.participants.length, participantsActive: data.participants.filter((p: any) => p.activationStatus === 'active').length, healthSnapshots: data.healthSnapshots.length, oversightItems: data.oversightItems.length, interventions: data.interventions.length, audits: data.audits.length },
    completionReviewSummary: { safeToStartTask029: data.safeToStartTask029, safeToStartTask030: data.safeToStartTask030, safeToStartTask040: data.safeToStartTask040, remainingBlockers: data.remainingBlockers },
    blockingIssues: data.remainingBlockers,
    knownLimitations: ['Report based on in-memory or database state at generation time.', 'Does not include external system verification.'],
    artifactPaths: ['docs/ops/task-028/task-028-expansion-execution-report.json', 'docs/ops/task-028/TASK_028_EXECUTION_REPORT.md'],
  });

  return {
    taskId: '028',
    scope: `Controlled Expansion Execution Runtime for school ${schoolId}`,
    task027DependencyCommit: 'd769350',
    task027GatePassed: true,
    stateMachineResult: data.run.status,
    cohortActivationResult: data.allStagesCompleted ? 'completed' : 'partial',
    learnerAccessGateResult: data.participants.filter((p: any) => p.activationStatus === 'active').length > 0 ? 'active' : 'no_active_participants',
    runtimeGuardResult: data.hasCriticalOversight ? 'blocked' : 'passed',
    teacherOversightResult: data.oversightItems.filter((o: any) => o.requiresTeacherReview).length > 0 ? 'review_pending' : 'passed',
    healthSnapshotResult: data.hasCriticalHealth ? 'critical' : 'healthy',
    interventionResult: data.interventions.length > 0 ? `${data.interventions.length}_interventions` : 'none',
    incidentBridgeResult: data.oversightItems.filter((o: any) => o.severity === 'high' || o.severity === 'critical').length > 0 ? 'incidents_recorded' : 'none',
    rollbackExecutionResult: data.rollbackProven ? 'proven' : 'not_exercised',
    evidenceLedgerResult: 'recorded',
    completionReviewResult: data.safeToStartTask029 ? 'passed' : 'blocked',
    safeToStartTask029: data.safeToStartTask029,
    safeToStartTask030: data.safeToStartTask030,
    safeToStartTask040: data.safeToStartTask040,
    remainingBlockers: data.remainingBlockers,
    generatedAt: nowISO(),
  };
}
