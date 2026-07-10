import type { Task034SchoolIdentityReviewResult } from '../contracts/task034ControlledLimitedRolloutContracts';

export function reviewTask034SchoolIdentity(overrides?: Partial<Task034SchoolIdentityReviewResult>): Task034SchoolIdentityReviewResult {
  const defaults: Task034SchoolIdentityReviewResult = {
    ok: true,
    verifiedSchoolIdentityRequired: true,
    unknownSchoolDenied: true,
    crossSchoolAccessDenied: true,
    actorRoleRequired: true,
    noSessionBeforeSchoolContext: true,
    noMemoryAccessBeforeSchoolContext: true,
    noEvidenceBeforeSchoolContext: true,
    noAiCallBeforeSchoolContext: true,
    blockingIssues: [],
  };

  const resolved = { ...defaults, ...overrides };
  const blockingIssues: string[] = [];

  if (!resolved.verifiedSchoolIdentityRequired) blockingIssues.push('verified_school_identity_not_required');
  if (!resolved.unknownSchoolDenied) blockingIssues.push('unknown_school_not_denied');
  if (!resolved.crossSchoolAccessDenied) blockingIssues.push('cross_school_access_not_denied');
  if (!resolved.actorRoleRequired) blockingIssues.push('actor_role_not_required');
  if (!resolved.noSessionBeforeSchoolContext) blockingIssues.push('session_allowed_before_school_context');
  if (!resolved.noMemoryAccessBeforeSchoolContext) blockingIssues.push('memory_access_allowed_before_school_context');
  if (!resolved.noEvidenceBeforeSchoolContext) blockingIssues.push('evidence_allowed_before_school_context');
  if (!resolved.noAiCallBeforeSchoolContext) blockingIssues.push('ai_call_allowed_before_school_context');

  return {
    ...resolved,
    ok: blockingIssues.length === 0,
    blockingIssues,
  };
}
