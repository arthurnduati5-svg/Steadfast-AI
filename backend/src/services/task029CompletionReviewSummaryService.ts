import type { Task029CompletionReviewSummaryInput, Task029CompletionReviewSummary } from '../contracts/task029ExpansionOperationsContracts';
import { task029ExpansionOperationsRepository } from '../repositories/task029ExpansionOperationsRepository';

export async function getCompletionReviewSummary(input: Task029CompletionReviewSummaryInput): Promise<{
  ok: boolean;
  data: Task029CompletionReviewSummary | null;
  blockingIssues: string[];
}> {
  const blockingIssues: string[] = [];

  if (!input.schoolId || !input.actorId || !input.actorRole || !input.expansionRunId) {
    blockingIssues.push('missing_required_input_fields');
    return { ok: false, data: null, blockingIssues };
  }

  const existing = await task029ExpansionOperationsRepository.listCompletionReviewSummaryViews(input.expansionRunId);
  const latest = existing.length > 0 ? existing[existing.length - 1] : null;

  if (latest) {
    return { ok: true, data: latest, blockingIssues: [] };
  }

  const data: Task029CompletionReviewSummary = {
    safeToStartTask029: false,
    safeToStartTask030Candidate: false,
    remainingBlockers: ['completion_review_not_yet_generated'],
    privacyBoundaryStatus: 'not_verified',
    safeguardingBoundaryStatus: 'not_verified',
    deenContentBoundaryStatus: 'not_verified',
    socraticIntegrityStatus: 'not_verified',
    rollbackReadinessStatus: 'not_verified',
    safeSummary: 'Completion review has not been generated yet.',
  };

  await task029ExpansionOperationsRepository.recordCompletionReviewSummaryView(data);

  return { ok: true, data, blockingIssues };
}
