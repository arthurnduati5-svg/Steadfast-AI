export type SubmittedSnapshotIntakeStatus = 'received' | 'validated' | 'ready_for_marking' | 'blocked' | 'void' | 'duplicate';

export type MarkingReadinessStatus = 'ready' | 'incomplete_snapshot' | 'unsealed_snapshot' | 'missing_question_snapshots' | 'missing_answers' | 'invalid_school_scope' | 'already_intaken' | 'blocked_by_policy';

export interface SubmittedSnapshotIntake {
  snapshotIntakeId: string;
  schoolId: string;
  markingInvocationRequestId: string;
  submissionSnapshotId: string;
  attemptId: string;
  deliverySessionId: string;
  paperId: string;
  paperVersionId: string;
  variantId: string;
  studentRef: string;
  intakeStatus: SubmittedSnapshotIntakeStatus;
  readinessStatus: MarkingReadinessStatus;
  readinessReasonCodesJson: string[] | null;
  safeIntakeSummary: string;
  createdAt: string;
  updatedAt: string;
  blockedAt: string | null;
}
