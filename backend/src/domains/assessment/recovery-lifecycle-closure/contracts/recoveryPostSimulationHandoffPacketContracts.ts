import { RecoveryLifecycleClosureSafeEnvelope } from './recoveryLifecycleClosureContracts';

export interface RecoveryPostSimulationHandoffPacket {
  handoffPacketId: string;
  schoolId: string;
  studentRef: string;
  resultRecoveryPlanId: string;
  recoveryOutcomeExecutionSimulationRunId?: string;
  recoveryOutcomeExecutionSimulationResultId?: string;
  recoveryOutcomeActionBundleId?: string;
  handoffStatus: string;
  safeHandoffSummary: string;
  handoffContentsJson: Record<string, unknown>;
  nextStepsJson: Record<string, unknown>;
  blockedReasonCodesJson: string[];
  sourceRefsJson: Record<string, string>;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  reviewReadyAt?: string;
  handoffReadyAt?: string;
  approvedForFutureUseAt?: string;
  suppressedAt?: string;
  blockedAt?: string;
  voidedAt?: string;
}

export interface CreateRecoveryPostSimulationHandoffPacketRequest {
  studentRef: string;
  resultRecoveryPlanId: string;
  recoveryOutcomeExecutionSimulationRunId?: string;
  recoveryOutcomeExecutionSimulationResultId?: string;
  recoveryOutcomeActionBundleId?: string;
  safeHandoffSummary: string;
  handoffContentsJson?: Record<string, unknown>;
  nextStepsJson?: Record<string, unknown>;
  blockedReasonCodesJson?: string[];
  sourceRefsJson?: Record<string, string>;
}

export type RecoveryPostSimulationHandoffPacketResponse = RecoveryLifecycleClosureSafeEnvelope<RecoveryPostSimulationHandoffPacket>;
export type RecoveryPostSimulationHandoffPacketListResponse = RecoveryLifecycleClosureSafeEnvelope<RecoveryPostSimulationHandoffPacket[]>;
