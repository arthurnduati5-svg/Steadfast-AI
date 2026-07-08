import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';
import { validateTask026ControlledPilotRunInput, validateTask026PauseControlInput, validateTask026ResumeControlInput, validateTask026RollbackControlInput } from '../lib/task026ControlledPilotExecutionValidation';
import { transitionState, assertAllowedTransition } from './task026PilotExecutionStateMachineService';
import { evaluateGate } from './task026PilotExecutionGateService';
import type { Task026ControlledPilotRunInput } from '../contracts/task026ControlledPilotExecutionContracts';
import type { Task026PauseControlResult, Task026ResumeControlResult, Task026RollbackControlResult } from '../contracts/task026ControlledPilotExecutionContracts';

export async function createPilotRun(
  input: Task026ControlledPilotRunInput
): Promise<{ ok: boolean; run?: any; reasonCodes: string[]; safeMessage: string }> {
  const validation = validateTask026ControlledPilotRunInput(input);
  if (!validation.valid) {
    return { ok: false, reasonCodes: validation.reasonCodes, safeMessage: validation.safeMessage };
  }

  const data = validation.data;
  const run = await task026PilotExecutionRepository.createPilotRun({
    schoolId: data.schoolId,
    pilotProgramId: data.pilotProgramId,
    status: 'draft',
    cohortIds: data.cohortIds,
    teacherOwnerId: data.teacherOwnerId,
    supportOwnerId: data.supportOwnerId,
    safeguardingOwnerId: data.safeguardingOwnerId,
    pauseOwnerId: data.pauseOwnerId,
    rollbackOwnerId: data.rollbackOwnerId,
    monitoringOwnerId: data.monitoringOwnerId,
    approvedCurriculumScopeIds: data.approvedCurriculumScopeIds,
    approvedSourceScopeIds: data.approvedSourceScopeIds,
    activatedAt: null,
    pausedAt: null,
    rolledBackAt: null,
    completedAt: null,
    cancelledAt: null,
    blockingIssues: [],
  });

  await task026PilotExecutionRepository.recordAuditEvent({
    runId: run.id,
    schoolId: run.schoolId,
    actorRole: data.actorRole,
    action: 'run_created',
    safeSummary: `Pilot run ${run.id} created.`,
    metadataSafeJson: { actorId: data.actorId },
  });

  return { ok: true, run, reasonCodes: [], safeMessage: `Pilot run ${run.id} created.` };
}

export async function activatePilotRun(
  runId: string,
  actorRole: string,
  actorId: string
): Promise<{ ok: boolean; reasonCodes: string[]; safeMessage: string }> {
  const run = await task026PilotExecutionRepository.getPilotRun(runId);
  if (!run) {
    return { ok: false, reasonCodes: ['run_not_found'], safeMessage: 'Pilot run not found.' };
  }

  const gateResult = await evaluateGate({
    runId,
    schoolId: run.schoolId,
    actorRole,
    action: 'activate_run',
  });

  if (!gateResult.allowed) {
    return { ok: false, reasonCodes: gateResult.reasonCodes, safeMessage: gateResult.safeMessage };
  }

  const assertion = await assertAllowedTransition(run.status, 'active_controlled');
  if (!assertion.ok) {
    return assertion;
  }

  const stateResult = await transitionState({
    runId,
    fromStatus: run.status,
    toStatus: 'active_controlled',
    actorRole,
    actorId,
    reason: 'Activation requested',
  });

  if (!stateResult.ok) {
    return stateResult;
  }

  return { ok: true, reasonCodes: [], safeMessage: `Pilot run ${runId} activated.` };
}

export async function pausePilotRun(
  runId: string,
  actorRole: string,
  actorId: string,
  reason: string,
  details: string
): Promise<Task026PauseControlResult> {
  const validation = validateTask026PauseControlInput({ runId, actorRole, actorId, reason: reason as any, details });
  if (!validation.valid) {
    return { ok: false, learnerAccessBlocked: false, auditPreserved: true, reasonCodes: validation.reasonCodes, safeMessage: validation.safeMessage };
  }

  const run = await task026PilotExecutionRepository.getPilotRun(runId);
  if (!run) {
    return { ok: false, learnerAccessBlocked: false, auditPreserved: true, reasonCodes: ['run_not_found'], safeMessage: 'Pilot run not found.' };
  }

  const assertion = await assertAllowedTransition(run.status, 'paused');
  if (!assertion.ok) {
    return { ok: false, learnerAccessBlocked: false, auditPreserved: true, reasonCodes: assertion.reasonCodes, safeMessage: assertion.safeMessage };
  }

  const stateResult = await transitionState({
    runId,
    fromStatus: run.status,
    toStatus: 'paused',
    actorRole,
    actorId,
    reason: validation.data.reason,
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

export async function resumePilotRun(
  runId: string,
  actorRole: string,
  actorId: string
): Promise<Task026ResumeControlResult> {
  const validation = validateTask026ResumeControlInput({ runId, actorRole, actorId, gatesRevalidated: true });
  if (!validation.valid) {
    return { ok: false, gatesPassed: false, reasonCodes: validation.reasonCodes, safeMessage: validation.safeMessage };
  }

  const run = await task026PilotExecutionRepository.getPilotRun(runId);
  if (!run) {
    return { ok: false, gatesPassed: false, reasonCodes: ['run_not_found'], safeMessage: 'Pilot run not found.' };
  }

  const gateResult = await evaluateGate({
    runId,
    schoolId: run.schoolId,
    actorRole,
    action: 'resume_run',
  });

  if (!gateResult.allowed) {
    return { ok: false, gatesPassed: false, reasonCodes: gateResult.reasonCodes, safeMessage: gateResult.safeMessage };
  }

  const assertion = await assertAllowedTransition(run.status, 'active_controlled');
  if (!assertion.ok) {
    return { ok: false, gatesPassed: false, reasonCodes: assertion.reasonCodes, safeMessage: assertion.safeMessage };
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

export async function rollbackPilotRun(
  runId: string,
  actorRole: string,
  actorId: string,
  reason: string,
  details: string
): Promise<Task026RollbackControlResult> {
  const validation = validateTask026RollbackControlInput({ runId, actorRole, actorId, reason: reason as any, details });
  if (!validation.valid) {
    return { ok: false, learnerAccessBlocked: false, dataPreserved: true, auditPreserved: true, reasonCodes: validation.reasonCodes, safeMessage: validation.safeMessage };
  }

  const run = await task026PilotExecutionRepository.getPilotRun(runId);
  if (!run) {
    return { ok: false, learnerAccessBlocked: false, dataPreserved: true, auditPreserved: true, reasonCodes: ['run_not_found'], safeMessage: 'Pilot run not found.' };
  }

  const assertion = await assertAllowedTransition(run.status, 'rollback_pending');
  if (!assertion.ok) {
    return { ok: false, learnerAccessBlocked: false, dataPreserved: true, auditPreserved: true, reasonCodes: assertion.reasonCodes, safeMessage: assertion.safeMessage };
  }

  const stateResult = await transitionState({
    runId,
    fromStatus: run.status,
    toStatus: 'rollback_pending',
    actorRole,
    actorId,
    reason: validation.data.reason,
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
    safeMessage: `Rollback pending for run ${runId}. Learner access blocked.`,
  };
}

export async function completePilotRun(
  runId: string,
  actorRole: string,
  actorId: string
): Promise<{ ok: boolean; reasonCodes: string[]; safeMessage: string }> {
  const run = await task026PilotExecutionRepository.getPilotRun(runId);
  if (!run) {
    return { ok: false, reasonCodes: ['run_not_found'], safeMessage: 'Pilot run not found.' };
  }

  const assertion = await assertAllowedTransition(run.status, 'completed');
  if (!assertion.ok) {
    return assertion;
  }

  return transitionState({
    runId,
    fromStatus: run.status,
    toStatus: 'completed',
    actorRole,
    actorId,
    reason: 'Completion requested',
  });
}

export async function cancelPilotRun(
  runId: string,
  actorRole: string,
  actorId: string
): Promise<{ ok: boolean; reasonCodes: string[]; safeMessage: string }> {
  const run = await task026PilotExecutionRepository.getPilotRun(runId);
  if (!run) {
    return { ok: false, reasonCodes: ['run_not_found'], safeMessage: 'Pilot run not found.' };
  }

  const assertion = await assertAllowedTransition(run.status, 'cancelled');
  if (!assertion.ok) {
    return assertion;
  }

  return transitionState({
    runId,
    fromStatus: run.status,
    toStatus: 'cancelled',
    actorRole,
    actorId,
    reason: 'Cancellation requested',
  });
}

export async function killSwitch(
  runId: string,
  actorRole: string,
  actorId: string
): Promise<{ ok: boolean; learnerAccessBlocked: boolean; auditPreserved: boolean; reasonCodes: string[]; safeMessage: string }> {
  const run = await task026PilotExecutionRepository.getPilotRun(runId);
  if (!run) {
    return { ok: false, learnerAccessBlocked: false, auditPreserved: true, reasonCodes: ['run_not_found'], safeMessage: 'Pilot run not found.' };
  }

  const stateResult = await transitionState({
    runId,
    fromStatus: run.status,
    toStatus: 'blocked',
    actorRole,
    actorId,
    reason: 'Kill switch engaged',
  });

  if (!stateResult.ok) {
    return { ok: false, learnerAccessBlocked: false, auditPreserved: true, reasonCodes: stateResult.reasonCodes, safeMessage: stateResult.safeMessage };
  }

  return {
    ok: true,
    learnerAccessBlocked: true,
    auditPreserved: true,
    reasonCodes: [],
    safeMessage: `Kill switch engaged for run ${runId}. All access blocked.`,
  };
}
