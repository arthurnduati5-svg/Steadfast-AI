export type MarkingResultLinkStatus = 'linked' | 'blocked' | 'void' | 'superseded';

export interface MarkingResultLink {
  markingResultLinkId: string;
  schoolId: string;
  markingInvocationRequestId: string;
  markingBatchId: string;
  markingBatchItemId: string;
  markingRunId: string;
  markingResultVersionId: string;
  submissionSnapshotId: string;
  attemptId: string;
  answerSubmissionId: string;
  linkStatus: MarkingResultLinkStatus;
  safeLinkSummary: string;
  createdAt: string;
  updatedAt: string;
}

export interface MarkingInvocationResultVersionPreview {
  markingResultLinkId: string;
  markingBatchItemId: string;
  markingRunId: string;
  markingResultVersionId: string;
  linkStatus: string;
  marksAwarded: number;
  marksAvailable: number;
  safeStudentFeedback: string;
  requiresTeacherReview: boolean;
  createdAt: string;
}

export interface TeacherReviewDispatchPreview {
  markingBatchItemId: string;
  teacherReviewItemId: string;
  teacherReviewGroupId: string;
  reviewReasonCode: string;
  safeSummary: string;
  status: string;
  dispatchedAt: string;
}
