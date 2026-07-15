export type ResultReportCardAccessGrantStatus = 'draft' | 'validated' | 'ready_for_future_access' | 'suppressed' | 'revoked' | 'expired' | 'blocked' | 'void';

export type ResultReportCardAccessRecipientStatus = 'draft' | 'validated' | 'suppressed' | 'revoked' | 'blocked' | 'void';

export type ResultReportCardPortalPreviewStatus = 'draft' | 'composed' | 'sealed' | 'suppressed' | 'blocked' | 'void';

export type ResultReportCardAccessTokenIntentStatus = 'draft' | 'validated' | 'blocked' | 'void';

export type ResultReportCardAccessAcknowledgementStatus = 'created' | 'recorded' | 'blocked' | 'void';

export type ResultReportCardAccessRevocationStatus = 'draft' | 'applied' | 'void';

export type ResultReportCardAccessExpiryStatus = 'draft' | 'scheduled' | 'applied' | 'cancelled' | 'void';

export type ResultReportCardAccessTimelineStatus = 'recorded' | 'suppressed' | 'void';

export type ResultReportCardAccessSummaryStatus = 'active' | 'stale' | 'blocked' | 'void';

export type ResultReportCardAccessGrantMode = 'mock_portal_preview_only' | 'future_access_only' | 'metadata_only' | 'admin_review_only' | 'print_counter_preview_only';

export type ResultReportCardPortalPreviewMode = 'mock_portal_preview_only' | 'teacher_review_preview' | 'admin_preview' | 'metadata_only';

export type ResultReportCardAccessTokenIntentMode = 'no_token_created' | 'future_token_required' | 'admin_review_required';

export type ResultReportCardAccessAcknowledgementType = 'dry_run_acknowledgement' | 'mock_preview_ready' | 'access_readiness_receipt' | 'suppression_receipt' | 'blocked_receipt';

export type ResultReportCardAccessRevocationScope = 'grant' | 'recipient' | 'preview' | 'token_intent' | 'acknowledgement';

export type ResultReportCardAccessExpiryScope = 'grant' | 'recipient' | 'preview' | 'token_intent';

export const ALLOWED_ACCESS_CREATION_ROLES: string[] = ['teacher', 'lead_teacher', 'department_head', 'admin', 'system_job'];

export const BLOCKED_ACCESS_CREATION_ROLES: string[] = ['student', 'parent', 'guest', 'unknown'];

export const FORBIDDEN_ACCESS_PREVIEW_FIELDS: string[] = [
  'answerKeySafeRef', 'answerKeyText', 'correctAnswerSummary', 'rubricInternal', 'rubricText',
  'rawRubric', 'markingNotesTeacherOnly', 'teacherOnlyNotes', 'hiddenReasoning', 'chainOfThought',
  'rawStudentAnswer', 'unreleasedScore', 'unreleasedGrade', 'livePortalUrl', 'portalUrl',
  'signedUrl', 'accessToken', 'refreshToken', 'loginToken', 'jwt', 'sessionCookie', 'password',
  'apiKey', 'providerSecret', 'rawEmail', 'emailAddress', 'rawPhone', 'phoneNumber',
  'notificationPayload', 'emailPayload', 'smsPayload', 'pushPayload', 'whatsAppPayload',
  'pdfBinary', 'pdfBuffer', 'pdfBase64', 'htmlExport', 'htmlFile', 'portalPayload',
  'externalSyncPayload', 'aiNarrative', 'generatedNarrative', 'modelOutput', 'ocrText',
];

export interface ResultReportCardAccessCommandContext {
  schoolId: string;
  actorId: string;
  actorRole: string;
  correlationId: string;
  idempotencyKey?: string;
  requestId?: string;
}

export interface ResultReportCardAccessPolicyDecision {
  allowed: boolean;
  policyFamily: string;
  decision: string;
  reasonCode?: string;
  safeMessage?: string;
  blockedReasonCodes?: string[];
}

export interface ResultReportCardAccessSafeEnvelope {
  ok: boolean;
  requestId?: string;
  correlationId?: string;
  resourceId?: string;
  resourceVersion?: string;
  status?: string;
  safeMessage?: string;
  reasonCode?: string;
  policyDecision?: ResultReportCardAccessPolicyDecision;
  nextAllowedActions?: string[];
  data?: unknown;
}
