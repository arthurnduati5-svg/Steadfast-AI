export interface ResultRegradeRequest {
  resultRegradeRequestId: string;
  schoolId: string;
  resultFinalizationDecisionId?: string;
  markingResultVersionId: string;
  markingRunId?: string;
  studentRef: string;
  requesterActorId: string;
  requesterRole: string;
  requestStatus: string;
  requestType: string;
  safeRequestSummary: string;
  reasonCodesJson?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  cancelledAt?: string;
  resolvedAt?: string;
}

export interface ResultRegradeIntake {
  resultRegradeIntakeId: string;
  schoolId: string;
  resultRegradeRequestId: string;
  intakeStatus: string;
  assignedReviewerActorId?: string;
  assignedReviewerRole?: string;
  safeIntakeSummary: string;
  triageReasonCodesJson?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  blockedAt?: string;
}

export interface CreateRegradeRequestRequest {
  schoolId: string;
  resultFinalizationDecisionId?: string;
  markingResultVersionId: string;
  markingRunId?: string;
  studentRef: string;
  requesterActorId: string;
  requesterRole: string;
  requestType: string;
  safeRequestSummary: string;
  reasonCodes?: Record<string, unknown>;
}
