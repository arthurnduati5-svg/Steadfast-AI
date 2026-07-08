import { task028ExpansionExecutionRepository } from '../repositories/task028ExpansionExecutionRepository';
import type {
  Task028ExpansionEvidenceEvent,
  Task028ExpansionEvidenceEventInput,
} from '../contracts/task028ControlledExpansionExecutionContracts';
import { nowISO } from '../contracts/task028ControlledExpansionExecutionContracts';
import {
  validateTask028ExpansionEvidenceEventInput,
  rejectTask028ForbiddenFields,
  createSafeTask028ValidationError,
} from '../lib/task028ControlledExpansionExecutionValidation';

function sanitizeMetadata(
  raw: Record<string, unknown>,
  errors: string[],
): Record<string, unknown> {
  rejectTask028ForbiddenFields(raw, errors);
  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === 'string' && value.length > 0) {
      if (/^[\w\s\-_.:,@()]+$/.test(value)) {
        safe[key] = value;
      } else {
        safe[key] = '[redacted]';
      }
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      safe[key] = value;
    } else if (value === null) {
      safe[key] = null;
    } else if (Array.isArray(value)) {
      safe[key] = value.map((v: unknown) =>
        typeof v === 'string' ? v.replace(/[^a-zA-Z0-9\-_]/g, '') : v,
      );
    } else if (typeof value === 'object') {
      safe[key] = sanitizeMetadata(value as Record<string, unknown>, errors);
    } else {
      safe[key] = '[redacted]';
    }
  }
  return safe;
}

export async function recordEvidenceEvent(
  input: Task028ExpansionEvidenceEventInput,
): Promise<Task028ExpansionEvidenceEvent> {
  const errors = validateTask028ExpansionEvidenceEventInput(input);
  if (errors.length > 0) {
    throw createSafeTask028ValidationError('Invalid evidence event input.', errors);
  }

  const safeMetadata = sanitizeMetadata(input.safeMetadata, errors);

  const run = await task028ExpansionExecutionRepository.getExecutionRun(input.runId);
  if (!run) {
    throw createSafeTask028ValidationError('Execution run not found.', ['execution_run_not_found']);
  }
  const runAny = run as any;

  const runtimeEvent = await task028ExpansionExecutionRepository.createRuntimeEvent({
    executionRunId: input.runId,
    pilotProgramId: runAny.pilotProgramId,
    schoolId: input.schoolId,
    actorRole: input.actorRole,
    actorIdHash: input.actorId,
    eventType: 'evidence_recorded',
    eventStatus: input.eventType,
    safeSummary: `Evidence event ${input.eventType} recorded by ${input.actorRole}.`,
    metadataSafeJson: {
      eventType: input.eventType,
      safeMetadata,
      actorRole: input.actorRole,
      timestamp: nowISO(),
    },
  });

  const event: Task028ExpansionEvidenceEvent = {
    eventId: (runtimeEvent as any).id,
    runId: input.runId,
    schoolId: input.schoolId,
    eventType: input.eventType as any,
    safeMetadata,
    actorRole: input.actorRole,
    createdAt: nowISO(),
  };

  return event;
}
