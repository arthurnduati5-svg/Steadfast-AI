export type ResultGovernancePolicyFamily =
  | 'RESULT_FINALIZATION_REVIEW'
  | 'RESULT_FINALIZATION_DECISION'
  | 'RESULT_RELEASE_READINESS'
  | 'RESULT_RELEASE_BOUNDARY'
  | 'RESULT_REGRADE_REQUEST'
  | 'RESULT_REGRADE_INTAKE'
  | 'RESULT_GOVERNANCE_PROJECTION'
  | 'RESULT_GOVERNANCE_AUDIT';

export interface ResultGovernancePolicyDefinition {
  family: ResultGovernancePolicyFamily;
  status: 'CONFIGURED' | 'MISSING' | 'DISABLED' | 'BLOCKED';
  allowed: boolean;
  reasonCode: string;
  safeMessage: string;
  allowedRoles: string[];
  blockedRoles: string[];
}

export const RESULT_GOVERNANCE_POLICY_FAMILIES: readonly ResultGovernancePolicyFamily[] = [
  'RESULT_FINALIZATION_REVIEW',
  'RESULT_FINALIZATION_DECISION',
  'RESULT_RELEASE_READINESS',
  'RESULT_RELEASE_BOUNDARY',
  'RESULT_REGRADE_REQUEST',
  'RESULT_REGRADE_INTAKE',
  'RESULT_GOVERNANCE_PROJECTION',
  'RESULT_GOVERNANCE_AUDIT',
] as const;

export const ALLOWED_MUTATION_ROLES = ['teacher', 'lead_teacher', 'department_head', 'admin', 'system_job'] as const;
export const BLOCKED_MUTATION_ROLES = ['student', 'parent', 'guest', 'unknown'] as const;

export function isAllowedMutationRole(role: string): boolean {
  return (ALLOWED_MUTATION_ROLES as readonly string[]).includes(role);
}

export function isBlockedMutationRole(role: string): boolean {
  return (BLOCKED_MUTATION_ROLES as readonly string[]).includes(role);
}

export function createDefaultPolicy(): Record<ResultGovernancePolicyFamily, ResultGovernancePolicyDefinition> {
  const families: ResultGovernancePolicyFamily[] = [...RESULT_GOVERNANCE_POLICY_FAMILIES];
  const result: Record<string, ResultGovernancePolicyDefinition> = {};
  for (const family of families) {
    const allowedRoles = [...ALLOWED_MUTATION_ROLES] as string[];
    const blockedRoles = [...BLOCKED_MUTATION_ROLES] as string[];
    if (family === 'RESULT_REGRADE_REQUEST') {
      allowedRoles.push('student');
      blockedRoles.splice(blockedRoles.indexOf('student'), 1);
    }
    result[family] = {
      family,
      status: 'CONFIGURED',
      allowed: true,
      reasonCode: `${family}_CONFIGURED`,
      safeMessage: `${family} policy is configured and allowed`,
      allowedRoles,
      blockedRoles,
    };
  }
  return result as Record<ResultGovernancePolicyFamily, ResultGovernancePolicyDefinition>;
}

export class ResultGovernancePolicyRegistry {
  private policies: Record<string, ResultGovernancePolicyDefinition>;

  constructor(policies?: Record<string, ResultGovernancePolicyDefinition>) {
    this.policies = policies || createDefaultPolicy();
  }

  getPolicy(family: ResultGovernancePolicyFamily): ResultGovernancePolicyDefinition {
    return this.policies[family] || {
      family,
      status: 'MISSING',
      allowed: false,
      reasonCode: `${family}_MISSING`,
      safeMessage: `${family} policy is missing - operation blocked`,
      allowedRoles: [],
      blockedRoles: [],
    };
  }

  checkPolicy(family: ResultGovernancePolicyFamily, role: string): { allowed: boolean; reasonCode: string; safeMessage: string } {
    const policy = this.getPolicy(family);
    if (!policy.allowed || policy.status === 'BLOCKED' || policy.status === 'DISABLED') {
      return { allowed: false, reasonCode: `${family}_BLOCKED`, safeMessage: `${family} policy is ${policy.status}` };
    }
    if (policy.blockedRoles.includes(role)) {
      return { allowed: false, reasonCode: `${family}_ROLE_BLOCKED`, safeMessage: `Role ${role} is blocked for ${family}` };
    }
    if (!policy.allowedRoles.includes(role)) {
      return { allowed: false, reasonCode: `${family}_ROLE_NOT_ALLOWED`, safeMessage: `Role ${role} is not allowed for ${family}` };
    }
    return { allowed: true, reasonCode: `${family}_ALLOWED`, safeMessage: `${family} is allowed for role ${role}` };
  }

  isSchoolContextVerified(schoolId: string): boolean {
    return !!schoolId && schoolId.length > 0;
  }

  isStudentOwnRequest(studentRef: string, actorId: string, role: string): boolean {
    if (role !== 'student') return false;
    return studentRef === actorId;
  }
}
