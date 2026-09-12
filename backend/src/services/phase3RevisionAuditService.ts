import {
  Phase3RevisionAuditEvent,
  Phase3RevisionAuditEventType,
  Phase3RevisionSafeEvidenceRef,
} from '../contracts/phase3LivingRevisionContracts';
import {
  phase3LivingRevisionRepository,
  phase3LivingRevisionDurableRepository,
} from './phase3LivingRevisionRepository';

function generateEventId(): string {
  return `rev_audit_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
}

export function recordRevisionAuditEvent(params: {
  schoolId: string;
  actorId: string;
  actorRole: string;
  studentId?: string;
  teacherId?: string;
  classId?: string;
  nodeId?: string;
  edgeId?: string;
  objectiveId?: string;
  topicId?: string;
  skillId?: string;
  eventType: Phase3RevisionAuditEventType;
  safeReasonCodes?: string[];
  safeEvidenceRefs?: Phase3RevisionSafeEvidenceRef[];
}): void {
  const event: Phase3RevisionAuditEvent = {
    eventId: generateEventId(),
    schoolId: params.schoolId,
    actorId: params.actorId,
    actorRole: params.actorRole,
    studentId: params.studentId,
    teacherId: params.teacherId,
    classId: params.classId,
    nodeId: params.nodeId,
    edgeId: params.edgeId,
    objectiveId: params.objectiveId,
    topicId: params.topicId,
    skillId: params.skillId,
    eventType: params.eventType,
    safeReasonCodes: params.safeReasonCodes || [],
    safeEvidenceRefs: params.safeEvidenceRefs || [],
    createdAt: new Date().toISOString(),
  };

  phase3LivingRevisionRepository.recordRevisionAuditEvent(event);
}

export function listRevisionAuditEvents(
  schoolId: string,
  limit = 100,
): Phase3RevisionAuditEvent[] {
  return phase3LivingRevisionRepository.listRevisionAuditEvents(schoolId, limit);
}

// ─────────────────────────────────────────────────────────────
// R8-G.3A-D1C durable async production path backed by
// Phase3RevisionAuditRecord. Awaited by the mounted route: a
// successful mutation must not return success while its required
// audit silently fails. Never fire-and-forget.
// ─────────────────────────────────────────────────────────────

export async function recordRevisionAuditEventDurable(params: {
  schoolId: string;
  actorId: string;
  actorRole: string;
  studentId?: string;
  teacherId?: string;
  classId?: string;
  nodeId?: string;
  edgeId?: string;
  objectiveId?: string;
  topicId?: string;
  skillId?: string;
  eventType: Phase3RevisionAuditEventType;
  safeReasonCodes?: string[];
  safeEvidenceRefs?: Phase3RevisionSafeEvidenceRef[];
}): Promise<Phase3RevisionAuditEvent> {
  const event: Phase3RevisionAuditEvent = {
    eventId: `rev_audit_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
    schoolId: params.schoolId,
    actorId: params.actorId,
    actorRole: params.actorRole,
    studentId: params.studentId,
    teacherId: params.teacherId,
    classId: params.classId,
    nodeId: params.nodeId,
    edgeId: params.edgeId,
    objectiveId: params.objectiveId,
    topicId: params.topicId,
    skillId: params.skillId,
    eventType: params.eventType,
    safeReasonCodes: params.safeReasonCodes || [],
    safeEvidenceRefs: params.safeEvidenceRefs || [],
    createdAt: new Date().toISOString(),
  };

  return phase3LivingRevisionDurableRepository.recordRevisionAuditEvent(event);
}

export async function listRevisionAuditEventsDurable(
  schoolId: string,
  limit = 100,
): Promise<Phase3RevisionAuditEvent[]> {
  return phase3LivingRevisionDurableRepository.listRevisionAuditEvents(schoolId, limit);
}
