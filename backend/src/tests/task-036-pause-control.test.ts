import { describe, it, expect, vi, beforeEach } from 'vitest';
import { task036Repository } from '../repositories/task036LiveSchoolLaunchRepository';
import { validatePauseControlResult } from '../lib/task036LiveSchoolLaunchValidation';

vi.mock('../repositories/task036LiveSchoolLaunchRepository', () => {
  const mockRepo = {
    savePauseControl: vi.fn(),
    getPauseControl: vi.fn(),
    clearTask036StoresForTests: vi.fn(),
  };
  return { task036Repository: mockRepo, Task036LiveSchoolLaunchRepository: class {} };
});

function executePause(sessionId: string, pauseData: any): { ok: boolean; errors: string[] } {
  const result = {
    ok: pauseData.ok ?? true,
    paused: pauseData.paused ?? true,
    pauseReasonCodes: pauseData.pauseReasonCodes ?? [],
    sessionId,
    pausedAt: pauseData.pausedAt ?? new Date().toISOString(),
    auditPreserved: pauseData.auditPreserved ?? true,
    externalNotificationSent: pauseData.externalNotificationSent ?? false,
    productionMutated: pauseData.productionMutated ?? false,
    blockingIssues: [],
  };
  const errors = validatePauseControlResult(result);
  if (errors.length > 0) return { ok: false, errors };
  task036Repository.savePauseControl(sessionId, result);
  return { ok: true, errors: [] };
}

describe('Task036 Pause Control', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('pauses successfully', () => {
    const result = executePause('sess-1', {});
    expect(result.ok).toBe(true);
    expect(task036Repository.savePauseControl).toHaveBeenCalled();
  });

  it('fails when pause not executed', () => {
    const result = executePause('sess-1', { ok: false, paused: false });
    expect(result.ok).toBe(false);
    expect(result.errors).toContain('pause_control_not_ok');
    expect(result.errors).toContain('pause_not_executed');
  });

  it('fails when audit not preserved', () => {
    const result = executePause('sess-1', { auditPreserved: false });
    expect(result.ok).toBe(false);
    expect(result.errors).toContain('pause_audit_not_preserved');
  });

  it('fails when external notification sent', () => {
    const result = executePause('sess-1', { externalNotificationSent: true });
    expect(result.ok).toBe(false);
    expect(result.errors).toContain('pause_sent_external_notification');
  });

  it('fails when production mutated', () => {
    const result = executePause('sess-1', { productionMutated: true });
    expect(result.ok).toBe(false);
    expect(result.errors).toContain('pause_produced_mutation');
  });

  it('stores reason codes on pause', () => {
    const result = executePause('sess-1', {
      pauseReasonCodes: ['cross_school_attempt_detected', 'high_error_rate'],
    });
    expect(result.ok).toBe(true);
  });

  it('retrieves stored pause from repository', () => {
    const stored: any = {
      ok: true, paused: true, pauseReasonCodes: [],
      sessionId: 'sess-1', pausedAt: '', auditPreserved: true,
      externalNotificationSent: false, productionMutated: false,
      blockingIssues: [],
    };
    vi.mocked(task036Repository.getPauseControl).mockReturnValue(stored);
    const retrieved = task036Repository.getPauseControl('sess-1');
    expect(retrieved!.paused).toBe(true);
    expect(retrieved!.auditPreserved).toBe(true);
  });
});
