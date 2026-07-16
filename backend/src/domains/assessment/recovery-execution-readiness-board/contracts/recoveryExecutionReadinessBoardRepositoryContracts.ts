export interface RecoveryExecutionReadinessBoardSnapshotRepository {
  create(data: any): Promise<any>;
  getById(id: string): Promise<any | null>;
  listBySchool(schoolId: string): Promise<any[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<any[]>;
  listByPlanId(planId: string): Promise<any[]>;
  listByStatus(status: string): Promise<any[]>;
  update(id: string, data: any): Promise<any>;
  updateStatus(id: string, status: string): Promise<any>;
  markReady(id: string): Promise<any>;
  markReviewReady(id: string): Promise<any>;
  markStale(id: string): Promise<any>;
  markRefreshing(id: string): Promise<any>;
  markRiskFlagged(id: string): Promise<any>;
  suppress(id: string): Promise<any>;
  block(id: string): Promise<any>;
  void(id: string): Promise<any>;
  refresh(id: string): Promise<any>;
}

export interface RecoveryExecutionReadinessBoardLaneRepository {
  create(data: any): Promise<any>;
  getById(id: string): Promise<any | null>;
  listBySnapshotId(snapshotId: string): Promise<any[]>;
  listByLaneKey(laneKey: string): Promise<any[]>;
  listByStatus(status: string): Promise<any[]>;
  update(id: string, data: any): Promise<any>;
  updateStatus(id: string, status: string): Promise<any>;
  markReady(id: string): Promise<any>;
  markStale(id: string): Promise<any>;
  block(id: string): Promise<any>;
  void(id: string): Promise<any>;
}

export interface RecoveryExecutionReadinessBoardCardRepository {
  create(data: any): Promise<any>;
  getById(id: string): Promise<any | null>;
  listBySnapshotId(snapshotId: string): Promise<any[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<any[]>;
  listByPlanId(planId: string): Promise<any[]>;
  listByLaneKey(laneKey: string): Promise<any[]>;
  listByStatus(status: string): Promise<any[]>;
  listByPriority(priority: string): Promise<any[]>;
  update(id: string, data: any): Promise<any>;
  markReady(id: string): Promise<any>;
  markNeedsTeacherReview(id: string): Promise<any>;
  markNeedsAdminReview(id: string): Promise<any>;
  markRiskFlagged(id: string): Promise<any>;
  block(id: string): Promise<any>;
  void(id: string): Promise<any>;
}

export interface RecoveryExecutionReadinessBoardFilterPresetRepository {
  create(data: any): Promise<any>;
  getById(id: string): Promise<any | null>;
  listBySchool(schoolId: string): Promise<any[]>;
  listByActor(schoolId: string, actorId: string): Promise<any[]>;
  listByRole(schoolId: string, role: string): Promise<any[]>;
  update(id: string, data: any): Promise<any>;
  suppress(id: string): Promise<any>;
  void(id: string): Promise<any>;
}

export interface RecoveryExecutionReadinessBoardRiskSignalRepository {
  create(data: any): Promise<any>;
  getById(id: string): Promise<any | null>;
  listBySnapshotId(snapshotId: string): Promise<any[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<any[]>;
  listByPlanId(planId: string): Promise<any[]>;
  listByRiskLevel(riskLevel: string): Promise<any[]>;
  update(id: string, data: any): Promise<any>;
  markReviewReady(id: string): Promise<any>;
  suppress(id: string): Promise<any>;
  block(id: string): Promise<any>;
  void(id: string): Promise<any>;
}

export interface RecoveryExecutionReadinessBoardBlockerRepository {
  create(data: any): Promise<any>;
  getById(id: string): Promise<any | null>;
  listBySnapshotId(snapshotId: string): Promise<any[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<any[]>;
  listByPlanId(planId: string): Promise<any[]>;
  listByStatus(status: string): Promise<any[]>;
  update(id: string, data: any): Promise<any>;
  markReviewReady(id: string): Promise<any>;
  resolve(id: string): Promise<any>;
  suppress(id: string): Promise<any>;
  void(id: string): Promise<any>;
}

export interface RecoveryExecutionReadinessBoardGovernanceNoteRepository {
  create(data: any): Promise<any>;
  getById(id: string): Promise<any | null>;
  listBySnapshotId(snapshotId: string): Promise<any[]>;
  listByPlanId(planId: string): Promise<any[]>;
  listByActor(actorId: string): Promise<any[]>;
  update(id: string, data: any): Promise<any>;
  markReviewReady(id: string): Promise<any>;
  suppress(id: string): Promise<any>;
  void(id: string): Promise<any>;
}

export interface RecoveryExecutionReadinessBoardRoleProjectionRepository {
  create(data: any): Promise<any>;
  getById(id: string): Promise<any | null>;
  listBySnapshotId(snapshotId: string): Promise<any[]>;
  listByRole(role: string): Promise<any[]>;
  listByActor(actorId: string): Promise<any[]>;
  update(id: string, data: any): Promise<any>;
  markReviewReady(id: string): Promise<any>;
  suppress(id: string): Promise<any>;
  block(id: string): Promise<any>;
  void(id: string): Promise<any>;
}

export interface RecoveryExecutionReadinessBoardTeacherQueueRepository {
  create(data: any): Promise<any>;
  getById(id: string): Promise<any | null>;
  listBySchool(schoolId: string): Promise<any[]>;
  listByTeacher(teacherRef: string): Promise<any[]>;
  update(id: string, data: any): Promise<any>;
  markReviewReady(id: string): Promise<any>;
  refresh(id: string): Promise<any>;
  block(id: string): Promise<any>;
  void(id: string): Promise<any>;
}

export interface RecoveryExecutionReadinessBoardAdminQueueRepository {
  create(data: any): Promise<any>;
  getById(id: string): Promise<any | null>;
  listBySchool(schoolId: string): Promise<any[]>;
  listByAdmin(adminRef: string): Promise<any[]>;
  update(id: string, data: any): Promise<any>;
  markReviewReady(id: string): Promise<any>;
  refresh(id: string): Promise<any>;
  block(id: string): Promise<any>;
  void(id: string): Promise<any>;
}

export interface RecoveryExecutionReadinessBoardStudentSafeStatusDraftRepository {
  create(data: any): Promise<any>;
  getById(id: string): Promise<any | null>;
  listByPlanId(planId: string): Promise<any[]>;
  update(id: string, data: any): Promise<any>;
  markReviewReady(id: string): Promise<any>;
  suppress(id: string): Promise<any>;
  block(id: string): Promise<any>;
  void(id: string): Promise<any>;
}

export interface RecoveryExecutionReadinessBoardParentSafeStatusDraftRepository {
  create(data: any): Promise<any>;
  getById(id: string): Promise<any | null>;
  listByPlanId(planId: string): Promise<any[]>;
  update(id: string, data: any): Promise<any>;
  markReviewReady(id: string): Promise<any>;
  suppress(id: string): Promise<any>;
  block(id: string): Promise<any>;
  void(id: string): Promise<any>;
}

export interface RecoveryExecutionReadinessBoardRefreshJobRepository {
  create(data: any): Promise<any>;
  getById(id: string): Promise<any | null>;
  listBySchool(schoolId: string): Promise<any[]>;
  listBySnapshotId(snapshotId: string): Promise<any[]>;
  listByStatus(status: string): Promise<any[]>;
  update(id: string, data: any): Promise<any>;
  markRunning(id: string): Promise<any>;
  markCompleted(id: string): Promise<any>;
  markFailed(id: string): Promise<any>;
  void(id: string): Promise<any>;
}

export interface RecoveryExecutionReadinessBoardSummaryRepository {
  create(data: any): Promise<any>;
  getById(id: string): Promise<any | null>;
  listBySchool(schoolId: string): Promise<any[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<any[]>;
  listByPlanId(planId: string): Promise<any[]>;
  update(id: string, data: any): Promise<any>;
  markStale(id: string): Promise<any>;
  markReviewReady(id: string): Promise<any>;
  block(id: string): Promise<any>;
  void(id: string): Promise<any>;
}

export interface RecoveryExecutionReadinessBoardAuditRepository {
  create(data: any): Promise<any>;
  listBySchool(schoolId: string): Promise<any[]>;
  listBySnapshotId(snapshotId: string): Promise<any[]>;
}

export interface RecoveryExecutionReadinessBoardIdempotencyRepository {
  create(data: any): Promise<any>;
  getByIdempotencyKey(schoolId: string, operation: string, idempotencyKey: string): Promise<any | null>;
  update(id: string, data: any): Promise<any>;
  complete(id: string, resultSummary?: string): Promise<any>;
}
