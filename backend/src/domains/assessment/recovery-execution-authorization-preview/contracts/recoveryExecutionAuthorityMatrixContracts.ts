export interface RecoveryExecutionAuthorityMatrixSnapshot {
  authorityMatrixSnapshotId: string;
  schoolId: string;
  resultRecoveryPlanId?: string;
  snapshotStatus: string;
  safeMatrixSummary: string;
  authorityMatrixJson: Record<string, any>;
  rolePermissionsJson: Record<string, any>;
  blockedReasonCodesJson: string[];
  sourceRefsJson: Record<string, any>;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  reviewReadyAt?: string;
  approvalChainReadyAt?: string;
  suppressedAt?: string;
  blockedAt?: string;
  voidedAt?: string;
}
