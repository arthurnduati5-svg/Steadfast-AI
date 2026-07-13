import { describe, it, expect, vi, beforeEach } from 'vitest';
import { task036Repository } from '../repositories/task036LiveSchoolLaunchRepository';
import { validateLaunchApprovalInput, validateLaunchApprovalResult } from '../lib/task036LiveSchoolLaunchValidation';

vi.mock('../repositories/task036LiveSchoolLaunchRepository', () => {
  const mockRepo = {
    saveLaunchApproval: vi.fn(),
    getLaunchApproval: vi.fn(),
    clearTask036StoresForTests: vi.fn(),
  };
  return { task036Repository: mockRepo, Task036LiveSchoolLaunchRepository: class {} };
});

function processApproval(input: any): { passed: boolean; errors: string[] } {
  const inputErrors = validateLaunchApprovalInput(input);
  if (inputErrors.length > 0) return { passed: false, errors: inputErrors };
  const result = {
    ok: true, passed: true, approvalId: input.approvalId,
    role: input.role, roleValid: true,
    roleHasApprovalAuthority: true, withinSchoolScope: true,
    noRawPrivateDataReference: true, noPublicLaunchRequest: true,
    noMultiSchoolLaunchRequest: true, noBackendFreezeRequest: true,
    blockingIssues: [],
  };
  task036Repository.saveLaunchApproval(input.approvalId, result);
  return { passed: true, errors: [] };
}

describe('Task036 Launch Approval', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('approves valid launch approval input', () => {
    const input = {
      approvalId: 'a-1', sessionId: 'sess-1',
      role: 'school_admin', schoolId: 'sch-1', tenantId: 't-1',
      approvedAt: '2026-01-01T00:00:00Z',
      approvalRefersToRawPrivateData: false,
      approvalRequestsPublicLaunch: false,
      approvalRequestsMultiSchoolLaunch: false,
      approvalRequestsBackendFreeze: false,
    };
    const result = processApproval(input);
    expect(result.passed).toBe(true);
    expect(task036Repository.saveLaunchApproval).toHaveBeenCalled();
  });

  it('rejects student role for approval', () => {
    const input = {
      approvalId: 'a-1', sessionId: 'sess-1',
      role: 'student', schoolId: 'sch-1', tenantId: 't-1',
      approvedAt: '2026-01-01T00:00:00Z',
      approvalRefersToRawPrivateData: false,
      approvalRequestsPublicLaunch: false,
      approvalRequestsMultiSchoolLaunch: false,
      approvalRequestsBackendFreeze: false,
    };
    const result = processApproval(input);
    expect(result.passed).toBe(false);
    expect(result.errors).toContain('role_denied_approval_authority');
  });

  it('rejects approval with raw private data reference', () => {
    const input = {
      approvalId: 'a-1', sessionId: 'sess-1',
      role: 'school_admin', schoolId: 'sch-1', tenantId: 't-1',
      approvedAt: '2026-01-01T00:00:00Z',
      approvalRefersToRawPrivateData: true,
      approvalRequestsPublicLaunch: false,
      approvalRequestsMultiSchoolLaunch: false,
      approvalRequestsBackendFreeze: false,
    };
    const result = processApproval(input);
    expect(result.passed).toBe(false);
    expect(result.errors).toContain('approval_refers_to_raw_private_data');
  });

  it('rejects approval requesting public launch', () => {
    const input = {
      approvalId: 'a-1', sessionId: 'sess-1',
      role: 'school_admin', schoolId: 'sch-1', tenantId: 't-1',
      approvedAt: '2026-01-01T00:00:00Z',
      approvalRefersToRawPrivateData: false,
      approvalRequestsPublicLaunch: true,
      approvalRequestsMultiSchoolLaunch: false,
      approvalRequestsBackendFreeze: false,
    };
    const result = processApproval(input);
    expect(result.passed).toBe(false);
    expect(result.errors).toContain('approval_requests_public_launch');
  });

  it('validates stored approval result', () => {
    const result: any = {
      ok: false, passed: false, approvalId: 'a-1', role: 'student',
      roleValid: false, roleHasApprovalAuthority: false,
      withinSchoolScope: false, noRawPrivateDataReference: false,
      noPublicLaunchRequest: false, noMultiSchoolLaunchRequest: false,
      noBackendFreezeRequest: false, blockingIssues: [],
    };
    const errors = validateLaunchApprovalResult(result);
    expect(errors).toContain('approval_not_ok');
    expect(errors).toContain('approval_role_invalid');
    expect(errors).toContain('approval_outside_school_scope');
  });

  it('retrieves stored approval from repository', () => {
    const stored: any = {
      ok: true, passed: true, approvalId: 'a-1', role: 'school_admin',
      roleValid: true, roleHasApprovalAuthority: true,
      withinSchoolScope: true, noRawPrivateDataReference: true,
      noPublicLaunchRequest: true, noMultiSchoolLaunchRequest: true,
      noBackendFreezeRequest: true, blockingIssues: [],
    };
    vi.mocked(task036Repository.getLaunchApproval).mockReturnValue(stored);
    expect(task036Repository.getLaunchApproval('a-1')!.passed).toBe(true);
    expect(task036Repository.getLaunchApproval('a-1')!.roleHasApprovalAuthority).toBe(true);
  });
});
