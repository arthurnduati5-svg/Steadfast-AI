import { task027PilotExpansionGovernanceRepository as govRepo } from '../repositories/task027PilotExpansionGovernanceRepository';
import type {
  Task027PauseRollbackReadinessInput,
  Task027PauseRollbackReadinessResult,
} from '../contracts/task027PilotExpansionGovernanceContracts';

export async function checkPauseRollbackReadiness(input: Task027PauseRollbackReadinessInput): Promise<Task027PauseRollbackReadinessResult> {
  const blockingIssues: string[] = [];

  if (!input.pauseCanBlockNewLearnerAccess) {
    blockingIssues.push('Pause mechanism cannot block new learner access during expansion.');
  }
  if (!input.rollbackCanBlockExpansion) {
    blockingIssues.push('Rollback cannot halt expansion flow when triggered.');
  }
  if (!input.killSwitchExists) {
    blockingIssues.push('Kill switch does not exist for this expansion scope.');
  }
  if (!input.auditPreserved) {
    blockingIssues.push('Audit trail not preserved during pause or rollback.');
  }
  if (!input.noDestructiveDeletion) {
    blockingIssues.push('Destructive deletion risk detected in rollback path.');
  }
  if (!input.manualReviewPathExists) {
    blockingIssues.push('No manual review path exists for pause/rollback decisions.');
  }

  const reviewStatus = blockingIssues.length === 0
    ? 'passed'
    : 'failed';

  const safeMessage = blockingIssues.length === 0
    ? 'Pause and rollback readiness review passed. All safeguards confirmed.'
    : `Pause and rollback readiness review failed. ${blockingIssues.length} blocking issue(s) found.`;

  await govRepo.recordReviewResult(input.schoolId, input.proposalId, 'pause_rollback_readiness', {
    reviewStatus,
    blockingIssues,
    safeMessage,
  });

  return {
    ok: blockingIssues.length === 0,
    reviewStatus,
    blockingIssues,
    safeMessage,
  };
}
