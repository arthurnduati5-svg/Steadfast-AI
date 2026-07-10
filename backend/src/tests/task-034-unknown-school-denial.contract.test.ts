import { describe, it, expect } from 'vitest';
import {
  Task034SchoolIdentityReviewResult,
  Task034CrossSchoolDenialReviewResult,
  TASK034_FORBIDDEN_OUTPUT_FIELDS,
} from '../contracts/task034ControlledLimitedRolloutContracts';
import { validateTask034SchoolIdentityReview } from '../lib/task034ControlledLimitedRolloutValidation';

describe('task034 unknown school denial', () => {
  it('valid review requires unknownSchoolDenied', () => {
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

  it('missing unknownSchoolDenied fails', () => {
    const result = validateTask034SchoolIdentityReview({
      ok: true,
      verifiedSchoolIdentityRequired: true,
      crossSchoolAccessDenied: true,
      actorRoleRequired: true,
      noSessionBeforeSchoolContext: true,
      noMemoryAccessBeforeSchoolContext: true,
      noEvidenceBeforeSchoolContext: true,
      noAiCallBeforeSchoolContext: true,
      blockingIssues: [],
    });
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('missing_unknownSchoolDenied');
  });

  it('rejects null input', () => {
    const result = validateTask034SchoolIdentityReview(null);
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('input_is_null');
  });

  it('unknown school denied field in error response', () => {
    const cross: Task034CrossSchoolDenialReviewResult = {
      ok: true,
      crossSchoolAttemptsBlocked: true,
      schoolAContextNotVisibleToSchoolB: true,
      noInterSchoolLearnerVisibility: true,
      noInterSchoolTeacherDataLeakage: true,
      safeAuditOfCrossSchoolAttempts: true,
      blockingIssues: [],
    };
    expect(cross.ok).toBe(true);
  });

  it('interface has unknownSchoolDenied as true', () => {
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
    expect(review.unknownSchoolDenied).toBe(true);
    expect(review.crossSchoolAccessDenied).toBe(true);
    expect(review.actorRoleRequired).toBe(true);
    expect(review.noSessionBeforeSchoolContext).toBe(true);
    expect(review.noMemoryAccessBeforeSchoolContext).toBe(true);
  });
});
