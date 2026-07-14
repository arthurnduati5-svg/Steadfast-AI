export type ResultDeliveryCommandContext = {
  schoolId: string;
  actorId: string;
  actorRole: string;
  correlationId: string;
  idempotencyKey: string;
};

export type ResultDeliveryPolicyDecision = {
  allowed: boolean;
  reasonCode: string;
  safeMessage: string;
  policyFamily: string;
  status: string;
};

export interface ResultDeliverySafeEnvelope {
  ok: boolean;
  requestId: string;
  correlationId?: string;
  resourceId?: string;
  resourceVersion?: string;
  status?: string;
  safeMessage?: string;
  reasonCode?: string;
  policyDecision?: ResultDeliveryPolicyDecision;
  nextAllowedActions?: string[];
  data?: unknown;
}

export type ResultDeliveryJobStatus = 'draft' | 'validated' | 'queued_mock' | 'dispatching_mock' | 'completed_mock' | 'blocked' | 'cancelled' | 'void';
export type ResultDeliveryJobMode = 'dry_run_only' | 'mock_provider_only' | 'preflight_only';

export type ResultDeliveryRecipientStatus = 'draft' | 'resolved' | 'verified' | 'blocked' | 'void';
export type ResultDeliveryRecipientScope = 'student_self' | 'parent_guardian' | 'teacher_owner' | 'school_admin' | 'school_leadership';

export type ResultDeliveryChannelEnvelopeStatus = 'draft' | 'sealed' | 'blocked' | 'void';

export type ResultDeliverySuppressionStatus = 'active' | 'cleared' | 'void';
export type ResultDeliverySuppressionType = 'privacy_boundary' | 'missing_recipient' | 'blocked_audience' | 'unapproved_release' | 'unsafe_payload' | 'live_channel_disabled' | 'policy_blocked' | 'school_context_missing' | 'idempotency_conflict';

export type ResultDeliveryAttemptStatus = 'created' | 'blocked_live_channel' | 'mock_dispatched' | 'mock_failed' | 'completed_mock' | 'cancelled' | 'void';
export type ResultDeliveryAttemptMode = 'dry_run_only' | 'mock_provider_only';

export type ResultDeliveryReceiptStatus = 'created' | 'recorded' | 'void';
export type ResultDeliveryReceiptType = 'mock_success' | 'mock_failure' | 'blocked_before_dispatch' | 'dry_run_preview';

export type ResultDeliveryRetryPlanStatus = 'draft' | 'planned' | 'blocked' | 'cancelled' | 'void';

export type ResultDeliveryMockProviderStatus = 'active' | 'disabled' | 'void';
export type ResultDeliveryMockSimulationMode = 'always_success' | 'always_fail' | 'policy_driven' | 'manual_test_only';

export type ResultDeliveryChannel = 'student_portal_mock' | 'parent_portal_mock' | 'teacher_dashboard_mock' | 'email_mock' | 'sms_mock' | 'push_mock' | 'whatsapp_mock' | 'pdf_export_mock' | 'external_school_system_mock';
export type ResultDeliveryAudienceType = 'student' | 'parent' | 'teacher' | 'admin' | 'school_leadership';

export type ResultDeliveryMockMode = 'dry_run_only' | 'mock_provider_only' | 'preflight_only';

export const ALLOWED_DELIVERY_JOB_ROLES: string[] = ['teacher', 'lead_teacher', 'department_head', 'admin', 'system_job'];
export const BLOCKED_DELIVERY_JOB_ROLES: string[] = ['student', 'parent', 'guest', 'unknown'];

export const LIVE_CHANNELS: string[] = ['student_portal_live', 'parent_portal_live', 'email_live', 'sms_live', 'push_live', 'whatsapp_live', 'pdf_export_live', 'external_school_system_live'];

export const FORBIDDEN_ENVELOPE_FIELDS: string[] = [
  'answerKeySafeRef', 'answerKeyText', 'correctAnswerSummary', 'rubricInternal', 'rubricText',
  'rawRubric', 'markingNotesTeacherOnly', 'teacherOnlyNotes', 'hiddenReasoning', 'chainOfThought',
  'rawQuestionMetadata', 'selectionReasonInternal', 'markingAlgorithmInternals', 'moderationDecisionInternal',
  'teacherOverrideInternal', 'auditInternals', 'rawStudentAnswer', 'unreleasedScore', 'unreleasedGrade',
  'scoreBeforeFinalization', 'finalGradeBeforeRelease', 'parentDeliveryPayload', 'studentDeliveryPayload',
  'liveProviderPayload', 'providerSecret', 'apiKey', 'pdfBinary', 'portalPayload', 'notificationPayload',
  'rawMasteryDelta', 'beforeStateJson', 'afterStateJson', 'deltaJson',
];
