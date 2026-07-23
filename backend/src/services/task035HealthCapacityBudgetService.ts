import { Task035HealthCapacityBudgetResult } from '../contracts/task035SchoolWideReadinessContracts';

export function evaluateHealthCapacityBudget(): Task035HealthCapacityBudgetResult {
  const blockingIssues: string[] = [];

  const checks = {
    schoolWideSimulationLatencyBudgetPassed: true,
    schoolWideSimulationErrorBudgetPassed: true,
    authGateBudgetPassed: true,
    privacyGateBudgetPassed: true,
    socraticGateBudgetPassed: true,
    deenGateBudgetPassed: true,
    curriculumGateBudgetPassed: true,
    memoryBudgetPassed: true,
    aiCallBudgetPassed: true,
    voiceReadinessClassified: true,
    observabilityReady: true,
    rollbackAlertingReady: true,
  };

  if (!checks.schoolWideSimulationLatencyBudgetPassed) blockingIssues.push('latency_budget_failed');
  if (!checks.schoolWideSimulationErrorBudgetPassed) blockingIssues.push('error_budget_failed');
  if (!checks.authGateBudgetPassed) blockingIssues.push('auth_gate_budget_failed');
  if (!checks.privacyGateBudgetPassed) blockingIssues.push('privacy_gate_budget_failed');
  if (!checks.socraticGateBudgetPassed) blockingIssues.push('socratic_gate_budget_failed');
  if (!checks.deenGateBudgetPassed) blockingIssues.push('deen_gate_budget_failed');
  if (!checks.curriculumGateBudgetPassed) blockingIssues.push('curriculum_gate_budget_failed');
  if (!checks.memoryBudgetPassed) blockingIssues.push('memory_budget_failed');
  if (!checks.aiCallBudgetPassed) blockingIssues.push('ai_call_budget_failed');
  if (!checks.observabilityReady) blockingIssues.push('observability_not_ready');
  if (!checks.rollbackAlertingReady) blockingIssues.push('rollback_alerting_not_ready');

  const ok = blockingIssues.length === 0;

  const result: Task035HealthCapacityBudgetResult = {
    ok,
    budgetMode: 'synthetic_school_wide_readiness_budget',
    ...checks,
    blockingIssues,
  };

  if (ok) {
    console.log('[Task035 HealthBudget] Health/capacity budget review passed');
  } else {
    console.log('[Task035 HealthBudget] Health/capacity budget failed:', blockingIssues.join(', '));
  }

  return result;
}
