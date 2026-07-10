import type { Task034ControlledRolloutEventInput, Task034ControlledRolloutEventRecord, Task034ActorRole } from '../contracts/task034ControlledLimitedRolloutContracts';
import {
  TASK034_FORBIDDEN_OUTPUT_FIELDS,
  TASK034_DENIED_ACTOR_ROLES,
  resolveTask034ActorRole,
  createTask034SafeTimestamp,
} from '../contracts/task034ControlledLimitedRolloutContracts';
import { task034Repository } from '../repositories/task034ControlledLimitedRolloutRepository';

export async function intakeTask034RolloutEvent(
  input: Task034ControlledRolloutEventInput,
): Promise<Task034ControlledRolloutEventRecord | null> {
  const actorRole = resolveTask034ActorRole(input.actorRole);

  if (TASK034_DENIED_ACTOR_ROLES.includes(actorRole)) {
    return null;
  }

  if (!input.eventId || !input.sessionId) {
    return null;
  }

  const event: Task034ControlledRolloutEventRecord = {
    eventId: input.eventId,
    sessionId: input.sessionId,
    activationId: input.activationId,
    schoolId: input.schoolId,
    actorRole,
    safeActorHash: input.safeActorHash,
    safeStudentHash: input.safeStudentHash,
    cohortId: input.cohortId,
    classId: input.classId,
    subjectId: input.subjectId,
    eventType: input.eventType,
    safeReasonCodes: input.safeReasonCodes,
    safeSummary: input.safeSummary,
    gateName: input.gateName,
    gatePassed: input.gatePassed,
    latencyMs: input.latencyMs,
    errorCategory: input.errorCategory,
    createdAt: input.createdAt || createTask034SafeTimestamp(),
  };

  await task034Repository.saveRolloutEvent(event);
  return event;
}
