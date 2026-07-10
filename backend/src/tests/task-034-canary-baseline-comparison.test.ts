import { describe, it, expect } from 'vitest';
import { compareWithCanaryBaseline } from '../services/task034CanaryBaselineComparisonService';

describe('Task034CanaryBaselineComparison', () => {
  it('should pass with safe metrics within budget', () => {
    const result = compareWithCanaryBaseline({
      p95LatencyMs: 1200,
      errorRatePercent: 0.1,
      privacyLeakCount: 0,
      schoolAuthBypassCount: 0,
      rolloutMembershipBypassCount: 0,
    });

    expect(result.ok).toBe(true);
    expect(result.aggregateOnly).toBe(true);
    expect(result.latencyRegressionWithinBudget).toBe(true);
    expect(result.errorRegressionWithinBudget).toBe(true);
    expect(result.safetyRegressionDetected).toBe(false);
    expect(result.hardSafetyRegressionDetected).toBe(false);
    expect(result.rawPrivateDataExposed).toBe(false);
  });

  it('should detect hard safety regression with privacy leak', () => {
    const result = compareWithCanaryBaseline({
      p95LatencyMs: 500,
      errorRatePercent: 0.1,
      privacyLeakCount: 1,
      schoolAuthBypassCount: 0,
      rolloutMembershipBypassCount: 0,
    });

    expect(result.ok).toBe(false);
    expect(result.hardSafetyRegressionDetected).toBe(true);
    expect(result.blockingIssues).toContain('HARD_SAFETY_REGRESSION_DETECTED');
  });

  it('should detect latency regression', () => {
    const result = compareWithCanaryBaseline({
      p95LatencyMs: 3000,
      errorRatePercent: 0.1,
      privacyLeakCount: 0,
      schoolAuthBypassCount: 0,
      rolloutMembershipBypassCount: 0,
    });

    expect(result.latencyRegressionWithinBudget).toBe(false);
    expect(result.ok).toBe(false);
  });
});
