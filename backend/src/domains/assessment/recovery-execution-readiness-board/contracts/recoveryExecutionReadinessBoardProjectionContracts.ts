export interface RecoveryExecutionReadinessBoardRoleProjection {
  boardRoleProjectionId: string;
  boardSnapshotId?: string;
  schoolId: string;
  targetRole: string;
  actorId?: string;
  actorRef?: string;
  projectionStatus: string;
  projectionSummary: string;
  projectionDetailsJson?: Record<string, any>;
  visibleLaneKeysJson?: string[];
  visibleCardKeysJson?: string[];
  blockedReasonCodesJson?: string[];
  sourceRefsJson?: Record<string, any>;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  voidedAt?: string;
}

export interface CreateRoleProjectionRequest {
  boardSnapshotId?: string;
  schoolId: string;
  targetRole: string;
  actorId?: string;
  actorRef?: string;
  projectionStatus?: string;
  projectionSummary: string;
  projectionDetailsJson?: Record<string, any>;
  visibleLaneKeysJson?: string[];
  visibleCardKeysJson?: string[];
  sourceRefsJson?: Record<string, any>;
}
