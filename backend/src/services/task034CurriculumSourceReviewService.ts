import type { Task034CurriculumSourceReview } from '../contracts/task034ControlledRolloutContracts';

export function reviewCurriculumSource(
  overrides?: Partial<Task034CurriculumSourceReview>,
): Task034CurriculumSourceReview {
  const blockingIssues: string[] = [];

  const result: Task034CurriculumSourceReview = {
    curriculumGatePassed: true,
    approvedCurriculumScopeRequired: true,
    approvedSourceScopeRequired: true,
    unapprovedSubjectBlocked: true,
    teacherOnlyContentExposed: false,
    answerKeyExposureDetected: false,
    contentGapHandledSafely: true,
    blockingIssues: [],
  };

  const final = { ...result, ...overrides };

  if (!final.curriculumGatePassed) blockingIssues.push('CURRICULUM_GATE_FAILED');
  if (!final.approvedCurriculumScopeRequired) blockingIssues.push('APPROVED_CURRICULUM_SCOPE_NOT_REQUIRED');
  if (!final.approvedSourceScopeRequired) blockingIssues.push('APPROVED_SOURCE_SCOPE_NOT_REQUIRED');
  if (!final.unapprovedSubjectBlocked) blockingIssues.push('UNAPPROVED_SUBJECT_NOT_BLOCKED');
  if (final.teacherOnlyContentExposed) blockingIssues.push('TEACHER_ONLY_CONTENT_EXPOSED');
  if (final.answerKeyExposureDetected) blockingIssues.push('ANSWER_KEY_EXPOSURE_DETECTED');
  if (!final.contentGapHandledSafely) blockingIssues.push('CONTENT_GAP_NOT_HANDLED_SAFELY');

  return {
    ...final,
    blockingIssues,
  };
}
