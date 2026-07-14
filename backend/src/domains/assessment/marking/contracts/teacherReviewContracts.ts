export type ReviewGroupType = 'same_question_same_pattern' | 'low_confidence_cluster' | 'rubric_ambiguity' | 'manual_review_batch' | 'challenge_batch' | 'moderation_batch';
export type ReviewGroupStatus = 'open' | 'in_review' | 'resolved' | 'blocked' | 'cancelled';
export type ReviewItemStatus = 'open' | 'assigned' | 'resolved' | 'blocked' | 'cancelled';
export type OverrideDecision = 'confirm' | 'adjust_marks' | 'route_to_moderation' | 'reject_suggestion' | 'block_result';

export interface TeacherReviewGroup {
  teacherReviewGroupId: string;
  schoolId: string;
  markingRunId: string;
  status: string;
  groupType: string;
  reasonCode: string;
  questionId: string;
  questionVersionId: string;
  itemCount: number;
  safeSummary: string;
  recommendedAction: string;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
}

export interface TeacherReviewItem {
  teacherReviewItemId: string;
  schoolId: string;
  teacherReviewGroupId: string;
  markingRunId: string;
  markingResultVersionId: string;
  status: string;
  reviewReasonCode: string;
  priority: number;
  assignedToActorId?: string;
  safeSummary: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface TeacherOverride {
  teacherOverrideId: string;
  schoolId: string;
  markingResultVersionId: string;
  teacherReviewItemId?: string;
  decision: string;
  previousMarks: number;
  newMarks: number;
  overrideReasonCode: string;
  safeReason: string;
  decidedByActorId: string;
  decidedByRole: string;
  createdAt: string;
}
