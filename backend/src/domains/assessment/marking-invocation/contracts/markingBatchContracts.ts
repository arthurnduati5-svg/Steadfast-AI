export type MarkingBatchStatus = 'planned' | 'queued' | 'running' | 'completed' | 'partially_completed' | 'blocked' | 'failed' | 'cancelled';

export type MarkingBatchMode = 'deterministic_only' | 'deterministic_plus_teacher_review' | 'teacher_review_only' | 'mock_controlled';

export type MarkingBatchItemStatus = 'planned' | 'ready' | 'marked_deterministically' | 'sent_to_teacher_review' | 'blocked' | 'failed' | 'skipped';

export type MarkingBatchItemMode = 'deterministic' | 'rubric_deterministic' | 'teacher_review_required' | 'manual_only' | 'unsupported_deferred';

export interface MarkingBatch {
  markingBatchId: string;
  schoolId: string;
  markingInvocationRequestId: string;
  markingRunId: string;
  batchStatus: MarkingBatchStatus;
  batchMode: MarkingBatchMode;
  batchSequence: number;
  totalItems: number;
  deterministicItemCount: number;
  teacherReviewItemCount: number;
  blockedItemCount: number;
  safeBatchSummary: string;
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

export interface MarkingBatchItem {
  markingBatchItemId: string;
  schoolId: string;
  markingBatchId: string;
  snapshotIntakeId: string;
  submissionSnapshotId: string;
  attemptId: string;
  attemptQuestionSnapshotId: string;
  answerSubmissionId: string;
  questionId: string;
  questionVersionId: string;
  paperQuestionId: string;
  variantQuestionId: string;
  studentRef: string;
  itemStatus: MarkingBatchItemStatus;
  itemMode: MarkingBatchItemMode;
  marksAvailable: number;
  safeItemSummary: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}
