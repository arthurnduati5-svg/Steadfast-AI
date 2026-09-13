// ─────────────────────────────────────────────────────────────
// Steadfast AI — Durable Audit Event Contracts v1
// Defines the typed contract for durable audit persistence,
// including categories, severity, visibility, actor scope,
// redaction state, event payload, write results, query filters,
// and safe views.
// ─────────────────────────────────────────────────────────────

export type DurableAuditEventCategory =
  | 'request_lifecycle'
  | 'route_access'
  | 'authentication'
  | 'authorization_scope'
  | 'privacy'
  | 'safeguarding'
  | 'teacher_intervention'
  | 'learner_memory'
  | 'tutor_state'
  | 'practice_mastery'
  | 'growth_data_reliability'
  | 'ai_runtime_reliability'
  | 'source_trust'
  | 'artifact_safety'
  | 'video_learning'
  | 'backend_health'
  | 'backend_error'
  | 'report_integrity'
  | 'truth_audit'
  | 'release_gate'
  | 'no_false_pass'
  | 'unknown';

export type DurableAuditSeverity =
  | 'debug'
  | 'info'
  | 'notice'
  | 'warning'
  | 'error'
  | 'critical';

export type DurableAuditVisibility =
  | 'system_internal'
  | 'school_admin_safe'
  | 'teacher_safe'
  | 'learner_safe'
  | 'safeguarding_only'
  | 'security_only';

export type DurableAuditActor = {
  actorType:
    | 'student'
    | 'teacher'
    | 'admin'
    | 'system'
    | 'ai_runtime'
    | 'safeguarding_worker'
    | 'unknown';
  actorIdHash?: string;
  studentIdHash?: string;
  schoolIdHash?: string;
  classIdHash?: string;
};

export type DurableAuditRedactionState = {
  redacted: true;
  rawPrivateDataIncluded: false;
  rawPromptIncluded: false;
  rawAiResponseIncluded: false;
  rawChatIncluded: false;
  rawTranscriptIncluded: false;
  rawLearnerMemoryIncluded: false;
  rawSafeguardingEvidenceIncluded: false;
  answerKeyIncluded: false;
  secretIncluded: false;
  redactionVersion: string;
};

export type DurableAuditEventPayload = {
  eventId?: string;
  category: DurableAuditEventCategory;
  eventType: string;
  severity: DurableAuditSeverity;
  visibility: DurableAuditVisibility;
  actor: DurableAuditActor;
  requestId?: string;
  traceId?: string;
  route?: string;
  method?: string;
  serviceName?: string;
  operation?: string;
  safeSummary: string;
  safeMetadata?: Record<string, unknown>;
  redaction: DurableAuditRedactionState;
  occurredAt: string;
};

export type DurableAuditWriteResult = {
  ok: boolean;
  eventId?: string;
  degraded: boolean;
  failureReason?:
    | 'db_unavailable'
    | 'validation_failed'
    | 'redaction_failed'
    | 'scope_failed'
    | 'unknown';
  safeMessage: string;
};

export type DurableAuditQueryFilter = {
  category?: DurableAuditEventCategory;
  visibility?: DurableAuditVisibility;
  actorType?: DurableAuditActor['actorType'];
  studentId?: string;
  schoolId?: string;
  requestId?: string;
  traceId?: string;
  route?: string;
  eventType?: string;
  from?: string;
  to?: string;
  limit?: number;
  cursor?: string;
};

export type DurableAuditSafeView = {
  eventId: string;
  category: DurableAuditEventCategory;
  eventType: string;
  severity: DurableAuditSeverity;
  visibility: DurableAuditVisibility;
  actorType: DurableAuditActor['actorType'];
  requestId?: string;
  traceId?: string;
  route?: string;
  method?: string;
  serviceName?: string;
  operation?: string;
  safeSummary: string;
  safeMetadata?: Record<string, unknown>;
  occurredAt: string;
  persistedAt: string;
  redacted: true;
};
