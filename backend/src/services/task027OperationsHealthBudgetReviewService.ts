import { task027PilotExpansionGovernanceRepository as govRepo } from '../repositories/task027PilotExpansionGovernanceRepository';
import type {
  Task027OperationsHealthBudgetInput,
  Task027OperationsHealthBudgetResult,
} from '../contracts/task027PilotExpansionGovernanceContracts';

export async function reviewOperationsHealthBudget(input: Task027OperationsHealthBudgetInput): Promise<Task027OperationsHealthBudgetResult> {
  const blockingIssues: string[] = [];

  if (!input.monitoringCapacityOk) {
    blockingIssues.push('Monitoring capacity insufficient to support expansion.');
  }
  if (!input.supportQueueCapacityOk) {
    blockingIssues.push('Support queue capacity insufficient for projected load.');
  }
  if (!input.incidentResponseReadinessOk) {
    blockingIssues.push('Incident response readiness not confirmed for expanded scope.');
  }
  if (!input.latencyErrorBudgetAcceptable) {
    blockingIssues.push('Latency/error budget exceeded acceptable threshold.');
  }
  if (!input.pausePathReady) {
    blockingIssues.push('Pause path not verified ready for expansion.');
  }
  if (!input.rollbackPathReady) {
    blockingIssues.push('Rollback path not verified ready for expansion.');
  }
  if (!input.killSwitchReady) {
    blockingIssues.push('Kill switch mechanism not ready for expansion.');
  }
  if (!input.teacherWorkloadAcceptable) {
    blockingIssues.push('Teacher workload projected unacceptable for expanded cohort.');
  }

  const reviewStatus = blockingIssues.length === 0
    ? 'passed'
    : 'failed';

  const safeMessage = blockingIssues.length === 0
    ? 'Operations health budget review passed. All capacity and readiness checks acceptable.'
    : `Operations health budget review failed. ${blockingIssues.length} blocking issue(s) found.`;

  await govRepo.recordReviewResult(input.schoolId, input.proposalId, 'operations_health_budget', {
    reviewStatus,
    blockingIssues,
    safeMessage,
  });

  return {
    ok: blockingIssues.length === 0,
    reviewStatus,
    blockingIssues,
    safeMessage,
  };
}
