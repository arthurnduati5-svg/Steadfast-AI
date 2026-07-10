import { describe, it, expect } from 'vitest';
import {
  TASK034_FORBIDDEN_OUTPUT_FIELDS,
  Task034PrivacyReviewResult,
  Task034DeenBoundaryReviewResult,
} from '../contracts/task034ControlledLimitedRolloutContracts';
import { rejectTask034ForbiddenFields, validateTask034DeenBoundaryReview } from '../lib/task034ControlledLimitedRolloutValidation';

describe('task034 no private deen leak', () => {
  it('forbidden fields contains privateDeenText', () => {
    expect(TASK034_FORBIDDEN_OUTPUT_FIELDS).toContain('privateDeenText');
  });

  it('rejectTask034ForbiddenFields matches privateDeenText', () => {
    const result = rejectTask034ForbiddenFields({ privateDeenText: 'sensitive' });
    expect(result.hasForbiddenFields).toBe(true);
    expect(result.matchedFields).toContain('privateDeenText');
  });

  it('privacy review interface requires noPrivateDeenText', () => {
    const review: Task034PrivacyReviewResult = {
      ok: true,
      noRawLearnerData: true,
      noRawChat: true,
      noRawAnswer: true,
      noRawStudentWork: true,
      noParentContactData: true,
      noTeacherPrivateNotes: true,
      noSafeguardingRawNotes: true,
      noPrivateDeenText: true,
      noAnswerKey: true,
      noMarkingScheme: true,
      noProviderPrompt: true,
      noProviderResponse: true,
      noHiddenReasoning: true,
      blockingIssues: [],
    };
    expect(review.noPrivateDeenText).toBe(true);
  });

  it('deen boundary review ensures noRawSafeguardingExposure', () => {
    const review: Task034DeenBoundaryReviewResult = {
      ok: true,
      notAFatwaEngine: true,
      approvedDeenSourcesRequired: true,
      teacherScholarReferralPreserved: true,
      noPietyScoring: true,
      noRawSafeguardingExposure: true,
      noUnsafeAuthorityClaim: true,
      blockingIssues: [],
    };
    expect(review.noRawSafeguardingExposure).toBe(true);
  });

  it('rejectTask034ForbiddenFields returns false for safe object', () => {
    const result = rejectTask034ForbiddenFields({ safeSummary: 'ok' });
    expect(result.hasForbiddenFields).toBe(false);
  });

  it('validateTask034DeenBoundaryReview passes valid input', () => {
    const result = validateTask034DeenBoundaryReview({
      ok: true,
      notAFatwaEngine: true,
      approvedDeenSourcesRequired: true,
      teacherScholarReferralPreserved: true,
      noPietyScoring: true,
      noRawSafeguardingExposure: true,
      noUnsafeAuthorityClaim: true,
      blockingIssues: [],
    });
    expect(result.ok).toBe(true);
  });
});
