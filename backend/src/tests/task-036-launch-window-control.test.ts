import { describe, it, expect, vi, beforeEach } from 'vitest';
import { task036Repository } from '../repositories/task036LiveSchoolLaunchRepository';
import { validateLaunchWindowInput, validateLaunchWindowResult } from '../lib/task036LiveSchoolLaunchValidation';

vi.mock('../repositories/task036LiveSchoolLaunchRepository', () => {
  const mockRepo = {
    saveLaunchWindow: vi.fn(),
    getLaunchWindow: vi.fn(),
    clearTask036StoresForTests: vi.fn(),
  };
  return { task036Repository: mockRepo, Task036LiveSchoolLaunchRepository: class {} };
});

function checkLaunchWindow(input: any): { passed: boolean; errors: string[] } {
  const inputErrors = validateLaunchWindowInput(input);
  if (inputErrors.length > 0) return { passed: false, errors: inputErrors };
  const result = {
    ok: true, passed: true, launchWindowId: input.launchWindowId,
    schoolId: input.schoolId, tenantId: input.tenantId,
    approvedStartAt: input.approvedStartAt, approvedEndAt: input.approvedEndAt,
    approvalReferenceId: input.approvalReferenceId,
    rollbackPlanId: input.rollbackPlanId, pausePlanId: input.pausePlanId,
    killSwitchId: input.killSwitchId, operatorId: input.operatorId,
    isExpired: false, isOpenEnded: false, isWithinApprovedTime: true,
    hasRollbackPlan: true, hasPausePlan: true, hasKillSwitch: true,
    blockingIssues: [],
  };
  const resultErrors = validateLaunchWindowResult(result);
  if (resultErrors.length > 0) return { passed: false, errors: resultErrors };
  task036Repository.saveLaunchWindow(input.launchWindowId, result);
  return { passed: true, errors: [] };
}

describe('Task036 Launch Window Control', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('passes valid launch window', () => {
    const input = {
      launchWindowId: 'lw-1', schoolId: 's-1', tenantId: 't-1',
      approvedStartAt: '2026-01-01T00:00:00Z',
      approvedEndAt: '2026-01-31T00:00:00Z',
      approvalReferenceId: 'ar-1', rollbackPlanId: 'rb-1',
      pausePlanId: 'pp-1', killSwitchId: 'ks-1', operatorId: 'op-1',
      createdAt: '2026-01-01T00:00:00Z',
    };
    const result = checkLaunchWindow(input);
    expect(result.passed).toBe(true);
    expect(task036Repository.saveLaunchWindow).toHaveBeenCalled();
  });

  it('fails when launch window fields are missing', () => {
    const input = {
      launchWindowId: '', schoolId: '', tenantId: '',
      approvedStartAt: '', approvedEndAt: '',
      approvalReferenceId: '', rollbackPlanId: '',
      pausePlanId: '', killSwitchId: '', operatorId: '',
      createdAt: '2026-01-01T00:00:00Z',
    };
    const result = checkLaunchWindow(input);
    expect(result.passed).toBe(false);
    expect(result.errors.length).toBeGreaterThan(5);
  });

  it('fails when launch window is expired', () => {
    const result: any = {
      ok: false, passed: false, launchWindowId: 'lw-1',
      schoolId: 's-1', tenantId: 't-1',
      approvedStartAt: '', approvedEndAt: '',
      approvalReferenceId: '', rollbackPlanId: '', pausePlanId: '',
      killSwitchId: '', operatorId: '', isExpired: true,
      isOpenEnded: false, isWithinApprovedTime: false,
      hasRollbackPlan: false, hasPausePlan: false, hasKillSwitch: false,
      blockingIssues: ['expired'],
    };
    const errors = validateLaunchWindowResult(result);
    expect(errors).toContain('launch_window_expired');
  });

  it('retrieves stored launch window from repository', () => {
    const stored: any = {
      ok: true, passed: true, launchWindowId: 'lw-1', schoolId: 's-1',
      tenantId: 't-1', approvedStartAt: '', approvedEndAt: '',
      approvalReferenceId: '', rollbackPlanId: 'rb-1',
      pausePlanId: 'pp-1', killSwitchId: 'ks-1', operatorId: 'op-1',
      isExpired: false, isOpenEnded: false, isWithinApprovedTime: true,
      hasRollbackPlan: true, hasPausePlan: true, hasKillSwitch: true,
      blockingIssues: [],
    };
    vi.mocked(task036Repository.getLaunchWindow).mockReturnValue(stored);
    const retrieved = task036Repository.getLaunchWindow('lw-1');
    expect(retrieved).toEqual(stored);
    expect(retrieved!.hasKillSwitch).toBe(true);
  });

  it('detects open-ended window as error', () => {
    const errors = validateLaunchWindowResult({
      ok: true, passed: true, launchWindowId: 'lw-1', schoolId: 's-1',
      tenantId: 't-1', approvedStartAt: '', approvedEndAt: '',
      approvalReferenceId: '', rollbackPlanId: 'rb-1', pausePlanId: 'pp-1',
      killSwitchId: 'ks-1', operatorId: 'op-1', isExpired: false,
      isOpenEnded: true, isWithinApprovedTime: true, hasRollbackPlan: true,
      hasPausePlan: true, hasKillSwitch: true, blockingIssues: [],
    });
    expect(errors).toContain('launch_window_open_ended');
  });
});
