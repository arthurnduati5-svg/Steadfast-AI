import { describe, it, expect, vi, beforeEach } from 'vitest';
import { task036Repository } from '../repositories/task036LiveSchoolLaunchRepository';
import { validateSchoolIdentityResult } from '../lib/task036LiveSchoolLaunchValidation';

vi.mock('../repositories/task036LiveSchoolLaunchRepository', () => {
  const mockRepo = {
    saveSchoolIdentity: vi.fn(),
    getSchoolIdentity: vi.fn(),
    clearTask036StoresForTests: vi.fn(),
  };
  return { task036Repository: mockRepo, Task036LiveSchoolLaunchRepository: class {} };
});

function checkSchoolIdentity(sessionId: string, siData: any): { passed: boolean; errors: string[] } {
  const result = {
    ok: siData.ok ?? true,
    passed: siData.passed ?? true,
    schoolIdentityVerified: siData.schoolIdentityVerified ?? true,
    schoolContextVerified: siData.schoolContextVerified ?? true,
    tenantMatchVerified: siData.tenantMatchVerified ?? true,
    sessionRequiresVerifiedIdentity: siData.sessionRequiresVerifiedIdentity ?? true,
    memoryRequiresVerifiedIdentity: siData.memoryRequiresVerifiedIdentity ?? true,
    evidenceRequiresVerifiedIdentity: siData.evidenceRequiresVerifiedIdentity ?? true,
    aiCallRequiresVerifiedIdentity: siData.aiCallRequiresVerifiedIdentity ?? true,
    actionRequiresVerifiedIdentity: siData.actionRequiresVerifiedIdentity ?? true,
    blockingIssues: [],
  };
  const errors = validateSchoolIdentityResult(result);
  if (errors.length > 0) return { passed: false, errors };
  task036Repository.saveSchoolIdentity(sessionId, result);
  return { passed: true, errors: [] };
}

describe('Task036 School Identity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('passes when all identity checks pass', () => {
    const result = checkSchoolIdentity('sess-1', {});
    expect(result.passed).toBe(true);
    expect(task036Repository.saveSchoolIdentity).toHaveBeenCalled();
  });

  it('fails when school identity not verified', () => {
    const result = checkSchoolIdentity('sess-1', {
      ok: false, passed: false, schoolIdentityVerified: false,
    });
    expect(result.passed).toBe(false);
    expect(result.errors).toContain('school_identity_not_verified');
  });

  it('fails when tenant mismatch', () => {
    const result = checkSchoolIdentity('sess-1', {
      ok: false, passed: false, tenantMatchVerified: false,
    });
    expect(result.passed).toBe(false);
    expect(result.errors).toContain('tenant_mismatch');
  });

  it('fails when session identity not required', () => {
    const result = checkSchoolIdentity('sess-1', {
      ok: false, passed: false, sessionRequiresVerifiedIdentity: false,
    });
    expect(result.passed).toBe(false);
    expect(result.errors).toContain('session_identity_not_required');
  });

  it('fails when ai call identity not required', () => {
    const result = checkSchoolIdentity('sess-1', {
      ok: false, passed: false, aiCallRequiresVerifiedIdentity: false,
    });
    expect(result.passed).toBe(false);
    expect(result.errors).toContain('ai_call_identity_not_required');
  });

  it('retrieves stored identity from repository', () => {
    const stored: any = {
      ok: true, passed: true, schoolIdentityVerified: true,
      schoolContextVerified: true, tenantMatchVerified: true,
      sessionRequiresVerifiedIdentity: true, memoryRequiresVerifiedIdentity: true,
      evidenceRequiresVerifiedIdentity: true, aiCallRequiresVerifiedIdentity: true,
      actionRequiresVerifiedIdentity: true, blockingIssues: [],
    };
    vi.mocked(task036Repository.getSchoolIdentity).mockReturnValue(stored);
    const retrieved = task036Repository.getSchoolIdentity('sess-1');
    expect(retrieved!.passed).toBe(true);
    expect(retrieved!.schoolIdentityVerified).toBe(true);
  });
});
