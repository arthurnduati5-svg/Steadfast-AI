import type { ResultReportCardPolicyDecision } from '../contracts/resultReportCardContracts';

export type ResultReportCardPolicyFamily =
  | 'RESULT_REPORT_CARD_TEMPLATE_MANAGEMENT'
  | 'RESULT_REPORT_CARD_ASSEMBLY_CREATION'
  | 'RESULT_REPORT_CARD_SECTION_COMPOSITION'
  | 'RESULT_REPORT_CARD_EVIDENCE_LINKING'
  | 'RESULT_REPORT_CARD_AUDIENCE_PROJECTION'
  | 'RESULT_REPORT_CARD_REVIEW'
  | 'RESULT_REPORT_CARD_EXPORT_INTENT'
  | 'RESULT_REPORT_CARD_RENDER_MANIFEST'
  | 'RESULT_REPORT_CARD_AUDIT'
  | 'RESULT_REPORT_CARD_NO_PDF_EXPORT'
  | 'RESULT_REPORT_CARD_NO_LIVE_DELIVERY';

export const RESULT_REPORT_CARD_POLICY_FAMILIES: Record<ResultReportCardPolicyFamily, { defaultDecision: string; failClosedMessage: string }> = {
  RESULT_REPORT_CARD_TEMPLATE_MANAGEMENT: {
    defaultDecision: 'blocked',
    failClosedMessage: 'Missing policy: RESULT_REPORT_CARD_TEMPLATE_MANAGEMENT - template management blocked',
  },
  RESULT_REPORT_CARD_ASSEMBLY_CREATION: {
    defaultDecision: 'blocked',
    failClosedMessage: 'Missing policy: RESULT_REPORT_CARD_ASSEMBLY_CREATION - assembly creation blocked',
  },
  RESULT_REPORT_CARD_SECTION_COMPOSITION: {
    defaultDecision: 'blocked',
    failClosedMessage: 'Missing policy: RESULT_REPORT_CARD_SECTION_COMPOSITION - section composition blocked',
  },
  RESULT_REPORT_CARD_EVIDENCE_LINKING: {
    defaultDecision: 'blocked',
    failClosedMessage: 'Missing policy: RESULT_REPORT_CARD_EVIDENCE_LINKING - evidence linking blocked',
  },
  RESULT_REPORT_CARD_AUDIENCE_PROJECTION: {
    defaultDecision: 'blocked',
    failClosedMessage: 'Missing policy: RESULT_REPORT_CARD_AUDIENCE_PROJECTION - audience projection blocked',
  },
  RESULT_REPORT_CARD_REVIEW: {
    defaultDecision: 'blocked',
    failClosedMessage: 'Missing policy: RESULT_REPORT_CARD_REVIEW - review blocked',
  },
  RESULT_REPORT_CARD_EXPORT_INTENT: {
    defaultDecision: 'blocked',
    failClosedMessage: 'Missing policy: RESULT_REPORT_CARD_EXPORT_INTENT - export intent blocked',
  },
  RESULT_REPORT_CARD_RENDER_MANIFEST: {
    defaultDecision: 'blocked',
    failClosedMessage: 'Missing policy: RESULT_REPORT_CARD_RENDER_MANIFEST - render manifest blocked',
  },
  RESULT_REPORT_CARD_AUDIT: {
    defaultDecision: 'blocked',
    failClosedMessage: 'Missing policy: RESULT_REPORT_CARD_AUDIT - audit recording blocked',
  },
  RESULT_REPORT_CARD_NO_PDF_EXPORT: {
    defaultDecision: 'block',
    failClosedMessage: 'Missing policy: RESULT_REPORT_CARD_NO_PDF_EXPORT - all PDF export operations blocked',
  },
  RESULT_REPORT_CARD_NO_LIVE_DELIVERY: {
    defaultDecision: 'block',
    failClosedMessage: 'Missing policy: RESULT_REPORT_CARD_NO_LIVE_DELIVERY - all live delivery operations blocked',
  },
};

export function evaluateReportCardTemplateManagementPolicy(context: { schoolId: string; actorRole: string }): ResultReportCardPolicyDecision {
  if (!context.schoolId) {
    return { allowed: false, reasonCode: 'SCHOOL_CONTEXT_REQUIRED', safeMessage: 'School context is required for template management', policyFamily: 'RESULT_REPORT_CARD_TEMPLATE_MANAGEMENT', status: 'blocked' };
  }
  const allowedRoles = ['teacher', 'lead_teacher', 'department_head', 'admin', 'system_job'];
  if (!allowedRoles.includes(context.actorRole)) {
    return { allowed: false, reasonCode: 'FORBIDDEN', safeMessage: 'Actor role not allowed to manage report card templates', policyFamily: 'RESULT_REPORT_CARD_TEMPLATE_MANAGEMENT', status: 'blocked' };
  }
  return { allowed: true, reasonCode: 'POLICY_ALLOWED', safeMessage: 'Report card template management policy allows', policyFamily: 'RESULT_REPORT_CARD_TEMPLATE_MANAGEMENT', status: 'allowed' };
}

export function evaluateReportCardAssemblyCreationPolicy(context: { schoolId: string; actorRole: string }): ResultReportCardPolicyDecision {
  if (!context.schoolId) {
    return { allowed: false, reasonCode: 'SCHOOL_CONTEXT_REQUIRED', safeMessage: 'School context is required for assembly creation', policyFamily: 'RESULT_REPORT_CARD_ASSEMBLY_CREATION', status: 'blocked' };
  }
  const allowedRoles = ['teacher', 'lead_teacher', 'department_head', 'admin', 'system_job'];
  if (!allowedRoles.includes(context.actorRole)) {
    return { allowed: false, reasonCode: 'FORBIDDEN', safeMessage: 'Actor role not allowed to create report card assemblies', policyFamily: 'RESULT_REPORT_CARD_ASSEMBLY_CREATION', status: 'blocked' };
  }
  return { allowed: true, reasonCode: 'POLICY_ALLOWED', safeMessage: 'Report card assembly creation policy allows', policyFamily: 'RESULT_REPORT_CARD_ASSEMBLY_CREATION', status: 'allowed' };
}

export function evaluateReportCardSectionCompositionPolicy(context: { schoolId: string; actorRole: string }): ResultReportCardPolicyDecision {
  if (!context.schoolId) {
    return { allowed: false, reasonCode: 'SCHOOL_CONTEXT_REQUIRED', safeMessage: 'School context is required for section composition', policyFamily: 'RESULT_REPORT_CARD_SECTION_COMPOSITION', status: 'blocked' };
  }
  const allowedRoles = ['teacher', 'lead_teacher', 'department_head', 'admin', 'system_job'];
  if (!allowedRoles.includes(context.actorRole)) {
    return { allowed: false, reasonCode: 'FORBIDDEN', safeMessage: 'Actor role not allowed to compose report card sections', policyFamily: 'RESULT_REPORT_CARD_SECTION_COMPOSITION', status: 'blocked' };
  }
  return { allowed: true, reasonCode: 'POLICY_ALLOWED', safeMessage: 'Report card section composition policy allows', policyFamily: 'RESULT_REPORT_CARD_SECTION_COMPOSITION', status: 'allowed' };
}

export function evaluateReportCardEvidenceLinkingPolicy(context: { schoolId: string; actorRole: string }): ResultReportCardPolicyDecision {
  if (!context.schoolId) {
    return { allowed: false, reasonCode: 'SCHOOL_CONTEXT_REQUIRED', safeMessage: 'School context is required for evidence linking', policyFamily: 'RESULT_REPORT_CARD_EVIDENCE_LINKING', status: 'blocked' };
  }
  const allowedRoles = ['teacher', 'lead_teacher', 'department_head', 'admin', 'system_job'];
  if (!allowedRoles.includes(context.actorRole)) {
    return { allowed: false, reasonCode: 'FORBIDDEN', safeMessage: 'Actor role not allowed to link evidence', policyFamily: 'RESULT_REPORT_CARD_EVIDENCE_LINKING', status: 'blocked' };
  }
  return { allowed: true, reasonCode: 'POLICY_ALLOWED', safeMessage: 'Report card evidence linking policy allows', policyFamily: 'RESULT_REPORT_CARD_EVIDENCE_LINKING', status: 'allowed' };
}

export function evaluateReportCardAudienceProjectionPolicy(context: { schoolId: string; actorRole: string }): ResultReportCardPolicyDecision {
  if (!context.schoolId) {
    return { allowed: false, reasonCode: 'SCHOOL_CONTEXT_REQUIRED', safeMessage: 'School context is required for audience projection', policyFamily: 'RESULT_REPORT_CARD_AUDIENCE_PROJECTION', status: 'blocked' };
  }
  const allowedRoles = ['teacher', 'lead_teacher', 'department_head', 'admin', 'system_job'];
  if (!allowedRoles.includes(context.actorRole)) {
    return { allowed: false, reasonCode: 'FORBIDDEN', safeMessage: 'Actor role not allowed to project audiences', policyFamily: 'RESULT_REPORT_CARD_AUDIENCE_PROJECTION', status: 'blocked' };
  }
  return { allowed: true, reasonCode: 'POLICY_ALLOWED', safeMessage: 'Report card audience projection policy allows', policyFamily: 'RESULT_REPORT_CARD_AUDIENCE_PROJECTION', status: 'allowed' };
}

export function evaluateReportCardReviewPolicy(context: { schoolId: string; actorRole: string }): ResultReportCardPolicyDecision {
  if (!context.schoolId) {
    return { allowed: false, reasonCode: 'SCHOOL_CONTEXT_REQUIRED', safeMessage: 'School context is required for review', policyFamily: 'RESULT_REPORT_CARD_REVIEW', status: 'blocked' };
  }
  const allowedRoles = ['teacher', 'lead_teacher', 'department_head', 'admin', 'system_job'];
  if (!allowedRoles.includes(context.actorRole)) {
    return { allowed: false, reasonCode: 'FORBIDDEN', safeMessage: 'Actor role not allowed to review report cards', policyFamily: 'RESULT_REPORT_CARD_REVIEW', status: 'blocked' };
  }
  return { allowed: true, reasonCode: 'POLICY_ALLOWED', safeMessage: 'Report card review policy allows', policyFamily: 'RESULT_REPORT_CARD_REVIEW', status: 'allowed' };
}

export function evaluateReportCardExportIntentPolicy(context: { schoolId: string; actorRole: string }): ResultReportCardPolicyDecision {
  if (!context.schoolId) {
    return { allowed: false, reasonCode: 'SCHOOL_CONTEXT_REQUIRED', safeMessage: 'School context is required for export intent', policyFamily: 'RESULT_REPORT_CARD_EXPORT_INTENT', status: 'blocked' };
  }
  const allowedRoles = ['teacher', 'lead_teacher', 'department_head', 'admin', 'system_job'];
  if (!allowedRoles.includes(context.actorRole)) {
    return { allowed: false, reasonCode: 'FORBIDDEN', safeMessage: 'Actor role not allowed to create export intents', policyFamily: 'RESULT_REPORT_CARD_EXPORT_INTENT', status: 'blocked' };
  }
  return { allowed: true, reasonCode: 'POLICY_ALLOWED', safeMessage: 'Report card export intent policy allows', policyFamily: 'RESULT_REPORT_CARD_EXPORT_INTENT', status: 'allowed' };
}

export function evaluateReportCardRenderManifestPolicy(context: { schoolId: string; actorRole: string }): ResultReportCardPolicyDecision {
  if (!context.schoolId) {
    return { allowed: false, reasonCode: 'SCHOOL_CONTEXT_REQUIRED', safeMessage: 'School context is required for render manifest', policyFamily: 'RESULT_REPORT_CARD_RENDER_MANIFEST', status: 'blocked' };
  }
  const allowedRoles = ['teacher', 'lead_teacher', 'department_head', 'admin', 'system_job'];
  if (!allowedRoles.includes(context.actorRole)) {
    return { allowed: false, reasonCode: 'FORBIDDEN', safeMessage: 'Actor role not allowed to create render manifests', policyFamily: 'RESULT_REPORT_CARD_RENDER_MANIFEST', status: 'blocked' };
  }
  return { allowed: true, reasonCode: 'POLICY_ALLOWED', safeMessage: 'Report card render manifest policy allows', policyFamily: 'RESULT_REPORT_CARD_RENDER_MANIFEST', status: 'allowed' };
}

export function evaluateReportCardAuditPolicy(context: { schoolId: string }): ResultReportCardPolicyDecision {
  if (!context.schoolId) {
    return { allowed: false, reasonCode: 'SCHOOL_CONTEXT_REQUIRED', safeMessage: 'School context is required for audit', policyFamily: 'RESULT_REPORT_CARD_AUDIT', status: 'blocked' };
  }
  return { allowed: true, reasonCode: 'POLICY_ALLOWED', safeMessage: 'Report card audit policy allows', policyFamily: 'RESULT_REPORT_CARD_AUDIT', status: 'allowed' };
}

export function evaluateReportCardNoPdfExportPolicy(context: { schoolId: string; exportChannel: string }): ResultReportCardPolicyDecision {
  if (!context.schoolId) {
    return { allowed: false, reasonCode: 'SCHOOL_CONTEXT_REQUIRED', safeMessage: 'School context is required for PDF export block', policyFamily: 'RESULT_REPORT_CARD_NO_PDF_EXPORT', status: 'blocked' };
  }
  if (context.exportChannel.startsWith('pdf_')) {
    return { allowed: false, reasonCode: 'PDF_EXPORT_BLOCKED', safeMessage: 'PDF export is blocked for all channels, including future/intent', policyFamily: 'RESULT_REPORT_CARD_NO_PDF_EXPORT', status: 'blocked' };
  }
  if (!context.exportChannel.endsWith('_future') && !context.exportChannel.endsWith('_intent')) {
    return { allowed: false, reasonCode: 'NON_FUTURE_CHANNEL_BLOCKED', safeMessage: 'Only future/intent export channels are allowed; export blocked for non-future channels', policyFamily: 'RESULT_REPORT_CARD_NO_PDF_EXPORT', status: 'blocked' };
  }
  return { allowed: true, reasonCode: 'POLICY_ALLOWED', safeMessage: 'Report card export policy allows future/intent channels', policyFamily: 'RESULT_REPORT_CARD_NO_PDF_EXPORT', status: 'allowed' };
}

export function evaluateReportCardNoLiveDeliveryPolicy(context: { schoolId: string; exportChannel: string }): ResultReportCardPolicyDecision {
  if (!context.schoolId) {
    return { allowed: false, reasonCode: 'SCHOOL_CONTEXT_REQUIRED', safeMessage: 'School context is required for live delivery block', policyFamily: 'RESULT_REPORT_CARD_NO_LIVE_DELIVERY', status: 'blocked' };
  }
  if (!context.exportChannel.endsWith('_future') && !context.exportChannel.endsWith('_intent')) {
    return { allowed: false, reasonCode: 'NON_FUTURE_CHANNEL_BLOCKED', safeMessage: 'Only future/intent export channels are allowed; live delivery blocked for non-future channels', policyFamily: 'RESULT_REPORT_CARD_NO_LIVE_DELIVERY', status: 'blocked' };
  }
  return { allowed: true, reasonCode: 'POLICY_ALLOWED', safeMessage: 'Report card live delivery policy allows future/intent channels', policyFamily: 'RESULT_REPORT_CARD_NO_LIVE_DELIVERY', status: 'allowed' };
}
