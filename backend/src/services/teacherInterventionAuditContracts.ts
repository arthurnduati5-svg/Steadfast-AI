// ─────────────────────────────────────────────────────────────
// Steadfast AI — Teacher Intervention Audit Contracts v1
// Defines audit event types, audit event shape, and redaction
// rules for the teacher intervention lifecycle.
// ─────────────────────────────────────────────────────────────

export type TeacherInterventionAuditEventType =
  | 'teacher_intervention_created'
  | 'teacher_intervention_assigned'
  | 'teacher_intervention_status_changed'
  | 'teacher_intervention_viewed_by_learner'
  | 'teacher_intervention_started'
  | 'teacher_intervention_submitted'
  | 'teacher_intervention_completed'
  | 'teacher_intervention_cancelled'
  | 'teacher_intervention_dismissed'
  | 'teacher_intervention_expired'
  | 'teacher_intervention_closed'
  | 'teacher_intervention_follow_up_required'
  | 'teacher_intervention_follow_up_completed'
  | 'teacher_intervention_outcome_recorded'
  | 'teacher_intervention_evidence_attached'
  | 'teacher_intervention_scope_denied'
  | 'teacher_intervention_forbidden_attempt';

export interface TeacherInterventionAuditEvent {
  id: string;
  interventionId: string;
  actorId: string;
  actorRole: string;
  schoolId: string;
  classId?: string | null;
  studentId: string;
  eventType: TeacherInterventionAuditEventType;
  eventTime: string;
  safeSummary: string;
  redactedPayload: Record<string, unknown>;
  metadata: Record<string, unknown>;
  requestId?: string | null;
  createdAt: string;
}

export interface TeacherInterventionAuditCreateInput {
  interventionId: string;
  actorId: string;
  actorRole?: string;
  schoolId: string;
  classId?: string | null;
  studentId: string;
  eventType: TeacherInterventionAuditEventType;
  safeSummary: string;
  payload?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  requestId?: string | null;
}

export interface TeacherInterventionAuditListRequest {
  schoolId: string;
  studentId?: string;
  interventionId?: string;
  eventType?: TeacherInterventionAuditEventType;
  limit?: number;
  before?: string;
}

export interface TeacherInterventionAuditListResponse {
  events: TeacherInterventionAuditEvent[];
  totalCount: number;
  hasMore: boolean;
}

/**
 * Safe summary templates for each audit event type.
 * Used by the audit service when recording events.
 */
export const AUDIT_SAFE_SUMMARIES: Record<TeacherInterventionAuditEventType, (details?: any) => string> = {
  teacher_intervention_created: () => 'Teacher intervention assignment was created.',
  teacher_intervention_assigned: () => 'Teacher intervention was assigned to student.',
  teacher_intervention_status_changed: (d) => `Intervention status changed to ${d?.newStatus || 'unknown'}.`,
  teacher_intervention_viewed_by_learner: () => 'Student viewed assigned intervention.',
  teacher_intervention_started: () => 'Student started the assigned intervention.',
  teacher_intervention_submitted: () => 'Student submitted the assigned intervention.',
  teacher_intervention_completed: () => 'Intervention was completed.',
  teacher_intervention_cancelled: () => 'Intervention was cancelled.',
  teacher_intervention_dismissed: () => 'Intervention recommendation was dismissed.',
  teacher_intervention_expired: () => 'Intervention expired without completion.',
  teacher_intervention_closed: () => 'Intervention was closed.',
  teacher_intervention_follow_up_required: () => 'Follow-up was required for intervention.',
  teacher_intervention_follow_up_completed: () => 'Follow-up was completed for intervention.',
  teacher_intervention_outcome_recorded: (d) => `Outcome recorded: ${d?.outcome || 'unknown'}.`,
  teacher_intervention_evidence_attached: () => 'Evidence was attached to intervention.',
  teacher_intervention_scope_denied: (d) => `Scope denied for teacher ${d?.teacherId || 'unknown'}.`,
  teacher_intervention_forbidden_attempt: (d) => `Forbidden ${d?.action || 'access'} attempt by ${d?.actorId || 'unknown'}.`,
};
