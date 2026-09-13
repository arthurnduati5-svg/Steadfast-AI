import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
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

export class PrismaRecoveryOutcomeActionReadinessRepository implements RecoveryOutcomeActionReadinessRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: RecoveryOutcomeActionReadiness): Promise<RecoveryOutcomeActionReadiness> {
    const created = await this.prisma.recoveryOutcomeActionReadinessRecord.create({ data: this.toPrisma(data) as any });
    return this.fromPrisma(created);
  }

  async getById(id: string): Promise<RecoveryOutcomeActionReadiness | null> {
    const found = await this.prisma.recoveryOutcomeActionReadinessRecord.findUnique({ where: { actionReadinessId: id } });
    return found ? this.fromPrisma(found) : null;
  }

  async listBySchool(schoolId: string): Promise<RecoveryOutcomeActionReadiness[]> {
    const records = await this.prisma.recoveryOutcomeActionReadinessRecord.findMany({ where: { schoolId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryOutcomeActionReadiness[]> {
    const records = await this.prisma.recoveryOutcomeActionReadinessRecord.findMany({ where: { schoolId, studentRef } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryOutcomeActionReadiness[]> {
    const records = await this.prisma.recoveryOutcomeActionReadinessRecord.findMany({ where: { schoolId, resultRecoveryPlanId: planId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByStatus(schoolId: string, status: RecoveryOutcomeActionReadinessStatus): Promise<RecoveryOutcomeActionReadiness[]> {
    const records = await this.prisma.recoveryOutcomeActionReadinessRecord.findMany({ where: { schoolId, readinessStatus: status } });
    return records.map(r => this.fromPrisma(r));
  }

  async update(id: string, data: Partial<RecoveryOutcomeActionReadiness>): Promise<RecoveryOutcomeActionReadiness> {
    const updated = await this.prisma.recoveryOutcomeActionReadinessRecord.update({ where: { actionReadinessId: id }, data: this.toPrisma(data) as any });
    return this.fromPrisma(updated);
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

  private toPrisma(data: any): any {
    const { ...rest } = data;
    return rest;
  }

  private fromPrisma(data: any): RecoveryOutcomeActionReadiness {
    return {
      ...data,
      readinessChecksJson: typeof data.readinessChecksJson === 'string' ? JSON.parse(data.readinessChecksJson) : data.readinessChecksJson,
      sourceRefsJson: typeof data.sourceRefsJson === 'string' ? JSON.parse(data.sourceRefsJson) : data.sourceRefsJson,
    } as RecoveryOutcomeActionReadiness;
  }
}

// R8-G.3B-A: the five Package-20 target families below are productionized
// against the canonical Prisma models. The remaining six repositories are
// intentionally left as stubs owned by R8-G.3B-B.

function passthroughJson(value: unknown): unknown {
  return value;
}

/**
 * Shared lifecycle helpers for the five target family repositories.
 * Json columns are stored/returned as native Prisma Json (no stringify),
 * status vocabulary and timestamp fields mirror the in-memory oracle.
 */
function familyTimestampPatch(data: Record<string, unknown>): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) patch[k] = passthroughJson(v);
  return patch;
}

export class PrismaRecoveryOutcomeActionBundleRepository implements RecoveryOutcomeActionBundleRepository {
  constructor(private prisma: PrismaClient) {}

  private fromPrisma(row: Record<string, any>): RecoveryOutcomeActionBundle {
    return { ...row } as RecoveryOutcomeActionBundle;
  }

  async create(data: RecoveryOutcomeActionBundle): Promise<RecoveryOutcomeActionBundle> {
    const created = await this.prisma.recoveryOutcomeActionBundleRecord.create({ data: { ...data } as any });
    return this.fromPrisma(created as unknown as Record<string, any>);
  }

  async getById(id: string): Promise<RecoveryOutcomeActionBundle | null> {
    const found = await this.prisma.recoveryOutcomeActionBundleRecord.findUnique({ where: { actionBundleId: id } });
    return found ? this.fromPrisma(found as unknown as Record<string, any>) : null;
  }

  async listBySchool(schoolId: string): Promise<RecoveryOutcomeActionBundle[]> {
    const rows = await this.prisma.recoveryOutcomeActionBundleRecord.findMany({ where: { schoolId } });
    return rows.map(r => this.fromPrisma(r as unknown as Record<string, any>));
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryOutcomeActionBundle[]> {
    const rows = await this.prisma.recoveryOutcomeActionBundleRecord.findMany({ where: { schoolId, studentRef } });
    return rows.map(r => this.fromPrisma(r as unknown as Record<string, any>));
  }

  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryOutcomeActionBundle[]> {
    const rows = await this.prisma.recoveryOutcomeActionBundleRecord.findMany({ where: { schoolId, resultRecoveryPlanId: planId } });
    return rows.map(r => this.fromPrisma(r as unknown as Record<string, any>));
  }

  async listByStatus(schoolId: string, status: ActionBundleStatus): Promise<RecoveryOutcomeActionBundle[]> {
    const rows = await this.prisma.recoveryOutcomeActionBundleRecord.findMany({ where: { schoolId, bundleStatus: status } });
    return rows.map(r => this.fromPrisma(r as unknown as Record<string, any>));
  }

  async listByType(schoolId: string, bundleType: ActionBundleType): Promise<RecoveryOutcomeActionBundle[]> {
    const rows = await this.prisma.recoveryOutcomeActionBundleRecord.findMany({ where: { schoolId, bundleType } });
    return rows.map(r => this.fromPrisma(r as unknown as Record<string, any>));
  }

  async update(id: string, data: Partial<RecoveryOutcomeActionBundle>): Promise<RecoveryOutcomeActionBundle> {
    const { actionBundleId: _ignored, ...rest } = data as Record<string, any>;
    void _ignored;
    const updated = await this.prisma.recoveryOutcomeActionBundleRecord.update({
      where: { actionBundleId: id },
      data: { ...familyTimestampPatch(rest), updatedAt: new Date() } as any,
    });
    return this.fromPrisma(updated as unknown as Record<string, any>);
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

const DRAFT_TRANSITION_FIELDS = {
  review_ready: { field: 'draftStatus', ts: 'reviewReadyAt' },
  approved_for_future_use: { field: 'draftStatus', ts: 'approvedForFutureUseAt' },
  suppressed: { field: 'draftStatus', ts: 'suppressedAt' },
  blocked: { field: 'draftStatus', ts: 'blockedAt' },
  voided: { field: 'draftStatus', ts: 'voidedAt' },
} as const;

type DraftTransitionStatus = keyof typeof DRAFT_TRANSITION_FIELDS;

class PrismaDraftFamilyDelegate {
  constructor(
    private prisma: PrismaClient,
    private model: 'recoveryContinuationActionDraftRecord' | 'recoveryIntensificationActionDraftRecord' | 'recoveryPauseActionDraftRecord' | 'recoveryClosureActionDraftRecord',
    private idField: string,
  ) {}

  private delegate(): any {
    return (this.prisma as any)[this.model];
  }

  private fromPrisma(row: Record<string, any>): any {
    return { ...row };
  }

  async create(data: any): Promise<any> {
    const created = await this.delegate().create({ data: { ...data } });
    return this.fromPrisma(created);
  }

  async getById(id: string): Promise<any | null> {
    const found = await this.delegate().findUnique({ where: { [this.idField]: id } });
    return found ? this.fromPrisma(found) : null;
  }

  async listWhere(where: Record<string, unknown>): Promise<any[]> {
    const rows = await this.delegate().findMany({ where });
    return rows.map((r: Record<string, any>) => this.fromPrisma(r));
  }

  async update(id: string, data: Record<string, unknown>): Promise<any> {
    const { [this.idField]: _ignored, ...rest } = data;
    void _ignored;
    const updated = await this.delegate().update({
      where: { [this.idField]: id },
      data: { ...familyTimestampPatch(rest), updatedAt: new Date() },
    });
    return this.fromPrisma(updated);
  }

  async transition(id: string, status: DraftTransitionStatus): Promise<any> {
    const spec = DRAFT_TRANSITION_FIELDS[status];
    return this.update(id, { [spec.field]: status, [spec.ts]: new Date() });
  }
}

export class PrismaRecoveryContinuationActionDraftRepository implements RecoveryContinuationActionDraftRepository {
  private d: PrismaDraftFamilyDelegate;
  constructor(prisma: PrismaClient) {
    this.d = new PrismaDraftFamilyDelegate(prisma, 'recoveryContinuationActionDraftRecord', 'continuationActionDraftId');
  }
  async create(data: RecoveryContinuationActionDraft): Promise<RecoveryContinuationActionDraft> { return this.d.create(data); }
  async getById(id: string): Promise<RecoveryContinuationActionDraft | null> { return this.d.getById(id); }
  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryContinuationActionDraft[]> { return this.d.listWhere({ schoolId, resultRecoveryPlanId: planId }); }
  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryContinuationActionDraft[]> { return this.d.listWhere({ schoolId, studentRef }); }
  async listByStatus(schoolId: string, status: any): Promise<RecoveryContinuationActionDraft[]> { return this.d.listWhere({ schoolId, draftStatus: status }); }
  async update(id: string, data: Partial<RecoveryContinuationActionDraft>): Promise<RecoveryContinuationActionDraft> { return this.d.update(id, data as Record<string, unknown>); }
  async markReviewReady(id: string): Promise<RecoveryContinuationActionDraft> { return this.d.transition(id, 'review_ready'); }
  async approveForFutureUse(id: string): Promise<RecoveryContinuationActionDraft> { return this.d.transition(id, 'approved_for_future_use'); }
  async suppress(id: string): Promise<RecoveryContinuationActionDraft> { return this.d.transition(id, 'suppressed'); }
  async block(id: string): Promise<RecoveryContinuationActionDraft> { return this.d.transition(id, 'blocked'); }
  async void(id: string): Promise<RecoveryContinuationActionDraft> { return this.d.transition(id, 'voided'); }
}

export class PrismaRecoveryIntensificationActionDraftRepository implements RecoveryIntensificationActionDraftRepository {
  private d: PrismaDraftFamilyDelegate;
  constructor(prisma: PrismaClient) {
    this.d = new PrismaDraftFamilyDelegate(prisma, 'recoveryIntensificationActionDraftRecord', 'intensificationActionDraftId');
  }
  async create(data: RecoveryIntensificationActionDraft): Promise<RecoveryIntensificationActionDraft> { return this.d.create(data); }
  async getById(id: string): Promise<RecoveryIntensificationActionDraft | null> { return this.d.getById(id); }
  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryIntensificationActionDraft[]> { return this.d.listWhere({ schoolId, resultRecoveryPlanId: planId }); }
  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryIntensificationActionDraft[]> { return this.d.listWhere({ schoolId, studentRef }); }
  async listByStatus(schoolId: string, status: any): Promise<RecoveryIntensificationActionDraft[]> { return this.d.listWhere({ schoolId, draftStatus: status }); }
  async update(id: string, data: Partial<RecoveryIntensificationActionDraft>): Promise<RecoveryIntensificationActionDraft> { return this.d.update(id, data as Record<string, unknown>); }
  async markReviewReady(id: string): Promise<RecoveryIntensificationActionDraft> { return this.d.transition(id, 'review_ready'); }
  async approveForFutureUse(id: string): Promise<RecoveryIntensificationActionDraft> { return this.d.transition(id, 'approved_for_future_use'); }
  async suppress(id: string): Promise<RecoveryIntensificationActionDraft> { return this.d.transition(id, 'suppressed'); }
  async block(id: string): Promise<RecoveryIntensificationActionDraft> { return this.d.transition(id, 'blocked'); }
  async void(id: string): Promise<RecoveryIntensificationActionDraft> { return this.d.transition(id, 'voided'); }
}

export class PrismaRecoveryPauseActionDraftRepository implements RecoveryPauseActionDraftRepository {
  private d: PrismaDraftFamilyDelegate;
  constructor(prisma: PrismaClient) {
    this.d = new PrismaDraftFamilyDelegate(prisma, 'recoveryPauseActionDraftRecord', 'pauseActionDraftId');
  }
  async create(data: RecoveryPauseActionDraft): Promise<RecoveryPauseActionDraft> { return this.d.create(data); }
  async getById(id: string): Promise<RecoveryPauseActionDraft | null> { return this.d.getById(id); }
  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryPauseActionDraft[]> { return this.d.listWhere({ schoolId, resultRecoveryPlanId: planId }); }
  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryPauseActionDraft[]> { return this.d.listWhere({ schoolId, studentRef }); }
  async listByStatus(schoolId: string, status: any): Promise<RecoveryPauseActionDraft[]> { return this.d.listWhere({ schoolId, draftStatus: status }); }
  async update(id: string, data: Partial<RecoveryPauseActionDraft>): Promise<RecoveryPauseActionDraft> { return this.d.update(id, data as Record<string, unknown>); }
  async markReviewReady(id: string): Promise<RecoveryPauseActionDraft> { return this.d.transition(id, 'review_ready'); }
  async approveForFutureUse(id: string): Promise<RecoveryPauseActionDraft> { return this.d.transition(id, 'approved_for_future_use'); }
  async suppress(id: string): Promise<RecoveryPauseActionDraft> { return this.d.transition(id, 'suppressed'); }
  async block(id: string): Promise<RecoveryPauseActionDraft> { return this.d.transition(id, 'blocked'); }
  async void(id: string): Promise<RecoveryPauseActionDraft> { return this.d.transition(id, 'voided'); }
}

export class PrismaRecoveryClosureActionDraftRepository implements RecoveryClosureActionDraftRepository {
  private d: PrismaDraftFamilyDelegate;
  constructor(prisma: PrismaClient) {
    this.d = new PrismaDraftFamilyDelegate(prisma, 'recoveryClosureActionDraftRecord', 'closureActionDraftId');
  }
  async create(data: RecoveryClosureActionDraft): Promise<RecoveryClosureActionDraft> { return this.d.create(data); }
  async getById(id: string): Promise<RecoveryClosureActionDraft | null> { return this.d.getById(id); }
  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryClosureActionDraft[]> { return this.d.listWhere({ schoolId, resultRecoveryPlanId: planId }); }
  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryClosureActionDraft[]> { return this.d.listWhere({ schoolId, studentRef }); }
  async listByStatus(schoolId: string, status: any): Promise<RecoveryClosureActionDraft[]> { return this.d.listWhere({ schoolId, draftStatus: status }); }
  async listByClosureType(schoolId: string, closureType: string): Promise<RecoveryClosureActionDraft[]> { return this.d.listWhere({ schoolId, closureType }); }
  async update(id: string, data: Partial<RecoveryClosureActionDraft>): Promise<RecoveryClosureActionDraft> { return this.d.update(id, data as Record<string, unknown>); }
  async markReviewReady(id: string): Promise<RecoveryClosureActionDraft> { return this.d.transition(id, 'review_ready'); }
  async approveForFutureUse(id: string): Promise<RecoveryClosureActionDraft> { return this.d.transition(id, 'approved_for_future_use'); }
  async suppress(id: string): Promise<RecoveryClosureActionDraft> { return this.d.transition(id, 'suppressed'); }
  async block(id: string): Promise<RecoveryClosureActionDraft> { return this.d.transition(id, 'blocked'); }
  async void(id: string): Promise<RecoveryClosureActionDraft> { return this.d.transition(id, 'voided'); }
}

export class PrismaRecoveryOutcomeApprovalGateRepository implements RecoveryOutcomeApprovalGateRepository {
  constructor(private prisma: PrismaClient) {}
  async create(data: RecoveryOutcomeApprovalGate): Promise<RecoveryOutcomeApprovalGate> { throw new Error('Not implemented in stub'); }
  async getById(id: string): Promise<RecoveryOutcomeApprovalGate | null> { throw new Error('Not implemented in stub'); }
  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryOutcomeApprovalGate[]> { throw new Error('Not implemented in stub'); }
  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryOutcomeApprovalGate[]> { throw new Error('Not implemented in stub'); }
  async listByStatus(schoolId: string, status: ApprovalGateStatus): Promise<RecoveryOutcomeApprovalGate[]> { throw new Error('Not implemented in stub'); }
  async update(id: string, data: Partial<RecoveryOutcomeApprovalGate>): Promise<RecoveryOutcomeApprovalGate> { throw new Error('Not implemented in stub'); }
  async markSatisfied(id: string): Promise<RecoveryOutcomeApprovalGate> { throw new Error('Not implemented in stub'); }
  async markBlocked(id: string): Promise<RecoveryOutcomeApprovalGate> { throw new Error('Not implemented in stub'); }
  async void(id: string): Promise<RecoveryOutcomeApprovalGate> { throw new Error('Not implemented in stub'); }
}

export class PrismaRecoveryOutcomeMockActivationQueueRepository implements RecoveryOutcomeMockActivationQueueRepository {
  constructor(private prisma: PrismaClient) {}
  async create(data: RecoveryOutcomeMockActivationQueueItem): Promise<RecoveryOutcomeMockActivationQueueItem> { throw new Error('Not implemented in stub'); }
  async getById(id: string): Promise<RecoveryOutcomeMockActivationQueueItem | null> { throw new Error('Not implemented in stub'); }
  async listBySchool(schoolId: string): Promise<RecoveryOutcomeMockActivationQueueItem[]> { throw new Error('Not implemented in stub'); }
  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryOutcomeMockActivationQueueItem[]> { throw new Error('Not implemented in stub'); }
  async listByStatus(schoolId: string, status: MockActivationQueueStatus): Promise<RecoveryOutcomeMockActivationQueueItem[]> { throw new Error('Not implemented in stub'); }
  async update(id: string, data: Partial<RecoveryOutcomeMockActivationQueueItem>): Promise<RecoveryOutcomeMockActivationQueueItem> { throw new Error('Not implemented in stub'); }
  async markDryRunReady(id: string): Promise<RecoveryOutcomeMockActivationQueueItem> { throw new Error('Not implemented in stub'); }
  async suppress(id: string): Promise<RecoveryOutcomeMockActivationQueueItem> { throw new Error('Not implemented in stub'); }
  async block(id: string): Promise<RecoveryOutcomeMockActivationQueueItem> { throw new Error('Not implemented in stub'); }
  async void(id: string): Promise<RecoveryOutcomeMockActivationQueueItem> { throw new Error('Not implemented in stub'); }
}

export class PrismaRecoveryOutcomeDryRunReceiptRepository implements RecoveryOutcomeDryRunReceiptRepository {
  constructor(private prisma: PrismaClient) {}
  async create(data: RecoveryOutcomeDryRunReceipt): Promise<RecoveryOutcomeDryRunReceipt> { throw new Error('Not implemented in stub'); }
  async getById(id: string): Promise<RecoveryOutcomeDryRunReceipt | null> { throw new Error('Not implemented in stub'); }
  async listByQueueItemId(queueItemId: string): Promise<RecoveryOutcomeDryRunReceipt[]> { throw new Error('Not implemented in stub'); }
  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryOutcomeDryRunReceipt[]> { throw new Error('Not implemented in stub'); }
  async listByResult(schoolId: string, result: DryRunReceiptResult): Promise<RecoveryOutcomeDryRunReceipt[]> { throw new Error('Not implemented in stub'); }
  async update(id: string, data: Partial<RecoveryOutcomeDryRunReceipt>): Promise<RecoveryOutcomeDryRunReceipt> { throw new Error('Not implemented in stub'); }
  async void(id: string): Promise<RecoveryOutcomeDryRunReceipt> { throw new Error('Not implemented in stub'); }
}

export class PrismaRecoveryOutcomeRollbackPlanRepository implements RecoveryOutcomeRollbackPlanRepository {
  constructor(private prisma: PrismaClient) {}
  async create(data: RecoveryOutcomeRollbackPlan): Promise<RecoveryOutcomeRollbackPlan> { throw new Error('Not implemented in stub'); }
  async getById(id: string): Promise<RecoveryOutcomeRollbackPlan | null> { throw new Error('Not implemented in stub'); }
  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryOutcomeRollbackPlan[]> { throw new Error('Not implemented in stub'); }
  async listByStatus(schoolId: string, status: RollbackPlanStatus): Promise<RecoveryOutcomeRollbackPlan[]> { throw new Error('Not implemented in stub'); }
  async update(id: string, data: Partial<RecoveryOutcomeRollbackPlan>): Promise<RecoveryOutcomeRollbackPlan> { throw new Error('Not implemented in stub'); }
  async markReviewReady(id: string): Promise<RecoveryOutcomeRollbackPlan> { throw new Error('Not implemented in stub'); }
  async approveForFutureUse(id: string): Promise<RecoveryOutcomeRollbackPlan> { throw new Error('Not implemented in stub'); }
  async suppress(id: string): Promise<RecoveryOutcomeRollbackPlan> { throw new Error('Not implemented in stub'); }
  async block(id: string): Promise<RecoveryOutcomeRollbackPlan> { throw new Error('Not implemented in stub'); }
  async void(id: string): Promise<RecoveryOutcomeRollbackPlan> { throw new Error('Not implemented in stub'); }
}

export class PrismaRecoveryOutcomeSuppressionRuleRepository implements RecoveryOutcomeSuppressionRuleRepository {
  constructor(private prisma: PrismaClient) {}
  async create(data: RecoveryOutcomeSuppressionRule): Promise<RecoveryOutcomeSuppressionRule> { throw new Error('Not implemented in stub'); }
  async getById(id: string): Promise<RecoveryOutcomeSuppressionRule | null> { throw new Error('Not implemented in stub'); }
  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryOutcomeSuppressionRule[]> { throw new Error('Not implemented in stub'); }
  async listByStatus(schoolId: string, status: SuppressionRuleStatus): Promise<RecoveryOutcomeSuppressionRule[]> { throw new Error('Not implemented in stub'); }
  async update(id: string, data: Partial<RecoveryOutcomeSuppressionRule>): Promise<RecoveryOutcomeSuppressionRule> { throw new Error('Not implemented in stub'); }
  async activateForFutureUse(id: string): Promise<RecoveryOutcomeSuppressionRule> { throw new Error('Not implemented in stub'); }
  async suppress(id: string): Promise<RecoveryOutcomeSuppressionRule> { throw new Error('Not implemented in stub'); }
  async block(id: string): Promise<RecoveryOutcomeSuppressionRule> { throw new Error('Not implemented in stub'); }
  async void(id: string): Promise<RecoveryOutcomeSuppressionRule> { throw new Error('Not implemented in stub'); }
}

export class PrismaRecoveryOutcomeActionSummaryRepository implements RecoveryOutcomeActionSummaryRepository {
  constructor(private prisma: PrismaClient) {}
  async create(data: RecoveryOutcomeActionSummary): Promise<RecoveryOutcomeActionSummary> { throw new Error('Not implemented in stub'); }
  async getById(id: string): Promise<RecoveryOutcomeActionSummary | null> { throw new Error('Not implemented in stub'); }
  async listBySchool(schoolId: string): Promise<RecoveryOutcomeActionSummary[]> { throw new Error('Not implemented in stub'); }
  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryOutcomeActionSummary[]> { throw new Error('Not implemented in stub'); }
  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryOutcomeActionSummary[]> { throw new Error('Not implemented in stub'); }
  async listByStatus(schoolId: string, status: ActionSummaryStatus): Promise<RecoveryOutcomeActionSummary[]> { throw new Error('Not implemented in stub'); }
  async update(id: string, data: Partial<RecoveryOutcomeActionSummary>): Promise<RecoveryOutcomeActionSummary> { throw new Error('Not implemented in stub'); }
  async markStale(id: string): Promise<RecoveryOutcomeActionSummary> { throw new Error('Not implemented in stub'); }
  async refresh(id: string, data: Partial<RecoveryOutcomeActionSummary>): Promise<RecoveryOutcomeActionSummary> { throw new Error('Not implemented in stub'); }
  async block(id: string): Promise<RecoveryOutcomeActionSummary> { throw new Error('Not implemented in stub'); }
  async void(id: string): Promise<RecoveryOutcomeActionSummary> { throw new Error('Not implemented in stub'); }
}

// ─── R8-G.2 production implementations ─────────────────────────────
// Only the Action Readiness family (readiness + audit + idempotency) is
// productionized. All other Prisma repositories above remain stubs.

function toPrismaAudit(data: RecoveryOutcomeActionAuditEvent): Record<string, unknown> {
  return {
    auditEventId: data.auditEventId && data.auditEventId.trim() !== '' ? data.auditEventId : randomUUID(),
    schoolId: data.schoolId,
    actionReadinessId: data.actionReadinessId ?? null,
    actionBundleId: data.actionBundleId ?? null,
    continuationActionDraftId: data.continuationActionDraftId ?? null,
    intensificationActionDraftId: data.intensificationActionDraftId ?? null,
    pauseActionDraftId: data.pauseActionDraftId ?? null,
    closureActionDraftId: data.closureActionDraftId ?? null,
    approvalGateId: data.approvalGateId ?? null,
    mockActivationQueueItemId: data.mockActivationQueueItemId ?? null,
    dryRunReceiptId: data.dryRunReceiptId ?? null,
    rollbackPlanId: data.rollbackPlanId ?? null,
    suppressionRuleId: data.suppressionRuleId ?? null,
    actionSummaryId: data.actionSummaryId ?? null,
    actorId: data.actorId,
    actorRole: data.actorRole,
    eventType: data.eventType,
    decision: data.decision,
    safeSummary: data.safeSummary,
    reasonCodesJson: data.reasonCodesJson ?? {},
    metadataJson: data.metadataJson ?? {},
    requestId: data.requestId ?? null,
    correlationId: data.correlationId ?? null,
  };
}

function fromPrismaAudit(row: Record<string, any>): RecoveryOutcomeActionAuditEvent {
  return {
    auditEventId: row.auditEventId,
    schoolId: row.schoolId,
    actionReadinessId: row.actionReadinessId ?? undefined,
    actionBundleId: row.actionBundleId ?? undefined,
    continuationActionDraftId: row.continuationActionDraftId ?? undefined,
    intensificationActionDraftId: row.intensificationActionDraftId ?? undefined,
    pauseActionDraftId: row.pauseActionDraftId ?? undefined,
    closureActionDraftId: row.closureActionDraftId ?? undefined,
    approvalGateId: row.approvalGateId ?? undefined,
    mockActivationQueueItemId: row.mockActivationQueueItemId ?? undefined,
    dryRunReceiptId: row.dryRunReceiptId ?? undefined,
    rollbackPlanId: row.rollbackPlanId ?? undefined,
    suppressionRuleId: row.suppressionRuleId ?? undefined,
    actionSummaryId: row.actionSummaryId ?? undefined,
    actorId: row.actorId,
    actorRole: row.actorRole,
    eventType: row.eventType,
    decision: row.decision,
    safeSummary: row.safeSummary,
    reasonCodesJson: (row.reasonCodesJson ?? {}) as Record<string, unknown>,
    metadataJson: (row.metadataJson ?? {}) as Record<string, unknown>,
    requestId: row.requestId ?? undefined,
    correlationId: row.correlationId ?? undefined,
    createdAt: row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt),
  };
}

export class PrismaRecoveryOutcomeActionAuditRepository implements RecoveryOutcomeActionAuditRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: RecoveryOutcomeActionAuditEvent): Promise<RecoveryOutcomeActionAuditEvent> {
    const created = await this.prisma.recoveryOutcomeActionAuditRecord.create({ data: toPrismaAudit(data) as any });
    return fromPrismaAudit(created as unknown as Record<string, any>);
  }

  async listBySchool(schoolId: string): Promise<RecoveryOutcomeActionAuditEvent[]> {
    const rows = await this.prisma.recoveryOutcomeActionAuditRecord.findMany({
      where: { schoolId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map(r => fromPrismaAudit(r as unknown as Record<string, any>));
  }

  async listByEventType(schoolId: string, eventType: string): Promise<RecoveryOutcomeActionAuditEvent[]> {
    const rows = await this.prisma.recoveryOutcomeActionAuditRecord.findMany({
      where: { schoolId, eventType },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map(r => fromPrismaAudit(r as unknown as Record<string, any>));
  }
}

function toPrismaIdempotency(data: RecoveryOutcomeActionIdempotencyEntry): Record<string, unknown> {
  const now = new Date();
  return {
    actionIdempotencyId: data.idempotencyId && data.idempotencyId.trim() !== '' ? data.idempotencyId : randomUUID(),
    schoolId: data.schoolId,
    operation: data.operation,
    idempotencyKey: data.idempotencyKey,
    requestHash: data.requestHash,
    status: data.status,
    resourceType: data.resourceType ?? null,
    resourceId: data.resourceId ?? null,
    safeResultSummary: null,
    createdAt: data.createdAt ?? now,
    updatedAt: now,
    expiresAt: data.expiresAt ?? null,
  };
}

function fromPrismaIdempotency(row: Record<string, any>): RecoveryOutcomeActionIdempotencyEntry {
  return {
    idempotencyId: row.actionIdempotencyId,
    schoolId: row.schoolId,
    operation: row.operation,
    idempotencyKey: row.idempotencyKey,
    requestHash: row.requestHash,
    status: row.status,
    resourceType: row.resourceType ?? undefined,
    resourceId: row.resourceId ?? undefined,
    createdAt: row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt),
    expiresAt: row.expiresAt ? (row.expiresAt instanceof Date ? row.expiresAt : new Date(row.expiresAt)) : undefined,
  };
}

export class PrismaRecoveryOutcomeActionIdempotencyRepository implements RecoveryOutcomeActionIdempotencyRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: RecoveryOutcomeActionIdempotencyEntry): Promise<RecoveryOutcomeActionIdempotencyEntry> {
    const created = await this.prisma.recoveryOutcomeActionIdempotencyRecord.create({ data: toPrismaIdempotency(data) as any });
    return fromPrismaIdempotency(created as unknown as Record<string, any>);
  }

  async getByKey(schoolId: string, idempotencyKey: string): Promise<RecoveryOutcomeActionIdempotencyEntry | null> {
    const found = await this.prisma.recoveryOutcomeActionIdempotencyRecord.findFirst({
      where: { schoolId, idempotencyKey },
      orderBy: { createdAt: 'asc' },
    });
    return found ? fromPrismaIdempotency(found as unknown as Record<string, any>) : null;
  }

  async markCompleted(id: string, resourceType: string, resourceId: string): Promise<RecoveryOutcomeActionIdempotencyEntry> {
    const updated = await this.prisma.recoveryOutcomeActionIdempotencyRecord.update({
      where: { actionIdempotencyId: id },
      data: { status: 'completed', resourceType, resourceId, updatedAt: new Date() },
    });
    return fromPrismaIdempotency(updated as unknown as Record<string, any>);
  }
}
