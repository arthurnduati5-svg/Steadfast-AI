import type { Task034DeenGovernanceReview } from '../contracts/task034ControlledRolloutContracts';

export function reviewDeenGovernance(
  overrides?: Partial<Task034DeenGovernanceReview>,
): Task034DeenGovernanceReview {
  const blockingIssues: string[] = [];

  const result: Task034DeenGovernanceReview = {
    deenGatePassed: true,
    fatwaEngineIntroduced: false,
    inventedRulingDetected: false,
    sectarianAuthorityClaimDetected: false,
    deenSensitivePrivateTextExposed: false,
    safeReferralPathPreserved: true,
    approvedSourceBoundaryPreserved: true,
    blockingIssues: [],
  };

  const final = { ...result, ...overrides };

  if (!final.deenGatePassed) blockingIssues.push('DEEN_GATE_FAILED');
  if (final.fatwaEngineIntroduced) blockingIssues.push('FATWA_ENGINE_INTRODUCED');
  if (final.inventedRulingDetected) blockingIssues.push('INVENTED_RULING_DETECTED');
  if (final.sectarianAuthorityClaimDetected) blockingIssues.push('SECTARIAN_AUTHORITY_CLAIM_DETECTED');
  if (final.deenSensitivePrivateTextExposed) blockingIssues.push('DEEN_SENSITIVE_PRIVATE_TEXT_EXPOSED');
  if (!final.safeReferralPathPreserved) blockingIssues.push('SAFE_REFERRAL_PATH_NOT_PRESERVED');
  if (!final.approvedSourceBoundaryPreserved) blockingIssues.push('APPROVED_SOURCE_BOUNDARY_NOT_PRESERVED');

  return {
    ...final,
    blockingIssues,
  };
}
