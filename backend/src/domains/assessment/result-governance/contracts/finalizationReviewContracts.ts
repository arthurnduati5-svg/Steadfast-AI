export interface ResultFinalizationReview {
  resultFinalizationReviewId: string;
  schoolId: string;
  markingInvocationRequestId?: string;
  markingRunId?: string;
  deliverySessionId?: string;
  paperId?: string;
  paperVersionId?: string;
  reviewStatus: string;
  reviewMode: string;
  reviewedResultVersionRefsJson?: Record<string, unknown>;
  requiredCheckRefsJson?: Record<string, unknown>;
  safeReviewSummary: string;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  blockedAt?: string;
}

export interface CreateFinalizationReviewRequest {
  schoolId: string;
  markingInvocationRequestId?: string;
  markingRunId?: string;
  deliverySessionId?: string;
  paperId?: string;
  paperVersionId?: string;
  reviewMode: string;
  reviewedResultVersionRefs?: Record<string, unknown>;
  requiredCheckRefs?: Record<string, unknown>;
  safeReviewSummary: string;
  actorId: string;
  actorRole: string;
}

export interface FinalizationReadinessCheckResult {
  allChecksPassed: boolean;
  blockingReasonCodes: string[];
  safeSummary: string;
  teacherReviewUnresolved: boolean;
  moderationUnresolved: boolean;
  missingResultVersionRefs: boolean;
  policyBlocked: boolean;
}
