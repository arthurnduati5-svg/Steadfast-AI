export interface RecoveryExecutionReadinessBoardBlocker {
  boardBlockerId: string;
  boardSnapshotId?: string;
  schoolId: string;
  studentRef?: string;
  teacherRef?: string;
  adminRef?: string;
  resultRecoveryPlanId?: string;
  laneKey?: string;
  cardKey?: string;
  blockerStatus: string;
  blockerPriority: string;
  blockerCategory: string;
  blockerSummary: string;
  blockerDetailsJson?: Record<string, any>;
  resolutionNotesJson?: Record<string, any>;
  blockedReasonCodesJson?: string[];
  sourceRefsJson?: Record<string, any>;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  voidedAt?: string;
}

export interface CreateBoardBlockerRequest {
  boardSnapshotId?: string;
  schoolId: string;
  studentRef?: string;
  teacherRef?: string;
  adminRef?: string;
  resultRecoveryPlanId?: string;
  laneKey?: string;
  cardKey?: string;
  blockerStatus?: string;
  blockerPriority?: string;
  blockerCategory: string;
  blockerSummary: string;
  blockerDetailsJson?: Record<string, any>;
  resolutionNotesJson?: Record<string, any>;
  sourceRefsJson?: Record<string, any>;
}
