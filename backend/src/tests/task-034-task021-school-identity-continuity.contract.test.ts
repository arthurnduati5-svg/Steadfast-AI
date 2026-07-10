import { describe, it, expect } from 'vitest';
import {
  TASK034_FORBIDDEN_OUTPUT_FIELDS,
  Task034SchoolIdentityReviewResult,
} from '../contracts/task034ControlledLimitedRolloutContracts';
import { validateTask034SchoolIdentityReview } from '../lib/task034ControlledLimitedRolloutValidation';

describe('task034 task021 school identity continuity', () => {
  it('validates verifiedSchoolIdentityRequired is present', () => {
    const result = validateTask034SchoolIdentityReview({
      ok: true,
      verifiedSchoolIdentityRequired: true,
      unknownSchoolDenied: true,
      crossSchoolAccessDenied: true,
      actorRoleRequired: true,
      noSessionBeforeSchoolContext: true,
      noMemoryAccessBeforeSchoolContext: true,
      noEvidenceBeforeSchoolContext: true,
      noAiCallBeforeSchoolContext: true,
      blockingIssues: [],
    });
    expect(result.ok).toBe(true);
  });

  it('missing verifiedSchoolIdentityRequired fails', () => {
    const result = validateTask034SchoolIdentityReview({
      ok: true,
      unknownSchoolDenied: true,
      crossSchoolAccessDenied: true,
      actorRoleRequired: true,
      noSessionBeforeSchoolContext: true,
      noMemoryAccessBeforeSchoolContext: true,
      noEvidenceBeforeSchoolContext: true,
      noAiCallBeforeSchoolContext: true,
      blockingIssues: [],
    });
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('missing_verifiedSchoolIdentityRequired');
  });

  it('rejects null input', () => {
    const result = validateTask034SchoolIdentityReview(null);
    expect(result.ok).toBe(false);
  });

  it('interface requires verifiedSchoolIdentityRequired boolean', () => {
    const review: Task034SchoolIdentityReviewResult = {
      ok: true,
      verifiedSchoolIdentityRequired: true,
      unknownSchoolDenied: true,
      crossSchoolAccessDenied: true,
      actorRoleRequired: true,
      noSessionBeforeSchoolContext: true,
      noMemoryAccessBeforeSchoolContext: true,
      noEvidenceBeforeSchoolContext: true,
      noAiCallBeforeSchoolContext: true,
      blockingIssues: [],
    };
    expect(typeof review.verifiedSchoolIdentityRequired).toBe('boolean');
  });

  it('no school identity fields in forbidden output', () => {
    expect(TASK034_FORBIDDEN_OUTPUT_FIELDS).not.toContain('verifiedSchoolIdentityRequired');
    expect(TASK034_FORBIDDEN_OUTPUT_FIELDS).not.toContain('unknownSchoolDenied');
    expect(TASK034_FORBIDDEN_OUTPUT_FIELDS).not.toContain('crossSchoolAccessDenied');
    expect(TASK034_FORBIDDEN_OUTPUT_FIELDS).not.toContain('actorRoleRequired');
    expect(TASK034_FORBIDDEN_OUTPUT_FIELDS).not.toContain('noSessionBeforeSchoolContext');
  });
});
