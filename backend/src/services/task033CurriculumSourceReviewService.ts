import type { Task033CurriculumSourceReview } from '../contracts/task033CanaryObservationContracts';

export interface CurriculumSourceSignals {
  curriculumGatePassed: boolean;
  approvedCurriculumScopeRequired: boolean;
  approvedSourceScopeRequired: boolean;
  unapprovedSubjectBlocked: boolean;
  teacherOnlyContentExposed: boolean;
  answerKeyExposureDetected: boolean;
  contentGapHandledSafely: boolean;
}

export function reviewTask033CurriculumSource(signals: CurriculumSourceSignals): Task033CurriculumSourceReview {
  const blockingIssues: string[] = [];

  if (!signals.curriculumGatePassed) blockingIssues.push('curriculum_gate_not_passed');
  if (!signals.approvedCurriculumScopeRequired) blockingIssues.push('approved_curriculum_scope_not_required');
  if (!signals.approvedSourceScopeRequired) blockingIssues.push('approved_source_scope_not_required');
  if (!signals.unapprovedSubjectBlocked) blockingIssues.push('unapproved_subject_not_blocked');
  if (signals.teacherOnlyContentExposed) blockingIssues.push('teacher_only_content_exposed');
  if (signals.answerKeyExposureDetected) blockingIssues.push('answer_key_exposure_detected');
  if (!signals.contentGapHandledSafely) blockingIssues.push('content_gap_not_handled_safely');

  return {
    curriculumGatePassed: signals.curriculumGatePassed,
    approvedCurriculumScopeRequired: signals.approvedCurriculumScopeRequired,
    approvedSourceScopeRequired: signals.approvedSourceScopeRequired,
    unapprovedSubjectBlocked: signals.unapprovedSubjectBlocked,
    teacherOnlyContentExposed: signals.teacherOnlyContentExposed,
    answerKeyExposureDetected: signals.answerKeyExposureDetected,
    contentGapHandledSafely: signals.contentGapHandledSafely,
    blockingIssues,
  };
}
