import type { Task029TeacherOversightOperationsSummary } from '../contracts/task029ExpansionOperationsContracts';
import { task028ExpansionExecutionRepository } from '../repositories/task028ExpansionExecutionRepository';
import { task029ExpansionOperationsRepository } from '../repositories/task029ExpansionOperationsRepository';

export async function getTeacherOversightOperations(
  expansionRunId: string,
  schoolId: string,
  teacherRef: string,
): Promise<{ ok: boolean; data: Task029TeacherOversightOperationsSummary | null; blockingIssues: string[] }> {
  const blockingIssues: string[] = [];

  const run = await task028ExpansionExecutionRepository.getExecutionRun(expansionRunId);
  if (!run) {
    blockingIssues.push('expansion_run_not_found');
    return { ok: false, data: null, blockingIssues };
  }

  const runAny = run as any;
  if (runAny.schoolId !== schoolId) {
    blockingIssues.push('cross_school_access_denied');
    return { ok: false, data: null, blockingIssues };
  }

  const participants = await task028ExpansionExecutionRepository.listExpandedParticipants(expansionRunId);
  const oversightItems = await task028ExpansionExecutionRepository.listOversightItems(expansionRunId);

  const teacherAssignedSafeCount = participants.filter(
    (p: any) => p.role === 'teacher' && p.activationStatus === 'active',
  ).length;

  const teacherReviewNeededCount = oversightItems.filter(
    (o: any) => o.requiresTeacherReview === true && o.status === 'open',
  ).length;

  const supportNeededCount = oversightItems.filter(
    (o: any) => o.requiresTeacherReview === true || o.requiresAdminReview === true,
  ).length;

  const interventionNeededCount = oversightItems.filter(
    (o: any) => o.requiresPause === true || o.requiresRollback === true,
  ).length;

  const safeNextActionLabels: string[] = [];
  if (teacherReviewNeededCount > 0) safeNextActionLabels.push('review_oversight_items');
  if (supportNeededCount > 0) safeNextActionLabels.push('provide_support');
  if (interventionNeededCount > 0) safeNextActionLabels.push('escalate_intervention');

  const data: Task029TeacherOversightOperationsSummary = {
    teacherAssignedSafeCount,
    teacherOversightViewCount: 1,
    teacherReviewNeededCount,
    supportNeededCount,
    interventionNeededCount,
    safeNextActionLabels,
    pauseRecommendationMetadata: interventionNeededCount > 0 ? 'pause_recommended' : 'no_pause_needed',
    rollbackRecommendationMetadata: interventionNeededCount > 0 ? 'rollback_recommended' : 'no_rollback_needed',
  };

  return { ok: true, data, blockingIssues: [] };
}
