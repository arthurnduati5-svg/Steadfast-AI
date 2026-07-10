import { describe, it, expect } from 'vitest';
import {
  Task034SchoolIdentityReviewResult,
  Task034ExpandedRuntimeGuardResult,
  TASK034_FORBIDDEN_OUTPUT_FIELDS,
} from '../contracts/task034ControlledLimitedRolloutContracts';
import { validateTask034SchoolIdentityReview } from '../lib/task034ControlledLimitedRolloutValidation';

describe('task034 cross learner denial', () => {
  it('valid identity review requires crossSchoolAccessDenied', () => {
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

  it('missing crossSchoolAccessDenied fails', () => {
    const result = validateTask034SchoolIdentityReview({
      ok: true,
      verifiedSchoolIdentityRequired: true,
      unknownSchoolDenied: true,
      actorRoleRequired: true,
      noSessionBeforeSchoolContext: true,
      noMemoryAccessBeforeSchoolContext: true,
      noEvidenceBeforeSchoolContext: true,
      noAiCallBeforeSchoolContext: true,
      blockingIssues: [],
    });
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('missing_crossSchoolAccessDenied');
  });

  it('rejects null input', () => {
    const result = validateTask034SchoolIdentityReview(null);
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('input_is_null');
  });

  it('crossLearnerVisibilityBlocked exists in runtime guard', () => {
    const guard: Task034ExpandedRuntimeGuardResult = {
      ok: true,
      verifiedSchoolContextRequired: true,
      task033AcceptedProofRequired: true,
      approvedSchoolConfigRequired: true,
      approvedContentContextRequired: true,
      learnerMemoryBlockedBeforeSchoolContext: true,
      aiBlockedBeforeAllGates: true,
      liveAiBlocked: true,
      liveConnectorBlocked: true,
      liveNotificationsBlocked: true,
      crossSchoolAccessBlocked: true,
      crossLearnerVisibilityBlocked: true,
      parentRawDetailBlocked: true,
      teacherOnlyLeakageBlocked: true,
      unsafeDeenAuthorityBlocked: true,
      answerBotBehaviorBlocked: true,
      blockingIssues: [],
    };
    expect(guard.crossLearnerVisibilityBlocked).toBe(true);
  });

  it('interface has required school identity fields', () => {
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
    expect(review.crossSchoolAccessDenied).toBe(true);
    expect(review.noSessionBeforeSchoolContext).toBe(true);
    expect(review.noMemoryAccessBeforeSchoolContext).toBe(true);
    expect(review.noEvidenceBeforeSchoolContext).toBe(true);
    expect(review.noAiCallBeforeSchoolContext).toBe(true);
  });
});
