import { ResultRecoveryCheckpointStatus } from './resultRecoveryContracts';

export interface ResultRecoveryCheckpoint {
  resultRecoveryCheckpointId: string;
  schoolId: string;
  resultRecoveryPlanId: string;
  studentRef: string;
  checkpointStatus: ResultRecoveryCheckpointStatus;
  checkpointMode: string;
  checkpointType: string;
  safeCheckpointSummary: string;
  checkpointCriteriaJson: Record<string, unknown> | null;
  scheduledMockAt: string | null;
  completedMockAt: string | null;
  cancelledAt: string | null;
  blockedReasonCodesJson: string[] | null;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  voidedAt: string | null;
}

export interface CreateRecoveryCheckpointInput {
  resultRecoveryPlanId: string;
  studentRef: string;
  checkpointMode?: string;
  checkpointType?: string;
  safeCheckpointSummary: string;
  checkpointCriteriaJson?: Record<string, unknown>;
}

export interface ResultRecoveryCheckpointPreview {
  resultRecoveryCheckpointId: string;
  resultRecoveryPlanId: string;
  checkpointStatus: string;
  checkpointType: string;
  safeCheckpointSummary: string;
  scheduledMockAt: string | null;
  completedMockAt: string | null;
  createdAt: string;
}

export interface UpdateRecoveryCheckpointStatusInput {
  checkpointStatus: string;
  reasonCode: string;
  safeMessage: string;
}
