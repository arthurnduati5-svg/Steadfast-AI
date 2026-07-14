export interface ResultLearningEvidenceCommandContext {
  schoolId: string;
  actorId: string;
  actorRole: string;
  correlationId: string;
  requestId: string;
}

export interface ResultLearningEvidencePolicyDecision {
  allowed: boolean;
  family: string;
  reasonCode: string;
  safeMessage: string;
  allowedRoles: string[];
  blockedRoles: string[];
}

export interface ResultLearningEvidenceSafeEnvelope {
  ok: boolean;
  requestId: string;
  correlationId?: string;
  resourceId?: string;
  resourceVersion?: string;
  status?: string;
  safeMessage?: string;
  reasonCode?: string;
  policyDecision?: string;
  nextAllowedActions?: string[];
  data?: unknown;
}

export type ResultLearningEvidenceBridgeStatus =
  | 'draft'
  | 'source_check_pending'
  | 'ready_for_mapping'
  | 'mapped'
  | 'blocked'
  | 'completed'
  | 'cancelled';

export type ResultMasteryMutationPlanStatus =
  | 'draft'
  | 'ready_for_approval'
  | 'approved'
  | 'blocked'
  | 'applied'
  | 'cancelled';

export type ResultMasteryMutationEventStatus =
  | 'planned'
  | 'applied'
  | 'blocked'
  | 'void';

export type ResultObjectiveMasteryImpactStatus =
  | 'draft'
  | 'mapped'
  | 'approved'
  | 'applied'
  | 'blocked'
  | 'void';

export type ResultRevisionSignalStatus =
  | 'draft'
  | 'ready'
  | 'dispatched'
  | 'blocked'
  | 'void';

export type ResultGrowthSignalStatus =
  | 'draft'
  | 'ready'
  | 'dispatched'
  | 'blocked'
  | 'void';

export const ALLOWED_MUTATION_ROLES = ['teacher', 'lead_teacher', 'department_head', 'admin', 'system_job'] as const;
export const BLOCKED_MUTATION_ROLES = ['student', 'parent', 'guest', 'unknown'] as const;

export function isAllowedMutationRole(role: string): boolean {
  return (ALLOWED_MUTATION_ROLES as readonly string[]).includes(role);
}

export function isBlockedMutationRole(role: string): boolean {
  return (BLOCKED_MUTATION_ROLES as readonly string[]).includes(role);
}
