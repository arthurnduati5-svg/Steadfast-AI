import type { Task033ObservationSessionInput, Task033ObservationSessionRecord, Task033ObservationSessionStatus } from '../contracts/task033ControlledCanaryObservationContracts';
import {
  isTask033ValidStateTransition,
  TASK033_VALID_STATE_TRANSITIONS,
  TASK033_ALLOWED_ACTOR_ROLES,
  isTask033DeniedRole,
  resolveTask033ActorRole,
  createTask033SafeTimestamp,
} from '../contracts/task033ControlledCanaryObservationContracts';
import { task033Repository } from '../repositories/task033ControlledCanaryObservationRepository';

function generateSessionId(): string {
  return `obs_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

export async function createTask033Session(input: Task033ObservationSessionInput): Promise<Task033ObservationSessionRecord> {
  const blockingIssues: string[] = [];
  const now = createTask033SafeTimestamp();

  const actorRole = resolveTask033ActorRole(input.actorRole);

  if (isTask033DeniedRole(actorRole)) {
    blockingIssues.push(`denied_actor_role: ${actorRole}`);
  }

  const sessionId = input.sessionId || generateSessionId();

  const record: Task033ObservationSessionRecord = {
    sessionId,
    activationId: input.activationId,
    schoolId: input.schoolId,
    cohortId: input.cohortId,
    actorRole,
    status: 'created',
    observationStage: 'created',
    createdAt: now,
    updatedAt: now,
    blockingIssues,
  };

  await task033Repository.createSession(record);
  return record;
}

export async function transitionTask033SessionStatus(
  session: Task033ObservationSessionRecord,
  to: Task033ObservationSessionStatus,
): Promise<Task033ObservationSessionRecord> {
  if (!isTask033ValidStateTransition(session.status, to)) {
    const updated: Task033ObservationSessionRecord = {
      ...session,
      status: 'blocked',
      observationStage: 'blocked',
      updatedAt: createTask033SafeTimestamp(),
      blockingIssues: [...session.blockingIssues, `invalid_transition: ${session.status} -> ${to}`],
    };
    await task033Repository.updateSession(session.sessionId, updated);
    return updated;
  }

  const updated: Task033ObservationSessionRecord = {
    ...session,
    status: to,
    observationStage: to,
    updatedAt: createTask033SafeTimestamp(),
  };

  await task033Repository.updateSession(session.sessionId, updated);
  return updated;
}

export function listValidTransitions(from: Task033ObservationSessionStatus): Task033ObservationSessionStatus[] {
  return TASK033_VALID_STATE_TRANSITIONS[from] || [];
}

export function isValidTransition(from: Task033ObservationSessionStatus, to: Task033ObservationSessionStatus): boolean {
  return isTask033ValidStateTransition(from, to) && TASK033_VALID_STATE_TRANSITIONS[from]?.includes(to) === true;
}
