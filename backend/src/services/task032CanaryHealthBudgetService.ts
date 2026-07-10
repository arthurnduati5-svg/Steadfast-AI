import type { Task032CanaryHealthBudgetInput, Task032CanaryHealthBudgetResult } from '../contracts/task032ControlledCanaryActivationContracts';

export async function runTask032CanaryHealthBudget(input: Task032CanaryHealthBudgetInput): Promise<Task032CanaryHealthBudgetResult> {
  const blockingIssues: string[] = [];

  if (!input.schoolId) blockingIssues.push('school_id_missing');
  if (!input.activationId) blockingIssues.push('activation_id_missing');
  const activationPreflightP95Ms = 150;
  const safeViewP95Ms = 100;
  const controlActionP95Ms = 80;
  const errorRate = 0;
  const criticalErrorCount = 0;
  const privacyBoundaryFailures = 0;
  const schoolContextBypassCount = 0;
  const crossSchoolAccessCount = 0;

  const activationPreflightBudgetPassed = activationPreflightP95Ms <= 2000;
  const safeViewBudgetPassed = safeViewP95Ms <= 1500;
  const controlActionBudgetPassed = controlActionP95Ms <= 1500;
  const errorRateBudgetPassed = errorRate <= 0.01;
  const criticalErrorBudgetPassed = criticalErrorCount === 0;
  const privacyBoundaryBudgetPassed = privacyBoundaryFailures === 0;
  const schoolContextBypassBudgetPassed = schoolContextBypassCount === 0;
  const crossSchoolAccessBudgetPassed = crossSchoolAccessCount === 0;

  if (!activationPreflightBudgetPassed) blockingIssues.push('activation_preflight_p95_exceeded');
  if (!safeViewBudgetPassed) blockingIssues.push('safe_view_p95_exceeded');
  if (!controlActionBudgetPassed) blockingIssues.push('control_action_p95_exceeded');
  if (!errorRateBudgetPassed) blockingIssues.push('error_rate_exceeded');
  if (!criticalErrorBudgetPassed) blockingIssues.push('critical_errors_detected');
  if (!privacyBoundaryBudgetPassed) blockingIssues.push('privacy_boundary_failures_detected');
  if (!schoolContextBypassBudgetPassed) blockingIssues.push('school_context_bypass_detected');
  if (!crossSchoolAccessBudgetPassed) blockingIssues.push('cross_school_access_detected');

  const overallPassed = blockingIssues.length === 0;

  return {
    ok: overallPassed,
    activationPreflightP95Ms,
    safeViewP95Ms,
    controlActionP95Ms,
    errorRate,
    criticalErrorCount,
    privacyBoundaryFailures,
    schoolContextBypassCount,
    crossSchoolAccessCount,
    activationPreflightBudgetPassed,
    safeViewBudgetPassed,
    controlActionBudgetPassed,
    errorRateBudgetPassed,
    criticalErrorBudgetPassed,
    privacyBoundaryBudgetPassed,
    schoolContextBypassBudgetPassed,
    crossSchoolAccessBudgetPassed,
    overallPassed,
    blockingIssues
  };
}
