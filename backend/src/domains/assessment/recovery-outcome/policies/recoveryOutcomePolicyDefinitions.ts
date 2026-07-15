export interface RecoveryOutcomePolicyDefinition {
  policyFamily: string;
  description: string;
  allowedRoles: string[];
  blockedRoles: string[];
  failClosed: boolean;
  failClosedDecision: string;
}

const ALLOWED_OUTCOME_ROLES: string[] = ['teacher', 'lead_teacher', 'department_head', 'admin', 'system_job'];
const BLOCKED_OUTCOME_ROLES: string[] = ['student', 'parent', 'guest', 'unknown'];

export const RECOVERY_OUTCOME_POLICY_FAMILIES: Record<string, RecoveryOutcomePolicyDefinition> = {
  RECOVERY_OUTCOME_DECISION_READINESS_CREATION: {
    policyFamily: 'RECOVERY_OUTCOME_DECISION_READINESS_CREATION',
    description: 'Controls creation of outcome decision readiness records',
    allowedRoles: ALLOWED_OUTCOME_ROLES,
    blockedRoles: BLOCKED_OUTCOME_ROLES,
    failClosed: true,
    failClosedDecision: 'deny',
  },
  RECOVERY_EXIT_CRITERIA_CREATION: {
    policyFamily: 'RECOVERY_EXIT_CRITERIA_CREATION',
    description: 'Controls creation of exit criteria definitions',
    allowedRoles: ALLOWED_OUTCOME_ROLES,
    blockedRoles: BLOCKED_OUTCOME_ROLES,
    failClosed: true,
    failClosedDecision: 'deny',
  },
  RECOVERY_EXIT_CRITERIA_EVALUATION: {
    policyFamily: 'RECOVERY_EXIT_CRITERIA_EVALUATION',
    description: 'Controls creation of exit criteria evaluations',
    allowedRoles: ALLOWED_OUTCOME_ROLES,
    blockedRoles: BLOCKED_OUTCOME_ROLES,
    failClosed: true,
    failClosedDecision: 'deny',
  },
  RECOVERY_CONTINUATION_DRAFT_CREATION: {
    policyFamily: 'RECOVERY_CONTINUATION_DRAFT_CREATION',
    description: 'Controls creation of continuation decision drafts',
    allowedRoles: ALLOWED_OUTCOME_ROLES,
    blockedRoles: BLOCKED_OUTCOME_ROLES,
    failClosed: true,
    failClosedDecision: 'deny',
  },
  RECOVERY_INTENSIFICATION_DRAFT_CREATION: {
    policyFamily: 'RECOVERY_INTENSIFICATION_DRAFT_CREATION',
    description: 'Controls creation of intensification decision drafts',
    allowedRoles: ALLOWED_OUTCOME_ROLES,
    blockedRoles: BLOCKED_OUTCOME_ROLES,
    failClosed: true,
    failClosedDecision: 'deny',
  },
  RECOVERY_PAUSE_DRAFT_CREATION: {
    policyFamily: 'RECOVERY_PAUSE_DRAFT_CREATION',
    description: 'Controls creation of pause decision drafts',
    allowedRoles: ALLOWED_OUTCOME_ROLES,
    blockedRoles: BLOCKED_OUTCOME_ROLES,
    failClosed: true,
    failClosedDecision: 'deny',
  },
  RECOVERY_CLOSURE_DRAFT_CREATION: {
    policyFamily: 'RECOVERY_CLOSURE_DRAFT_CREATION',
    description: 'Controls creation of closure decision drafts',
    allowedRoles: ALLOWED_OUTCOME_ROLES,
    blockedRoles: BLOCKED_OUTCOME_ROLES,
    failClosed: true,
    failClosedDecision: 'deny',
  },
  RECOVERY_OUTCOME_TEACHER_REVIEW_PACKET_CREATION: {
    policyFamily: 'RECOVERY_OUTCOME_TEACHER_REVIEW_PACKET_CREATION',
    description: 'Controls creation of outcome teacher review packets',
    allowedRoles: ALLOWED_OUTCOME_ROLES,
    blockedRoles: BLOCKED_OUTCOME_ROLES,
    failClosed: true,
    failClosedDecision: 'deny',
  },
  RECOVERY_OUTCOME_STUDENT_NEXT_STEP_DRAFT_CREATION: {
    policyFamily: 'RECOVERY_OUTCOME_STUDENT_NEXT_STEP_DRAFT_CREATION',
    description: 'Controls creation of student next-step drafts',
    allowedRoles: ALLOWED_OUTCOME_ROLES,
    blockedRoles: BLOCKED_OUTCOME_ROLES,
    failClosed: true,
    failClosedDecision: 'deny',
  },
  RECOVERY_OUTCOME_PARENT_UPDATE_DRAFT_CREATION: {
    policyFamily: 'RECOVERY_OUTCOME_PARENT_UPDATE_DRAFT_CREATION',
    description: 'Controls creation of parent update drafts',
    allowedRoles: ALLOWED_OUTCOME_ROLES,
    blockedRoles: BLOCKED_OUTCOME_ROLES,
    failClosed: true,
    failClosedDecision: 'deny',
  },
  RECOVERY_OUTCOME_SUMMARY_MUTATION: {
    policyFamily: 'RECOVERY_OUTCOME_SUMMARY_MUTATION',
    description: 'Controls mutation of outcome decision summaries',
    allowedRoles: ALLOWED_OUTCOME_ROLES,
    blockedRoles: BLOCKED_OUTCOME_ROLES,
    failClosed: true,
    failClosedDecision: 'deny',
  },
  RECOVERY_OUTCOME_AUDIT: {
    policyFamily: 'RECOVERY_OUTCOME_AUDIT',
    description: 'Controls audit event creation',
    allowedRoles: ALLOWED_OUTCOME_ROLES,
    blockedRoles: BLOCKED_OUTCOME_ROLES,
    failClosed: true,
    failClosedDecision: 'deny',
  },
  RECOVERY_OUTCOME_NO_LIVE_COMPLETION: {
    policyFamily: 'RECOVERY_OUTCOME_NO_LIVE_COMPLETION',
    description: 'Blocks live recovery completion operations',
    allowedRoles: [],
    blockedRoles: ALLOWED_OUTCOME_ROLES.concat(BLOCKED_OUTCOME_ROLES),
    failClosed: true,
    failClosedDecision: 'deny',
  },
  RECOVERY_OUTCOME_NO_LIVE_ASSIGNMENT: {
    policyFamily: 'RECOVERY_OUTCOME_NO_LIVE_ASSIGNMENT',
    description: 'Blocks live assignment creation from outcome decisions',
    allowedRoles: [],
    blockedRoles: ALLOWED_OUTCOME_ROLES.concat(BLOCKED_OUTCOME_ROLES),
    failClosed: true,
    failClosedDecision: 'deny',
  },
  RECOVERY_OUTCOME_NO_LIVE_NOTIFICATION: {
    policyFamily: 'RECOVERY_OUTCOME_NO_LIVE_NOTIFICATION',
    description: 'Blocks notification sending from outcome decisions',
    allowedRoles: [],
    blockedRoles: ALLOWED_OUTCOME_ROLES.concat(BLOCKED_OUTCOME_ROLES),
    failClosed: true,
    failClosedDecision: 'deny',
  },
  RECOVERY_OUTCOME_NO_SCORE_MUTATION: {
    policyFamily: 'RECOVERY_OUTCOME_NO_SCORE_MUTATION',
    description: 'Blocks score mutation from outcome decisions',
    allowedRoles: [],
    blockedRoles: ALLOWED_OUTCOME_ROLES.concat(BLOCKED_OUTCOME_ROLES),
    failClosed: true,
    failClosedDecision: 'deny',
  },
  RECOVERY_OUTCOME_NO_MASTERY_MUTATION: {
    policyFamily: 'RECOVERY_OUTCOME_NO_MASTERY_MUTATION',
    description: 'Blocks mastery mutation from outcome decisions',
    allowedRoles: [],
    blockedRoles: ALLOWED_OUTCOME_ROLES.concat(BLOCKED_OUTCOME_ROLES),
    failClosed: true,
    failClosedDecision: 'deny',
  },
  RECOVERY_OUTCOME_NO_REGRADE_EXECUTION: {
    policyFamily: 'RECOVERY_OUTCOME_NO_REGRADE_EXECUTION',
    description: 'Blocks regrade execution from outcome decisions',
    allowedRoles: [],
    blockedRoles: ALLOWED_OUTCOME_ROLES.concat(BLOCKED_OUTCOME_ROLES),
    failClosed: true,
    failClosedDecision: 'deny',
  },
  RECOVERY_OUTCOME_NO_GENERATED_QUESTION: {
    policyFamily: 'RECOVERY_OUTCOME_NO_GENERATED_QUESTION',
    description: 'Blocks question generation from outcome decisions',
    allowedRoles: [],
    blockedRoles: ALLOWED_OUTCOME_ROLES.concat(BLOCKED_OUTCOME_ROLES),
    failClosed: true,
    failClosedDecision: 'deny',
  },
  RECOVERY_OUTCOME_NO_AI_NARRATIVE: {
    policyFamily: 'RECOVERY_OUTCOME_NO_AI_NARRATIVE',
    description: 'Blocks AI narrative generation from outcome decisions',
    allowedRoles: [],
    blockedRoles: ALLOWED_OUTCOME_ROLES.concat(BLOCKED_OUTCOME_ROLES),
    failClosed: true,
    failClosedDecision: 'deny',
  },
  RECOVERY_OUTCOME_NO_OCR: {
    policyFamily: 'RECOVERY_OUTCOME_NO_OCR',
    description: 'Blocks OCR processing from outcome decisions',
    allowedRoles: [],
    blockedRoles: ALLOWED_OUTCOME_ROLES.concat(BLOCKED_OUTCOME_ROLES),
    failClosed: true,
    failClosedDecision: 'deny',
  },
  RECOVERY_OUTCOME_NO_PDF: {
    policyFamily: 'RECOVERY_OUTCOME_NO_PDF',
    description: 'Blocks PDF generation from outcome decisions',
    allowedRoles: [],
    blockedRoles: ALLOWED_OUTCOME_ROLES.concat(BLOCKED_OUTCOME_ROLES),
    failClosed: true,
    failClosedDecision: 'deny',
  },
  RECOVERY_OUTCOME_NO_EXTERNAL_SYNC: {
    policyFamily: 'RECOVERY_OUTCOME_NO_EXTERNAL_SYNC',
    description: 'Blocks external sync from outcome decisions',
    allowedRoles: [],
    blockedRoles: ALLOWED_OUTCOME_ROLES.concat(BLOCKED_OUTCOME_ROLES),
    failClosed: true,
    failClosedDecision: 'deny',
  },
};

export class RecoveryOutcomePolicyEnforcer {
  enforce(policyFamily: string, actorRole: string): RecoveryOutcomePolicyDecision {
    const policy = RECOVERY_OUTCOME_POLICY_FAMILIES[policyFamily];
    if (!policy) {
      return { allowed: false, policyFamily, decision: 'deny', reasonCode: 'POLICY_NOT_FOUND', safeMessage: 'Policy family not found', blockedReasonCodes: ['POLICY_NOT_FOUND'] };
    }
    if (policy.blockedRoles.includes(actorRole)) {
      return { allowed: false, policyFamily, decision: 'deny', reasonCode: 'ROLE_BLOCKED', safeMessage: 'Role is blocked for this operation', blockedReasonCodes: ['ROLE_BLOCKED'] };
    }
    if (policy.allowedRoles.includes(actorRole)) {
      return { allowed: true, policyFamily, decision: 'allow' };
    }
    if (policy.failClosed) {
      return { allowed: false, policyFamily, decision: policy.failClosedDecision, reasonCode: 'ROLE_NOT_ALLOWED', safeMessage: 'Role is not allowed for this operation', blockedReasonCodes: ['ROLE_NOT_ALLOWED'] };
    }
    return { allowed: false, policyFamily, decision: 'deny', reasonCode: 'UNKNOWN_ROLE', safeMessage: 'Unknown role', blockedReasonCodes: ['UNKNOWN_ROLE'] };
  }
}

export type RecoveryOutcomePolicyDecision = {
  allowed: boolean;
  policyFamily: string;
  decision: string;
  reasonCode?: string;
  safeMessage?: string;
  blockedReasonCodes?: string[];
};
