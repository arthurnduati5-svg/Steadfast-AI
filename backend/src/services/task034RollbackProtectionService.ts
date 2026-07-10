import type { Task034RollbackProtectionResult } from '../contracts/task034ControlledLimitedRolloutContracts';

export function evaluateTask034RollbackProtection(overrides?: Partial<Task034RollbackProtectionResult>): Task034RollbackProtectionResult {
  const defaults: Task034RollbackProtectionResult = {
    ok: true,
    rollbackAvailable: true,
    pauseAvailable: true,
    killSwitchAvailable: true,
    rollbackOwnerAssigned: true,
    rollbackPlanValid: true,
    pausePlanValid: true,
    killSwitchPlanValid: true,
    safeAuditPreservedOnRollback: true,
    limitedRolloutCanStopWithoutSchoolWideSideEffect: true,
    blockingIssues: [],
  };

  const resolved = { ...defaults, ...overrides };
  const blockingIssues: string[] = [];

  if (!resolved.rollbackAvailable) blockingIssues.push('rollback_not_available');
  if (!resolved.pauseAvailable) blockingIssues.push('pause_not_available');
  if (!resolved.killSwitchAvailable) blockingIssues.push('kill_switch_not_available');
  if (!resolved.rollbackOwnerAssigned) blockingIssues.push('rollback_owner_not_assigned');
  if (!resolved.rollbackPlanValid) blockingIssues.push('rollback_plan_not_valid');
  if (!resolved.pausePlanValid) blockingIssues.push('pause_plan_not_valid');
  if (!resolved.killSwitchPlanValid) blockingIssues.push('kill_switch_plan_not_valid');
  if (!resolved.safeAuditPreservedOnRollback) blockingIssues.push('safe_audit_not_preserved_on_rollback');
  if (!resolved.limitedRolloutCanStopWithoutSchoolWideSideEffect) blockingIssues.push('limited_rollout_cannot_stop_without_school_wide_side_effect');

  return {
    ...resolved,
    ok: blockingIssues.length === 0,
    blockingIssues,
  };
}
