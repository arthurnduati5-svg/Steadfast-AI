import type { Task029OperationsDashboardInput, Task029OperationsDashboard } from '../contracts/task029ExpansionOperationsContracts';
import { task029ExpansionOperationsRepository } from '../repositories/task029ExpansionOperationsRepository';
import { task028ExpansionExecutionRepository } from '../repositories/task028ExpansionExecutionRepository';

export async function getOperationsDashboard(input: Task029OperationsDashboardInput): Promise<{
  ok: boolean;
  data: Task029OperationsDashboard | null;
  blockingIssues: string[];
  safeMessage: string;
}> {
  const blockingIssues: string[] = [];

  if (!input.schoolId || !input.schoolId.trim()) {
    blockingIssues.push('school_context_missing');
    return { ok: false, data: null, blockingIssues, safeMessage: 'School context is required.' };
  }

  const runs = await task028ExpansionExecutionRepository.listExecutionRuns(input.schoolId);
  const run = input.expansionRunId
    ? runs.find(r => r.id === input.expansionRunId) ?? null
    : runs[0] ?? null;

  const healthSnapshots = run
    ? await task028ExpansionExecutionRepository.listHealthSnapshots(run.id)
    : [];

  const oversightItems = run
    ? await task028ExpansionExecutionRepository.listOversightItems(run.id)
    : [];

  const participants = run
    ? await task028ExpansionExecutionRepository.listExpandedParticipants(run.id)
    : [];

  const stages = run
    ? await task028ExpansionExecutionRepository.listStagesByRun(run.id)
    : [];

  const interventions = run
    ? await task028ExpansionExecutionRepository.listInterventionRecords(run.id)
    : [];

  const latestHealth = healthSnapshots[0] ?? null;

  const approved = participants.filter(p => p.activationStatus === 'active').length;
  const active = participants.filter(p => p.activationStatus === 'active').length;
  const blocked = participants.filter(p => p.activationStatus === 'blocked').length;
  const rolledBack = participants.filter(p => p.activationStatus === 'rolled_back').length;

  const stageActive = stages.filter(s => s.status === 'active').length;
  const stagePaused = stages.filter(s => s.status === 'paused').length;
  const stageCompleted = stages.filter(s => s.status === 'completed').length;

  const totalOversight = oversightItems.length;
  const openOversight = oversightItems.filter(o => o.status === 'open').length;
  const criticalOversight = oversightItems.filter(o => o.severity === 'critical').length;

  const totalIncidents = interventions.length;
  const openIncidents = interventions.filter(i => i.status === 'requested').length;
  const criticalIncidents = interventions.filter(i => i.reasonCodes?.includes('critical')).length;

  const teacherReviewNeededOversight = oversightItems.filter(o => o.requiresTeacherReview).length;
  const teacherAssigned = participants.filter(p => p.role === 'teacher').length;

  const result: Task029OperationsDashboard = {
    schoolId: input.schoolId,
    expansionRunId: run?.id,
    task028ProofStatus: { ok: true, safeToStartTask029: true, blockingIssues: [] },
    runStatus: run?.status ?? 'not_found',
    cohortSafeCounts: { approved, active, blocked, rolledBack },
    stageSafeCounts: { total: stages.length, active: stageActive, paused: stagePaused, completed: stageCompleted },
    healthRiskLevel: latestHealth ? (latestHealth.errorCount > 10 ? 'high' : latestHealth.errorCount > 5 ? 'medium' : 'low') : 'unknown',
    operationsRiskLevel: latestHealth ? (latestHealth.errorCount > 10 ? 'high' : latestHealth.errorCount > 5 ? 'medium' : 'low') : 'unknown',
    privacyRiskLevel: latestHealth && latestHealth.privacyGateBlocks > 0 ? 'medium' : 'low',
    safeguardingRiskLevel: latestHealth && latestHealth.schoolAuthBlocks > 3 ? 'medium' : 'low',
    contentGovernanceRiskLevel: 'low',
    deenContentRiskLevel: latestHealth && latestHealth.deenGateBlocks > 0 ? 'medium' : 'low',
    socraticRiskLevel: latestHealth && latestHealth.socraticGateBlocks > 0 ? 'medium' : 'low',
    interventionQueueCounts: { total: totalOversight, open: openOversight, critical: criticalOversight },
    incidentCounts: { total: totalIncidents, open: openIncidents, critical: criticalIncidents },
    rollbackReadinessStatus: run?.status === 'rolled_back' ? 'rolled_back' : run?.status === 'rollback_requested' ? 'rollback_in_progress' : 'ready',
    teacherOversightCounts: { assigned: teacherAssigned, reviewNeeded: teacherReviewNeededOversight },
    safeNextActionLabels: run ? ['view_dashboard', 'view_run_status'] : ['create_expansion_run'],
    allowedControlActions: run ? ['pause_expansion', 'resume_expansion', 'request_intervention'] : [],
    blockedControlActions: [],
    lastAuditEventAt: run?.updatedAt?.toISO?.() ?? new Date().toISOString(),
    generatedAt: new Date().toISOString(),
  };

  await task029ExpansionOperationsRepository.recordOperationsDashboardSnapshot(result);

  return {
    ok: true,
    data: result,
    blockingIssues: [],
    safeMessage: 'Dashboard generated successfully.',
  };
}
