export interface RecoveryExecutionReadinessBoardRiskSignal {
  boardRiskSignalId: string;
  boardSnapshotId?: string;
  schoolId: string;
  studentRef?: string;
  teacherRef?: string;
  adminRef?: string;
  resultRecoveryPlanId?: string;
  laneKey?: string;
  cardKey?: string;
  riskLevel: string;
  riskStatus: string;
  riskCategory: string;
  riskSummary: string;
  riskDetailsJson?: Record<string, any>;
  mitigationsJson?: Record<string, any>;
  blockedReasonCodesJson?: string[];
  sourceRefsJson?: Record<string, any>;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  voidedAt?: string;
}

export interface CreateRiskSignalRequest {
  boardSnapshotId?: string;
  schoolId: string;
  studentRef?: string;
  teacherRef?: string;
  adminRef?: string;
  resultRecoveryPlanId?: string;
  laneKey?: string;
  cardKey?: string;
  riskLevel?: string;
  riskStatus?: string;
  riskCategory: string;
  riskSummary: string;
  riskDetailsJson?: Record<string, any>;
  mitigationsJson?: Record<string, any>;
  sourceRefsJson?: Record<string, any>;
}
