export interface RecoveryCaseSecondReviewRequest {
  secondReviewRequestId: string;
  schoolId: string;
  queueItemId: string;
  primaryDecisionId: string;
  requestedReviewerRole: string;
  requestReasonCodes: Record<string, unknown>;
  safeRequestSummary: string;
  requestStatus: string;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  voidedAt?: string;
}

export interface CreateSecondReviewRequestInput {
  schoolId: string;
  queueItemId: string;
  primaryDecisionId: string;
  requestedReviewerRole: string;
  requestReasonCodes: Record<string, unknown>;
  safeRequestSummary: string;
  createdByActorId: string;
  createdByRole: string;
}
