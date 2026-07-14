export interface ResultGovernanceTeacherProjection {
  resultFinalizationReviewId: string;
  reviewStatus: string;
  reviewMode: string;
  safeReviewSummary: string;
  finalizationDecisionStatus?: string;
  safeDecisionSummary?: string;
  releaseReadinessStatus?: string;
  releaseAudienceType?: string;
  createdByActorId: string;
  createdAt: string;
  nextAllowedActions: string[];
}

export interface ResultGovernanceAdminProjection {
  resultFinalizationReviewId: string;
  schoolId: string;
  reviewStatus: string;
  reviewMode: string;
  safeReviewSummary: string;
  createdByActorId: string;
  createdByRole: string;
  finalizationDecisionStatus?: string;
  decisionType?: string;
  safeDecisionSummary?: string;
  releaseReadinessStatus?: string;
  releaseAudienceType?: string;
  totalReviewCount: number;
  blockedCount: number;
  completedCount: number;
  createdAt: string;
}

export interface ResultGovernanceStudentSafeProjection {
  studentRef: string;
  markingRunId?: string;
  markingResultVersionId?: string;
  finalizationReviewStatus?: string;
  finalizationDecisionStatus?: string;
  releaseReadinessStatus?: string;
  safeStatusSummary: string;
  availableNextActions: string[];
}

export interface ResultGovernanceParentBoundaryProjection {
  studentRef: string;
  releaseBoundaryId?: string;
  releaseReadinessStatus?: string;
  safeBoundarySummary: string;
  allowedFieldNames: string[];
  blockedFieldNames: string[];
  notYetReleasedReason?: string;
}

export interface ResultFinalizationPreview {
  resultFinalizationReviewId: string;
  reviewStatus: string;
  safeReviewSummary: string;
  finalizationDecisionStatus?: string;
  createdAt: string;
}

export interface ResultReleaseReadinessPreview {
  resultReleaseReadinessId: string;
  releaseReadinessStatus: string;
  releaseAudienceType: string;
  safeReadinessSummary: string;
  expiresAt?: string;
}

export interface ResultRegradeRequestPreview {
  resultRegradeRequestId: string;
  requestStatus: string;
  requestType: string;
  safeRequestSummary: string;
  createdAt: string;
}
