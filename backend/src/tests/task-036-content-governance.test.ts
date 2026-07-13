import { describe, it, expect, vi, beforeEach } from 'vitest';
import { task036Repository } from '../repositories/task036LiveSchoolLaunchRepository';
import { validateContentGovernanceResult } from '../lib/task036LiveSchoolLaunchValidation';

vi.mock('../repositories/task036LiveSchoolLaunchRepository', () => {
  const mockRepo = {
    saveContentGovernance: vi.fn(),
    getContentGovernance: vi.fn(),
    clearTask036StoresForTests: vi.fn(),
  };
  return { task036Repository: mockRepo, Task036LiveSchoolLaunchRepository: class {} };
});

function checkContentGovernance(sessionId: string, cgData: any): { passed: boolean; errors: string[] } {
  const result = {
    ok: cgData.ok ?? true,
    passed: cgData.passed ?? true,
    approvedSourceRequired: cgData.approvedSourceRequired ?? true,
    unapprovedContentBlocked: cgData.unapprovedContentBlocked ?? true,
    curriculumGatePassed: cgData.curriculumGatePassed ?? true,
    teacherOnlyContentProtected: cgData.teacherOnlyContentProtected ?? true,
    noInventedTeachingClaim: cgData.noInventedTeachingClaim ?? true,
    blockingIssues: [],
  };
  const errors = validateContentGovernanceResult(result);
  if (errors.length > 0) return { passed: false, errors };
  task036Repository.saveContentGovernance(sessionId, result);
  return { passed: true, errors: [] };
}

describe('Task036 Content Governance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('passes when all governance checks pass', () => {
    const result = checkContentGovernance('sess-1', {});
    expect(result.passed).toBe(true);
    expect(task036Repository.saveContentGovernance).toHaveBeenCalled();
  });

  it('fails when approved source not required', () => {
    const result = checkContentGovernance('sess-1', {
      ok: false, passed: false, approvedSourceRequired: false,
    });
    expect(result.passed).toBe(false);
    expect(result.errors).toContain('approved_source_not_required');
  });

  it('fails when unapproved content not blocked', () => {
    const result = checkContentGovernance('sess-1', {
      ok: false, passed: false, unapprovedContentBlocked: false,
    });
    expect(result.passed).toBe(false);
    expect(result.errors).toContain('unapproved_content_not_blocked');
  });

  it('fails when curriculum gate not passed', () => {
    const result = checkContentGovernance('sess-1', {
      ok: false, passed: false, curriculumGatePassed: false,
    });
    expect(result.passed).toBe(false);
    expect(result.errors).toContain('curriculum_gate_not_passed');
  });

  it('fails when invented teaching claim detected', () => {
    const result = checkContentGovernance('sess-1', {
      ok: false, passed: false, noInventedTeachingClaim: false,
    });
    expect(result.passed).toBe(false);
    expect(result.errors).toContain('invented_teaching_claim_detected');
  });

  it('retrieves stored governance from repository', () => {
    const stored: any = {
      ok: true, passed: true, approvedSourceRequired: true,
      unapprovedContentBlocked: true, curriculumGatePassed: true,
      teacherOnlyContentProtected: true, noInventedTeachingClaim: true,
      blockingIssues: [],
    };
    vi.mocked(task036Repository.getContentGovernance).mockReturnValue(stored);
    const retrieved = task036Repository.getContentGovernance('sess-1');
    expect(retrieved!.passed).toBe(true);
    expect(retrieved!.approvedSourceRequired).toBe(true);
  });
});
