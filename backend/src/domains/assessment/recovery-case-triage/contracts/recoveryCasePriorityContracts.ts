import type { RecoveryCasePriorityAssessmentStatus, RecoveryCasePriorityBand, RecoveryCaseRiskRank } from './recoveryCaseTriageContracts';

export interface RecoveryCasePriorityAssessment {
  priorityAssessmentId: string;
  schoolId: string;
  studentRef: string;
  resultRecoveryPlanId: string;
  boardSnapshotId: string;
  boardCardId: string;
  triageReadinessId: string;
  priorityStatus: RecoveryCasePriorityAssessmentStatus | string;
  totalScore: number;
  priorityBand: RecoveryCasePriorityBand | string;
  riskRank: RecoveryCaseRiskRank | string;
  scoringPolicyVersion: string;
  priorityFactorsJson: Record<string, unknown>;
  safeAssessmentSummary: string;
  decision: string;
  blockedReasonCodesJson: string[];
  sourceRefsJson: Record<string, unknown>;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  scoredAt?: string;
  reviewReadyAt?: string;
  staleAt?: string;
  blockedAt?: string;
  voidedAt?: string;
}

export interface RecoveryCasePriorityFactor {
  priorityFactorId: string;
  priorityAssessmentId: string;
  schoolId: string;
  factorCode: string;
  appliedPoints: number;
  factorWeight: number;
  factorExplanation: string;
  factorSourceJson: Record<string, unknown>;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
}

export interface CreatePriorityAssessmentRequest {
  studentRef: string;
  resultRecoveryPlanId: string;
  boardSnapshotId: string;
  boardCardId: string;
  triageReadinessId: string;
  scoringPolicyVersion?: string;
  safeAssessmentSummary?: string;
  sourceRefsJson?: Record<string, unknown>;
}

export interface RecoveryCasePriorityInput {
  riskLevel: RecoveryCaseRiskRank | string;
  hasActiveBlocker: boolean;
  needsAdminReview: boolean;
  needsTeacherReview: boolean;
  isBoardStale: boolean;
  authorizationBlocked: boolean;
  simulationFailed: boolean;
  caseAgeDays: number;
}

export interface RecoveryCasePriorityCalculation {
  totalScore: number;
  band: RecoveryCasePriorityBand | string;
  riskRank: RecoveryCaseRiskRank | string;
  factors: { code: string; appliedPoints: number; explanation: string }[];
}
