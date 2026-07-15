import type { ResultReportCardAccessPolicyDecision } from '../contracts/resultReportCardAccessContracts';

export type ResultReportCardAccessPolicyFamily =
  | 'RESULT_REPORT_CARD_ACCESS_GRANT_CREATION'
  | 'RESULT_REPORT_CARD_ACCESS_RECIPIENT_RESOLUTION'
  | 'RESULT_REPORT_CARD_PORTAL_PREVIEW_COMPOSITION'
  | 'RESULT_REPORT_CARD_ACCESS_TOKEN_INTENT'
  | 'RESULT_REPORT_CARD_ACCESS_ACKNOWLEDGEMENT'
  | 'RESULT_REPORT_CARD_ACCESS_REVOCATION'
  | 'RESULT_REPORT_CARD_ACCESS_EXPIRY'
  | 'RESULT_REPORT_CARD_ACCESS_TIMELINE'
  | 'RESULT_REPORT_CARD_ACCESS_SUMMARY'
  | 'RESULT_REPORT_CARD_ACCESS_AUDIT'
  | 'RESULT_REPORT_CARD_ACCESS_NO_LIVE_PORTAL'
  | 'RESULT_REPORT_CARD_ACCESS_NO_REAL_TOKEN'
  | 'RESULT_REPORT_CARD_ACCESS_NO_NOTIFICATION';

export const RESULT_REPORT_CARD_ACCESS_POLICY_DEFINITIONS: Record<ResultReportCardAccessPolicyFamily, { defaultDecision: string; failClosedMessage: string }> = {
  RESULT_REPORT_CARD_ACCESS_GRANT_CREATION: {
    defaultDecision: 'deny',
    failClosedMessage: 'Missing policy: RESULT_REPORT_CARD_ACCESS_GRANT_CREATION - access grant creation blocked',
  },
  RESULT_REPORT_CARD_ACCESS_RECIPIENT_RESOLUTION: {
    defaultDecision: 'deny',
    failClosedMessage: 'Missing policy: RESULT_REPORT_CARD_ACCESS_RECIPIENT_RESOLUTION - recipient resolution blocked',
  },
  RESULT_REPORT_CARD_PORTAL_PREVIEW_COMPOSITION: {
    defaultDecision: 'deny',
    failClosedMessage: 'Missing policy: RESULT_REPORT_CARD_PORTAL_PREVIEW_COMPOSITION - portal preview composition blocked',
  },
  RESULT_REPORT_CARD_ACCESS_TOKEN_INTENT: {
    defaultDecision: 'deny',
    failClosedMessage: 'Missing policy: RESULT_REPORT_CARD_ACCESS_TOKEN_INTENT - token intent blocked',
  },
  RESULT_REPORT_CARD_ACCESS_ACKNOWLEDGEMENT: {
    defaultDecision: 'deny',
    failClosedMessage: 'Missing policy: RESULT_REPORT_CARD_ACCESS_ACKNOWLEDGEMENT - acknowledgement blocked',
  },
  RESULT_REPORT_CARD_ACCESS_REVOCATION: {
    defaultDecision: 'deny',
    failClosedMessage: 'Missing policy: RESULT_REPORT_CARD_ACCESS_REVOCATION - revocation blocked',
  },
  RESULT_REPORT_CARD_ACCESS_EXPIRY: {
    defaultDecision: 'deny',
    failClosedMessage: 'Missing policy: RESULT_REPORT_CARD_ACCESS_EXPIRY - expiry blocked',
  },
  RESULT_REPORT_CARD_ACCESS_TIMELINE: {
    defaultDecision: 'deny',
    failClosedMessage: 'Missing policy: RESULT_REPORT_CARD_ACCESS_TIMELINE - timeline blocked',
  },
  RESULT_REPORT_CARD_ACCESS_SUMMARY: {
    defaultDecision: 'deny',
    failClosedMessage: 'Missing policy: RESULT_REPORT_CARD_ACCESS_SUMMARY - summary blocked',
  },
  RESULT_REPORT_CARD_ACCESS_AUDIT: {
    defaultDecision: 'deny',
    failClosedMessage: 'Missing policy: RESULT_REPORT_CARD_ACCESS_AUDIT - audit recording blocked',
  },
  RESULT_REPORT_CARD_ACCESS_NO_LIVE_PORTAL: {
    defaultDecision: 'deny',
    failClosedMessage: 'Missing policy: RESULT_REPORT_CARD_ACCESS_NO_LIVE_PORTAL - all live portal operations blocked',
  },
  RESULT_REPORT_CARD_ACCESS_NO_REAL_TOKEN: {
    defaultDecision: 'deny',
    failClosedMessage: 'Missing policy: RESULT_REPORT_CARD_ACCESS_NO_REAL_TOKEN - all real token operations blocked',
  },
  RESULT_REPORT_CARD_ACCESS_NO_NOTIFICATION: {
    defaultDecision: 'deny',
    failClosedMessage: 'Missing policy: RESULT_REPORT_CARD_ACCESS_NO_NOTIFICATION - all notification operations blocked',
  },
};

const ALLOWED_ACCESS_CREATION_ROLES = ['teacher', 'lead_teacher', 'department_head', 'admin', 'system_job'];

export function evaluateReportCardAccessGrantCreationPolicy(context: { schoolId: string; actorRole: string }): ResultReportCardAccessPolicyDecision {
  const allowedRoles = ALLOWED_ACCESS_CREATION_ROLES;
  if (allowedRoles.includes(context.actorRole)) return { allowed: true, policyFamily: 'RESULT_REPORT_CARD_ACCESS_GRANT_CREATION', decision: 'ALLOW', reasonCode: 'POLICY_ALLOWED', safeMessage: 'Access grant creation policy allows' };
  return { allowed: false, policyFamily: 'RESULT_REPORT_CARD_ACCESS_GRANT_CREATION', decision: 'BLOCK', reasonCode: 'FORBIDDEN', safeMessage: 'Actor role not allowed to create access grants' };
}

export function evaluateReportCardAccessRecipientResolutionPolicy(context: { schoolId: string; actorRole: string }): ResultReportCardAccessPolicyDecision {
  const allowedRoles = ALLOWED_ACCESS_CREATION_ROLES;
  if (allowedRoles.includes(context.actorRole)) return { allowed: true, policyFamily: 'RESULT_REPORT_CARD_ACCESS_RECIPIENT_RESOLUTION', decision: 'ALLOW', reasonCode: 'POLICY_ALLOWED', safeMessage: 'Access recipient resolution policy allows' };
  return { allowed: false, policyFamily: 'RESULT_REPORT_CARD_ACCESS_RECIPIENT_RESOLUTION', decision: 'BLOCK', reasonCode: 'FORBIDDEN', safeMessage: 'Actor role not allowed to resolve access recipients' };
}

export function evaluateReportCardPortalPreviewCompositionPolicy(context: { schoolId: string; actorRole: string }): ResultReportCardAccessPolicyDecision {
  const allowedRoles = ALLOWED_ACCESS_CREATION_ROLES;
  if (allowedRoles.includes(context.actorRole)) return { allowed: true, policyFamily: 'RESULT_REPORT_CARD_PORTAL_PREVIEW_COMPOSITION', decision: 'ALLOW', reasonCode: 'POLICY_ALLOWED', safeMessage: 'Portal preview composition policy allows' };
  return { allowed: false, policyFamily: 'RESULT_REPORT_CARD_PORTAL_PREVIEW_COMPOSITION', decision: 'BLOCK', reasonCode: 'FORBIDDEN', safeMessage: 'Actor role not allowed to compose portal previews' };
}

export function evaluateReportCardAccessTokenIntentPolicy(context: { schoolId: string; actorRole: string }): ResultReportCardAccessPolicyDecision {
  const allowedRoles = ALLOWED_ACCESS_CREATION_ROLES;
  if (allowedRoles.includes(context.actorRole)) return { allowed: true, policyFamily: 'RESULT_REPORT_CARD_ACCESS_TOKEN_INTENT', decision: 'ALLOW', reasonCode: 'POLICY_ALLOWED', safeMessage: 'Access token intent policy allows' };
  return { allowed: false, policyFamily: 'RESULT_REPORT_CARD_ACCESS_TOKEN_INTENT', decision: 'BLOCK', reasonCode: 'FORBIDDEN', safeMessage: 'Actor role not allowed to manage access token intents' };
}

export function evaluateReportCardAccessAcknowledgementPolicy(context: { schoolId: string; actorRole: string }): ResultReportCardAccessPolicyDecision {
  const allowedRoles = ALLOWED_ACCESS_CREATION_ROLES;
  if (allowedRoles.includes(context.actorRole)) return { allowed: true, policyFamily: 'RESULT_REPORT_CARD_ACCESS_ACKNOWLEDGEMENT', decision: 'ALLOW', reasonCode: 'POLICY_ALLOWED', safeMessage: 'Access acknowledgement policy allows' };
  return { allowed: false, policyFamily: 'RESULT_REPORT_CARD_ACCESS_ACKNOWLEDGEMENT', decision: 'BLOCK', reasonCode: 'FORBIDDEN', safeMessage: 'Actor role not allowed to create access acknowledgements' };
}

export function evaluateReportCardAccessRevocationPolicy(context: { schoolId: string; actorRole: string }): ResultReportCardAccessPolicyDecision {
  const allowedRoles = ALLOWED_ACCESS_CREATION_ROLES;
  if (allowedRoles.includes(context.actorRole)) return { allowed: true, policyFamily: 'RESULT_REPORT_CARD_ACCESS_REVOCATION', decision: 'ALLOW', reasonCode: 'POLICY_ALLOWED', safeMessage: 'Access revocation policy allows' };
  return { allowed: false, policyFamily: 'RESULT_REPORT_CARD_ACCESS_REVOCATION', decision: 'BLOCK', reasonCode: 'FORBIDDEN', safeMessage: 'Actor role not allowed to revoke access grants' };
}

export function evaluateReportCardAccessExpiryPolicy(context: { schoolId: string; actorRole: string }): ResultReportCardAccessPolicyDecision {
  const allowedRoles = ALLOWED_ACCESS_CREATION_ROLES;
  if (allowedRoles.includes(context.actorRole)) return { allowed: true, policyFamily: 'RESULT_REPORT_CARD_ACCESS_EXPIRY', decision: 'ALLOW', reasonCode: 'POLICY_ALLOWED', safeMessage: 'Access expiry policy allows' };
  return { allowed: false, policyFamily: 'RESULT_REPORT_CARD_ACCESS_EXPIRY', decision: 'BLOCK', reasonCode: 'FORBIDDEN', safeMessage: 'Actor role not allowed to manage access expiry' };
}

export function evaluateReportCardAccessTimelinePolicy(context: { schoolId: string; actorRole: string }): ResultReportCardAccessPolicyDecision {
  const allowedRoles = ALLOWED_ACCESS_CREATION_ROLES;
  if (allowedRoles.includes(context.actorRole)) return { allowed: true, policyFamily: 'RESULT_REPORT_CARD_ACCESS_TIMELINE', decision: 'ALLOW', reasonCode: 'POLICY_ALLOWED', safeMessage: 'Access timeline policy allows' };
  return { allowed: false, policyFamily: 'RESULT_REPORT_CARD_ACCESS_TIMELINE', decision: 'BLOCK', reasonCode: 'FORBIDDEN', safeMessage: 'Actor role not allowed to record access timeline entries' };
}

export function evaluateReportCardAccessSummaryPolicy(context: { schoolId: string; actorRole: string }): ResultReportCardAccessPolicyDecision {
  const allowedRoles = ALLOWED_ACCESS_CREATION_ROLES;
  if (allowedRoles.includes(context.actorRole)) return { allowed: true, policyFamily: 'RESULT_REPORT_CARD_ACCESS_SUMMARY', decision: 'ALLOW', reasonCode: 'POLICY_ALLOWED', safeMessage: 'Access summary policy allows' };
  return { allowed: false, policyFamily: 'RESULT_REPORT_CARD_ACCESS_SUMMARY', decision: 'BLOCK', reasonCode: 'FORBIDDEN', safeMessage: 'Actor role not allowed to view access summaries' };
}

export function evaluateReportCardAccessAuditPolicy(context: { schoolId: string; actorRole: string }): ResultReportCardAccessPolicyDecision {
  const allowedRoles = ALLOWED_ACCESS_CREATION_ROLES;
  if (allowedRoles.includes(context.actorRole)) return { allowed: true, policyFamily: 'RESULT_REPORT_CARD_ACCESS_AUDIT', decision: 'ALLOW', reasonCode: 'POLICY_ALLOWED', safeMessage: 'Access audit policy allows' };
  return { allowed: false, policyFamily: 'RESULT_REPORT_CARD_ACCESS_AUDIT', decision: 'BLOCK', reasonCode: 'FORBIDDEN', safeMessage: 'Actor role not allowed to access access audit records' };
}

export function evaluateReportCardAccessNoLivePortalPolicy(context: { schoolId: string; actorRole: string }): ResultReportCardAccessPolicyDecision {
  return { allowed: false, policyFamily: 'RESULT_REPORT_CARD_ACCESS_NO_LIVE_PORTAL', decision: 'BLOCK', reasonCode: 'LIVE_PORTAL_BLOCKED', safeMessage: 'Live portal access is blocked in Package 15. Only mock-portal-preview, future-intent, and metadata-only modes are allowed.' };
}

export function evaluateReportCardAccessNoRealTokenPolicy(context: { schoolId: string; actorRole: string }): ResultReportCardAccessPolicyDecision {
  return { allowed: false, policyFamily: 'RESULT_REPORT_CARD_ACCESS_NO_REAL_TOKEN', decision: 'BLOCK', reasonCode: 'REAL_TOKEN_BLOCKED', safeMessage: 'Real access token generation is blocked in Package 15. Only no_token_created, future_token_required, and admin_review_required modes are allowed.' };
}

export function evaluateReportCardAccessNoNotificationPolicy(context: { schoolId: string; actorRole: string }): ResultReportCardAccessPolicyDecision {
  return { allowed: false, policyFamily: 'RESULT_REPORT_CARD_ACCESS_NO_NOTIFICATION', decision: 'BLOCK', reasonCode: 'NOTIFICATION_BLOCKED', safeMessage: 'Live notifications are blocked in Package 15. Only dry_run_acknowledgement and mock_preview_ready modes are allowed.' };
}

export function getAccessPolicyDefinitions(): Record<ResultReportCardAccessPolicyFamily, { defaultDecision: string; failClosedMessage: string }> {
  return { ...RESULT_REPORT_CARD_ACCESS_POLICY_DEFINITIONS };
}

export function enforceAccessPolicy(
  family: ResultReportCardAccessPolicyFamily,
  context: { schoolId: string; actorRole: string }
): ResultReportCardAccessPolicyDecision {
  const fallback: ResultReportCardAccessPolicyDecision = {
    allowed: false,
    policyFamily: family,
    decision: 'DENY',
    reasonCode: 'UNKNOWN_POLICY_FAMILY',
    safeMessage: `No evaluator registered for policy family: ${family}`,
  };

  switch (family) {
    case 'RESULT_REPORT_CARD_ACCESS_GRANT_CREATION':
      return evaluateReportCardAccessGrantCreationPolicy(context);
    case 'RESULT_REPORT_CARD_ACCESS_RECIPIENT_RESOLUTION':
      return evaluateReportCardAccessRecipientResolutionPolicy(context);
    case 'RESULT_REPORT_CARD_PORTAL_PREVIEW_COMPOSITION':
      return evaluateReportCardPortalPreviewCompositionPolicy(context);
    case 'RESULT_REPORT_CARD_ACCESS_TOKEN_INTENT':
      return evaluateReportCardAccessTokenIntentPolicy(context);
    case 'RESULT_REPORT_CARD_ACCESS_ACKNOWLEDGEMENT':
      return evaluateReportCardAccessAcknowledgementPolicy(context);
    case 'RESULT_REPORT_CARD_ACCESS_REVOCATION':
      return evaluateReportCardAccessRevocationPolicy(context);
    case 'RESULT_REPORT_CARD_ACCESS_EXPIRY':
      return evaluateReportCardAccessExpiryPolicy(context);
    case 'RESULT_REPORT_CARD_ACCESS_TIMELINE':
      return evaluateReportCardAccessTimelinePolicy(context);
    case 'RESULT_REPORT_CARD_ACCESS_SUMMARY':
      return evaluateReportCardAccessSummaryPolicy(context);
    case 'RESULT_REPORT_CARD_ACCESS_AUDIT':
      return evaluateReportCardAccessAuditPolicy(context);
    case 'RESULT_REPORT_CARD_ACCESS_NO_LIVE_PORTAL':
      return evaluateReportCardAccessNoLivePortalPolicy(context);
    case 'RESULT_REPORT_CARD_ACCESS_NO_REAL_TOKEN':
      return evaluateReportCardAccessNoRealTokenPolicy(context);
    case 'RESULT_REPORT_CARD_ACCESS_NO_NOTIFICATION':
      return evaluateReportCardAccessNoNotificationPolicy(context);
    default:
      return fallback;
  }
}
