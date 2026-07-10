import type { Task034CanaryBaselineComparisonResult } from '../contracts/task034ControlledRolloutContracts';
import * as fs from 'fs';
import * as path from 'path';

const PROJECT_ROOT = path.resolve(__dirname, '../../..');
const CANARY_BASELINE_PATH = path.join(PROJECT_ROOT, 'logs/task-033/canary-observation-result.json');

export function compareWithCanaryBaseline(
  limitedRolloutMetrics: Record<string, number>,
): Task034CanaryBaselineComparisonResult {
  const blockingIssues: string[] = [];

  let baselineLoaded = false;
  try {
    const raw = fs.readFileSync(CANARY_BASELINE_PATH, 'utf8').replace(/^\uFEFF/, '');
    const baseline = JSON.parse(raw) as Record<string, unknown>;
    baselineLoaded = baseline !== null && typeof baseline === 'object';
  } catch {
    baselineLoaded = false;
  }

  if (!baselineLoaded) {
    blockingIssues.push('CANARY_BASELINE_NOT_LOADED');
  }

  const latencyRegressionWithinBudget = (limitedRolloutMetrics.p95LatencyMs || 0) <= 2500;
  const errorRegressionWithinBudget = (limitedRolloutMetrics.errorRatePercent || 0) <= 1;
  const safetyRegressionDetected = (limitedRolloutMetrics.privacyLeakCount || 0) > 0 ||
    (limitedRolloutMetrics.schoolAuthBypassCount || 0) > 0 ||
    (limitedRolloutMetrics.rolloutMembershipBypassCount || 0) > 0;
  const hardSafetyRegressionDetected = (limitedRolloutMetrics.privacyLeakCount || 0) > 0;

  if (hardSafetyRegressionDetected) {
    blockingIssues.push('HARD_SAFETY_REGRESSION_DETECTED');
  }

  const ok = (baselineLoaded || blockingIssues.length === 0) && !hardSafetyRegressionDetected && latencyRegressionWithinBudget && errorRegressionWithinBudget && blockingIssues.length === 0;

  return {
    ok,
    baselineLoaded,
    aggregateOnly: true,
    latencyRegressionWithinBudget,
    errorRegressionWithinBudget,
    safetyRegressionDetected,
    hardSafetyRegressionDetected,
    rawPrivateDataExposed: false,
    blockingIssues,
  };
}
