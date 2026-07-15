import { ResultRecoveryStepStatus, ResultRecoveryStepType } from './resultRecoveryContracts';

export interface ResultRecoveryStep {
  resultRecoveryStepId: string;
  schoolId: string;
  resultRecoveryPlanId: string;
  resultRecoveryObjectiveId: string | null;
  studentRef: string;
  stepStatus: ResultRecoveryStepStatus;
  stepType: ResultRecoveryStepType;
  stepOrder: number;
  stepMode: string;
  safeStepSummary: string;
  stepInstructionsJson: Record<string, unknown> | null;
  teacherNotesJson: Record<string, unknown> | null;
  studentSafeNotesJson: Record<string, unknown> | null;
  blockedReasonCodesJson: string[] | null;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  reviewReadyAt: string | null;
  approvedForFutureUseAt: string | null;
  completedMockAt: string | null;
  suppressedAt: string | null;
  voidedAt: string | null;
}

export interface CreateRecoveryStepInput {
  resultRecoveryPlanId: string;
  resultRecoveryObjectiveId?: string;
  studentRef: string;
  stepType?: ResultRecoveryStepType;
  stepOrder?: number;
  stepMode?: string;
  safeStepSummary: string;
  stepInstructionsJson?: Record<string, unknown>;
  teacherNotesJson?: Record<string, unknown>;
  studentSafeNotesJson?: Record<string, unknown>;
}

export interface ResultRecoveryStepPreview {
  resultRecoveryStepId: string;
  resultRecoveryPlanId: string;
  stepOrder: number;
  stepStatus: string;
  stepType: string;
  safeStepSummary: string;
  reviewReadyAt: string | null;
  completedMockAt: string | null;
  createdAt: string;
}

export interface UpdateRecoveryStepStatusInput {
  stepStatus: string;
  reasonCode: string;
  safeMessage: string;
}
