import type { Task029LearnerOwnStatus, Task029LearnerOwnStatusInput } from '../contracts/task029ExpansionOperationsContracts';
import { task028ExpansionExecutionRepository } from '../repositories/task028ExpansionExecutionRepository';
import { task029ExpansionOperationsRepository } from '../repositories/task029ExpansionOperationsRepository';

export async function getLearnerOwnStatus(
  input: Task029LearnerOwnStatusInput,
): Promise<{ ok: boolean; data: Task029LearnerOwnStatus | null; blockingIssues: string[] }> {
  const blockingIssues: string[] = [];

  if (input.actorRole !== 'learner_in_approved_expanded_cohort' && input.actorRole !== 'student') {
    blockingIssues.push('learner_only_endpoint');
    return { ok: false, data: null, blockingIssues };
  }

  if (input.actorId !== input.learnerSafeRef) {
    blockingIssues.push('learner_safe_ref_mismatch');
    return { ok: false, data: null, blockingIssues };
  }

  if (!input.expansionRunId) {
    blockingIssues.push('expansion_run_not_specified');
    return { ok: false, data: null, blockingIssues };
  }

  const run = await task028ExpansionExecutionRepository.getExecutionRun(input.expansionRunId);
  if (!run) {
    blockingIssues.push('expansion_run_not_found');
    return { ok: false, data: null, blockingIssues };
  }

  const runAny = run as any;
  if (runAny.schoolId !== input.schoolId) {
    blockingIssues.push('cross_school_access_denied');
    return { ok: false, data: null, blockingIssues };
  }

  const participants = await task028ExpansionExecutionRepository.listExpandedParticipants(input.expansionRunId);
  const learner = participants.find((p: any) => p.actorIdHash === input.learnerSafeRef);
  if (!learner) {
    blockingIssues.push('learner_not_in_cohort');
    return { ok: false, data: null, blockingIssues };
  }

  const learnerAny = learner as any;
  const isInApprovedExpandedCohort = learnerAny.activationStatus === 'active' || learnerAny.activationStatus === 'pending';

  const accessStatus = learnerAny.activationStatus === 'active'
    ? 'access_granted'
    : learnerAny.activationStatus === 'pending'
      ? 'access_pending'
      : 'access_denied';

  const pauseStatus = runAny.status?.includes('paused') ? 'paused' : 'not_paused';
  const rollbackStatus = runAny.status === 'rolled_back' ? 'rolled_back' : 'not_rolled_back';

  const safeMessage = isInApprovedExpandedCohort
    ? 'You are in the approved expanded cohort.'
    : 'You are not currently in the approved expanded cohort.';

  const nextSafeActionLabel = isInApprovedExpandedCohort ? 'continue_learning' : 'contact_support';
  const supportAvailable = true;

  const data: Task029LearnerOwnStatus = {
    learnerSafeRef: input.learnerSafeRef,
    schoolId: input.schoolId,
    expansionRunId: input.expansionRunId,
    isInApprovedExpandedCohort,
    accessStatus,
    pauseStatus,
    rollbackStatus,
    safeMessage,
    nextSafeActionLabel,
    supportAvailable,
  };

  await task029ExpansionOperationsRepository.recordLearnerOwnStatusView(data);

  return { ok: true, data, blockingIssues: [] };
}
