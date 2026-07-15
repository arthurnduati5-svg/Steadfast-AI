import { ResultRecoveryParentSupportNoteDraftStatus } from './resultRecoveryContracts';

export interface ResultRecoveryParentSupportNoteDraft {
  resultRecoveryParentSupportNoteDraftId: string;
  schoolId: string;
  resultRecoveryPlanId: string;
  studentRef: string;
  audienceType: string;
  draftStatus: ResultRecoveryParentSupportNoteDraftStatus;
  draftMode: string;
  safeSupportSummary: string;
  parentSupportBodyJson: Record<string, unknown> | null;
  allowedFieldNamesJson: string[] | null;
  blockedFieldNamesJson: string[] | null;
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

export interface CreateParentSupportNoteDraftInput {
  resultRecoveryPlanId: string;
  studentRef: string;
  audienceType?: string;
  draftMode?: string;
  safeSupportSummary: string;
  parentSupportBodyJson?: Record<string, unknown>;
}

export interface ResultRecoveryParentSupportNoteDraftPreview {
  resultRecoveryParentSupportNoteDraftId: string;
  resultRecoveryPlanId: string;
  audienceType: string;
  draftStatus: string;
  safeSupportSummary: string;
  reviewReadyAt: string | null;
  createdAt: string;
}

export interface UpdateRecoveryParentSupportNoteDraftStatusInput {
  draftStatus: string;
  reasonCode: string;
  safeMessage: string;
}
