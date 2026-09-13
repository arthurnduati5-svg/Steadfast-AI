import type { ResolvedRecommendation } from './learnerNextStepRecommendationResolver';
import type {
  LearnerRecommendationAuditRecord,
} from './learnerTransparencyContracts';
import type { ResolvedTutorIdentity } from './tutorStateContracts';

const auditRecords: LearnerRecommendationAuditRecord[] = [];

export function buildRecommendationAuditRecord(
  identity: ResolvedTutorIdentity,
  recommendation: ResolvedRecommendation,
  requestId: string,
): LearnerRecommendationAuditRecord {
  const record: LearnerRecommendationAuditRecord = {
    actorId: identity.studentId,
    actorRole: 'learner',
    schoolId: identity.schoolId,
    tutorLearnerId: identity.studentId,
    recommendationType: recommendation.recommendationType,
    reasonCodes: [recommendation.reasonCode],
    safeEvidenceRefs: [],
    privacyDecision: 'teacher_safe',
    deenSensitivityHandled: recommendation.recommendationType === 'deen_teacher_referral',
    safeguardingBoundaryApplied: true,
    generatedAt: new Date().toISOString(),
    requestId,
  };

  auditRecords.push(record);
  if (auditRecords.length > 1000) {
    auditRecords.splice(0, auditRecords.length - 1000);
  }

  return record;
}

export function listRecommendationAuditRecords(
  identity: ResolvedTutorIdentity,
  limit?: number,
): LearnerRecommendationAuditRecord[] {
  const studentRecords = auditRecords.filter(
    (r) => r.tutorLearnerId === identity.studentId && r.schoolId === identity.schoolId,
  );
  return studentRecords.slice(-(limit || 50));
}

export function clearAuditRecordsForTest(): void {
  auditRecords.length = 0;
}
