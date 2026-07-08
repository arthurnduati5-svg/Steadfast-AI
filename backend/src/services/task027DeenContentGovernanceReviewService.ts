import {
  Task027DeenContentReviewInput,
  Task027DeenContentReviewResult,
} from '../contracts/task027PilotExpansionGovernanceContracts';
import { task027PilotExpansionGovernanceRepository as govRepo } from '../repositories/task027PilotExpansionGovernanceRepository';

export async function reviewDeenContent(input: Task027DeenContentReviewInput): Promise<Task027DeenContentReviewResult> {
  const {
    schoolId,
    proposalId,
    approvedDeenSourcesVerified,
    deenContentPresent,
    noFatwaEngineBehavior,
    noPietyScoring,
    noSectarianJudgment,
    scholarReferralPathExists,
    contentSourcePolicyPassed,
  } = input;

  const proposal = await govRepo.getExpansionProposal(proposalId);
  if (!proposal) {
    return {
      ok: false,
      reviewStatus: 'not_reviewed',
      blockingIssues: ['Proposal not found'],
      safeMessage: 'Cannot review Deen content: proposal not found.',
    };
  }

  const blockingIssues: string[] = [];

  if (deenContentPresent && !approvedDeenSourcesVerified) {
    blockingIssues.push('Approved Deen sources must be verified where Deen content exists.');
  }
  if (noFatwaEngineBehavior === false) {
    blockingIssues.push('Fatwa-engine behavior is not permitted.');
  }
  if (noPietyScoring === false) {
    blockingIssues.push('Piety scoring is not permitted.');
  }
  if (noSectarianJudgment === false) {
    blockingIssues.push('Sectarian judgment is not permitted.');
  }
  if (!scholarReferralPathExists) {
    blockingIssues.push('Scholar/teacher referral path must exist for Deen content concerns.');
  }
  if (!contentSourcePolicyPassed) {
    blockingIssues.push('Content source policy must be passed.');
  }
  if (deenContentPresent && !approvedDeenSourcesVerified) {
    blockingIssues.push('Deen evidence is missing or unsafe: approved sources not verified.');
  }

  const reviewStatus: 'blocked' | 'passed_with_referral' | 'passed' =
    blockingIssues.length > 0
      ? 'blocked'
      : deenContentPresent && !approvedDeenSourcesVerified
        ? 'passed_with_referral'
        : 'passed';

  const ok = blockingIssues.length === 0;

  const result = {
    approvedDeenSourcesVerified,
    deenContentPresent,
    noFatwaEngineBehavior,
    noPietyScoring,
    noSectarianJudgment,
    scholarReferralPathExists,
    contentSourcePolicyPassed,
    reviewStatus,
  };

  await govRepo.recordReviewResult(schoolId, proposalId, 'deen_content_review', result);

  return {
    ok,
    reviewStatus,
    blockingIssues,
    safeMessage: ok
      ? 'Deen content governance review passed.'
      : `Deen content review blocked: ${blockingIssues.length} issue(s).`,
  };
}
