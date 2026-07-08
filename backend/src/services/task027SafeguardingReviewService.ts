import {
  Task027SafeguardingReviewInput,
  Task027SafeguardingReviewResult,
  TASK027_FORBIDDEN_FIELDS,
} from '../contracts/task027PilotExpansionGovernanceContracts';
import { task027PilotExpansionGovernanceRepository as govRepo } from '../repositories/task027PilotExpansionGovernanceRepository';

export async function reviewSafeguarding(input: Task027SafeguardingReviewInput): Promise<Task027SafeguardingReviewResult> {
  const {
    schoolId,
    proposalId,
    safeguardingOwnerSafeRef,
    seriousRiskDisclosureMinimal,
    humanReviewPathExists,
    roleScopedDisclosureOnly,
  } = input;

  const proposal = await govRepo.getExpansionProposal(proposalId);
  if (!proposal) {
    return {
      ok: false,
      reviewStatus: 'not_reviewed',
      blockingIssues: ['Proposal not found'],
      safeMessage: 'Cannot review safeguarding: proposal not found.',
    };
  }

  const blockingIssues: string[] = [];

  if (!safeguardingOwnerSafeRef) {
    blockingIssues.push('Safeguarding owner safe reference is required.');
  }
  if (!humanReviewPathExists) {
    blockingIssues.push('Human review path must exist for safeguarding concerns.');
  }
  if (!roleScopedDisclosureOnly) {
    blockingIssues.push('Safeguarding disclosures must be role-scoped.');
  }

  const forbiddenViolations = TASK027_FORBIDDEN_FIELDS.filter(
    (f) => f === 'rawSafeguardingNotes' || f === 'rawSafeguardingDisclosure',
  );
  if (forbiddenViolations.some((f) => f in input)) {
    blockingIssues.push('Raw safeguarding notes or disclosures are not permitted in review metadata.');
  }

  if (!seriousRiskDisclosureMinimal) {
    blockingIssues.push('Serious risk disclosure must be minimal and necessary.');
  }

  const reviewStatus: 'blocked' | 'passed_with_conditions' | 'passed' =
    blockingIssues.length > 0
      ? 'blocked'
      : !seriousRiskDisclosureMinimal
        ? 'passed_with_conditions'
        : 'passed';

  const ok = blockingIssues.length === 0;

  const result = {
    safeguardingOwnerSafeRef,
    seriousRiskDisclosureMinimal,
    humanReviewPathExists,
    roleScopedDisclosureOnly,
    reviewStatus,
  };

  await govRepo.recordReviewResult(schoolId, proposalId, 'safeguarding_review', result);

  return {
    ok,
    reviewStatus,
    blockingIssues,
    safeMessage: ok
      ? 'Safeguarding review passed.'
      : `Safeguarding review blocked: ${blockingIssues.length} issue(s).`,
  };
}
