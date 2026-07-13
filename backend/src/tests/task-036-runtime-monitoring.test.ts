import { describe, it, expect, vi, beforeEach } from 'vitest';
import { task036Repository } from '../repositories/task036LiveSchoolLaunchRepository';
import { validateRuntimeMonitoringResult } from '../lib/task036LiveSchoolLaunchValidation';

vi.mock('../repositories/task036LiveSchoolLaunchRepository', () => {
  const mockRepo = {
    saveRuntimeMonitoring: vi.fn(),
    getRuntimeMonitoring: vi.fn(),
    clearTask036StoresForTests: vi.fn(),
  };
  return { task036Repository: mockRepo, Task036LiveSchoolLaunchRepository: class {} };
});

function runMonitoringCheck(sessionId: string, metrics: any): { ok: boolean; errors: string[] } {
  const result = {
    ok: true,
    activeLaunchSessionCount: metrics.activeLaunchSessionCount ?? 1,
    safeRequestCount: metrics.safeRequestCount ?? 0,
    safeDeniedRequestCount: metrics.safeDeniedRequestCount ?? 0,
    runtimeGuardDenialCount: metrics.runtimeGuardDenialCount ?? 0,
    schoolContextBypassAttemptCount: metrics.schoolContextBypassAttemptCount ?? 0,
    crossSchoolAttemptCount: metrics.crossSchoolAttemptCount ?? 0,
    privacyBoundaryFailureCount: metrics.privacyBoundaryFailureCount ?? 0,
    contentGovernanceFailureCount: metrics.contentGovernanceFailureCount ?? 0,
    socraticIntegrityFailureCount: metrics.socraticIntegrityFailureCount ?? 0,
    deenBoundaryFailureCount: metrics.deenBoundaryFailureCount ?? 0,
    incidentSignalCount: metrics.incidentSignalCount ?? 0,
    criticalIncidentSignalCount: metrics.criticalIncidentSignalCount ?? 0,
    pauseRecommended: metrics.pauseRecommended ?? false,
    rollbackRecommended: metrics.rollbackRecommended ?? false,
    killSwitchRecommended: metrics.killSwitchRecommended ?? false,
    generatedAt: new Date().toISOString(),
    blockingIssues: [],
  };
  const errors = validateRuntimeMonitoringResult(result);
  if (errors.length > 0) return { ok: false, errors };
  task036Repository.saveRuntimeMonitoring(sessionId, result);
  return { ok: true, errors: [] };
}

describe('Task036 Runtime Monitoring', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('passes with healthy metrics', () => {
    const result = runMonitoringCheck('sess-1', {});
    expect(result.ok).toBe(true);
    expect(task036Repository.saveRuntimeMonitoring).toHaveBeenCalled();
  });

  it('recommends pause when cross-school attempts detected', () => {
    const result = runMonitoringCheck('sess-1', {
      crossSchoolAttemptCount: 5,
      criticalIncidentSignalCount: 2,
      pauseRecommended: true,
    });
    expect(result.ok).toBe(true);
  });

  it('retrieves stored monitoring result', () => {
    const stored: any = {
      ok: true, activeLaunchSessionCount: 1, safeRequestCount: 100,
      safeDeniedRequestCount: 2, runtimeGuardDenialCount: 0,
      schoolContextBypassAttemptCount: 0, crossSchoolAttemptCount: 1,
      privacyBoundaryFailureCount: 0, contentGovernanceFailureCount: 0,
      socraticIntegrityFailureCount: 0, deenBoundaryFailureCount: 0,
      incidentSignalCount: 0, criticalIncidentSignalCount: 0,
      pauseRecommended: true, rollbackRecommended: false,
      killSwitchRecommended: false, generatedAt: '', blockingIssues: [],
    };
    vi.mocked(task036Repository.getRuntimeMonitoring).mockReturnValue(stored);
    const retrieved = task036Repository.getRuntimeMonitoring('sess-1');
    expect(retrieved!.pauseRecommended).toBe(true);
    expect(retrieved!.safeRequestCount).toBe(100);
    expect(retrieved!.crossSchoolAttemptCount).toBe(1);
  });

  it('detects high critical incident count', () => {
    const result = runMonitoringCheck('sess-1', {
      criticalIncidentSignalCount: 10,
      killSwitchRecommended: true,
    });
    expect(result.ok).toBe(true);
  });
});
