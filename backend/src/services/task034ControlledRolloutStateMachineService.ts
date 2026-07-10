import {
  Task034ControlledRolloutSessionInput, Task034ControlledRolloutSessionRecord, Task034RolloutStatus,
  TASK034_VALID_STATE_TRANSITIONS, TASK034_ALLOWED_ACTOR_ROLES,
  isTask034DeniedRole, resolveTask034ActorRole, createTask034SafeTimestamp,
} from '../contracts/task034ControlledLimitedRolloutContracts';
import { task034Repository } from '../repositories/task034ControlledLimitedRolloutRepository';

function generateSessionId(): string {
  return `rollout_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

export async function createTask034RolloutSession(
  input: Task034ControlledRolloutSessionInput,
): Promise<Task034ControlledRolloutSessionRecord> {
  const blockingIssues: string[] = [];
  const now = createTask034SafeTimestamp();

  const actorRole = resolveTask034ActorRole(input.actorRole);

  if (isTask034DeniedRole(actorRole)) {
    blockingIssues.push(`denied_actor_role: ${actorRole}`);
  }

  const sessionId = input.sessionId || generateSessionId();

  const record: Task034ControlledRolloutSessionRecord = {
    sessionId,
    activationId: input.activationId,
    schoolId: input.schoolId,
    tenantId: input.tenantId,
    cohortId: input.cohortId,
    actorRole,
    status: 'created',
    rolloutStage: 'created',
    createdAt: now,
    updatedAt: now,
    blockingIssues,
  };

  await task034Repository.saveRolloutSession(record);
  return record;
}

export async function transitionTask034RolloutStatus(
  session: Task034ControlledRolloutSessionRecord,
  to: Task034RolloutStatus,
): Promise<Task034ControlledRolloutSessionRecord> {
  if (!isValidTransition(session.status, to)) {
    const updated: Task034ControlledRolloutSessionRecord = {
      ...session,
      status: 'blocked',
      rolloutStage: 'blocked',
      updatedAt: createTask034SafeTimestamp(),
      blockingIssues: [...session.blockingIssues, `invalid_transition: ${session.status} -> ${to}`],
    };
    await task034Repository.saveRolloutSession(updated);
    return updated;
  }

  const updated: Task034ControlledRolloutSessionRecord = {
    ...session,
    status: to,
    rolloutStage: to,
    updatedAt: createTask034SafeTimestamp(),
  };

  await task034Repository.saveRolloutSession(updated);
  return updated;
}

export function listValidTransitions(from: Task034RolloutStatus): Task034RolloutStatus[] {
  return TASK034_VALID_STATE_TRANSITIONS[from] || [];
}

export function isValidTransition(from: Task034RolloutStatus, to: Task034RolloutStatus): boolean {
  const allowed = TASK034_VALID_STATE_TRANSITIONS[from];
  if (!allowed) return false;
  return allowed.includes(to);
}
