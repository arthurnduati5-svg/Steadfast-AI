import { describe, it, expect } from 'vitest';
import { reviewTask034SchoolIdentity } from '../services/task034SchoolIdentityReviewService';

describe('Task034 School Identity Review', () => {
  it('All school identity fields pass by default', () => {
    const result = reviewTask034SchoolIdentity();
    expect(result.ok).toBe(true);
    expect(result.verifiedSchoolIdentityRequired).toBe(true);
    expect(result.unknownSchoolDenied).toBe(true);
    expect(result.crossSchoolAccessDenied).toBe(true);
    expect(result.actorRoleRequired).toBe(true);
    expect(result.noSessionBeforeSchoolContext).toBe(true);
    expect(result.noMemoryAccessBeforeSchoolContext).toBe(true);
    expect(result.noEvidenceBeforeSchoolContext).toBe(true);
    expect(result.noAiCallBeforeSchoolContext).toBe(true);
  });

  it('verifiedSchoolIdentityRequired false blocks', () => {
    const result = reviewTask034SchoolIdentity({ verifiedSchoolIdentityRequired: false });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('verified_school_identity_not_required');
  });

  it('unknownSchoolDenied false blocks', () => {
    const result = reviewTask034SchoolIdentity({ unknownSchoolDenied: false });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('unknown_school_not_denied');
  });

  it('crossSchoolAccessDenied false blocks', () => {
    const result = reviewTask034SchoolIdentity({ crossSchoolAccessDenied: false });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('cross_school_access_not_denied');
  });

  it('actorRoleRequired false blocks', () => {
    const result = reviewTask034SchoolIdentity({ actorRoleRequired: false });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('actor_role_not_required');
  });

  it('noSessionBeforeSchoolContext false blocks', () => {
    const result = reviewTask034SchoolIdentity({ noSessionBeforeSchoolContext: false });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('session_allowed_before_school_context');
  });

  it('noMemoryAccessBeforeSchoolContext false blocks', () => {
    const result = reviewTask034SchoolIdentity({ noMemoryAccessBeforeSchoolContext: false });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('memory_access_allowed_before_school_context');
  });

  it('noEvidenceBeforeSchoolContext false blocks', () => {
    const result = reviewTask034SchoolIdentity({ noEvidenceBeforeSchoolContext: false });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('evidence_allowed_before_school_context');
  });

  it('noAiCallBeforeSchoolContext false blocks', () => {
    const result = reviewTask034SchoolIdentity({ noAiCallBeforeSchoolContext: false });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('ai_call_allowed_before_school_context');
  });

  it('Partial override preserves remaining defaults', () => {
    const result = reviewTask034SchoolIdentity({ unknownSchoolDenied: false });
    expect(result.verifiedSchoolIdentityRequired).toBe(true);
    expect(result.crossSchoolAccessDenied).toBe(true);
  });

  it('All false returns 8 blocking issues', () => {
    const result = reviewTask034SchoolIdentity({
      verifiedSchoolIdentityRequired: false, unknownSchoolDenied: false,
      crossSchoolAccessDenied: false, actorRoleRequired: false,
      noSessionBeforeSchoolContext: false, noMemoryAccessBeforeSchoolContext: false,
      noEvidenceBeforeSchoolContext: false, noAiCallBeforeSchoolContext: false,
    });
    expect(result.blockingIssues.length).toBe(8);
  });
});
