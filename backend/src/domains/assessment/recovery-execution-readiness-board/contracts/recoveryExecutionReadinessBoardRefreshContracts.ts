export interface RecoveryExecutionReadinessBoardRefreshJob {
  boardRefreshJobId: string;
  boardSnapshotId?: string;
  schoolId: string;
  resultRecoveryPlanId?: string;
  jobStatus: string;
  jobType: string;
  jobSummary: string;
  refreshResultsJson?: Record<string, any>;
  snapshotsRefreshed: number;
  lanesRefreshed: number;
  cardsRefreshed: number;
  blockersRefreshed: number;
  errorDetailsJson?: Record<string, any>;
  blockedReasonCodesJson?: string[];
  sourceRefsJson?: Record<string, any>;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  voidedAt?: string;
}

export interface CreateRefreshJobRequest {
  boardSnapshotId?: string;
  schoolId: string;
  resultRecoveryPlanId?: string;
  jobStatus?: string;
  jobType: string;
  jobSummary: string;
  refreshResultsJson?: Record<string, any>;
  sourceRefsJson?: Record<string, any>;
}
