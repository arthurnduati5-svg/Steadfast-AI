import type { ParentGuidanceDraftStatus } from './resultFollowUpContracts';

export interface ParentGuidanceDraft {
  parentGuidanceDraftId: string;
  schoolId: string;
  resultFollowUpCaseId: string;
  resultFollowUpActionPlanId: string | null;
  studentRef: string;
  audienceType: string;
  draftStatus: ParentGuidanceDraftStatus;
  draftMode: string;
  safeGuidanceSummary: string;
  safeGuidanceBodyJson: Record<string, unknown> | null;
  allowedFieldNamesJson: Record<string, unknown> | null;
  blockedFieldNamesJson: Record<string, unknown> | null;
  blockedReasonCodesJson: Record<string, unknown> | null;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  reviewedAt: string | null;
  approvedForFutureUseAt: string | null;
  suppressedAt: string | null;
  voidedAt: string | null;
}

export interface CreateParentGuidanceDraftInput {
  resultFollowUpCaseId: string;
  resultFollowUpActionPlanId?: string;
  studentRef: string;
  safeGuidanceSummary: string;
  safeGuidanceBody?: Record<string, unknown>;
  audienceType?: string;
  draftMode?: string;
  allowedFieldNames?: Record<string, unknown>;
  blockedFieldNames?: Record<string, unknown>;
}

export interface UpdateParentGuidanceDraftStatusInput {
  draftStatus: string;
  reasonCode: string;
  safeMessage: string;
}

export interface ParentGuidanceDraftPreview {
  parentGuidanceDraftId: string;
  resultFollowUpCaseId: string;
  studentRef: string;
  draftStatus: string;
  safeGuidanceSummary: string;
  createdAt: string;
}
