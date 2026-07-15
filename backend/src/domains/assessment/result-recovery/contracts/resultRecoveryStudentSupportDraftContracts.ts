import { ResultRecoveryStudentSupportDraftStatus } from './resultRecoveryContracts';

export interface ResultRecoveryStudentSupportDraft {
  resultRecoveryStudentSupportDraftId: string;
  schoolId: string;
  resultRecoveryPlanId: string;
  studentRef: string;
  draftStatus: ResultRecoveryStudentSupportDraftStatus;
  draftMode: string;
  safeSupportSummary: string;
  studentSupportBodyJson: Record<string, unknown> | null;
  reflectionPromptRefsJson: Record<string, unknown> | null;
  practiceDraftRefsJson: Record<string, unknown> | null;
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

export interface CreateStudentSupportDraftInput {
  resultRecoveryPlanId: string;
  studentRef: string;
  draftMode?: string;
  safeSupportSummary: string;
  studentSupportBodyJson?: Record<string, unknown>;
  reflectionPromptRefsJson?: Record<string, unknown>;
  practiceDraftRefsJson?: Record<string, unknown>;
}

export interface ResultRecoveryStudentSupportDraftPreview {
  resultRecoveryStudentSupportDraftId: string;
  resultRecoveryPlanId: string;
  draftStatus: string;
  safeSupportSummary: string;
  reviewReadyAt: string | null;
  createdAt: string;
}

export interface UpdateRecoveryStudentSupportDraftStatusInput {
  draftStatus: string;
  reasonCode: string;
  safeMessage: string;
}
