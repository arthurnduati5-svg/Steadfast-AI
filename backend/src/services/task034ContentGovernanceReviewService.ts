import type { Task034ContentGovernanceReviewResult } from '../contracts/task034ControlledLimitedRolloutContracts';

export function reviewTask034ContentGovernance(overrides?: Partial<Task034ContentGovernanceReviewResult>): Task034ContentGovernanceReviewResult {
  const defaults: Task034ContentGovernanceReviewResult = {
    ok: true,
    approvedCurriculumSourceRequired: true,
    noInventedTeachingClaim: true,
    noAnswerKeyLeakage: true,
    noMarkingSchemeLeakage: true,
    noTeacherOnlyLeakage: true,
    blockingIssues: [],
  };

  const resolved = { ...defaults, ...overrides };
  const blockingIssues: string[] = [];

  if (!resolved.approvedCurriculumSourceRequired) blockingIssues.push('approved_curriculum_source_not_required');
  if (!resolved.noInventedTeachingClaim) blockingIssues.push('invented_teaching_claim_detected');
  if (!resolved.noAnswerKeyLeakage) blockingIssues.push('answer_key_leakage_detected');
  if (!resolved.noMarkingSchemeLeakage) blockingIssues.push('marking_scheme_leakage_detected');
  if (!resolved.noTeacherOnlyLeakage) blockingIssues.push('teacher_only_leakage_detected');

  return {
    ...resolved,
    ok: blockingIssues.length === 0,
    blockingIssues,
  };
}
