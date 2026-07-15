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

export const RECOVERY_OUTCOME_ACTION_POLICIES: Record<PolicyFamilyName, PolicyDefinition> = {
  RECOVERY_OUTCOME_ACTION_READINESS_CREATION: definePolicy(
    'RECOVERY_OUTCOME_ACTION_READINESS_CREATION',
    'Controls creation of action readiness records'
  ),
  RECOVERY_OUTCOME_ACTION_BUNDLE_CREATION: definePolicy(
    'RECOVERY_OUTCOME_ACTION_BUNDLE_CREATION',
    'Controls creation of action bundle records'
  ),
  RECOVERY_CONTINUATION_ACTION_DRAFT_CREATION: definePolicy(
    'RECOVERY_CONTINUATION_ACTION_DRAFT_CREATION',
    'Controls creation of continuation action drafts'
  ),
  RECOVERY_INTENSIFICATION_ACTION_DRAFT_CREATION: definePolicy(
    'RECOVERY_INTENSIFICATION_ACTION_DRAFT_CREATION',
    'Controls creation of intensification action drafts'
  ),
  RECOVERY_PAUSE_ACTION_DRAFT_CREATION: definePolicy(
    'RECOVERY_PAUSE_ACTION_DRAFT_CREATION',
    'Controls creation of pause action drafts'
  ),
  RECOVERY_CLOSURE_ACTION_DRAFT_CREATION: definePolicy(
    'RECOVERY_CLOSURE_ACTION_DRAFT_CREATION',
    'Controls creation of closure action drafts'
  ),
  RECOVERY_OUTCOME_APPROVAL_GATE_CREATION: definePolicy(
    'RECOVERY_OUTCOME_APPROVAL_GATE_CREATION',
    'Controls creation of approval gates'
  ),
  RECOVERY_OUTCOME_MOCK_ACTIVATION_QUEUE_CREATION: definePolicy(
    'RECOVERY_OUTCOME_MOCK_ACTIVATION_QUEUE_CREATION',
    'Controls creation of mock activation queue items'
  ),
  RECOVERY_OUTCOME_DRY_RUN_RECEIPT_CREATION: definePolicy(
    'RECOVERY_OUTCOME_DRY_RUN_RECEIPT_CREATION',
    'Controls creation of dry-run receipts'
  ),
  RECOVERY_OUTCOME_ROLLBACK_PLAN_CREATION: definePolicy(
    'RECOVERY_OUTCOME_ROLLBACK_PLAN_CREATION',
    'Controls creation of rollback plans'
  ),
  RECOVERY_OUTCOME_SUPPRESSION_RULE_CREATION: definePolicy(
    'RECOVERY_OUTCOME_SUPPRESSION_RULE_CREATION',
    'Controls creation of suppression rules'
  ),
  RECOVERY_OUTCOME_ACTION_SUMMARY_MUTATION: definePolicy(
    'RECOVERY_OUTCOME_ACTION_SUMMARY_MUTATION',
    'Controls mutation of action summaries'
  ),
  RECOVERY_OUTCOME_ACTION_AUDIT: definePolicy(
    'RECOVERY_OUTCOME_ACTION_AUDIT',
    'Controls audit event creation'
  ),
  RECOVERY_OUTCOME_ACTION_NO_LIVE_ACTIVATION: definePolicy(
    'RECOVERY_OUTCOME_ACTION_NO_LIVE_ACTIVATION',
    'Blocks live recovery activation operations',
    { allowedRoles: [] }
  ),
  RECOVERY_OUTCOME_ACTION_NO_LIVE_COMPLETION: definePolicy(
    'RECOVERY_OUTCOME_ACTION_NO_LIVE_COMPLETION',
    'Blocks live recovery completion operations',
    { allowedRoles: [] }
  ),
  RECOVERY_OUTCOME_ACTION_NO_LIVE_CLOSURE: definePolicy(
    'RECOVERY_OUTCOME_ACTION_NO_LIVE_CLOSURE',
    'Blocks live recovery closure operations',
    { allowedRoles: [] }
  ),
  RECOVERY_OUTCOME_ACTION_NO_LIVE_ASSIGNMENT: definePolicy(
    'RECOVERY_OUTCOME_ACTION_NO_LIVE_ASSIGNMENT',
    'Blocks live assignment creation',
    { allowedRoles: [] }
  ),
  RECOVERY_OUTCOME_ACTION_NO_LIVE_NOTIFICATION: definePolicy(
    'RECOVERY_OUTCOME_ACTION_NO_LIVE_NOTIFICATION',
    'Blocks live notification sending',
    { allowedRoles: [] }
  ),
  RECOVERY_OUTCOME_ACTION_NO_PORTAL_PUBLISH: definePolicy(
    'RECOVERY_OUTCOME_ACTION_NO_PORTAL_PUBLISH',
    'Blocks portal publishing',
    { allowedRoles: [] }
  ),
  RECOVERY_OUTCOME_ACTION_NO_SCORE_MUTATION: definePolicy(
    'RECOVERY_OUTCOME_ACTION_NO_SCORE_MUTATION',
    'Blocks score mutation',
    { allowedRoles: [] }
  ),
  RECOVERY_OUTCOME_ACTION_NO_MASTERY_MUTATION: definePolicy(
    'RECOVERY_OUTCOME_ACTION_NO_MASTERY_MUTATION',
    'Blocks mastery mutation',
    { allowedRoles: [] }
  ),
  RECOVERY_OUTCOME_ACTION_NO_REGRADE_EXECUTION: definePolicy(
    'RECOVERY_OUTCOME_ACTION_NO_REGRADE_EXECUTION',
    'Blocks regrade execution',
    { allowedRoles: [] }
  ),
  RECOVERY_OUTCOME_ACTION_NO_GENERATED_QUESTION: definePolicy(
    'RECOVERY_OUTCOME_ACTION_NO_GENERATED_QUESTION',
    'Blocks generated question creation',
    { allowedRoles: [] }
  ),
  RECOVERY_OUTCOME_ACTION_NO_AI_NARRATIVE: definePolicy(
    'RECOVERY_OUTCOME_ACTION_NO_AI_NARRATIVE',
    'Blocks AI narrative generation',
    { allowedRoles: [] }
  ),
  RECOVERY_OUTCOME_ACTION_NO_OCR: definePolicy(
    'RECOVERY_OUTCOME_ACTION_NO_OCR',
    'Blocks OCR processing',
    { allowedRoles: [] }
  ),
  RECOVERY_OUTCOME_ACTION_NO_PDF: definePolicy(
    'RECOVERY_OUTCOME_ACTION_NO_PDF',
    'Blocks PDF generation',
    { allowedRoles: [] }
  ),
  RECOVERY_OUTCOME_ACTION_NO_EXTERNAL_SYNC: definePolicy(
    'RECOVERY_OUTCOME_ACTION_NO_EXTERNAL_SYNC',
    'Blocks external sync operations',
    { allowedRoles: [] }
  ),
};

export class RecoveryOutcomeActionPolicyEnforcer {
  private policies: Record<PolicyFamilyName, PolicyDefinition>;

  constructor(policies?: Record<PolicyFamilyName, PolicyDefinition>) {
    this.policies = policies ?? RECOVERY_OUTCOME_ACTION_POLICIES;
  }

  enforce(role: string, policyName: PolicyFamilyName): { allowed: boolean; denied: boolean; reasonCodes: string[] } {
    const policy = this.policies[policyName];
    if (!policy) {
      return { allowed: false, denied: true, reasonCodes: ['POLICY_NOT_FOUND'] };
    }

    if (policy.blockedRoles.includes(role)) {
      return { allowed: false, denied: true, reasonCodes: [`ROLE_BLOCKED:${role}`] };
    }

    if (policy.allowedRoles.includes(role)) {
      return { allowed: true, denied: false, reasonCodes: [] };
    }

    if (policy.failClosed) {
      return { allowed: false, denied: true, reasonCodes: [`ROLE_NOT_ALLOWED:${role}`] };
    }

    return { allowed: false, denied: true, reasonCodes: [`ROLE_NOT_AUTHORIZED:${role}`] };
  }
}
