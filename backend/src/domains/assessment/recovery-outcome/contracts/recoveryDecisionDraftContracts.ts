import { RecoveryOutcomeDecisionStatus, RecoveryOutcomeDecisionType, RecoveryClosureType } from './recoveryOutcomeContracts';

export interface RecoveryContinuationDecisionDraft {
  recoveryContinuationDecisionDraftId: string;
  schoolId: string;
  studentRef: string;
  resultRecoveryPlanId: string;
  recoveryProgressSummaryId?: string;
  recoveryEvidenceRollupId?: string;
  draftStatus: RecoveryOutcomeDecisionStatus;
  safeDecisionSummary: string;
  rationaleJson: Record<string, unknown>;
  blockedReasonCodesJson: string[];
  sourceRefsJson: Record<string, unknown>;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  reviewReadyAt?: string;
  approvedForFutureUseAt?: string;
  suppressedAt?: string;
  blockedAt?: string;
  voidedAt?: string;
}

export interface RecoveryIntensificationDecisionDraft {
  recoveryIntensificationDecisionDraftId: string;
  schoolId: string;
  studentRef: string;
  resultRecoveryPlanId: string;
  recoveryProgressSummaryId?: string;
  recoveryEvidenceRollupId?: string;
  draftStatus: RecoveryOutcomeDecisionStatus;
  safeDecisionSummary: string;
  rationaleJson: Record<string, unknown>;
  blockedReasonCodesJson: string[];
  sourceRefsJson: Record<string, unknown>;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  reviewReadyAt?: string;
  approvedForFutureUseAt?: string;
  suppressedAt?: string;
  blockedAt?: string;
  voidedAt?: string;
}

export interface RecoveryPauseDecisionDraft {
  recoveryPauseDecisionDraftId: string;
  schoolId: string;
  studentRef: string;
  resultRecoveryPlanId: string;
  recoveryProgressSummaryId?: string;
  recoveryEvidenceRollupId?: string;
  draftStatus: RecoveryOutcomeDecisionStatus;
  safeDecisionSummary: string;
  rationaleJson: Record<string, unknown>;
  blockedReasonCodesJson: string[];
  sourceRefsJson: Record<string, unknown>;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  reviewReadyAt?: string;
  approvedForFutureUseAt?: string;
  suppressedAt?: string;
  blockedAt?: string;
  voidedAt?: string;
}

export interface RecoveryClosureDecisionDraft {
  recoveryClosureDecisionDraftId: string;
  schoolId: string;
  studentRef: string;
  resultRecoveryPlanId: string;
  recoveryProgressSummaryId?: string;
  recoveryEvidenceRollupId?: string;
  draftStatus: RecoveryOutcomeDecisionStatus;
  safeDecisionSummary: string;
  closureType: RecoveryClosureType;
  rationaleJson: Record<string, unknown>;
  futureReviewRefsJson: Record<string, unknown>;
  blockedReasonCodesJson: string[];
  sourceRefsJson: Record<string, unknown>;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  reviewReadyAt?: string;
  approvedForFutureUseAt?: string;
  suppressedAt?: string;
  blockedAt?: string;
  voidedAt?: string;
}

export interface DecisionDraftCreateRequest {
  schoolId: string;
  studentRef: string;
  resultRecoveryPlanId: string;
  recoveryProgressSummaryId?: string;
  recoveryEvidenceRollupId?: string;
  safeDecisionSummary: string;
  rationaleJson: Record<string, unknown>;
  sourceRefsJson: Record<string, unknown>;
  closureType?: RecoveryClosureType;
}
