import {
  ResultRecoveryPlanStatus, ResultRecoveryPlanMode, ResultRecoveryPlanPriority,
} from './resultRecoveryContracts';

export interface ResultRecoveryPlan {
  resultRecoveryPlanId: string;
  schoolId: string;
  studentRef: string;
  resultFollowUpCaseId: string | null;
  resultFollowUpActionPlanId: string | null;
  resultFollowUpSummaryId: string | null;
  resultReportCardAssemblyId: string | null;
  resultReportCardAudienceProjectionId: string | null;
  resultReportCardAccessGrantId: string | null;
  resultLearningEvidenceSnapshotId: string | null;
  planStatus: ResultRecoveryPlanStatus;
  planMode: ResultRecoveryPlanMode;
  planPriority: ResultRecoveryPlanPriority;
  safePlanSummary: string;
  sourceRefsJson: Record<string, unknown> | null;
  objectiveRefsJson: Record<string, unknown> | null;
  recommendedSequenceJson: Record<string, unknown> | null;
  allowedActionsJson: Record<string, unknown> | null;
  blockedActionsJson: Record<string, unknown> | null;
  blockedReasonCodesJson: string[] | null;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  draftedAt: string | null;
  reviewReadyAt: string | null;
  approvedForFutureUseAt: string | null;
  suppressedAt: string | null;
  blockedAt: string | null;
  voidedAt: string | null;
}

export interface CreateRecoveryPlanInput {
  studentRef: string;
  resultFollowUpCaseId?: string;
  resultFollowUpActionPlanId?: string;
  resultFollowUpSummaryId?: string;
  resultReportCardAssemblyId?: string;
  resultReportCardAudienceProjectionId?: string;
  resultReportCardAccessGrantId?: string;
  resultLearningEvidenceSnapshotId?: string;
  planMode?: ResultRecoveryPlanMode;
  planPriority?: ResultRecoveryPlanPriority;
  safePlanSummary: string;
  sourceRefsJson?: Record<string, unknown>;
  objectiveRefsJson?: Record<string, unknown>;
  recommendedSequenceJson?: Record<string, unknown>;
  allowedActionsJson?: Record<string, unknown>;
  blockedActionsJson?: Record<string, unknown>;
}

export interface ResultRecoveryPlanPreview {
  resultRecoveryPlanId: string;
  schoolId: string;
  studentRef: string;
  planStatus: string;
  planMode: string;
  planPriority: string;
  safePlanSummary: string;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  reviewReadyAt: string | null;
  approvedForFutureUseAt: string | null;
  suppressedAt: string | null;
  blockedAt: string | null;
  voidedAt: string | null;
}

export interface UpdateRecoveryPlanStatusInput {
  planStatus: string;
  reasonCode: string;
  safeMessage: string;
}
