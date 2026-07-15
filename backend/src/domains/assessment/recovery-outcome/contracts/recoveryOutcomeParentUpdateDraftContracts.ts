import { RecoveryOutcomeDecisionStatus } from './recoveryOutcomeContracts';

export interface RecoveryOutcomeParentUpdateDraft {
  recoveryOutcomeParentUpdateDraftId: string;
  schoolId: string;
  studentRef: string;
  resultRecoveryPlanId: string;
  parentRef: string;
  recoveryOutcomeDecisionSummaryId?: string;
  draftStatus: RecoveryOutcomeDecisionStatus;
  safeUpdateSummary: string;
  updateBodyJson: Record<string, unknown>;
  allowedFieldNamesJson: string[];
  blockedFieldNamesJson: string[];
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

export interface RecoveryOutcomeParentUpdateDraftCreateRequest {
  schoolId: string;
  studentRef: string;
  resultRecoveryPlanId: string;
  parentRef: string;
  recoveryOutcomeDecisionSummaryId?: string;
  safeUpdateSummary: string;
  updateBodyJson: Record<string, unknown>;
  allowedFieldNamesJson: string[];
  sourceRefsJson: Record<string, unknown>;
}
