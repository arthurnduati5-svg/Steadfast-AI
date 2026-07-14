import type { ResultDeliveryPolicyDecision } from '../contracts/resultDeliveryContracts';

export type ResultDeliveryPolicyFamily =
  | 'RESULT_DELIVERY_JOB_CREATION'
  | 'RESULT_DELIVERY_RECIPIENT_RESOLUTION'
  | 'RESULT_DELIVERY_ENVELOPE_SEALING'
  | 'RESULT_DELIVERY_SUPPRESSION'
  | 'RESULT_DELIVERY_MOCK_DISPATCH'
  | 'RESULT_DELIVERY_RECEIPT_RECORDING'
  | 'RESULT_DELIVERY_RETRY_PLANNING'
  | 'RESULT_DELIVERY_AUDIT'
  | 'RESULT_DELIVERY_LIVE_SEND_BLOCK';

export const RESULT_DELIVERY_POLICY_FAMILIES: Record<ResultDeliveryPolicyFamily, { defaultDecision: string; failClosedMessage: string }> = {
  RESULT_DELIVERY_JOB_CREATION: {
    defaultDecision: 'blocked',
    failClosedMessage: 'Missing policy: RESULT_DELIVERY_JOB_CREATION - delivery job creation blocked',
  },
  RESULT_DELIVERY_RECIPIENT_RESOLUTION: {
    defaultDecision: 'blocked',
    failClosedMessage: 'Missing policy: RESULT_DELIVERY_RECIPIENT_RESOLUTION - recipient resolution blocked',
  },
  RESULT_DELIVERY_ENVELOPE_SEALING: {
    defaultDecision: 'blocked',
    failClosedMessage: 'Missing policy: RESULT_DELIVERY_ENVELOPE_SEALING - envelope sealing blocked',
  },
  RESULT_DELIVERY_SUPPRESSION: {
    defaultDecision: 'suppress',
    failClosedMessage: 'Missing policy: RESULT_DELIVERY_SUPPRESSION - delivery job suppressed',
  },
  RESULT_DELIVERY_MOCK_DISPATCH: {
    defaultDecision: 'blocked',
    failClosedMessage: 'Missing policy: RESULT_DELIVERY_MOCK_DISPATCH - mock dispatch blocked',
  },
  RESULT_DELIVERY_RECEIPT_RECORDING: {
    defaultDecision: 'blocked',
    failClosedMessage: 'Missing policy: RESULT_DELIVERY_RECEIPT_RECORDING - receipt recording blocked',
  },
  RESULT_DELIVERY_RETRY_PLANNING: {
    defaultDecision: 'blocked',
    failClosedMessage: 'Missing policy: RESULT_DELIVERY_RETRY_PLANNING - retry planning blocked',
  },
  RESULT_DELIVERY_AUDIT: {
    defaultDecision: 'blocked',
    failClosedMessage: 'Missing policy: RESULT_DELIVERY_AUDIT - mutating operations blocked if audit cannot be recorded',
  },
  RESULT_DELIVERY_LIVE_SEND_BLOCK: {
    defaultDecision: 'block',
    failClosedMessage: 'Missing policy: RESULT_DELIVERY_LIVE_SEND_BLOCK - all delivery operations blocked',
  },
};

export function evaluateDeliveryJobCreationPolicy(context: { schoolId: string; actorRole: string }): ResultDeliveryPolicyDecision {
  if (!context.schoolId) {
    return { allowed: false, reasonCode: 'SCHOOL_CONTEXT_REQUIRED', safeMessage: 'School context is required', policyFamily: 'RESULT_DELIVERY_JOB_CREATION', status: 'blocked' };
  }
  const allowedRoles = ['teacher', 'lead_teacher', 'department_head', 'admin', 'system_job'];
  if (!allowedRoles.includes(context.actorRole)) {
    return { allowed: false, reasonCode: 'FORBIDDEN', safeMessage: 'Actor role not allowed to create delivery jobs', policyFamily: 'RESULT_DELIVERY_JOB_CREATION', status: 'blocked' };
  }
  return { allowed: true, reasonCode: 'POLICY_ALLOWED', safeMessage: 'Delivery job creation policy allows', policyFamily: 'RESULT_DELIVERY_JOB_CREATION', status: 'allowed' };
}

export function evaluateRecipientResolutionPolicy(context: { schoolId: string; actorRole: string }): ResultDeliveryPolicyDecision {
  if (!context.schoolId) {
    return { allowed: false, reasonCode: 'SCHOOL_CONTEXT_REQUIRED', safeMessage: 'School context required for recipient resolution', policyFamily: 'RESULT_DELIVERY_RECIPIENT_RESOLUTION', status: 'blocked' };
  }
  const allowedRoles = ['teacher', 'lead_teacher', 'department_head', 'admin', 'system_job'];
  if (!allowedRoles.includes(context.actorRole)) {
    return { allowed: false, reasonCode: 'FORBIDDEN', safeMessage: 'Actor role cannot resolve recipients', policyFamily: 'RESULT_DELIVERY_RECIPIENT_RESOLUTION', status: 'blocked' };
  }
  return { allowed: true, reasonCode: 'POLICY_ALLOWED', safeMessage: 'Recipient resolution policy allows', policyFamily: 'RESULT_DELIVERY_RECIPIENT_RESOLUTION', status: 'allowed' };
}

export function evaluateEnvelopeSealingPolicy(context: { schoolId: string; actorRole: string }): ResultDeliveryPolicyDecision {
  if (!context.schoolId) {
    return { allowed: false, reasonCode: 'SCHOOL_CONTEXT_REQUIRED', safeMessage: 'School context required for envelope sealing', policyFamily: 'RESULT_DELIVERY_ENVELOPE_SEALING', status: 'blocked' };
  }
  const allowedRoles = ['teacher', 'lead_teacher', 'department_head', 'admin', 'system_job'];
  if (!allowedRoles.includes(context.actorRole)) {
    return { allowed: false, reasonCode: 'FORBIDDEN', safeMessage: 'Actor role cannot seal envelopes', policyFamily: 'RESULT_DELIVERY_ENVELOPE_SEALING', status: 'blocked' };
  }
  return { allowed: true, reasonCode: 'POLICY_ALLOWED', safeMessage: 'Envelope sealing policy allows', policyFamily: 'RESULT_DELIVERY_ENVELOPE_SEALING', status: 'allowed' };
}

export function evaluateSuppressionPolicy(context: { schoolId: string }): ResultDeliveryPolicyDecision {
  if (!context.schoolId) {
    return { allowed: false, reasonCode: 'SCHOOL_CONTEXT_REQUIRED', safeMessage: 'School context required for suppression', policyFamily: 'RESULT_DELIVERY_SUPPRESSION', status: 'blocked' };
  }
  return { allowed: true, reasonCode: 'POLICY_ALLOWED', safeMessage: 'Suppression policy allows', policyFamily: 'RESULT_DELIVERY_SUPPRESSION', status: 'allowed' };
}

export function evaluateMockDispatchPolicy(context: { schoolId: string; deliveryChannel: string }): ResultDeliveryPolicyDecision {
  if (!context.schoolId) {
    return { allowed: false, reasonCode: 'SCHOOL_CONTEXT_REQUIRED', safeMessage: 'School context required for mock dispatch', policyFamily: 'RESULT_DELIVERY_MOCK_DISPATCH', status: 'blocked' };
  }
  if (!context.deliveryChannel.endsWith('_mock')) {
    return { allowed: false, reasonCode: 'LIVE_DELIVERY_BLOCKED', safeMessage: 'Live delivery is blocked in Package 12', policyFamily: 'RESULT_DELIVERY_MOCK_DISPATCH', status: 'blocked' };
  }
  return { allowed: true, reasonCode: 'POLICY_ALLOWED', safeMessage: 'Mock dispatch policy allows', policyFamily: 'RESULT_DELIVERY_MOCK_DISPATCH', status: 'allowed' };
}

export function evaluateReceiptRecordingPolicy(context: { schoolId: string }): ResultDeliveryPolicyDecision {
  if (!context.schoolId) {
    return { allowed: false, reasonCode: 'SCHOOL_CONTEXT_REQUIRED', safeMessage: 'School context required for receipt recording', policyFamily: 'RESULT_DELIVERY_RECEIPT_RECORDING', status: 'blocked' };
  }
  return { allowed: true, reasonCode: 'POLICY_ALLOWED', safeMessage: 'Receipt recording policy allows', policyFamily: 'RESULT_DELIVERY_RECEIPT_RECORDING', status: 'allowed' };
}

export function evaluateRetryPlanningPolicy(context: { schoolId: string }): ResultDeliveryPolicyDecision {
  if (!context.schoolId) {
    return { allowed: false, reasonCode: 'SCHOOL_CONTEXT_REQUIRED', safeMessage: 'School context required for retry planning', policyFamily: 'RESULT_DELIVERY_RETRY_PLANNING', status: 'blocked' };
  }
  return { allowed: true, reasonCode: 'POLICY_ALLOWED', safeMessage: 'Retry planning policy allows', policyFamily: 'RESULT_DELIVERY_RETRY_PLANNING', status: 'allowed' };
}

export function evaluateDeliveryAuditPolicy(context: { schoolId: string }): ResultDeliveryPolicyDecision {
  if (!context.schoolId) {
    return { allowed: false, reasonCode: 'SCHOOL_CONTEXT_REQUIRED', safeMessage: 'School context required for audit', policyFamily: 'RESULT_DELIVERY_AUDIT', status: 'blocked' };
  }
  return { allowed: true, reasonCode: 'POLICY_ALLOWED', safeMessage: 'Delivery audit policy allows', policyFamily: 'RESULT_DELIVERY_AUDIT', status: 'allowed' };
}

export function evaluateLiveSendBlockPolicy(context: { schoolId: string; deliveryChannel: string }): ResultDeliveryPolicyDecision {
  if (!context.schoolId) {
    return { allowed: false, reasonCode: 'SCHOOL_CONTEXT_REQUIRED', safeMessage: 'School context required for live-send block', policyFamily: 'RESULT_DELIVERY_LIVE_SEND_BLOCK', status: 'blocked' };
  }
  if (!context.deliveryChannel.endsWith('_mock')) {
    return { allowed: false, reasonCode: 'LIVE_DELIVERY_BLOCKED', safeMessage: 'Live delivery channels are blocked in Package 12', policyFamily: 'RESULT_DELIVERY_LIVE_SEND_BLOCK', status: 'blocked' };
  }
  return { allowed: true, reasonCode: 'POLICY_ALLOWED', safeMessage: 'Live-send block policy allows mock channels', policyFamily: 'RESULT_DELIVERY_LIVE_SEND_BLOCK', status: 'allowed' };
}
