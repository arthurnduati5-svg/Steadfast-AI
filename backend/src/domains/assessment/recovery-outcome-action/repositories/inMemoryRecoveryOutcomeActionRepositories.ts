import {
  RecoveryOutcomeActionReadiness,
  RecoveryOutcomeActionReadinessStatus,
} from '../contracts/recoveryOutcomeActionReadinessContracts';
import {
  RecoveryOutcomeActionBundle,
  ActionBundleStatus,
  ActionBundleType,
} from '../contracts/recoveryOutcomeActionBundleContracts';
import {
  RecoveryContinuationActionDraft,
  RecoveryIntensificationActionDraft,
  RecoveryPauseActionDraft,
  RecoveryClosureActionDraft,
} from '../contracts/recoveryActionDraftContracts';
import { RecoveryOutcomeApprovalGate, ApprovalGateStatus } from '../contracts/recoveryOutcomeApprovalGateContracts';
import { RecoveryOutcomeMockActivationQueueItem, MockActivationQueueStatus } from '../contracts/recoveryOutcomeMockActivationQueueContracts';
import { RecoveryOutcomeDryRunReceipt, DryRunReceiptResult } from '../contracts/recoveryOutcomeDryRunReceiptContracts';
import { RecoveryOutcomeRollbackPlan, RollbackPlanStatus } from '../contracts/recoveryOutcomeRollbackPlanContracts';
import { RecoveryOutcomeSuppressionRule, SuppressionRuleStatus } from '../contracts/recoveryOutcomeSuppressionRuleContracts';
import { RecoveryOutcomeActionSummary, ActionSummaryStatus } from '../contracts/recoveryOutcomeActionSummaryContracts';
import {
  RecoveryOutcomeActionReadinessRepository,
  RecoveryOutcomeActionBundleRepository,
  RecoveryContinuationActionDraftRepository,
  RecoveryIntensificationActionDraftRepository,
  RecoveryPauseActionDraftRepository,
  RecoveryClosureActionDraftRepository,
  RecoveryOutcomeApprovalGateRepository,
  RecoveryOutcomeMockActivationQueueRepository,
  RecoveryOutcomeDryRunReceiptRepository,
  RecoveryOutcomeRollbackPlanRepository,
  RecoveryOutcomeSuppressionRuleRepository,
  RecoveryOutcomeActionSummaryRepository,
  RecoveryOutcomeActionAuditRepository,
  RecoveryOutcomeActionAuditEvent,
  RecoveryOutcomeActionIdempotencyRepository,
  RecoveryOutcomeActionIdempotencyEntry,
} from '../contracts/recoveryOutcomeActionRepositoryContracts';
import { v4 as uuid } from 'uuid';

export class InMemoryRecoveryOutcomeActionReadinessRepository implements RecoveryOutcomeActionReadinessRepository {
  private store = new Map<string, RecoveryOutcomeActionReadiness>();

  async create(data: RecoveryOutcomeActionReadiness): Promise<RecoveryOutcomeActionReadiness> {
    const record = { ...data, actionReadinessId: data.actionReadinessId || uuid() };
    this.store.set(record.actionReadinessId, record);
    return record;
  }

  async getById(id: string): Promise<RecoveryOutcomeActionReadiness | null> {
    return this.store.get(id) ?? null;
  }

  async listBySchool(schoolId: string): Promise<RecoveryOutcomeActionReadiness[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryOutcomeActionReadiness[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.studentRef === studentRef);
  }

  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryOutcomeActionReadiness[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultRecoveryPlanId === planId);
  }

  async listByStatus(schoolId: string, status: RecoveryOutcomeActionReadinessStatus): Promise<RecoveryOutcomeActionReadiness[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.readinessStatus === status);
  }

  async update(id: string, data: Partial<RecoveryOutcomeActionReadiness>): Promise<RecoveryOutcomeActionReadiness> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`ActionReadiness ${id} not found`);
    const updated = { ...existing, ...data, updatedAt: new Date() };
    this.store.set(id, updated);
    return updated;
  }

  async markReviewReady(id: string): Promise<RecoveryOutcomeActionReadiness> {
    return this.update(id, { readinessStatus: 'review_ready', reviewReadyAt: new Date() } as any);
  }

  async approveForFutureUse(id: string): Promise<RecoveryOutcomeActionReadiness> {
    return this.update(id, { readinessStatus: 'approved_for_future_use', approvedForFutureUseAt: new Date() } as any);
  }

  async suppress(id: string): Promise<RecoveryOutcomeActionReadiness> {
    return this.update(id, { readinessStatus: 'suppressed', suppressedAt: new Date() } as any);
  }

  async block(id: string): Promise<RecoveryOutcomeActionReadiness> {
    return this.update(id, { readinessStatus: 'blocked', blockedAt: new Date() } as any);
  }

  async void(id: string): Promise<RecoveryOutcomeActionReadiness> {
    return this.update(id, { readinessStatus: 'voided', voidedAt: new Date() } as any);
  }
}

export class InMemoryRecoveryOutcomeActionBundleRepository implements RecoveryOutcomeActionBundleRepository {
  private store = new Map<string, RecoveryOutcomeActionBundle>();

  async create(data: RecoveryOutcomeActionBundle): Promise<RecoveryOutcomeActionBundle> {
    const record = { ...data, actionBundleId: data.actionBundleId || uuid() };
    this.store.set(record.actionBundleId, record);
    return record;
  }

  async getById(id: string): Promise<RecoveryOutcomeActionBundle | null> {
    return this.store.get(id) ?? null;
  }

  async listBySchool(schoolId: string): Promise<RecoveryOutcomeActionBundle[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryOutcomeActionBundle[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.studentRef === studentRef);
  }

  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryOutcomeActionBundle[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultRecoveryPlanId === planId);
  }

  async listByStatus(schoolId: string, status: ActionBundleStatus): Promise<RecoveryOutcomeActionBundle[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.bundleStatus === status);
  }

  async listByType(schoolId: string, bundleType: ActionBundleType): Promise<RecoveryOutcomeActionBundle[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.bundleType === bundleType);
  }

  async update(id: string, data: Partial<RecoveryOutcomeActionBundle>): Promise<RecoveryOutcomeActionBundle> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`ActionBundle ${id} not found`);
    const updated = { ...existing, ...data, updatedAt: new Date() };
    this.store.set(id, updated);
    return updated;
  }

  async markReviewReady(id: string): Promise<RecoveryOutcomeActionBundle> {
    return this.update(id, { bundleStatus: 'review_ready', reviewReadyAt: new Date() } as any);
  }

  async approveForFutureUse(id: string): Promise<RecoveryOutcomeActionBundle> {
    return this.update(id, { bundleStatus: 'approved_for_future_use', approvedForFutureUseAt: new Date() } as any);
  }

  async suppress(id: string): Promise<RecoveryOutcomeActionBundle> {
    return this.update(id, { bundleStatus: 'suppressed', suppressedAt: new Date() } as any);
  }

  async block(id: string): Promise<RecoveryOutcomeActionBundle> {
    return this.update(id, { bundleStatus: 'blocked', blockedAt: new Date() } as any);
  }

  async void(id: string): Promise<RecoveryOutcomeActionBundle> {
    return this.update(id, { bundleStatus: 'voided', voidedAt: new Date() } as any);
  }
}

export class InMemoryRecoveryContinuationActionDraftRepository implements RecoveryContinuationActionDraftRepository {
  private store = new Map<string, RecoveryContinuationActionDraft>();

  async create(data: RecoveryContinuationActionDraft): Promise<RecoveryContinuationActionDraft> {
    const record = { ...data, continuationActionDraftId: data.continuationActionDraftId || uuid() };
    this.store.set(record.continuationActionDraftId, record);
    return record;
  }

  async getById(id: string): Promise<RecoveryContinuationActionDraft | null> {
    return this.store.get(id) ?? null;
  }

  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryContinuationActionDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultRecoveryPlanId === planId);
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryContinuationActionDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.studentRef === studentRef);
  }

  async listByStatus(schoolId: string, status: any): Promise<RecoveryContinuationActionDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.draftStatus === status);
  }

  async update(id: string, data: Partial<RecoveryContinuationActionDraft>): Promise<RecoveryContinuationActionDraft> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`ContinuationActionDraft ${id} not found`);
    const updated = { ...existing, ...data, updatedAt: new Date() };
    this.store.set(id, updated);
    return updated;
  }

  async markReviewReady(id: string): Promise<RecoveryContinuationActionDraft> {
    return this.update(id, { draftStatus: 'review_ready', reviewReadyAt: new Date() } as any);
  }
  async approveForFutureUse(id: string): Promise<RecoveryContinuationActionDraft> {
    return this.update(id, { draftStatus: 'approved_for_future_use', approvedForFutureUseAt: new Date() } as any);
  }
  async suppress(id: string): Promise<RecoveryContinuationActionDraft> {
    return this.update(id, { draftStatus: 'suppressed', suppressedAt: new Date() } as any);
  }
  async block(id: string): Promise<RecoveryContinuationActionDraft> {
    return this.update(id, { draftStatus: 'blocked', blockedAt: new Date() } as any);
  }
  async void(id: string): Promise<RecoveryContinuationActionDraft> {
    return this.update(id, { draftStatus: 'voided', voidedAt: new Date() } as any);
  }
}

export class InMemoryRecoveryIntensificationActionDraftRepository implements RecoveryIntensificationActionDraftRepository {
  private store = new Map<string, RecoveryIntensificationActionDraft>();

  async create(data: RecoveryIntensificationActionDraft): Promise<RecoveryIntensificationActionDraft> {
    const record = { ...data, intensificationActionDraftId: data.intensificationActionDraftId || uuid() };
    this.store.set(record.intensificationActionDraftId, record);
    return record;
  }

  async getById(id: string): Promise<RecoveryIntensificationActionDraft | null> {
    return this.store.get(id) ?? null;
  }

  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryIntensificationActionDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultRecoveryPlanId === planId);
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryIntensificationActionDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.studentRef === studentRef);
  }

  async listByStatus(schoolId: string, status: any): Promise<RecoveryIntensificationActionDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.draftStatus === status);
  }

  async update(id: string, data: Partial<RecoveryIntensificationActionDraft>): Promise<RecoveryIntensificationActionDraft> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`IntensificationActionDraft ${id} not found`);
    const updated = { ...existing, ...data, updatedAt: new Date() };
    this.store.set(id, updated);
    return updated;
  }

  async markReviewReady(id: string): Promise<RecoveryIntensificationActionDraft> {
    return this.update(id, { draftStatus: 'review_ready', reviewReadyAt: new Date() } as any);
  }
  async approveForFutureUse(id: string): Promise<RecoveryIntensificationActionDraft> {
    return this.update(id, { draftStatus: 'approved_for_future_use', approvedForFutureUseAt: new Date() } as any);
  }
  async suppress(id: string): Promise<RecoveryIntensificationActionDraft> {
    return this.update(id, { draftStatus: 'suppressed', suppressedAt: new Date() } as any);
  }
  async block(id: string): Promise<RecoveryIntensificationActionDraft> {
    return this.update(id, { draftStatus: 'blocked', blockedAt: new Date() } as any);
  }
  async void(id: string): Promise<RecoveryIntensificationActionDraft> {
    return this.update(id, { draftStatus: 'voided', voidedAt: new Date() } as any);
  }
}

export class InMemoryRecoveryPauseActionDraftRepository implements RecoveryPauseActionDraftRepository {
  private store = new Map<string, RecoveryPauseActionDraft>();

  async create(data: RecoveryPauseActionDraft): Promise<RecoveryPauseActionDraft> {
    const record = { ...data, pauseActionDraftId: data.pauseActionDraftId || uuid() };
    this.store.set(record.pauseActionDraftId, record);
    return record;
  }

  async getById(id: string): Promise<RecoveryPauseActionDraft | null> {
    return this.store.get(id) ?? null;
  }

  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryPauseActionDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultRecoveryPlanId === planId);
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryPauseActionDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.studentRef === studentRef);
  }

  async listByStatus(schoolId: string, status: any): Promise<RecoveryPauseActionDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.draftStatus === status);
  }

  async update(id: string, data: Partial<RecoveryPauseActionDraft>): Promise<RecoveryPauseActionDraft> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`PauseActionDraft ${id} not found`);
    const updated = { ...existing, ...data, updatedAt: new Date() };
    this.store.set(id, updated);
    return updated;
  }

  async markReviewReady(id: string): Promise<RecoveryPauseActionDraft> {
    return this.update(id, { draftStatus: 'review_ready', reviewReadyAt: new Date() } as any);
  }
  async approveForFutureUse(id: string): Promise<RecoveryPauseActionDraft> {
    return this.update(id, { draftStatus: 'approved_for_future_use', approvedForFutureUseAt: new Date() } as any);
  }
  async suppress(id: string): Promise<RecoveryPauseActionDraft> {
    return this.update(id, { draftStatus: 'suppressed', suppressedAt: new Date() } as any);
  }
  async block(id: string): Promise<RecoveryPauseActionDraft> {
    return this.update(id, { draftStatus: 'blocked', blockedAt: new Date() } as any);
  }
  async void(id: string): Promise<RecoveryPauseActionDraft> {
    return this.update(id, { draftStatus: 'voided', voidedAt: new Date() } as any);
  }
}

export class InMemoryRecoveryClosureActionDraftRepository implements RecoveryClosureActionDraftRepository {
  private store = new Map<string, RecoveryClosureActionDraft>();

  async create(data: RecoveryClosureActionDraft): Promise<RecoveryClosureActionDraft> {
    const record = { ...data, closureActionDraftId: data.closureActionDraftId || uuid() };
    this.store.set(record.closureActionDraftId, record);
    return record;
  }

  async getById(id: string): Promise<RecoveryClosureActionDraft | null> {
    return this.store.get(id) ?? null;
  }

  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryClosureActionDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultRecoveryPlanId === planId);
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryClosureActionDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.studentRef === studentRef);
  }

  async listByStatus(schoolId: string, status: any): Promise<RecoveryClosureActionDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.draftStatus === status);
  }

  async listByClosureType(schoolId: string, closureType: string): Promise<RecoveryClosureActionDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.closureType === closureType);
  }

  async update(id: string, data: Partial<RecoveryClosureActionDraft>): Promise<RecoveryClosureActionDraft> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`ClosureActionDraft ${id} not found`);
    const updated = { ...existing, ...data, updatedAt: new Date() };
    this.store.set(id, updated);
    return updated;
  }

  async markReviewReady(id: string): Promise<RecoveryClosureActionDraft> {
    return this.update(id, { draftStatus: 'review_ready', reviewReadyAt: new Date() } as any);
  }
  async approveForFutureUse(id: string): Promise<RecoveryClosureActionDraft> {
    return this.update(id, { draftStatus: 'approved_for_future_use', approvedForFutureUseAt: new Date() } as any);
  }
  async suppress(id: string): Promise<RecoveryClosureActionDraft> {
    return this.update(id, { draftStatus: 'suppressed', suppressedAt: new Date() } as any);
  }
  async block(id: string): Promise<RecoveryClosureActionDraft> {
    return this.update(id, { draftStatus: 'blocked', blockedAt: new Date() } as any);
  }
  async void(id: string): Promise<RecoveryClosureActionDraft> {
    return this.update(id, { draftStatus: 'voided', voidedAt: new Date() } as any);
  }
}

export class InMemoryRecoveryOutcomeApprovalGateRepository implements RecoveryOutcomeApprovalGateRepository {
  private store = new Map<string, RecoveryOutcomeApprovalGate>();

  async create(data: RecoveryOutcomeApprovalGate): Promise<RecoveryOutcomeApprovalGate> {
    const record = { ...data, approvalGateId: data.approvalGateId || uuid() };
    this.store.set(record.approvalGateId, record);
    return record;
  }

  async getById(id: string): Promise<RecoveryOutcomeApprovalGate | null> {
    return this.store.get(id) ?? null;
  }

  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryOutcomeApprovalGate[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultRecoveryPlanId === planId);
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryOutcomeApprovalGate[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.studentRef === studentRef);
  }

  async listByStatus(schoolId: string, status: ApprovalGateStatus): Promise<RecoveryOutcomeApprovalGate[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.gateStatus === status);
  }

  async update(id: string, data: Partial<RecoveryOutcomeApprovalGate>): Promise<RecoveryOutcomeApprovalGate> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`ApprovalGate ${id} not found`);
    const updated = { ...existing, ...data, updatedAt: new Date() };
    this.store.set(id, updated);
    return updated;
  }

  async markSatisfied(id: string): Promise<RecoveryOutcomeApprovalGate> {
    return this.update(id, { gateStatus: 'satisfied', satisfiedAt: new Date() } as any);
  }

  async markBlocked(id: string): Promise<RecoveryOutcomeApprovalGate> {
    return this.update(id, { gateStatus: 'blocked', blockedAt: new Date() } as any);
  }

  async void(id: string): Promise<RecoveryOutcomeApprovalGate> {
    return this.update(id, { gateStatus: 'voided', voidedAt: new Date() } as any);
  }
}

export class InMemoryRecoveryOutcomeMockActivationQueueRepository implements RecoveryOutcomeMockActivationQueueRepository {
  private store = new Map<string, RecoveryOutcomeMockActivationQueueItem>();

  async create(data: RecoveryOutcomeMockActivationQueueItem): Promise<RecoveryOutcomeMockActivationQueueItem> {
    const record = { ...data, mockActivationQueueItemId: data.mockActivationQueueItemId || uuid() };
    this.store.set(record.mockActivationQueueItemId, record);
    return record;
  }

  async getById(id: string): Promise<RecoveryOutcomeMockActivationQueueItem | null> {
    return this.store.get(id) ?? null;
  }

  async listBySchool(schoolId: string): Promise<RecoveryOutcomeMockActivationQueueItem[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryOutcomeMockActivationQueueItem[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultRecoveryPlanId === planId);
  }

  async listByStatus(schoolId: string, status: MockActivationQueueStatus): Promise<RecoveryOutcomeMockActivationQueueItem[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.queueStatus === status);
  }

  async update(id: string, data: Partial<RecoveryOutcomeMockActivationQueueItem>): Promise<RecoveryOutcomeMockActivationQueueItem> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`MockActivationQueueItem ${id} not found`);
    const updated = { ...existing, ...data, updatedAt: new Date() };
    this.store.set(id, updated);
    return updated;
  }

  async markDryRunReady(id: string): Promise<RecoveryOutcomeMockActivationQueueItem> {
    return this.update(id, { queueStatus: 'dry_run_ready', dryRunReadyAt: new Date() } as any);
  }

  async suppress(id: string): Promise<RecoveryOutcomeMockActivationQueueItem> {
    return this.update(id, { queueStatus: 'suppressed', suppressedAt: new Date() } as any);
  }

  async block(id: string): Promise<RecoveryOutcomeMockActivationQueueItem> {
    return this.update(id, { queueStatus: 'blocked', blockedAt: new Date() } as any);
  }

  async void(id: string): Promise<RecoveryOutcomeMockActivationQueueItem> {
    return this.update(id, { queueStatus: 'voided', voidedAt: new Date() } as any);
  }
}

export class InMemoryRecoveryOutcomeDryRunReceiptRepository implements RecoveryOutcomeDryRunReceiptRepository {
  private store = new Map<string, RecoveryOutcomeDryRunReceipt>();

  async create(data: RecoveryOutcomeDryRunReceipt): Promise<RecoveryOutcomeDryRunReceipt> {
    const record = { ...data, dryRunReceiptId: data.dryRunReceiptId || uuid() };
    this.store.set(record.dryRunReceiptId, record);
    return record;
  }

  async getById(id: string): Promise<RecoveryOutcomeDryRunReceipt | null> {
    return this.store.get(id) ?? null;
  }

  async listByQueueItemId(queueItemId: string): Promise<RecoveryOutcomeDryRunReceipt[]> {
    return Array.from(this.store.values()).filter(r => r.mockActivationQueueItemId === queueItemId);
  }

  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryOutcomeDryRunReceipt[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultRecoveryPlanId === planId);
  }

  async listByResult(schoolId: string, result: DryRunReceiptResult): Promise<RecoveryOutcomeDryRunReceipt[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.receiptResult === result);
  }

  async update(id: string, data: Partial<RecoveryOutcomeDryRunReceipt>): Promise<RecoveryOutcomeDryRunReceipt> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`DryRunReceipt ${id} not found`);
    const updated = { ...existing, ...data, updatedAt: new Date() };
    this.store.set(id, updated);
    return updated;
  }

  async void(id: string): Promise<RecoveryOutcomeDryRunReceipt> {
    return this.update(id, { voidedAt: new Date() } as any);
  }
}

export class InMemoryRecoveryOutcomeRollbackPlanRepository implements RecoveryOutcomeRollbackPlanRepository {
  private store = new Map<string, RecoveryOutcomeRollbackPlan>();

  async create(data: RecoveryOutcomeRollbackPlan): Promise<RecoveryOutcomeRollbackPlan> {
    const record = { ...data, rollbackPlanId: data.rollbackPlanId || uuid() };
    this.store.set(record.rollbackPlanId, record);
    return record;
  }

  async getById(id: string): Promise<RecoveryOutcomeRollbackPlan | null> {
    return this.store.get(id) ?? null;
  }

  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryOutcomeRollbackPlan[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultRecoveryPlanId === planId);
  }

  async listByStatus(schoolId: string, status: RollbackPlanStatus): Promise<RecoveryOutcomeRollbackPlan[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.rollbackStatus === status);
  }

  async update(id: string, data: Partial<RecoveryOutcomeRollbackPlan>): Promise<RecoveryOutcomeRollbackPlan> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`RollbackPlan ${id} not found`);
    const updated = { ...existing, ...data, updatedAt: new Date() };
    this.store.set(id, updated);
    return updated;
  }

  async markReviewReady(id: string): Promise<RecoveryOutcomeRollbackPlan> {
    return this.update(id, { rollbackStatus: 'review_ready', reviewReadyAt: new Date() } as any);
  }

  async approveForFutureUse(id: string): Promise<RecoveryOutcomeRollbackPlan> {
    return this.update(id, { rollbackStatus: 'approved_for_future_use', approvedForFutureUseAt: new Date() } as any);
  }

  async suppress(id: string): Promise<RecoveryOutcomeRollbackPlan> {
    return this.update(id, { rollbackStatus: 'suppressed', suppressedAt: new Date() } as any);
  }

  async block(id: string): Promise<RecoveryOutcomeRollbackPlan> {
    return this.update(id, { rollbackStatus: 'blocked', blockedAt: new Date() } as any);
  }

  async void(id: string): Promise<RecoveryOutcomeRollbackPlan> {
    return this.update(id, { rollbackStatus: 'voided', voidedAt: new Date() } as any);
  }
}

export class InMemoryRecoveryOutcomeSuppressionRuleRepository implements RecoveryOutcomeSuppressionRuleRepository {
  private store = new Map<string, RecoveryOutcomeSuppressionRule>();

  async create(data: RecoveryOutcomeSuppressionRule): Promise<RecoveryOutcomeSuppressionRule> {
    const record = { ...data, suppressionRuleId: data.suppressionRuleId || uuid() };
    this.store.set(record.suppressionRuleId, record);
    return record;
  }

  async getById(id: string): Promise<RecoveryOutcomeSuppressionRule | null> {
    return this.store.get(id) ?? null;
  }

  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryOutcomeSuppressionRule[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultRecoveryPlanId === planId);
  }

  async listByStatus(schoolId: string, status: SuppressionRuleStatus): Promise<RecoveryOutcomeSuppressionRule[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.ruleStatus === status);
  }

  async update(id: string, data: Partial<RecoveryOutcomeSuppressionRule>): Promise<RecoveryOutcomeSuppressionRule> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`SuppressionRule ${id} not found`);
    const updated = { ...existing, ...data, updatedAt: new Date() };
    this.store.set(id, updated);
    return updated;
  }

  async activateForFutureUse(id: string): Promise<RecoveryOutcomeSuppressionRule> {
    return this.update(id, { ruleStatus: 'active', activatedForFutureUseAt: new Date() } as any);
  }

  async suppress(id: string): Promise<RecoveryOutcomeSuppressionRule> {
    return this.update(id, { ruleStatus: 'suppressed', suppressedAt: new Date() } as any);
  }

  async block(id: string): Promise<RecoveryOutcomeSuppressionRule> {
    return this.update(id, { ruleStatus: 'blocked', blockedAt: new Date() } as any);
  }

  async void(id: string): Promise<RecoveryOutcomeSuppressionRule> {
    return this.update(id, { ruleStatus: 'voided', voidedAt: new Date() } as any);
  }
}

export class InMemoryRecoveryOutcomeActionSummaryRepository implements RecoveryOutcomeActionSummaryRepository {
  private store = new Map<string, RecoveryOutcomeActionSummary>();

  async create(data: RecoveryOutcomeActionSummary): Promise<RecoveryOutcomeActionSummary> {
    const record = { ...data, actionSummaryId: data.actionSummaryId || uuid() };
    this.store.set(record.actionSummaryId, record);
    return record;
  }

  async getById(id: string): Promise<RecoveryOutcomeActionSummary | null> {
    return this.store.get(id) ?? null;
  }

  async listBySchool(schoolId: string): Promise<RecoveryOutcomeActionSummary[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryOutcomeActionSummary[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.studentRef === studentRef);
  }

  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryOutcomeActionSummary[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultRecoveryPlanId === planId);
  }

  async listByStatus(schoolId: string, status: ActionSummaryStatus): Promise<RecoveryOutcomeActionSummary[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.summaryStatus === status);
  }

  async update(id: string, data: Partial<RecoveryOutcomeActionSummary>): Promise<RecoveryOutcomeActionSummary> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`ActionSummary ${id} not found`);
    const updated = { ...existing, ...data, updatedAt: new Date() };
    this.store.set(id, updated);
    return updated;
  }

  async markStale(id: string): Promise<RecoveryOutcomeActionSummary> {
    return this.update(id, { summaryStatus: 'stale', staleAt: new Date() } as any);
  }

  async refresh(id: string, data: Partial<RecoveryOutcomeActionSummary>): Promise<RecoveryOutcomeActionSummary> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`ActionSummary ${id} not found`);
    const updated = { ...existing, ...data, summaryStatus: 'active' as ActionSummaryStatus, refreshedAt: new Date(), updatedAt: new Date() };
    this.store.set(id, updated);
    return updated;
  }

  async block(id: string): Promise<RecoveryOutcomeActionSummary> {
    return this.update(id, { summaryStatus: 'blocked', blockedAt: new Date() } as any);
  }

  async void(id: string): Promise<RecoveryOutcomeActionSummary> {
    return this.update(id, { summaryStatus: 'voided', voidedAt: new Date() } as any);
  }
}

export class InMemoryRecoveryOutcomeActionAuditRepository implements RecoveryOutcomeActionAuditRepository {
  private store = new Map<string, RecoveryOutcomeActionAuditEvent>();

  async create(data: RecoveryOutcomeActionAuditEvent): Promise<RecoveryOutcomeActionAuditEvent> {
    const record = { ...data, auditEventId: data.auditEventId || uuid() };
    this.store.set(record.auditEventId, record);
    return record;
  }

  async listBySchool(schoolId: string): Promise<RecoveryOutcomeActionAuditEvent[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByEventType(schoolId: string, eventType: string): Promise<RecoveryOutcomeActionAuditEvent[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.eventType === eventType);
  }
}

export class InMemoryRecoveryOutcomeActionIdempotencyRepository implements RecoveryOutcomeActionIdempotencyRepository {
  private store = new Map<string, RecoveryOutcomeActionIdempotencyEntry>();

  async create(data: RecoveryOutcomeActionIdempotencyEntry): Promise<RecoveryOutcomeActionIdempotencyEntry> {
    const record = { ...data, idempotencyId: data.idempotencyId || uuid() };
    this.store.set(record.idempotencyId, record);
    return record;
  }

  async getByKey(schoolId: string, idempotencyKey: string): Promise<RecoveryOutcomeActionIdempotencyEntry | null> {
    return Array.from(this.store.values()).find(r => r.schoolId === schoolId && r.idempotencyKey === idempotencyKey) ?? null;
  }

  async markCompleted(id: string, resourceType: string, resourceId: string): Promise<RecoveryOutcomeActionIdempotencyEntry> {
    return this.update(id, { status: 'completed', resourceType, resourceId } as any);
  }

  private async update(id: string, data: Partial<RecoveryOutcomeActionIdempotencyEntry>): Promise<RecoveryOutcomeActionIdempotencyEntry> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`IdempotencyEntry ${id} not found`);
    const updated = { ...existing, ...data, updatedAt: new Date() as any };
    this.store.set(id, updated);
    return updated;
  }
}
