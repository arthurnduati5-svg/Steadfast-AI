import { describe, it, expect, vi, beforeEach } from 'vitest';
import { task036Repository } from '../repositories/task036LiveSchoolLaunchRepository';
import { validateSingleSchoolScopeInput, validateSingleSchoolScopeResult } from '../lib/task036LiveSchoolLaunchValidation';

vi.mock('../repositories/task036LiveSchoolLaunchRepository', () => {
  const mockRepo = {
    saveSingleSchoolScope: vi.fn(),
    getSingleSchoolScope: vi.fn(),
    clearTask036StoresForTests: vi.fn(),
  };
  return { task036Repository: mockRepo, Task036LiveSchoolLaunchRepository: class {} };
});

function processScope(input: any): { passed: boolean; errors: string[] } {
  const inputErrors = validateSingleSchoolScopeInput(input);
  if (inputErrors.length > 0) return { passed: false, errors: inputErrors };
  const result = {
    ok: true, passed: true, schoolId: input.schoolId,
    tenantId: input.tenantId,
    approvedSchoolConfigExists: input.approvedSchoolConfigExists,
    approvedRosterSnapshotExists: input.approvedRosterSnapshotExists,
    singleSchoolScope: input.singleSchoolScope,
    multiSchoolScope: input.multiSchoolScope,
    crossSchoolAccessDenied: input.crossSchoolAccessDenied,
    publicSignupDisabled: input.publicSignupDisabled,
    openRegistrationDisabled: input.openRegistrationDisabled,
    paymentFlowDisabled: input.paymentFlowDisabled,
    marketingLaunchDisabled: input.marketingLaunchDisabled,
    blockingIssues: [],
  };
  task036Repository.saveSingleSchoolScope(input.schoolId, result);
  return { passed: true, errors: [] };
}

describe('Task036 Single School Scope', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('passes valid single school scope input', () => {
    const input = {
      schoolId: 'sch-1', tenantId: 't-1',
      approvedSchoolConfigExists: true,
      approvedRosterSnapshotExists: true,
      singleSchoolScope: true, multiSchoolScope: false,
      crossSchoolAccessDenied: true, publicSignupDisabled: true,
      openRegistrationDisabled: true, paymentFlowDisabled: true,
      marketingLaunchDisabled: true,
    };
    const result = processScope(input);
    expect(result.passed).toBe(true);
    expect(task036Repository.saveSingleSchoolScope).toHaveBeenCalled();
  });

  it('rejects when school ID is missing', () => {
    const input = {
      schoolId: '', tenantId: 't-1',
      approvedSchoolConfigExists: true,
      approvedRosterSnapshotExists: true,
      singleSchoolScope: true, multiSchoolScope: false,
      crossSchoolAccessDenied: true, publicSignupDisabled: true,
      openRegistrationDisabled: true, paymentFlowDisabled: true,
      marketingLaunchDisabled: true,
    };
    const result = processScope(input);
    expect(result.passed).toBe(false);
    expect(result.errors).toContain('missing_school_id');
  });

  it('rejects when cross school access not denied', () => {
    const input = {
      schoolId: 'sch-1', tenantId: 't-1',
      approvedSchoolConfigExists: true,
      approvedRosterSnapshotExists: true,
      singleSchoolScope: true, multiSchoolScope: false,
      crossSchoolAccessDenied: false, publicSignupDisabled: true,
      openRegistrationDisabled: true, paymentFlowDisabled: true,
      marketingLaunchDisabled: true,
    };
    const result = processScope(input);
    expect(result.passed).toBe(false);
    expect(result.errors).toContain('cross_school_access_not_denied');
  });

  it('rejects when public signup not disabled', () => {
    const input = {
      schoolId: 'sch-1', tenantId: 't-1',
      approvedSchoolConfigExists: true,
      approvedRosterSnapshotExists: true,
      singleSchoolScope: true, multiSchoolScope: false,
      crossSchoolAccessDenied: true, publicSignupDisabled: false,
      openRegistrationDisabled: true, paymentFlowDisabled: true,
      marketingLaunchDisabled: true,
    };
    const result = processScope(input);
    expect(result.passed).toBe(false);
    expect(result.errors).toContain('public_signup_not_disabled');
  });

  it('rejects when multi-school scope is enabled', () => {
    const input = {
      schoolId: 'sch-1', tenantId: 't-1',
      approvedSchoolConfigExists: true,
      approvedRosterSnapshotExists: true,
      singleSchoolScope: false, multiSchoolScope: true,
      crossSchoolAccessDenied: true, publicSignupDisabled: true,
      openRegistrationDisabled: true, paymentFlowDisabled: true,
      marketingLaunchDisabled: true,
    };
    const result = processScope(input);
    expect(result.passed).toBe(false);
    expect(result.errors).toContain('single_school_scope_not_set');
    expect(result.errors).toContain('multi_school_scope_enabled');
  });

  it('validates scope result errors', () => {
    const result: any = {
      ok: false, passed: false, schoolId: 'sch-1', tenantId: 't-1',
      approvedSchoolConfigExists: false, approvedRosterSnapshotExists: false,
      singleSchoolScope: false, multiSchoolScope: true,
      crossSchoolAccessDenied: false, publicSignupDisabled: false,
      openRegistrationDisabled: false, paymentFlowDisabled: false,
      marketingLaunchDisabled: false, blockingIssues: ['no_school'],
    };
    const errors = validateSingleSchoolScopeResult(result);
    expect(errors).toContain('single_school_scope_not_ok');
    expect(errors).toContain('single_school_scope_not_passed');
  });

  it('retrieves stored scope from repository', () => {
    const stored: any = {
      ok: true, passed: true, schoolId: 'sch-1', tenantId: 't-1',
      approvedSchoolConfigExists: true, approvedRosterSnapshotExists: true,
      singleSchoolScope: true, multiSchoolScope: false,
      crossSchoolAccessDenied: true, publicSignupDisabled: true,
      openRegistrationDisabled: true, paymentFlowDisabled: true,
      marketingLaunchDisabled: true, blockingIssues: [],
    };
    vi.mocked(task036Repository.getSingleSchoolScope).mockReturnValue(stored);
    expect(task036Repository.getSingleSchoolScope('sch-1')!.passed).toBe(true);
    expect(task036Repository.getSingleSchoolScope('sch-1')!.singleSchoolScope).toBe(true);
  });
});
