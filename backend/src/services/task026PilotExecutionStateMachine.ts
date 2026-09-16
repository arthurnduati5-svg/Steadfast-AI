import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';
import { task025PilotRepository } from '../repositories/task025PilotRepository';
import { PILOT_EXECUTION_STATUSES } from '../contracts/task026PilotExecutionContracts';
import type { PilotExecutionStatus } from '../contracts/task026PilotExecutionContracts';

type InternalPilotStatus = PilotExecutionStatus | 'starting' | 'resuming' | 'rollback_requested' | 'failed'

const VALID_TRANSITIONS: Record<InternalPilotStatus, InternalPilotStatus[]> = {
  not_started: ['starting', 'blocked', 'failed'],
  starting: ['active', 'blocked', 'failed'],
  active: ['paused', 'rollback_requested', 'completed', 'blocked', 'failed'],
  paused: ['resuming', 'rollback_requested', 'blocked', 'failed'],
  resuming: ['active', 'blocked', 'failed'],
  rollback_requested: ['rolled_back', 'blocked', 'failed'],
  rolled_back: ['blocked', 'failed'],
  completed: ['blocked', 'failed'],
  cancelled: [],
  blocked: [],
  failed: [],
};

export async function transitionExecutionState(
  executionRunId: string,
  newStatus: InternalPilotStatus,
  actorRole: string,
  actorIdHash?: string,
  requestId?: string,
): Promise<{ ok: boolean; reasonCodes: string[]; safeMessage: string }> {
  const run = await task026PilotExecutionRepository.getExecutionRun(executionRunId);
  if (!run) {
    return { ok: false, reasonCodes: ['execution_run_not_found'], safeMessage: 'Execution run not found.' };
  }

  const currentStatus = (run as any).status as InternalPilotStatus;
  const allowedNext = VALID_TRANSITIONS[currentStatus];

  if (!allowedNext || !allowedNext.includes(newStatus)) {
    return {
      ok: false,
      reasonCodes: ['invalid_state_transition', `from_${currentStatus}_to_${newStatus}`],
      safeMessage: `Cannot transition from ${currentStatus} to ${newStatus}.`,
    };
  }

  const now = new Date();
  const updateData: Record<string, unknown> = { status: newStatus };

  switch (newStatus) {
    case 'starting':
      updateData.startedByRole = actorRole;
      updateData.startedByActorIdHash = actorIdHash ?? null;
      break;
    case 'active':
      updateData.startedAt = now;
      break;
    case 'paused':
      updateData.pausedAt = now;
      break;
    case 'resuming':
      break;
    case 'rollback_requested':
      break;
    case 'rolled_back':
      updateData.rolledBackAt = now;
      break;
    case 'completed':
      updateData.completedAt = now;
      break;
  }

  await task026PilotExecutionRepository.updateExecutionRun(executionRunId, updateData);

  await task026PilotExecutionRepository.createAuditRecord({
    executionRunId,
    pilotProgramId: (run as any).pilotProgramId,
    schoolId: (run as any).schoolId,
    actorRole,
    actorIdHash,
    action: `state_transition_${newStatus}`,
    safeSummary: `Execution run ${executionRunId} transitioned from ${currentStatus} to ${newStatus}.`,
    requestId,
  });

  return { ok: true, reasonCodes: [], safeMessage: `Transitioned from ${currentStatus} to ${newStatus}.` };
}

export async function assertCanTransition(
  executionRunId: string,
  targetStatus: InternalPilotStatus,
): Promise<{ ok: boolean; reasonCodes: string[]; safeMessage: string }> {
  const run = await task026PilotExecutionRepository.getExecutionRun(executionRunId);
  if (!run) {
    return { ok: false, reasonCodes: ['execution_run_not_found'], safeMessage: 'Execution run not found.' };
  }

  const currentStatus = (run as any).status as InternalPilotStatus;
  const allowedNext = VALID_TRANSITIONS[currentStatus];

  if (!allowedNext || !allowedNext.includes(targetStatus)) {
    return {
      ok: false,
      reasonCodes: ['invalid_state_transition', `from_${currentStatus}_to_${targetStatus}`],
      safeMessage: `Cannot transition from ${currentStatus} to ${targetStatus}.`,
    };
  }

  return { ok: true, reasonCodes: [], safeMessage: `Transition from ${currentStatus} to ${targetStatus} is allowed.` };
}

export { PILOT_EXECUTION_STATUSES, VALID_TRANSITIONS };
export type { InternalPilotStatus };
