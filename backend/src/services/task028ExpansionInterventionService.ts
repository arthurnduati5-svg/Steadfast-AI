import { task028ExpansionExecutionRepository } from '../repositories/task028ExpansionExecutionRepository';
import { transitionExecutionState } from './task028ExpansionExecutionStateMachine';
import { nowISO } from '../contracts/task028ExpansionExecutionContracts';
import type { ExpansionInterventionType } from '../contracts/task028ExpansionExecutionContracts';

export interface InterventionResult {
  ok: boolean;
  interventionId?: string;
  previousStatus?: string;
  newStatus?: string;
  studentAccessBlocked: boolean;
  reasonCodes: string[];
  safeMessage: string;
}

function canPerformControlAction(actorRole: string): boolean {
  return actorRole === 'admin' || actorRole === 'operator';
}

async function getBeforeSnapshot(executionRunId: string): Promise<Record<string, unknown>> {
  const run = await task028ExpansionExecutionRepository.getExecutionRun(executionRunId);
  if (!run) return {};
  const r = run as any;
  return {
    status: r.status,
    currentStage: r.currentStage,
    killSwitchEnabled: r.killSwitchEnabled ?? false,
    timestamp: nowISO(),
  };
}

export async function pauseExpansion(
  executionRunId: string,
  actorRole: string,
  actorIdHash?: string,
  requestId?: string,
): Promise<InterventionResult> {
  if (!canPerformControlAction(actorRole)) {
    return { ok: false, studentAccessBlocked: false, reasonCodes: ['admin_or_operator_only'], safeMessage: 'Only admin or operator can pause expansion.' };
  }

  const beforeSnapshot = await getBeforeSnapshot(executionRunId);
  const run = await task028ExpansionExecutionRepository.getExecutionRun(executionRunId);
  if (!run) {
    return { ok: false, studentAccessBlocked: false, reasonCodes: ['execution_run_not_found'], safeMessage: 'Execution run not found.' };
  }
  const runAny = run as any;
  const previousStatus = runAny.status;

  const transition = await transitionExecutionState(executionRunId, 'paused', actorRole, actorIdHash, requestId);
  if (!transition.ok) {
    return { ok: false, studentAccessBlocked: false, reasonCodes: transition.reasonCodes, safeMessage: transition.safeMessage };
  }

  const afterSnapshot = await getBeforeSnapshot(executionRunId);

  const intervention = await task028ExpansionExecutionRepository.createInterventionRecord({
    executionRunId,
    pilotProgramId: runAny.pilotProgramId,
    schoolId: runAny.schoolId,
    interventionType: 'pause_execution',
    actorRole,
    actorIdHash,
    safeSummary: `Expansion paused by ${actorRole}.`,
    beforeSnapshot,
    afterSnapshot,
    metadataSafeJson: { timestamp: nowISO(), requestId: requestId ?? null },
  });

  await task028ExpansionExecutionRepository.createAuditRecord({
    executionRunId,
    pilotProgramId: runAny.pilotProgramId,
    schoolId: runAny.schoolId,
    actorRole,
    actorIdHash,
    action: 'expansion_paused',
    safeSummary: `Expansion paused by ${actorRole}. New sessions blocked.`,
    metadataSafeJson: { beforeSnapshot, afterSnapshot, timestamp: nowISO() },
    requestId,
  });

  return {
    ok: true,
    interventionId: (intervention as any).id,
    previousStatus,
    newStatus: 'paused',
    studentAccessBlocked: true,
    reasonCodes: [],
    safeMessage: 'Expansion paused. New expanded sessions blocked.',
  };
}

export async function resumeExpansion(
  executionRunId: string,
  actorRole: string,
  actorIdHash?: string,
  requestId?: string,
): Promise<InterventionResult> {
  if (!canPerformControlAction(actorRole)) {
    return { ok: false, studentAccessBlocked: false, reasonCodes: ['admin_or_operator_only'], safeMessage: 'Only admin or operator can resume expansion.' };
  }

  const beforeSnapshot = await getBeforeSnapshot(executionRunId);
  const run = await task028ExpansionExecutionRepository.getExecutionRun(executionRunId);
  if (!run) {
    return { ok: false, studentAccessBlocked: false, reasonCodes: ['execution_run_not_found'], safeMessage: 'Execution run not found.' };
  }
  const runAny = run as any;
  const previousStatus = runAny.status;

  const targetStatus: string = (runAny.status === 'stage_1_paused' || previousStatus === 'stage_1_paused')
    ? 'stage_1_active'
    : (runAny.status === 'stage_2_paused' || previousStatus === 'stage_2_paused')
      ? 'stage_2_active'
      : (runAny.status === 'stage_3_paused' || previousStatus === 'stage_3_paused')
        ? 'stage_3_active'
        : 'stage_1_active';

  const transition = await transitionExecutionState(executionRunId, targetStatus as any, actorRole, actorIdHash, requestId);
  if (!transition.ok) {
    return { ok: false, studentAccessBlocked: false, reasonCodes: transition.reasonCodes, safeMessage: transition.safeMessage };
  }

  const afterSnapshot = await getBeforeSnapshot(executionRunId);

  const intervention = await task028ExpansionExecutionRepository.createInterventionRecord({
    executionRunId,
    pilotProgramId: runAny.pilotProgramId,
    schoolId: runAny.schoolId,
    interventionType: 'resume_execution',
    actorRole,
    actorIdHash,
    safeSummary: `Expansion resumed by ${actorRole}. All gates passed.`,
    beforeSnapshot,
    afterSnapshot,
    metadataSafeJson: { timestamp: nowISO(), requestId: requestId ?? null },
  });

  await task028ExpansionExecutionRepository.createAuditRecord({
    executionRunId,
    pilotProgramId: runAny.pilotProgramId,
    schoolId: runAny.schoolId,
    actorRole,
    actorIdHash,
    action: 'expansion_resumed',
    safeSummary: `Expansion resumed by ${actorRole}. Gates re-verified.`,
    metadataSafeJson: { beforeSnapshot, afterSnapshot, timestamp: nowISO() },
    requestId,
  });

  return {
    ok: true,
    interventionId: (intervention as any).id,
    previousStatus,
    newStatus: targetStatus,
    studentAccessBlocked: false,
    reasonCodes: [],
    safeMessage: 'Expansion resumed. All gates passed.',
  };
}

export async function enableKillSwitch(
  executionRunId: string,
  actorRole: string,
  actorIdHash?: string,
  requestId?: string,
): Promise<InterventionResult> {
  if (!canPerformControlAction(actorRole)) {
    return { ok: false, studentAccessBlocked: false, reasonCodes: ['admin_or_operator_only'], safeMessage: 'Only admin or operator can enable kill switch.' };
  }

  const beforeSnapshot = await getBeforeSnapshot(executionRunId);
  const run = await task028ExpansionExecutionRepository.getExecutionRun(executionRunId);
  if (!run) {
    return { ok: false, studentAccessBlocked: false, reasonCodes: ['execution_run_not_found'], safeMessage: 'Execution run not found.' };
  }
  const runAny = run as any;
  const previousStatus = runAny.status;

  await task028ExpansionExecutionRepository.updateExecutionRun(executionRunId, { status: 'blocked', killSwitchEnabled: true });

  const afterSnapshot = await getBeforeSnapshot(executionRunId);

  const intervention = await task028ExpansionExecutionRepository.createInterventionRecord({
    executionRunId,
    pilotProgramId: runAny.pilotProgramId,
    schoolId: runAny.schoolId,
    interventionType: 'kill_switch_enable',
    actorRole,
    actorIdHash,
    safeSummary: `Kill switch enabled by ${actorRole}.`,
    reasonCodes: ['kill_switch_engaged'],
    beforeSnapshot,
    afterSnapshot,
    metadataSafeJson: { timestamp: nowISO(), requestId: requestId ?? null },
  });

  await task028ExpansionExecutionRepository.createAuditRecord({
    executionRunId,
    pilotProgramId: runAny.pilotProgramId,
    schoolId: runAny.schoolId,
    actorRole,
    actorIdHash,
    action: 'kill_switch_engaged',
    safeSummary: `Kill switch enabled by ${actorRole}. All expanded sessions blocked immediately.`,
    metadataSafeJson: { beforeSnapshot, afterSnapshot, timestamp: nowISO() },
    requestId,
  });

  return {
    ok: true,
    interventionId: (intervention as any).id,
    previousStatus,
    newStatus: 'blocked',
    studentAccessBlocked: true,
    reasonCodes: [],
    safeMessage: 'Kill switch enabled. All expanded sessions blocked immediately.',
  };
}

export async function disableKillSwitch(
  executionRunId: string,
  actorRole: string,
  actorIdHash?: string,
  requestId?: string,
): Promise<InterventionResult> {
  if (actorRole !== 'admin') {
    return { ok: false, studentAccessBlocked: false, reasonCodes: ['admin_only'], safeMessage: 'Only admin can disable kill switch.' };
  }

  const beforeSnapshot = await getBeforeSnapshot(executionRunId);
  const run = await task028ExpansionExecutionRepository.getExecutionRun(executionRunId);
  if (!run) {
    return { ok: false, studentAccessBlocked: false, reasonCodes: ['execution_run_not_found'], safeMessage: 'Execution run not found.' };
  }
  const runAny = run as any;
  const previousStatus = runAny.status;

  await task028ExpansionExecutionRepository.updateExecutionRun(executionRunId, { status: 'paused', killSwitchEnabled: false });

  const afterSnapshot = await getBeforeSnapshot(executionRunId);

  const intervention = await task028ExpansionExecutionRepository.createInterventionRecord({
    executionRunId,
    pilotProgramId: runAny.pilotProgramId,
    schoolId: runAny.schoolId,
    interventionType: 'kill_switch_disable',
    actorRole,
    actorIdHash,
    safeSummary: `Kill switch disabled by admin ${actorRole}.`,
    beforeSnapshot,
    afterSnapshot,
    metadataSafeJson: { timestamp: nowISO(), requestId: requestId ?? null },
  });

  await task028ExpansionExecutionRepository.createAuditRecord({
    executionRunId,
    pilotProgramId: runAny.pilotProgramId,
    schoolId: runAny.schoolId,
    actorRole,
    actorIdHash,
    action: 'kill_switch_disabled',
    safeSummary: `Kill switch disabled by admin ${actorRole}. Expansion moved to paused.`,
    metadataSafeJson: { beforeSnapshot, afterSnapshot, timestamp: nowISO() },
    requestId,
  });

  return {
    ok: true,
    interventionId: (intervention as any).id,
    previousStatus,
    newStatus: 'paused',
    studentAccessBlocked: true,
    reasonCodes: [],
    safeMessage: 'Kill switch disabled. Expansion moved to paused state.',
  };
}

export async function requestIntervention(
  executionRunId: string,
  interventionType: ExpansionInterventionType,
  actorRole: string,
  actorIdHash?: string,
  safeSummary?: string,
  requestId?: string,
): Promise<InterventionResult> {
  const beforeSnapshot = await getBeforeSnapshot(executionRunId);
  const run = await task028ExpansionExecutionRepository.getExecutionRun(executionRunId);
  if (!run) {
    return { ok: false, studentAccessBlocked: false, reasonCodes: ['execution_run_not_found'], safeMessage: 'Execution run not found.' };
  }
  const runAny = run as any;

  const intervention = await task028ExpansionExecutionRepository.createInterventionRecord({
    executionRunId,
    pilotProgramId: runAny.pilotProgramId,
    schoolId: runAny.schoolId,
    interventionType,
    status: 'requested',
    actorRole,
    actorIdHash,
    safeSummary: safeSummary || `Intervention ${interventionType} requested by ${actorRole}.`,
    beforeSnapshot,
    metadataSafeJson: { timestamp: nowISO(), requestId: requestId ?? null },
  });

  await task028ExpansionExecutionRepository.createAuditRecord({
    executionRunId,
    pilotProgramId: runAny.pilotProgramId,
    schoolId: runAny.schoolId,
    actorRole,
    actorIdHash,
    action: `intervention_requested_${interventionType}`,
    safeSummary: `Intervention ${interventionType} requested by ${actorRole}.`,
    metadataSafeJson: { interventionType, timestamp: nowISO() },
    requestId,
  });

  return {
    ok: true,
    interventionId: (intervention as any).id,
    studentAccessBlocked: false,
    reasonCodes: [],
    safeMessage: `Intervention ${interventionType} requested.`,
  };
}

export async function completeIntervention(
  interventionId: string,
  actorRole: string,
  actorIdHash?: string,
  safeSummary?: string,
  executionRunId?: string,
  pilotProgramId?: string,
  schoolId?: string,
  requestId?: string,
): Promise<InterventionResult> {
  if (!canPerformControlAction(actorRole)) {
    return { ok: false, studentAccessBlocked: false, reasonCodes: ['admin_or_operator_only'], safeMessage: 'Only admin or operator can complete interventions.' };
  }

  await task028ExpansionExecutionRepository.updateInterventionRecord(interventionId, { status: 'completed' });

  await task028ExpansionExecutionRepository.createAuditRecord({
    executionRunId,
    pilotProgramId,
    schoolId,
    actorRole,
    actorIdHash,
    action: `intervention_completed_${interventionId}`,
    safeSummary: safeSummary || `Intervention ${interventionId} completed by ${actorRole}.`,
    metadataSafeJson: { interventionId, timestamp: nowISO() },
    requestId,
  });

  return {
    ok: true,
    studentAccessBlocked: false,
    reasonCodes: [],
    safeMessage: `Intervention ${interventionId} completed.`,
  };
}
