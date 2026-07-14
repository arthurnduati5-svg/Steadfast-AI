import { ResultReportCardPolicyDecision } from '../../result-report-card/contracts/resultReportCardContracts';

export type ResultReportCardExportPolicyFamily =
  | 'RESULT_REPORT_CARD_EXPORT_JOB_CREATION'
  | 'RESULT_REPORT_CARD_EXPORT_TARGET_RESOLUTION'
  | 'RESULT_REPORT_CARD_EXPORT_ENVELOPE_COMPOSITION'
  | 'RESULT_REPORT_CARD_MOCK_EXPORT_ATTEMPT'
  | 'RESULT_REPORT_CARD_EXPORT_RECEIPT'
  | 'RESULT_REPORT_CARD_EXPORT_SUPPRESSION'
  | 'RESULT_REPORT_CARD_EXPORT_RETRY_PLAN'
  | 'RESULT_REPORT_CARD_ARCHIVE_MANIFEST'
  | 'RESULT_REPORT_CARD_EXPORT_AUDIT'
  | 'RESULT_REPORT_CARD_EXPORT_NO_PDF_BINARY'
  | 'RESULT_REPORT_CARD_EXPORT_NO_LIVE_PUBLICATION';

export function evaluateReportCardExportJobCreationPolicy(context: { schoolId: string; actorRole: string }): ResultReportCardPolicyDecision {
  const allowedRoles = ['teacher', 'lead_teacher', 'department_head', 'admin', 'system_job'];
  if (allowedRoles.includes(context.actorRole)) return { allowed: true, policyFamily: 'RESULT_REPORT_CARD_EXPORT_JOB_CREATION', reasonCode: 'POLICY_ALLOWED', safeMessage: 'Export job creation policy allows', status: 'CONFIGURED' };
  return { allowed: false, policyFamily: 'RESULT_REPORT_CARD_EXPORT_JOB_CREATION', reasonCode: 'FORBIDDEN', safeMessage: 'Actor role not allowed to create export jobs', status: 'BLOCKED' };
}

export function evaluateReportCardExportTargetResolutionPolicy(context: { schoolId: string; actorRole: string }): ResultReportCardPolicyDecision {
  const allowedRoles = ['teacher', 'lead_teacher', 'department_head', 'admin', 'system_job'];
  if (allowedRoles.includes(context.actorRole)) return { allowed: true, policyFamily: 'RESULT_REPORT_CARD_EXPORT_TARGET_RESOLUTION', reasonCode: 'POLICY_ALLOWED', safeMessage: 'Export target resolution policy allows', status: 'CONFIGURED' };
  return { allowed: false, policyFamily: 'RESULT_REPORT_CARD_EXPORT_TARGET_RESOLUTION', reasonCode: 'FORBIDDEN', safeMessage: 'Actor role not allowed to resolve export targets', status: 'BLOCKED' };
}

export function evaluateReportCardExportEnvelopeCompositionPolicy(context: { schoolId: string; actorRole: string }): ResultReportCardPolicyDecision {
  const allowedRoles = ['teacher', 'lead_teacher', 'department_head', 'admin', 'system_job'];
  if (allowedRoles.includes(context.actorRole)) return { allowed: true, policyFamily: 'RESULT_REPORT_CARD_EXPORT_ENVELOPE_COMPOSITION', reasonCode: 'POLICY_ALLOWED', safeMessage: 'Export envelope composition policy allows', status: 'CONFIGURED' };
  return { allowed: false, policyFamily: 'RESULT_REPORT_CARD_EXPORT_ENVELOPE_COMPOSITION', reasonCode: 'FORBIDDEN', safeMessage: 'Actor role not allowed to compose export envelopes', status: 'BLOCKED' };
}

export function evaluateReportCardMockExportAttemptPolicy(context: { schoolId: string; actorRole: string }): ResultReportCardPolicyDecision {
  const allowedRoles = ['teacher', 'lead_teacher', 'department_head', 'admin', 'system_job'];
  if (allowedRoles.includes(context.actorRole)) return { allowed: true, policyFamily: 'RESULT_REPORT_CARD_MOCK_EXPORT_ATTEMPT', reasonCode: 'POLICY_ALLOWED', safeMessage: 'Mock export attempt policy allows', status: 'CONFIGURED' };
  return { allowed: false, policyFamily: 'RESULT_REPORT_CARD_MOCK_EXPORT_ATTEMPT', reasonCode: 'FORBIDDEN', safeMessage: 'Actor role not allowed to attempt mock exports', status: 'BLOCKED' };
}

export function evaluateReportCardExportReceiptPolicy(context: { schoolId: string; actorRole: string }): ResultReportCardPolicyDecision {
  const allowedRoles = ['teacher', 'lead_teacher', 'department_head', 'admin', 'system_job'];
  if (allowedRoles.includes(context.actorRole)) return { allowed: true, policyFamily: 'RESULT_REPORT_CARD_EXPORT_RECEIPT', reasonCode: 'POLICY_ALLOWED', safeMessage: 'Export receipt policy allows', status: 'CONFIGURED' };
  return { allowed: false, policyFamily: 'RESULT_REPORT_CARD_EXPORT_RECEIPT', reasonCode: 'FORBIDDEN', safeMessage: 'Actor role not allowed to access export receipts', status: 'BLOCKED' };
}

export function evaluateReportCardExportSuppressionPolicy(context: { schoolId: string; actorRole: string }): ResultReportCardPolicyDecision {
  const allowedRoles = ['teacher', 'lead_teacher', 'department_head', 'admin', 'system_job'];
  if (allowedRoles.includes(context.actorRole)) return { allowed: true, policyFamily: 'RESULT_REPORT_CARD_EXPORT_SUPPRESSION', reasonCode: 'POLICY_ALLOWED', safeMessage: 'Export suppression policy allows', status: 'CONFIGURED' };
  return { allowed: false, policyFamily: 'RESULT_REPORT_CARD_EXPORT_SUPPRESSION', reasonCode: 'FORBIDDEN', safeMessage: 'Actor role not allowed to manage export suppressions', status: 'BLOCKED' };
}

export function evaluateReportCardExportRetryPlanPolicy(context: { schoolId: string; actorRole: string }): ResultReportCardPolicyDecision {
  const allowedRoles = ['teacher', 'lead_teacher', 'department_head', 'admin', 'system_job'];
  if (allowedRoles.includes(context.actorRole)) return { allowed: true, policyFamily: 'RESULT_REPORT_CARD_EXPORT_RETRY_PLAN', reasonCode: 'POLICY_ALLOWED', safeMessage: 'Export retry plan policy allows', status: 'CONFIGURED' };
  return { allowed: false, policyFamily: 'RESULT_REPORT_CARD_EXPORT_RETRY_PLAN', reasonCode: 'FORBIDDEN', safeMessage: 'Actor role not allowed to manage export retry plans', status: 'BLOCKED' };
}

export function evaluateReportCardArchiveManifestPolicy(context: { schoolId: string; actorRole: string }): ResultReportCardPolicyDecision {
  const allowedRoles = ['teacher', 'lead_teacher', 'department_head', 'admin', 'system_job'];
  if (allowedRoles.includes(context.actorRole)) return { allowed: true, policyFamily: 'RESULT_REPORT_CARD_ARCHIVE_MANIFEST', reasonCode: 'POLICY_ALLOWED', safeMessage: 'Archive manifest policy allows', status: 'CONFIGURED' };
  return { allowed: false, policyFamily: 'RESULT_REPORT_CARD_ARCHIVE_MANIFEST', reasonCode: 'FORBIDDEN', safeMessage: 'Actor role not allowed to manage archive manifests', status: 'BLOCKED' };
}

export function evaluateReportCardExportAuditPolicy(context: { schoolId: string; actorRole: string }): ResultReportCardPolicyDecision {
  const allowedRoles = ['teacher', 'lead_teacher', 'department_head', 'admin', 'system_job'];
  if (allowedRoles.includes(context.actorRole)) return { allowed: true, policyFamily: 'RESULT_REPORT_CARD_EXPORT_AUDIT', reasonCode: 'POLICY_ALLOWED', safeMessage: 'Export audit policy allows', status: 'CONFIGURED' };
  return { allowed: false, policyFamily: 'RESULT_REPORT_CARD_EXPORT_AUDIT', reasonCode: 'FORBIDDEN', safeMessage: 'Actor role not allowed to access export audit', status: 'BLOCKED' };
}

export function evaluateReportCardExportNoPdfBinaryPolicy(context: { schoolId: string; actorRole: string }): ResultReportCardPolicyDecision {
  return { allowed: false, policyFamily: 'RESULT_REPORT_CARD_EXPORT_NO_PDF_BINARY', reasonCode: 'PDF_BINARY_BLOCKED', safeMessage: 'PDF binary generation is blocked in Package 14. Only future-intent and metadata-only modes are allowed.', status: 'BLOCKED' };
}

export function evaluateReportCardExportNoLivePublicationPolicy(context: { schoolId: string; actorRole: string }): ResultReportCardPolicyDecision {
  return { allowed: false, policyFamily: 'RESULT_REPORT_CARD_EXPORT_NO_LIVE_PUBLICATION', reasonCode: 'LIVE_EXPORT_BLOCKED', safeMessage: 'Live export/publication is blocked in Package 14. Only mock-export, dry-run, and metadata-only modes are allowed.', status: 'BLOCKED' };
}
