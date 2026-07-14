export type MarkingRunStatus = 'draft' | 'running' | 'completed' | 'partial' | 'blocked' | 'failed' | 'cancelled';
export type MarkingResultStatus = 'draft' | 'provisional' | 'review_required' | 'teacher_confirmed' | 'teacher_overridden' | 'moderated' | 'challenged' | 'blocked' | 'superseded';
export type MarkingMethod = 'deterministic_exact' | 'deterministic_numeric' | 'deterministic_choice' | 'deterministic_matching' | 'rubric_assisted' | 'teacher_required' | 'mock_ai_suggestion_only' | 'unsupported';
export type SourceType = 'mock_snapshot' | 'exam_mode_attempt_snapshot' | 'practice_attempt_snapshot' | 'teacher_uploaded_snapshot' | 'system_seed';
export type ReviewReasonCode = 'low_confidence' | 'missing_answer_key' | 'missing_rubric' | 'unsupported_question_type' | 'numeric_ambiguous' | 'rubric_ambiguous' | 'essay_default_review' | 'structured_working_default' | 'oral_default_review' | 'multi_part_default_review' | 'policy_blocked' | 'policy_missing' | 'teacher_flagged' | 'challenge_raised' | 'moderation_required' | 'dependency_deferred';

export interface MarkingRun {
  markingRunId: string;
  schoolId: string;
  status: MarkingRunStatus;
  sourceType: string;
  sourceRef: string;
  blueprintId?: string;
  blueprintVersionId?: string;
  draftId?: string;
  createdByActorId: string;
  createdByRole: string;
  policyVersionRefsJson?: Record<string, string>;
  inputSnapshotCount: number;
  markedCount: number;
  reviewRequiredCount: number;
  blockedCount: number;
  safeSummary: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface MarkingResultVersion {
  markingResultVersionId: string;
  schoolId: string;
  markingRunId: string;
  questionId: string;
  questionVersionId: string;
  answerSnapshotRef: string;
  resultVersionNumber: number;
  status: MarkingResultStatus;
  questionType: string;
  markingMethod: string;
  marksAwarded: number;
  marksAvailable: number;
  confidence: number;
  requiresTeacherReview: boolean;
  reviewReasonCode: string;
  safeStudentFeedback: string;
  safeTeacherSummary: string;
  rubricVersionId?: string;
  answerKeyVersionId?: string;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  supersededAt?: string;
}

export interface SubmittedAnswerSnapshot {
  answerSnapshotRef: string;
  schoolId: string;
  studentId: string;
  questionId: string;
  questionVersionId: string;
  questionType: string;
  submittedAnswerSafeText: string;
  submittedOptionKey?: string;
  submittedNumericValue?: number;
  submittedJson?: Record<string, unknown>;
  submittedAt: string;
  sourceType: string;
  sourceRef: string;
}
