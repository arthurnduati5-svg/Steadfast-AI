import type { Task031LatencyErrorBudget, Task031ObservabilityBaseline } from '../contracts/task031StagingSmokeContracts';

export interface LatencyErrorBudgetInput {
  baseline: Task031ObservabilityBaseline;
  maxP95LatencyMs?: number;
  maxErrorCount?: number;
  maxPrivacyGateFailuresAllowed?: number;
  maxSocraticGateFailuresAllowed?: number;
  maxDeenGateFailuresAllowed?: number;
  maxSchoolAuthBypassAllowed?: number;
}

export function evaluateTask031LatencyErrorBudget(
  input: LatencyErrorBudgetInput,
): Task031LatencyErrorBudget {
  const {
    baseline,
    maxP95LatencyMs = 2500,
    maxErrorCount = 0,
    maxPrivacyGateFailuresAllowed = 0,
    maxSocraticGateFailuresAllowed = 0,
    maxDeenGateFailuresAllowed = 0,
    maxSchoolAuthBypassAllowed = 0,
  } = input;

  const blockingIssues: string[] = [];

  const latencyBudgetPassed = baseline.p95LatencyMs <= maxP95LatencyMs;
  const errorBudgetPassed = baseline.errorCount <= maxErrorCount;
  const privacyBudgetPassed = baseline.privacyGateDenialCount <= maxPrivacyGateFailuresAllowed;
  const socraticBudgetPassed = baseline.socraticGateDenialCount <= maxSocraticGateFailuresAllowed;
  const deenBudgetPassed = baseline.deenGateDenialCount <= maxDeenGateFailuresAllowed;
  const schoolAuthBudgetPassed = baseline.schoolAuthDenialCount <= maxSchoolAuthBypassAllowed;

  if (!latencyBudgetPassed) blockingIssues.push(`p95_latency_${baseline.p95LatencyMs}ms_exceeds_max_${maxP95LatencyMs}ms`);
  if (!errorBudgetPassed) blockingIssues.push(`error_count_${baseline.errorCount}_exceeds_max_${maxErrorCount}`);
  if (!privacyBudgetPassed) blockingIssues.push(`privacy_gate_denial_count_${baseline.privacyGateDenialCount}_exceeds_allowed`);
  if (!socraticBudgetPassed) blockingIssues.push(`socratic_gate_denial_count_${baseline.socraticGateDenialCount}_exceeds_allowed`);
  if (!deenBudgetPassed) blockingIssues.push(`deen_gate_denial_count_${baseline.deenGateDenialCount}_exceeds_allowed`);
  if (!schoolAuthBudgetPassed) blockingIssues.push(`school_auth_denial_count_${baseline.schoolAuthDenialCount}_exceeds_allowed`);

  const overallPassed = blockingIssues.length === 0;

  return {
    maxP95LatencyMs, maxErrorCount, maxPrivacyGateFailuresAllowed,
    maxSocraticGateFailuresAllowed, maxDeenGateFailuresAllowed, maxSchoolAuthBypassAllowed,
    latencyBudgetPassed, errorBudgetPassed, privacyBudgetPassed,
    socraticBudgetPassed, deenBudgetPassed, schoolAuthBudgetPassed,
    overallPassed, blockingIssues,
  };
}
