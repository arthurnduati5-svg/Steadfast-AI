export interface MarkingInvocationSafeEnvelope {
  ok: boolean;
  requestId: string;
  correlationId?: string;
  resourceId?: string;
  resourceVersion?: string;
  status?: string;
  safeMessage?: string;
  reasonCode?: string;
  policyDecision?: string;
  nextAllowedActions?: string[];
  data?: unknown;
}

export interface MarkingInvocationTeacherProjection {
  markingInvocationRequestId: string;
  schoolId: string;
  deliverySessionId: string;
  paperId: string;
  paperVersionId: string;
  invocationStatus: string;
  invocationMode: string;
  sourceType: string;
  safeRequestSummary: string;
  intakeCount: number;
  batchCount: number;
  batchStatusSummary: string;
  deterministicMarkedCount: number;
  teacherReviewDispatchCount: number;
  resultLinkCount: number;
  blockedItemCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface MarkingInvocationAdminProjection {
  markingInvocationRequestId: string;
  schoolId: string;
  deliverySessionId: string;
  paperId: string;
  paperVersionId: string;
  requestedByActorId: string;
  requestedByRole: string;
  invocationStatus: string;
  invocationMode: string;
  sourceType: string;
  submittedSnapshotRefsJson: Record<string, unknown> | null;
  safeRequestSummary: string;
  intakeRecords: number;
  readinessChecks: number;
  batches: number;
  batchItems: number;
  resultLinks: number;
  auditEvents: number;
  deterministicItemCount: number;
  teacherReviewItemCount: number;
  blockedItemCount: number;
  createdAt: string;
  updatedAt: string;
  cancelledAt: string | null;
}

export interface MarkingInvocationStudentSafeProjection {
  attemptId: string;
  submissionSnapshotId: string;
  markingInvocationRequestId: string;
  intakeStatus: string;
  batchStatus: string;
  safeStatusSummary: string;
  submittedAt: string;
  processingStatus: string;
}

export interface MarkingInvocationMarkingInput {
  answerKeySafeRef?: string;
  expectedOptionKey?: string;
  expectedNumericValue?: number;
  allowedTolerance?: number;
  expectedMatchingPairs?: Record<string, string>;
  expectedFillBlankAnswers?: string[];
  rubricRef?: string;
}
