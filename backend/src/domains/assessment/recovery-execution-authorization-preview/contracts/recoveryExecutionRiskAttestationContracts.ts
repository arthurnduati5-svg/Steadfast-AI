export interface RecoveryExecutionRiskAttestation {
  riskAttestationId: string;
  schoolId: string;
  resultRecoveryPlanId?: string;
  recoveryLifecycleClosureReadinessId?: string;
  recoveryApprovalChainDraftId?: string;
  riskLevel: string;
  attestationStatus: string;
  safeAttestationSummary: string;
  riskDetailsJson: Record<string, any>;
  mitigationsJson: Record<string, any>;
  blockedReasonCodesJson: string[];
  sourceRefsJson: Record<string, any>;
  createdByActorId: string;
  createdByRole: string;
  attestorActorId?: string;
  attestorRole?: string;
  attestedAt?: string;
  createdAt: string;
  updatedAt: string;
  reviewReadyAt?: string;
  riskAttestedAt?: string;
  vetoedAt?: string;
  suppressedAt?: string;
  blockedAt?: string;
  voidedAt?: string;
}
