import type { Task034DeenBoundaryReviewResult } from '../contracts/task034ControlledLimitedRolloutContracts';

export function reviewTask034DeenBoundary(overrides?: Partial<Task034DeenBoundaryReviewResult>): Task034DeenBoundaryReviewResult {
  const defaults: Task034DeenBoundaryReviewResult = {
    ok: true,
    notAFatwaEngine: true,
    approvedDeenSourcesRequired: true,
    teacherScholarReferralPreserved: true,
    noPietyScoring: true,
    noRawSafeguardingExposure: true,
    noUnsafeAuthorityClaim: true,
    blockingIssues: [],
  };

  const resolved = { ...defaults, ...overrides };
  const blockingIssues: string[] = [];

  if (!resolved.notAFatwaEngine) blockingIssues.push('fatwa_engine_detected');
  if (!resolved.approvedDeenSourcesRequired) blockingIssues.push('approved_deen_sources_not_required');
  if (!resolved.teacherScholarReferralPreserved) blockingIssues.push('teacher_scholar_referral_not_preserved');
  if (!resolved.noPietyScoring) blockingIssues.push('piety_scoring_detected');
  if (!resolved.noRawSafeguardingExposure) blockingIssues.push('raw_safeguarding_exposure_detected');
  if (!resolved.noUnsafeAuthorityClaim) blockingIssues.push('unsafe_authority_claim_detected');

  return {
    ...resolved,
    ok: blockingIssues.length === 0,
    blockingIssues,
  };
}
