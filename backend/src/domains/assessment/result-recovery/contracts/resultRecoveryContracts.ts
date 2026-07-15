export type ResultRecoveryPlanStatus = 'draft' | 'review_ready' | 'approved_for_future_use' | 'suppressed' | 'blocked' | 'void';
export type ResultRecoveryPlanMode = 'mock_plan_only' | 'future_recovery_plan' | 'teacher_review_only' | 'metadata_only';
export type ResultRecoveryPlanPriority = 'low' | 'medium' | 'high' | 'urgent_review_required';

export type ResultRecoveryObjectiveStatus = 'draft' | 'ready' | 'completed_mock' | 'suppressed' | 'void';
export type ResultRecoveryObjectiveType = 'concept_repair' | 'practice_reinforcement' | 'confidence_rebuild' | 'mistake_pattern_review' | 'exam_strategy_review' | 'reflection_support' | 'teacher_review_support';

export type ResultRecoveryStepStatus = 'draft' | 'review_ready' | 'approved_for_future_use' | 'completed_mock' | 'suppressed' | 'void';
export type ResultRecoveryStepType = 'review_concept' | 'redo_similar_practice' | 'reflect_on_error' | 'teacher_check_in' | 'parent_support_note' | 'confidence_check' | 'checkpoint_review';

export type ResultRecoveryPracticeDraftStatus = 'draft' | 'review_ready' | 'approved_for_future_use' | 'suppressed' | 'blocked' | 'void';
export type ResultRecoveryResourceRecommendationStatus = 'draft' | 'review_ready' | 'approved_for_future_use' | 'suppressed' | 'blocked' | 'void';
export type ResultRecoveryTeacherReviewPacketStatus = 'draft' | 'ready' | 'acknowledged_mock' | 'approved_for_future_use' | 'suppressed' | 'void';
export type ResultRecoveryStudentSupportDraftStatus = 'draft' | 'review_ready' | 'approved_for_future_use' | 'suppressed' | 'blocked' | 'void';
export type ResultRecoveryParentSupportNoteDraftStatus = 'draft' | 'review_ready' | 'approved_for_future_use' | 'suppressed' | 'blocked' | 'void';
export type ResultRecoveryCheckpointStatus = 'draft' | 'scheduled_mock' | 'completed_mock' | 'cancelled' | 'void';
export type ResultRecoverySummaryStatus = 'active' | 'stale' | 'blocked' | 'void';
export type ResultRecoverySummaryScope = 'school' | 'student' | 'teacher' | 'plan_status' | 'priority' | 'objective_type';

export const ALLOWED_RECOVERY_CREATION_ROLES: string[] = ['teacher', 'lead_teacher', 'department_head', 'admin', 'system_job'];
export const BLOCKED_RECOVERY_CREATION_ROLES: string[] = ['student', 'parent', 'guest', 'unknown'];

export const FORBIDDEN_RECOVERY_FIELDS: string[] = [
  'answerKeySafeRef', 'answerKeyText', 'correctAnswerSummary', 'rubricInternal', 'rubricText',
  'rawRubric', 'markingNotesTeacherOnly', 'teacherOnlyNotes', 'hiddenReasoning', 'chainOfThought',
  'rawStudentAnswer', 'unreleasedScore', 'unreleasedGrade', 'scoreBeforeFinalization',
  'finalGradeBeforeRelease', 'diagnosis', 'medicalAssessment', 'psychologicalAssessment',
  'legalAssessment', 'riskLabelUnsafe', 'safeguardingDetailsUnsafe',
  'parentNotificationPayload', 'studentNotificationPayload', 'teacherNotificationPayload',
  'emailPayload', 'smsPayload', 'pushPayload', 'whatsAppPayload',
  'liveTaskPayload', 'liveAssignmentPayload', 'homeworkAssignmentPayload',
  'practiceAssignmentPayload', 'revisionTaskPayload',
  'calendarEventPayload', 'externalSyncPayload',
  'liveProviderPayload', 'apiKey', 'providerSecret',
  'aiNarrative', 'generatedNarrative', 'modelOutput',
  'generatedQuestionText', 'generatedAnswerKey',
  'ocrText',
  'pdfBinary', 'pdfBuffer', 'pdfBase64', 'htmlExport', 'htmlFile',
];

export interface ResultRecoveryCommandContext {
  schoolId: string;
  actorId: string;
  actorRole: string;
  correlationId: string;
  idempotencyKey?: string;
  requestId?: string;
}

export interface ResultRecoveryPolicyDecision {
  allowed: boolean;
  policyFamily: string;
  decision: string;
  reasonCode?: string;
  safeMessage?: string;
  blockedReasonCodes?: string[];
}

export interface ResultRecoverySafeEnvelope {
  ok: boolean;
  requestId?: string;
  correlationId?: string;
  resourceId?: string;
  resourceVersion?: string;
  status?: string;
  safeMessage?: string;
  reasonCode?: string;
  policyDecision?: ResultRecoveryPolicyDecision;
  nextAllowedActions?: string[];
  data?: unknown;
}
