import type { Task032CanaryControlAction, Task032CanaryControlActionResult, Task032CanaryActivationStatus } from '../contracts/task032ControlledCanaryActivationContracts';
import type { Task032CanaryControlActionResult as Task032SimpleControlActionResult, Task032CanaryRunState, Task032CanaryControlActionType } from '../contracts/task032ControlledCanaryContracts';
import { resolveCanaryRole032, getRolePermissions032 } from '../contracts/task032ControlledCanaryContracts';
import { task032ControlledCanaryActivationRepository } from '../repositories/task032ControlledCanaryActivationRepository';
import { advanceTask032CanaryActivationState, blockTask032CanaryActivation } from './task032CanaryActivationStateMachineService';

const FORBIDDEN_ACTIONS = ['route_live_traffic', 'send_live_notice', 'expand_to_rollout', 'school_wide_enable', 'observe_canary', 'deploy_canary'];

export async function runTask032CanaryControlAction(input: Task032CanaryControlAction): Promise<Task032CanaryControlActionResult> {
  if (FORBIDDEN_ACTIONS.includes(input.action)) {
    return {
      ok: false,
      action: input.action as any,
      previousStatus: 'blocked' as Task032CanaryActivationStatus,
      nextStatus: 'blocked' as Task032CanaryActivationStatus,
      blockingIssues: [`forbidden_control_action: ${input.action}`]
    };
  }

  const record = await task032ControlledCanaryActivationRepository.getActivationRecord(input.activationId);
  if (!record) {
    return {
      ok: false,
      action: input.action,
      previousStatus: 'blocked' as Task032CanaryActivationStatus,
      nextStatus: 'blocked' as Task032CanaryActivationStatus,
      blockingIssues: ['activation_record_not_found']
    };
  }

  const previousStatus = record.status;
  let nextStatus: Task032CanaryActivationStatus;

  switch (input.action) {
    case 'pause_internal_canary':
      nextStatus = 'paused';
      break;
    case 'resume_internal_canary':
      nextStatus = 'activated_internal';
      break;
    case 'enable_internal_kill_switch':
      nextStatus = 'kill_switch_enabled';
      break;
    case 'disable_internal_kill_switch':
      nextStatus = previousStatus === 'kill_switch_enabled' ? 'paused' : previousStatus;
      break;
    case 'request_internal_rollback':
      nextStatus = 'rollback_requested';
      break;
    default:
      return {
        ok: false,
        action: input.action,
        previousStatus,
        nextStatus: 'blocked' as Task032CanaryActivationStatus,
        blockingIssues: [`unknown_control_action: ${input.action}`]
      };
  }

  try {
    await advanceTask032CanaryActivationState(input.activationId, nextStatus);
  } catch {
    return {
      ok: false,
      action: input.action,
      previousStatus,
      nextStatus: 'blocked' as Task032CanaryActivationStatus,
      blockingIssues: [`invalid_transition: ${previousStatus} -> ${nextStatus}`]
    };
  }

  const result: Task032CanaryControlActionResult = {
    ok: true,
    action: input.action,
    previousStatus,
    nextStatus,
    blockingIssues: []
  };

  await task032ControlledCanaryActivationRepository.recordControlAction(result);

  return result;
}

const SIMPLE_STATE_MAP: Record<string, Task032CanaryRunState> = {
  'active': 'active',
  'paused': 'paused',
  'kill_switch_active': 'kill_switch_active',
  'rollback_in_progress': 'rollback_in_progress',
};

const SIMPLE_ACTION_STATE_MAP: Record<string, { nextState: Task032CanaryRunState; validFrom: Task032CanaryRunState[] }> = {
  'pause_canary': { nextState: 'paused', validFrom: ['active'] },
  'resume_canary': { nextState: 'active', validFrom: ['paused'] },
  'enable_kill_switch': { nextState: 'kill_switch_active', validFrom: ['active', 'paused'] },
  'disable_kill_switch': { nextState: 'paused', validFrom: ['kill_switch_active'] },
  'start_rollback': { nextState: 'rollback_in_progress', validFrom: ['active', 'paused', 'kill_switch_active'] },
  'complete_rollback': { nextState: 'rolled_back', validFrom: ['rollback_in_progress'] },
  'complete_canary': { nextState: 'completed', validFrom: ['active'] },
};

export async function executeTask032ControlAction(input: {
  action: string;
  currentState: string;
  actorRole: string;
  actorHash: string;
  reasonCode: string;
}): Promise<Task032SimpleControlActionResult> {
  const resolvedRole = resolveCanaryRole032(input.actorRole);
  const perms = getRolePermissions032(resolvedRole);

  const actionType = input.action as Task032CanaryControlActionType;
  const currentRunState = SIMPLE_STATE_MAP[input.currentState] ?? null;
  const actionDef = SIMPLE_ACTION_STATE_MAP[input.action];

  const blockingIssues: string[] = [];

  if (resolvedRole === 'student') blockingIssues.push('student_cannot_perform_control_action');
  if (resolvedRole === 'teacher') blockingIssues.push('teacher_cannot_perform_control_action');
  if (resolvedRole === 'unknown') blockingIssues.push('unknown_role_cannot_perform_control_action');

  if (resolvedRole === 'admin' || resolvedRole === 'operator') {
    if (input.action === 'resume_canary' && !input.reasonCode) blockingIssues.push('resume_requires_fresh_gate_review');
    if (input.action === 'disable_kill_switch' && !input.reasonCode) blockingIssues.push('disable_kill_switch_requires_explicit_reason');
  }

  if (!actionDef) blockingIssues.push(`unknown_action: ${input.action}`);
  if (!currentRunState) blockingIssues.push(`unknown_current_state: ${input.currentState}`);
  if (actionDef && currentRunState && !actionDef.validFrom.includes(currentRunState)) {
    blockingIssues.push(`invalid_transition: ${currentRunState} -> ${actionDef.nextState}`);
  }

  if (blockingIssues.length > 0) {
    return {
      ok: false,
      action: actionType,
      previousState: currentRunState ?? 'active',
      nextState: currentRunState ?? 'active',
      runtimeAccessBlocked: true,
      safeAuditSummary: 'Control action blocked',
      safeAuditSummaryWritten: false,
      rawPrivateDataExposed: false,
      blockingIssues,
    };
  }

  return {
    ok: true,
    action: actionType,
    previousState: currentRunState!,
    nextState: actionDef!.nextState,
    runtimeAccessBlocked: actionDef!.nextState !== 'active',
    safeAuditSummary: `${input.action} performed by ${resolvedRole}`,
    safeAuditSummaryWritten: true,
    rawPrivateDataExposed: false,
    blockingIssues: [],
  };
}
