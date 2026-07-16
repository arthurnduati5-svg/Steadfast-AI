export interface RecoveryCaseTriageCommandContext {
  schoolId: string;
  actorId: string;
  actorRole: string;
  correlationId: string;
  idempotencyKey: string;
  sourceRefsJson: Record<string, unknown>;
}

export interface RecoveryCaseTriageSafeEnvelope<T = unknown> {
  success: boolean;
  status: string;
  data?: T;
  message?: string;
  correlationId?: string;
  errorCode?: string;
}

export interface RecoveryCaseTriagePolicyDecision {
  allowed: boolean;
  denied: boolean;
  reasonCodes: string[];
}

export type RecoveryCaseTriageReadinessStatus = 'draft' | 'ready' | 'review_ready' | 'stale' | 'blocked' | 'suppressed' | 'void';
export type RecoveryCasePriorityAssessmentStatus = 'draft' | 'scored' | 'review_ready' | 'stale' | 'blocked' | 'void';
export type RecoveryCaseTriageQueueSnapshotStatus = 'draft' | 'generated' | 'review_ready' | 'stale' | 'blocked' | 'void';
export type RecoveryCaseQueueItemStatus = 'queued' | 'review_ready' | 'deferred' | 'capacity_exceeded' | 'blocked' | 'suppressed_duplicate' | 'void';
export type RecoveryCaseDraftStatus = 'draft' | 'review_ready' | 'approved_for_future_use' | 'blocked' | 'suppressed' | 'void';
export type RecoveryCasePriorityBand = 'critical_review' | 'high' | 'normal' | 'low' | 'deferred';
export type RecoveryCaseRiskRank = 'critical' | 'high' | 'medium' | 'low' | 'none';
export type RecoveryCaseTriageDecision = 'queued' | 'review_ready' | 'deferred' | 'capacity_exceeded' | 'block_missing_context' | 'blocked_fairness' | 'suppressed_duplicate';
export type RecoveryCaseFairnessStatus = 'allowed' | 'blocked' | 'needs_review';
export type RecoveryCaseCapacityStatus = 'draft' | 'review_ready' | 'capacity_exceeded' | 'void';
export type RecoveryCaseAudienceRole = 'teacher' | 'lead_teacher' | 'department_head' | 'admin' | 'system_job';

export const ForbiddenActorRoles: readonly string[] = ['student', 'parent', 'guest', 'unknown'];

export const AllowedActorRoles: readonly string[] = ['teacher', 'lead_teacher', 'department_head', 'admin', 'system_job'];

export const PROHIBITED_STATUSES: readonly string[] = [
  'assigned', 'assignment_created', 'sent', 'notified', 'published', 'executed',
  'authorized_live', 'live_authorized', 'activated', 'completed_live', 'closed_live',
  'synced', 'mutated',
];

export const ForbiddenEntityFields: readonly string[] = [
  'rawStudentAnswer', 'answerKeyText', 'rubricText', 'internalReasoning',
  'chainOfThought', 'aiNarrative', 'generatedNarrative', 'modelOutput',
  'ocrText', 'rawQuestionMetadata', 'teacherOnlyNotes', 'markingNotesTeacherOnly',
  'unreleasedScore', 'unreleasedGrade', 'scoreBeforeFinalization',
  'finalGradeBeforeRelease', 'parentDeliveryPayload', 'studentDeliveryPayload',
  'notificationPayload', 'emailPayload', 'smsPayload', 'pushPayload',
  'whatsAppPayload', 'portalPayload', 'pdfBinary', 'htmlExport',
  'liveProviderPayload', 'providerSecret', 'apiKey', 'externalSyncPayload',
];

export const PROHIBITED_RANKING_FACTORS: readonly string[] = [
  'race', 'ethnicity', 'religiousIdentity', 'sectIdentity', 'genderIdentity',
  'sexualOrientation', 'familyIncome', 'paymentStatus', 'parentEngagementScore',
  'diagnosis', 'medicalAssessment', 'psychologicalAssessment', 'rawStudentAnswer',
  'answerKeyText', 'unreleasedScore', 'unreleasedGrade', 'teacherPreferenceScore',
  'studentPopularity', 'behaviorScore', 'attendanceScore', 'parentOccupation',
  'homeAddress', 'socioeconomicIndicator', 'socialMediaActivity',
  'extracurricularInvolvement', 'personalityProfile',
];

export const PRIORITY_FACTOR_CODES: readonly string[] = [
  'risk_level', 'active_blocker', 'admin_review_required', 'teacher_review_required',
  'board_stale', 'authorization_preview_concern', 'simulation_concern', 'case_age',
];

export const SCORING_POLICY_VERSION = 'RECOVERY_CASE_TRIAGE_PRIORITY_V1';
