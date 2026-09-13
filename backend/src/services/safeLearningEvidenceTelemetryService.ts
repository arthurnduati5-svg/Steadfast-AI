import { safeLearningEvidenceRepository } from './safeLearningEvidenceRepository';
import type { SafeLearningEvidenceTelemetryEvent } from '../contracts/safeLearningEvidenceContracts';

const TELEMETRY_EVENT_TYPES = [
  'safe_evidence_ingest_received',
  'safe_evidence_ingest_rejected',
  'safe_evidence_duplicate_ignored',
  'safe_evidence_persisted',
  'safe_evidence_aggregate_updated',
  'safe_growth_proof_created',
  'safe_mastery_candidate_created',
  'safe_weak_topic_candidate_created',
  'safe_revision_candidate_created',
  'safe_evidence_view_returned',
  'safe_evidence_ingest_failed',
] as const;

export type TelemetryEventType = typeof TELEMETRY_EVENT_TYPES[number];

export class SafeLearningEvidenceTelemetryService {
  recordEvent(params: {
    schoolId: string;
    studentId?: string;
    eventType: TelemetryEventType;
    policyDecision: string;
    safeReasonCodes: string[];
    safeMetadata?: Record<string, unknown>;
  }): SafeLearningEvidenceTelemetryEvent {
    const event: SafeLearningEvidenceTelemetryEvent = {
      id: '',
      schoolId: params.schoolId,
      studentId: params.studentId,
      eventType: params.eventType,
      policyDecision: params.policyDecision,
      safeReasonCodes: params.safeReasonCodes,
      safeMetadataJson: params.safeMetadata || {},
      createdAt: new Date().toISOString(),
    };
    return safeLearningEvidenceRepository.createAuditEvent(event);
  }

  recordIngestReceived(schoolId: string, studentId?: string): SafeLearningEvidenceTelemetryEvent {
    return this.recordEvent({ schoolId, studentId, eventType: 'safe_evidence_ingest_received', policyDecision: 'allowed', safeReasonCodes: ['ingest_received'] });
  }

  recordIngestRejected(schoolId: string, reasonCodes: string[]): SafeLearningEvidenceTelemetryEvent {
    return this.recordEvent({ schoolId, eventType: 'safe_evidence_ingest_rejected', policyDecision: 'blocked', safeReasonCodes: reasonCodes });
  }

  recordDuplicateIgnored(schoolId: string, idempotencyKey: string): SafeLearningEvidenceTelemetryEvent {
    return this.recordEvent({ schoolId, eventType: 'safe_evidence_duplicate_ignored', policyDecision: 'duplicate_ignored', safeReasonCodes: ['duplicate_idempotency_key'], safeMetadata: { idempotencyKey } });
  }

  recordEvidencePersisted(schoolId: string, studentId: string): SafeLearningEvidenceTelemetryEvent {
    return this.recordEvent({ schoolId, studentId, eventType: 'safe_evidence_persisted', policyDecision: 'allowed', safeReasonCodes: ['evidence_persisted'] });
  }

  recordAggregateUpdated(schoolId: string, studentId: string): SafeLearningEvidenceTelemetryEvent {
    return this.recordEvent({ schoolId, studentId, eventType: 'safe_evidence_aggregate_updated', policyDecision: 'allowed', safeReasonCodes: ['aggregate_updated'] });
  }

  recordViewReturned(schoolId: string, viewType: string): SafeLearningEvidenceTelemetryEvent {
    return this.recordEvent({ schoolId, eventType: 'safe_evidence_view_returned', policyDecision: 'allowed', safeReasonCodes: [`${viewType}_returned`] });
  }

  recordFailed(schoolId: string, reason: string): SafeLearningEvidenceTelemetryEvent {
    return this.recordEvent({ schoolId, eventType: 'safe_evidence_ingest_failed', policyDecision: 'failed', safeReasonCodes: [reason] });
  }
}

export const safeLearningEvidenceTelemetryService = new SafeLearningEvidenceTelemetryService();
