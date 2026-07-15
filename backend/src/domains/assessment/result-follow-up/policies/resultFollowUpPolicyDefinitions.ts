import { ALLOWED_FOLLOW_UP_CREATION_ROLES, BLOCKED_FOLLOW_UP_CREATION_ROLES, FORBIDDEN_FOLLOW_UP_FIELDS } from '../contracts/resultFollowUpContracts';

export interface FollowUpPolicyDefinition {
  policyFamily: string;
  description: string;
  allowedRoles: string[];
  blockedRoles: string[];
  failClosed: boolean;
  failClosedDecision: string;
}

export const RESULT_FOLLOW_UP_POLICY_FAMILIES: Record<string, FollowUpPolicyDefinition> = {
  RESULT_FOLLOW_UP_CASE_CREATION: {
    policyFamily: 'RESULT_FOLLOW_UP_CASE_CREATION',
    description: 'Controls creation of follow-up cases',
    allowedRoles: ALLOWED_FOLLOW_UP_CREATION_ROLES,
    blockedRoles: BLOCKED_FOLLOW_UP_CREATION_ROLES,
    failClosed: true,
    failClosedDecision: 'deny',
  },
  RESULT_FOLLOW_UP_SIGNAL_CREATION: {
    policyFamily: 'RESULT_FOLLOW_UP_SIGNAL_CREATION',
    description: 'Controls creation of follow-up signals',
    allowedRoles: ALLOWED_FOLLOW_UP_CREATION_ROLES,
    blockedRoles: BLOCKED_FOLLOW_UP_CREATION_ROLES,
    failClosed: true,
    failClosedDecision: 'deny',
  },
  RESULT_FOLLOW_UP_ACTION_PLAN_CREATION: {
    policyFamily: 'RESULT_FOLLOW_UP_ACTION_PLAN_CREATION',
    description: 'Controls creation of action plans',
    allowedRoles: ALLOWED_FOLLOW_UP_CREATION_ROLES,
    blockedRoles: BLOCKED_FOLLOW_UP_CREATION_ROLES,
    failClosed: true,
    failClosedDecision: 'deny',
  },
  TEACHER_FOLLOW_UP_QUEUE_CREATION: {
    policyFamily: 'TEACHER_FOLLOW_UP_QUEUE_CREATION',
    description: 'Controls creation of teacher queue items',
    allowedRoles: ALLOWED_FOLLOW_UP_CREATION_ROLES,
    blockedRoles: BLOCKED_FOLLOW_UP_CREATION_ROLES,
    failClosed: true,
    failClosedDecision: 'deny',
  },
  PARENT_GUIDANCE_DRAFT_CREATION: {
    policyFamily: 'PARENT_GUIDANCE_DRAFT_CREATION',
    description: 'Controls creation of parent guidance drafts',
    allowedRoles: ALLOWED_FOLLOW_UP_CREATION_ROLES,
    blockedRoles: ['student', 'parent', 'guest', 'unknown'],
    failClosed: true,
    failClosedDecision: 'deny',
  },
  STUDENT_REFLECTION_TASK_DRAFT_CREATION: {
    policyFamily: 'STUDENT_REFLECTION_TASK_DRAFT_CREATION',
    description: 'Controls creation of student reflection task drafts',
    allowedRoles: ALLOWED_FOLLOW_UP_CREATION_ROLES,
    blockedRoles: BLOCKED_FOLLOW_UP_CREATION_ROLES,
    failClosed: true,
    failClosedDecision: 'deny',
  },
  FOLLOW_UP_REVIEW_WINDOW_CREATION: {
    policyFamily: 'FOLLOW_UP_REVIEW_WINDOW_CREATION',
    description: 'Controls creation of review windows',
    allowedRoles: ALLOWED_FOLLOW_UP_CREATION_ROLES,
    blockedRoles: BLOCKED_FOLLOW_UP_CREATION_ROLES,
    failClosed: true,
    failClosedDecision: 'deny',
  },
  FOLLOW_UP_ESCALATION_PLAN_CREATION: {
    policyFamily: 'FOLLOW_UP_ESCALATION_PLAN_CREATION',
    description: 'Controls creation of escalation plans',
    allowedRoles: ['lead_teacher', 'department_head', 'admin', 'system_job'],
    blockedRoles: ['student', 'parent', 'guest', 'unknown', 'teacher'],
    failClosed: true,
    failClosedDecision: 'deny',
  },
  FOLLOW_UP_SUMMARY_MUTATION: {
    policyFamily: 'FOLLOW_UP_SUMMARY_MUTATION',
    description: 'Controls mutation of follow-up summaries',
    allowedRoles: ALLOWED_FOLLOW_UP_CREATION_ROLES,
    blockedRoles: BLOCKED_FOLLOW_UP_CREATION_ROLES,
    failClosed: true,
    failClosedDecision: 'deny',
  },
  FOLLOW_UP_AUDIT: {
    policyFamily: 'FOLLOW_UP_AUDIT',
    description: 'Requires audit record for follow-up mutations',
    allowedRoles: ALLOWED_FOLLOW_UP_CREATION_ROLES,
    blockedRoles: BLOCKED_FOLLOW_UP_CREATION_ROLES,
    failClosed: true,
    failClosedDecision: 'deny',
  },
  RESULT_FOLLOW_UP_NO_LIVE_NOTIFICATION: {
    policyFamily: 'RESULT_FOLLOW_UP_NO_LIVE_NOTIFICATION',
    description: 'Blocks live notification behavior in follow-up',
    allowedRoles: [],
    blockedRoles: ['*'],
    failClosed: true,
    failClosedDecision: 'deny',
  },
  RESULT_FOLLOW_UP_NO_LIVE_TASK: {
    policyFamily: 'RESULT_FOLLOW_UP_NO_LIVE_TASK',
    description: 'Blocks live task creation in follow-up',
    allowedRoles: [],
    blockedRoles: ['*'],
    failClosed: true,
    failClosedDecision: 'deny',
  },
  RESULT_FOLLOW_UP_NO_SCORE_MUTATION: {
    policyFamily: 'RESULT_FOLLOW_UP_NO_SCORE_MUTATION',
    description: 'Blocks score mutation in follow-up',
    allowedRoles: [],
    blockedRoles: ['*'],
    failClosed: true,
    failClosedDecision: 'deny',
  },
  RESULT_FOLLOW_UP_NO_AI_NARRATIVE: {
    policyFamily: 'RESULT_FOLLOW_UP_NO_AI_NARRATIVE',
    description: 'Blocks AI narrative generation in follow-up',
    allowedRoles: [],
    blockedRoles: ['*'],
    failClosed: true,
    failClosedDecision: 'deny',
  },
  RESULT_FOLLOW_UP_NO_OCR: {
    policyFamily: 'RESULT_FOLLOW_UP_NO_OCR',
    description: 'Blocks OCR in follow-up',
    allowedRoles: [],
    blockedRoles: ['*'],
    failClosed: true,
    failClosedDecision: 'deny',
  },
};

export class ResultFollowUpPolicyEnforcer {
  enforce(policyFamily: string, actorRole: string): { allowed: boolean; reasonCode: string; safeMessage: string } {
    const policy = RESULT_FOLLOW_UP_POLICY_FAMILIES[policyFamily];
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

  getPolicy(policyFamily: string): FollowUpPolicyDefinition | undefined {
    return RESULT_FOLLOW_UP_POLICY_FAMILIES[policyFamily];
  }

  getAllowedRoles(policyFamily: string): string[] {
    const policy = RESULT_FOLLOW_UP_POLICY_FAMILIES[policyFamily];
    return policy ? policy.allowedRoles : [];
  }

  isRoleAllowed(policyFamily: string, role: string): boolean {
    const policy = RESULT_FOLLOW_UP_POLICY_FAMILIES[policyFamily];
    if (!policy) return false;
    if (policy.blockedRoles.includes('*') || policy.blockedRoles.includes(role)) return false;
    return policy.allowedRoles.includes(role);
  }
}
