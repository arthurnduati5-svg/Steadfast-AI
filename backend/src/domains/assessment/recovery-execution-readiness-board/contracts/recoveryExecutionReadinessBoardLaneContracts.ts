export interface RecoveryExecutionReadinessBoardLane {
  boardLaneId: string;
  boardSnapshotId: string;
  schoolId: string;
  studentRef?: string;
  teacherRef?: string;
  adminRef?: string;
  resultRecoveryPlanId?: string;
  laneKey: string;
  laneStatus: string;
  lanePriority: string;
  laneSummary: string;
  laneDetailsJson?: Record<string, any>;
  cardKeysJson?: string[];
  cardCount: number;
  blockedReasonCodesJson?: string[];
  sourceRefsJson?: Record<string, any>;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  voidedAt?: string;
}

export interface CreateBoardLaneRequest {
  boardSnapshotId: string;
  schoolId: string;
  studentRef?: string;
  teacherRef?: string;
  adminRef?: string;
  resultRecoveryPlanId?: string;
  laneKey: string;
  laneStatus?: string;
  lanePriority?: string;
  laneSummary: string;
  laneDetailsJson?: Record<string, any>;
  cardKeysJson?: string[];
  sourceRefsJson?: Record<string, any>;
}
