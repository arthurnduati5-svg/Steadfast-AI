import type { Task033HealthBudgetReview } from '../contracts/task033CanaryObservationContracts';

export interface HealthMetrics {
  p95LatencyMs: number;
  errorRatePercent: number;
  privacyLeakCount: number;
  schoolAuthBypassCount: number;
  canaryMembershipBypassCount: number;
  socraticBypassCount: number;
  deenBypassCount: number;
  unhandledSafeguardingCount: number;
  openRolloutCount: number;
  schoolWideRolloutCount: number;
}

const DEFAULT_BUDGETS = {
  maxP95LatencyMs: 2500,
  maxErrorRatePercent: 1,
  maxPrivacyLeakCount: 0,
  maxSchoolAuthBypassCount: 0,
  maxCanaryMembershipBypassCount: 0,
  maxSocraticBypassCount: 0,
  maxDeenBypassCount: 0,
  maxUnhandledSafeguardingCount: 0,
  maxOpenRolloutCount: 0,
  maxSchoolWideRolloutCount: 0,
};

export function enforceTask033HealthBudget(metrics: Partial<HealthMetrics>): Task033HealthBudgetReview {
  const blockingIssues: string[] = [];

  const budgets = {
    ...DEFAULT_BUDGETS,
    maxP95LatencyMs: parseInt(process.env.TASK033_MAX_P95_LATENCY_MS || String(DEFAULT_BUDGETS.maxP95LatencyMs), 10),
    maxErrorRatePercent: parseInt(process.env.TASK033_MAX_ERROR_RATE_PERCENT || String(DEFAULT_BUDGETS.maxErrorRatePercent), 10),
  };

  const latencyBudgetPassed = (metrics.p95LatencyMs ?? 0) <= budgets.maxP95LatencyMs;
  const errorBudgetPassed = (metrics.errorRatePercent ?? 0) <= budgets.maxErrorRatePercent;
  const privacyBudgetPassed = (metrics.privacyLeakCount ?? 0) <= budgets.maxPrivacyLeakCount;
  const schoolAuthBudgetPassed = (metrics.schoolAuthBypassCount ?? 0) <= budgets.maxSchoolAuthBypassCount;
  const canaryMembershipBudgetPassed = (metrics.canaryMembershipBypassCount ?? 0) <= budgets.maxCanaryMembershipBypassCount;
  const socraticBudgetPassed = (metrics.socraticBypassCount ?? 0) <= budgets.maxSocraticBypassCount;
  const deenBudgetPassed = (metrics.deenBypassCount ?? 0) <= budgets.maxDeenBypassCount;
  const safeguardingBudgetPassed = (metrics.unhandledSafeguardingCount ?? 0) <= budgets.maxUnhandledSafeguardingCount;
  const openRolloutBudgetPassed = (metrics.openRolloutCount ?? 0) <= budgets.maxOpenRolloutCount;
  const schoolWideRolloutBudgetPassed = (metrics.schoolWideRolloutCount ?? 0) <= budgets.maxSchoolWideRolloutCount;

  if (!latencyBudgetPassed) blockingIssues.push('latency_budget_exceeded');
  if (!errorBudgetPassed) blockingIssues.push('error_budget_exceeded');
  if (!privacyBudgetPassed) blockingIssues.push('privacy_budget_exceeded');
  if (!schoolAuthBudgetPassed) blockingIssues.push('school_auth_budget_exceeded');
  if (!canaryMembershipBudgetPassed) blockingIssues.push('canary_membership_budget_exceeded');
  if (!socraticBudgetPassed) blockingIssues.push('socratic_budget_exceeded');
  if (!deenBudgetPassed) blockingIssues.push('deen_budget_exceeded');
  if (!safeguardingBudgetPassed) blockingIssues.push('safeguarding_budget_exceeded');
  if (!openRolloutBudgetPassed) blockingIssues.push('open_rollout_budget_exceeded');
  if (!schoolWideRolloutBudgetPassed) blockingIssues.push('school_wide_rollout_budget_exceeded');

  const overallPassed = blockingIssues.length === 0;

  return {
    ok: overallPassed,
    latencyBudgetPassed,
    errorBudgetPassed,
    privacyBudgetPassed,
    schoolAuthBudgetPassed,
    canaryMembershipBudgetPassed,
    socraticBudgetPassed,
    deenBudgetPassed,
    safeguardingBudgetPassed,
    openRolloutBudgetPassed,
    schoolWideRolloutBudgetPassed,
    overallPassed,
    blockingIssues,
  };
}
