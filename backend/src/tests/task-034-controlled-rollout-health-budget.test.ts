import { describe, it, expect } from 'vitest';
import { evaluateHealthBudget } from '../services/task034ControlledRolloutHealthBudgetService';

describe('Task034ControlledRolloutHealthBudget', () => {
  it('should pass with all budgets within limits', () => {
    const result = evaluateHealthBudget({
      p95LatencyMs: 1200,
      errorRatePercent: 0.1,
      privacyLeakCount: 0,
      schoolAuthBypassCount: 0,
      rolloutMembershipBypassCount: 0,
      socraticBypassCount: 0,
      deenBypassCount: 0,
      curriculumBypassCount: 0,
      unhandledSafeguardingCount: 0,
      openRolloutCount: 0,
      schoolWideRolloutCount: 0,
      hundredPercentRolloutCount: 0,
    });

    expect(result.ok).toBe(true);
    expect(result.overallPassed).toBe(true);
    expect(result.blockingIssues).toEqual([]);
  });

  it('should fail when latency exceeds budget', () => {
    const result = evaluateHealthBudget({
      p95LatencyMs: 5000,
      errorRatePercent: 0.1,
      privacyLeakCount: 0,
      schoolAuthBypassCount: 0,
      rolloutMembershipBypassCount: 0,
      socraticBypassCount: 0,
      deenBypassCount: 0,
      curriculumBypassCount: 0,
      unhandledSafeguardingCount: 0,
      openRolloutCount: 0,
      schoolWideRolloutCount: 0,
      hundredPercentRolloutCount: 0,
    });

    expect(result.overallPassed).toBe(false);
    expect(result.latencyBudgetPassed).toBe(false);
  });

  it('should fail when privacy leak detected', () => {
    const result = evaluateHealthBudget({
      p95LatencyMs: 500,
      errorRatePercent: 0.1,
      privacyLeakCount: 1,
      schoolAuthBypassCount: 0,
      rolloutMembershipBypassCount: 0,
      socraticBypassCount: 0,
      deenBypassCount: 0,
      curriculumBypassCount: 0,
      unhandledSafeguardingCount: 0,
      openRolloutCount: 0,
      schoolWideRolloutCount: 0,
      hundredPercentRolloutCount: 0,
    });

    expect(result.overallPassed).toBe(false);
    expect(result.privacyBudgetPassed).toBe(false);
  });

  it('should fail when school auth bypass detected', () => {
    const result = evaluateHealthBudget({
      p95LatencyMs: 500,
      errorRatePercent: 0.1,
      privacyLeakCount: 0,
      schoolAuthBypassCount: 1,
      rolloutMembershipBypassCount: 0,
      socraticBypassCount: 0,
      deenBypassCount: 0,
      curriculumBypassCount: 0,
      unhandledSafeguardingCount: 0,
      openRolloutCount: 0,
      schoolWideRolloutCount: 0,
      hundredPercentRolloutCount: 0,
    });

    expect(result.overallPassed).toBe(false);
  });

  it('should fail when open rollout detected', () => {
    const result = evaluateHealthBudget({
      p95LatencyMs: 500,
      errorRatePercent: 0.1,
      privacyLeakCount: 0,
      schoolAuthBypassCount: 0,
      rolloutMembershipBypassCount: 0,
      socraticBypassCount: 0,
      deenBypassCount: 0,
      curriculumBypassCount: 0,
      unhandledSafeguardingCount: 0,
      openRolloutCount: 1,
      schoolWideRolloutCount: 0,
      hundredPercentRolloutCount: 0,
    });

    expect(result.overallPassed).toBe(false);
  });
});
