export interface RecoveryCaseReviewSession {
  reviewSessionId: string;
  schoolId: string;
  queueItemId: string;
  adjudicationReadinessId?: string;
  reviewerActorId: string;
  reviewerRole: string;
  sessionStatus: string;
  safeSessionSummary: string;
  blockedReasonCodes: string[];
  sourceRefs: Record<string, unknown>;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  voidedAt?: string;
}

export interface CreateReviewSessionInput {
  schoolId: string;
  queueItemId: string;
  adjudicationReadinessId?: string;
  reviewerActorId: string;
  reviewerRole: string;
  safeSessionSummary: string;
  sourceRefs: Record<string, unknown>;
  createdByActorId: string;
  createdByRole: string;
}
