import {
  Task027ParentLearnerFeedbackReadinessInput,
  Task027ParentLearnerFeedbackReadinessResult,
} from '../contracts/task027PilotExpansionGovernanceContracts';
import { task027PilotExpansionGovernanceRepository as govRepo } from '../repositories/task027PilotExpansionGovernanceRepository';

export async function checkParentLearnerFeedbackReadiness(
  input: Task027ParentLearnerFeedbackReadinessInput,
): Promise<Task027ParentLearnerFeedbackReadinessResult> {
  const { schoolId, proposalId, pilotRunId } = input;

  const proposal = await govRepo.getExpansionProposal(proposalId);
  if (!proposal) {
    return {
      ok: false,
      feedbackAvailable: false,
      feedbackSummarySafe: {},
      seriousUnresolvedConcerns: true,
      unresolvedSafeguardingSignal: false,
      blockingIssues: ['Proposal not found'],
      safeMessage: 'Cannot check feedback readiness: proposal not found.',
    };
  }

  const blockingIssues: string[] = [];
  let feedbackAvailable = false;
  let seriousUnresolvedConcerns = false;
  let unresolvedSafeguardingSignal = false;
  const feedbackSummarySafe: Record<string, unknown> = {};

  const existingReviews = await govRepo.listReviewResults(proposalId);
  const evidenceSummary = await govRepo.getEvidenceSummary(schoolId, pilotRunId);

  const safeSignals = (evidenceSummary?.summary ?? {}) as Record<string, unknown>;
  const safeguardingSignalCount: number = (safeSignals as any).safeguardingSignalCount ?? 0;

  const parentFeedbackReview = existingReviews.find(
    (r) => r.reviewType === 'parent_feedback_readiness',
  );

  if (parentFeedbackReview) {
    feedbackAvailable = true;
    const feedbackData = parentFeedbackReview.result as Record<string, unknown>;

    const safeSummary = (feedbackData as any).safeSummary;
    if (!safeSummary) {
      blockingIssues.push('Safe feedback summary is required but missing.');
      seriousUnresolvedConcerns = true;
    } else {
      feedbackSummarySafe.safeSummary = safeSummary;
    }

    const seriousConcerns = (feedbackData as any).seriousUnresolvedConcerns;
    if (seriousConcerns === true) {
      blockingIssues.push('Feedback indicates serious unresolved concern.');
      seriousUnresolvedConcerns = true;
    }

    const safeguardingSignal = (feedbackData as any).unresolvedSafeguardingSignal;
    if (safeguardingSignal === true) {
      blockingIssues.push('Feedback contains unresolved safeguarding signal.');
      unresolvedSafeguardingSignal = true;
    }

    const confusionOrUnsafe = (feedbackData as any).confusionOrUnsafeBehaviorWithoutMitigation;
    if (confusionOrUnsafe === true) {
      blockingIssues.push('Feedback indicates confusion or unsafe behavior without mitigation.');
      seriousUnresolvedConcerns = true;
    }
  } else {
    const safeOpsSignals = (safeSignals as any).safeOperationsSignals as Record<string, unknown> | undefined;
    const safeSummary = safeOpsSignals?.safeParentLearnerFeedbackSummary as string | undefined;
    if (safeSummary) {
      feedbackAvailable = true;
      feedbackSummarySafe.safeSummary = safeSummary;
    }
  }

  if (!feedbackAvailable) {
    blockingIssues.push('No parent/learner feedback available. Evidence from Task 026 required.');
  }

  if (safeguardingSignalCount > 0 && !unresolvedSafeguardingSignal) {
    unresolvedSafeguardingSignal = true;
    blockingIssues.push('Safeguarding signals present in pilot evidence.');
  }

  const ok = blockingIssues.length === 0;

  await govRepo.recordReviewResult(schoolId, proposalId, 'parent_feedback_readiness', {
    feedbackAvailable,
    feedbackSummarySafe,
    seriousUnresolvedConcerns,
    unresolvedSafeguardingSignal,
    blockingIssues,
  });

  return {
    ok,
    feedbackAvailable,
    feedbackSummarySafe,
    seriousUnresolvedConcerns,
    unresolvedSafeguardingSignal,
    blockingIssues,
    safeMessage: ok
      ? 'Parent/learner feedback readiness check passed.'
      : `Parent/learner feedback readiness blocked: ${blockingIssues.length} issue(s).`,
  };
}
