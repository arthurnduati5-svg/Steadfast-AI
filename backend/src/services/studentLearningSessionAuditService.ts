import type {
  StudentLearningSessionMode,
  StudentLearningSessionTransitionType,
  StudentLearningSessionPolicyDecision,
  StudentLearningSessionReasonCode,
  StudentLearningSessionAuditEvent,
} from '../contracts/studentLearningSessionContracts';
import { studentLearningSessionRepository } from './studentLearningSessionRepository';

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

export async function recordSessionAuditEvent(event: {
  schoolId: string;
  studentId?: string;
  tutorLearnerId: string;
  sessionId: string;
  eventType: SessionAuditEventType;
  currentMode?: StudentLearningSessionMode;
  transitionType?: StudentLearningSessionTransitionType;
  policyDecision?: StudentLearningSessionPolicyDecision;
  safeReasonCodes?: StudentLearningSessionReasonCode[];
  operationVersion?: number;
}): Promise<StudentLearningSessionAuditEvent> {
  let operationVersion = event.operationVersion;
  if (operationVersion === undefined) {
    const session = await studentLearningSessionRepository.getSessionWithVersion(event.sessionId, event.schoolId, event.tutorLearnerId);
    operationVersion = session?.stateVersion ?? 1;
  }

  const result = await studentLearningSessionRepository.appendEvent({
    schoolId: event.schoolId,
    tutorLearnerId: event.tutorLearnerId,
    sessionId: event.sessionId,
    studentId: event.studentId,
    eventType: event.eventType,
    transitionType: event.transitionType,
    nextMode: event.currentMode,
    safeEventSummary: event.eventType,
    safeEvidenceRefs: [],
    reasonCodes: event.safeReasonCodes,
    privacyMetadata: {
      policyDecision: event.policyDecision,
    },
    operationVersion,
  });

  return {
    eventId: result.id,
    schoolId: result.schoolId,
    studentId: result.studentId,
    tutorLearnerId: result.tutorLearnerId,
    sessionId: result.sessionId,
    eventType: result.eventType as SessionAuditEventType,
    currentMode: result.nextMode as StudentLearningSessionMode | undefined,
    transitionType: result.transitionType as StudentLearningSessionTransitionType | undefined,
    policyDecision: (result.privacyMetadata as Record<string, unknown> | undefined)?.policyDecision as StudentLearningSessionPolicyDecision | undefined,
    safeReasonCodes: result.reasonCodes as StudentLearningSessionReasonCode[],
    createdAt: result.createdAt.toISOString(),
  };
}

export async function listSessionAuditEvents(
  sessionId: string,
  schoolId: string,
  tutorLearnerId: string,
): Promise<StudentLearningSessionAuditEvent[]> {
  const events = await studentLearningSessionRepository.listEvents(sessionId, schoolId, tutorLearnerId);
  return events.map(e => ({
    eventId: e.id,
    schoolId: e.schoolId,
    studentId: e.studentId,
    tutorLearnerId: e.tutorLearnerId,
    sessionId: e.sessionId,
    eventType: e.eventType as SessionAuditEventType,
    currentMode: e.nextMode as StudentLearningSessionMode | undefined,
    transitionType: e.transitionType as StudentLearningSessionTransitionType | undefined,
    policyDecision: (e.privacyMetadata as Record<string, unknown> | undefined)?.policyDecision as StudentLearningSessionPolicyDecision | undefined,
    safeReasonCodes: e.reasonCodes as StudentLearningSessionReasonCode[],
    createdAt: e.createdAt.toISOString(),
  }));
}

export async function listAllAuditEvents(): Promise<StudentLearningSessionAuditEvent[]> {
  return [];
}

export function clearAuditStoreForTest(): void {
}