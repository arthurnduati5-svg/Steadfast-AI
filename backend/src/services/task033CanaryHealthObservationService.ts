import type { Task033HealthObservationResult } from '../contracts/task033ControlledCanaryObservationContracts';
import { task033Repository } from '../repositories/task033ControlledCanaryObservationRepository';

const LATENCY_BUDGET_MS = 5000;
const ERROR_RATE_BUDGET = 0.05;
const CRITICAL_ERROR_BUDGET = 3;
const TIMEOUT_BUDGET = 5;
const OBSERVATION_STORE_ERROR_BUDGET = 3;
const PRIVACY_BOUNDARY_FAILURE_BUDGET = 0;
const SCHOOL_CONTEXT_BYPASS_BUDGET = 0;
const CROSS_SCHOOL_ATTEMPT_BUDGET = 0;
const RUNTIME_GUARD_DENIAL_BUDGET = 5;

export async function observeTask033CanaryHealth(metrics: {
  observationLatencyP95Ms: number;
  eventIntakeLatencyP95Ms: number;
  safeReadLatencyP95Ms: number;
  aggregationLatencyP95Ms: number;
  errorRate: number;
  criticalErrorCount: number;
  timeoutCount: number;
  observationStoreErrorCount: number;
  privacyBoundaryFailureCount: number;
  schoolContextBypassCount: number;
  crossSchoolAttemptCount: number;
  runtimeGuardDenialCount: number;
}): Promise<Task033HealthObservationResult> {
  const blockingIssues: string[] = [];

  const observationLatencyPassed = metrics.observationLatencyP95Ms <= LATENCY_BUDGET_MS;
  const eventIntakeLatencyPassed = metrics.eventIntakeLatencyP95Ms <= LATENCY_BUDGET_MS;
  const safeReadLatencyPassed = metrics.safeReadLatencyP95Ms <= LATENCY_BUDGET_MS;
  const aggregationLatencyPassed = metrics.aggregationLatencyP95Ms <= LATENCY_BUDGET_MS;
  const errorRatePassed = metrics.errorRate < ERROR_RATE_BUDGET;
  const criticalErrorCountPassed = metrics.criticalErrorCount <= CRITICAL_ERROR_BUDGET;
  const timeoutCountPassed = metrics.timeoutCount <= TIMEOUT_BUDGET;
  const observationStoreErrorPassed = metrics.observationStoreErrorCount <= OBSERVATION_STORE_ERROR_BUDGET;
  const privacyBoundaryFailurePassed = metrics.privacyBoundaryFailureCount <= PRIVACY_BOUNDARY_FAILURE_BUDGET;
  const schoolContextBypassPassed = metrics.schoolContextBypassCount <= SCHOOL_CONTEXT_BYPASS_BUDGET;
  const crossSchoolAttemptPassed = metrics.crossSchoolAttemptCount <= CROSS_SCHOOL_ATTEMPT_BUDGET;
  const runtimeGuardDenialPassed = metrics.runtimeGuardDenialCount <= RUNTIME_GUARD_DENIAL_BUDGET;

  if (!observationLatencyPassed) blockingIssues.push('observation_latency_exceeded_budget');
  if (!eventIntakeLatencyPassed) blockingIssues.push('event_intake_latency_exceeded_budget');
  if (!safeReadLatencyPassed) blockingIssues.push('safe_read_latency_exceeded_budget');
  if (!aggregationLatencyPassed) blockingIssues.push('aggregation_latency_exceeded_budget');
  if (!errorRatePassed) blockingIssues.push('error_rate_exceeded_budget');
  if (!criticalErrorCountPassed) blockingIssues.push('critical_error_count_exceeded_budget');
  if (!timeoutCountPassed) blockingIssues.push('timeout_count_exceeded_budget');
  if (!observationStoreErrorPassed) blockingIssues.push('observation_store_error_count_exceeded_budget');
  if (!privacyBoundaryFailurePassed) blockingIssues.push('privacy_boundary_failures_detected');
  if (!schoolContextBypassPassed) blockingIssues.push('school_context_bypass_detected');
  if (!crossSchoolAttemptPassed) blockingIssues.push('cross_school_attempts_detected');
  if (!runtimeGuardDenialPassed) blockingIssues.push('runtime_guard_denials_exceeded_budget');

  const result: Task033HealthObservationResult = {
    ok: blockingIssues.length === 0,
    observationLatencyP95Ms: metrics.observationLatencyP95Ms,
    eventIntakeLatencyP95Ms: metrics.eventIntakeLatencyP95Ms,
    safeReadLatencyP95Ms: metrics.safeReadLatencyP95Ms,
    aggregationLatencyP95Ms: metrics.aggregationLatencyP95Ms,
    errorRate: metrics.errorRate,
    criticalErrorCount: metrics.criticalErrorCount,
    timeoutCount: metrics.timeoutCount,
    observationStoreErrorCount: metrics.observationStoreErrorCount,
    privacyBoundaryFailureCount: metrics.privacyBoundaryFailureCount,
    schoolContextBypassCount: metrics.schoolContextBypassCount,
    crossSchoolAttemptCount: metrics.crossSchoolAttemptCount,
    runtimeGuardDenialCount: metrics.runtimeGuardDenialCount,
    healthBudgetPassed: blockingIssues.length === 0,
    blockingIssues,
  };

  await task033Repository.recordHealthObservation(result);
  return result;
}
