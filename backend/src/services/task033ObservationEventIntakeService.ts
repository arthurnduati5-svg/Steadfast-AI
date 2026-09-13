import type { Task033ObservationEventInput, Task033ObservationEventRecord, Task033ActorRole } from '../contracts/task033ControlledCanaryObservationContracts';
import {
  TASK033_FORBIDDEN_OUTPUT_FIELDS,
  TASK033_DENIED_ACTOR_ROLES,
  resolveTask033ActorRole,
  createTask033SafeTimestamp,
} from '../contracts/task033ControlledCanaryObservationContracts';
import { task033Repository } from '../repositories/task033ControlledCanaryObservationRepository';

export async function intakeTask033ObservationEvent(input: Task033ObservationEventInput): Promise<{
  accepted: boolean;
  event: Task033ObservationEventRecord | null;
  reasonCodes: string[];
}> {
  const reasonCodes: string[] = [];
  const actorRole = resolveTask033ActorRole(input.actorRole);

  if (TASK033_DENIED_ACTOR_ROLES.includes(actorRole)) {
    reasonCodes.push(`denied_actor_role: ${actorRole}`);
    return { accepted: false, event: null, reasonCodes };
  }

  if (input.forbiddenFields) {
    const keys = Object.keys(input.forbiddenFields);
    const populatedForbidden = keys.filter(k => {
      const val = input.forbiddenFields![k];
      return val !== false && val !== '' && val !== null && val !== undefined && val !== 0;
    });

    if (populatedForbidden.length > 0) {
      reasonCodes.push(`forbidden_fields_present: ${populatedForbidden.join(',')}`);
    }

    const matchesForbiddenList = keys.filter(k => {
      const val = input.forbiddenFields![k];
      if (val === false || val === '' || val === null || val === undefined || val === 0) return false;
      const lower = k.toLowerCase();
      return TASK033_FORBIDDEN_OUTPUT_FIELDS.some(f => lower.includes(f.toLowerCase()));
    });

    if (matchesForbiddenList.length > 0) {
      reasonCodes.push(`forbidden_output_fields_in_forbidden: ${matchesForbiddenList.join(',')}`);
    }

    if (reasonCodes.length > 0) {
      return { accepted: false, event: null, reasonCodes };
    }
  }

  if (!input.eventId || !input.sessionId) {
    reasonCodes.push('missing_required_fields');
    return { accepted: false, event: null, reasonCodes };
  }

  const event: Task033ObservationEventRecord = {
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
    createdAt: input.createdAt || createTask033SafeTimestamp(),
  };

  await task033Repository.recordEvent(event);
  return { accepted: true, event, reasonCodes: ['event_accepted'] };
}
