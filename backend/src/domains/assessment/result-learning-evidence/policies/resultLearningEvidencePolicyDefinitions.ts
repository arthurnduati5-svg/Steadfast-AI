export type ResultLearningEvidencePolicyFamily =
  | 'RESULT_LEARNING_EVIDENCE_INTAKE'
  | 'RESULT_OBJECTIVE_IMPACT_MAPPING'
  | 'RESULT_MASTERY_MUTATION_PLANNING'
  | 'RESULT_MASTERY_MUTATION_APPROVAL'
  | 'RESULT_MASTERY_MUTATION_APPLICATION'
  | 'RESULT_REVISION_SIGNAL_DISPATCH'
  | 'RESULT_GROWTH_SIGNAL_DISPATCH'
  | 'RESULT_LEARNING_EVIDENCE_PROJECTION'
  | 'RESULT_LEARNING_EVIDENCE_AUDIT';

export const RESULT_LEARNING_EVIDENCE_POLICY_FAMILIES: readonly ResultLearningEvidencePolicyFamily[] = [
  'RESULT_LEARNING_EVIDENCE_INTAKE',
  'RESULT_OBJECTIVE_IMPACT_MAPPING',
  'RESULT_MASTERY_MUTATION_PLANNING',
  'RESULT_MASTERY_MUTATION_APPROVAL',
  'RESULT_MASTERY_MUTATION_APPLICATION',
  'RESULT_REVISION_SIGNAL_DISPATCH',
  'RESULT_GROWTH_SIGNAL_DISPATCH',
  'RESULT_LEARNING_EVIDENCE_PROJECTION',
  'RESULT_LEARNING_EVIDENCE_AUDIT',
] as const;

export interface ResultLearningEvidencePolicyDefinition {
  family: ResultLearningEvidencePolicyFamily;
  status: 'CONFIGURED' | 'MISSING' | 'DISABLED' | 'BLOCKED';
  allowed: boolean;
  reasonCode: string;
  safeMessage: string;
  allowedRoles: string[];
  blockedRoles: string[];
}

export const ALLOWED_MUTATION_ROLES = ['teacher', 'lead_teacher', 'department_head', 'admin', 'system_job'] as const;
export const BLOCKED_MUTATION_ROLES = ['student', 'parent', 'guest', 'unknown'] as const;

export function isAllowedMutationRole(role: string): boolean {
  return (ALLOWED_MUTATION_ROLES as readonly string[]).includes(role);
}

export function isBlockedMutationRole(role: string): boolean {
  return (BLOCKED_MUTATION_ROLES as readonly string[]).includes(role);
}

export function createDefaultLearningEvidencePolicy(): Record<ResultLearningEvidencePolicyFamily, ResultLearningEvidencePolicyDefinition> {
  const families: ResultLearningEvidencePolicyFamily[] = [...RESULT_LEARNING_EVIDENCE_POLICY_FAMILIES];
  const result: Record<string, ResultLearningEvidencePolicyDefinition> = {};
  for (const family of families) {
    const allowedRoles = [...ALLOWED_MUTATION_ROLES] as string[];
    const blockedRoles = [...BLOCKED_MUTATION_ROLES] as string[];
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
  return result as Record<ResultLearningEvidencePolicyFamily, ResultLearningEvidencePolicyDefinition>;
}

export class ResultLearningEvidencePolicyRegistry {
  private policies: Record<string, ResultLearningEvidencePolicyDefinition>;

  constructor(policies?: Record<string, ResultLearningEvidencePolicyDefinition>) {
    this.policies = policies || createDefaultLearningEvidencePolicy();
  }

  getPolicy(family: ResultLearningEvidencePolicyFamily): ResultLearningEvidencePolicyDefinition {
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

  checkPolicy(family: ResultLearningEvidencePolicyFamily, role: string): { allowed: boolean; reasonCode: string; safeMessage: string } {
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
