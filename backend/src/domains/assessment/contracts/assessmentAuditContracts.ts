import type { AssessmentActorRole } from './assessmentCommandContext';

export type AssessmentAuditEventType =
  | 'assessment_command_executed'
  | 'assessment_command_blocked'
  | 'assessment_policy_blocked'
  | 'assessment_idempotency_hit'
  | 'assessment_idempotency_conflict'
  | 'assessment_version_conflict'
  | 'assessment_projection_stripped'
  | 'assessment_outbox_published'
  | 'assessment_outbox_failed';

export interface AssessmentAuditEvent {
  eventId: string;
  eventType: AssessmentAuditEventType;
  schoolId: string;
  actorId: string;
  actorRole: AssessmentActorRole;
  aggregateType: string;
  aggregateId: string;
  aggregateVersion: number | undefined;
  correlationId: string;
  causationId: string | undefined;
  idempotencyKey: string | undefined;
  reasonCode: string;
  safeSummary: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface AssessmentAuditWriter {
  write(event: AssessmentAuditEvent): Promise<{ ok: boolean; eventId: string; failureReason?: string }>;
}

export interface AssessmentAuditConfig {
  requireAudit: boolean;
}
