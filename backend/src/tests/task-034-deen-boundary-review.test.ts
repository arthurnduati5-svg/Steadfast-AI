import { describe, it, expect } from 'vitest';
import { reviewTask034DeenBoundary } from '../services/task034DeenBoundaryReviewService';

describe('Task034 Deen Boundary Review', () => {
  it('All deen boundary fields pass by default', () => {
    const result = reviewTask034DeenBoundary();
    expect(result.ok).toBe(true);
    expect(result.notAFatwaEngine).toBe(true);
    expect(result.approvedDeenSourcesRequired).toBe(true);
    expect(result.teacherScholarReferralPreserved).toBe(true);
    expect(result.noPietyScoring).toBe(true);
    expect(result.noRawSafeguardingExposure).toBe(true);
    expect(result.noUnsafeAuthorityClaim).toBe(true);
  });

  it('notAFatwaEngine false blocks', () => {
    const result = reviewTask034DeenBoundary({ notAFatwaEngine: false });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('fatwa_engine_detected');
  });

  it('approvedDeenSourcesRequired false blocks', () => {
    const result = reviewTask034DeenBoundary({ approvedDeenSourcesRequired: false });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('approved_deen_sources_not_required');
  });

  it('teacherScholarReferralPreserved false blocks', () => {
    const result = reviewTask034DeenBoundary({ teacherScholarReferralPreserved: false });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('teacher_scholar_referral_not_preserved');
  });

  it('noPietyScoring false blocks', () => {
    const result = reviewTask034DeenBoundary({ noPietyScoring: false });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('piety_scoring_detected');
  });

  it('noRawSafeguardingExposure false blocks', () => {
    const result = reviewTask034DeenBoundary({ noRawSafeguardingExposure: false });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('raw_safeguarding_exposure_detected');
  });

  it('noUnsafeAuthorityClaim false blocks', () => {
    const result = reviewTask034DeenBoundary({ noUnsafeAuthorityClaim: false });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('unsafe_authority_claim_detected');
  });

  it('Multiple failures aggregate blocking issues', () => {
    const result = reviewTask034DeenBoundary({
      notAFatwaEngine: false,
      noPietyScoring: false,
    });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues.length).toBe(2);
  });

  it('Partial override preserves remaining defaults', () => {
    const result = reviewTask034DeenBoundary({ notAFatwaEngine: false });
    expect(result.approvedDeenSourcesRequired).toBe(true);
    expect(result.teacherScholarReferralPreserved).toBe(true);
  });

  it('All false returns 6 blocking issues', () => {
    const result = reviewTask034DeenBoundary({
      notAFatwaEngine: false, approvedDeenSourcesRequired: false,
      teacherScholarReferralPreserved: false, noPietyScoring: false,
      noRawSafeguardingExposure: false, noUnsafeAuthorityClaim: false,
    });
    expect(result.blockingIssues.length).toBe(6);
  });
});
