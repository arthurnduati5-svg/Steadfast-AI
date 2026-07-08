import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';
import { validateTask026ExecutionStateTransition } from '../lib/task026ControlledPilotExecutionValidation';
import { ALLOWED_EXECUTION_TRANSITIONS } from '../contracts/task026ControlledPilotExecutionContracts';
import type { Task026ExecutionStatus, Task026ExecutionStateTransition } from '../contracts/task026ControlledPilotExecutionContracts';

export async function canTransition(
  currentStatus: Task026ExecutionStatus,
  targetStatus: Task026ExecutionStatus
): Promise<boolean> {
  const allowed = ALLOWED_EXECUTION_TRANSITIONS[currentStatus];
  if (!allowed) return false;
  return allowed.includes(targetStatus);
}

export async function assertAllowedTransition(
  currentStatus: Task026ExecutionStatus,
  targetStatus: Task026ExecutionStatus
): Promise<{ ok: boolean; reasonCodes: string[]; safeMessage: string }> {
  const allowed = await canTransition(currentStatus, targetStatus);
  if (!allowed) {
    return {
      ok: false,
      reasonCodes: ['invalid_state_transition', `from_${currentStatus}_to_${targetStatus}`],
      safeMessage: `Cannot transition from ${currentStatus} to ${targetStatus}.`,
    };
  }
  return { ok: true, reasonCodes: [], safeMessage: `Transition from ${currentStatus} to ${targetStatus} is allowed.` };
}

export async function transitionState(
  input: Task026ExecutionStateTransition
): Promise<{ ok: boolean; reasonCodes: string[]; safeMessage: string }> {
  const validation = validateTask026ExecutionStateTransition(input);
  if (!validation.valid) {
    return { ok: false, reasonCodes: validation.reasonCodes, safeMessage: validation.safeMessage };
  }

  const { runId, fromStatus, toStatus, actorRole, actorId } = validation.data;

  const run = await task026PilotExecutionRepository.getPilotRun(runId);
  if (!run) {
    return { ok: false, reasonCodes: ['run_not_found'], safeMessage: 'Pilot run not found.' };
  }

  const currentStatus = run.status;
  const allowed = await canTransition(currentStatus, toStatus);
  if (!allowed) {
    return {
      ok: false,
      reasonCodes: ['invalid_state_transition', `from_${currentStatus}_to_${toStatus}`],
      safeMessage: `Cannot transition from ${currentStatus} to ${toStatus}.`,
    };
  }

  const extraFields: Record<string, string | null> = {};
  if (toStatus === 'active_controlled') {
    extraFields.activatedAt = new Date().toISOString();
  } else if (toStatus === 'paused') {
    extraFields.pausedAt = new Date().toISOString();
  } else if (toStatus === 'rolled_back') {
    extraFields.rolledBackAt = new Date().toISOString();
  } else if (toStatus === 'completed') {
    extraFields.completedAt = new Date().toISOString();
  } else if (toStatus === 'cancelled') {
    extraFields.cancelledAt = new Date().toISOString();
  }

  await task026PilotExecutionRepository.updatePilotRunStatus(runId, toStatus, extraFields);

  let auditAction: string;
  switch (toStatus) {
    case 'preflight_pending': auditAction = 'run_created'; break;
    case 'ready': auditAction = 'run_activated'; break;
    case 'active_controlled': auditAction = 'run_activated'; break;
    case 'paused': auditAction = 'run_paused'; break;
    case 'rollback_pending': auditAction = 'rollback_requested'; break;
    case 'rolled_back': auditAction = 'run_rolled_back'; break;
    case 'completed': auditAction = 'run_completed'; break;
    case 'cancelled': auditAction = 'run_cancelled'; break;
    case 'blocked': auditAction = 'run_blocked'; break;
    default: auditAction = `state_transition_${toStatus}`;
  }

  await task026PilotExecutionRepository.recordAuditEvent({
    runId,
    schoolId: run.schoolId,
    actorRole,
    action: auditAction as any,
    safeSummary: `Pilot run ${runId} transitioned from ${currentStatus} to ${toStatus}.`,
    metadataSafeJson: { fromStatus: currentStatus, toStatus, actorId },
  });

  return { ok: true, reasonCodes: [], safeMessage: `Transitioned from ${currentStatus} to ${toStatus}.` };
}

export async function getCurrentStatus(
  runId: string
): Promise<{ status: Task026ExecutionStatus | null; ok: boolean; reasonCodes: string[]; safeMessage: string }> {
  const run = await task026PilotExecutionRepository.getPilotRun(runId);
  if (!run) {
    return { status: null, ok: false, reasonCodes: ['run_not_found'], safeMessage: 'Pilot run not found.' };
  }
  return { status: run.status, ok: true, reasonCodes: [], safeMessage: `Current status: ${run.status}.` };
}
