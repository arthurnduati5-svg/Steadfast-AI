import { RecoveryLifecycleClosureSafeEnvelope } from './recoveryLifecycleClosureContracts';

export interface RecoveryUnresolvedRiskRegister {
  unresolvedRiskRegisterId: string;
  schoolId: string;
  resultRecoveryPlanId: string;
  riskLevel: string;
  riskStatus: string;
  safeRiskSummary: string;
  riskDetailsJson: Record<string, unknown>;
  blockedReasonCodesJson: string[];
  sourceRefsJson: Record<string, string>;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  reviewReadyAt?: string;
  suppressedAt?: string;
  blockedAt?: string;
  voidedAt?: string;
}

export interface CreateRecoveryUnresolvedRiskRegisterRequest {
  resultRecoveryPlanId: string;
  riskLevel: string;
  safeRiskSummary: string;
  riskDetailsJson?: Record<string, unknown>;
  blockedReasonCodesJson?: string[];
  sourceRefsJson?: Record<string, string>;
}

export type RecoveryUnresolvedRiskRegisterResponse = RecoveryLifecycleClosureSafeEnvelope<RecoveryUnresolvedRiskRegister>;
export type RecoveryUnresolvedRiskRegisterListResponse = RecoveryLifecycleClosureSafeEnvelope<RecoveryUnresolvedRiskRegister[]>;
