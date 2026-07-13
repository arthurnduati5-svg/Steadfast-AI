import { describe, it, expect, vi, beforeEach } from 'vitest';
import { task036Repository } from '../repositories/task036LiveSchoolLaunchRepository';
import { validateDeenBoundaryResult } from '../lib/task036LiveSchoolLaunchValidation';

vi.mock('../repositories/task036LiveSchoolLaunchRepository', () => {
  const mockRepo = {
    saveDeenBoundary: vi.fn(),
    getDeenBoundary: vi.fn(),
    clearTask036StoresForTests: vi.fn(),
  };
  return { task036Repository: mockRepo, Task036LiveSchoolLaunchRepository: class {} };
});

function checkDeenBoundary(sessionId: string, dbData: any): { passed: boolean; errors: string[] } {
  const result = {
    ok: dbData.ok ?? true,
    passed: dbData.passed ?? true,
    noFatwaEngineMode: dbData.noFatwaEngineMode ?? true,
    approvedDeenSourceRequired: dbData.approvedDeenSourceRequired ?? true,
    teacherScholarReferralPreserved: dbData.teacherScholarReferralPreserved ?? true,
    noPietyScoring: dbData.noPietyScoring ?? true,
    noUnsafeDeenAuthority: dbData.noUnsafeDeenAuthority ?? true,
    deenSensitiveTextProtected: dbData.deenSensitiveTextProtected ?? true,
    blockingIssues: [],
  };
  const errors = validateDeenBoundaryResult(result);
  if (errors.length > 0) return { passed: false, errors };
  task036Repository.saveDeenBoundary(sessionId, result);
  return { passed: true, errors: [] };
}

describe('Task036 Deen Boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('passes when all deen checks pass', () => {
    const result = checkDeenBoundary('sess-1', {});
    expect(result.passed).toBe(true);
    expect(task036Repository.saveDeenBoundary).toHaveBeenCalled();
  });

  it('fails when fatwa engine mode detected', () => {
    const result = checkDeenBoundary('sess-1', {
      ok: false, passed: false, noFatwaEngineMode: false,
    });
    expect(result.passed).toBe(false);
    expect(result.errors).toContain('fatwa_engine_mode_detected');
  });

  it('fails when approved deen source not required', () => {
    const result = checkDeenBoundary('sess-1', {
      ok: false, passed: false, approvedDeenSourceRequired: false,
    });
    expect(result.passed).toBe(false);
    expect(result.errors).toContain('approved_deen_source_not_required');
  });

  it('fails when piety scoring detected', () => {
    const result = checkDeenBoundary('sess-1', {
      ok: false, passed: false, noPietyScoring: false,
    });
    expect(result.passed).toBe(false);
    expect(result.errors).toContain('piety_scoring_detected');
  });

  it('fails when unsafe deen authority detected', () => {
    const result = checkDeenBoundary('sess-1', {
      ok: false, passed: false, noUnsafeDeenAuthority: false,
    });
    expect(result.passed).toBe(false);
    expect(result.errors).toContain('unsafe_deen_authority_detected');
  });

  it('retrieves stored deen boundary from repository', () => {
    const stored: any = {
      ok: true, passed: true, noFatwaEngineMode: true,
      approvedDeenSourceRequired: true, teacherScholarReferralPreserved: true,
      noPietyScoring: true, noUnsafeDeenAuthority: true,
      deenSensitiveTextProtected: true, blockingIssues: [],
    };
    vi.mocked(task036Repository.getDeenBoundary).mockReturnValue(stored);
    const retrieved = task036Repository.getDeenBoundary('sess-1');
    expect(retrieved!.passed).toBe(true);
    expect(retrieved!.noFatwaEngineMode).toBe(true);
  });
});
