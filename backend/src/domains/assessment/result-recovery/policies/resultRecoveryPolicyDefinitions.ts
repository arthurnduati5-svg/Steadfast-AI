export interface RecoveryPolicyDefinition {
  policyFamily: string;
  description: string;
  allowedRoles: string[];
  blockedRoles: string[];
  failClosed: boolean;
  failClosedDecision: string;
}

const ALLOWED_RECOVERY_CREATION_ROLES: string[] = ['teacher', 'lead_teacher', 'department_head', 'admin', 'system_job'];
const BLOCKED_RECOVERY_CREATION_ROLES: string[] = ['student', 'parent', 'guest', 'unknown'];

export const RESULT_RECOVERY_POLICY_FAMILIES: Record<string, RecoveryPolicyDefinition> = {
  RESULT_RECOVERY_PLAN_CREATION: {
    policyFamily: 'RESULT_RECOVERY_PLAN_CREATION',
    description: 'Controls creation of recovery plans',
    allowedRoles: ALLOWED_RECOVERY_CREATION_ROLES,
    blockedRoles: BLOCKED_RECOVERY_CREATION_ROLES,
    failClosed: true,
    failClosedDecision: 'deny',
  },
  RESULT_RECOVERY_OBJECTIVE_CREATION: {
    policyFamily: 'RESULT_RECOVERY_OBJECTIVE_CREATION',
    description: 'Controls creation of recovery objectives',
    allowedRoles: ALLOWED_RECOVERY_CREATION_ROLES,
    blockedRoles: BLOCKED_RECOVERY_CREATION_ROLES,
    failClosed: true,
    failClosedDecision: 'deny',
  },
  RESULT_RECOVERY_STEP_CREATION: {
    policyFamily: 'RESULT_RECOVERY_STEP_CREATION',
    description: 'Controls creation of recovery steps',
    allowedRoles: ALLOWED_RECOVERY_CREATION_ROLES,
    blockedRoles: BLOCKED_RECOVERY_CREATION_ROLES,
    failClosed: true,
    failClosedDecision: 'deny',
  },
  RESULT_RECOVERY_PRACTICE_DRAFT_CREATION: {
    policyFamily: 'RESULT_RECOVERY_PRACTICE_DRAFT_CREATION',
    description: 'Controls creation of practice drafts',
    allowedRoles: ALLOWED_RECOVERY_CREATION_ROLES,
    blockedRoles: BLOCKED_RECOVERY_CREATION_ROLES,
    failClosed: true,
    failClosedDecision: 'deny',
  },
  RESULT_RECOVERY_RESOURCE_RECOMMENDATION_CREATION: {
    policyFamily: 'RESULT_RECOVERY_RESOURCE_RECOMMENDATION_CREATION',
    description: 'Controls creation of resource recommendations',
    allowedRoles: ALLOWED_RECOVERY_CREATION_ROLES,
    blockedRoles: BLOCKED_RECOVERY_CREATION_ROLES,
    failClosed: true,
    failClosedDecision: 'deny',
  },
  RESULT_RECOVERY_TEACHER_REVIEW_PACKET_CREATION: {
    policyFamily: 'RESULT_RECOVERY_TEACHER_REVIEW_PACKET_CREATION',
    description: 'Controls creation of teacher review packets',
    allowedRoles: ALLOWED_RECOVERY_CREATION_ROLES,
    blockedRoles: BLOCKED_RECOVERY_CREATION_ROLES,
    failClosed: true,
    failClosedDecision: 'deny',
  },
  RESULT_RECOVERY_STUDENT_SUPPORT_DRAFT_CREATION: {
    policyFamily: 'RESULT_RECOVERY_STUDENT_SUPPORT_DRAFT_CREATION',
    description: 'Controls creation of student support drafts',
    allowedRoles: ALLOWED_RECOVERY_CREATION_ROLES,
    blockedRoles: BLOCKED_RECOVERY_CREATION_ROLES,
    failClosed: true,
    failClosedDecision: 'deny',
  },
  RESULT_RECOVERY_PARENT_SUPPORT_NOTE_DRAFT_CREATION: {
    policyFamily: 'RESULT_RECOVERY_PARENT_SUPPORT_NOTE_DRAFT_CREATION',
    description: 'Controls creation of parent support note drafts',
    allowedRoles: ALLOWED_RECOVERY_CREATION_ROLES,
    blockedRoles: BLOCKED_RECOVERY_CREATION_ROLES,
    failClosed: true,
    failClosedDecision: 'deny',
  },
  RESULT_RECOVERY_CHECKPOINT_CREATION: {
    policyFamily: 'RESULT_RECOVERY_CHECKPOINT_CREATION',
    description: 'Controls creation of recovery checkpoints',
    allowedRoles: ALLOWED_RECOVERY_CREATION_ROLES,
    blockedRoles: BLOCKED_RECOVERY_CREATION_ROLES,
    failClosed: true,
    failClosedDecision: 'deny',
  },
  RESULT_RECOVERY_SUMMARY_MUTATION: {
    policyFamily: 'RESULT_RECOVERY_SUMMARY_MUTATION',
    description: 'Controls mutation of recovery summaries',
    allowedRoles: ALLOWED_RECOVERY_CREATION_ROLES,
    blockedRoles: BLOCKED_RECOVERY_CREATION_ROLES,
    failClosed: true,
    failClosedDecision: 'deny',
  },
  RESULT_RECOVERY_AUDIT: {
    policyFamily: 'RESULT_RECOVERY_AUDIT',
    description: 'Requires audit record for recovery mutations',
    allowedRoles: ALLOWED_RECOVERY_CREATION_ROLES,
    blockedRoles: BLOCKED_RECOVERY_CREATION_ROLES,
    failClosed: true,
    failClosedDecision: 'deny',
  },
  RESULT_RECOVERY_NO_LIVE_ASSIGNMENT: {
    policyFamily: 'RESULT_RECOVERY_NO_LIVE_ASSIGNMENT',
    description: 'Blocks live assignment creation in recovery',
    allowedRoles: [],
    blockedRoles: ['*'],
    failClosed: true,
    failClosedDecision: 'deny',
  },
  RESULT_RECOVERY_NO_LIVE_NOTIFICATION: {
    policyFamily: 'RESULT_RECOVERY_NO_LIVE_NOTIFICATION',
    description: 'Blocks live notification behavior in recovery',
    allowedRoles: [],
    blockedRoles: ['*'],
    failClosed: true,
    failClosedDecision: 'deny',
  },
  RESULT_RECOVERY_NO_SCORE_MUTATION: {
    policyFamily: 'RESULT_RECOVERY_NO_SCORE_MUTATION',
    description: 'Blocks score mutation in recovery',
    allowedRoles: [],
    blockedRoles: ['*'],
    failClosed: true,
    failClosedDecision: 'deny',
  },
  RESULT_RECOVERY_NO_MASTERY_MUTATION: {
    policyFamily: 'RESULT_RECOVERY_NO_MASTERY_MUTATION',
    description: 'Blocks mastery mutation in recovery',
    allowedRoles: [],
    blockedRoles: ['*'],
    failClosed: true,
    failClosedDecision: 'deny',
  },
  RESULT_RECOVERY_NO_GENERATED_QUESTION: {
    policyFamily: 'RESULT_RECOVERY_NO_GENERATED_QUESTION',
    description: 'Blocks generated question creation in recovery',
    allowedRoles: [],
    blockedRoles: ['*'],
    failClosed: true,
    failClosedDecision: 'deny',
  },
  RESULT_RECOVERY_NO_AI_NARRATIVE: {
    policyFamily: 'RESULT_RECOVERY_NO_AI_NARRATIVE',
    description: 'Blocks AI narrative generation in recovery',
    allowedRoles: [],
    blockedRoles: ['*'],
    failClosed: true,
    failClosedDecision: 'deny',
  },
  RESULT_RECOVERY_NO_OCR: {
    policyFamily: 'RESULT_RECOVERY_NO_OCR',
    description: 'Blocks OCR in recovery',
    allowedRoles: [],
    blockedRoles: ['*'],
    failClosed: true,
    failClosedDecision: 'deny',
  },
};

export class ResultRecoveryPolicyEnforcer {
  enforce(policyFamily: string, actorRole: string): { allowed: boolean; reasonCode: string; safeMessage: string } {
    const policy = RESULT_RECOVERY_POLICY_FAMILIES[policyFamily];
    if (!policy) {
      return { allowed: false, reasonCode: 'POLICY_NOT_FOUND', safeMessage: `Policy family ${policyFamily} not found` };
    }
    if (policy.blockedRoles.includes('*') || policy.blockedRoles.includes(actorRole)) {
      return { allowed: false, reasonCode: `${policyFamily}_BLOCKED`, safeMessage: `Role ${actorRole} is blocked for ${policyFamily}` };
    }
    if (policy.allowedRoles.includes(actorRole)) {
      return { allowed: true, reasonCode: `${policyFamily}_ALLOWED`, safeMessage: `Role ${actorRole} allowed for ${policyFamily}` };
    }
    if (policy.failClosed) {
      return { allowed: false, reasonCode: `${policyFamily}_DENIED`, safeMessage: `Role ${actorRole} not in allowed roles for ${policyFamily}` };
    }
    return { allowed: true, reasonCode: `${policyFamily}_ALLOWED`, safeMessage: `Role ${actorRole} not blocked for ${policyFamily}` };
  }

  getPolicy(policyFamily: string): RecoveryPolicyDefinition | undefined {
    return RESULT_RECOVERY_POLICY_FAMILIES[policyFamily];
  }

  getAllowedRoles(policyFamily: string): string[] {
    const policy = RESULT_RECOVERY_POLICY_FAMILIES[policyFamily];
    return policy ? policy.allowedRoles : [];
  }

  isRoleAllowed(policyFamily: string, role: string): boolean {
    const policy = RESULT_RECOVERY_POLICY_FAMILIES[policyFamily];
    if (!policy) return false;
    if (policy.blockedRoles.includes('*') || policy.blockedRoles.includes(role)) return false;
    return policy.allowedRoles.includes(role);
  }
}
