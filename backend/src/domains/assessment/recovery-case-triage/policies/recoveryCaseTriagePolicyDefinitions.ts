export interface PolicyDefinition {
  allowedRoles: readonly string[];
  blockedRoles: readonly string[];
  failClosed: boolean;
  description: string;
}

export interface PolicyCheckResult {
  allowed: boolean;
  denied: boolean;
  reasonCodes: string[];
}

const ALLOWED_ROLES = ['teacher', 'lead_teacher', 'department_head', 'admin', 'system_job'] as const;
const BLOCKED_ROLES = ['student', 'parent', 'guest', 'unknown'] as const;

function definePolicy(description: string, overrides?: Partial<PolicyDefinition>): PolicyDefinition {
  return {
    allowedRoles: ALLOWED_ROLES,
    blockedRoles: BLOCKED_ROLES,
    failClosed: true,
    description,
    ...overrides,
  };
}

export const POLICY_REGISTRY: Record<string, PolicyDefinition> = {
  RECOVERY_CASE_TRIAGE_READINESS_CREATION: definePolicy(
    'Controls creation of recovery case triage readiness records',
  ),
  RECOVERY_CASE_PRIORITY_ASSESSMENT_CREATION: definePolicy(
    'Controls creation of recovery case priority assessment records',
  ),
  RECOVERY_CASE_PRIORITY_FACTOR_CREATION: definePolicy(
    'Controls creation of recovery case priority factor records',
  ),
  RECOVERY_CASE_FAIRNESS_CHECK_CREATION: definePolicy(
    'Controls creation of recovery case fairness check records',
  ),
  RECOVERY_CASE_CAPACITY_SNAPSHOT_CREATION: definePolicy(
    'Controls creation of recovery case capacity snapshot records',
  ),
  RECOVERY_CASE_QUEUE_SNAPSHOT_CREATION: definePolicy(
    'Controls creation of recovery case queue snapshot records',
  ),
  RECOVERY_CASE_QUEUE_ITEM_CREATION: definePolicy(
    'Controls creation of recovery case queue item records',
  ),
  RECOVERY_CASE_ALLOCATION_DRAFT_CREATION: definePolicy(
    'Controls creation of recovery case allocation draft records',
  ),
  RECOVERY_CASE_ESCALATION_DRAFT_CREATION: definePolicy(
    'Controls creation of recovery case escalation draft records',
  ),
  RECOVERY_CASE_REVIEW_WINDOW_DRAFT_CREATION: definePolicy(
    'Controls creation of recovery case review window draft records',
  ),
  RECOVERY_CASE_QUEUE_EXPLANATION_CREATION: definePolicy(
    'Controls creation of recovery case queue explanation records',
  ),
  RECOVERY_CASE_DUPLICATE_SUPPRESSION_CREATION: definePolicy(
    'Controls creation of recovery case duplicate suppression records',
  ),
  RECOVERY_CASE_TRIAGE_SUMMARY_MUTATION: definePolicy(
    'Controls mutation of recovery case triage summary records',
  ),
  RECOVERY_CASE_TRIAGE_AUDIT: definePolicy(
    'Controls creation of recovery case triage audit events',
  ),

  RECOVERY_CASE_TRIAGE_NO_LIVE_ASSIGNMENT: definePolicy(
    'Blocks live assignment from recovery case triage',
    { allowedRoles: [], blockedRoles: [...ALLOWED_ROLES, ...BLOCKED_ROLES] },
  ),
  RECOVERY_CASE_TRIAGE_NO_ESCALATION_DISPATCH: definePolicy(
    'Blocks escalation dispatch from recovery case triage',
    { allowedRoles: [], blockedRoles: [...ALLOWED_ROLES, ...BLOCKED_ROLES] },
  ),
  RECOVERY_CASE_TRIAGE_NO_NOTIFICATION: definePolicy(
    'Blocks notification dispatch from recovery case triage',
    { allowedRoles: [], blockedRoles: [...ALLOWED_ROLES, ...BLOCKED_ROLES] },
  ),
  RECOVERY_CASE_TRIAGE_NO_CALENDAR_EVENT: definePolicy(
    'Blocks calendar event creation from recovery case triage',
    { allowedRoles: [], blockedRoles: [...ALLOWED_ROLES, ...BLOCKED_ROLES] },
  ),
  RECOVERY_CASE_TRIAGE_NO_PORTAL_PUBLISH: definePolicy(
    'Blocks portal publishing from recovery case triage',
    { allowedRoles: [], blockedRoles: [...ALLOWED_ROLES, ...BLOCKED_ROLES] },
  ),
  RECOVERY_CASE_TRIAGE_NO_EXTERNAL_SYNC: definePolicy(
    'Blocks external sync from recovery case triage',
    { allowedRoles: [], blockedRoles: [...ALLOWED_ROLES, ...BLOCKED_ROLES] },
  ),
  RECOVERY_CASE_TRIAGE_NO_LIVE_EXECUTION: definePolicy(
    'Blocks live recovery execution from recovery case triage',
    { allowedRoles: [], blockedRoles: [...ALLOWED_ROLES, ...BLOCKED_ROLES] },
  ),
  RECOVERY_CASE_TRIAGE_NO_LIVE_AUTHORIZATION: definePolicy(
    'Blocks live authorization from recovery case triage',
    { allowedRoles: [], blockedRoles: [...ALLOWED_ROLES, ...BLOCKED_ROLES] },
  ),
  RECOVERY_CASE_TRIAGE_NO_LIVE_CLOSURE: definePolicy(
    'Blocks live recovery closure from recovery case triage',
    { allowedRoles: [], blockedRoles: [...ALLOWED_ROLES, ...BLOCKED_ROLES] },
  ),
  RECOVERY_CASE_TRIAGE_NO_SCORE_MUTATION: definePolicy(
    'Blocks score mutation from recovery case triage',
    { allowedRoles: [], blockedRoles: [...ALLOWED_ROLES, ...BLOCKED_ROLES] },
  ),
  RECOVERY_CASE_TRIAGE_NO_MASTERY_MUTATION: definePolicy(
    'Blocks mastery mutation from recovery case triage',
    { allowedRoles: [], blockedRoles: [...ALLOWED_ROLES, ...BLOCKED_ROLES] },
  ),
  RECOVERY_CASE_TRIAGE_NO_REGRADE_EXECUTION: definePolicy(
    'Blocks regrade execution from recovery case triage',
    { allowedRoles: [], blockedRoles: [...ALLOWED_ROLES, ...BLOCKED_ROLES] },
  ),
  RECOVERY_CASE_TRIAGE_NO_AI_SCORING: definePolicy(
    'Blocks AI scoring from recovery case triage',
    { allowedRoles: [], blockedRoles: [...ALLOWED_ROLES, ...BLOCKED_ROLES] },
  ),
  RECOVERY_CASE_TRIAGE_NO_GENERATED_QUESTION: definePolicy(
    'Blocks generated question creation from recovery case triage',
    { allowedRoles: [], blockedRoles: [...ALLOWED_ROLES, ...BLOCKED_ROLES] },
  ),
  RECOVERY_CASE_TRIAGE_NO_OCR: definePolicy(
    'Blocks OCR operations from recovery case triage',
    { allowedRoles: [], blockedRoles: [...ALLOWED_ROLES, ...BLOCKED_ROLES] },
  ),
  RECOVERY_CASE_TRIAGE_NO_PDF: definePolicy(
    'Blocks PDF generation from recovery case triage',
    { allowedRoles: [], blockedRoles: [...ALLOWED_ROLES, ...BLOCKED_ROLES] },
  ),
  RECOVERY_CASE_TRIAGE_NO_SENSITIVE_FACTOR_RANKING: definePolicy(
    'Blocks sensitive factor ranking from recovery case triage',
    { allowedRoles: [], blockedRoles: [...ALLOWED_ROLES, ...BLOCKED_ROLES] },
  ),
};

export const RECOVERY_CASE_TRIAGE_POLICIES = POLICY_REGISTRY;

export function checkPolicy(policyFamily: string, actorRole: string): PolicyCheckResult {
  const policy = POLICY_REGISTRY[policyFamily];
  if (!policy) {
    return { allowed: false, denied: true, reasonCodes: ['POLICY_NOT_FOUND'] };
  }
  if (policy.blockedRoles.includes(actorRole as any)) {
    return { allowed: false, denied: true, reasonCodes: ['ROLE_BLOCKED'] };
  }
  if (policy.allowedRoles.includes(actorRole as any)) {
    return { allowed: true, denied: false, reasonCodes: [] };
  }
  if (policy.failClosed) {
    return { allowed: false, denied: true, reasonCodes: ['ROLE_NOT_ALLOWED'] };
  }
  return { allowed: false, denied: true, reasonCodes: ['ROLE_NOT_AUTHORIZED'] };
}
