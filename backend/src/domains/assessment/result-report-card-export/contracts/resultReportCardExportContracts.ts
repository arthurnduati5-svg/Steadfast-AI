export type ResultReportCardExportJobStatus = 'draft' | 'validated' | 'queued_mock' | 'mock_exported' | 'receipt_recorded' | 'archive_manifest_ready' | 'blocked' | 'cancelled' | 'void';

export type ResultReportCardExportTargetStatus = 'draft' | 'validated' | 'suppressed' | 'blocked' | 'void';

export type ResultReportCardExportEnvelopeStatus = 'draft' | 'composed' | 'sealed' | 'suppressed' | 'blocked' | 'void';

export type ResultReportCardMockExportAttemptStatus = 'created' | 'started' | 'completed' | 'failed' | 'blocked' | 'void';

export type ResultReportCardExportReceiptStatus = 'created' | 'recorded' | 'blocked' | 'void';

export type ResultReportCardExportSuppressionStatus = 'active' | 'lifted' | 'void';

export type ResultReportCardExportRetryPlanStatus = 'draft' | 'planned' | 'cancelled' | 'exhausted' | 'void';

export type ResultReportCardArchiveManifestStatus = 'draft' | 'generated' | 'sealed' | 'blocked' | 'void';

export type ResultReportCardExportTargetType = 'pdf_export_future' | 'parent_portal_future' | 'student_portal_future' | 'teacher_dashboard_future' | 'admin_archive_future' | 'external_school_system_future' | 'print_package_future';

export type ResultReportCardExportMode = 'mock_export_only' | 'dry_run_only' | 'preflight_only' | 'archive_manifest_only';

export type ResultReportCardExportEnvelopeMode = 'mock_payload_only' | 'preview_payload_only' | 'archive_metadata_only';

export type ResultReportCardExportAttemptMode = 'dry_run_only' | 'mock_success' | 'mock_failure' | 'preflight_only';

export type ResultReportCardExportReceiptType = 'dry_run_preview' | 'mock_export_receipt' | 'suppression_receipt' | 'blocked_receipt';

export type ResultReportCardExportSuppressionScope = 'job' | 'target' | 'envelope' | 'attempt' | 'receipt';

export type ResultReportCardArchiveManifestMode = 'metadata_only' | 'future_archive_ready' | 'future_print_ready' | 'future_pdf_ready';

export const ALLOWED_EXPORT_CREATION_ROLES: string[] = ['teacher', 'lead_teacher', 'department_head', 'admin', 'system_job'];

export const BLOCKED_EXPORT_CREATION_ROLES: string[] = ['student', 'parent', 'guest', 'unknown'];

export const FORBIDDEN_EXPORT_ENVELOPE_FIELDS: string[] = [
  'answerKeySafeRef', 'answerKeyText', 'correctAnswerSummary', 'rubricInternal', 'rubricText',
  'rawRubric', 'markingNotesTeacherOnly', 'teacherOnlyNotes', 'hiddenReasoning', 'chainOfThought',
  'rawQuestionMetadata', 'selectionReasonInternal', 'markingAlgorithmInternals', 'moderationDecisionInternal',
  'teacherOverrideInternal', 'auditInternals', 'rawStudentAnswer', 'unreleasedScore', 'unreleasedGrade',
  'scoreBeforeFinalization', 'finalGradeBeforeRelease', 'parentDeliveryPayload', 'studentDeliveryPayload',
  'liveProviderPayload', 'providerSecret', 'apiKey', 'pdfBinary', 'pdfBuffer', 'pdfBase64',
  'htmlExport', 'htmlFile', 'portalPayload', 'notificationPayload', 'emailPayload', 'smsPayload',
  'pushPayload', 'whatsAppPayload', 'externalSyncPayload', 'rawMasteryDelta',
  'beforeStateJson', 'afterStateJson', 'deltaJson', 'aiNarrative', 'generatedNarrative',
  'modelOutput', 'ocrText',
];
