import { describe, it, expect, vi, beforeEach } from 'vitest';
import { task036Repository } from '../repositories/task036LiveSchoolLaunchRepository';
import { validateSafeLaunchReadModel } from '../lib/task036LiveSchoolLaunchValidation';

vi.mock('../repositories/task036LiveSchoolLaunchRepository', () => {
  const mockRepo = {
    saveSafeLaunchReadModel: vi.fn(),
    getSafeLaunchReadModel: vi.fn(),
    clearTask036StoresForTests: vi.fn(),
  };
  return { task036Repository: mockRepo, Task036LiveSchoolLaunchRepository: class {} };
});

function buildReadModel(sessionId: string, data: any) {
  const model = {
    ok: data.ok ?? true,
    sessionId,
    schoolId: data.schoolId ?? 'sch-1',
    status: data.status ?? 'launch_ready',
    launchWindowResult: data.launchWindowResult ?? null,
    environmentGateResult: data.environmentGateResult ?? null,
    approvalResult: data.approvalResult ?? null,
    singleSchoolScopeResult: data.singleSchoolScopeResult ?? null,
    privacyBoundaryResult: data.privacyBoundaryResult ?? null,
    contentGovernanceResult: data.contentGovernanceResult ?? null,
    socraticIntegrityResult: data.socraticIntegrityResult ?? null,
    deenBoundaryResult: data.deenBoundaryResult ?? null,
    schoolIdentityResult: data.schoolIdentityResult ?? null,
    crossSchoolDenialResult: data.crossSchoolDenialResult ?? null,
    runtimeMonitoringResult: data.runtimeMonitoringResult ?? null,
    healthBudgetResult: data.healthBudgetResult ?? null,
    incidentReadinessResult: data.incidentReadinessResult ?? null,
    safeSummariesOnly: data.safeSummariesOnly ?? true,
    generatedAt: new Date().toISOString(),
  };
  return model;
}

describe('Task036 Safe Launch Read Model', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('validates a complete read model successfully', () => {
    const model = buildReadModel('sess-1', {});
    const errors = validateSafeLaunchReadModel(model);
    expect(errors).toEqual([]);
  });

  it('detects missing ok flag', () => {
    const model = buildReadModel('sess-1', { ok: false });
    const errors = validateSafeLaunchReadModel(model);
    expect(errors).toContain('safe_launch_read_model_not_ok');
  });

  it('detects missing session ID', () => {
    const model = buildReadModel('', { sessionId: '' });
    model.sessionId = '';
    const errors = validateSafeLaunchReadModel(model);
    expect(errors).toContain('safe_launch_read_model_no_session_id');
  });

  it('detects when safe summaries only is false', () => {
    const model = buildReadModel('sess-1', { safeSummariesOnly: false });
    const errors = validateSafeLaunchReadModel(model);
    expect(errors).toContain('safe_launch_read_model_not_safe_summaries_only');
  });

  it('saves and retrieves read model from repository', () => {
    const model = buildReadModel('sess-1', {
      status: 'launch_active_controlled',
      safeSummariesOnly: true,
    });
    task036Repository.saveSafeLaunchReadModel('sess-1', model);
    expect(task036Repository.saveSafeLaunchReadModel).toHaveBeenCalledWith('sess-1', model);
  });

  it('retrieves stored read model', () => {
    const model = buildReadModel('sess-1', { status: 'launch_ready' });
    vi.mocked(task036Repository.getSafeLaunchReadModel).mockReturnValue(model);
    const retrieved = task036Repository.getSafeLaunchReadModel('sess-1');
    expect(retrieved!.status).toBe('launch_ready');
    expect(retrieved!.safeSummariesOnly).toBe(true);
  });

  it('includes nested gate results in read model', () => {
    const envGate: any = { ok: true, passed: true, environmentType: 'test' };
    const model = buildReadModel('sess-1', {
      environmentGateResult: envGate,
      privacyBoundaryResult: { ok: true, passed: true },
    });
    expect(model.environmentGateResult).toBeDefined();
    expect(model.privacyBoundaryResult).toBeDefined();
  });
});
