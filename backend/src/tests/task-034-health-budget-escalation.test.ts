import { describe, it, expect } from 'vitest';
import { evaluateTask034HealthBudget } from '../services/task034HealthBudgetEscalationService';

function validMetrics() {
  return {
    rolloutLatencyP95Ms: 100,
    safeReadLatencyP95Ms: 100,
    eventIntakeLatencyP95Ms: 100,
    errorRate: 0.5,
    criticalErrorCount: 0,
    timeoutCount: 0,
    privacyBoundaryFailureCount: 0,
    schoolContextBypassCount: 0,
    crossSchoolAttemptCount: 0,
    runtimeGuardDenialCount: 0,
    rollbackReadinessFailureCount: 0,
  };
}

describe('Task034 Health Budget Escalation', () => {
  it('Valid metrics with low latency and error rate pass', () => {
    const result = evaluateTask034HealthBudget(validMetrics());
    expect(result.ok).toBe(true);
    expect(result.healthBudgetPassed).toBe(true);
    expect(result.escalationRequired).toBe(false);
    expect(result.pauseRecommended).toBe(false);
  });

  it('High rollout latency (> 2500ms) fails', () => {
    const metrics = validMetrics();
    metrics.rolloutLatencyP95Ms = 3000;
    const result = evaluateTask034HealthBudget(metrics);
    expect(result.ok).toBe(false);
    expect(result.healthBudgetPassed).toBe(false);
    expect(result.blockingIssues).toContain('rollout_latency_p95_exceeded');
  });

  it('High safeReadLatency (> 2500ms) fails', () => {
    const metrics = validMetrics();
    metrics.safeReadLatencyP95Ms = 3000;
    const result = evaluateTask034HealthBudget(metrics);
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('safe_read_latency_p95_exceeded');
  });

  it('High error rate (> 1%) fails', () => {
    const metrics = validMetrics();
    metrics.errorRate = 5;
    const result = evaluateTask034HealthBudget(metrics);
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('error_rate_exceeded');
  });

  it('Critical errors detected fails', () => {
    const metrics = validMetrics();
    metrics.criticalErrorCount = 1;
    const result = evaluateTask034HealthBudget(metrics);
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('critical_errors_detected');
  });

  it('Timeouts detected fails', () => {
    const metrics = validMetrics();
    metrics.timeoutCount = 1;
    const result = evaluateTask034HealthBudget(metrics);
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('timeouts_detected');
  });

  it('Privacy boundary failures detected fails', () => {
    const metrics = validMetrics();
    metrics.privacyBoundaryFailureCount = 1;
    const result = evaluateTask034HealthBudget(metrics);
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('privacy_boundary_failures_detected');
  });

  it('School context bypass detected fails', () => {
    const metrics = validMetrics();
    metrics.schoolContextBypassCount = 1;
    const result = evaluateTask034HealthBudget(metrics);
    expect(result.ok).toBe(false);
  });

  it('Cross school attempts detected fails', () => {
    const metrics = validMetrics();
    metrics.crossSchoolAttemptCount = 1;
    const result = evaluateTask034HealthBudget(metrics);
    expect(result.ok).toBe(false);
  });

  it('Runtime guard denials detected fails', () => {
    const metrics = validMetrics();
    metrics.runtimeGuardDenialCount = 1;
    const result = evaluateTask034HealthBudget(metrics);
    expect(result.ok).toBe(false);
  });

  it('Rollback readiness failures detected fails', () => {
    const metrics = validMetrics();
    metrics.rollbackReadinessFailureCount = 1;
    const result = evaluateTask034HealthBudget(metrics);
    expect(result.ok).toBe(false);
  });

  it('escalationRequired is true when budget fails', () => {
    const metrics = validMetrics();
    metrics.errorRate = 10;
    const result = evaluateTask034HealthBudget(metrics);
    expect(result.escalationRequired).toBe(true);
    expect(result.pauseRecommended).toBe(true);
  });

  it('rollbackRecommended when criticalErrors > 0', () => {
    const metrics = validMetrics();
    metrics.criticalErrorCount = 1;
    const result = evaluateTask034HealthBudget(metrics);
    expect(result.rollbackRecommended).toBe(true);
  });

  it('killSwitchRecommended when both criticalErrors and privacy failures', () => {
    const metrics = validMetrics();
    metrics.criticalErrorCount = 1;
    metrics.privacyBoundaryFailureCount = 1;
    const result = evaluateTask034HealthBudget(metrics);
    expect(result.killSwitchRecommended).toBe(true);
  });
});
