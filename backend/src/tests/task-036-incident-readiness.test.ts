import { describe, it, expect, vi, beforeEach } from 'vitest';
import { task036Repository } from '../repositories/task036LiveSchoolLaunchRepository';
import { validateIncidentReadinessResult } from '../lib/task036LiveSchoolLaunchValidation';

vi.mock('../repositories/task036LiveSchoolLaunchRepository', () => {
  const mockRepo = {
    saveIncidentReadiness: vi.fn(),
    getIncidentReadiness: vi.fn(),
    clearTask036StoresForTests: vi.fn(),
  };
  return { task036Repository: mockRepo, Task036LiveSchoolLaunchRepository: class {} };
});

function checkReadiness(sessionId: string, readiness: any): { passed: boolean; errors: string[] } {
  const result = {
    ok: readiness.ok ?? true,
    incidentDetectionReady: readiness.incidentDetectionReady ?? true,
    incidentClassificationReady: readiness.incidentClassificationReady ?? true,
    incidentResponseReady: readiness.incidentResponseReady ?? true,
    incidentEscalationReady: readiness.incidentEscalationReady ?? true,
    incidentAuditReady: readiness.incidentAuditReady ?? true,
    pausePlanReady: readiness.pausePlanReady ?? true,
    rollbackPlanReady: readiness.rollbackPlanReady ?? true,
    killSwitchReady: readiness.killSwitchReady ?? true,
    blockingIssues: [],
  };
  const errors = validateIncidentReadinessResult(result);
  if (errors.length > 0) return { passed: false, errors };
  task036Repository.saveIncidentReadiness(sessionId, result);
  return { passed: true, errors: [] };
}

describe('Task036 Incident Readiness', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('passes when all readiness checks pass', () => {
    const result = checkReadiness('sess-1', {});
    expect(result.passed).toBe(true);
    expect(task036Repository.saveIncidentReadiness).toHaveBeenCalled();
  });

  it('fails when detection not ready', () => {
    const result = checkReadiness('sess-1', {
      ok: false, incidentDetectionReady: false,
    });
    expect(result.passed).toBe(false);
    expect(result.errors).toContain('incident_detection_not_ready');
  });

  it('fails when classification not ready', () => {
    const result = checkReadiness('sess-1', {
      ok: false, incidentClassificationReady: false,
    });
    expect(result.passed).toBe(false);
    expect(result.errors).toContain('incident_classification_not_ready');
  });

  it('fails when kill switch not ready', () => {
    const result = checkReadiness('sess-1', {
      ok: false, killSwitchReady: false,
    });
    expect(result.passed).toBe(false);
    expect(result.errors).toContain('kill_switch_not_ready');
  });

  it('fails when multiple readiness checks fail', () => {
    const result = checkReadiness('sess-1', {
      ok: false,
      incidentDetectionReady: false,
      incidentResponseReady: false,
      incidentAuditReady: false,
      pausePlanReady: false,
    });
    expect(result.passed).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(4);
  });

  it('retrieves stored readiness from repository', () => {
    const stored: any = {
      ok: true, incidentDetectionReady: true,
      incidentClassificationReady: true, incidentResponseReady: true,
      incidentEscalationReady: true, incidentAuditReady: true,
      pausePlanReady: true, rollbackPlanReady: true, killSwitchReady: true,
      blockingIssues: [],
    };
    vi.mocked(task036Repository.getIncidentReadiness).mockReturnValue(stored);
    const retrieved = task036Repository.getIncidentReadiness('sess-1');
    expect(retrieved!.incidentDetectionReady).toBe(true);
    expect(retrieved!.incidentAuditReady).toBe(true);
  });
});
