import { ResultRecoveryPracticeDraftStatus } from './resultRecoveryContracts';

export interface ResultRecoveryPracticeDraft {
  resultRecoveryPracticeDraftId: string;
  schoolId: string;
  resultRecoveryPlanId: string;
  resultRecoveryObjectiveId: string | null;
  resultRecoveryStepId: string | null;
  studentRef: string;
  draftStatus: ResultRecoveryPracticeDraftStatus;
  draftMode: string;
  practiceType: string;
  safePracticeSummary: string;
  questionRefsJson: Record<string, unknown> | null;
  objectiveRefsJson: Record<string, unknown> | null;
  difficultyHintsJson: Record<string, unknown> | null;
  selectionReasonCodesJson: string[] | null;
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

export interface CreatePracticeDraftInput {
  resultRecoveryPlanId: string;
  resultRecoveryObjectiveId?: string;
  resultRecoveryStepId?: string;
  studentRef: string;
  draftMode?: string;
  practiceType?: string;
  safePracticeSummary: string;
  questionRefsJson?: Record<string, unknown>;
  objectiveRefsJson?: Record<string, unknown>;
  difficultyHintsJson?: Record<string, unknown>;
  selectionReasonCodesJson?: string[];
}

export interface ResultRecoveryPracticeDraftPreview {
  resultRecoveryPracticeDraftId: string;
  resultRecoveryPlanId: string;
  practiceType: string;
  draftStatus: string;
  safePracticeSummary: string;
  reviewReadyAt: string | null;
  createdAt: string;
}

export interface UpdateRecoveryPracticeDraftStatusInput {
  draftStatus: string;
  reasonCode: string;
  safeMessage: string;
}
