import type { Task032CanaryControlAction, Task032CanaryControlActionResult, Task032CanaryActivationStatus } from '../contracts/task032ControlledCanaryActivationContracts';
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
