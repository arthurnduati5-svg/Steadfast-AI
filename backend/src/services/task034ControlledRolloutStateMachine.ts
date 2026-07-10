import type { Task034RolloutState, Task034RolloutRole, Task034RolloutStateTransition } from '../contracts/task034ControlledRolloutContracts';

const ALLOWED_TRANSITIONS: Record<Task034RolloutState, Task034RolloutState[]> = {
  draft: ['approved'],
  approved: ['staff_ready'],
  staff_ready: ['learner_notice_ready'],
  learner_notice_ready: ['armed'],
  armed: ['active'],
  active: ['paused', 'kill_switch_active', 'rollback_in_progress', 'completed'],
  paused: ['active', 'kill_switch_active', 'rollback_in_progress'],
  kill_switch_active: ['rollback_in_progress'],
  rollback_in_progress: ['rolled_back'],
  rolled_back: ['blocked'],
  completed: ['blocked'],
  blocked: [],
};

const ADMIN_ROLES: Task034RolloutRole[] = ['admin'];
const OPERATOR_ROLES: Task034RolloutRole[] = ['admin', 'operator'];

function canRolePerformTransition(role: Task034RolloutRole, fromState: Task034RolloutState, toState: Task034RolloutState): boolean {
  if (role === 'student' || role === 'teacher' || role === 'unknown') return false;

  const adminOnlyTransitions: Task034RolloutState[] = ['approved', 'staff_ready', 'learner_notice_ready', 'armed', 'active', 'completed'];
  const adminOrOperatorTransitions: Task034RolloutState[] = ['paused', 'kill_switch_active', 'rollback_in_progress'];

  if (adminOnlyTransitions.includes(toState)) {
    return ADMIN_ROLES.includes(role);
  }
  if (adminOrOperatorTransitions.includes(toState)) {
    return OPERATOR_ROLES.includes(role);
  }
  if (toState === 'rolled_back' || toState === 'blocked') {
    return OPERATOR_ROLES.includes(role);
  }
  if (toState === 'active' && fromState === 'paused') {
    return OPERATOR_ROLES.includes(role);
  }
  return false;
}

export interface StateMachineInput {
  fromState: Task034RolloutState;
  toState: Task034RolloutState;
  actorRole: Task034RolloutRole;
  actorHash: string;
  reasonCode: string;
}

export function applyStateTransition(input: StateMachineInput): Task034RolloutStateTransition {
  const blockingIssues: string[] = [];
  const timestamp = new Date().toISOString();

  const allowedTransitions = ALLOWED_TRANSITIONS[input.fromState] || [];
  const transitionAllowed = allowedTransitions.includes(input.toState);

  if (!transitionAllowed) {
    blockingIssues.push(`INVALID_TRANSITION: ${input.fromState} -> ${input.toState}`);
  }

  const roleAllowed = canRolePerformTransition(input.actorRole, input.fromState, input.toState);
  if (!roleAllowed) {
    blockingIssues.push(`ROLE_NOT_ALLOWED: ${input.actorRole} cannot perform ${input.fromState} -> ${input.toState}`);
  }

  const allowed = transitionAllowed && roleAllowed && blockingIssues.length === 0;

  return {
    fromState: input.fromState,
    toState: input.toState,
    actorRole: input.actorRole,
    actorHash: input.actorHash,
    reasonCode: input.reasonCode,
    timestamp,
    safeSummary: `${input.actorRole} transition ${input.fromState} -> ${input.toState}: ${allowed ? 'allowed' : 'denied'}`,
    allowed,
    blockingIssues,
    rawPrivateDataExposed: false,
  };
}
