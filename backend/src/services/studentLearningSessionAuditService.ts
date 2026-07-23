import type {
  StudentLearningSessionMode,
  StudentLearningSessionTransitionType,
  StudentLearningSessionPolicyDecision,
  StudentLearningSessionReasonCode,
  StudentLearningSessionAuditEvent,
} from '../contracts/studentLearningSessionContracts';

const auditStore: StudentLearningSessionAuditEvent[] = [];
const AUDIT_MAX = 5000;

function generateEventId(): string {
  return `aud_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export const SESSION_AUDIT_EVENT_TYPES = [
  'session_created',
  'session_resumed',
  'session_paused',
  'session_completed',
  'session_abandoned',
  'session_expired',
  'session_transition_allowed',
  'session_transition_blocked',
  'session_snapshot_created',
  'session_resume_context_created',
  'session_exit_summary_created',
  'session_evidence_bridged',
  'forbidden_raw_field_rejected',
  'protected_answer_field_rejected',
  'hidden_reasoning_rejected',
  'teacher_only_field_rejected',
  'safeguarding_boundary_applied',
  'deen_referral_applied',
  'session_runtime_failed',
] as const;
export type SessionAuditEventType = typeof SESSION_AUDIT_EVENT_TYPES[number];

export function recordSessionAuditEvent(event: {
  schoolId: string;
  studentId?: string;
  tutorLearnerId: string;
  sessionId: string;
  eventType: SessionAuditEventType;
  currentMode?: StudentLearningSessionMode;
  transitionType?: StudentLearningSessionTransitionType;
  policyDecision?: StudentLearningSessionPolicyDecision;
  safeReasonCodes?: StudentLearningSessionReasonCode[];
}): StudentLearningSessionAuditEvent {
  const ev: StudentLearningSessionAuditEvent = {
    eventId: generateEventId(),
    schoolId: event.schoolId,
    studentId: event.studentId,
    tutorLearnerId: event.tutorLearnerId,
    sessionId: event.sessionId,
    eventType: event.eventType,
    currentMode: event.currentMode,
    transitionType: event.transitionType,
    policyDecision: event.policyDecision,
    safeReasonCodes: event.safeReasonCodes ?? [],
    createdAt: new Date().toISOString(),
  };
  auditStore.push(ev);
  if (auditStore.length > AUDIT_MAX) {
    auditStore.splice(0, auditStore.length - AUDIT_MAX);
  }
  return ev;
}

export function listSessionAuditEvents(sessionId: string): StudentLearningSessionAuditEvent[] {
  return auditStore.filter(e => e.sessionId === sessionId);
}

export function listAllAuditEvents(): StudentLearningSessionAuditEvent[] {
  return [...auditStore];
}

export function clearAuditStoreForTest(): void {
  auditStore.length = 0;
}
