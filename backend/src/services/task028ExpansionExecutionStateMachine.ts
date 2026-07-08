import { task028ExpansionExecutionRepository } from '../repositories/task028ExpansionExecutionRepository';
import { VALID_EXECUTION_TRANSITIONS, EXPANSION_EXECUTION_STATUSES, nowISO } from '../contracts/task028ExpansionExecutionContracts';
import type { ExpansionExecutionStatus } from '../contracts/task028ExpansionExecutionContracts';

export async function transitionExecutionState(
  executionRunId: string,
  newStatus: ExpansionExecutionStatus,
  actorRole: string,
  actorIdHash?: string,
  requestId?: string,
): Promise<{ ok: boolean; reasonCodes: string[]; safeMessage: string }> {
  const run = await task028ExpansionExecutionRepository.getExecutionRun(executionRunId);
  if (!run) {
    return { ok: false, reasonCodes: ['execution_run_not_found'], safeMessage: 'Execution run not found.' };
  }

  const currentStatus = (run as any).status as ExpansionExecutionStatus;
  const allowedNext = VALID_EXECUTION_TRANSITIONS[currentStatus];

  if (!allowedNext || !allowedNext.includes(newStatus)) {
    return {
      ok: false,
      reasonCodes: ['invalid_state_transition', `from_${currentStatus}_to_${newStatus}`],
      safeMessage: `Cannot transition from ${currentStatus} to ${newStatus}.`,
    };
  }

  const now = new Date();
  const updateData: Record<string, unknown> = { status: newStatus };
  const ts = nowISO();

  switch (newStatus) {
    case 'preflight_required':
      break;
    case 'preflight_failed':
      break;
    case 'ready':
      break;
    case 'stage_1_active':
    case 'stage_2_active':
    case 'stage_3_active':
      if (typeof currentStatus === 'string' && (!currentStatus.startsWith('stage_') || !currentStatus.endsWith('_paused'))) {
        updateData.startedAt = now;
      }
      break;
    case 'stage_1_paused':
    case 'stage_2_paused':
      updateData.pausedAt = now;
      break;
    case 'paused':
      updateData.pausedAt = now;
      break;
    case 'rollback_requested':
      break;
    case 'rolled_back':
      updateData.rolledBackAt = now;
      break;
    case 'completed':
      updateData.completedAt = now;
      break;
    case 'blocked':
      break;
    case 'failed':
      break;
    default:
      if ((newStatus as string) === 'stage_3_paused') {
        updateData.pausedAt = now;
      }
      break;
  }

  await task028ExpansionExecutionRepository.updateExecutionRun(executionRunId, updateData);

  await task028ExpansionExecutionRepository.createAuditRecord({
    executionRunId,
    pilotProgramId: (run as any).pilotProgramId,
    schoolId: (run as any).schoolId,
    actorRole,
    actorIdHash,
    action: `state_transition_${newStatus}`,
    safeSummary: `Execution run ${executionRunId} transitioned from ${currentStatus} to ${newStatus}.`,
    metadataSafeJson: { fromStatus: currentStatus, toStatus: newStatus, timestamp: ts },
    requestId,
  });

  return { ok: true, reasonCodes: [], safeMessage: `Transitioned from ${currentStatus} to ${newStatus}.` };
}

export async function assertCanTransition(
  executionRunId: string,
  targetStatus: ExpansionExecutionStatus,
): Promise<{ ok: boolean; reasonCodes: string[]; safeMessage: string }> {
  const run = await task028ExpansionExecutionRepository.getExecutionRun(executionRunId);
  if (!run) {
    return { ok: false, reasonCodes: ['execution_run_not_found'], safeMessage: 'Execution run not found.' };
  }

  const currentStatus = (run as any).status as ExpansionExecutionStatus;
  const allowedNext = VALID_EXECUTION_TRANSITIONS[currentStatus];

  if (!allowedNext || !allowedNext.includes(targetStatus)) {
    return {
      ok: false,
      reasonCodes: ['invalid_state_transition', `from_${currentStatus}_to_${targetStatus}`],
      safeMessage: `Cannot transition from ${currentStatus} to ${targetStatus}.`,
    };
  }

  return { ok: true, reasonCodes: [], safeMessage: `Transition from ${currentStatus} to ${targetStatus} is allowed.` };
}

export { VALID_EXECUTION_TRANSITIONS, EXPANSION_EXECUTION_STATUSES };
