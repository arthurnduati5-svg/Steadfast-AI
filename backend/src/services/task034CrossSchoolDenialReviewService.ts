import type { Task034CrossSchoolDenialReviewResult } from '../contracts/task034ControlledLimitedRolloutContracts';

export function reviewTask034CrossSchoolDenial(overrides?: Partial<Task034CrossSchoolDenialReviewResult>): Task034CrossSchoolDenialReviewResult {
  const defaults: Task034CrossSchoolDenialReviewResult = {
    ok: true,
    crossSchoolAttemptsBlocked: true,
    schoolAContextNotVisibleToSchoolB: true,
    noInterSchoolLearnerVisibility: true,
    noInterSchoolTeacherDataLeakage: true,
    safeAuditOfCrossSchoolAttempts: true,
    blockingIssues: [],
  };

  const resolved = { ...defaults, ...overrides };
  const blockingIssues: string[] = [];

  if (!resolved.crossSchoolAttemptsBlocked) blockingIssues.push('cross_school_attempts_not_blocked');
  if (!resolved.schoolAContextNotVisibleToSchoolB) blockingIssues.push('school_a_context_visible_to_school_b');
  if (!resolved.noInterSchoolLearnerVisibility) blockingIssues.push('inter_school_learner_visibility_detected');
  if (!resolved.noInterSchoolTeacherDataLeakage) blockingIssues.push('inter_school_teacher_data_leakage_detected');
  if (!resolved.safeAuditOfCrossSchoolAttempts) blockingIssues.push('safe_audit_of_cross_school_attempts_not_present');

  return {
    ...resolved,
    ok: blockingIssues.length === 0,
    blockingIssues,
  };
}
