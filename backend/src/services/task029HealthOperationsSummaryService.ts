import type { Task029HealthOperationsSummary } from '../contracts/task029ExpansionOperationsContracts';
import { task028ExpansionExecutionRepository } from '../repositories/task028ExpansionExecutionRepository';

export async function getHealthOperationsSummary(expansionRunId: string, schoolId: string): Promise<{
  ok: boolean;
  data: Task029HealthOperationsSummary | null;
  blockingIssues: string[];
}> {
  const blockingIssues: string[] = [];

  if (!expansionRunId || !expansionRunId.trim()) {
    blockingIssues.push('expansion_run_not_found');
    return { ok: false, data: null, blockingIssues };
  }

  if (!schoolId || !schoolId.trim()) {
    blockingIssues.push('school_context_missing');
    return { ok: false, data: null, blockingIssues };
  }

  const run = await task028ExpansionExecutionRepository.getExecutionRun(expansionRunId);

  if (!run) {
    blockingIssues.push('expansion_run_not_found');
    return { ok: false, data: null, blockingIssues };
  }

  if (run.schoolId !== schoolId) {
    blockingIssues.push('cross_school_access_denied');
    return { ok: false, data: null, blockingIssues };
  }

  const healthSnapshots = await task028ExpansionExecutionRepository.listHealthSnapshots(expansionRunId);
  const oversightItems = await task028ExpansionExecutionRepository.listOversightItems(expansionRunId);
  const interventions = await task028ExpansionExecutionRepository.listInterventionRecords(expansionRunId);

  const latestHealth = healthSnapshots[0] ?? null;

  const blockedAccessCount = latestHealth
    ? latestHealth.blockedExpandedSessionStarts + latestHealth.schoolAuthBlocks + latestHealth.cohortScopeBlocks + latestHealth.curriculumGateBlocks
    : 0;

  const supportNeededCount = oversightItems.filter(o => o.status === 'open').length;
  const interventionCount = interventions.length;
  const incidentCount = oversightItems.filter(o => o.severity === 'critical' || o.severity === 'high').length;

  const totalBlocks = latestHealth
    ? latestHealth.blockedExpandedSessionStarts +
      latestHealth.schoolAuthBlocks +
      latestHealth.cohortScopeBlocks +
      latestHealth.curriculumGateBlocks +
      latestHealth.socraticGateBlocks +
      latestHealth.deenGateBlocks +
      latestHealth.privacyGateBlocks +
      latestHealth.aiCallBlocks +
      latestHealth.memoryAccessBlocks +
      latestHealth.evidenceWriteBlocks
    : 0;

  let riskLevel: string;
  if (totalBlocks > 20 || (latestHealth?.errorCount ?? 0) > 10) {
    riskLevel = 'critical';
  } else if (totalBlocks > 10 || (latestHealth?.errorCount ?? 0) > 5) {
    riskLevel = 'high';
  } else if (totalBlocks > 5 || (latestHealth?.errorCount ?? 0) > 2) {
    riskLevel = 'medium';
  } else {
    riskLevel = 'low';
  }

  const privacyRiskLevel = (latestHealth?.privacyGateBlocks ?? 0) > 0 ? 'medium' : 'low';
  const safeguardingRiskLevel = (latestHealth?.schoolAuthBlocks ?? 0) > 3 ? 'medium' : 'low';
  const contentGovernanceRiskLevel = (latestHealth?.curriculumGateBlocks ?? 0) > 3 ? 'medium' : 'low';
  const deenContentRiskLevel = (latestHealth?.deenGateBlocks ?? 0) > 0 ? 'medium' : 'low';
  const socraticRiskLevel = (latestHealth?.socraticGateBlocks ?? 0) > 2 ? 'medium' : 'low';

  const reasonCodes: string[] = [];
  if (blockedAccessCount > 0) reasonCodes.push('access_blocked');
  if (supportNeededCount > 0) reasonCodes.push('support_needed');
  if (interventionCount > 0) reasonCodes.push('intervention_required');
  if (riskLevel === 'critical' || riskLevel === 'high') reasonCodes.push('risk_elevated');
  if (reasonCodes.length === 0) reasonCodes.push('healthy');

  const data: Task029HealthOperationsSummary = {
    latestHealthStatus: latestHealth
      ? totalBlocks > 20 ? 'critical' : totalBlocks > 10 ? 'degraded' : totalBlocks > 5 ? 'watch' : 'healthy'
      : 'unknown',
    operationsRiskLevel: riskLevel,
    privacyRiskLevel,
    safeguardingRiskLevel,
    contentGovernanceRiskLevel,
    deenContentRiskLevel,
    socraticRiskLevel,
    blockedAccessCount,
    supportNeededCount,
    interventionCount,
    incidentCount,
    rollbackReadinessStatus: run.status === 'rolled_back' ? 'rolled_back' : run.status === 'rollback_requested' ? 'rollback_in_progress' : 'ready',
    recommendedControlAction: riskLevel === 'critical' ? 'execute_kill_switch' : riskLevel === 'high' ? 'request_intervention' : riskLevel === 'medium' ? 'request_rollback' : 'none',
    safeReasonCodes: reasonCodes,
  };

  return { ok: true, data, blockingIssues: [] };
}
