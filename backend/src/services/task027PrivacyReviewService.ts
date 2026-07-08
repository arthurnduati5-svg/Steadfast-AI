import {
  Task027PrivacyReviewInput,
  Task027PrivacyReviewResult,
} from '../contracts/task027PilotExpansionGovernanceContracts';
import { task027PilotExpansionGovernanceRepository as govRepo } from '../repositories/task027PilotExpansionGovernanceRepository';

export async function reviewPrivacy(input: Task027PrivacyReviewInput): Promise<Task027PrivacyReviewResult> {
  const {
    schoolId,
    proposalId,
    noRawLearnerData,
    noRawParentData,
    noRawTeacherNotes,
    noRawSafeguardingNotes,
    noPrivateDeenText,
    noProviderPayloads,
    noHiddenReasoning,
    minimalSafeMetadataOnly,
    roleScopedReportVisibility,
  } = input;

  const proposal = await govRepo.getExpansionProposal(proposalId);
  if (!proposal) {
    return {
      ok: false,
      reviewStatus: 'not_reviewed',
      blockingIssues: ['Proposal not found'],
      safeMessage: 'Cannot review privacy: proposal not found.',
    };
  }

  const blockingIssues: string[] = [];

  if (!noRawLearnerData) {
    blockingIssues.push('No raw learner data permitted in evidence pack.');
  }
  if (!noRawParentData) {
    blockingIssues.push('No raw parent data permitted in evidence pack.');
  }
  if (!noRawTeacherNotes) {
    blockingIssues.push('No raw teacher notes permitted in evidence pack.');
  }
  if (!noRawSafeguardingNotes) {
    blockingIssues.push('No raw safeguarding notes permitted in evidence pack.');
  }
  if (!noPrivateDeenText) {
    blockingIssues.push('No private Deen text permitted in evidence pack.');
  }
  if (!noProviderPayloads) {
    blockingIssues.push('No provider payloads permitted in evidence pack.');
  }
  if (!noHiddenReasoning) {
    blockingIssues.push('No hidden reasoning permitted in evidence pack.');
  }
  if (!minimalSafeMetadataOnly) {
    blockingIssues.push('Only minimal safe metadata permitted in evidence pack.');
  }
  if (!roleScopedReportVisibility) {
    blockingIssues.push('Report visibility must be role-scoped.');
  }

  const reviewStatus: 'failed' | 'passed_with_conditions' | 'passed' =
    blockingIssues.length > 0
      ? 'failed'
      : !minimalSafeMetadataOnly || !roleScopedReportVisibility
        ? 'passed_with_conditions'
        : 'passed';

  const ok = blockingIssues.length === 0;

  const result = {
    noRawLearnerData,
    noRawParentData,
    noRawTeacherNotes,
    noRawSafeguardingNotes,
    noPrivateDeenText,
    noProviderPayloads,
    noHiddenReasoning,
    minimalSafeMetadataOnly,
    roleScopedReportVisibility,
    reviewStatus,
  };

  await govRepo.recordReviewResult(schoolId, proposalId, 'privacy_review', result);

  return {
    ok,
    reviewStatus,
    blockingIssues,
    safeMessage: ok
      ? 'Privacy review passed.'
      : `Privacy review failed: ${blockingIssues.length} issue(s).`,
  };
}
