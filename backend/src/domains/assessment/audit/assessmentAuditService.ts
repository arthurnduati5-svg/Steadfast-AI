import { randomUUID } from 'crypto';
import type {
  AssessmentAuditEvent,
  AssessmentAuditEventType,
  AssessmentAuditWriter,
  AssessmentAuditConfig,
} from '../contracts/assessmentAuditContracts';
import type { AssessmentCommandContext } from '../contracts/assessmentCommandContext';

const REDACTED_METADATA_FIELDS = new Set([
  'answerKey', 'correctAnswer', 'modelAnswer', 'markingScheme',
  'rubricInternal', 'teacherOnlyNotes', 'rawStudentAnswer',
  'rawStudentWork', 'rawIntegritySignal', 'peerIdentifiableData',
  'rawParentData', 'rawTeacherData', 'rawPrompt', 'rawProviderResponse',
  'chainOfThought', 'hiddenReasoning', 'scratchpad', 'secret',
  'token', 'apiKey',
]);

function redactMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (REDACTED_METADATA_FIELDS.has(key)) {
      safe[key] = '[REDACTED]';
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      safe[key] = redactMetadata(value as Record<string, unknown>);
    } else {
      safe[key] = value;
    }
  }
  return safe;
}

export class AssessmentAuditService {
  constructor(
    private writer: AssessmentAuditWriter,
    private config: AssessmentAuditConfig = { requireAudit: true },
  ) {}

  async writeAuditEvent(input: {
    eventType: AssessmentAuditEventType;
    context: AssessmentCommandContext;
    aggregateType: string;
    aggregateId: string;
    aggregateVersion?: number;
    reasonCode: string;
    safeSummary: string;
    metadata?: Record<string, unknown>;
  }): Promise<{ ok: boolean; eventId: string; failureReason?: string }> {
    const event: AssessmentAuditEvent = {
      eventId: randomUUID(),
      eventType: input.eventType,
      schoolId: input.context.schoolId,
      actorId: input.context.actorId,
      actorRole: input.context.actorRole,
      aggregateType: input.aggregateType,
      aggregateId: input.aggregateId,
      aggregateVersion: input.aggregateVersion,
      correlationId: input.context.correlationId,
      causationId: input.context.causationId,
      idempotencyKey: input.context.idempotencyKey,
      reasonCode: input.reasonCode,
      safeSummary: input.safeSummary,
      metadata: redactMetadata(input.metadata ?? {}),
      createdAt: new Date().toISOString(),
    };

    const result = await this.writer.write(event);

    if (!result.ok && this.config.requireAudit) {
      return { ok: false, eventId: result.eventId, failureReason: result.failureReason ?? 'audit_write_failed' };
    }

    return result;
  }
}
