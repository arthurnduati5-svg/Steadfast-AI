import { ResultRecoveryObjectiveStatus, ResultRecoveryObjectiveType } from './resultRecoveryContracts';

export interface ResultRecoveryObjective {
  resultRecoveryObjectiveId: string;
  schoolId: string;
  resultRecoveryPlanId: string;
  studentRef: string;
  objectiveStatus: ResultRecoveryObjectiveStatus;
  objectiveType: ResultRecoveryObjectiveType;
  objectivePriority: string;
  learningObjectiveRef: string | null;
  skillRef: string | null;
  topicRef: string | null;
  safeObjectiveSummary: string;
  evidenceRefsJson: Record<string, unknown> | null;
  successCriteriaJson: Record<string, unknown> | null;
  blockedReasonCodesJson: string[] | null;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  readyAt: string | null;
  completedMockAt: string | null;
  suppressedAt: string | null;
  voidedAt: string | null;
}

export interface CreateRecoveryObjectiveInput {
  resultRecoveryPlanId: string;
  studentRef: string;
  objectiveType?: ResultRecoveryObjectiveType;
  objectivePriority?: string;
  learningObjectiveRef?: string;
  skillRef?: string;
  topicRef?: string;
  safeObjectiveSummary: string;
  evidenceRefsJson?: Record<string, unknown>;
  successCriteriaJson?: Record<string, unknown>;
}

export interface ResultRecoveryObjectivePreview {
  resultRecoveryObjectiveId: string;
  resultRecoveryPlanId: string;
  studentRef: string;
  objectiveStatus: string;
  objectiveType: string;
  safeObjectiveSummary: string;
  readyAt: string | null;
  completedMockAt: string | null;
  createdAt: string;
}

export interface UpdateRecoveryObjectiveStatusInput {
  objectiveStatus: string;
  reasonCode: string;
  safeMessage: string;
}
