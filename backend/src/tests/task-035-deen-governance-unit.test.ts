import { describe, it, expect } from 'vitest';
import { reviewDeenGovernance } from '../services/task035DeenGovernanceReviewService';

describe('task035DeenGovernanceReview', () => {
  it('should pass the deen gate', () => {
    const result = reviewDeenGovernance();
    expect(result.ok).toBe(true);
    expect(result.deenGatePassed).toBe(true);
    expect(result.blockingIssues).toHaveLength(0);
  });

  it('should not have introduced a fatwa engine or invented ruling', () => {
    const result = reviewDeenGovernance();
    expect(result.fatwaEngineIntroduced).toBe(false);
    expect(result.inventedRulingDetected).toBe(false);
  });

  it('should not have sectarian authority claims or deen sensitive private text exposed', () => {
    const result = reviewDeenGovernance();
    expect(result.sectarianAuthorityClaimDetected).toBe(false);
    expect(result.deenSensitivePrivateTextExposed).toBe(false);
  });

  it('should preserve the safe referral path and approved source boundary', () => {
    const result = reviewDeenGovernance();
    expect(result.safeReferralPathPreserved).toBe(true);
    expect(result.approvedSourceBoundaryPreserved).toBe(true);
  });
});
