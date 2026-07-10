import { describe, it, expect } from 'vitest';
import { reviewDeenGovernance } from '../services/task034DeenGovernanceReviewService';

describe('Task034DeenGovernanceReview', () => {
  it('should pass with default values', () => {
    const result = reviewDeenGovernance();
    expect(result.deenGatePassed).toBe(true);
    expect(result.fatwaEngineIntroduced).toBe(false);
    expect(result.inventedRulingDetected).toBe(false);
    expect(result.sectarianAuthorityClaimDetected).toBe(false);
    expect(result.deenSensitivePrivateTextExposed).toBe(false);
    expect(result.safeReferralPathPreserved).toBe(true);
    expect(result.approvedSourceBoundaryPreserved).toBe(true);
    expect(result.blockingIssues).toEqual([]);
  });

  it('should fail when deen gate fails', () => {
    const result = reviewDeenGovernance({ deenGatePassed: false });
    expect(result.blockingIssues).toContain('DEEN_GATE_FAILED');
  });

  it('should fail when fatwa engine introduced', () => {
    const result = reviewDeenGovernance({ fatwaEngineIntroduced: true });
    expect(result.blockingIssues).toContain('FATWA_ENGINE_INTRODUCED');
  });

  it('should fail when invented ruling detected', () => {
    const result = reviewDeenGovernance({ inventedRulingDetected: true });
    expect(result.blockingIssues).toContain('INVENTED_RULING_DETECTED');
  });

  it('should fail when deen-sensitive private text exposed', () => {
    const result = reviewDeenGovernance({ deenSensitivePrivateTextExposed: true });
    expect(result.blockingIssues).toContain('DEEN_SENSITIVE_PRIVATE_TEXT_EXPOSED');
  });

  it('should fail when safe referral path not preserved', () => {
    const result = reviewDeenGovernance({ safeReferralPathPreserved: false });
    expect(result.blockingIssues).toContain('SAFE_REFERRAL_PATH_NOT_PRESERVED');
  });
});
