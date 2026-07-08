import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';
import { validateTask026ExecutionGateInput, isTask026ControlRole } from '../lib/task026ControlledPilotExecutionValidation';
import type { Task026ExecutionGateInput, Task026ExecutionGateResult } from '../contracts/task026ControlledPilotExecutionContracts';

export async function evaluateGate(
  input: Task026ExecutionGateInput
): Promise<Task026ExecutionGateResult> {
  const validation = validateTask026ExecutionGateInput(input);
  if (!validation.valid) {
    return {
      allowed: false,
      reasonCodes: validation.reasonCodes,
      safeMessage: validation.safeMessage,
      gateResults: {},
    };
  }

  const { runId, schoolId, actorRole } = validation.data;
  const run = await task026PilotExecutionRepository.getPilotRun(runId);
  const gateResults: Record<string, boolean> = {};
  const reasonCodes: string[] = [];

  const schoolVerified = schoolId !== '' && run !== null && run.schoolId === schoolId;
  gateResults.school_verified = schoolVerified;
  if (!schoolVerified) reasonCodes.push('school_not_verified');

  const schoolOk = schoolVerified;

  const task025Ready = run !== null;
  gateResults.task025_ready = task025Ready;
  if (!task025Ready) reasonCodes.push('task025_not_found');

  const runBelongsToSchool = run !== null && run.schoolId === schoolId;
  gateResults.run_belongs_to_school = runBelongsToSchool;
  if (!runBelongsToSchool) reasonCodes.push('run_not_in_school');

  const statusAllowsAction = run !== null && run.status !== 'rolled_back' && run.status !== 'blocked' && run.status !== 'cancelled' && run.status !== 'completed';
  gateResults.status_allows_action = statusAllowsAction;
  if (!statusAllowsAction) reasonCodes.push('status_blocks_action', `status_${run?.status}`);

  const actorAuthorized = isTask026ControlRole(actorRole);
  gateResults.actor_authorized = actorAuthorized;
  if (!actorAuthorized) reasonCodes.push('actor_not_authorized', `role_${actorRole}`);

  const cohortApproved = run !== null && run.cohortIds.length > 0;
  gateResults.cohort_approved = cohortApproved;
  if (!cohortApproved) reasonCodes.push('no_approved_cohorts');

  const teacherOwnerAssigned = run !== null && run.teacherOwnerId !== '';
  gateResults.teacher_owner_assigned = teacherOwnerAssigned;
  if (!teacherOwnerAssigned) reasonCodes.push('teacher_owner_not_assigned');

  const supportOwnerAssigned = run !== null && run.supportOwnerId !== '';
  gateResults.support_owner_assigned = supportOwnerAssigned;
  if (!supportOwnerAssigned) reasonCodes.push('support_owner_not_assigned');

  const safeguardingOwnerAssigned = run !== null && run.safeguardingOwnerId !== '';
  gateResults.safeguarding_owner_assigned = safeguardingOwnerAssigned;
  if (!safeguardingOwnerAssigned) reasonCodes.push('safeguarding_owner_not_assigned');

  const pauseOwnerAssigned = run !== null && run.pauseOwnerId !== '';
  gateResults.pause_owner_assigned = pauseOwnerAssigned;
  if (!pauseOwnerAssigned) reasonCodes.push('pause_owner_not_assigned');

  const rollbackOwnerAssigned = run !== null && run.rollbackOwnerId !== '';
  gateResults.rollback_owner_assigned = rollbackOwnerAssigned;
  if (!rollbackOwnerAssigned) reasonCodes.push('rollback_owner_not_assigned');

  const contentGovernanceOk = run !== null && run.approvedCurriculumScopeIds.length > 0 && run.approvedSourceScopeIds.length > 0;
  gateResults.content_governance_ok = contentGovernanceOk;
  if (!contentGovernanceOk) reasonCodes.push('content_governance_not_ready');

  const operationsMonitoringOk = schoolOk && run !== null;
  gateResults.operations_monitoring_ok = operationsMonitoringOk;
  if (!operationsMonitoringOk) reasonCodes.push('operations_monitoring_not_ready');

  const privacyGuardOk = schoolOk;
  gateResults.privacy_guard_ok = privacyGuardOk;
  if (!privacyGuardOk) reasonCodes.push('privacy_guard_blocked');

  const allowed = Object.values(gateResults).every(Boolean);
  const safeMessage = allowed
    ? 'All execution gates passed.'
    : `Execution gates blocked: ${reasonCodes.join(', ')}.`;

  return { allowed, reasonCodes, safeMessage, gateResults };
}
