import {
  RecoveryCaseTriageReadiness,
  RecoveryCasePriorityAssessment,
  RecoveryCasePriorityFactor,
  RecoveryCaseFairnessCheck,
  RecoveryCaseCapacitySnapshot,
  RecoveryCaseTriageQueueSnapshot,
  RecoveryCaseTriageQueueItem,
  RecoveryCaseWorkloadAllocationDraft,
  RecoveryCaseEscalationDraft,
  RecoveryCaseReviewWindowDraft,
  RecoveryCaseQueueExplanation,
  RecoveryCaseDuplicateSuppression,
  RecoveryCaseTriageSummary,
} from '../contracts/index';
import {
  RecoveryCaseTriageReadinessRepository,
  RecoveryCasePriorityAssessmentRepository,
  RecoveryCasePriorityFactorRepository,
  RecoveryCaseFairnessCheckRepository,
  RecoveryCaseCapacitySnapshotRepository,
  RecoveryCaseTriageQueueSnapshotRepository,
  RecoveryCaseTriageQueueItemRepository,
  RecoveryCaseWorkloadAllocationDraftRepository,
  RecoveryCaseEscalationDraftRepository,
  RecoveryCaseReviewWindowDraftRepository,
  RecoveryCaseQueueExplanationRepository,
  RecoveryCaseDuplicateSuppressionRepository,
  RecoveryCaseTriageSummaryRepository,
  RecoveryCaseTriageAuditEvent,
  RecoveryCaseTriageAuditRepository,
  RecoveryCaseTriageIdempotencyEntry,
  RecoveryCaseTriageIdempotencyRepository,
} from '../contracts/recoveryCaseTriageRepositoryContracts';

function simpleId(): string {
  return Date.now().toString() + Math.random().toString();
}
export class InMemoryRecoveryCaseTriageReadinessRepository implements RecoveryCaseTriageReadinessRepository {
  private store = new Map<string, RecoveryCaseTriageReadiness>();

  async create(data: Partial<RecoveryCaseTriageReadiness> & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<RecoveryCaseTriageReadiness> {
    const now = new Date().toISOString();
    const record: RecoveryCaseTriageReadiness = {
      ...data as RecoveryCaseTriageReadiness,
      triageReadinessId: data.triageReadinessId || simpleId(),
      triageStatus: data.triageStatus || 'draft',
      blockedReasonCodesJson: data.blockedReasonCodesJson || [],
      sourceRefsJson: data.sourceRefsJson || {},
      readinessChecksJson: data.readinessChecksJson || {},
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
    };
    this.store.set(record.triageReadinessId, record);
    return record;
  }

  async getById(id: string): Promise<RecoveryCaseTriageReadiness | null> {
    return this.store.get(id) ?? null;
  }

  async listBySchool(schoolId: string): Promise<RecoveryCaseTriageReadiness[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryCaseTriageReadiness[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.studentRef === studentRef);
  }

  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryCaseTriageReadiness[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultRecoveryPlanId === planId);
  }

  async listByBoardSnapshotId(schoolId: string, boardSnapshotId: string): Promise<RecoveryCaseTriageReadiness[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.boardSnapshotId === boardSnapshotId);
  }

  async listByBoardCardId(schoolId: string, boardCardId: string): Promise<RecoveryCaseTriageReadiness[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.boardCardId === boardCardId);
  }

  async listByStatus(schoolId: string, status: string): Promise<RecoveryCaseTriageReadiness[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.triageStatus === status);
  }

  async update(id: string, data: Partial<RecoveryCaseTriageReadiness>): Promise<RecoveryCaseTriageReadiness> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`TriageReadiness ${id} not found`);
    const updated: RecoveryCaseTriageReadiness = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
  }

  async updateStatus(id: string, status: string): Promise<RecoveryCaseTriageReadiness> {
    return this.update(id, { triageStatus: status } as any);
  }

  async markReady(id: string): Promise<RecoveryCaseTriageReadiness> {
    return this.update(id, { triageStatus: 'ready' } as any);
  }

  async markReviewReady(id: string): Promise<RecoveryCaseTriageReadiness> {
    return this.update(id, { triageStatus: 'review_ready' } as any);
  }

  async markStale(id: string): Promise<RecoveryCaseTriageReadiness> {
    return this.update(id, { triageStatus: 'stale' } as any);
  }

  async block(id: string, reasonCode: string, safeMessage: string): Promise<RecoveryCaseTriageReadiness> {
    return this.update(id, { triageStatus: 'blocked', blockedReasonCodesJson: [reasonCode] } as any);
  }

  async suppress(id: string, reasonCode: string, safeMessage: string): Promise<RecoveryCaseTriageReadiness> {
    return this.update(id, { triageStatus: 'suppressed', blockedReasonCodesJson: [reasonCode] } as any);
  }

  async void(id: string, reasonCode: string, safeMessage: string): Promise<RecoveryCaseTriageReadiness> {
    return this.update(id, { triageStatus: 'void', blockedReasonCodesJson: [reasonCode], voidedAt: new Date().toISOString() } as any);
  }
}

export class InMemoryRecoveryCasePriorityAssessmentRepository implements RecoveryCasePriorityAssessmentRepository {
  private store = new Map<string, RecoveryCasePriorityAssessment>();

  async create(data: Partial<RecoveryCasePriorityAssessment> & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<RecoveryCasePriorityAssessment> {
    const now = new Date().toISOString();
    const record: RecoveryCasePriorityAssessment = {
      ...data as RecoveryCasePriorityAssessment,
      priorityAssessmentId: data.priorityAssessmentId || simpleId(),
      priorityStatus: data.priorityStatus || 'draft',
      totalScore: data.totalScore ?? 0,
      priorityBand: data.priorityBand || 'normal',
      riskRank: data.riskRank || 'low',
      scoringPolicyVersion: data.scoringPolicyVersion || 'RECOVERY_CASE_TRIAGE_PRIORITY_V1',
      priorityFactorsJson: data.priorityFactorsJson || {},
      decision: data.decision || '',
      blockedReasonCodesJson: data.blockedReasonCodesJson || [],
      sourceRefsJson: data.sourceRefsJson || {},
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
    };
    this.store.set(record.priorityAssessmentId, record);
    return record;
  }

  async getById(id: string): Promise<RecoveryCasePriorityAssessment | null> {
    return this.store.get(id) ?? null;
  }

  async listBySchool(schoolId: string): Promise<RecoveryCasePriorityAssessment[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryCasePriorityAssessment[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.studentRef === studentRef);
  }

  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryCasePriorityAssessment[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultRecoveryPlanId === planId);
  }

  async listByBoardSnapshotId(schoolId: string, boardSnapshotId: string): Promise<RecoveryCasePriorityAssessment[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.boardSnapshotId === boardSnapshotId);
  }

  async listByBoardCardId(schoolId: string, boardCardId: string): Promise<RecoveryCasePriorityAssessment[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.boardCardId === boardCardId);
  }

  async listByBand(schoolId: string, band: string): Promise<RecoveryCasePriorityAssessment[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.priorityBand === band);
  }

  async listByStatus(schoolId: string, status: string): Promise<RecoveryCasePriorityAssessment[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.priorityStatus === status);
  }

  async update(id: string, data: Partial<RecoveryCasePriorityAssessment>): Promise<RecoveryCasePriorityAssessment> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`PriorityAssessment ${id} not found`);
    const updated: RecoveryCasePriorityAssessment = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
  }

  async updateStatus(id: string, status: string): Promise<RecoveryCasePriorityAssessment> {
    return this.update(id, { priorityStatus: status } as any);
  }

  async markScored(id: string): Promise<RecoveryCasePriorityAssessment> {
    return this.update(id, { priorityStatus: 'scored', scoredAt: new Date().toISOString() } as any);
  }

  async markReviewReady(id: string): Promise<RecoveryCasePriorityAssessment> {
    return this.update(id, { priorityStatus: 'review_ready', reviewReadyAt: new Date().toISOString() } as any);
  }

  async markStale(id: string): Promise<RecoveryCasePriorityAssessment> {
    return this.update(id, { priorityStatus: 'stale', staleAt: new Date().toISOString() } as any);
  }

  async block(id: string, reasonCode: string, safeMessage: string): Promise<RecoveryCasePriorityAssessment> {
    return this.update(id, { priorityStatus: 'blocked', blockedReasonCodesJson: [reasonCode], blockedAt: new Date().toISOString() } as any);
  }

  async void(id: string, reasonCode: string, safeMessage: string): Promise<RecoveryCasePriorityAssessment> {
    return this.update(id, { priorityStatus: 'void', blockedReasonCodesJson: [reasonCode], voidedAt: new Date().toISOString() } as any);
  }
}

export class InMemoryRecoveryCasePriorityFactorRepository implements RecoveryCasePriorityFactorRepository {
  private store = new Map<string, RecoveryCasePriorityFactor>();

  async create(data: Partial<RecoveryCasePriorityFactor> & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<RecoveryCasePriorityFactor> {
    const now = new Date().toISOString();
    const record: RecoveryCasePriorityFactor = {
      ...data as RecoveryCasePriorityFactor,
      priorityFactorId: data.priorityFactorId || simpleId(),
      appliedPoints: data.appliedPoints ?? 0,
      factorWeight: data.factorWeight ?? 1,
      factorSourceJson: data.factorSourceJson || {},
      createdAt: data.createdAt || now,
    };
    this.store.set(record.priorityFactorId, record);
    return record;
  }

  async getById(id: string): Promise<RecoveryCasePriorityFactor | null> {
    return this.store.get(id) ?? null;
  }

  async listByAssessment(priorityAssessmentId: string): Promise<RecoveryCasePriorityFactor[]> {
    return Array.from(this.store.values()).filter(r => r.priorityAssessmentId === priorityAssessmentId);
  }

  async listBySchool(schoolId: string): Promise<RecoveryCasePriorityFactor[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByFactorCode(schoolId: string, factorCode: string): Promise<RecoveryCasePriorityFactor[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.factorCode === factorCode);
  }

  async update(id: string, data: Partial<RecoveryCasePriorityFactor>): Promise<RecoveryCasePriorityFactor> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`PriorityFactor ${id} not found`);
    const updated: RecoveryCasePriorityFactor = { ...existing, ...data };
    this.store.set(id, updated);
    return updated;
  }
}

export class InMemoryRecoveryCaseFairnessCheckRepository implements RecoveryCaseFairnessCheckRepository {
  private store = new Map<string, RecoveryCaseFairnessCheck>();

  async create(data: Partial<RecoveryCaseFairnessCheck> & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<RecoveryCaseFairnessCheck> {
    const now = new Date().toISOString();
    const record: RecoveryCaseFairnessCheck = {
      ...data as RecoveryCaseFairnessCheck,
      fairnessCheckId: data.fairnessCheckId || simpleId(),
      fairnessStatus: data.fairnessStatus || 'needs_review',
      fairnessChecksJson: data.fairnessChecksJson || {},
      blockedReasonCodesJson: data.blockedReasonCodesJson || [],
      sourceRefsJson: data.sourceRefsJson || {},
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
    };
    this.store.set(record.fairnessCheckId, record);
    return record;
  }

  async getById(id: string): Promise<RecoveryCaseFairnessCheck | null> {
    return this.store.get(id) ?? null;
  }

  async listBySchool(schoolId: string): Promise<RecoveryCaseFairnessCheck[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByAssessment(priorityAssessmentId: string): Promise<RecoveryCaseFairnessCheck[]> {
    return Array.from(this.store.values()).filter(r => r.priorityAssessmentId === priorityAssessmentId);
  }

  async listByQueue(queueSnapshotId: string): Promise<RecoveryCaseFairnessCheck[]> {
    return Array.from(this.store.values()).filter(r => r.queueSnapshotId === queueSnapshotId);
  }

  async listByStatus(schoolId: string, status: string): Promise<RecoveryCaseFairnessCheck[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.fairnessStatus === status);
  }

  async update(id: string, data: Partial<RecoveryCaseFairnessCheck>): Promise<RecoveryCaseFairnessCheck> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`FairnessCheck ${id} not found`);
    const updated: RecoveryCaseFairnessCheck = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
  }

  async updateStatus(id: string, status: string): Promise<RecoveryCaseFairnessCheck> {
    return this.update(id, { fairnessStatus: status } as any);
  }

  async block(id: string, reasonCode: string, safeMessage: string): Promise<RecoveryCaseFairnessCheck> {
    return this.update(id, { fairnessStatus: 'blocked', blockedReasonCodesJson: [reasonCode], blockedAt: new Date().toISOString() } as any);
  }

  async void(id: string, reasonCode: string, safeMessage: string): Promise<RecoveryCaseFairnessCheck> {
    return this.update(id, { fairnessStatus: 'void', blockedReasonCodesJson: [reasonCode], voidedAt: new Date().toISOString() } as any);
  }
}

export class InMemoryRecoveryCaseCapacitySnapshotRepository implements RecoveryCaseCapacitySnapshotRepository {
  private store = new Map<string, RecoveryCaseCapacitySnapshot>();

  async create(data: Partial<RecoveryCaseCapacitySnapshot> & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<RecoveryCaseCapacitySnapshot> {
    const now = new Date().toISOString();
    const record: RecoveryCaseCapacitySnapshot = {
      ...data as RecoveryCaseCapacitySnapshot,
      capacitySnapshotId: data.capacitySnapshotId || simpleId(),
      capacityStatus: data.capacityStatus || 'draft',
      totalCapacity: data.totalCapacity ?? 0,
      usedCapacity: data.usedCapacity ?? 0,
      availableCapacity: data.availableCapacity ?? 0,
      capacityThreshold: data.capacityThreshold ?? 0,
      capacityDetailsJson: data.capacityDetailsJson || {},
      sourceRefsJson: data.sourceRefsJson || {},
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
    };
    this.store.set(record.capacitySnapshotId, record);
    return record;
  }

  async getById(id: string): Promise<RecoveryCaseCapacitySnapshot | null> {
    return this.store.get(id) ?? null;
  }

  async listBySchool(schoolId: string): Promise<RecoveryCaseCapacitySnapshot[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByRole(schoolId: string, audienceRole: string): Promise<RecoveryCaseCapacitySnapshot[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.audienceRole === audienceRole);
  }

  async listByReviewer(schoolId: string, reviewerRef: string): Promise<RecoveryCaseCapacitySnapshot[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.reviewerRef === reviewerRef);
  }

  async listByWindow(schoolId: string, reviewWindowId: string): Promise<RecoveryCaseCapacitySnapshot[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.reviewWindowId === reviewWindowId);
  }

  async update(id: string, data: Partial<RecoveryCaseCapacitySnapshot>): Promise<RecoveryCaseCapacitySnapshot> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`CapacitySnapshot ${id} not found`);
    const updated: RecoveryCaseCapacitySnapshot = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
  }

  async updateStatus(id: string, status: string): Promise<RecoveryCaseCapacitySnapshot> {
    return this.update(id, { capacityStatus: status } as any);
  }

  async markReviewReady(id: string): Promise<RecoveryCaseCapacitySnapshot> {
    return this.update(id, { capacityStatus: 'review_ready', reviewReadyAt: new Date().toISOString() } as any);
  }

  async markCapacityExceeded(id: string): Promise<RecoveryCaseCapacitySnapshot> {
    return this.update(id, { capacityStatus: 'capacity_exceeded', capacityExceededAt: new Date().toISOString() } as any);
  }

  async void(id: string, reasonCode: string, safeMessage: string): Promise<RecoveryCaseCapacitySnapshot> {
    return this.update(id, { capacityStatus: 'void', voidedAt: new Date().toISOString() } as any);
  }
}

export class InMemoryRecoveryCaseTriageQueueSnapshotRepository implements RecoveryCaseTriageQueueSnapshotRepository {
  private store = new Map<string, RecoveryCaseTriageQueueSnapshot>();

  async create(data: Partial<RecoveryCaseTriageQueueSnapshot> & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<RecoveryCaseTriageQueueSnapshot> {
    const now = new Date().toISOString();
    const record: RecoveryCaseTriageQueueSnapshot = {
      ...data as RecoveryCaseTriageQueueSnapshot,
      queueSnapshotId: data.queueSnapshotId || simpleId(),
      queueStatus: data.queueStatus || 'draft',
      totalItems: data.totalItems ?? 0,
      queueMetadataJson: data.queueMetadataJson || {},
      blockedReasonCodesJson: data.blockedReasonCodesJson || [],
      sourceRefsJson: data.sourceRefsJson || {},
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
    };
    this.store.set(record.queueSnapshotId, record);
    return record;
  }

  async getById(id: string): Promise<RecoveryCaseTriageQueueSnapshot | null> {
    return this.store.get(id) ?? null;
  }

  async listBySchool(schoolId: string): Promise<RecoveryCaseTriageQueueSnapshot[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByAudienceRole(schoolId: string, audienceRole: string): Promise<RecoveryCaseTriageQueueSnapshot[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.audienceRole === audienceRole);
  }

  async listByStatus(schoolId: string, status: string): Promise<RecoveryCaseTriageQueueSnapshot[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.queueStatus === status);
  }

  async update(id: string, data: Partial<RecoveryCaseTriageQueueSnapshot>): Promise<RecoveryCaseTriageQueueSnapshot> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`QueueSnapshot ${id} not found`);
    const updated: RecoveryCaseTriageQueueSnapshot = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
  }

  async updateStatus(id: string, status: string): Promise<RecoveryCaseTriageQueueSnapshot> {
    return this.update(id, { queueStatus: status } as any);
  }

  async markGenerated(id: string): Promise<RecoveryCaseTriageQueueSnapshot> {
    return this.update(id, { queueStatus: 'generated', generatedAt: new Date().toISOString() } as any);
  }

  async markReviewReady(id: string): Promise<RecoveryCaseTriageQueueSnapshot> {
    return this.update(id, { queueStatus: 'review_ready', reviewReadyAt: new Date().toISOString() } as any);
  }

  async markStale(id: string): Promise<RecoveryCaseTriageQueueSnapshot> {
    return this.update(id, { queueStatus: 'stale', staleAt: new Date().toISOString() } as any);
  }

  async block(id: string, reasonCode: string, safeMessage: string): Promise<RecoveryCaseTriageQueueSnapshot> {
    return this.update(id, { queueStatus: 'blocked', blockedReasonCodesJson: [reasonCode], blockedAt: new Date().toISOString() } as any);
  }

  async void(id: string, reasonCode: string, safeMessage: string): Promise<RecoveryCaseTriageQueueSnapshot> {
    return this.update(id, { queueStatus: 'void', blockedReasonCodesJson: [reasonCode], voidedAt: new Date().toISOString() } as any);
  }
}
export class InMemoryRecoveryCaseTriageQueueItemRepository implements RecoveryCaseTriageQueueItemRepository {
  private store = new Map<string, RecoveryCaseTriageQueueItem>();

  async create(data: Partial<RecoveryCaseTriageQueueItem> & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<RecoveryCaseTriageQueueItem> {
    const now = new Date().toISOString();
    const record: RecoveryCaseTriageQueueItem = {
      ...data as RecoveryCaseTriageQueueItem,
      queueItemId: data.queueItemId || simpleId(),
      queueStatus: data.queueStatus || 'queued',
      triageDecision: data.triageDecision || 'queued',
      priorityBand: data.priorityBand || 'normal',
      riskRank: data.riskRank || 'low',
      totalScore: data.totalScore ?? 0,
      queueRank: data.queueRank ?? 0,
      decisionReasonJson: data.decisionReasonJson || {},
      blockedReasonCodesJson: data.blockedReasonCodesJson || [],
      sourceRefsJson: data.sourceRefsJson || {},
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
    };
    this.store.set(record.queueItemId, record);
    return record;
  }

  async getById(id: string): Promise<RecoveryCaseTriageQueueItem | null> {
    return this.store.get(id) ?? null;
  }

  async listBySchool(schoolId: string): Promise<RecoveryCaseTriageQueueItem[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByQueueSnapshot(queueSnapshotId: string): Promise<RecoveryCaseTriageQueueItem[]> {
    return Array.from(this.store.values()).filter(r => r.queueSnapshotId === queueSnapshotId);
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryCaseTriageQueueItem[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.studentRef === studentRef);
  }

  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryCaseTriageQueueItem[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultRecoveryPlanId === planId);
  }

  async listByBand(schoolId: string, band: string): Promise<RecoveryCaseTriageQueueItem[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.priorityBand === band);
  }

  async listByStatus(schoolId: string, status: string): Promise<RecoveryCaseTriageQueueItem[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.queueStatus === status);
  }

  async listByTriageDecision(schoolId: string, triageDecision: string): Promise<RecoveryCaseTriageQueueItem[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.triageDecision === triageDecision);
  }

  async listByRank(queueSnapshotId: string): Promise<RecoveryCaseTriageQueueItem[]> {
    return Array.from(this.store.values())
      .filter(r => r.queueSnapshotId === queueSnapshotId)
      .sort((a, b) => a.queueRank - b.queueRank);
  }

  async update(id: string, data: Partial<RecoveryCaseTriageQueueItem>): Promise<RecoveryCaseTriageQueueItem> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`QueueItem ${id} not found`);
    const updated: RecoveryCaseTriageQueueItem = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
  }

  async updateStatus(id: string, status: string): Promise<RecoveryCaseTriageQueueItem> {
    return this.update(id, { queueStatus: status } as any);
  }

  async markReviewReady(id: string): Promise<RecoveryCaseTriageQueueItem> {
    return this.update(id, { queueStatus: 'review_ready', reviewReadyAt: new Date().toISOString() } as any);
  }

  async defer(id: string, reasonCode: string, safeMessage: string): Promise<RecoveryCaseTriageQueueItem> {
    return this.update(id, { queueStatus: 'deferred', triageDecision: 'deferred', blockedReasonCodesJson: [reasonCode], deferredAt: new Date().toISOString() } as any);
  }

  async block(id: string, reasonCode: string, safeMessage: string): Promise<RecoveryCaseTriageQueueItem> {
    return this.update(id, { queueStatus: 'blocked', blockedReasonCodesJson: [reasonCode], blockedAt: new Date().toISOString() } as any);
  }

  async void(id: string, reasonCode: string, safeMessage: string): Promise<RecoveryCaseTriageQueueItem> {
    return this.update(id, { queueStatus: 'void', blockedReasonCodesJson: [reasonCode], voidedAt: new Date().toISOString() } as any);
  }
}

export class InMemoryRecoveryCaseWorkloadAllocationDraftRepository implements RecoveryCaseWorkloadAllocationDraftRepository {
  private store = new Map<string, RecoveryCaseWorkloadAllocationDraft>();

  async create(data: Partial<RecoveryCaseWorkloadAllocationDraft> & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<RecoveryCaseWorkloadAllocationDraft> {
    const now = new Date().toISOString();
    const record: RecoveryCaseWorkloadAllocationDraft = {
      ...data as RecoveryCaseWorkloadAllocationDraft,
      allocationDraftId: data.allocationDraftId || simpleId(),
      allocationDraftStatus: data.allocationDraftStatus || 'draft',
      allocatedItemIdsJson: data.allocatedItemIdsJson || [],
      totalAllocated: data.totalAllocated ?? 0,
      allocationDetailsJson: data.allocationDetailsJson || {},
      sourceRefsJson: data.sourceRefsJson || {},
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
    };
    this.store.set(record.allocationDraftId, record);
    return record;
  }

  async getById(id: string): Promise<RecoveryCaseWorkloadAllocationDraft | null> {
    return this.store.get(id) ?? null;
  }

  async listBySchool(schoolId: string): Promise<RecoveryCaseWorkloadAllocationDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByQueue(queueSnapshotId: string): Promise<RecoveryCaseWorkloadAllocationDraft[]> {
    return Array.from(this.store.values()).filter(r => r.queueSnapshotId === queueSnapshotId);
  }

  async listByReviewer(schoolId: string, reviewerRef: string): Promise<RecoveryCaseWorkloadAllocationDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.reviewerRef === reviewerRef);
  }

  async listByStatus(schoolId: string, status: string): Promise<RecoveryCaseWorkloadAllocationDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.allocationDraftStatus === status);
  }

  async update(id: string, data: Partial<RecoveryCaseWorkloadAllocationDraft>): Promise<RecoveryCaseWorkloadAllocationDraft> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`WorkloadAllocationDraft ${id} not found`);
    const updated: RecoveryCaseWorkloadAllocationDraft = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
  }

  async updateStatus(id: string, status: string): Promise<RecoveryCaseWorkloadAllocationDraft> {
    return this.update(id, { allocationDraftStatus: status } as any);
  }

  async markReviewReady(id: string): Promise<RecoveryCaseWorkloadAllocationDraft> {
    return this.update(id, { allocationDraftStatus: 'review_ready', reviewReadyAt: new Date().toISOString() } as any);
  }

  async approveFutureUse(id: string): Promise<RecoveryCaseWorkloadAllocationDraft> {
    return this.update(id, { allocationDraftStatus: 'approved_for_future_use', approvedAt: new Date().toISOString() } as any);
  }

  async block(id: string, reasonCode: string, safeMessage: string): Promise<RecoveryCaseWorkloadAllocationDraft> {
    return this.update(id, { allocationDraftStatus: 'blocked', blockedAt: new Date().toISOString() } as any);
  }

  async suppress(id: string, reasonCode: string, safeMessage: string): Promise<RecoveryCaseWorkloadAllocationDraft> {
    return this.update(id, { allocationDraftStatus: 'suppressed', suppressedAt: new Date().toISOString() } as any);
  }

  async void(id: string, reasonCode: string, safeMessage: string): Promise<RecoveryCaseWorkloadAllocationDraft> {
    return this.update(id, { allocationDraftStatus: 'void', voidedAt: new Date().toISOString() } as any);
  }
}

export class InMemoryRecoveryCaseEscalationDraftRepository implements RecoveryCaseEscalationDraftRepository {
  private store = new Map<string, RecoveryCaseEscalationDraft>();

  async create(data: Partial<RecoveryCaseEscalationDraft> & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<RecoveryCaseEscalationDraft> {
    const now = new Date().toISOString();
    const record: RecoveryCaseEscalationDraft = {
      ...data as RecoveryCaseEscalationDraft,
      escalationDraftId: data.escalationDraftId || simpleId(),
      escalationDraftStatus: data.escalationDraftStatus || 'draft',
      escalationNotesJson: data.escalationNotesJson || {},
      sourceRefsJson: data.sourceRefsJson || {},
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
    };
    this.store.set(record.escalationDraftId, record);
    return record;
  }

  async getById(id: string): Promise<RecoveryCaseEscalationDraft | null> {
    return this.store.get(id) ?? null;
  }

  async listBySchool(schoolId: string): Promise<RecoveryCaseEscalationDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByQueue(queueSnapshotId: string): Promise<RecoveryCaseEscalationDraft[]> {
    return Array.from(this.store.values()).filter(r => r.queueSnapshotId === queueSnapshotId);
  }

  async listByLevel(schoolId: string, escalationLevel: string): Promise<RecoveryCaseEscalationDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.escalationLevel === escalationLevel);
  }

  async listByStatus(schoolId: string, status: string): Promise<RecoveryCaseEscalationDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.escalationDraftStatus === status);
  }

  async update(id: string, data: Partial<RecoveryCaseEscalationDraft>): Promise<RecoveryCaseEscalationDraft> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`EscalationDraft ${id} not found`);
    const updated: RecoveryCaseEscalationDraft = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
  }

  async updateStatus(id: string, status: string): Promise<RecoveryCaseEscalationDraft> {
    return this.update(id, { escalationDraftStatus: status } as any);
  }

  async markReviewReady(id: string): Promise<RecoveryCaseEscalationDraft> {
    return this.update(id, { escalationDraftStatus: 'review_ready', reviewReadyAt: new Date().toISOString() } as any);
  }

  async approveFutureUse(id: string): Promise<RecoveryCaseEscalationDraft> {
    return this.update(id, { escalationDraftStatus: 'approved_for_future_use', approvedAt: new Date().toISOString() } as any);
  }

  async block(id: string, reasonCode: string, safeMessage: string): Promise<RecoveryCaseEscalationDraft> {
    return this.update(id, { escalationDraftStatus: 'blocked', blockedAt: new Date().toISOString() } as any);
  }

  async suppress(id: string, reasonCode: string, safeMessage: string): Promise<RecoveryCaseEscalationDraft> {
    return this.update(id, { escalationDraftStatus: 'suppressed', suppressedAt: new Date().toISOString() } as any);
  }

  async void(id: string, reasonCode: string, safeMessage: string): Promise<RecoveryCaseEscalationDraft> {
    return this.update(id, { escalationDraftStatus: 'void', voidedAt: new Date().toISOString() } as any);
  }
}

export class InMemoryRecoveryCaseReviewWindowDraftRepository implements RecoveryCaseReviewWindowDraftRepository {
  private store = new Map<string, RecoveryCaseReviewWindowDraft>();

  async create(data: Partial<RecoveryCaseReviewWindowDraft> & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<RecoveryCaseReviewWindowDraft> {
    const now = new Date().toISOString();
    const record: RecoveryCaseReviewWindowDraft = {
      ...data as RecoveryCaseReviewWindowDraft,
      reviewWindowDraftId: data.reviewWindowDraftId || simpleId(),
      reviewWindowDraftStatus: data.reviewWindowDraftStatus || 'draft',
      maxCapacity: data.maxCapacity ?? 0,
      windowDetailsJson: data.windowDetailsJson || {},
      sourceRefsJson: data.sourceRefsJson || {},
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
    };
    this.store.set(record.reviewWindowDraftId, record);
    return record;
  }

  async getById(id: string): Promise<RecoveryCaseReviewWindowDraft | null> {
    return this.store.get(id) ?? null;
  }

  async listBySchool(schoolId: string): Promise<RecoveryCaseReviewWindowDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByQueue(queueSnapshotId: string): Promise<RecoveryCaseReviewWindowDraft[]> {
    return Array.from(this.store.values()).filter(r => r.queueSnapshotId === queueSnapshotId);
  }

  async listByReviewer(schoolId: string, reviewerRef: string): Promise<RecoveryCaseReviewWindowDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.reviewerRef === reviewerRef);
  }

  async listByStatus(schoolId: string, status: string): Promise<RecoveryCaseReviewWindowDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.reviewWindowDraftStatus === status);
  }

  async update(id: string, data: Partial<RecoveryCaseReviewWindowDraft>): Promise<RecoveryCaseReviewWindowDraft> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`ReviewWindowDraft ${id} not found`);
    const updated: RecoveryCaseReviewWindowDraft = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
  }

  async updateStatus(id: string, status: string): Promise<RecoveryCaseReviewWindowDraft> {
    return this.update(id, { reviewWindowDraftStatus: status } as any);
  }

  async markReviewReady(id: string): Promise<RecoveryCaseReviewWindowDraft> {
    return this.update(id, { reviewWindowDraftStatus: 'review_ready', reviewReadyAt: new Date().toISOString() } as any);
  }

  async approveFutureUse(id: string): Promise<RecoveryCaseReviewWindowDraft> {
    return this.update(id, { reviewWindowDraftStatus: 'approved_for_future_use', approvedAt: new Date().toISOString() } as any);
  }

  async block(id: string, reasonCode: string, safeMessage: string): Promise<RecoveryCaseReviewWindowDraft> {
    return this.update(id, { reviewWindowDraftStatus: 'blocked', blockedAt: new Date().toISOString() } as any);
  }

  async suppress(id: string, reasonCode: string, safeMessage: string): Promise<RecoveryCaseReviewWindowDraft> {
    return this.update(id, { reviewWindowDraftStatus: 'suppressed', suppressedAt: new Date().toISOString() } as any);
  }

  async void(id: string, reasonCode: string, safeMessage: string): Promise<RecoveryCaseReviewWindowDraft> {
    return this.update(id, { reviewWindowDraftStatus: 'void', voidedAt: new Date().toISOString() } as any);
  }
}

export class InMemoryRecoveryCaseQueueExplanationRepository implements RecoveryCaseQueueExplanationRepository {
  private store = new Map<string, RecoveryCaseQueueExplanation>();

  async create(data: Partial<RecoveryCaseQueueExplanation> & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<RecoveryCaseQueueExplanation> {
    const now = new Date().toISOString();
    const record: RecoveryCaseQueueExplanation = {
      ...data as RecoveryCaseQueueExplanation,
      queueExplanationId: data.queueExplanationId || simpleId(),
      factorBreakdownJson: data.factorBreakdownJson || {},
      sourceRefsJson: data.sourceRefsJson || {},
      createdAt: data.createdAt || now,
    };
    this.store.set(record.queueExplanationId, record);
    return record;
  }

  async getById(id: string): Promise<RecoveryCaseQueueExplanation | null> {
    return this.store.get(id) ?? null;
  }

  async listBySchool(schoolId: string): Promise<RecoveryCaseQueueExplanation[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByQueueItem(queueItemId: string): Promise<RecoveryCaseQueueExplanation[]> {
    return Array.from(this.store.values()).filter(r => r.queueItemId === queueItemId);
  }

  async listByAssessment(priorityAssessmentId: string): Promise<RecoveryCaseQueueExplanation[]> {
    return Array.from(this.store.values()).filter(r => r.priorityAssessmentId === priorityAssessmentId);
  }

  async listBySnapshot(queueSnapshotId: string): Promise<RecoveryCaseQueueExplanation[]> {
    return Array.from(this.store.values()).filter(r => r.queueSnapshotId === queueSnapshotId);
  }
}

export class InMemoryRecoveryCaseDuplicateSuppressionRepository implements RecoveryCaseDuplicateSuppressionRepository {
  private store = new Map<string, RecoveryCaseDuplicateSuppression>();

  async create(data: Partial<RecoveryCaseDuplicateSuppression> & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<RecoveryCaseDuplicateSuppression> {
    const now = new Date().toISOString();
    const record: RecoveryCaseDuplicateSuppression = {
      ...data as RecoveryCaseDuplicateSuppression,
      duplicateSuppressionId: data.duplicateSuppressionId || simpleId(),
      suppressionStatus: data.suppressionStatus || 'draft',
      suppressionDetailsJson: data.suppressionDetailsJson || {},
      sourceRefsJson: data.sourceRefsJson || {},
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
    };
    this.store.set(record.duplicateSuppressionId, record);
    return record;
  }

  async getById(id: string): Promise<RecoveryCaseDuplicateSuppression | null> {
    return this.store.get(id) ?? null;
  }

  async listBySchool(schoolId: string): Promise<RecoveryCaseDuplicateSuppression[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryCaseDuplicateSuppression[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultRecoveryPlanId === planId);
  }

  async listByCanonicalCard(schoolId: string, canonicalBoardCardId: string): Promise<RecoveryCaseDuplicateSuppression[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.canonicalBoardCardId === canonicalBoardCardId);
  }

  async listByDuplicateCard(schoolId: string, duplicateBoardCardId: string): Promise<RecoveryCaseDuplicateSuppression[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.duplicateBoardCardId === duplicateBoardCardId);
  }

  async listByStatus(schoolId: string, status: string): Promise<RecoveryCaseDuplicateSuppression[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.suppressionStatus === status);
  }

  async update(id: string, data: Partial<RecoveryCaseDuplicateSuppression>): Promise<RecoveryCaseDuplicateSuppression> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`DuplicateSuppression ${id} not found`);
    const updated: RecoveryCaseDuplicateSuppression = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
  }

  async updateStatus(id: string, status: string): Promise<RecoveryCaseDuplicateSuppression> {
    return this.update(id, { suppressionStatus: status } as any);
  }

  async void(id: string, reasonCode: string, safeMessage: string): Promise<RecoveryCaseDuplicateSuppression> {
    return this.update(id, { suppressionStatus: 'void', voidedAt: new Date().toISOString() } as any);
  }
}

export class InMemoryRecoveryCaseTriageSummaryRepository implements RecoveryCaseTriageSummaryRepository {
  private store = new Map<string, RecoveryCaseTriageSummary>();

  async create(data: Partial<RecoveryCaseTriageSummary> & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<RecoveryCaseTriageSummary> {
    const now = new Date().toISOString();
    const record: RecoveryCaseTriageSummary = {
      ...data as RecoveryCaseTriageSummary,
      triageSummaryId: data.triageSummaryId || simpleId(),
      triageSummaryStatus: data.triageSummaryStatus || 'draft',
      totalScore: data.totalScore ?? 0,
      priorityBand: data.priorityBand || 'normal',
      riskRank: data.riskRank || 'low',
      summaryDetailsJson: data.summaryDetailsJson || {},
      sourceRefsJson: data.sourceRefsJson || {},
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
    };
    this.store.set(record.triageSummaryId, record);
    return record;
  }

  async getById(id: string): Promise<RecoveryCaseTriageSummary | null> {
    return this.store.get(id) ?? null;
  }

  async listBySchool(schoolId: string): Promise<RecoveryCaseTriageSummary[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryCaseTriageSummary[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.studentRef === studentRef);
  }

  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryCaseTriageSummary[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultRecoveryPlanId === planId);
  }

  async listByQueueSnapshot(queueSnapshotId: string): Promise<RecoveryCaseTriageSummary[]> {
    return Array.from(this.store.values()).filter(r => r.queueSnapshotId === queueSnapshotId);
  }

  async listByStatus(schoolId: string, status: string): Promise<RecoveryCaseTriageSummary[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.triageSummaryStatus === status);
  }

  async update(id: string, data: Partial<RecoveryCaseTriageSummary>): Promise<RecoveryCaseTriageSummary> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`TriageSummary ${id} not found`);
    const updated: RecoveryCaseTriageSummary = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
  }

  async updateStatus(id: string, status: string): Promise<RecoveryCaseTriageSummary> {
    return this.update(id, { triageSummaryStatus: status } as any);
  }

  async refresh(id: string): Promise<RecoveryCaseTriageSummary> {
    return this.update(id, { triageSummaryStatus: 'draft' } as any);
  }

  async markReviewReady(id: string): Promise<RecoveryCaseTriageSummary> {
    return this.update(id, { triageSummaryStatus: 'review_ready', reviewReadyAt: new Date().toISOString() } as any);
  }

  async markStale(id: string): Promise<RecoveryCaseTriageSummary> {
    return this.update(id, { triageSummaryStatus: 'stale', staleAt: new Date().toISOString() } as any);
  }

  async block(id: string, reasonCode: string, safeMessage: string): Promise<RecoveryCaseTriageSummary> {
    return this.update(id, { triageSummaryStatus: 'blocked', blockedAt: new Date().toISOString() } as any);
  }

  async void(id: string, reasonCode: string, safeMessage: string): Promise<RecoveryCaseTriageSummary> {
    return this.update(id, { triageSummaryStatus: 'void', voidedAt: new Date().toISOString() } as any);
  }
}

interface AuditEventRecord {
  triageAuditId: string;
  schoolId: string;
  entityType: string;
  entityId: string;
  action: string;
  actorId: string;
  actorRole: string;
  safeSummary: string;
  reasonCodesJson: Record<string, unknown> | null;
  metadataJson: Record<string, unknown> | null;
  correlationId: string | null;
  createdAt: string;
}

export class InMemoryRecoveryCaseTriageAuditRepository implements RecoveryCaseTriageAuditRepository {
  private store = new Map<string, AuditEventRecord>();

  async create(event: Partial<RecoveryCaseTriageAuditEvent> & { schoolId: string; actorId: string; actorRole: string }): Promise<RecoveryCaseTriageAuditEvent> {
    const now = new Date().toISOString();
    const record: AuditEventRecord = {
      ...event as AuditEventRecord,
      triageAuditId: event.triageAuditId || simpleId(),
      reasonCodesJson: event.reasonCodesJson ?? null,
      metadataJson: event.metadataJson ?? null,
      correlationId: event.correlationId ?? null,
      createdAt: event.createdAt || now,
    };
    this.store.set(record.triageAuditId, record);
    return record;
  }

  async listBySchool(schoolId: string): Promise<RecoveryCaseTriageAuditEvent[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByEntity(schoolId: string, entityType: string, entityId: string): Promise<RecoveryCaseTriageAuditEvent[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.entityType === entityType && r.entityId === entityId);
  }

  async listByAction(schoolId: string, action: string): Promise<RecoveryCaseTriageAuditEvent[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.action === action);
  }

  async listByActor(schoolId: string, actorId: string): Promise<RecoveryCaseTriageAuditEvent[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.actorId === actorId);
  }
}

interface IdempotencyRecord {
  triageIdempotencyId: string;
  schoolId: string;
  operation: string;
  idempotencyKey: string;
  requestHash: string;
  status: string;
  resourceType: string | null;
  resourceId: string | null;
  safeResultSummary: string | null;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
}

export class InMemoryRecoveryCaseTriageIdempotencyRepository implements RecoveryCaseTriageIdempotencyRepository {
  private store = new Map<string, IdempotencyRecord>();

  async create(input: { schoolId: string; operation: string; idempotencyKey: string; requestHash: string; status?: string; resourceType?: string | null; resourceId?: string | null; safeResultSummary?: string | null; expiresAt?: string }): Promise<RecoveryCaseTriageIdempotencyEntry> {
    const now = new Date().toISOString();
    const record: IdempotencyRecord = {
      triageIdempotencyId: simpleId(),
      schoolId: input.schoolId,
      operation: input.operation,
      idempotencyKey: input.idempotencyKey,
      requestHash: input.requestHash,
      status: input.status || 'in_progress',
      resourceType: input.resourceType ?? null,
      resourceId: input.resourceId ?? null,
      safeResultSummary: input.safeResultSummary ?? null,
      expiresAt: input.expiresAt ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.store.set(record.triageIdempotencyId, record);
    return record;
  }

  async getByKey(schoolId: string, operation: string, idempotencyKey: string): Promise<RecoveryCaseTriageIdempotencyEntry | null> {
    return Array.from(this.store.values())
      .find(r => r.schoolId === schoolId && r.operation === operation && r.idempotencyKey === idempotencyKey) ?? null;
  }

  async update(id: string, data: Partial<RecoveryCaseTriageIdempotencyEntry>): Promise<RecoveryCaseTriageIdempotencyEntry> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`IdempotencyRecord ${id} not found`);
    const updated: IdempotencyRecord = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
  }

  async complete(id: string, safeResultSummary: string, resourceType?: string, resourceId?: string): Promise<RecoveryCaseTriageIdempotencyEntry> {
    return this.update(id, { status: 'completed', safeResultSummary, resourceType: resourceType || null, resourceId: resourceId || null } as any);
  }

  async listBySchool(schoolId: string): Promise<RecoveryCaseTriageIdempotencyEntry[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByOperation(schoolId: string, operation: string): Promise<RecoveryCaseTriageIdempotencyEntry[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.operation === operation);
  }
}

export class InMemoryRecoveryCaseTriageRepositories {
  triageReadiness: InMemoryRecoveryCaseTriageReadinessRepository;
  priorityAssessment: InMemoryRecoveryCasePriorityAssessmentRepository;
  priorityFactor: InMemoryRecoveryCasePriorityFactorRepository;
  fairnessCheck: InMemoryRecoveryCaseFairnessCheckRepository;
  capacitySnapshot: InMemoryRecoveryCaseCapacitySnapshotRepository;
  queueSnapshot: InMemoryRecoveryCaseTriageQueueSnapshotRepository;
  queueItem: InMemoryRecoveryCaseTriageQueueItemRepository;
  workloadAllocationDraft: InMemoryRecoveryCaseWorkloadAllocationDraftRepository;
  escalationDraft: InMemoryRecoveryCaseEscalationDraftRepository;
  reviewWindowDraft: InMemoryRecoveryCaseReviewWindowDraftRepository;
  queueExplanation: InMemoryRecoveryCaseQueueExplanationRepository;
  duplicateSuppression: InMemoryRecoveryCaseDuplicateSuppressionRepository;
  triageSummary: InMemoryRecoveryCaseTriageSummaryRepository;
  audit: InMemoryRecoveryCaseTriageAuditRepository;
  idempotency: InMemoryRecoveryCaseTriageIdempotencyRepository;

  constructor() {
    this.triageReadiness = new InMemoryRecoveryCaseTriageReadinessRepository();
    this.priorityAssessment = new InMemoryRecoveryCasePriorityAssessmentRepository();
    this.priorityFactor = new InMemoryRecoveryCasePriorityFactorRepository();
    this.fairnessCheck = new InMemoryRecoveryCaseFairnessCheckRepository();
    this.capacitySnapshot = new InMemoryRecoveryCaseCapacitySnapshotRepository();
    this.queueSnapshot = new InMemoryRecoveryCaseTriageQueueSnapshotRepository();
    this.queueItem = new InMemoryRecoveryCaseTriageQueueItemRepository();
    this.workloadAllocationDraft = new InMemoryRecoveryCaseWorkloadAllocationDraftRepository();
    this.escalationDraft = new InMemoryRecoveryCaseEscalationDraftRepository();
    this.reviewWindowDraft = new InMemoryRecoveryCaseReviewWindowDraftRepository();
    this.queueExplanation = new InMemoryRecoveryCaseQueueExplanationRepository();
    this.duplicateSuppression = new InMemoryRecoveryCaseDuplicateSuppressionRepository();
    this.triageSummary = new InMemoryRecoveryCaseTriageSummaryRepository();
    this.audit = new InMemoryRecoveryCaseTriageAuditRepository();
    this.idempotency = new InMemoryRecoveryCaseTriageIdempotencyRepository();
  }
}
