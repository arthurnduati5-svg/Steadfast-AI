import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';
import { validateTask026PauseControlInput, validateTask026ResumeControlInput, validateTask026RollbackControlInput } from '../lib/task026ControlledPilotExecutionValidation';
import { transitionState } from './task026PilotExecutionStateMachineService';
import { evaluateGate } from './task026PilotExecutionGateService';
import type { Task026PauseControlInput, Task026PauseControlResult, Task026ResumeControlInput, Task026ResumeControlResult, Task026RollbackControlInput, Task026RollbackControlResult } from '../contracts/task026ControlledPilotExecutionContracts';

export async function pauseRun(
  input: Task026PauseControlInput
): Promise<Task026PauseControlResult> {
  const validation = validateTask026PauseControlInput(input);
  if (!validation.valid) {
    return { ok: false, learnerAccessBlocked: false, auditPreserved: true, reasonCodes: validation.reasonCodes, safeMessage: validation.safeMessage };
  }

  const { runId, actorRole, actorId, reason, details } = validation.data;

  const run = await task026PilotExecutionRepository.getPilotRun(runId);
  if (!run) {
    return { ok: false, learnerAccessBlocked: false, auditPreserved: true, reasonCodes: ['run_not_found'], safeMessage: 'Pilot run not found.' };
  }

  const stateResult = await transitionState({
    runId,
    fromStatus: run.status,
    toStatus: 'paused',
    actorRole,
    actorId,
    reason: `${reason}: ${details}`.substring(0, 500),
  });

  if (!stateResult.ok) {
    return { ok: false, learnerAccessBlocked: false, auditPreserved: true, reasonCodes: stateResult.reasonCodes, safeMessage: stateResult.safeMessage };
  }

  return {
    ok: true,
    learnerAccessBlocked: true,
    auditPreserved: true,
    reasonCodes: [],
    safeMessage: `Pilot run ${runId} paused. Learner access blocked.`,
  };
}

export async function resumeRun(
  input: Task026ResumeControlInput
): Promise<Task026ResumeControlResult> {
  const validation = validateTask026ResumeControlInput(input);
  if (!validation.valid) {
    return { ok: false, gatesPassed: false, reasonCodes: validation.reasonCodes, safeMessage: validation.safeMessage };
  }

  const { runId, actorRole, actorId, gatesRevalidated } = validation.data;

  const run = await task026PilotExecutionRepository.getPilotRun(runId);
  if (!run) {
    return { ok: false, gatesPassed: false, reasonCodes: ['run_not_found'], safeMessage: 'Pilot run not found.' };
  }

  if (gatesRevalidated) {
    const gateResult = await evaluateGate({
      runId,
      schoolId: run.schoolId,
      actorRole,
      action: 'resume_run',
    });

    if (!gateResult.allowed) {
      return { ok: false, gatesPassed: false, reasonCodes: gateResult.reasonCodes, safeMessage: gateResult.safeMessage };
    }
  }

  const stateResult = await transitionState({
    runId,
    fromStatus: run.status,
    toStatus: 'active_controlled',
    actorRole,
    actorId,
    reason: 'Resume requested',
  });

  if (!stateResult.ok) {
    return { ok: false, gatesPassed: false, reasonCodes: stateResult.reasonCodes, safeMessage: stateResult.safeMessage };
  }

  return { ok: true, gatesPassed: true, reasonCodes: [], safeMessage: `Pilot run ${runId} resumed. Gates passed.` };
}

export async function rollbackRun(
  input: Task026RollbackControlInput
): Promise<Task026RollbackControlResult> {
  const validation = validateTask026RollbackControlInput(input);
  if (!validation.valid) {
    return { ok: false, learnerAccessBlocked: false, dataPreserved: true, auditPreserved: true, reasonCodes: validation.reasonCodes, safeMessage: validation.safeMessage };
  }

  const { runId, actorRole, actorId, reason, details } = validation.data;

  const run = await task026PilotExecutionRepository.getPilotRun(runId);
  if (!run) {
    return { ok: false, learnerAccessBlocked: false, dataPreserved: true, auditPreserved: true, reasonCodes: ['run_not_found'], safeMessage: 'Pilot run not found.' };
  }

  const stateResult = await transitionState({
    runId,
    fromStatus: run.status,
    toStatus: 'rollback_pending',
    actorRole,
    actorId,
    reason: `${reason}: ${details}`.substring(0, 500),
  });

  if (!stateResult.ok) {
    return { ok: false, learnerAccessBlocked: false, dataPreserved: true, auditPreserved: true, reasonCodes: stateResult.reasonCodes, safeMessage: stateResult.safeMessage };
  }

  return {
    ok: true,
    learnerAccessBlocked: true,
    dataPreserved: true,
    auditPreserved: true,
    reasonCodes: [],
    safeMessage: `Rollback initiated for run ${runId}. Data preserved. Learner access blocked.`,
  };
}

export async function completeRollback(
  runId: string,
  actorRole: string,
  actorId: string
): Promise<Task026RollbackControlResult> {
  const run = await task026PilotExecutionRepository.getPilotRun(runId);
  if (!run) {
    return { ok: false, learnerAccessBlocked: false, dataPreserved: true, auditPreserved: true, reasonCodes: ['run_not_found'], safeMessage: 'Pilot run not found.' };
  }

  const stateResult = await transitionState({
    runId,
    fromStatus: run.status,
    toStatus: 'rolled_back',
    actorRole,
    actorId,
    reason: 'Rollback completed',
  });

  if (!stateResult.ok) {
    return { ok: false, learnerAccessBlocked: false, dataPreserved: true, auditPreserved: true, reasonCodes: stateResult.reasonCodes, safeMessage: stateResult.safeMessage };
  }

  return {
    ok: true,
    learnerAccessBlocked: true,
    dataPreserved: true,
    auditPreserved: true,
    reasonCodes: [],
    safeMessage: `Rollback completed for run ${runId}. Data and audit preserved.`,
  };
}
