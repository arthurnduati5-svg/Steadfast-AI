import type {
  Task030RehearsalRun,
  Task030RehearsalStatus,
} from '../contracts/task030ControlledStagingRehearsalContracts';
import { TASK030_REHEARSAL_STAGE_IDS } from '../contracts/task030ControlledStagingRehearsalContracts';
import { validateTask030RehearsalRunInput } from '../lib/task030ControlledStagingRehearsalValidation';
import { task030ControlledStagingRehearsalRepository } from '../repositories/task030ControlledStagingRehearsalRepository';

const STATE_MACHINE: Record<Task030RehearsalStatus, Task030RehearsalStatus[]> = {
  created: ['preflight_running'],
  preflight_running: ['preflight_passed', 'blocked'],
  preflight_passed: ['journeys_running'],
  journeys_running: ['operations_rehearsal_running'],
  operations_rehearsal_running: ['rollback_drill_running'],
  rollback_drill_running: ['training_pack_generated'],
  training_pack_generated: ['report_generated'],
  report_generated: ['accepted_ready', 'blocked'],
  accepted_ready: [],
  blocked: [],
};

const PROGRESSIVE_STATUSES: Task030RehearsalStatus[] = [
  'created',
  'preflight_running',
  'preflight_passed',
  'journeys_running',
  'operations_rehearsal_running',
  'rollback_drill_running',
  'training_pack_generated',
  'report_generated',
  'accepted_ready',
];

function transitionStatus(
  current: Task030RehearsalStatus,
  target: Task030RehearsalStatus,
): Task030RehearsalStatus {
  const allowed = STATE_MACHINE[current];
  if (allowed.includes(target)) return target;
  if (target === 'blocked' && current !== 'accepted_ready' && current !== 'blocked') return 'blocked';
  return current;
}

function advanceToNextStatus(current: Task030RehearsalStatus): Task030RehearsalStatus {
  const idx = PROGRESSIVE_STATUSES.indexOf(current);
  if (idx === -1 || idx >= PROGRESSIVE_STATUSES.length - 1) return current;
  return PROGRESSIVE_STATUSES[idx + 1];
}

export async function createTask030RehearsalRun(input: { schoolId: string }): Promise<Task030RehearsalRun> {
  const runId = `rehearsal_${input.schoolId}_${Date.now()}`;
  const now = new Date().toISOString();

  const run: Task030RehearsalRun = {
    runId,
    schoolId: input.schoolId,
    environmentType: 'staging',
    dataMode: 'synthetic',
    executionMode: 'dry_run',
    status: 'created',
    preflightResult: null,
    adminOperatorJourneyResult: null,
    teacherJourneyResult: null,
    studentJourneyResult: null,
    unknownRoleDenialResult: null,
    operationsConsoleRehearsalResult: null,
    controlActionRehearsalResult: null,
    rollbackDrillResult: null,
    staffTrainingPack: null,
    decision: null,
    blockingIssues: [],
    createdAt: now,
    updatedAt: now,
  };

  const validation = validateTask030RehearsalRunInput(run);
  if (!validation.ok) {
    run.blockingIssues.push(...validation.errors);
    run.status = 'blocked';
  }

  await task030ControlledStagingRehearsalRepository.createRehearsalRun(run);

  return run;
}

export async function getTask030RehearsalRun(runId: string): Promise<Task030RehearsalRun | null> {
  return task030ControlledStagingRehearsalRepository.getRehearsalRun(runId);
}

export async function completeTask030RehearsalRun(runId: string): Promise<Task030RehearsalRun> {
  const run = await task030ControlledStagingRehearsalRepository.getRehearsalRun(runId);
  if (!run) {
    throw new Error(`Rehearsal run ${runId} not found`);
  }

  const nextStatus = advanceToNextStatus(run.status);
  const newStatus = transitionStatus(run.status, nextStatus);

  const updatedRun: Partial<Task030RehearsalRun> = {
    status: newStatus,
    updatedAt: new Date().toISOString(),
  };

  if (newStatus === 'accepted_ready') {
    updatedRun.decision = 'ready_for_task031';
  } else if (newStatus === 'blocked') {
    updatedRun.decision = 'blocked';
    updatedRun.blockingIssues = [...(run.blockingIssues || []), 'state_machine_blocked'];
  }

  await task030ControlledStagingRehearsalRepository.updateRehearsalRun(runId, updatedRun);

  const final = await task030ControlledStagingRehearsalRepository.getRehearsalRun(runId);
  if (!final) throw new Error(`Rehearsal run ${runId} not found after update`);

  return final;
}

export async function blockTask030RehearsalRun(
  runId: string,
  blockers: string[],
): Promise<Task030RehearsalRun> {
  const run = await task030ControlledStagingRehearsalRepository.getRehearsalRun(runId);
  if (!run) {
    throw new Error(`Rehearsal run ${runId} not found`);
  }
  if (run.status === 'accepted_ready') {
    throw new Error(`Cannot block run ${runId} which has already been accepted`);
  }

  const updatedRun: Partial<Task030RehearsalRun> = {
    status: 'blocked',
    decision: 'blocked',
    blockingIssues: [...blockers],
    updatedAt: new Date().toISOString(),
  };

  await task030ControlledStagingRehearsalRepository.updateRehearsalRun(runId, updatedRun);

  const final = await task030ControlledStagingRehearsalRepository.getRehearsalRun(runId);
  if (!final) throw new Error(`Rehearsal run ${runId} not found after block`);

  return final;
}
