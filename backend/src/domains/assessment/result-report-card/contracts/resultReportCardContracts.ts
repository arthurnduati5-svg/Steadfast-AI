export type ResultReportCardCommandContext = {
  schoolId: string;
  actorId: string;
  actorRole: string;
  correlationId: string;
  idempotencyKey: string;
};

export type ResultReportCardPolicyDecision = {
  allowed: boolean;
  reasonCode: string;
  safeMessage: string;
  policyFamily: string;
  status: string;
};

export interface ResultReportCardSafeEnvelope {
  ok: boolean;
  requestId: string;
  correlationId?: string;
  resourceId?: string;
  resourceVersion?: string;
  status?: string;
  safeMessage?: string;
  reasonCode?: string;
  policyDecision?: ResultReportCardPolicyDecision;
  nextAllowedActions?: string[];
  data?: unknown;
}

export type ResultReportCardTemplateStatus = 'draft' | 'active' | 'disabled' | 'void';
export type ResultReportCardTemplateVersionStatus = 'draft' | 'active' | 'retired' | 'void';
export type ResultReportCardAssemblyStatus = 'draft' | 'assembled' | 'safety_checked' | 'sealed' | 'ready_for_review' | 'reviewed' | 'approved_for_export_intent' | 'blocked' | 'cancelled' | 'void';
export type ResultReportCardSectionStatus = 'draft' | 'composed' | 'sealed' | 'blocked' | 'void';
export type ResultReportCardEvidenceStatus = 'active' | 'blocked' | 'void';
export type ResultReportCardAudienceProjectionStatus = 'draft' | 'generated' | 'sealed' | 'blocked' | 'void';
export type ResultReportCardReviewStatus = 'draft' | 'in_review' | 'approved' | 'rejected' | 'blocked' | 'void';
export type ResultReportCardExportIntentStatus = 'draft' | 'eligible_for_future_export' | 'blocked' | 'void';
export type ResultReportCardRenderManifestStatus = 'draft' | 'generated' | 'sealed' | 'blocked' | 'void';

export type ResultReportCardAudienceType = 'student' | 'parent' | 'teacher' | 'admin' | 'school_leadership' | 'multi_audience';

export type ResultReportCardLayoutMode = 'exam_result_summary' | 'term_progress_summary' | 'objective_mastery_summary' | 'parent_support_summary' | 'student_growth_summary' | 'teacher_review_summary' | 'admin_audit_summary';

export type ResultReportCardAssemblyMode = 'student_safe_report_card' | 'parent_safe_report_card' | 'teacher_review_report_card' | 'admin_audit_report_card' | 'multi_audience_report_card' | 'preflight_only';

export type ResultReportCardSectionType = 'result_overview' | 'strengths' | 'growth_areas' | 'objective_mastery' | 'practice_next_steps' | 'parent_support_guidance' | 'student_reflection_prompt' | 'teacher_review_note' | 'admin_audit_summary' | 'delivery_readiness_summary';

export type ResultReportCardReviewType = 'teacher_report_review' | 'department_report_review' | 'admin_report_review' | 'system_preflight_review';

export type ResultReportCardReviewDecision = 'pending' | 'approve_for_export_intent' | 'request_revision' | 'reject' | 'block';

export type ResultReportCardExportChannel = 'pdf_export_future' | 'student_portal_future' | 'parent_portal_future' | 'teacher_dashboard_future' | 'admin_archive_future' | 'external_school_system_future' | 'print_package_future';

export type ResultReportCardExportMode = 'intent_only' | 'preflight_only' | 'mock_export_only';

export type ResultReportCardRenderMode = 'preview_only' | 'future_pdf_ready' | 'future_portal_ready' | 'future_print_ready';

export type ResultReportCardSourcePackage = 'package_5_marking' | 'package_9_result_governance' | 'package_10_learning_evidence' | 'package_11_result_release' | 'package_12_result_delivery';

export const ALLOWED_REPORT_CARD_CREATION_ROLES: string[] = ['teacher', 'lead_teacher', 'department_head', 'admin', 'system_job'];
export const BLOCKED_REPORT_CARD_CREATION_ROLES: string[] = ['student', 'parent', 'guest', 'unknown'];

export const ALLOWED_REVIEW_DECISION_ROLES: string[] = ['teacher', 'lead_teacher', 'department_head', 'admin', 'system_job'];
export const BLOCKED_REVIEW_DECISION_ROLES: string[] = ['student', 'parent', 'guest', 'unknown'];

export const FORBIDDEN_REPORT_CARD_FIELDS: string[] = [
  'answerKeySafeRef', 'answerKeyText', 'correctAnswerSummary', 'rubricInternal', 'rubricText',
  'rawRubric', 'markingNotesTeacherOnly', 'teacherOnlyNotes', 'hiddenReasoning', 'chainOfThought',
  'rawQuestionMetadata', 'selectionReasonInternal', 'markingAlgorithmInternals', 'moderationDecisionInternal',
  'teacherOverrideInternal', 'auditInternals', 'rawStudentAnswer', 'unreleasedScore', 'unreleasedGrade',
  'scoreBeforeFinalization', 'finalGradeBeforeRelease', 'parentDeliveryPayload', 'studentDeliveryPayload',
  'liveProviderPayload', 'providerSecret', 'apiKey', 'pdfBinary', 'pdfBuffer', 'pdfBase64',
  'portalPayload', 'notificationPayload', 'externalSyncPayload', 'rawMasteryDelta',
  'beforeStateJson', 'afterStateJson', 'deltaJson', 'aiNarrative', 'generatedNarrative',
  'modelOutput', 'ocrText',
];

export const LIVE_EXPORT_CHANNELS: string[] = [
  'pdf_export_live', 'student_portal_live', 'parent_portal_live',
  'email_live', 'sms_live', 'push_live', 'whatsapp_live', 'external_school_system_live',
];

export const FUTURE_EXPORT_CHANNELS: ResultReportCardExportChannel[] = [
  'pdf_export_future', 'student_portal_future', 'parent_portal_future',
  'teacher_dashboard_future', 'admin_archive_future', 'external_school_system_future', 'print_package_future',
];
