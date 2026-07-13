import {
  Task036LaunchEnvironmentGateInput,
  Task036LaunchWindowInput,
  Task036LaunchApprovalInput,
  Task036SingleSchoolScopeInput,
  Task036LiveLaunchSessionRecord,
  createTask036SafeTimestamp,
} from '../contracts/task036LiveSchoolLaunchContracts';
import { task036Repository } from '../repositories/task036LiveSchoolLaunchRepository';
import { loadAndValidateTask035Proof } from './task036Task035ProofLoaderService';
import { evaluateEnvironmentGate } from './task036LaunchEnvironmentGateService';
import { validateLaunchWindow } from './task036LaunchWindowService';
import { validateLaunchApproval } from './task036LaunchApprovalService';
import { validateSingleSchoolScope } from './task036SingleSchoolScopeService';
import { transitionState } from './task036LiveLaunchStateMachineService';

export async function executeTask035ProofCheck(sessionId: string): Promise<{ ok: boolean; blockingIssues: string[] }> {
  const session = task036Repository.getLaunchSession(sessionId);
  if (!session) return { ok: false, blockingIssues: ['session_not_found'] };

  await transitionState(sessionId, session.status, 'dependency_checking');
  const proof = await loadAndValidateTask035Proof();

  if (proof.ok) {
    await transitionState(sessionId, 'dependency_checking', 'dependency_passed');
  } else {
    await transitionState(sessionId, 'dependency_checking', 'blocked');
  }

  return { ok: proof.ok, blockingIssues: proof.blockingIssues };
}

export async function executeEnvironmentPreflight(
  sessionId: string,
  input: Task036LaunchEnvironmentGateInput
): Promise<{ ok: boolean; blockingIssues: string[] }> {
  const session = task036Repository.getLaunchSession(sessionId);
  if (!session) return { ok: false, blockingIssues: ['session_not_found'] };

  await transitionState(sessionId, session.status, 'environment_checking');
  const result = await evaluateEnvironmentGate(input);

  if (result.passed) {
    await transitionState(sessionId, 'environment_checking', 'environment_passed');
  } else {
    await transitionState(sessionId, 'environment_checking', 'blocked');
  }

  return { ok: result.passed, blockingIssues: result.blockingIssues };
}

export async function executeLaunchWindowCheck(
  sessionId: string,
  input: Task036LaunchWindowInput
): Promise<{ ok: boolean; blockingIssues: string[] }> {
  const session = task036Repository.getLaunchSession(sessionId);
  if (!session) return { ok: false, blockingIssues: ['session_not_found'] };

  await transitionState(sessionId, session.status, 'launch_window_checking');
  const result = await validateLaunchWindow(input);

  if (result.passed) {
    await transitionState(sessionId, 'launch_window_checking', 'launch_window_passed');
  } else {
    await transitionState(sessionId, 'launch_window_checking', 'blocked');
  }

  return { ok: result.passed, blockingIssues: result.blockingIssues };
}

export async function executeApprovalCheck(
  sessionId: string,
  input: Task036LaunchApprovalInput
): Promise<{ ok: boolean; blockingIssues: string[] }> {
  const session = task036Repository.getLaunchSession(sessionId);
  if (!session) return { ok: false, blockingIssues: ['session_not_found'] };

  await transitionState(sessionId, session.status, 'approval_checking');
  const result = await validateLaunchApproval(input);

  if (result.passed) {
    await transitionState(sessionId, 'approval_checking', 'approval_passed');
  } else {
    await transitionState(sessionId, 'approval_checking', 'blocked');
  }

  return { ok: result.passed, blockingIssues: result.blockingIssues };
}

export async function executeSingleSchoolScopeCheck(
  sessionId: string,
  input: Task036SingleSchoolScopeInput
): Promise<{ ok: boolean; blockingIssues: string[] }> {
  const session = task036Repository.getLaunchSession(sessionId);
  if (!session) return { ok: false, blockingIssues: ['session_not_found'] };

  await transitionState(sessionId, session.status, 'single_school_scope_checking');
  const result = await validateSingleSchoolScope(input);

  if (result.passed) {
    await transitionState(sessionId, 'single_school_scope_checking', 'single_school_scope_passed');
  } else {
    await transitionState(sessionId, 'single_school_scope_checking', 'blocked');
  }

  return { ok: result.passed, blockingIssues: result.blockingIssues };
}

export function startControlledLaunch(
  sessionId: string
): { status: string; blockingIssues: string[] } {
  const session = task036Repository.getLaunchSession(sessionId);
  if (!session) return { status: 'blocked', blockingIssues: ['session_not_found'] };
  const updatedSession: Task036LiveLaunchSessionRecord = {
    ...session,
    status: 'launch_active_controlled',
    updatedAt: createTask036SafeTimestamp(),
  };
  task036Repository.saveLaunchSession(updatedSession);
  return { status: 'launch_active_controlled', blockingIssues: [] };
}
