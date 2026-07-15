export interface RecoveryProgressPolicyDefinition {
  policyFamily: string;
  description: string;
  allowedRoles: string[];
  blockedRoles: string[];
  failClosed: boolean;
  failClosedDecision: string;
}

const ALLOWED_PROGRESS_ROLES: string[] = ['teacher', 'lead_teacher', 'department_head', 'admin', 'system_job'];
const BLOCKED_PROGRESS_ROLES: string[] = ['student', 'parent', 'guest', 'unknown'];

export const RECOVERY_PROGRESS_POLICY_FAMILIES: Record<string, RecoveryProgressPolicyDefinition> = {
  RECOVERY_PROGRESS_OBSERVATION_CREATION: {
    policyFamily: 'RECOVERY_PROGRESS_OBSERVATION_CREATION',
    description: 'Controls creation of recovery progress observations',
    allowedRoles: ALLOWED_PROGRESS_ROLES,
    blockedRoles: BLOCKED_PROGRESS_ROLES,
    failClosed: true,
    failClosedDecision: 'deny',
  },
  RECOVERY_CHECKPOINT_EVALUATION_CREATION: {
    policyFamily: 'RECOVERY_CHECKPOINT_EVALUATION_CREATION',
    description: 'Controls creation of checkpoint evaluations',
    allowedRoles: ALLOWED_PROGRESS_ROLES,
    blockedRoles: BLOCKED_PROGRESS_ROLES,
    failClosed: true,
    failClosedDecision: 'deny',
  },
  RECOVERY_OUTCOME_EVIDENCE_CREATION: {
    policyFamily: 'RECOVERY_OUTCOME_EVIDENCE_CREATION',
    description: 'Controls creation of outcome evidence references',
    allowedRoles: ALLOWED_PROGRESS_ROLES,
    blockedRoles: BLOCKED_PROGRESS_ROLES,
    failClosed: true,
    failClosedDecision: 'deny',
  },
  RECOVERY_PLAN_ADJUSTMENT_DRAFT_CREATION: {
    policyFamily: 'RECOVERY_PLAN_ADJUSTMENT_DRAFT_CREATION',
    description: 'Controls creation of plan adjustment drafts',
    allowedRoles: ALLOWED_PROGRESS_ROLES,
    blockedRoles: BLOCKED_PROGRESS_ROLES,
    failClosed: true,
    failClosedDecision: 'deny',
  },
  RECOVERY_TEACHER_REVIEW_DECISION_CREATION: {
    policyFamily: 'RECOVERY_TEACHER_REVIEW_DECISION_CREATION',
    description: 'Controls creation of teacher review decisions',
    allowedRoles: ALLOWED_PROGRESS_ROLES,
    blockedRoles: BLOCKED_PROGRESS_ROLES,
    failClosed: true,
    failClosedDecision: 'deny',
  },
  RECOVERY_STUDENT_PROGRESS_REFLECTION_DRAFT_CREATION: {
    policyFamily: 'RECOVERY_STUDENT_PROGRESS_REFLECTION_DRAFT_CREATION',
    description: 'Controls creation of student progress reflection drafts',
    allowedRoles: ALLOWED_PROGRESS_ROLES,
    blockedRoles: BLOCKED_PROGRESS_ROLES,
    failClosed: true,
    failClosedDecision: 'deny',
  },
  RECOVERY_PARENT_PROGRESS_NOTE_DRAFT_CREATION: {
    policyFamily: 'RECOVERY_PARENT_PROGRESS_NOTE_DRAFT_CREATION',
    description: 'Controls creation of parent progress note drafts',
    allowedRoles: ALLOWED_PROGRESS_ROLES,
    blockedRoles: BLOCKED_PROGRESS_ROLES,
    failClosed: true,
    failClosedDecision: 'deny',
  },
  RECOVERY_EVIDENCE_ROLLUP_MUTATION: {
    policyFamily: 'RECOVERY_EVIDENCE_ROLLUP_MUTATION',
    description: 'Controls mutation of evidence rollups',
    allowedRoles: ALLOWED_PROGRESS_ROLES,
    blockedRoles: BLOCKED_PROGRESS_ROLES,
    failClosed: true,
    failClosedDecision: 'deny',
  },
  RECOVERY_PROGRESS_SUMMARY_MUTATION: {
    policyFamily: 'RECOVERY_PROGRESS_SUMMARY_MUTATION',
    description: 'Controls mutation of progress summaries',
    allowedRoles: ALLOWED_PROGRESS_ROLES,
    blockedRoles: BLOCKED_PROGRESS_ROLES,
    failClosed: true,
    failClosedDecision: 'deny',
  },
  RECOVERY_PROGRESS_AUDIT: {
    policyFamily: 'RECOVERY_PROGRESS_AUDIT',
    description: 'Requires audit record for progress mutations',
    allowedRoles: ALLOWED_PROGRESS_ROLES,
    blockedRoles: BLOCKED_PROGRESS_ROLES,
    failClosed: true,
    failClosedDecision: 'deny',
  },
  RECOVERY_PROGRESS_NO_LIVE_PROGRESS_MUTATION: {
    policyFamily: 'RECOVERY_PROGRESS_NO_LIVE_PROGRESS_MUTATION',
    description: 'Blocks live progress mutation',
    allowedRoles: [],
    blockedRoles: ['*'],
    failClosed: true,
    failClosedDecision: 'deny',
  },
  RECOVERY_PROGRESS_NO_LIVE_ASSIGNMENT: {
    policyFamily: 'RECOVERY_PROGRESS_NO_LIVE_ASSIGNMENT',
    description: 'Blocks live assignment behavior',
    allowedRoles: [],
    blockedRoles: ['*'],
    failClosed: true,
    failClosedDecision: 'deny',
  },
  RECOVERY_PROGRESS_NO_LIVE_NOTIFICATION: {
    policyFamily: 'RECOVERY_PROGRESS_NO_LIVE_NOTIFICATION',
    description: 'Blocks notification behavior',
    allowedRoles: [],
    blockedRoles: ['*'],
    failClosed: true,
    failClosedDecision: 'deny',
  },
  RECOVERY_PROGRESS_NO_SCORE_MUTATION: {
    policyFamily: 'RECOVERY_PROGRESS_NO_SCORE_MUTATION',
    description: 'Blocks score mutation',
    allowedRoles: [],
    blockedRoles: ['*'],
    failClosed: true,
    failClosedDecision: 'deny',
  },
  RECOVERY_PROGRESS_NO_MASTERY_MUTATION: {
    policyFamily: 'RECOVERY_PROGRESS_NO_MASTERY_MUTATION',
    description: 'Blocks mastery mutation',
    allowedRoles: [],
    blockedRoles: ['*'],
    failClosed: true,
    failClosedDecision: 'deny',
  },
  RECOVERY_PROGRESS_NO_GENERATED_QUESTION: {
    policyFamily: 'RECOVERY_PROGRESS_NO_GENERATED_QUESTION',
    description: 'Blocks question generation',
    allowedRoles: [],
    blockedRoles: ['*'],
    failClosed: true,
    failClosedDecision: 'deny',
  },
  RECOVERY_PROGRESS_NO_AI_NARRATIVE: {
    policyFamily: 'RECOVERY_PROGRESS_NO_AI_NARRATIVE',
    description: 'Blocks AI narrative generation',
    allowedRoles: [],
    blockedRoles: ['*'],
    failClosed: true,
    failClosedDecision: 'deny',
  },
  RECOVERY_PROGRESS_NO_OCR: {
    policyFamily: 'RECOVERY_PROGRESS_NO_OCR',
    description: 'Blocks OCR',
    allowedRoles: [],
    blockedRoles: ['*'],
    failClosed: true,
    failClosedDecision: 'deny',
  },
  RECOVERY_PROGRESS_NO_PDF: {
    policyFamily: 'RECOVERY_PROGRESS_NO_PDF',
    description: 'Blocks PDF generation',
    allowedRoles: [],
    blockedRoles: ['*'],
    failClosed: true,
    failClosedDecision: 'deny',
  },
  RECOVERY_PROGRESS_NO_EXTERNAL_SYNC: {
    policyFamily: 'RECOVERY_PROGRESS_NO_EXTERNAL_SYNC',
    description: 'Blocks external sync',
    allowedRoles: [],
    blockedRoles: ['*'],
    failClosed: true,
    failClosedDecision: 'deny',
  },
};

export class RecoveryProgressPolicyEnforcer {
  enforce(policyFamily: string, actorRole: string): { allowed: boolean; reasonCode: string; safeMessage: string } {
    const policy = RECOVERY_PROGRESS_POLICY_FAMILIES[policyFamily];
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

  getPolicy(policyFamily: string): RecoveryProgressPolicyDefinition | undefined {
    return RECOVERY_PROGRESS_POLICY_FAMILIES[policyFamily];
  }

  isRoleAllowed(policyFamily: string, role: string): boolean {
    const policy = RECOVERY_PROGRESS_POLICY_FAMILIES[policyFamily];
    if (!policy) return false;
    if (policy.blockedRoles.includes('*') || policy.blockedRoles.includes(role)) return false;
    return policy.allowedRoles.includes(role);
  }
}
