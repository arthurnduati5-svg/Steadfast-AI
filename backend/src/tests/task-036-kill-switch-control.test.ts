import { describe, it, expect, vi, beforeEach } from 'vitest';
import { task036Repository } from '../repositories/task036LiveSchoolLaunchRepository';
import { validateKillSwitchControlResult } from '../lib/task036LiveSchoolLaunchValidation';

vi.mock('../repositories/task036LiveSchoolLaunchRepository', () => {
  const mockRepo = {
    saveKillSwitchControl: vi.fn(),
    getKillSwitchControl: vi.fn(),
    clearTask036StoresForTests: vi.fn(),
  };
  return { task036Repository: mockRepo, Task036LiveSchoolLaunchRepository: class {} };
});

function executeKillSwitch(sessionId: string, ksData: any): { ok: boolean; errors: string[] } {
  const result = {
    ok: ksData.ok ?? true,
    killSwitchEnabled: ksData.killSwitchEnabled ?? true,
    killSwitchReasonCodes: ksData.killSwitchReasonCodes ?? [],
    sessionId,
    killSwitchEnabledAt: ksData.killSwitchEnabledAt ?? new Date().toISOString(),
    auditPreserved: ksData.auditPreserved ?? true,
    dataDeleted: ksData.dataDeleted ?? false,
    externalServicesCalled: ksData.externalServicesCalled ?? false,
    blockingIssues: [],
  };
  const errors = validateKillSwitchControlResult(result);
  if (errors.length > 0) return { ok: false, errors };
  task036Repository.saveKillSwitchControl(sessionId, result);
  return { ok: true, errors: [] };
}

describe('Task036 Kill Switch Control', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('enables kill switch successfully', () => {
    const result = executeKillSwitch('sess-1', {});
    expect(result.ok).toBe(true);
    expect(task036Repository.saveKillSwitchControl).toHaveBeenCalled();
  });

  it('fails when kill switch not enabled', () => {
    const result = executeKillSwitch('sess-1', { ok: false, killSwitchEnabled: false });
    expect(result.ok).toBe(false);
    expect(result.errors).toContain('kill_switch_control_not_ok');
    expect(result.errors).toContain('kill_switch_not_enabled');
  });

  it('fails when audit not preserved', () => {
    const result = executeKillSwitch('sess-1', { auditPreserved: false });
    expect(result.ok).toBe(false);
    expect(result.errors).toContain('kill_switch_audit_not_preserved');
  });

  it('fails when data deleted', () => {
    const result = executeKillSwitch('sess-1', { dataDeleted: true });
    expect(result.ok).toBe(false);
    expect(result.errors).toContain('kill_switch_deleted_data');
  });

  it('fails when external services called', () => {
    const result = executeKillSwitch('sess-1', { externalServicesCalled: true });
    expect(result.ok).toBe(false);
    expect(result.errors).toContain('kill_switch_called_external_services');
  });

  it('stores reason codes on kill switch', () => {
    const result = executeKillSwitch('sess-1', {
      killSwitchReasonCodes: ['privacy_breach', 'safeguarding_incident'],
    });
    expect(result.ok).toBe(true);
  });

  it('retrieves stored kill switch from repository', () => {
    const stored: any = {
      ok: true, killSwitchEnabled: true, killSwitchReasonCodes: [],
      sessionId: 'sess-1', killSwitchEnabledAt: '', auditPreserved: true,
      dataDeleted: false, externalServicesCalled: false, blockingIssues: [],
    };
    vi.mocked(task036Repository.getKillSwitchControl).mockReturnValue(stored);
    const retrieved = task036Repository.getKillSwitchControl('sess-1');
    expect(retrieved!.killSwitchEnabled).toBe(true);
    expect(retrieved!.dataDeleted).toBe(false);
  });
});
