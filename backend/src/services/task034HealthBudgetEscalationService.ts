import type { Task034HealthBudgetEscalationResult } from '../contracts/task034ControlledLimitedRolloutContracts';

export interface HealthBudgetMetrics {
  rolloutLatencyP95Ms: number;
  safeReadLatencyP95Ms: number;
  eventIntakeLatencyP95Ms: number;
  errorRate: number;
  criticalErrorCount: number;
  timeoutCount: number;
  privacyBoundaryFailureCount: number;
  schoolContextBypassCount: number;
  crossSchoolAttemptCount: number;
  runtimeGuardDenialCount: number;
  rollbackReadinessFailureCount: number;
}

const MAX_LATENCY_MS = 2500;
const MAX_ERROR_RATE = 1;
const MAX_CRITICAL_ERRORS = 0;

export function evaluateTask034HealthBudget(metrics: HealthBudgetMetrics): Task034HealthBudgetEscalationResult {
  const blockingIssues: string[] = [];

  const rolloutLatencyOk = metrics.rolloutLatencyP95Ms <= MAX_LATENCY_MS;
  const safeReadLatencyOk = metrics.safeReadLatencyP95Ms <= MAX_LATENCY_MS;
  const eventIntakeLatencyOk = metrics.eventIntakeLatencyP95Ms <= MAX_LATENCY_MS;
  const errorRateOk = metrics.errorRate <= MAX_ERROR_RATE;
  const criticalErrorsOk = metrics.criticalErrorCount <= MAX_CRITICAL_ERRORS;
  const timeoutsOk = metrics.timeoutCount <= 0;
  const privacyBoundaryOk = metrics.privacyBoundaryFailureCount <= 0;
  const schoolContextBypassOk = metrics.schoolContextBypassCount <= 0;
  const crossSchoolAttemptOk = metrics.crossSchoolAttemptCount <= 0;
  const runtimeGuardDenialOk = metrics.runtimeGuardDenialCount <= 0;
  const rollbackReadinessOk = metrics.rollbackReadinessFailureCount <= 0;

  if (!rolloutLatencyOk) blockingIssues.push('rollout_latency_p95_exceeded');
  if (!safeReadLatencyOk) blockingIssues.push('safe_read_latency_p95_exceeded');
  if (!eventIntakeLatencyOk) blockingIssues.push('event_intake_latency_p95_exceeded');
  if (!errorRateOk) blockingIssues.push('error_rate_exceeded');
  if (!criticalErrorsOk) blockingIssues.push('critical_errors_detected');
  if (!timeoutsOk) blockingIssues.push('timeouts_detected');
  if (!privacyBoundaryOk) blockingIssues.push('privacy_boundary_failures_detected');
  if (!schoolContextBypassOk) blockingIssues.push('school_context_bypass_detected');
  if (!crossSchoolAttemptOk) blockingIssues.push('cross_school_attempts_detected');
  if (!runtimeGuardDenialOk) blockingIssues.push('runtime_guard_denials_detected');
  if (!rollbackReadinessOk) blockingIssues.push('rollback_readiness_failures_detected');

  const healthBudgetPassed = blockingIssues.length === 0;
  const escalationRequired = !healthBudgetPassed;

  return {
    ok: healthBudgetPassed,
    rolloutLatencyP95Ms: metrics.rolloutLatencyP95Ms,
    safeReadLatencyP95Ms: metrics.safeReadLatencyP95Ms,
    eventIntakeLatencyP95Ms: metrics.eventIntakeLatencyP95Ms,
    errorRate: metrics.errorRate,
    criticalErrorCount: metrics.criticalErrorCount,
    timeoutCount: metrics.timeoutCount,
    privacyBoundaryFailureCount: metrics.privacyBoundaryFailureCount,
    schoolContextBypassCount: metrics.schoolContextBypassCount,
    crossSchoolAttemptCount: metrics.crossSchoolAttemptCount,
    runtimeGuardDenialCount: metrics.runtimeGuardDenialCount,
    rollbackReadinessFailureCount: metrics.rollbackReadinessFailureCount,
    healthBudgetPassed,
    escalationRequired,
    pauseRecommended: escalationRequired,
    rollbackRecommended: metrics.criticalErrorCount > 0 || metrics.privacyBoundaryFailureCount > 0,
    killSwitchRecommended: metrics.criticalErrorCount > 0 && metrics.privacyBoundaryFailureCount > 0,
    blockingIssues,
  };
}
