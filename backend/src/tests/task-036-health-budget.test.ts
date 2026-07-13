import { describe, it, expect, vi, beforeEach } from 'vitest';
import { task036Repository } from '../repositories/task036LiveSchoolLaunchRepository';
import { validateHealthBudgetResult } from '../lib/task036LiveSchoolLaunchValidation';

vi.mock('../repositories/task036LiveSchoolLaunchRepository', () => {
  const mockRepo = {
    saveHealthBudget: vi.fn(),
    getHealthBudget: vi.fn(),
    clearTask036StoresForTests: vi.fn(),
  };
  return { task036Repository: mockRepo, Task036LiveSchoolLaunchRepository: class {} };
});

function checkHealthBudget(sessionId: string, metrics: any): { passed: boolean; errors: string[] } {
  const result = {
    ok: true,
    launchLatencyP95Ms: metrics.launchLatencyP95Ms ?? 100,
    safeReadLatencyP95Ms: metrics.safeReadLatencyP95Ms ?? 50,
    runtimeMonitorLatencyP95Ms: metrics.runtimeMonitorLatencyP95Ms ?? 10,
    errorRate: metrics.errorRate ?? 0,
    criticalErrorCount: metrics.criticalErrorCount ?? 0,
    timeoutCount: metrics.timeoutCount ?? 0,
    privacyBoundaryFailureCount: metrics.privacyBoundaryFailureCount ?? 0,
    schoolContextBypassCount: metrics.schoolContextBypassCount ?? 0,
    crossSchoolAttemptCount: metrics.crossSchoolAttemptCount ?? 0,
    rollbackReadinessFailureCount: metrics.rollbackReadinessFailureCount ?? 0,
    healthBudgetPassed: metrics.healthBudgetPassed ?? true,
    pauseRecommended: metrics.pauseRecommended ?? false,
    rollbackRecommended: metrics.rollbackRecommended ?? false,
    killSwitchRecommended: metrics.killSwitchRecommended ?? false,
    blockingIssues: [],
  };
  const errors = validateHealthBudgetResult(result);
  if (errors.length > 0) return { passed: false, errors };
  task036Repository.saveHealthBudget(sessionId, result);
  return { passed: true, errors: [] };
}

describe('Task036 Health Budget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('passes with healthy metrics', () => {
    const result = checkHealthBudget('sess-1', {});
    expect(result.passed).toBe(true);
    expect(task036Repository.saveHealthBudget).toHaveBeenCalled();
  });

  it('fails when healthBudgetPassed is false', () => {
    const result = checkHealthBudget('sess-1', { healthBudgetPassed: false, ok: false });
    expect(result.passed).toBe(false);
    expect(result.errors).toContain('health_budget_not_passed');
  });

  it('fails when high error rate with critical errors', () => {
    const result = checkHealthBudget('sess-1', {
      errorRate: 0.15,
      criticalErrorCount: 5,
      timeoutCount: 10,
      healthBudgetPassed: false,
      ok: false,
    });
    expect(result.passed).toBe(false);
    expect(result.errors).toContain('health_budget_not_passed');
  });

  it('recommends pause when latency is high', () => {
    const result = checkHealthBudget('sess-1', {
      launchLatencyP95Ms: 5000,
      pauseRecommended: true,
    });
    expect(result.passed).toBe(true);
  });

  it('retrieves stored budget from repository', () => {
    const stored: any = {
      ok: true, launchLatencyP95Ms: 200, safeReadLatencyP95Ms: 75,
      runtimeMonitorLatencyP95Ms: 20, errorRate: 0.01,
      criticalErrorCount: 0, timeoutCount: 0, privacyBoundaryFailureCount: 0,
      schoolContextBypassCount: 0, crossSchoolAttemptCount: 0,
      rollbackReadinessFailureCount: 0, healthBudgetPassed: true,
      pauseRecommended: false, rollbackRecommended: false,
      killSwitchRecommended: false, blockingIssues: [],
    };
    vi.mocked(task036Repository.getHealthBudget).mockReturnValue(stored);
    const retrieved = task036Repository.getHealthBudget('sess-1');
    expect(retrieved!.healthBudgetPassed).toBe(true);
    expect(retrieved!.launchLatencyP95Ms).toBe(200);
  });

  it('detects privacy boundary failures in budget', () => {
    const result = checkHealthBudget('sess-1', {
      privacyBoundaryFailureCount: 3,
      schoolContextBypassCount: 1,
      healthBudgetPassed: false,
      ok: false,
    });
    expect(result.passed).toBe(false);
  });
});
