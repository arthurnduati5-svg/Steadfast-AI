import type { ResultReleasePolicyDecision } from '../contracts/resultReleaseContracts';

export type ResultReleasePolicyFamily =
  | 'RESULT_RELEASE_PACKET_CREATION'
  | 'RESULT_RELEASE_BOUNDARY_ENFORCEMENT'
  | 'RESULT_RELEASE_APPROVAL'
  | 'RESULT_AUDIENCE_PROJECTION'
  | 'RESULT_STUDENT_REPORT_SNAPSHOT'
  | 'RESULT_PARENT_SAFE_SUMMARY'
  | 'RESULT_STUDENT_SAFE_SUMMARY'
  | 'RESULT_RELEASE_DELIVERY_INTENT'
  | 'RESULT_RELEASE_AUDIT';

export const RESULT_RELEASE_POLICY_FAMILIES: Record<ResultReleasePolicyFamily, { defaultDecision: string; failClosedMessage: string }> = {
  RESULT_RELEASE_PACKET_CREATION: {
    defaultDecision: 'blocked',
    failClosedMessage: 'Missing policy: RESULT_RELEASE_PACKET_CREATION - packet creation blocked',
  },
  RESULT_RELEASE_BOUNDARY_ENFORCEMENT: {
    defaultDecision: 'blocked',
    failClosedMessage: 'Missing policy: RESULT_RELEASE_BOUNDARY_ENFORCEMENT - audience projection blocked',
  },
  RESULT_RELEASE_APPROVAL: {
    defaultDecision: 'blocked',
    failClosedMessage: 'Missing policy: RESULT_RELEASE_APPROVAL - release approval blocked',
  },
  RESULT_AUDIENCE_PROJECTION: {
    defaultDecision: 'restricted',
    failClosedMessage: 'Missing policy: RESULT_AUDIENCE_PROJECTION - returning minimal safe projection only',
  },
  RESULT_STUDENT_REPORT_SNAPSHOT: {
    defaultDecision: 'blocked',
    failClosedMessage: 'Missing policy: RESULT_STUDENT_REPORT_SNAPSHOT - report snapshot creation blocked',
  },
  RESULT_PARENT_SAFE_SUMMARY: {
    defaultDecision: 'blocked',
    failClosedMessage: 'Missing policy: RESULT_PARENT_SAFE_SUMMARY - parent summary generation blocked',
  },
  RESULT_STUDENT_SAFE_SUMMARY: {
    defaultDecision: 'blocked',
    failClosedMessage: 'Missing policy: RESULT_STUDENT_SAFE_SUMMARY - student summary generation blocked',
  },
  RESULT_RELEASE_DELIVERY_INTENT: {
    defaultDecision: 'blocked',
    failClosedMessage: 'Missing policy: RESULT_RELEASE_DELIVERY_INTENT - delivery intent creation blocked',
  },
  RESULT_RELEASE_AUDIT: {
    defaultDecision: 'blocked',
    failClosedMessage: 'Missing policy: RESULT_RELEASE_AUDIT - mutating operations blocked if audit cannot be recorded',
  },
};

export function evaluatePacketCreationPolicy(context: { schoolId: string; actorRole: string }): ResultReleasePolicyDecision {
  if (!context.schoolId) {
    return { allowed: false, reasonCode: 'SCHOOL_CONTEXT_REQUIRED', safeMessage: 'School context is required', policyFamily: 'RESULT_RELEASE_PACKET_CREATION', status: 'blocked' };
  }
  const blockedRoles = ['student', 'parent', 'guest', 'unknown'];
  if (blockedRoles.includes(context.actorRole)) {
    return { allowed: false, reasonCode: 'FORBIDDEN', safeMessage: 'Actor role not allowed to create release packets', policyFamily: 'RESULT_RELEASE_PACKET_CREATION', status: 'blocked' };
  }
  return { allowed: true, reasonCode: 'POLICY_ALLOWED', safeMessage: 'Packet creation policy allows', policyFamily: 'RESULT_RELEASE_PACKET_CREATION', status: 'allowed' };
}

export function evaluateBoundaryEnforcementPolicy(context: { schoolId: string }): ResultReleasePolicyDecision {
  if (!context.schoolId) {
    return { allowed: false, reasonCode: 'SCHOOL_CONTEXT_REQUIRED', safeMessage: 'School context required for boundary enforcement', policyFamily: 'RESULT_RELEASE_BOUNDARY_ENFORCEMENT', status: 'blocked' };
  }
  return { allowed: true, reasonCode: 'POLICY_ALLOWED', safeMessage: 'Boundary enforcement policy allows', policyFamily: 'RESULT_RELEASE_BOUNDARY_ENFORCEMENT', status: 'allowed' };
}

export function evaluateReleaseApprovalPolicy(context: { schoolId: string; actorRole: string }): ResultReleasePolicyDecision {
  if (!context.schoolId) {
    return { allowed: false, reasonCode: 'SCHOOL_CONTEXT_REQUIRED', safeMessage: 'School context required for approval', policyFamily: 'RESULT_RELEASE_APPROVAL', status: 'blocked' };
  }
  const allowedRoles = ['teacher', 'lead_teacher', 'department_head', 'admin', 'system_job'];
  if (!allowedRoles.includes(context.actorRole)) {
    return { allowed: false, reasonCode: 'FORBIDDEN', safeMessage: 'Actor role cannot approve release packets', policyFamily: 'RESULT_RELEASE_APPROVAL', status: 'blocked' };
  }
  return { allowed: true, reasonCode: 'POLICY_ALLOWED', safeMessage: 'Release approval policy allows', policyFamily: 'RESULT_RELEASE_APPROVAL', status: 'allowed' };
}

export function evaluateAudienceProjectionPolicy(context: { schoolId: string }): ResultReleasePolicyDecision {
  if (!context.schoolId) {
    return { allowed: false, reasonCode: 'SCHOOL_CONTEXT_REQUIRED', safeMessage: 'School context required for audience projection', policyFamily: 'RESULT_AUDIENCE_PROJECTION', status: 'blocked' };
  }
  return { allowed: true, reasonCode: 'POLICY_ALLOWED', safeMessage: 'Audience projection policy allows', policyFamily: 'RESULT_AUDIENCE_PROJECTION', status: 'allowed' };
}

export function evaluateReportSnapshotPolicy(context: { schoolId: string; actorRole: string }): ResultReleasePolicyDecision {
  if (!context.schoolId) {
    return { allowed: false, reasonCode: 'SCHOOL_CONTEXT_REQUIRED', safeMessage: 'School context required for report snapshot', policyFamily: 'RESULT_STUDENT_REPORT_SNAPSHOT', status: 'blocked' };
  }
  const blockedRoles = ['student', 'parent', 'guest', 'unknown'];
  if (blockedRoles.includes(context.actorRole)) {
    return { allowed: false, reasonCode: 'FORBIDDEN', safeMessage: 'Actor role cannot create report snapshots', policyFamily: 'RESULT_STUDENT_REPORT_SNAPSHOT', status: 'blocked' };
  }
  return { allowed: true, reasonCode: 'POLICY_ALLOWED', safeMessage: 'Report snapshot policy allows', policyFamily: 'RESULT_STUDENT_REPORT_SNAPSHOT', status: 'allowed' };
}

export function evaluateParentSafeSummaryPolicy(context: { schoolId: string }): ResultReleasePolicyDecision {
  if (!context.schoolId) {
    return { allowed: false, reasonCode: 'SCHOOL_CONTEXT_REQUIRED', safeMessage: 'School context required for parent summary', policyFamily: 'RESULT_PARENT_SAFE_SUMMARY', status: 'blocked' };
  }
  return { allowed: true, reasonCode: 'POLICY_ALLOWED', safeMessage: 'Parent safe summary policy allows', policyFamily: 'RESULT_PARENT_SAFE_SUMMARY', status: 'allowed' };
}

export function evaluateStudentSafeSummaryPolicy(context: { schoolId: string }): ResultReleasePolicyDecision {
  if (!context.schoolId) {
    return { allowed: false, reasonCode: 'SCHOOL_CONTEXT_REQUIRED', safeMessage: 'School context required for student summary', policyFamily: 'RESULT_STUDENT_SAFE_SUMMARY', status: 'blocked' };
  }
  return { allowed: true, reasonCode: 'POLICY_ALLOWED', safeMessage: 'Student safe summary policy allows', policyFamily: 'RESULT_STUDENT_SAFE_SUMMARY', status: 'allowed' };
}

export function evaluateDeliveryIntentPolicy(context: { schoolId: string; actorRole: string }): ResultReleasePolicyDecision {
  if (!context.schoolId) {
    return { allowed: false, reasonCode: 'SCHOOL_CONTEXT_REQUIRED', safeMessage: 'School context required for delivery intent', policyFamily: 'RESULT_RELEASE_DELIVERY_INTENT', status: 'blocked' };
  }
  const blockedRoles = ['student', 'parent', 'guest', 'unknown'];
  if (blockedRoles.includes(context.actorRole)) {
    return { allowed: false, reasonCode: 'FORBIDDEN', safeMessage: 'Actor role cannot create delivery intents', policyFamily: 'RESULT_RELEASE_DELIVERY_INTENT', status: 'blocked' };
  }
  return { allowed: true, reasonCode: 'POLICY_ALLOWED', safeMessage: 'Delivery intent policy allows', policyFamily: 'RESULT_RELEASE_DELIVERY_INTENT', status: 'allowed' };
}

export function evaluateAuditPolicy(context: { schoolId: string }): ResultReleasePolicyDecision {
  if (!context.schoolId) {
    return { allowed: false, reasonCode: 'SCHOOL_CONTEXT_REQUIRED', safeMessage: 'School context required for audit', policyFamily: 'RESULT_RELEASE_AUDIT', status: 'blocked' };
  }
  return { allowed: true, reasonCode: 'POLICY_ALLOWED', safeMessage: 'Audit policy allows', policyFamily: 'RESULT_RELEASE_AUDIT', status: 'allowed' };
}
