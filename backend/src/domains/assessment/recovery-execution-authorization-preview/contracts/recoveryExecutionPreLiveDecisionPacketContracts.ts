export interface RecoveryExecutionPreLiveDecisionPacket {
  preLiveDecisionPacketId: string;
  schoolId: string;
  resultRecoveryPlanId?: string;
  recoveryLifecycleClosureReadinessId?: string;
  recoveryAuthorizationDryRunId?: string;
  packetStatus: string;
  safePacketSummary: string;
  decisionPacketJson: Record<string, any>;
  authorizationChainJson: Record<string, any>;
  riskSummaryJson: Record<string, any>;
  blockedReasonCodesJson: string[];
  sourceRefsJson: Record<string, any>;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  reviewReadyAt?: string;
  authorizationPreviewReadyAt?: string;
  suppressedAt?: string;
  blockedAt?: string;
  voidedAt?: string;
}
