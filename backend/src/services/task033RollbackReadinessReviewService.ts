import type { Task033RollbackReadinessReview } from '../contracts/task033CanaryObservationContracts';

export interface RollbackReadinessInput {
  rollbackPlanExists: boolean;
  rollbackOwnerAssigned: boolean;
  killSwitchAvailable: boolean;
  pauseAvailable: boolean;
  runtimeAccessBlockedByRollback: boolean;
  safeAuditSummaryPreserved: boolean;
  destructiveLearningEvidenceDeletionAvoided: boolean;
  rollbackDrillStillValidFromTask032: boolean;
}

export function reviewTask033RollbackReadiness(input: RollbackReadinessInput): Task033RollbackReadinessReview {
  const blockingIssues: string[] = [];

  if (!input.rollbackPlanExists) blockingIssues.push('rollback_plan_not_exists');
  if (!input.rollbackOwnerAssigned) blockingIssues.push('rollback_owner_not_assigned');
  if (!input.killSwitchAvailable) blockingIssues.push('kill_switch_not_available');
  if (!input.pauseAvailable) blockingIssues.push('pause_not_available');
  if (!input.runtimeAccessBlockedByRollback) blockingIssues.push('runtime_access_not_blocked_by_rollback');
  if (!input.safeAuditSummaryPreserved) blockingIssues.push('safe_audit_summary_not_preserved');
  if (input.destructiveLearningEvidenceDeletionAvoided === false) {
    blockingIssues.push('destructive_learning_evidence_deletion_not_avoided');
  }
  if (!input.rollbackDrillStillValidFromTask032) blockingIssues.push('rollback_drill_not_valid_from_task032');

  return {
    rollbackPlanExists: input.rollbackPlanExists,
    rollbackOwnerAssigned: input.rollbackOwnerAssigned,
    killSwitchAvailable: input.killSwitchAvailable,
    pauseAvailable: input.pauseAvailable,
    runtimeAccessBlockedByRollback: input.runtimeAccessBlockedByRollback,
    safeAuditSummaryPreserved: input.safeAuditSummaryPreserved,
    destructiveLearningEvidenceDeletionAvoided: input.destructiveLearningEvidenceDeletionAvoided,
    rollbackDrillStillValidFromTask032: input.rollbackDrillStillValidFromTask032,
    blockingIssues,
  };
}
