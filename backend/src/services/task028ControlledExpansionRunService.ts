import { task028ExpansionExecutionRepository } from '../repositories/task028ExpansionExecutionRepository';
import { transitionExecutionState, assertCanTransition } from './task028ExpansionExecutionStateMachine';
import { nowISO } from '../contracts/task028ControlledExpansionExecutionContracts';
import type { Task028ControlledExpansionRunInput } from '../contracts/task028ControlledExpansionExecutionContracts';
import {
  validateTask028ControlledExpansionRunInput,
  createSafeTask028ValidationError,
} from '../lib/task028ControlledExpansionExecutionValidation';

interface RunActionResult {
  ok: boolean;
  runId?: string;
  status?: string;
  reasonCodes: string[];
  safeMessage: string;
}

function genRunId(): string {
  return `run_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function createRun(
  input: Task028ControlledExpansionRunInput,
): Promise<RunActionResult> {
  const errors = validateTask028ControlledExpansionRunInput(input);
  if (errors.length > 0) {
    return { ok: false, reasonCodes: errors, safeMessage: 'Invalid run input.' };
  }

  const existing = await task028ExpansionExecutionRepository.listExecutionRuns(
    input.schoolId,
    input.pilotRunId,
  );
  const activeExisting = existing.filter(
    (r: any) =>
      r.status !== 'completed' &&
      r.status !== 'blocked' &&
      r.status !== 'cancelled' &&
      r.status !== 'rolled_back',
  );
  if (activeExisting.length > 0) {
    return {
      ok: false,
      reasonCodes: ['expansion_already_active'],
      safeMessage: 'An active expansion run already exists for this school and pilot.',
    };
  }

  const run = await task028ExpansionExecutionRepository.createExecutionRun({
    expansionProposalId: input.proposalId,
    pilotProgramId: input.pilotRunId,
    schoolId: input.schoolId,
    status: 'draft',
    safeSummary: `Controlled expansion run created for school ${input.schoolId}.`,
    stagePlan: { proposalId: input.proposalId, governanceDecisionId: input.governanceDecisionId },
    approvedScopeSnapshot: {
      approvedCohortIds: input.approvedPlan.approvedCohortIds,
      approvedLearnerSafeRefs: input.approvedPlan.approvedLearnerSafeRefs,
      approvedTeacherSafeRefs: input.approvedPlan.approvedTeacherSafeRefs,
      approvedStartWindow: input.approvedPlan.approvedStartWindow,
    },
    startedByRole: input.actorRole,
    startedByActorIdHash: input.actorId,
    metadataSafeJson: { timestamp: nowISO(), plan: input.approvedPlan },
  });

  await task028ExpansionExecutionRepository.createAuditRecord({
    executionRunId: (run as any).id,
    schoolId: input.schoolId,
    actorRole: input.actorRole,
    actorIdHash: input.actorId,
    action: 'expansion_run_created',
    safeSummary: `Expansion run created for school ${input.schoolId} by ${input.actorRole}.`,
    metadataSafeJson: { runId: (run as any).id, timestamp: nowISO() },
  });

  return {
    ok: true,
    runId: (run as any).id,
    status: 'draft',
    reasonCodes: [],
    safeMessage: 'Controlled expansion run created in draft status.',
  };
}

export async function activateRun(
  runId: string,
  actorRole: string,
  actorId: string,
): Promise<RunActionResult> {
  const canTransition = await assertCanTransition(runId as any, 'active_controlled_expansion' as any);
  if (!canTransition.ok) {
    return { ok: false, reasonCodes: canTransition.reasonCodes, safeMessage: canTransition.safeMessage };
  }

  const transition = await transitionExecutionState(runId as any, 'preflight_pending' as any, actorRole, actorId);
  if (!transition.ok) {
    return { ok: false, reasonCodes: transition.reasonCodes, safeMessage: transition.safeMessage };
  }

  const readyTransition = await transitionExecutionState(runId as any, 'ready' as any, actorRole, actorId);
  if (!readyTransition.ok) {
    return { ok: false, reasonCodes: readyTransition.reasonCodes, safeMessage: readyTransition.safeMessage };
  }

  const activeTransition = await transitionExecutionState(runId as any, 'active_controlled_expansion' as any, actorRole, actorId);
  if (!activeTransition.ok) {
    return { ok: false, reasonCodes: activeTransition.reasonCodes, safeMessage: activeTransition.safeMessage };
  }

  return {
    ok: true,
    runId,
    status: 'active_controlled_expansion',
    reasonCodes: [],
    safeMessage: 'Expansion run activated. Controlled expansion is now live.',
  };
}

export async function pauseRun(
  runId: string,
  actorRole: string,
  actorId: string,
): Promise<RunActionResult> {
  const activeStatuses = ['active_controlled_expansion', 'intervention_required'];
  const run = await task028ExpansionExecutionRepository.getExecutionRun(runId);
  if (!run) {
    return { ok: false, reasonCodes: ['execution_run_not_found'], safeMessage: 'Execution run not found.' };
  }
  const runAny = run as any;
  if (!activeStatuses.includes(runAny.status)) {
    return {
      ok: false,
      reasonCodes: [`cannot_pause_from_${runAny.status}`],
      safeMessage: `Cannot pause run from status ${runAny.status}.`,
    };
  }

  const transition = await transitionExecutionState(runId as any, 'paused' as any, actorRole, actorId);
  if (!transition.ok) {
    return { ok: false, reasonCodes: transition.reasonCodes, safeMessage: transition.safeMessage };
  }

  return {
    ok: true,
    runId,
    status: 'paused',
    reasonCodes: [],
    safeMessage: 'Expansion run paused. New expanded sessions blocked.',
  };
}

export async function resumeRun(
  runId: string,
  actorRole: string,
  actorId: string,
): Promise<RunActionResult> {
  const run = await task028ExpansionExecutionRepository.getExecutionRun(runId);
  if (!run) {
    return { ok: false, reasonCodes: ['execution_run_not_found'], safeMessage: 'Execution run not found.' };
  }
  const runAny = run as any;
  if (runAny.status !== 'paused' && runAny.status !== 'intervention_required') {
    return {
      ok: false,
      reasonCodes: [`cannot_resume_from_${runAny.status}`],
      safeMessage: `Cannot resume run from status ${runAny.status}.`,
    };
  }

  const transition = await transitionExecutionState(runId as any, 'active_controlled_expansion' as any, actorRole, actorId);
  if (!transition.ok) {
    return { ok: false, reasonCodes: transition.reasonCodes, safeMessage: transition.safeMessage };
  }

  return {
    ok: true,
    runId,
    status: 'active_controlled_expansion',
    reasonCodes: [],
    safeMessage: 'Expansion run resumed. All gates passed.',
  };
}

export async function markInterventionRequired(
  runId: string,
  actorRole: string,
  actorId: string,
): Promise<RunActionResult> {
  const transition = await transitionExecutionState(runId as any, 'intervention_required' as any, actorRole, actorId);
  if (!transition.ok) {
    return { ok: false, reasonCodes: transition.reasonCodes, safeMessage: transition.safeMessage };
  }

  return {
    ok: true,
    runId,
    status: 'intervention_required',
    reasonCodes: [],
    safeMessage: 'Run marked as intervention required.',
  };
}

export async function requestRollback(
  runId: string,
  actorRole: string,
  actorId: string,
): Promise<RunActionResult> {
  const transition = await transitionExecutionState(runId as any, 'rollback_pending' as any, actorRole, actorId);
  if (!transition.ok) {
    return { ok: false, reasonCodes: transition.reasonCodes, safeMessage: transition.safeMessage };
  }

  return {
    ok: true,
    runId,
    status: 'rollback_pending',
    reasonCodes: [],
    safeMessage: 'Rollback requested. Pending execution.',
  };
}

export async function completeRollback(
  runId: string,
  actorRole: string,
  actorId: string,
): Promise<RunActionResult> {
  const transition = await transitionExecutionState(runId as any, 'rolled_back' as any, actorRole, actorId);
  if (!transition.ok) {
    return { ok: false, reasonCodes: transition.reasonCodes, safeMessage: transition.safeMessage };
  }

  return {
    ok: true,
    runId,
    status: 'rolled_back',
    reasonCodes: [],
    safeMessage: 'Rollback completed. All expanded sessions blocked.',
  };
}

export async function completeExpansion(
  runId: string,
  actorRole: string,
  actorId: string,
): Promise<RunActionResult> {
  const transition = await transitionExecutionState(runId as any, 'completed' as any, actorRole, actorId);
  if (!transition.ok) {
    return { ok: false, reasonCodes: transition.reasonCodes, safeMessage: transition.safeMessage };
  }

  return {
    ok: true,
    runId,
    status: 'completed',
    reasonCodes: [],
    safeMessage: 'Expansion completed successfully.',
  };
}

export async function cancelExpansion(
  runId: string,
  actorRole: string,
  actorId: string,
): Promise<RunActionResult> {
  const transition = await transitionExecutionState(runId as any, 'cancelled' as any, actorRole, actorId);
  if (!transition.ok) {
    return { ok: false, reasonCodes: transition.reasonCodes, safeMessage: transition.safeMessage };
  }

  return {
    ok: true,
    runId,
    status: 'cancelled',
    reasonCodes: [],
    safeMessage: 'Expansion cancelled.',
  };
}

export async function blockExpansion(
  runId: string,
  actorRole: string,
  actorId: string,
): Promise<RunActionResult> {
  const transition = await transitionExecutionState(runId as any, 'blocked' as any, actorRole, actorId);
  if (!transition.ok) {
    return { ok: false, reasonCodes: transition.reasonCodes, safeMessage: transition.safeMessage };
  }

  return {
    ok: true,
    runId,
    status: 'blocked',
    reasonCodes: [],
    safeMessage: 'Expansion blocked. All sessions denied.',
  };
}
