export type ResultFollowUpCaseStatus = 'draft' | 'opened' | 'triaged' | 'planned' | 'under_review' | 'closed' | 'blocked' | 'void';
export type ResultFollowUpCaseType = 'academic_support' | 'attendance_related' | 'parent_follow_up' | 'teacher_review' | 'student_reflection' | 'safeguarding_review_referral' | 'general_growth_support';
export type ResultFollowUpCasePriority = 'low' | 'medium' | 'high' | 'urgent_review_required';
export type ResultFollowUpCaseMode = 'mock_action_only' | 'future_action_only' | 'teacher_review_only' | 'metadata_only';

export type ResultFollowUpSignalStatus = 'active' | 'suppressed' | 'void';
export type ResultFollowUpSignalType = 'weak_objective_pattern' | 'missed_practice_pattern' | 'result_drop_pattern' | 'low_confidence_pattern' | 'teacher_review_requested' | 'parent_guidance_needed' | 'student_reflection_needed' | 'access_not_acknowledged' | 'report_card_review_follow_up' | 'manual_teacher_flag';
export type ResultFollowUpSignalSeverity = 'low' | 'medium' | 'high' | 'critical';

export type ResultFollowUpActionPlanStatus = 'draft' | 'teacher_review_ready' | 'approved_for_future_use' | 'suppressed' | 'blocked' | 'void';
export type TeacherFollowUpQueueStatus = 'draft' | 'queued_for_review' | 'acknowledged_mock' | 'completed_mock' | 'suppressed' | 'blocked' | 'void';
export type ParentGuidanceDraftStatus = 'draft' | 'review_ready' | 'approved_for_future_use' | 'suppressed' | 'blocked' | 'void';
export type StudentReflectionTaskDraftStatus = 'draft' | 'review_ready' | 'approved_for_future_use' | 'suppressed' | 'blocked' | 'void';
export type FollowUpReviewWindowStatus = 'draft' | 'scheduled_mock' | 'completed_mock' | 'cancelled' | 'void';
export type FollowUpEscalationPlanStatus = 'draft' | 'review_ready' | 'approved_for_future_use' | 'suppressed' | 'blocked' | 'void';
export type FollowUpSummaryStatus = 'active' | 'stale' | 'blocked' | 'void';
export type FollowUpSummaryScope = 'school' | 'student' | 'teacher' | 'case_type' | 'priority';

export const ALLOWED_FOLLOW_UP_CREATION_ROLES: string[] = ['teacher', 'lead_teacher', 'department_head', 'admin', 'system_job'];
export const BLOCKED_FOLLOW_UP_CREATION_ROLES: string[] = ['student', 'parent', 'guest', 'unknown'];

export const FORBIDDEN_FOLLOW_UP_FIELDS: string[] = [
  'answerKeySafeRef', 'answerKeyText', 'correctAnswerSummary', 'rubricInternal', 'rubricText',
  'rawRubric', 'markingNotesTeacherOnly', 'teacherOnlyNotes', 'hiddenReasoning', 'chainOfThought',
  'rawStudentAnswer', 'unreleasedScore', 'unreleasedGrade', 'scoreBeforeFinalization',
  'finalGradeBeforeRelease', 'diagnosis', 'medicalAssessment', 'psychologicalAssessment',
  'legalAssessment', 'riskLabelUnsafe', 'safeguardingDetailsUnsafe',
  'parentNotificationPayload', 'studentNotificationPayload', 'teacherNotificationPayload',
  'emailPayload', 'smsPayload', 'pushPayload', 'whatsAppPayload',
  'liveTaskPayload', 'calendarEventPayload', 'externalSyncPayload',
  'liveProviderPayload', 'apiKey', 'providerSecret',
  'aiNarrative', 'generatedNarrative', 'modelOutput', 'ocrText',
  'pdfBinary', 'pdfBuffer', 'pdfBase64', 'htmlExport', 'htmlFile',
];

export interface ResultFollowUpCommandContext {
  schoolId: string;
  actorId: string;
  actorRole: string;
  correlationId: string;
  idempotencyKey?: string;
  requestId?: string;
}

export interface ResultFollowUpPolicyDecision {
  allowed: boolean;
  policyFamily: string;
  decision: string;
  reasonCode?: string;
  safeMessage?: string;
  blockedReasonCodes?: string[];
}

export interface ResultFollowUpSafeEnvelope {
  ok: boolean;
  requestId?: string;
  correlationId?: string;
  resourceId?: string;
  resourceVersion?: string;
  status?: string;
  safeMessage?: string;
  reasonCode?: string;
  policyDecision?: ResultFollowUpPolicyDecision;
  nextAllowedActions?: string[];
  data?: unknown;
}
