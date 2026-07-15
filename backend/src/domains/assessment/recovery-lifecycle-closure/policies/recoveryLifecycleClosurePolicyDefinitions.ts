export type PolicyFamilyName = string;

export interface PolicyDefinition {
  name: string;
  description: string;
  allowedRoles: string[];
  blockedRoles: string[];
  failClosed: boolean;
}

const ALLOWED_ROLES = ['teacher', 'lead_teacher', 'department_head', 'admin', 'system_job'];
const BLOCKED_ROLES = ['student', 'parent', 'guest', 'unknown'];

function definePolicy(name: string, description: string, overrides?: Partial<PolicyDefinition>): PolicyDefinition {
  return {
    name,
    description,
    allowedRoles: ALLOWED_ROLES,
    blockedRoles: BLOCKED_ROLES,
    failClosed: true,
    ...overrides,
  };
}

export const RECOVERY_LIFECYCLE_CLOSURE_POLICIES: Record<PolicyFamilyName, PolicyDefinition> = {
  RECOVERY_LIFECYCLE_CLOSURE_READINESS_CREATION: definePolicy(
    'RECOVERY_LIFECYCLE_CLOSURE_READINESS_CREATION',
    'Controls creation of closure readiness records'
  ),
  RECOVERY_POST_SIMULATION_HANDOFF_PACKET_CREATION: definePolicy(
    'RECOVERY_POST_SIMULATION_HANDOFF_PACKET_CREATION',
    'Controls creation of post-simulation handoff packet records'
  ),
  RECOVERY_NEXT_CYCLE_RECOMMENDATION_DRAFT_CREATION: definePolicy(
    'RECOVERY_NEXT_CYCLE_RECOMMENDATION_DRAFT_CREATION',
    'Controls creation of next cycle recommendation draft records'
  ),
  RECOVERY_DEFERRED_INTEGRATION_TICKET_CREATION: definePolicy(
    'RECOVERY_DEFERRED_INTEGRATION_TICKET_CREATION',
    'Controls creation of deferred integration ticket records'
  ),
  RECOVERY_UNRESOLVED_RISK_REGISTER_CREATION: definePolicy(
    'RECOVERY_UNRESOLVED_RISK_REGISTER_CREATION',
    'Controls creation of unresolved risk register records'
  ),
  RECOVERY_TEACHER_CLOSURE_REVIEW_PACKET_CREATION: definePolicy(
    'RECOVERY_TEACHER_CLOSURE_REVIEW_PACKET_CREATION',
    'Controls creation of teacher closure review packet records'
  ),
  RECOVERY_ADMIN_GOVERNANCE_REVIEW_PACKET_CREATION: definePolicy(
    'RECOVERY_ADMIN_GOVERNANCE_REVIEW_PACKET_CREATION',
    'Controls creation of admin governance review packet records'
  ),
  RECOVERY_STUDENT_CLOSURE_REFLECTION_DRAFT_CREATION: definePolicy(
    'RECOVERY_STUDENT_CLOSURE_REFLECTION_DRAFT_CREATION',
    'Controls creation of student closure reflection draft records'
  ),
  RECOVERY_PARENT_CLOSURE_GUIDANCE_DRAFT_CREATION: definePolicy(
    'RECOVERY_PARENT_CLOSURE_GUIDANCE_DRAFT_CREATION',
    'Controls creation of parent closure guidance draft records'
  ),
  RECOVERY_ARCHIVE_MANIFEST_CREATION: definePolicy(
    'RECOVERY_ARCHIVE_MANIFEST_CREATION',
    'Controls creation of archive manifest records'
  ),
  RECOVERY_FINAL_LIFECYCLE_SUMMARY_MUTATION: definePolicy(
    'RECOVERY_FINAL_LIFECYCLE_SUMMARY_MUTATION',
    'Controls mutation of final lifecycle summary records'
  ),
  RECOVERY_LIFECYCLE_CLOSURE_AUDIT: definePolicy(
    'RECOVERY_LIFECYCLE_CLOSURE_AUDIT',
    'Controls creation of closure audit events'
  ),
  RECOVERY_LIFECYCLE_NO_LIVE_CLOSURE: definePolicy(
    'RECOVERY_LIFECYCLE_NO_LIVE_CLOSURE',
    'Blocks live closure operations',
    { allowedRoles: [] }
  ),
  RECOVERY_LIFECYCLE_NO_LIVE_EXECUTION: definePolicy(
    'RECOVERY_LIFECYCLE_NO_LIVE_EXECUTION',
    'Blocks live execution operations',
    { allowedRoles: [] }
  ),
  RECOVERY_LIFECYCLE_NO_LIVE_ACTIVATION: definePolicy(
    'RECOVERY_LIFECYCLE_NO_LIVE_ACTIVATION',
    'Blocks live activation operations',
    { allowedRoles: [] }
  ),
  RECOVERY_LIFECYCLE_NO_LIVE_COMPLETION: definePolicy(
    'RECOVERY_LIFECYCLE_NO_LIVE_COMPLETION',
    'Blocks live completion operations',
    { allowedRoles: [] }
  ),
  RECOVERY_LIFECYCLE_NO_LIVE_ASSIGNMENT: definePolicy(
    'RECOVERY_LIFECYCLE_NO_LIVE_ASSIGNMENT',
    'Blocks live assignment creation',
    { allowedRoles: [] }
  ),
  RECOVERY_LIFECYCLE_NO_LIVE_NOTIFICATION: definePolicy(
    'RECOVERY_LIFECYCLE_NO_LIVE_NOTIFICATION',
    'Blocks live notification sending',
    { allowedRoles: [] }
  ),
  RECOVERY_LIFECYCLE_NO_PORTAL_PUBLISH: definePolicy(
    'RECOVERY_LIFECYCLE_NO_PORTAL_PUBLISH',
    'Blocks portal publishing',
    { allowedRoles: [] }
  ),
  RECOVERY_LIFECYCLE_NO_SCORE_MUTATION: definePolicy(
    'RECOVERY_LIFECYCLE_NO_SCORE_MUTATION',
    'Blocks score mutation',
    { allowedRoles: [] }
  ),
  RECOVERY_LIFECYCLE_NO_MASTERY_MUTATION: definePolicy(
    'RECOVERY_LIFECYCLE_NO_MASTERY_MUTATION',
    'Blocks mastery mutation',
    { allowedRoles: [] }
  ),
  RECOVERY_LIFECYCLE_NO_REGRADE_EXECUTION: definePolicy(
    'RECOVERY_LIFECYCLE_NO_REGRADE_EXECUTION',
    'Blocks regrade execution',
    { allowedRoles: [] }
  ),
  RECOVERY_LIFECYCLE_NO_GENERATED_QUESTION: definePolicy(
    'RECOVERY_LIFECYCLE_NO_GENERATED_QUESTION',
    'Blocks generated question creation',
    { allowedRoles: [] }
  ),
  RECOVERY_LIFECYCLE_NO_AI_NARRATIVE: definePolicy(
    'RECOVERY_LIFECYCLE_NO_AI_NARRATIVE',
    'Blocks AI narrative generation',
    { allowedRoles: [] }
  ),
  RECOVERY_LIFECYCLE_NO_OCR: definePolicy(
    'RECOVERY_LIFECYCLE_NO_OCR',
    'Blocks OCR processing',
    { allowedRoles: [] }
  ),
  RECOVERY_LIFECYCLE_NO_PDF: definePolicy(
    'RECOVERY_LIFECYCLE_NO_PDF',
    'Blocks PDF generation',
    { allowedRoles: [] }
  ),
  RECOVERY_LIFECYCLE_NO_EXTERNAL_SYNC: definePolicy(
    'RECOVERY_LIFECYCLE_NO_EXTERNAL_SYNC',
    'Blocks external sync operations',
    { allowedRoles: [] }
  ),
};

export class RecoveryLifecycleClosurePolicyEnforcer {
  private policies: Record<PolicyFamilyName, PolicyDefinition>;

  constructor(policies?: Record<PolicyFamilyName, PolicyDefinition>) {
    this.policies = policies ?? RECOVERY_LIFECYCLE_CLOSURE_POLICIES;
  }

  enforce(
    policyFamily: string,
    actorRole: string,
    context?: Record<string, unknown>
  ): { allowed: boolean; denied: boolean; reasonCodes: string[]; actorRole: string; action: string } {
    const policy = this.policies[policyFamily];
    if (!policy) {
      return { allowed: false, denied: true, reasonCodes: ['POLICY_NOT_FOUND'], actorRole, action: policyFamily };
    }

    if (policy.blockedRoles.includes(actorRole)) {
      return { allowed: false, denied: true, reasonCodes: [`ROLE_BLOCKED:${actorRole}`], actorRole, action: policyFamily };
    }

    if (policy.allowedRoles.includes(actorRole)) {
      return { allowed: true, denied: false, reasonCodes: [], actorRole, action: policyFamily };
    }

    if (policy.failClosed) {
      return { allowed: false, denied: true, reasonCodes: [`ROLE_NOT_ALLOWED:${actorRole}`], actorRole, action: policyFamily };
    }

    return { allowed: false, denied: true, reasonCodes: [`ROLE_NOT_AUTHORIZED:${actorRole}`], actorRole, action: policyFamily };
  }

  isAllowedRole(actorRole: string): boolean {
    return ALLOWED_ROLES.includes(actorRole);
  }
}
