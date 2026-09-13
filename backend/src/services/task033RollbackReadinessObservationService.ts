import type { Task033RollbackReadinessObservationResult } from '../contracts/task033ControlledCanaryObservationContracts';
import { task033Repository } from '../repositories/task033ControlledCanaryObservationRepository';

export async function observeTask033RollbackReadiness(sessionId: string): Promise<Task033RollbackReadinessObservationResult> {
  const session = await task033Repository.getSession(sessionId);
  const events = await task033Repository.listEvents(sessionId);
  const blockingIssues: string[] = [];

  const rollbackEvents = events.filter(e => e.gateName === 'rollback_readiness');
  const rollbackPassed = rollbackEvents.filter(e => e.gatePassed);

  const rollbackAvailable = rollbackPassed.some(e => e.eventType === 'rollback_available');
  const pauseAvailable = rollbackPassed.some(e => e.eventType === 'pause_available');
  const killSwitchAvailable = rollbackPassed.some(e => e.eventType === 'kill_switch_available');
  const rollbackPlanStillValid = rollbackPassed.some(e => e.eventType === 'rollback_plan_valid');
  const rollbackOwnerAssigned = rollbackPassed.some(e => e.eventType === 'rollback_owner_assigned');
  const runtimeBlockableByRollback = rollbackPassed.some(e => e.eventType === 'runtime_blockable_by_rollback');
  const safeAuditSummaryPreservedOnRollback = rollbackPassed.some(e => e.eventType === 'safe_audit_preserved_on_rollback');

  if (!rollbackAvailable) blockingIssues.push('rollback_not_available');
  if (!pauseAvailable) blockingIssues.push('pause_not_available');
  if (!killSwitchAvailable) blockingIssues.push('kill_switch_not_available');
  if (!rollbackPlanStillValid) blockingIssues.push('rollback_plan_not_valid');
  if (!rollbackOwnerAssigned) blockingIssues.push('rollback_owner_not_assigned');
  if (!runtimeBlockableByRollback) blockingIssues.push('runtime_not_blockable_by_rollback');
  if (!safeAuditSummaryPreservedOnRollback) blockingIssues.push('safe_audit_not_preserved_on_rollback');

  const result: Task033RollbackReadinessObservationResult = {
    ok: blockingIssues.length === 0,
    rollbackAvailable,
    pauseAvailable,
    killSwitchAvailable,
    rollbackPlanStillValid,
    rollbackOwnerAssigned,
    runtimeBlockableByRollback,
    safeAuditSummaryPreservedOnRollback,
    blockingIssues,
  };

  await task033Repository.recordRollbackReadinessObservation(result);
  return result;
}
