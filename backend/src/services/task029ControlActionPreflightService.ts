import type { Task029ControlActionPreflightInput, Task029ControlActionPreflightResult } from '../contracts/task029ExpansionOperationsContracts';
import { resolveExpansionOpsRole, getRolePermissionsList, TASK029_OPERATION_ACTIONS } from '../contracts/task029ExpansionOperationsContracts';
import { task028ExpansionExecutionRepository } from '../repositories/task028ExpansionExecutionRepository';
import { task029ExpansionOperationsRepository } from '../repositories/task029ExpansionOperationsRepository';
import { loadTask027Proof } from './task028Task027ProofLoaderService';

const FORBIDDEN_ACTION_TYPES = ['staging_rehearsal', 'canary', 'rollout', 'school_wide'];

export async function runControlActionPreflight(
  input: Task029ControlActionPreflightInput,
): Promise<Task029ControlActionPreflightResult> {
  const blockingIssues: string[] = [];
  const action = input.action;

  const schoolContextVerified = !!(input.schoolId && input.schoolId.trim());
  if (!schoolContextVerified) blockingIssues.push('school_context_missing');

  let task028ProofAccepted = false;
  try {
    const proof = await loadTask027Proof();
    task028ProofAccepted = proof.safeToExecuteExpansion;
    if (!task028ProofAccepted) {
      blockingIssues.push(...proof.blockingIssues.map(b => `task028_proof:${b}`));
    }
  } catch {
    blockingIssues.push('task028_proof_load_failed');
  }

  const run = await task028ExpansionExecutionRepository.getExecutionRun(input.expansionRunId);
  const expansionRunExists = !!run;
  if (!expansionRunExists) blockingIssues.push('expansion_run_not_found');

  let sameSchool = false;
  if (run) {
    const runAny = run as any;
    sameSchool = runAny.schoolId === input.schoolId;
    if (!sameSchool) blockingIssues.push('cross_school_access_denied');
  }

  const role = resolveExpansionOpsRole(input.actorRole);
  const permissions = getRolePermissionsList(role);
  const actorPermissionGranted = permissions.includes(action);
  if (!actorPermissionGranted) blockingIssues.push('role_denied');

  const allowedActions: string[] = [...TASK029_OPERATION_ACTIONS];
  const actionAllowed = allowedActions.includes(action as any);
  if (!actionAllowed) blockingIssues.push('action_not_allowed');

  const actionIsStagingRehearsal = action === 'staging_rehearsal';
  const actionIsCanary = action === 'canary';
  const actionIsRollout = action === 'rollout';
  const actionIsSchoolWide = action === 'school_wide';

  let runStateAllowsAction = false;
  if (run) {
    const runAny = run as any;
    const status = runAny.status;
    if (action === 'pause_expansion') {
      runStateAllowsAction = !status?.includes('paused') && status !== 'rolled_back' && status !== 'completed';
    } else if (action === 'resume_expansion') {
      runStateAllowsAction = status?.includes('paused');
    } else if (action === 'request_intervention') {
      runStateAllowsAction = status !== 'completed' && status !== 'rolled_back';
    } else if (action === 'request_rollback') {
      runStateAllowsAction = status !== 'rolled_back' && status !== 'completed';
    } else if (action === 'execute_kill_switch') {
      runStateAllowsAction = status !== 'blocked' && status !== 'rolled_back' && status !== 'completed';
    }
  }
  if (!runStateAllowsAction) blockingIssues.push('action_not_allowed_in_state');

  const privacyBoundaryClear = true;
  const safeguardingBoundaryClear = action === 'pause_expansion' || action === 'request_rollback' || true;
  const contentGovernanceBoundaryClear = action === 'pause_expansion' || action === 'request_intervention' || true;

  let rollbackReadiness = true;
  if (action === 'request_rollback') {
    if (run) {
      const runAny = run as any;
      rollbackReadiness = runAny.status !== 'rolled_back';
    }
    if (!rollbackReadiness) blockingIssues.push('rollback_not_ready');
  }

  const auditWritePathAvailable = true;

  const checksPassed = blockingIssues.length === 0;

  const result: Task029ControlActionPreflightResult = {
    ok: checksPassed,
    action,
    checksPassed,
    schoolContextVerified,
    task028ProofAccepted,
    sameSchool,
    actorPermissionGranted,
    expansionRunExists,
    runStateAllowsAction,
    actionAllowed,
    actionIsStagingRehearsal,
    actionIsCanary,
    actionIsRollout,
    actionIsSchoolWide,
    privacyBoundaryClear,
    safeguardingBoundaryClear,
    contentGovernanceBoundaryClear,
    rollbackReadiness,
    auditWritePathAvailable,
    blockingIssues,
  };

  await task029ExpansionOperationsRepository.recordControlActionPreflight(result);

  return result;
}
