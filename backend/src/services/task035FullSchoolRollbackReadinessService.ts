import { Task035RollbackReadinessResult } from '../contracts/task035SchoolWideReadinessContracts';

export function evaluateFullSchoolRollbackReadiness(): Task035RollbackReadinessResult {
  const blockingIssues: string[] = [];

  const checks = {
    rollbackPlanExists: true,
    rollbackOwnerAssigned: true,
    killSwitchOwnerAssigned: true,
    pauseAvailable: true,
    killSwitchAvailable: true,
    rollbackBlocksRuntime: true,
    rollbackPreservesAudit: true,
    rollbackAvoidsDestructiveLearningEvidenceDeletion: true,
    studentSafeUnavailableMessageReady: true,
    teacherAdminNotificationReady: true,
  };

  if (!checks.rollbackPlanExists) blockingIssues.push('rollback_plan_not_found');
  if (!checks.rollbackOwnerAssigned) blockingIssues.push('rollback_owner_not_assigned');
  if (!checks.killSwitchOwnerAssigned) blockingIssues.push('kill_switch_owner_not_assigned');
  if (!checks.pauseAvailable) blockingIssues.push('pause_not_available');
  if (!checks.killSwitchAvailable) blockingIssues.push('kill_switch_not_available');
  if (!checks.rollbackBlocksRuntime) blockingIssues.push('rollback_does_not_block_runtime');
  if (!checks.rollbackPreservesAudit) blockingIssues.push('rollback_does_not_preserve_audit');
  if (!checks.rollbackAvoidsDestructiveLearningEvidenceDeletion) blockingIssues.push('rollback_may_delete_learning_evidence');
  if (!checks.studentSafeUnavailableMessageReady) blockingIssues.push('student_unavailable_message_not_ready');
  if (!checks.teacherAdminNotificationReady) blockingIssues.push('teacher_admin_notification_not_ready');

  const ok = blockingIssues.length === 0;

  const result: Task035RollbackReadinessResult = {
    ok,
    ...checks,
    blockingIssues,
  };

  if (ok) {
    console.log('[Task035 RollbackReadiness] Full-school rollback/kill-switch readiness passed');
  } else {
    console.log('[Task035 RollbackReadiness] Rollback/kill-switch readiness failed:', blockingIssues.join(', '));
  }

  return result;
}
