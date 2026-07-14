export interface ResultFinalizationDecision {
  resultFinalizationDecisionId: string;
  schoolId: string;
  resultFinalizationReviewId: string;
  markingInvocationRequestId?: string;
  markingRunId?: string;
  decisionStatus: string;
  decisionType: string;
  decidedByActorId: string;
  decidedByRole: string;
  safeDecisionSummary: string;
  reasonCodesJson?: Record<string, unknown>;
  affectedResultVersionRefsJson?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  voidedAt?: string;
}

export interface CreateFinalizationDecisionRequest {
  schoolId: string;
  resultFinalizationReviewId: string;
  markingInvocationRequestId?: string;
  markingRunId?: string;
  decisionStatus: string;
  decisionType: string;
  decidedByActorId: string;
  decidedByRole: string;
  safeDecisionSummary: string;
  reasonCodes?: Record<string, unknown>;
  affectedResultVersionRefs?: Record<string, unknown>;
}
