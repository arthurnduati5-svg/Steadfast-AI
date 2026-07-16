import {
  RecoveryExecutionReadinessBoardSnapshot,
  RecoveryExecutionReadinessBoardLane,
  RecoveryExecutionReadinessBoardCard,
  RecoveryExecutionReadinessBoardFilterPreset,
  RecoveryExecutionReadinessBoardRiskSignal,
  RecoveryExecutionReadinessBoardBlocker,
  RecoveryExecutionReadinessBoardGovernanceNote,
  RecoveryExecutionReadinessBoardRoleProjection,
  RecoveryExecutionReadinessBoardTeacherQueue,
  RecoveryExecutionReadinessBoardAdminQueue,
  RecoveryExecutionReadinessBoardStudentSafeStatusDraft,
  RecoveryExecutionReadinessBoardParentSafeStatusDraft,
  RecoveryExecutionReadinessBoardRefreshJob,
  RecoveryExecutionReadinessBoardSummary,
} from '../contracts/index';
import {
  RecoveryExecutionReadinessBoardSnapshotRepository,
  RecoveryExecutionReadinessBoardLaneRepository,
  RecoveryExecutionReadinessBoardCardRepository,
  RecoveryExecutionReadinessBoardFilterPresetRepository,
  RecoveryExecutionReadinessBoardRiskSignalRepository,
  RecoveryExecutionReadinessBoardBlockerRepository,
  RecoveryExecutionReadinessBoardGovernanceNoteRepository,
  RecoveryExecutionReadinessBoardRoleProjectionRepository,
  RecoveryExecutionReadinessBoardTeacherQueueRepository,
  RecoveryExecutionReadinessBoardAdminQueueRepository,
  RecoveryExecutionReadinessBoardStudentSafeStatusDraftRepository,
  RecoveryExecutionReadinessBoardParentSafeStatusDraftRepository,
  RecoveryExecutionReadinessBoardRefreshJobRepository,
  RecoveryExecutionReadinessBoardSummaryRepository,
  RecoveryExecutionReadinessBoardAuditRepository,
  RecoveryExecutionReadinessBoardIdempotencyRepository,
} from '../contracts/recoveryExecutionReadinessBoardRepositoryContracts';

function simpleId(): string {
  return Date.now().toString() + Math.random().toString();
}

export class InMemoryRecoveryExecutionReadinessBoardSnapshotRepository implements RecoveryExecutionReadinessBoardSnapshotRepository {
  private store = new Map<string, RecoveryExecutionReadinessBoardSnapshot>();

  async create(data: Partial<RecoveryExecutionReadinessBoardSnapshot>): Promise<RecoveryExecutionReadinessBoardSnapshot> {
    const now = new Date().toISOString();
    const record: RecoveryExecutionReadinessBoardSnapshot = {
      ...data as RecoveryExecutionReadinessBoardSnapshot,
      boardSnapshotId: data.boardSnapshotId || simpleId(),
      boardStatus: data.boardStatus || 'draft',
      boardPriority: data.boardPriority || 'normal',
      riskLevel: data.riskLevel || 'low',
      blockerStatus: data.blockerStatus || 'none',
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
    };
    this.store.set(record.boardSnapshotId, record);
    return record;
  }

  async getById(id: string): Promise<RecoveryExecutionReadinessBoardSnapshot | null> {
    return this.store.get(id) ?? null;
  }

  async listBySchool(schoolId: string): Promise<RecoveryExecutionReadinessBoardSnapshot[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryExecutionReadinessBoardSnapshot[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.studentRef === studentRef);
  }

  async listByPlanId(planId: string): Promise<RecoveryExecutionReadinessBoardSnapshot[]> {
    return Array.from(this.store.values()).filter(r => r.resultRecoveryPlanId === planId);
  }

  async listByStatus(status: string): Promise<RecoveryExecutionReadinessBoardSnapshot[]> {
    return Array.from(this.store.values()).filter(r => r.boardStatus === status);
  }

  async update(id: string, data: Partial<RecoveryExecutionReadinessBoardSnapshot>): Promise<RecoveryExecutionReadinessBoardSnapshot> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`BoardSnapshot ${id} not found`);
    const updated: RecoveryExecutionReadinessBoardSnapshot = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
  }

  async updateStatus(id: string, status: string): Promise<RecoveryExecutionReadinessBoardSnapshot> {
    return this.update(id, { boardStatus: status } as any);
  }

  async markReady(id: string): Promise<RecoveryExecutionReadinessBoardSnapshot> {
    return this.update(id, { boardStatus: 'ready' } as any);
  }

  async markReviewReady(id: string): Promise<RecoveryExecutionReadinessBoardSnapshot> {
    return this.update(id, { boardStatus: 'review_ready' } as any);
  }

  async markStale(id: string): Promise<RecoveryExecutionReadinessBoardSnapshot> {
    return this.update(id, { boardStatus: 'stale' } as any);
  }

  async markRefreshing(id: string): Promise<RecoveryExecutionReadinessBoardSnapshot> {
    return this.update(id, { boardStatus: 'refreshing' } as any);
  }

  async markRiskFlagged(id: string): Promise<RecoveryExecutionReadinessBoardSnapshot> {
    return this.update(id, { boardStatus: 'risk_flagged' } as any);
  }

  async suppress(id: string): Promise<RecoveryExecutionReadinessBoardSnapshot> {
    return this.update(id, { boardStatus: 'suppressed' } as any);
  }

  async block(id: string): Promise<RecoveryExecutionReadinessBoardSnapshot> {
    return this.update(id, { boardStatus: 'blocked' } as any);
  }

  async void(id: string): Promise<RecoveryExecutionReadinessBoardSnapshot> {
    return this.update(id, { boardStatus: 'voided', voidedAt: new Date().toISOString() } as any);
  }

  async refresh(id: string): Promise<RecoveryExecutionReadinessBoardSnapshot> {
    return this.update(id, { boardStatus: 'active' } as any);
  }
}

export class InMemoryRecoveryExecutionReadinessBoardLaneRepository implements RecoveryExecutionReadinessBoardLaneRepository {
  private store = new Map<string, RecoveryExecutionReadinessBoardLane>();

  async create(data: Partial<RecoveryExecutionReadinessBoardLane>): Promise<RecoveryExecutionReadinessBoardLane> {
    const now = new Date().toISOString();
    const record: RecoveryExecutionReadinessBoardLane = {
      ...data as RecoveryExecutionReadinessBoardLane,
      boardLaneId: data.boardLaneId || simpleId(),
      laneStatus: data.laneStatus || 'draft',
      lanePriority: data.lanePriority || 'normal',
      cardCount: data.cardCount || 0,
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
    };
    this.store.set(record.boardLaneId, record);
    return record;
  }

  async getById(id: string): Promise<RecoveryExecutionReadinessBoardLane | null> {
    return this.store.get(id) ?? null;
  }

  async listBySnapshotId(snapshotId: string): Promise<RecoveryExecutionReadinessBoardLane[]> {
    return Array.from(this.store.values()).filter(r => r.boardSnapshotId === snapshotId);
  }

  async listByLaneKey(laneKey: string): Promise<RecoveryExecutionReadinessBoardLane[]> {
    return Array.from(this.store.values()).filter(r => r.laneKey === laneKey);
  }

  async listByStatus(status: string): Promise<RecoveryExecutionReadinessBoardLane[]> {
    return Array.from(this.store.values()).filter(r => r.laneStatus === status);
  }

  async update(id: string, data: Partial<RecoveryExecutionReadinessBoardLane>): Promise<RecoveryExecutionReadinessBoardLane> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`BoardLane ${id} not found`);
    const updated: RecoveryExecutionReadinessBoardLane = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
  }

  async updateStatus(id: string, status: string): Promise<RecoveryExecutionReadinessBoardLane> {
    return this.update(id, { laneStatus: status } as any);
  }

  async markReady(id: string): Promise<RecoveryExecutionReadinessBoardLane> {
    return this.update(id, { laneStatus: 'ready' } as any);
  }

  async markStale(id: string): Promise<RecoveryExecutionReadinessBoardLane> {
    return this.update(id, { laneStatus: 'stale' } as any);
  }

  async block(id: string): Promise<RecoveryExecutionReadinessBoardLane> {
    return this.update(id, { laneStatus: 'blocked' } as any);
  }

  async void(id: string): Promise<RecoveryExecutionReadinessBoardLane> {
    return this.update(id, { laneStatus: 'voided', voidedAt: new Date().toISOString() } as any);
  }
}

export class InMemoryRecoveryExecutionReadinessBoardCardRepository implements RecoveryExecutionReadinessBoardCardRepository {
  private store = new Map<string, RecoveryExecutionReadinessBoardCard>();

  async create(data: Partial<RecoveryExecutionReadinessBoardCard>): Promise<RecoveryExecutionReadinessBoardCard> {
    const now = new Date().toISOString();
    const record: RecoveryExecutionReadinessBoardCard = {
      ...data as RecoveryExecutionReadinessBoardCard,
      boardCardId: data.boardCardId || simpleId(),
      cardStatus: data.cardStatus || 'draft',
      cardPriority: data.cardPriority || 'normal',
      riskLevel: data.riskLevel || 'low',
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
    };
    this.store.set(record.boardCardId, record);
    return record;
  }

  async getById(id: string): Promise<RecoveryExecutionReadinessBoardCard | null> {
    return this.store.get(id) ?? null;
  }

  async listBySnapshotId(snapshotId: string): Promise<RecoveryExecutionReadinessBoardCard[]> {
    return Array.from(this.store.values()).filter(r => r.boardSnapshotId === snapshotId);
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryExecutionReadinessBoardCard[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.studentRef === studentRef);
  }

  async listByPlanId(planId: string): Promise<RecoveryExecutionReadinessBoardCard[]> {
    return Array.from(this.store.values()).filter(r => r.resultRecoveryPlanId === planId);
  }

  async listByLaneKey(laneKey: string): Promise<RecoveryExecutionReadinessBoardCard[]> {
    return Array.from(this.store.values()).filter(r => r.laneKey === laneKey);
  }

  async listByStatus(status: string): Promise<RecoveryExecutionReadinessBoardCard[]> {
    return Array.from(this.store.values()).filter(r => r.cardStatus === status);
  }

  async listByPriority(priority: string): Promise<RecoveryExecutionReadinessBoardCard[]> {
    return Array.from(this.store.values()).filter(r => r.cardPriority === priority);
  }

  async update(id: string, data: Partial<RecoveryExecutionReadinessBoardCard>): Promise<RecoveryExecutionReadinessBoardCard> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`BoardCard ${id} not found`);
    const updated: RecoveryExecutionReadinessBoardCard = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
  }

  async markReady(id: string): Promise<RecoveryExecutionReadinessBoardCard> {
    return this.update(id, { cardStatus: 'ready' } as any);
  }

  async markNeedsTeacherReview(id: string): Promise<RecoveryExecutionReadinessBoardCard> {
    return this.update(id, { cardStatus: 'needs_teacher_review' } as any);
  }

  async markNeedsAdminReview(id: string): Promise<RecoveryExecutionReadinessBoardCard> {
    return this.update(id, { cardStatus: 'needs_admin_review' } as any);
  }

  async markRiskFlagged(id: string): Promise<RecoveryExecutionReadinessBoardCard> {
    return this.update(id, { cardStatus: 'risk_flagged' } as any);
  }

  async block(id: string): Promise<RecoveryExecutionReadinessBoardCard> {
    return this.update(id, { cardStatus: 'blocked' } as any);
  }

  async void(id: string): Promise<RecoveryExecutionReadinessBoardCard> {
    return this.update(id, { cardStatus: 'voided', voidedAt: new Date().toISOString() } as any);
  }
}

export class InMemoryRecoveryExecutionReadinessBoardFilterPresetRepository implements RecoveryExecutionReadinessBoardFilterPresetRepository {
  private store = new Map<string, RecoveryExecutionReadinessBoardFilterPreset>();

  async create(data: Partial<RecoveryExecutionReadinessBoardFilterPreset>): Promise<RecoveryExecutionReadinessBoardFilterPreset> {
    const now = new Date().toISOString();
    const record: RecoveryExecutionReadinessBoardFilterPreset = {
      ...data as RecoveryExecutionReadinessBoardFilterPreset,
      boardFilterPresetId: data.boardFilterPresetId || simpleId(),
      presetStatus: data.presetStatus || 'active',
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
    };
    this.store.set(record.boardFilterPresetId, record);
    return record;
  }

  async getById(id: string): Promise<RecoveryExecutionReadinessBoardFilterPreset | null> {
    return this.store.get(id) ?? null;
  }

  async listBySchool(schoolId: string): Promise<RecoveryExecutionReadinessBoardFilterPreset[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByActor(schoolId: string, actorId: string): Promise<RecoveryExecutionReadinessBoardFilterPreset[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.actorId === actorId);
  }

  async listByRole(schoolId: string, role: string): Promise<RecoveryExecutionReadinessBoardFilterPreset[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.actorRole === role);
  }

  async update(id: string, data: Partial<RecoveryExecutionReadinessBoardFilterPreset>): Promise<RecoveryExecutionReadinessBoardFilterPreset> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`FilterPreset ${id} not found`);
    const updated: RecoveryExecutionReadinessBoardFilterPreset = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
  }

  async suppress(id: string): Promise<RecoveryExecutionReadinessBoardFilterPreset> {
    return this.update(id, { presetStatus: 'suppressed' } as any);
  }

  async void(id: string): Promise<RecoveryExecutionReadinessBoardFilterPreset> {
    return this.update(id, { presetStatus: 'voided' } as any);
  }
}

export class InMemoryRecoveryExecutionReadinessBoardRiskSignalRepository implements RecoveryExecutionReadinessBoardRiskSignalRepository {
  private store = new Map<string, RecoveryExecutionReadinessBoardRiskSignal>();

  async create(data: Partial<RecoveryExecutionReadinessBoardRiskSignal>): Promise<RecoveryExecutionReadinessBoardRiskSignal> {
    const now = new Date().toISOString();
    const record: RecoveryExecutionReadinessBoardRiskSignal = {
      ...data as RecoveryExecutionReadinessBoardRiskSignal,
      boardRiskSignalId: data.boardRiskSignalId || simpleId(),
      riskLevel: data.riskLevel || 'low',
      riskStatus: data.riskStatus || 'open',
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
    };
    this.store.set(record.boardRiskSignalId, record);
    return record;
  }

  async getById(id: string): Promise<RecoveryExecutionReadinessBoardRiskSignal | null> {
    return this.store.get(id) ?? null;
  }

  async listBySnapshotId(snapshotId: string): Promise<RecoveryExecutionReadinessBoardRiskSignal[]> {
    return Array.from(this.store.values()).filter(r => r.boardSnapshotId === snapshotId);
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryExecutionReadinessBoardRiskSignal[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.studentRef === studentRef);
  }

  async listByPlanId(planId: string): Promise<RecoveryExecutionReadinessBoardRiskSignal[]> {
    return Array.from(this.store.values()).filter(r => r.resultRecoveryPlanId === planId);
  }

  async listByRiskLevel(riskLevel: string): Promise<RecoveryExecutionReadinessBoardRiskSignal[]> {
    return Array.from(this.store.values()).filter(r => r.riskLevel === riskLevel);
  }

  async update(id: string, data: Partial<RecoveryExecutionReadinessBoardRiskSignal>): Promise<RecoveryExecutionReadinessBoardRiskSignal> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`RiskSignal ${id} not found`);
    const updated: RecoveryExecutionReadinessBoardRiskSignal = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
  }

  async markReviewReady(id: string): Promise<RecoveryExecutionReadinessBoardRiskSignal> {
    return this.update(id, { riskStatus: 'review_ready' } as any);
  }

  async suppress(id: string): Promise<RecoveryExecutionReadinessBoardRiskSignal> {
    return this.update(id, { riskStatus: 'suppressed' } as any);
  }

  async block(id: string): Promise<RecoveryExecutionReadinessBoardRiskSignal> {
    return this.update(id, { riskStatus: 'blocked' } as any);
  }

  async void(id: string): Promise<RecoveryExecutionReadinessBoardRiskSignal> {
    return this.update(id, { riskStatus: 'voided', voidedAt: new Date().toISOString() } as any);
  }
}

export class InMemoryRecoveryExecutionReadinessBoardBlockerRepository implements RecoveryExecutionReadinessBoardBlockerRepository {
  private store = new Map<string, RecoveryExecutionReadinessBoardBlocker>();

  async create(data: Partial<RecoveryExecutionReadinessBoardBlocker>): Promise<RecoveryExecutionReadinessBoardBlocker> {
    const now = new Date().toISOString();
    const record: RecoveryExecutionReadinessBoardBlocker = {
      ...data as RecoveryExecutionReadinessBoardBlocker,
      boardBlockerId: data.boardBlockerId || simpleId(),
      blockerStatus: data.blockerStatus || 'open',
      blockerPriority: data.blockerPriority || 'normal',
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
    };
    this.store.set(record.boardBlockerId, record);
    return record;
  }

  async getById(id: string): Promise<RecoveryExecutionReadinessBoardBlocker | null> {
    return this.store.get(id) ?? null;
  }

  async listBySnapshotId(snapshotId: string): Promise<RecoveryExecutionReadinessBoardBlocker[]> {
    return Array.from(this.store.values()).filter(r => r.boardSnapshotId === snapshotId);
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryExecutionReadinessBoardBlocker[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.studentRef === studentRef);
  }

  async listByPlanId(planId: string): Promise<RecoveryExecutionReadinessBoardBlocker[]> {
    return Array.from(this.store.values()).filter(r => r.resultRecoveryPlanId === planId);
  }

  async listByStatus(status: string): Promise<RecoveryExecutionReadinessBoardBlocker[]> {
    return Array.from(this.store.values()).filter(r => r.blockerStatus === status);
  }

  async update(id: string, data: Partial<RecoveryExecutionReadinessBoardBlocker>): Promise<RecoveryExecutionReadinessBoardBlocker> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`Blocker ${id} not found`);
    const updated: RecoveryExecutionReadinessBoardBlocker = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
  }

  async markReviewReady(id: string): Promise<RecoveryExecutionReadinessBoardBlocker> {
    return this.update(id, { blockerStatus: 'review_ready' } as any);
  }

  async resolve(id: string): Promise<RecoveryExecutionReadinessBoardBlocker> {
    return this.update(id, { blockerStatus: 'resolved', resolvedAt: new Date().toISOString() } as any);
  }

  async suppress(id: string): Promise<RecoveryExecutionReadinessBoardBlocker> {
    return this.update(id, { blockerStatus: 'suppressed' } as any);
  }

  async void(id: string): Promise<RecoveryExecutionReadinessBoardBlocker> {
    return this.update(id, { blockerStatus: 'voided', voidedAt: new Date().toISOString() } as any);
  }
}

export class InMemoryRecoveryExecutionReadinessBoardGovernanceNoteRepository implements RecoveryExecutionReadinessBoardGovernanceNoteRepository {
  private store = new Map<string, RecoveryExecutionReadinessBoardGovernanceNote>();

  async create(data: Partial<RecoveryExecutionReadinessBoardGovernanceNote>): Promise<RecoveryExecutionReadinessBoardGovernanceNote> {
    const now = new Date().toISOString();
    const record: RecoveryExecutionReadinessBoardGovernanceNote = {
      ...data as RecoveryExecutionReadinessBoardGovernanceNote,
      boardGovernanceNoteId: data.boardGovernanceNoteId || simpleId(),
      noteStatus: data.noteStatus || 'draft',
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
    };
    this.store.set(record.boardGovernanceNoteId, record);
    return record;
  }

  async getById(id: string): Promise<RecoveryExecutionReadinessBoardGovernanceNote | null> {
    return this.store.get(id) ?? null;
  }

  async listBySnapshotId(snapshotId: string): Promise<RecoveryExecutionReadinessBoardGovernanceNote[]> {
    return Array.from(this.store.values()).filter(r => r.boardSnapshotId === snapshotId);
  }

  async listByPlanId(planId: string): Promise<RecoveryExecutionReadinessBoardGovernanceNote[]> {
    return Array.from(this.store.values()).filter(r => r.resultRecoveryPlanId === planId);
  }

  async listByActor(actorId: string): Promise<RecoveryExecutionReadinessBoardGovernanceNote[]> {
    return Array.from(this.store.values()).filter(r => r.createdByActorId === actorId);
  }

  async update(id: string, data: Partial<RecoveryExecutionReadinessBoardGovernanceNote>): Promise<RecoveryExecutionReadinessBoardGovernanceNote> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`GovernanceNote ${id} not found`);
    const updated: RecoveryExecutionReadinessBoardGovernanceNote = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
  }

  async markReviewReady(id: string): Promise<RecoveryExecutionReadinessBoardGovernanceNote> {
    return this.update(id, { noteStatus: 'review_ready' } as any);
  }

  async suppress(id: string): Promise<RecoveryExecutionReadinessBoardGovernanceNote> {
    return this.update(id, { noteStatus: 'suppressed' } as any);
  }

  async void(id: string): Promise<RecoveryExecutionReadinessBoardGovernanceNote> {
    return this.update(id, { noteStatus: 'voided', voidedAt: new Date().toISOString() } as any);
  }
}

export class InMemoryRecoveryExecutionReadinessBoardRoleProjectionRepository implements RecoveryExecutionReadinessBoardRoleProjectionRepository {
  private store = new Map<string, RecoveryExecutionReadinessBoardRoleProjection>();

  async create(data: Partial<RecoveryExecutionReadinessBoardRoleProjection>): Promise<RecoveryExecutionReadinessBoardRoleProjection> {
    const now = new Date().toISOString();
    const record: RecoveryExecutionReadinessBoardRoleProjection = {
      ...data as RecoveryExecutionReadinessBoardRoleProjection,
      boardRoleProjectionId: data.boardRoleProjectionId || simpleId(),
      projectionStatus: data.projectionStatus || 'draft',
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
    };
    this.store.set(record.boardRoleProjectionId, record);
    return record;
  }

  async getById(id: string): Promise<RecoveryExecutionReadinessBoardRoleProjection | null> {
    return this.store.get(id) ?? null;
  }

  async listBySnapshotId(snapshotId: string): Promise<RecoveryExecutionReadinessBoardRoleProjection[]> {
    return Array.from(this.store.values()).filter(r => r.boardSnapshotId === snapshotId);
  }

  async listByRole(role: string): Promise<RecoveryExecutionReadinessBoardRoleProjection[]> {
    return Array.from(this.store.values()).filter(r => r.targetRole === role);
  }

  async listByActor(actorId: string): Promise<RecoveryExecutionReadinessBoardRoleProjection[]> {
    return Array.from(this.store.values()).filter(r => r.actorId === actorId);
  }

  async update(id: string, data: Partial<RecoveryExecutionReadinessBoardRoleProjection>): Promise<RecoveryExecutionReadinessBoardRoleProjection> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`RoleProjection ${id} not found`);
    const updated: RecoveryExecutionReadinessBoardRoleProjection = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
  }

  async markReviewReady(id: string): Promise<RecoveryExecutionReadinessBoardRoleProjection> {
    return this.update(id, { projectionStatus: 'review_ready' } as any);
  }

  async suppress(id: string): Promise<RecoveryExecutionReadinessBoardRoleProjection> {
    return this.update(id, { projectionStatus: 'suppressed' } as any);
  }

  async block(id: string): Promise<RecoveryExecutionReadinessBoardRoleProjection> {
    return this.update(id, { projectionStatus: 'blocked' } as any);
  }

  async void(id: string): Promise<RecoveryExecutionReadinessBoardRoleProjection> {
    return this.update(id, { projectionStatus: 'voided', voidedAt: new Date().toISOString() } as any);
  }
}

export class InMemoryRecoveryExecutionReadinessBoardTeacherQueueRepository implements RecoveryExecutionReadinessBoardTeacherQueueRepository {
  private store = new Map<string, RecoveryExecutionReadinessBoardTeacherQueue>();

  async create(data: Partial<RecoveryExecutionReadinessBoardTeacherQueue>): Promise<RecoveryExecutionReadinessBoardTeacherQueue> {
    const now = new Date().toISOString();
    const record: RecoveryExecutionReadinessBoardTeacherQueue = {
      ...data as RecoveryExecutionReadinessBoardTeacherQueue,
      boardTeacherQueueId: data.boardTeacherQueueId || simpleId(),
      queueStatus: data.queueStatus || 'draft',
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
    };
    this.store.set(record.boardTeacherQueueId, record);
    return record;
  }

  async getById(id: string): Promise<RecoveryExecutionReadinessBoardTeacherQueue | null> {
    return this.store.get(id) ?? null;
  }

  async listBySchool(schoolId: string): Promise<RecoveryExecutionReadinessBoardTeacherQueue[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByTeacher(teacherRef: string): Promise<RecoveryExecutionReadinessBoardTeacherQueue[]> {
    return Array.from(this.store.values()).filter(r => r.teacherRef === teacherRef);
  }

  async update(id: string, data: Partial<RecoveryExecutionReadinessBoardTeacherQueue>): Promise<RecoveryExecutionReadinessBoardTeacherQueue> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`TeacherQueue ${id} not found`);
    const updated: RecoveryExecutionReadinessBoardTeacherQueue = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
  }

  async markReviewReady(id: string): Promise<RecoveryExecutionReadinessBoardTeacherQueue> {
    return this.update(id, { queueStatus: 'review_ready' } as any);
  }

  async refresh(id: string): Promise<RecoveryExecutionReadinessBoardTeacherQueue> {
    return this.update(id, { queueStatus: 'active' } as any);
  }

  async block(id: string): Promise<RecoveryExecutionReadinessBoardTeacherQueue> {
    return this.update(id, { queueStatus: 'blocked' } as any);
  }

  async void(id: string): Promise<RecoveryExecutionReadinessBoardTeacherQueue> {
    return this.update(id, { queueStatus: 'voided', voidedAt: new Date().toISOString() } as any);
  }
}

export class InMemoryRecoveryExecutionReadinessBoardAdminQueueRepository implements RecoveryExecutionReadinessBoardAdminQueueRepository {
  private store = new Map<string, RecoveryExecutionReadinessBoardAdminQueue>();

  async create(data: Partial<RecoveryExecutionReadinessBoardAdminQueue>): Promise<RecoveryExecutionReadinessBoardAdminQueue> {
    const now = new Date().toISOString();
    const record: RecoveryExecutionReadinessBoardAdminQueue = {
      ...data as RecoveryExecutionReadinessBoardAdminQueue,
      boardAdminQueueId: data.boardAdminQueueId || simpleId(),
      queueStatus: data.queueStatus || 'draft',
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
    };
    this.store.set(record.boardAdminQueueId, record);
    return record;
  }

  async getById(id: string): Promise<RecoveryExecutionReadinessBoardAdminQueue | null> {
    return this.store.get(id) ?? null;
  }

  async listBySchool(schoolId: string): Promise<RecoveryExecutionReadinessBoardAdminQueue[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByAdmin(adminRef: string): Promise<RecoveryExecutionReadinessBoardAdminQueue[]> {
    return Array.from(this.store.values()).filter(r => r.adminRef === adminRef);
  }

  async update(id: string, data: Partial<RecoveryExecutionReadinessBoardAdminQueue>): Promise<RecoveryExecutionReadinessBoardAdminQueue> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`AdminQueue ${id} not found`);
    const updated: RecoveryExecutionReadinessBoardAdminQueue = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
  }

  async markReviewReady(id: string): Promise<RecoveryExecutionReadinessBoardAdminQueue> {
    return this.update(id, { queueStatus: 'review_ready' } as any);
  }

  async refresh(id: string): Promise<RecoveryExecutionReadinessBoardAdminQueue> {
    return this.update(id, { queueStatus: 'active' } as any);
  }

  async block(id: string): Promise<RecoveryExecutionReadinessBoardAdminQueue> {
    return this.update(id, { queueStatus: 'blocked' } as any);
  }

  async void(id: string): Promise<RecoveryExecutionReadinessBoardAdminQueue> {
    return this.update(id, { queueStatus: 'voided', voidedAt: new Date().toISOString() } as any);
  }
}

export class InMemoryRecoveryExecutionReadinessBoardStudentSafeStatusDraftRepository implements RecoveryExecutionReadinessBoardStudentSafeStatusDraftRepository {
  private store = new Map<string, RecoveryExecutionReadinessBoardStudentSafeStatusDraft>();

  async create(data: Partial<RecoveryExecutionReadinessBoardStudentSafeStatusDraft>): Promise<RecoveryExecutionReadinessBoardStudentSafeStatusDraft> {
    const now = new Date().toISOString();
    const record: RecoveryExecutionReadinessBoardStudentSafeStatusDraft = {
      ...data as RecoveryExecutionReadinessBoardStudentSafeStatusDraft,
      boardStudentSafeDraftId: data.boardStudentSafeDraftId || simpleId(),
      draftStatus: data.draftStatus || 'draft',
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
    };
    this.store.set(record.boardStudentSafeDraftId, record);
    return record;
  }

  async getById(id: string): Promise<RecoveryExecutionReadinessBoardStudentSafeStatusDraft | null> {
    return this.store.get(id) ?? null;
  }

  async listByPlanId(planId: string): Promise<RecoveryExecutionReadinessBoardStudentSafeStatusDraft[]> {
    return Array.from(this.store.values()).filter(r => r.resultRecoveryPlanId === planId);
  }

  async update(id: string, data: Partial<RecoveryExecutionReadinessBoardStudentSafeStatusDraft>): Promise<RecoveryExecutionReadinessBoardStudentSafeStatusDraft> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`StudentSafeStatusDraft ${id} not found`);
    const updated: RecoveryExecutionReadinessBoardStudentSafeStatusDraft = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
  }

  async markReviewReady(id: string): Promise<RecoveryExecutionReadinessBoardStudentSafeStatusDraft> {
    return this.update(id, { draftStatus: 'review_ready' } as any);
  }

  async suppress(id: string): Promise<RecoveryExecutionReadinessBoardStudentSafeStatusDraft> {
    return this.update(id, { draftStatus: 'suppressed' } as any);
  }

  async block(id: string): Promise<RecoveryExecutionReadinessBoardStudentSafeStatusDraft> {
    return this.update(id, { draftStatus: 'blocked' } as any);
  }

  async void(id: string): Promise<RecoveryExecutionReadinessBoardStudentSafeStatusDraft> {
    return this.update(id, { draftStatus: 'voided', voidedAt: new Date().toISOString() } as any);
  }
}

export class InMemoryRecoveryExecutionReadinessBoardParentSafeStatusDraftRepository implements RecoveryExecutionReadinessBoardParentSafeStatusDraftRepository {
  private store = new Map<string, RecoveryExecutionReadinessBoardParentSafeStatusDraft>();

  async create(data: Partial<RecoveryExecutionReadinessBoardParentSafeStatusDraft>): Promise<RecoveryExecutionReadinessBoardParentSafeStatusDraft> {
    const now = new Date().toISOString();
    const record: RecoveryExecutionReadinessBoardParentSafeStatusDraft = {
      ...data as RecoveryExecutionReadinessBoardParentSafeStatusDraft,
      boardParentSafeDraftId: data.boardParentSafeDraftId || simpleId(),
      draftStatus: data.draftStatus || 'draft',
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
    };
    this.store.set(record.boardParentSafeDraftId, record);
    return record;
  }

  async getById(id: string): Promise<RecoveryExecutionReadinessBoardParentSafeStatusDraft | null> {
    return this.store.get(id) ?? null;
  }

  async listByPlanId(planId: string): Promise<RecoveryExecutionReadinessBoardParentSafeStatusDraft[]> {
    return Array.from(this.store.values()).filter(r => r.resultRecoveryPlanId === planId);
  }

  async update(id: string, data: Partial<RecoveryExecutionReadinessBoardParentSafeStatusDraft>): Promise<RecoveryExecutionReadinessBoardParentSafeStatusDraft> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`ParentSafeStatusDraft ${id} not found`);
    const updated: RecoveryExecutionReadinessBoardParentSafeStatusDraft = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
  }

  async markReviewReady(id: string): Promise<RecoveryExecutionReadinessBoardParentSafeStatusDraft> {
    return this.update(id, { draftStatus: 'review_ready' } as any);
  }

  async suppress(id: string): Promise<RecoveryExecutionReadinessBoardParentSafeStatusDraft> {
    return this.update(id, { draftStatus: 'suppressed' } as any);
  }

  async block(id: string): Promise<RecoveryExecutionReadinessBoardParentSafeStatusDraft> {
    return this.update(id, { draftStatus: 'blocked' } as any);
  }

  async void(id: string): Promise<RecoveryExecutionReadinessBoardParentSafeStatusDraft> {
    return this.update(id, { draftStatus: 'voided', voidedAt: new Date().toISOString() } as any);
  }
}

export class InMemoryRecoveryExecutionReadinessBoardRefreshJobRepository implements RecoveryExecutionReadinessBoardRefreshJobRepository {
  private store = new Map<string, RecoveryExecutionReadinessBoardRefreshJob>();

  async create(data: Partial<RecoveryExecutionReadinessBoardRefreshJob>): Promise<RecoveryExecutionReadinessBoardRefreshJob> {
    const now = new Date().toISOString();
    const record: RecoveryExecutionReadinessBoardRefreshJob = {
      ...data as RecoveryExecutionReadinessBoardRefreshJob,
      boardRefreshJobId: data.boardRefreshJobId || simpleId(),
      jobStatus: data.jobStatus || 'pending',
      snapshotsRefreshed: data.snapshotsRefreshed || 0,
      lanesRefreshed: data.lanesRefreshed || 0,
      cardsRefreshed: data.cardsRefreshed || 0,
      blockersRefreshed: data.blockersRefreshed || 0,
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
    };
    this.store.set(record.boardRefreshJobId, record);
    return record;
  }

  async getById(id: string): Promise<RecoveryExecutionReadinessBoardRefreshJob | null> {
    return this.store.get(id) ?? null;
  }

  async listBySchool(schoolId: string): Promise<RecoveryExecutionReadinessBoardRefreshJob[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listBySnapshotId(snapshotId: string): Promise<RecoveryExecutionReadinessBoardRefreshJob[]> {
    return Array.from(this.store.values()).filter(r => r.boardSnapshotId === snapshotId);
  }

  async listByStatus(status: string): Promise<RecoveryExecutionReadinessBoardRefreshJob[]> {
    return Array.from(this.store.values()).filter(r => r.jobStatus === status);
  }

  async update(id: string, data: Partial<RecoveryExecutionReadinessBoardRefreshJob>): Promise<RecoveryExecutionReadinessBoardRefreshJob> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`RefreshJob ${id} not found`);
    const updated: RecoveryExecutionReadinessBoardRefreshJob = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
  }

  async markRunning(id: string): Promise<RecoveryExecutionReadinessBoardRefreshJob> {
    return this.update(id, { jobStatus: 'running' } as any);
  }

  async markCompleted(id: string): Promise<RecoveryExecutionReadinessBoardRefreshJob> {
    return this.update(id, { jobStatus: 'completed', completedAt: new Date().toISOString() } as any);
  }

  async markFailed(id: string): Promise<RecoveryExecutionReadinessBoardRefreshJob> {
    return this.update(id, { jobStatus: 'failed' } as any);
  }

  async void(id: string): Promise<RecoveryExecutionReadinessBoardRefreshJob> {
    return this.update(id, { jobStatus: 'voided', voidedAt: new Date().toISOString() } as any);
  }
}

export class InMemoryRecoveryExecutionReadinessBoardSummaryRepository implements RecoveryExecutionReadinessBoardSummaryRepository {
  private store = new Map<string, RecoveryExecutionReadinessBoardSummary>();

  async create(data: Partial<RecoveryExecutionReadinessBoardSummary>): Promise<RecoveryExecutionReadinessBoardSummary> {
    const now = new Date().toISOString();
    const record: RecoveryExecutionReadinessBoardSummary = {
      ...data as RecoveryExecutionReadinessBoardSummary,
      boardSummaryId: data.boardSummaryId || simpleId(),
      summaryStatus: data.summaryStatus || 'draft',
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
    };
    this.store.set(record.boardSummaryId, record);
    return record;
  }

  async getById(id: string): Promise<RecoveryExecutionReadinessBoardSummary | null> {
    return this.store.get(id) ?? null;
  }

  async listBySchool(schoolId: string): Promise<RecoveryExecutionReadinessBoardSummary[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryExecutionReadinessBoardSummary[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.studentRef === studentRef);
  }

  async listByPlanId(planId: string): Promise<RecoveryExecutionReadinessBoardSummary[]> {
    return Array.from(this.store.values()).filter(r => r.resultRecoveryPlanId === planId);
  }

  async update(id: string, data: Partial<RecoveryExecutionReadinessBoardSummary>): Promise<RecoveryExecutionReadinessBoardSummary> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`BoardSummary ${id} not found`);
    const updated: RecoveryExecutionReadinessBoardSummary = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
  }

  async markStale(id: string): Promise<RecoveryExecutionReadinessBoardSummary> {
    return this.update(id, { summaryStatus: 'stale' } as any);
  }

  async markReviewReady(id: string): Promise<RecoveryExecutionReadinessBoardSummary> {
    return this.update(id, { summaryStatus: 'review_ready' } as any);
  }

  async block(id: string): Promise<RecoveryExecutionReadinessBoardSummary> {
    return this.update(id, { summaryStatus: 'blocked' } as any);
  }

  async void(id: string): Promise<RecoveryExecutionReadinessBoardSummary> {
    return this.update(id, { summaryStatus: 'voided', voidedAt: new Date().toISOString() } as any);
  }
}

interface AuditRecord {
  auditEventId: string;
  schoolId: string;
  snapshotId?: string;
  eventType: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export class InMemoryRecoveryExecutionReadinessBoardAuditRepository implements RecoveryExecutionReadinessBoardAuditRepository {
  private store = new Map<string, AuditRecord>();

  async create(data: Partial<any>): Promise<any> {
    const now = new Date().toISOString();
    const record = {
      ...data,
      auditEventId: data.auditEventId || simpleId(),
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
    } as AuditRecord;
    this.store.set(record.auditEventId, record);
    return record;
  }

  async listBySchool(schoolId: string): Promise<any[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listBySnapshotId(snapshotId: string): Promise<any[]> {
    return Array.from(this.store.values()).filter(r => r.snapshotId === snapshotId);
  }
}

interface IdempotencyRecord {
  idempotencyId: string;
  schoolId: string;
  operation: string;
  idempotencyKey: string;
  status: string;
  resultSummary?: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export class InMemoryRecoveryExecutionReadinessBoardIdempotencyRepository implements RecoveryExecutionReadinessBoardIdempotencyRepository {
  private store = new Map<string, IdempotencyRecord>();

  async create(data: Partial<any>): Promise<any> {
    const now = new Date().toISOString();
    const record = {
      ...data,
      idempotencyId: data.idempotencyId || simpleId(),
      status: data.status || 'pending',
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
    } as IdempotencyRecord;
    this.store.set(record.idempotencyId, record);
    return record;
  }

  async getByIdempotencyKey(schoolId: string, operation: string, idempotencyKey: string): Promise<any | null> {
    return Array.from(this.store.values())
      .find(r => r.schoolId === schoolId && r.operation === operation && r.idempotencyKey === idempotencyKey) ?? null;
  }

  async update(id: string, data: Partial<any>): Promise<any> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`IdempotencyRecord ${id} not found`);
    const updated = { ...existing, ...data, updatedAt: new Date().toISOString() } as IdempotencyRecord;
    this.store.set(id, updated);
    return updated;
  }

  async complete(id: string, resultSummary?: string): Promise<any> {
    return this.update(id, { status: 'completed', ...(resultSummary !== undefined ? { resultSummary } : {}) });
  }
}

export class InMemoryRecoveryExecutionReadinessBoardRepositories {
  boardSnapshot: InMemoryRecoveryExecutionReadinessBoardSnapshotRepository;
  boardLane: InMemoryRecoveryExecutionReadinessBoardLaneRepository;
  boardCard: InMemoryRecoveryExecutionReadinessBoardCardRepository;
  filterPreset: InMemoryRecoveryExecutionReadinessBoardFilterPresetRepository;
  riskSignal: InMemoryRecoveryExecutionReadinessBoardRiskSignalRepository;
  blocker: InMemoryRecoveryExecutionReadinessBoardBlockerRepository;
  governanceNote: InMemoryRecoveryExecutionReadinessBoardGovernanceNoteRepository;
  roleProjection: InMemoryRecoveryExecutionReadinessBoardRoleProjectionRepository;
  teacherQueue: InMemoryRecoveryExecutionReadinessBoardTeacherQueueRepository;
  adminQueue: InMemoryRecoveryExecutionReadinessBoardAdminQueueRepository;
  studentSafeStatusDraft: InMemoryRecoveryExecutionReadinessBoardStudentSafeStatusDraftRepository;
  parentSafeStatusDraft: InMemoryRecoveryExecutionReadinessBoardParentSafeStatusDraftRepository;
  refreshJob: InMemoryRecoveryExecutionReadinessBoardRefreshJobRepository;
  summary: InMemoryRecoveryExecutionReadinessBoardSummaryRepository;
  audit: InMemoryRecoveryExecutionReadinessBoardAuditRepository;
  idempotency: InMemoryRecoveryExecutionReadinessBoardIdempotencyRepository;

  constructor() {
    this.boardSnapshot = new InMemoryRecoveryExecutionReadinessBoardSnapshotRepository();
    this.boardLane = new InMemoryRecoveryExecutionReadinessBoardLaneRepository();
    this.boardCard = new InMemoryRecoveryExecutionReadinessBoardCardRepository();
    this.filterPreset = new InMemoryRecoveryExecutionReadinessBoardFilterPresetRepository();
    this.riskSignal = new InMemoryRecoveryExecutionReadinessBoardRiskSignalRepository();
    this.blocker = new InMemoryRecoveryExecutionReadinessBoardBlockerRepository();
    this.governanceNote = new InMemoryRecoveryExecutionReadinessBoardGovernanceNoteRepository();
    this.roleProjection = new InMemoryRecoveryExecutionReadinessBoardRoleProjectionRepository();
    this.teacherQueue = new InMemoryRecoveryExecutionReadinessBoardTeacherQueueRepository();
    this.adminQueue = new InMemoryRecoveryExecutionReadinessBoardAdminQueueRepository();
    this.studentSafeStatusDraft = new InMemoryRecoveryExecutionReadinessBoardStudentSafeStatusDraftRepository();
    this.parentSafeStatusDraft = new InMemoryRecoveryExecutionReadinessBoardParentSafeStatusDraftRepository();
    this.refreshJob = new InMemoryRecoveryExecutionReadinessBoardRefreshJobRepository();
    this.summary = new InMemoryRecoveryExecutionReadinessBoardSummaryRepository();
    this.audit = new InMemoryRecoveryExecutionReadinessBoardAuditRepository();
    this.idempotency = new InMemoryRecoveryExecutionReadinessBoardIdempotencyRepository();
  }
}
