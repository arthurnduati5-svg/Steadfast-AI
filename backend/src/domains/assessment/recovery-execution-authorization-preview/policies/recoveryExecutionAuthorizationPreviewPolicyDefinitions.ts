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

export const RECOVERY_EXECUTION_AUTHORIZATION_PREVIEW_POLICIES: Record<PolicyFamilyName, PolicyDefinition> = {
  RECOVERY_EXECUTION_AUTHORIZATION_READINESS_CREATION: definePolicy(
    'RECOVERY_EXECUTION_AUTHORIZATION_READINESS_CREATION',
    'Controls creation of authorization readiness records',
  ),
  RECOVERY_EXECUTION_AUTHORIZATION_REQUEST_DRAFT_CREATION: definePolicy(
    'RECOVERY_EXECUTION_AUTHORIZATION_REQUEST_DRAFT_CREATION',
    'Controls creation of authorization request draft records',
  ),
  RECOVERY_EXECUTION_AUTHORIZATION_ELIGIBILITY_CHECK_CREATION: definePolicy(
    'RECOVERY_EXECUTION_AUTHORIZATION_ELIGIBILITY_CHECK_CREATION',
    'Controls creation of authorization eligibility check records',
  ),
  RECOVERY_EXECUTION_AUTHORITY_MATRIX_SNAPSHOT_CREATION: definePolicy(
    'RECOVERY_EXECUTION_AUTHORITY_MATRIX_SNAPSHOT_CREATION',
    'Controls creation of authority matrix snapshot records',
  ),
  RECOVERY_EXECUTION_APPROVAL_CHAIN_DRAFT_CREATION: definePolicy(
    'RECOVERY_EXECUTION_APPROVAL_CHAIN_DRAFT_CREATION',
    'Controls creation of approval chain draft records',
  ),
  RECOVERY_EXECUTION_RISK_ATTESTATION_CREATION: definePolicy(
    'RECOVERY_EXECUTION_RISK_ATTESTATION_CREATION',
    'Controls creation of risk attestation records',
  ),
  RECOVERY_EXECUTION_CONSENT_BOUNDARY_CHECK_CREATION: definePolicy(
    'RECOVERY_EXECUTION_CONSENT_BOUNDARY_CHECK_CREATION',
    'Controls creation of consent boundary check records',
  ),
  RECOVERY_EXECUTION_VETO_CREATION: definePolicy(
    'RECOVERY_EXECUTION_VETO_CREATION',
    'Controls creation of execution veto records',
  ),
  RECOVERY_EXECUTION_PREFLIGHT_CHECKLIST_CREATION: definePolicy(
    'RECOVERY_EXECUTION_PREFLIGHT_CHECKLIST_CREATION',
    'Controls creation of preflight checklist records',
  ),
  RECOVERY_EXECUTION_AUTHORIZATION_DRY_RUN_CREATION: definePolicy(
    'RECOVERY_EXECUTION_AUTHORIZATION_DRY_RUN_CREATION',
    'Controls creation of authorization dry run records',
  ),
  RECOVERY_EXECUTION_PRE_LIVE_DECISION_PACKET_CREATION: definePolicy(
    'RECOVERY_EXECUTION_PRE_LIVE_DECISION_PACKET_CREATION',
    'Controls creation of pre-live decision packet records',
  ),
  RECOVERY_EXECUTION_MOCK_AUTHORIZATION_RECEIPT_CREATION: definePolicy(
    'RECOVERY_EXECUTION_MOCK_AUTHORIZATION_RECEIPT_CREATION',
    'Controls creation of mock authorization receipt records',
  ),
  RECOVERY_EXECUTION_AUTHORIZATION_SUMMARY_MUTATION: definePolicy(
    'RECOVERY_EXECUTION_AUTHORIZATION_SUMMARY_MUTATION',
    'Controls mutation of authorization summary records',
  ),
  RECOVERY_EXECUTION_NO_LIVE_AUTHORIZATION: definePolicy(
    'RECOVERY_EXECUTION_NO_LIVE_AUTHORIZATION',
    'Blocks live authorization operations',
    { allowedRoles: [] },
  ),
  RECOVERY_EXECUTION_NO_LIVE_EXECUTION: definePolicy(
    'RECOVERY_EXECUTION_NO_LIVE_EXECUTION',
    'Blocks live execution operations',
    { allowedRoles: [] },
  ),
  RECOVERY_EXECUTION_NO_LIVE_CLOSURE: definePolicy(
    'RECOVERY_EXECUTION_NO_LIVE_CLOSURE',
    'Blocks live closure operations',
    { allowedRoles: [] },
  ),
  RECOVERY_EXECUTION_NO_LIVE_ACTIVATION: definePolicy(
    'RECOVERY_EXECUTION_NO_LIVE_ACTIVATION',
    'Blocks live activation operations',
    { allowedRoles: [] },
  ),
  RECOVERY_EXECUTION_NO_SCORE_MUTATION: definePolicy(
    'RECOVERY_EXECUTION_NO_SCORE_MUTATION',
    'Blocks score mutation',
    { allowedRoles: [] },
  ),
  RECOVERY_EXECUTION_NO_MASTERY_MUTATION: definePolicy(
    'RECOVERY_EXECUTION_NO_MASTERY_MUTATION',
    'Blocks mastery mutation',
    { allowedRoles: [] },
  ),
};

export class RecoveryExecutionAuthorizationPreviewPolicyDefinitions {
  static check(
    policyFamily: string,
    actorRole: string,
    _context?: Record<string, unknown>,
  ): { allowed: boolean; denied: boolean; reasonCodes: string[]; actorRole: string; action: string } {
    const policy = RECOVERY_EXECUTION_AUTHORIZATION_PREVIEW_POLICIES[policyFamily];
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
