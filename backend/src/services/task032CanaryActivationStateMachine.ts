import type {
  Task032CanaryRunState,
  Task032CanaryRole,
  Task032StateTransition,
} from '../contracts/task032ControlledCanaryContracts';
import { isAllowedTransition } from '../contracts/task032ControlledCanaryContracts';

export interface Task032StateMachineInput {
  currentState: Task032CanaryRunState;
  targetState: Task032CanaryRunState;
  actorRole: Task032CanaryRole;
  actorHash: string;
  reasonCode: string;
}

export async function transitionTask032CanaryState(
  input: Task032StateMachineInput,
): Promise<Task032StateTransition> {
  const { currentState, targetState, actorRole, actorHash, reasonCode } = input;
  const blockingIssues: string[] = [];

  const allowed = isAllowedTransition(currentState, targetState);

  if (!allowed) {
    blockingIssues.push(`transition_not_allowed_from_${currentState}_to_${targetState}`);
  }

  if (actorRole === 'unknown') {
    blockingIssues.push('unknown_role_cannot_transition_state');
  }

  if (actorRole === 'student') {
    blockingIssues.push('student_cannot_transition_canary_state');
  }

  if (actorRole === 'teacher') {
    blockingIssues.push('teacher_cannot_transition_canary_state');
  }

  if (targetState === 'active' && currentState !== 'armed' && currentState !== 'paused') {
    blockingIssues.push('can_only_activate_from_armed_or_paused');
  }

  // Rollback from paused should force check
  if (targetState === 'rollback_in_progress' && currentState === 'kill_switch_active') {
    // Allowed
  }

  const transitionAllowed = blockingIssues.length === 0;

  const transition: Task032StateTransition = {
    fromState: currentState,
    toState: targetState,
    actorRole,
    actorHash,
    reasonCode: transitionAllowed ? reasonCode : 'blocked_' + blockingIssues[0],
    timestamp: new Date().toISOString(),
    safeSummary: transitionAllowed
      ? `Canary state transitioned from ${currentState} to ${targetState} by ${actorRole}`
      : `Canary state transition from ${currentState} to ${targetState} blocked for ${actorRole}`,
    allowed: transitionAllowed,
    blockingIssues,
  };

  return transition;
}
