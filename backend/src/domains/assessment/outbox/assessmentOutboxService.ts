import { randomUUID } from 'crypto';
import type {
  AssessmentOutboxEvent,
  AssessmentInboxReceipt,
  AssessmentOutboxRepository,
  AssessmentInboxRepository,
} from '../contracts/assessmentOutboxContracts';
import type { AssessmentCommandContext } from '../contracts/assessmentCommandContext';

const FORBIDDEN_PAYLOAD_FIELDS = new Set([
  'answerKey', 'correctAnswer', 'modelAnswer', 'markingScheme',
  'rubricInternal', 'teacherOnlyNotes', 'rawStudentAnswer',
  'rawStudentWork', 'rawIntegritySignal', 'peerIdentifiableData',
  'rawParentData', 'rawTeacherData', 'rawPrompt', 'rawProviderResponse',
  'chainOfThought', 'hiddenReasoning', 'scratchpad', 'secret',
  'token', 'apiKey',
]);

function validatePayload(payload: Record<string, unknown>): void {
  function scan(obj: Record<string, unknown>, path = ''): void {
    for (const [key, value] of Object.entries(obj)) {
      if (FORBIDDEN_PAYLOAD_FIELDS.has(key)) {
        throw new Error(`Outbox payload rejected: forbidden field "${path}${key}"`);
      }
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        scan(value as Record<string, unknown>, `${path}${key}.`);
      }
    }
  }
  scan(payload);
}

export class AssessmentOutboxService {
  constructor(
    private outboxRepository: AssessmentOutboxRepository,
    private inboxRepository: AssessmentInboxRepository,
    private requireOutbox: boolean,
  ) {}

  async publish(input: {
    eventType: string;
    schemaVersion: string;
    context: AssessmentCommandContext;
    aggregateType: string;
    aggregateId: string;
    aggregateVersion?: number;
    payload: Record<string, unknown>;
  }): Promise<{ ok: boolean; eventId: string; failureReason?: string }> {
    if (!input.schemaVersion) {
      return { ok: false, eventId: '', failureReason: 'schemaVersion_required' };
    }

    try {
      validatePayload(input.payload);
    } catch (e) {
      return { ok: false, eventId: '', failureReason: (e as Error).message };
    }

    const event: AssessmentOutboxEvent = {
      eventId: randomUUID(),
      eventType: input.eventType,
      schemaVersion: input.schemaVersion,
      schoolId: input.context.schoolId,
      aggregateType: input.aggregateType,
      aggregateId: input.aggregateId,
      aggregateVersion: input.aggregateVersion,
      correlationId: input.context.correlationId,
      causationId: input.context.causationId,
      policyVersionRefs: input.context.policyVersionRefs,
      payload: input.payload,
      status: 'pending',
      attemptCount: 0,
      createdAt: new Date().toISOString(),
      publishedAt: undefined,
      lastErrorCode: undefined,
    };

    try {
      await this.outboxRepository.create(event);
      return { ok: true, eventId: event.eventId };
    } catch (e) {
      if (this.requireOutbox) {
        return { ok: false, eventId: event.eventId, failureReason: 'outbox_write_failed' };
      }
      return { ok: true, eventId: event.eventId };
    }
  }

  async processInbox(eventId: string, consumerName: string, schoolId: string): Promise<{
    ok: boolean;
    status: string;
  }> {
    const existing = await this.inboxRepository.findReceipt(eventId, consumerName);

    if (existing) {
      return { ok: true, status: 'duplicate' };
    }

    const receipt: AssessmentInboxReceipt = {
      eventId,
      consumerName,
      schoolId,
      processedVersion: 1,
      status: 'received',
      processedAt: new Date().toISOString(),
      lastErrorCode: undefined,
    };

    await this.inboxRepository.upsert(receipt);
    return { ok: true, status: 'received' };
  }
}
