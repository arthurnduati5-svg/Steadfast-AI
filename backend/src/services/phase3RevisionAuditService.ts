import {
  Phase3RevisionAuditEvent,
  Phase3RevisionAuditEventType,
  Phase3RevisionSafeEvidenceRef,
} from '../contracts/phase3LivingRevisionContracts';
import { phase3LivingRevisionRepository } from './phase3LivingRevisionRepository';

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
