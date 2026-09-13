import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';
import { task025PilotRepository } from '../repositories/task025PilotRepository';
import { evaluatePilotReadiness } from './task025PilotReadinessService';
import { transitionExecutionState } from './task026PilotExecutionStateMachine';
import type { PilotExecutionStatus } from '../contracts/task026PilotExecutionContracts';

export interface ControlResult {
  ok: boolean;
  executionRunId?: string;
  previousStatus?: string;
  newStatus?: string;
  studentAccessBlocked: boolean;
  dataDestructivelyDeleted: boolean;
  auditPreserved: boolean;
  reasonCodes: string[];
  safeMessage: string;
}

export async function createPilotAuditRecord(params: {
  executionRunId?: string;
  pilotProgramId?: string;
  schoolId?: string;
  actorRole: string;
  actorIdHash?: string;
  action: string;
  safeSummary: string;
  metadataSafeJson?: Record<string, unknown>;
  requestId?: string;
}): Promise<void> {
  await task026PilotExecutionRepository.createAuditRecord({
    executionRunId: params.executionRunId,
    pilotProgramId: params.pilotProgramId,
    schoolId: params.schoolId,
    actorRole: params.actorRole,
    actorIdHash: params.actorIdHash,
    action: params.action,
    safeSummary: params.safeSummary,
    metadataSafeJson: params.metadataSafeJson ?? {},
    requestId: params.requestId,
  });
}

export async function startPilotExecution(params: {
  pilotProgramId: string;
  schoolId: string;
  actorRole: string;
  actorIdHash?: string;
  allowedCohortIds?: string[];
  requestId?: string;
}): Promise<ControlResult> {
  const program = await task025PilotRepository.getPilotProgram(params.pilotProgramId);
  if (!program) {
    return { ok: false, studentAccessBlocked: false, dataDestructivelyDeleted: false, auditPreserved: false, reasonCodes: ['pilot_program_not_found'], safeMessage: 'Pilot program not found.' };
  }

  if (program.approvalStatus !== 'approved') {
    return { ok: false, studentAccessBlocked: false, dataDestructivelyDeleted: false, auditPreserved: false, reasonCodes: ['pilot_not_approved'], safeMessage: 'Pilot program not approved.' };
  }

  const readiness = await evaluatePilotReadiness(params.pilotProgramId, params.schoolId);
  if (!readiness.safeToStartPilot) {
    return { ok: false, studentAccessBlocked: false, dataDestructivelyDeleted: false, auditPreserved: false, reasonCodes: ['task025_readiness_not_accepted', ...readiness.blockingIssues], safeMessage: readiness.safeSummary };
  }

  if ((program as any).status === 'rolled_back') {
    return { ok: false, studentAccessBlocked: true, dataDestructivelyDeleted: false, auditPreserved: false, reasonCodes: ['pilot_rolled_back'], safeMessage: 'Pilot program is rolled back.' };
  }

  const existingRuns = await task026PilotExecutionRepository.listExecutionRuns(params.pilotProgramId);
  const activeRun = existingRuns.find((r: any) => r.status === 'active' || r.status === 'starting' || r.status === 'paused');
  if (activeRun) {
    return { ok: false, studentAccessBlocked: false, dataDestructivelyDeleted: false, auditPreserved: false, reasonCodes: ['execution_already_active'], safeMessage: 'Pilot execution already active.' };
  }

  const previousStatus = (program as any).status;

  const executionRun = await task026PilotExecutionRepository.createExecutionRun({
    pilotProgramId: params.pilotProgramId,
    schoolId: params.schoolId,
    status: 'not_started',
    safeSummary: readiness.safeSummary,
    allowedCohortIds: params.allowedCohortIds ?? [],
    executionGateSnapshot: readiness as any,
    blockingIssues: readiness.blockingIssues,
    warnings: readiness.warnings,
  });

  await transitionExecutionState(
    (executionRun as any).id,
    'starting',
    params.actorRole,
    params.actorIdHash,
    params.requestId,
  );

  await transitionExecutionState(
    (executionRun as any).id,
    'active',
    params.actorRole,
    params.actorIdHash,
    params.requestId,
  );

  await createPilotAuditRecord({
    executionRunId: (executionRun as any).id,
    pilotProgramId: params.pilotProgramId,
    schoolId: params.schoolId,
    actorRole: params.actorRole,
    actorIdHash: params.actorIdHash,
    action: 'pilot_execution_started',
    safeSummary: `Pilot execution started for program ${params.pilotProgramId}.`,
    requestId: params.requestId,
  });

  return {
    ok: true,
    executionRunId: (executionRun as any).id,
    previousStatus,
    newStatus: 'active',
    studentAccessBlocked: false,
    dataDestructivelyDeleted: false,
    auditPreserved: true,
    reasonCodes: [],
    safeMessage: 'Pilot execution started successfully.',
  };
}

export async function pausePilotExecution(
  executionRunId: string,
  actorRole: string,
  actorIdHash?: string,
  requestId?: string,
): Promise<ControlResult> {
  const transition = await transitionExecutionState(executionRunId, 'paused', actorRole, actorIdHash, requestId);
  if (!transition.ok) {
    return { ok: false, studentAccessBlocked: false, dataDestructivelyDeleted: false, auditPreserved: false, reasonCodes: transition.reasonCodes, safeMessage: transition.safeMessage };
  }

  const run = await task026PilotExecutionRepository.getExecutionRun(executionRunId);
  const previousStatus = (run as any)?.status;

  await createPilotAuditRecord({
    executionRunId,
    pilotProgramId: (run as any)?.pilotProgramId,
    schoolId: (run as any)?.schoolId,
    actorRole,
    actorIdHash,
    action: 'pilot_execution_paused',
    safeSummary: `Pilot execution paused by ${actorRole}.`,
    requestId,
  });

  return {
    ok: true,
    executionRunId,
    previousStatus,
    newStatus: 'paused',
    studentAccessBlocked: true,
    dataDestructivelyDeleted: false,
    auditPreserved: true,
    reasonCodes: [],
    safeMessage: 'Pilot execution paused. New sessions blocked.',
  };
}

export async function resumePilotExecution(
  executionRunId: string,
  actorRole: string,
  actorIdHash?: string,
  requestId?: string,
): Promise<ControlResult> {
  const run = await task026PilotExecutionRepository.getExecutionRun(executionRunId);
  if (!run) {
    return { ok: false, studentAccessBlocked: false, dataDestructivelyDeleted: false, auditPreserved: false, reasonCodes: ['execution_run_not_found'], safeMessage: 'Execution run not found.' };
  }

  const transition1 = await transitionExecutionState(executionRunId, 'resuming', actorRole, actorIdHash, requestId);
  if (!transition1.ok) {
    return { ok: false, studentAccessBlocked: false, dataDestructivelyDeleted: false, auditPreserved: false, reasonCodes: transition1.reasonCodes, safeMessage: transition1.safeMessage };
  }

  const program = await task025PilotRepository.getPilotProgram((run as any).pilotProgramId);
  if (program) {
    const readiness = await evaluatePilotReadiness((run as any).pilotProgramId, (run as any).schoolId);
    if (!readiness.safeToStartPilot) {
      await transitionExecutionState(executionRunId, 'blocked', 'system', undefined, requestId);
      return { ok: false, studentAccessBlocked: true, dataDestructivelyDeleted: false, auditPreserved: true, reasonCodes: ['resume_gates_failed', ...readiness.blockingIssues], safeMessage: 'Resume gates failed: ' + readiness.safeSummary };
    }
  }

  const transition2 = await transitionExecutionState(executionRunId, 'active', actorRole, actorIdHash, requestId);
  if (!transition2.ok) {
    return { ok: false, studentAccessBlocked: false, dataDestructivelyDeleted: false, auditPreserved: false, reasonCodes: transition2.reasonCodes, safeMessage: transition2.safeMessage };
  }

  await createPilotAuditRecord({
    executionRunId,
    pilotProgramId: (run as any).pilotProgramId,
    schoolId: (run as any).schoolId,
    actorRole,
    actorIdHash,
    action: 'pilot_execution_resumed',
    safeSummary: `Pilot execution resumed by ${actorRole}. Gates re-verified.`,
    requestId,
  });

  return {
    ok: true,
    executionRunId,
    previousStatus: 'paused',
    newStatus: 'active',
    studentAccessBlocked: false,
    dataDestructivelyDeleted: false,
    auditPreserved: true,
    reasonCodes: [],
    safeMessage: 'Pilot execution resumed. Gates passed.',
  };
}

export async function requestPilotRollback(
  executionRunId: string,
  actorRole: string,
  actorIdHash?: string,
  requestId?: string,
): Promise<ControlResult> {
  const transition = await transitionExecutionState(executionRunId, 'rollback_requested', actorRole, actorIdHash, requestId);
  if (!transition.ok) {
    return { ok: false, studentAccessBlocked: false, dataDestructivelyDeleted: false, auditPreserved: false, reasonCodes: transition.reasonCodes, safeMessage: transition.safeMessage };
  }

  const run = await task026PilotExecutionRepository.getExecutionRun(executionRunId);

  await createPilotAuditRecord({
    executionRunId,
    pilotProgramId: (run as any)?.pilotProgramId,
    schoolId: (run as any)?.schoolId,
    actorRole,
    actorIdHash,
    action: 'rollback_requested',
    safeSummary: `Rollback requested by ${actorRole}.`,
    requestId,
  });

  return completePilotRollback(executionRunId, actorRole, actorIdHash, requestId);
}

export async function completePilotRollback(
  executionRunId: string,
  actorRole: string,
  actorIdHash?: string,
  requestId?: string,
): Promise<ControlResult> {
  const transition = await transitionExecutionState(executionRunId, 'rolled_back', actorRole, actorIdHash, requestId);
  if (!transition.ok) {
    return { ok: false, studentAccessBlocked: false, dataDestructivelyDeleted: false, auditPreserved: false, reasonCodes: transition.reasonCodes, safeMessage: transition.safeMessage };
  }

  const run = await task026PilotExecutionRepository.getExecutionRun(executionRunId);

  await createPilotAuditRecord({
    executionRunId,
    pilotProgramId: (run as any)?.pilotProgramId,
    schoolId: (run as any)?.schoolId,
    actorRole,
    actorIdHash,
    action: 'pilot_rolled_back',
    safeSummary: `Pilot rolled back by ${actorRole}. Learning evidence preserved.`,
    requestId,
  });

  return {
    ok: true,
    executionRunId,
    newStatus: 'rolled_back',
    studentAccessBlocked: true,
    dataDestructivelyDeleted: false,
    auditPreserved: true,
    reasonCodes: [],
    safeMessage: 'Pilot rolled back. New sessions blocked. Learning evidence preserved.',
  };
}

export async function completePilotExecution(
  executionRunId: string,
  actorRole: string,
  actorIdHash?: string,
  requestId?: string,
): Promise<ControlResult> {
  const transition = await transitionExecutionState(executionRunId, 'completed', actorRole, actorIdHash, requestId);
  if (!transition.ok) {
    return { ok: false, studentAccessBlocked: false, dataDestructivelyDeleted: false, auditPreserved: false, reasonCodes: transition.reasonCodes, safeMessage: transition.safeMessage };
  }

  const run = await task026PilotExecutionRepository.getExecutionRun(executionRunId);

  await createPilotAuditRecord({
    executionRunId,
    pilotProgramId: (run as any)?.pilotProgramId,
    schoolId: (run as any)?.schoolId,
    actorRole,
    actorIdHash,
    action: 'pilot_execution_completed',
    safeSummary: `Pilot execution completed by ${actorRole}. Post-pilot review must be generated.`,
    requestId,
  });

  return {
    ok: true,
    executionRunId,
    newStatus: 'completed',
    studentAccessBlocked: true,
    dataDestructivelyDeleted: false,
    auditPreserved: true,
    reasonCodes: [],
    safeMessage: 'Pilot execution completed. Post-pilot review required.',
  };
}

export async function enableKillSwitch(
  executionRunId: string,
  actorRole: string,
  actorIdHash?: string,
  requestId?: string,
): Promise<ControlResult> {
  const run = await task026PilotExecutionRepository.getExecutionRun(executionRunId);
  if (!run) {
    return { ok: false, studentAccessBlocked: false, dataDestructivelyDeleted: false, auditPreserved: false, reasonCodes: ['execution_run_not_found'], safeMessage: 'Execution run not found.' };
  }

  const runAny = run as any;
  await task026PilotExecutionRepository.updateExecutionRun(executionRunId, { status: 'blocked' });

  await task025PilotRepository.writeAuditRecord({
    pilotProgramId: runAny.pilotProgramId,
    schoolId: runAny.schoolId,
    actorRole,
    actorIdHash,
    action: 'kill_switch_engaged',
    safeSummary: `Kill switch engaged by ${actorRole}. Pilot execution blocked.`,
    requestId,
  });

  await createPilotAuditRecord({
    executionRunId,
    pilotProgramId: runAny.pilotProgramId,
    schoolId: runAny.schoolId,
    actorRole,
    actorIdHash,
    action: 'kill_switch_engaged',
    safeSummary: `Kill switch engaged by ${actorRole}. All sessions blocked.`,
    requestId,
  });

  return {
    ok: true,
    executionRunId,
    newStatus: 'blocked',
    studentAccessBlocked: true,
    dataDestructivelyDeleted: false,
    auditPreserved: true,
    reasonCodes: [],
    safeMessage: 'Kill switch engaged. All pilot sessions blocked.',
  };
}

export async function disableKillSwitch(
  executionRunId: string,
  actorRole: string,
  actorIdHash?: string,
  requestId?: string,
): Promise<ControlResult> {
  if (actorRole !== 'admin') {
    return { ok: false, studentAccessBlocked: false, dataDestructivelyDeleted: false, auditPreserved: false, reasonCodes: ['admin_only'], safeMessage: 'Only admin can disable kill switch.' };
  }

  const run = await task026PilotExecutionRepository.getExecutionRun(executionRunId);
  if (!run) {
    return { ok: false, studentAccessBlocked: false, dataDestructivelyDeleted: false, auditPreserved: false, reasonCodes: ['execution_run_not_found'], safeMessage: 'Execution run not found.' };
  }

  const runAny = run as any;
  await task026PilotExecutionRepository.updateExecutionRun(executionRunId, { status: 'paused' });

  await createPilotAuditRecord({
    executionRunId,
    pilotProgramId: runAny.pilotProgramId,
    schoolId: runAny.schoolId,
    actorRole,
    actorIdHash,
    action: 'kill_switch_disabled',
    safeSummary: `Kill switch disabled by admin ${actorRole}. Execution moved to paused.`,
    requestId,
  });

  return {
    ok: true,
    executionRunId,
    newStatus: 'paused',
    studentAccessBlocked: true,
    dataDestructivelyDeleted: false,
    auditPreserved: true,
    reasonCodes: [],
    safeMessage: 'Kill switch disabled. Execution moved to paused state.',
  };
}
