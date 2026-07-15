import { ResultRecoveryResourceRecommendationStatus } from './resultRecoveryContracts';

export interface ResultRecoveryResourceRecommendation {
  resultRecoveryResourceRecommendationId: string;
  schoolId: string;
  resultRecoveryPlanId: string;
  resultRecoveryObjectiveId: string | null;
  studentRef: string;
  recommendationStatus: ResultRecoveryResourceRecommendationStatus;
  recommendationMode: string;
  resourceType: string;
  safeResourceSummary: string;
  resourceRefsJson: Record<string, unknown> | null;
  selectionReasonCodesJson: string[] | null;
  allowedAudienceJson: Record<string, unknown> | null;
  blockedReasonCodesJson: string[] | null;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  reviewReadyAt: string | null;
  approvedForFutureUseAt: string | null;
  suppressedAt: string | null;
  voidedAt: string | null;
}

export interface CreateResourceRecommendationInput {
  resultRecoveryPlanId: string;
  resultRecoveryObjectiveId?: string;
  studentRef: string;
  recommendationMode?: string;
  resourceType?: string;
  safeResourceSummary: string;
  resourceRefsJson?: Record<string, unknown>;
  selectionReasonCodesJson?: string[];
  allowedAudienceJson?: Record<string, unknown>;
}

export interface ResultRecoveryResourceRecommendationPreview {
  resultRecoveryResourceRecommendationId: string;
  resultRecoveryPlanId: string;
  resourceType: string;
  recommendationStatus: string;
  safeResourceSummary: string;
  reviewReadyAt: string | null;
  createdAt: string;
}

export interface UpdateRecoveryResourceRecommendationStatusInput {
  recommendationStatus: string;
  reasonCode: string;
  safeMessage: string;
}
