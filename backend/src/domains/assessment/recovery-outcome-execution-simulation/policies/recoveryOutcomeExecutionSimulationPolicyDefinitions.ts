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

export const RECOVERY_OUTCOME_EXECUTION_SIMULATION_POLICIES: Record<PolicyFamilyName, PolicyDefinition> = {
  RECOVERY_OUTCOME_EXECUTION_SIMULATION_READINESS_CREATION: definePolicy(
    'RECOVERY_OUTCOME_EXECUTION_SIMULATION_READINESS_CREATION',
    'Controls creation of simulation readiness records'
  ),
  RECOVERY_OUTCOME_EXECUTION_SIMULATION_PLAN_CREATION: definePolicy(
    'RECOVERY_OUTCOME_EXECUTION_SIMULATION_PLAN_CREATION',
    'Controls creation of simulation plan records'
  ),
  RECOVERY_OUTCOME_EXECUTION_SIMULATION_RUN_CREATION: definePolicy(
    'RECOVERY_OUTCOME_EXECUTION_SIMULATION_RUN_CREATION',
    'Controls creation of simulation run records'
  ),
  RECOVERY_OUTCOME_EXECUTION_SIMULATION_STEP_RECORDING: definePolicy(
    'RECOVERY_OUTCOME_EXECUTION_SIMULATION_STEP_RECORDING',
    'Controls recording of simulation steps'
  ),
  RECOVERY_OUTCOME_EXECUTION_ELIGIBILITY_CHECK_CREATION: definePolicy(
    'RECOVERY_OUTCOME_EXECUTION_ELIGIBILITY_CHECK_CREATION',
    'Controls creation of eligibility check records'
  ),
  RECOVERY_OUTCOME_EXECUTION_BLOCKED_ACTION_DIAGNOSTIC_CREATION: definePolicy(
    'RECOVERY_OUTCOME_EXECUTION_BLOCKED_ACTION_DIAGNOSTIC_CREATION',
    'Controls creation of blocked action diagnostic records'
  ),
  RECOVERY_OUTCOME_EXECUTION_FAILURE_INJECTION_CREATION: definePolicy(
    'RECOVERY_OUTCOME_EXECUTION_FAILURE_INJECTION_CREATION',
    'Controls creation of failure injection records'
  ),
  RECOVERY_OUTCOME_EXECUTION_SIMULATION_RESULT_CREATION: definePolicy(
    'RECOVERY_OUTCOME_EXECUTION_SIMULATION_RESULT_CREATION',
    'Controls creation of simulation result records'
  ),
  RECOVERY_OUTCOME_EXECUTION_TEACHER_REVIEW_CREATION: definePolicy(
    'RECOVERY_OUTCOME_EXECUTION_TEACHER_REVIEW_CREATION',
    'Controls creation of teacher simulation review records'
  ),
  RECOVERY_OUTCOME_EXECUTION_STUDENT_PREVIEW_DRAFT_CREATION: definePolicy(
    'RECOVERY_OUTCOME_EXECUTION_STUDENT_PREVIEW_DRAFT_CREATION',
    'Controls creation of student preview draft records'
  ),
  RECOVERY_OUTCOME_EXECUTION_PARENT_PREVIEW_DRAFT_CREATION: definePolicy(
    'RECOVERY_OUTCOME_EXECUTION_PARENT_PREVIEW_DRAFT_CREATION',
    'Controls creation of parent preview draft records'
  ),
  RECOVERY_OUTCOME_EXECUTION_READINESS_VERDICT_CREATION: definePolicy(
    'RECOVERY_OUTCOME_EXECUTION_READINESS_VERDICT_CREATION',
    'Controls creation of readiness verdict records'
  ),
  RECOVERY_OUTCOME_EXECUTION_SIMULATION_SUMMARY_MUTATION: definePolicy(
    'RECOVERY_OUTCOME_EXECUTION_SIMULATION_SUMMARY_MUTATION',
    'Controls mutation of simulation summary records'
  ),
  RECOVERY_OUTCOME_EXECUTION_SIMULATION_AUDIT: definePolicy(
    'RECOVERY_OUTCOME_EXECUTION_SIMULATION_AUDIT',
    'Controls audit event creation for simulation operations'
  ),
  RECOVERY_OUTCOME_EXECUTION_NO_LIVE_EXECUTION: definePolicy(
    'RECOVERY_OUTCOME_EXECUTION_NO_LIVE_EXECUTION',
    'Blocks live execution of recovery actions',
    { allowedRoles: [] }
  ),
  RECOVERY_OUTCOME_EXECUTION_NO_LIVE_ACTIVATION: definePolicy(
    'RECOVERY_OUTCOME_EXECUTION_NO_LIVE_ACTIVATION',
    'Blocks live activation operations',
    { allowedRoles: [] }
  ),
  RECOVERY_OUTCOME_EXECUTION_NO_LIVE_COMPLETION: definePolicy(
    'RECOVERY_OUTCOME_EXECUTION_NO_LIVE_COMPLETION',
    'Blocks live completion operations',
    { allowedRoles: [] }
  ),
  RECOVERY_OUTCOME_EXECUTION_NO_LIVE_CLOSURE: definePolicy(
    'RECOVERY_OUTCOME_EXECUTION_NO_LIVE_CLOSURE',
    'Blocks live closure operations',
    { allowedRoles: [] }
  ),
  RECOVERY_OUTCOME_EXECUTION_NO_LIVE_ASSIGNMENT: definePolicy(
    'RECOVERY_OUTCOME_EXECUTION_NO_LIVE_ASSIGNMENT',
    'Blocks live assignment creation',
    { allowedRoles: [] }
  ),
  RECOVERY_OUTCOME_EXECUTION_NO_LIVE_NOTIFICATION: definePolicy(
    'RECOVERY_OUTCOME_EXECUTION_NO_LIVE_NOTIFICATION',
    'Blocks live notification sending',
    { allowedRoles: [] }
  ),
  RECOVERY_OUTCOME_EXECUTION_NO_PORTAL_PUBLISH: definePolicy(
    'RECOVERY_OUTCOME_EXECUTION_NO_PORTAL_PUBLISH',
    'Blocks portal publishing',
    { allowedRoles: [] }
  ),
  RECOVERY_OUTCOME_EXECUTION_NO_SCORE_MUTATION: definePolicy(
    'RECOVERY_OUTCOME_EXECUTION_NO_SCORE_MUTATION',
    'Blocks score mutation',
    { allowedRoles: [] }
  ),
  RECOVERY_OUTCOME_EXECUTION_NO_MASTERY_MUTATION: definePolicy(
    'RECOVERY_OUTCOME_EXECUTION_NO_MASTERY_MUTATION',
    'Blocks mastery mutation',
    { allowedRoles: [] }
  ),
  RECOVERY_OUTCOME_EXECUTION_NO_REGRADE_EXECUTION: definePolicy(
    'RECOVERY_OUTCOME_EXECUTION_NO_REGRADE_EXECUTION',
    'Blocks regrade execution',
    { allowedRoles: [] }
  ),
  RECOVERY_OUTCOME_EXECUTION_NO_GENERATED_QUESTION: definePolicy(
    'RECOVERY_OUTCOME_EXECUTION_NO_GENERATED_QUESTION',
    'Blocks generated question creation',
    { allowedRoles: [] }
  ),
  RECOVERY_OUTCOME_EXECUTION_NO_AI_NARRATIVE: definePolicy(
    'RECOVERY_OUTCOME_EXECUTION_NO_AI_NARRATIVE',
    'Blocks AI narrative generation',
    { allowedRoles: [] }
  ),
  RECOVERY_OUTCOME_EXECUTION_NO_OCR: definePolicy(
    'RECOVERY_OUTCOME_EXECUTION_NO_OCR',
    'Blocks OCR processing',
    { allowedRoles: [] }
  ),
  RECOVERY_OUTCOME_EXECUTION_NO_PDF: definePolicy(
    'RECOVERY_OUTCOME_EXECUTION_NO_PDF',
    'Blocks PDF generation',
    { allowedRoles: [] }
  ),
  RECOVERY_OUTCOME_EXECUTION_NO_EXTERNAL_SYNC: definePolicy(
    'RECOVERY_OUTCOME_EXECUTION_NO_EXTERNAL_SYNC',
    'Blocks external sync operations',
    { allowedRoles: [] }
  ),
};

export class RecoveryOutcomeExecutionSimulationPolicyEnforcer {
  private policies: Record<PolicyFamilyName, PolicyDefinition>;

  constructor(policies?: Record<PolicyFamilyName, PolicyDefinition>) {
    this.policies = policies ?? RECOVERY_OUTCOME_EXECUTION_SIMULATION_POLICIES;
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
