import { RecoveryOutcomeActionSafeEnvelope } from './recoveryOutcomeActionContracts';

export type ApprovalGateStatus = 'pending' | 'satisfied' | 'blocked' | 'voided';

export interface RecoveryOutcomeApprovalGate {
  approvalGateId: string;
  schoolId: string;
  studentRef: string;
  resultRecoveryPlanId: string;
  recoveryOutcomeDecisionSummaryId?: string;
  gateStatus: ApprovalGateStatus;
  safeGateSummary: string;
  requiredApprovalsJson: Record<string, unknown>;
  approvalResultsJson: Record<string, unknown>;
  blockedReasonCodesJson: string[];
  sourceRefsJson: Record<string, string>;
  createdByActorId: string;
  createdByRole: string;
  createdAt: Date;
  updatedAt: Date;
  satisfiedAt?: Date;
  blockedAt?: Date;
  voidedAt?: Date;
}

export interface CreateApprovalGateRequest {
  schoolId: string;
  studentRef: string;
  resultRecoveryPlanId: string;
  recoveryOutcomeDecisionSummaryId?: string;
  safeGateSummary: string;
  requiredApprovalsJson: Record<string, unknown>;
  sourceRefsJson?: Record<string, string>;
  createdByActorId: string;
  createdByRole: string;
}

export type ApprovalGateResponse = RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeApprovalGate>;
