import type { Task033DeenGovernanceReview } from '../contracts/task033CanaryObservationContracts';

export interface DeenGovernanceSignals {
  deenGatePassed: boolean;
  fatwaEngineIntroduced: boolean;
  inventedRulingDetected: boolean;
  sectarianAuthorityClaimDetected: boolean;
  deenSensitivePrivateTextExposed: boolean;
  safeReferralPathPreserved: boolean;
  approvedSourceBoundaryPreserved: boolean;
}

export function reviewTask033DeenGovernance(signals: DeenGovernanceSignals): Task033DeenGovernanceReview {
  const blockingIssues: string[] = [];

  if (!signals.deenGatePassed) blockingIssues.push('deen_gate_not_passed');
  if (signals.fatwaEngineIntroduced) blockingIssues.push('fatwa_engine_introduced');
  if (signals.inventedRulingDetected) blockingIssues.push('invented_ruling_detected');
  if (signals.sectarianAuthorityClaimDetected) blockingIssues.push('sectarian_authority_claim_detected');
  if (signals.deenSensitivePrivateTextExposed) blockingIssues.push('deen_sensitive_private_text_exposed');
  if (!signals.safeReferralPathPreserved) blockingIssues.push('safe_referral_path_not_preserved');
  if (!signals.approvedSourceBoundaryPreserved) blockingIssues.push('approved_source_boundary_not_preserved');

  return {
    deenGatePassed: signals.deenGatePassed,
    fatwaEngineIntroduced: signals.fatwaEngineIntroduced,
    inventedRulingDetected: signals.inventedRulingDetected,
    sectarianAuthorityClaimDetected: signals.sectarianAuthorityClaimDetected,
    deenSensitivePrivateTextExposed: signals.deenSensitivePrivateTextExposed,
    safeReferralPathPreserved: signals.safeReferralPathPreserved,
    approvedSourceBoundaryPreserved: signals.approvedSourceBoundaryPreserved,
    blockingIssues,
  };
}
