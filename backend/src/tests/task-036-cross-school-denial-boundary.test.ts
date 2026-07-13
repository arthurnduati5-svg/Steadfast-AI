import { describe, it, expect, vi, beforeEach } from 'vitest';
import { task036Repository } from '../repositories/task036LiveSchoolLaunchRepository';
import { validateCrossSchoolDenialResult, validateSingleSchoolScopeInput } from '../lib/task036LiveSchoolLaunchValidation';

vi.mock('../repositories/task036LiveSchoolLaunchRepository', () => {
  const mockRepo = {
    saveCrossSchoolDenial: vi.fn(),
    getCrossSchoolDenial: vi.fn(),
    saveSingleSchoolScope: vi.fn(),
    getSingleSchoolScope: vi.fn(),
    clearTask036StoresForTests: vi.fn(),
  };
  return { task036Repository: mockRepo, Task036LiveSchoolLaunchRepository: class {} };
});

describe('Task036 Cross School Denial Boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('validates cross school denial result requires all denials', () => {
    const errors = validateCrossSchoolDenialResult({
      ok: false, passed: false,
      crossSchoolAccessDenied: false, crossLearnerVisibilityDenied: false,
      parentRawDetailDenied: false, unknownSchoolBlocked: false,
      tenantMismatchBlocked: false, blockingIssues: [],
    });
    expect(errors.length).toBe(7);
  });

  it('single school scope requires cross school access denied', () => {
    const errors = validateSingleSchoolScopeInput({
      schoolId: 's-1', tenantId: 't-1',
      approvedSchoolConfigExists: true, approvedRosterSnapshotExists: true,
      singleSchoolScope: true, multiSchoolScope: false,
      crossSchoolAccessDenied: false, publicSignupDisabled: true,
      openRegistrationDisabled: true, paymentFlowDisabled: true,
      marketingLaunchDisabled: true,
    });
    expect(errors).toContain('cross_school_access_not_denied');
  });

  it('cross school denial saves and retrieves from repository', () => {
    const result: any = {
      ok: true, passed: true, crossSchoolAccessDenied: true,
      crossLearnerVisibilityDenied: true, parentRawDetailDenied: true,
      unknownSchoolBlocked: true, tenantMismatchBlocked: true,
      blockingIssues: [],
    };
    task036Repository.saveCrossSchoolDenial('sess-1', result);
    expect(task036Repository.saveCrossSchoolDenial).toHaveBeenCalledWith('sess-1', result);
  });

  it('retrieved cross school denial matches expectations', () => {
    const stored: any = {
      ok: true, passed: true, crossSchoolAccessDenied: true,
      crossLearnerVisibilityDenied: true, parentRawDetailDenied: true,
      unknownSchoolBlocked: true, tenantMismatchBlocked: true,
      blockingIssues: [],
    };
    vi.mocked(task036Repository.getCrossSchoolDenial).mockReturnValue(stored);
    const retrieved = task036Repository.getCrossSchoolDenial('sess-1');
    expect(retrieved!.crossSchoolAccessDenied).toBe(true);
    expect(retrieved!.parentRawDetailDenied).toBe(true);
    expect(retrieved!.tenantMismatchBlocked).toBe(true);
  });

  it('valid scope input passes cross school denial requirement', () => {
    const errors = validateSingleSchoolScopeInput({
      schoolId: 's-1', tenantId: 't-1',
      approvedSchoolConfigExists: true, approvedRosterSnapshotExists: true,
      singleSchoolScope: true, multiSchoolScope: false,
      crossSchoolAccessDenied: true, publicSignupDisabled: true,
      openRegistrationDisabled: true, paymentFlowDisabled: true,
      marketingLaunchDisabled: true,
    });
    expect(errors).not.toContain('cross_school_access_not_denied');
  });

  it('multi-school scope is rejected by single school scope validation', () => {
    const errors = validateSingleSchoolScopeInput({
      schoolId: 's-1', tenantId: 't-1',
      approvedSchoolConfigExists: true, approvedRosterSnapshotExists: true,
      singleSchoolScope: false, multiSchoolScope: true,
      crossSchoolAccessDenied: true, publicSignupDisabled: true,
      openRegistrationDisabled: true, paymentFlowDisabled: true,
      marketingLaunchDisabled: true,
    });
    expect(errors).toContain('single_school_scope_not_set');
    expect(errors).toContain('multi_school_scope_enabled');
  });
});
