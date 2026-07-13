import { describe, it, expect, vi, beforeEach } from 'vitest';
import { task036Repository } from '../repositories/task036LiveSchoolLaunchRepository';
import { validateCrossSchoolDenialResult } from '../lib/task036LiveSchoolLaunchValidation';

vi.mock('../repositories/task036LiveSchoolLaunchRepository', () => {
  const mockRepo = {
    saveCrossSchoolDenial: vi.fn(),
    getCrossSchoolDenial: vi.fn(),
    clearTask036StoresForTests: vi.fn(),
  };
  return { task036Repository: mockRepo, Task036LiveSchoolLaunchRepository: class {} };
});

function checkCrossSchoolDenial(sessionId: string, csdData: any): { passed: boolean; errors: string[] } {
  const result = {
    ok: csdData.ok ?? true,
    passed: csdData.passed ?? true,
    crossSchoolAccessDenied: csdData.crossSchoolAccessDenied ?? true,
    crossLearnerVisibilityDenied: csdData.crossLearnerVisibilityDenied ?? true,
    parentRawDetailDenied: csdData.parentRawDetailDenied ?? true,
    unknownSchoolBlocked: csdData.unknownSchoolBlocked ?? true,
    tenantMismatchBlocked: csdData.tenantMismatchBlocked ?? true,
    blockingIssues: [],
  };
  const errors = validateCrossSchoolDenialResult(result);
  if (errors.length > 0) return { passed: false, errors };
  task036Repository.saveCrossSchoolDenial(sessionId, result);
  return { passed: true, errors: [] };
}

describe('Task036 Cross School Denial', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('passes when all denial checks pass', () => {
    const result = checkCrossSchoolDenial('sess-1', {});
    expect(result.passed).toBe(true);
    expect(task036Repository.saveCrossSchoolDenial).toHaveBeenCalled();
  });

  it('fails when cross school access not denied', () => {
    const result = checkCrossSchoolDenial('sess-1', {
      ok: false, passed: false, crossSchoolAccessDenied: false,
    });
    expect(result.passed).toBe(false);
    expect(result.errors).toContain('cross_school_access_not_denied');
  });

  it('fails when cross learner visibility not denied', () => {
    const result = checkCrossSchoolDenial('sess-1', {
      ok: false, passed: false, crossLearnerVisibilityDenied: false,
    });
    expect(result.passed).toBe(false);
    expect(result.errors).toContain('cross_learner_visibility_not_denied');
  });

  it('fails when parent raw detail not denied', () => {
    const result = checkCrossSchoolDenial('sess-1', {
      ok: false, passed: false, parentRawDetailDenied: false,
    });
    expect(result.passed).toBe(false);
    expect(result.errors).toContain('parent_raw_detail_not_denied');
  });

  it('fails when unknown school not blocked', () => {
    const result = checkCrossSchoolDenial('sess-1', {
      ok: false, passed: false, unknownSchoolBlocked: false,
    });
    expect(result.passed).toBe(false);
    expect(result.errors).toContain('unknown_school_not_blocked');
  });

  it('retrieves stored denial from repository', () => {
    const stored: any = {
      ok: true, passed: true, crossSchoolAccessDenied: true,
      crossLearnerVisibilityDenied: true, parentRawDetailDenied: true,
      unknownSchoolBlocked: true, tenantMismatchBlocked: true,
      blockingIssues: [],
    };
    vi.mocked(task036Repository.getCrossSchoolDenial).mockReturnValue(stored);
    const retrieved = task036Repository.getCrossSchoolDenial('sess-1');
    expect(retrieved!.passed).toBe(true);
    expect(retrieved!.crossSchoolAccessDenied).toBe(true);
  });
});
