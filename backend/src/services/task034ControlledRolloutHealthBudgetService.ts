import type { Task034HealthBudgetReview } from '../contracts/task034ControlledRolloutContracts';

export interface HealthBudgetMetrics {
  p95LatencyMs: number;
  errorRatePercent: number;
  privacyLeakCount: number;
  schoolAuthBypassCount: number;
  rolloutMembershipBypassCount: number;
  socraticBypassCount: number;
  deenBypassCount: number;
  curriculumBypassCount: number;
  unhandledSafeguardingCount: number;
  openRolloutCount: number;
  schoolWideRolloutCount: number;
  hundredPercentRolloutCount: number;
}

const BUDGET_LIMITS = {
  maxP95LatencyMs: 2500,
  maxErrorRatePercent: 1,
  maxPrivacyLeakCount: 0,
  maxSchoolAuthBypassCount: 0,
  maxRolloutMembershipBypassCount: 0,
  maxSocraticBypassCount: 0,
  maxDeenBypassCount: 0,
  maxCurriculumBypassCount: 0,
  maxUnhandledSafeguardingCount: 0,
  maxOpenRolloutCount: 0,
  maxSchoolWideRolloutCount: 0,
  maxHundredPercentRolloutCount: 0,
};

export function evaluateHealthBudget(metrics: HealthBudgetMetrics): Task034HealthBudgetReview {
  const blockingIssues: string[] = [];

  const latencyBudgetPassed = metrics.p95LatencyMs <= BUDGET_LIMITS.maxP95LatencyMs;
  const errorBudgetPassed = metrics.errorRatePercent <= BUDGET_LIMITS.maxErrorRatePercent;
  const privacyBudgetPassed = metrics.privacyLeakCount <= BUDGET_LIMITS.maxPrivacyLeakCount;
  const schoolAuthBudgetPassed = metrics.schoolAuthBypassCount <= BUDGET_LIMITS.maxSchoolAuthBypassCount;
  const rolloutMembershipBudgetPassed = metrics.rolloutMembershipBypassCount <= BUDGET_LIMITS.maxRolloutMembershipBypassCount;
  const socraticBudgetPassed = metrics.socraticBypassCount <= BUDGET_LIMITS.maxSocraticBypassCount;
  const deenBudgetPassed = metrics.deenBypassCount <= BUDGET_LIMITS.maxDeenBypassCount;
  const curriculumBudgetPassed = metrics.curriculumBypassCount <= BUDGET_LIMITS.maxCurriculumBypassCount;
  const safeguardingBudgetPassed = metrics.unhandledSafeguardingCount <= BUDGET_LIMITS.maxUnhandledSafeguardingCount;
  const openRolloutBudgetPassed = metrics.openRolloutCount <= BUDGET_LIMITS.maxOpenRolloutCount;
  const schoolWideRolloutBudgetPassed = metrics.schoolWideRolloutCount <= BUDGET_LIMITS.maxSchoolWideRolloutCount;
  const hundredPercentRolloutBudgetPassed = metrics.hundredPercentRolloutCount <= BUDGET_LIMITS.maxHundredPercentRolloutCount;

  if (!latencyBudgetPassed) blockingIssues.push(`LATENCY_BUDGET_EXCEEDED: ${metrics.p95LatencyMs}ms > ${BUDGET_LIMITS.maxP95LatencyMs}ms`);
  if (!errorBudgetPassed) blockingIssues.push(`ERROR_BUDGET_EXCEEDED: ${metrics.errorRatePercent}% > ${BUDGET_LIMITS.maxErrorRatePercent}%`);
  if (!privacyBudgetPassed) blockingIssues.push(`PRIVACY_BUDGET_EXCEEDED: ${metrics.privacyLeakCount} leaks`);
  if (!schoolAuthBudgetPassed) blockingIssues.push(`SCHOOL_AUTH_BUDGET_EXCEEDED: ${metrics.schoolAuthBypassCount} bypasses`);
  if (!rolloutMembershipBudgetPassed) blockingIssues.push(`ROLLOUT_MEMBERSHIP_BUDGET_EXCEEDED: ${metrics.rolloutMembershipBypassCount} bypasses`);
  if (!socraticBudgetPassed) blockingIssues.push(`SOCRATIC_BUDGET_EXCEEDED: ${metrics.socraticBypassCount} bypasses`);
  if (!deenBudgetPassed) blockingIssues.push(`DEEN_BUDGET_EXCEEDED: ${metrics.deenBypassCount} bypasses`);
  if (!curriculumBudgetPassed) blockingIssues.push(`CURRICULUM_BUDGET_EXCEEDED: ${metrics.curriculumBypassCount} bypasses`);
  if (!safeguardingBudgetPassed) blockingIssues.push(`SAFEGUARDING_BUDGET_EXCEEDED: ${metrics.unhandledSafeguardingCount} unhandled`);
  if (!openRolloutBudgetPassed) blockingIssues.push(`OPEN_ROLLOUT_BUDGET_EXCEEDED: ${metrics.openRolloutCount} counts`);
  if (!schoolWideRolloutBudgetPassed) blockingIssues.push(`SCHOOL_WIDE_ROLLOUT_BUDGET_EXCEEDED: ${metrics.schoolWideRolloutCount} counts`);
  if (!hundredPercentRolloutBudgetPassed) blockingIssues.push(`HUNDRED_PERCENT_ROLLOUT_BUDGET_EXCEEDED: ${metrics.hundredPercentRolloutCount} counts`);

  const hardSafetyBudgetFailed = !privacyBudgetPassed || !schoolAuthBudgetPassed || !rolloutMembershipBudgetPassed ||
    !socraticBudgetPassed || !deenBudgetPassed || !curriculumBudgetPassed || !safeguardingBudgetPassed ||
    !openRolloutBudgetPassed || !schoolWideRolloutBudgetPassed || !hundredPercentRolloutBudgetPassed;

  const overallPassed = latencyBudgetPassed && errorBudgetPassed && !hardSafetyBudgetFailed && blockingIssues.length === 0;

  return {
    ok: overallPassed,
    latencyBudgetPassed,
    errorBudgetPassed,
    privacyBudgetPassed,
    schoolAuthBudgetPassed,
    rolloutMembershipBudgetPassed,
    socraticBudgetPassed,
    deenBudgetPassed,
    curriculumBudgetPassed,
    safeguardingBudgetPassed,
    openRolloutBudgetPassed,
    schoolWideRolloutBudgetPassed,
    hundredPercentRolloutBudgetPassed,
    overallPassed,
    blockingIssues,
  };
}
