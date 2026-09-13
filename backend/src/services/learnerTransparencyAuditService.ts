import type {
  LearnerTransparencyAuditEvent,
  LearnerTransparencySurface,
  LearnerTransparencyPolicyDecision,
  LearnerTransparencyReasonCode,
  LearnerTransparencySourceTruthStatus,
  LearnerTransparencyConfidenceBucket,
  LearnerTransparencyAuditEventType,
} from '../contracts/learnerTransparencyContracts';

interface StoredAuditEvent extends LearnerTransparencyAuditEvent {
  eventType: LearnerTransparencyAuditEventType;
}

const auditStore: StoredAuditEvent[] = [];
let idCounter = 0;

export function recordLearnerTransparencyEvent(params: {
  schoolId: string;
  studentId: string;
  tutorLearnerId?: string;
  surface: LearnerTransparencySurface;
  eventType: LearnerTransparencyAuditEventType;
  policyDecision: LearnerTransparencyPolicyDecision;
  safeReasonCodes: LearnerTransparencyReasonCode[];
  sourceTruthStatus: LearnerTransparencySourceTruthStatus;
  confidenceBucket: LearnerTransparencyConfidenceBucket;
}): LearnerTransparencyAuditEvent {
  const event: StoredAuditEvent = {
    id: `lta-${Date.now()}-${idCounter++}`,
    schoolId: params.schoolId,
    studentId: params.studentId,
    tutorLearnerId: params.tutorLearnerId,
    surface: params.surface,
    eventType: params.eventType,
    policyDecision: params.policyDecision,
    safeReasonCodes: params.safeReasonCodes,
    sourceTruthStatus: params.sourceTruthStatus,
    confidenceBucket: params.confidenceBucket,
    createdAt: new Date().toISOString(),
  };

  auditStore.push(event);
  if (auditStore.length > 1000) {
    auditStore.splice(0, auditStore.length - 1000);
  }

  return event;
}

export function listLearnerTransparencyEvents(params: {
  schoolId: string;
  studentId: string;
  limit?: number;
}): LearnerTransparencyAuditEvent[] {
  const filtered = auditStore.filter(
    (e) => e.schoolId === params.schoolId && e.studentId === params.studentId,
  );
  return filtered.slice(-(params.limit ?? 50));
}

export function countLearnerTransparencyEvents(schoolId: string): number {
  return auditStore.filter((e) => e.schoolId === schoolId).length;
}

export function clearAuditStoreForTest(): void {
  auditStore.length = 0;
}
