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

// Additional Prisma repository classes follow the same pattern
// For brevity, stubs are provided for the remaining 13 repositories
// Full implementations would mirror the in-memory pattern with Prisma client calls

export class PrismaRecoveryOutcomeActionBundleRepository implements RecoveryOutcomeActionBundleRepository {
  constructor(private prisma: PrismaClient) {}
  async create(data: RecoveryOutcomeActionBundle): Promise<RecoveryOutcomeActionBundle> { throw new Error('Not implemented in stub'); }
  async getById(id: string): Promise<RecoveryOutcomeActionBundle | null> { throw new Error('Not implemented in stub'); }
  async listBySchool(schoolId: string): Promise<RecoveryOutcomeActionBundle[]> { throw new Error('Not implemented in stub'); }
  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryOutcomeActionBundle[]> { throw new Error('Not implemented in stub'); }
  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryOutcomeActionBundle[]> { throw new Error('Not implemented in stub'); }
  async listByStatus(schoolId: string, status: ActionBundleStatus): Promise<RecoveryOutcomeActionBundle[]> { throw new Error('Not implemented in stub'); }
  async listByType(schoolId: string, bundleType: ActionBundleType): Promise<RecoveryOutcomeActionBundle[]> { throw new Error('Not implemented in stub'); }
  async update(id: string, data: Partial<RecoveryOutcomeActionBundle>): Promise<RecoveryOutcomeActionBundle> { throw new Error('Not implemented in stub'); }
  async markReviewReady(id: string): Promise<RecoveryOutcomeActionBundle> { throw new Error('Not implemented in stub'); }
  async approveForFutureUse(id: string): Promise<RecoveryOutcomeActionBundle> { throw new Error('Not implemented in stub'); }
  async suppress(id: string): Promise<RecoveryOutcomeActionBundle> { throw new Error('Not implemented in stub'); }
  async block(id: string): Promise<RecoveryOutcomeActionBundle> { throw new Error('Not implemented in stub'); }
  async void(id: string): Promise<RecoveryOutcomeActionBundle> { throw new Error('Not implemented in stub'); }
}

export class PrismaRecoveryContinuationActionDraftRepository implements RecoveryContinuationActionDraftRepository {
  constructor(private prisma: PrismaClient) {}
  async create(data: RecoveryContinuationActionDraft): Promise<RecoveryContinuationActionDraft> { throw new Error('Not implemented in stub'); }
  async getById(id: string): Promise<RecoveryContinuationActionDraft | null> { throw new Error('Not implemented in stub'); }
  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryContinuationActionDraft[]> { throw new Error('Not implemented in stub'); }
  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryContinuationActionDraft[]> { throw new Error('Not implemented in stub'); }
  async listByStatus(schoolId: string, status: any): Promise<RecoveryContinuationActionDraft[]> { throw new Error('Not implemented in stub'); }
  async update(id: string, data: Partial<RecoveryContinuationActionDraft>): Promise<RecoveryContinuationActionDraft> { throw new Error('Not implemented in stub'); }
  async markReviewReady(id: string): Promise<RecoveryContinuationActionDraft> { throw new Error('Not implemented in stub'); }
  async approveForFutureUse(id: string): Promise<RecoveryContinuationActionDraft> { throw new Error('Not implemented in stub'); }
  async suppress(id: string): Promise<RecoveryContinuationActionDraft> { throw new Error('Not implemented in stub'); }
  async block(id: string): Promise<RecoveryContinuationActionDraft> { throw new Error('Not implemented in stub'); }
  async void(id: string): Promise<RecoveryContinuationActionDraft> { throw new Error('Not implemented in stub'); }
}

export class PrismaRecoveryIntensificationActionDraftRepository implements RecoveryIntensificationActionDraftRepository {
  constructor(private prisma: PrismaClient) {}
  async create(data: RecoveryIntensificationActionDraft): Promise<RecoveryIntensificationActionDraft> { throw new Error('Not implemented in stub'); }
  async getById(id: string): Promise<RecoveryIntensificationActionDraft | null> { throw new Error('Not implemented in stub'); }
  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryIntensificationActionDraft[]> { throw new Error('Not implemented in stub'); }
  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryIntensificationActionDraft[]> { throw new Error('Not implemented in stub'); }
  async listByStatus(schoolId: string, status: any): Promise<RecoveryIntensificationActionDraft[]> { throw new Error('Not implemented in stub'); }
  async update(id: string, data: Partial<RecoveryIntensificationActionDraft>): Promise<RecoveryIntensificationActionDraft> { throw new Error('Not implemented in stub'); }
  async markReviewReady(id: string): Promise<RecoveryIntensificationActionDraft> { throw new Error('Not implemented in stub'); }
  async approveForFutureUse(id: string): Promise<RecoveryIntensificationActionDraft> { throw new Error('Not implemented in stub'); }
  async suppress(id: string): Promise<RecoveryIntensificationActionDraft> { throw new Error('Not implemented in stub'); }
  async block(id: string): Promise<RecoveryIntensificationActionDraft> { throw new Error('Not implemented in stub'); }
  async void(id: string): Promise<RecoveryIntensificationActionDraft> { throw new Error('Not implemented in stub'); }
}

export class PrismaRecoveryPauseActionDraftRepository implements RecoveryPauseActionDraftRepository {
  constructor(private prisma: PrismaClient) {}
  async create(data: RecoveryPauseActionDraft): Promise<RecoveryPauseActionDraft> { throw new Error('Not implemented in stub'); }
  async getById(id: string): Promise<RecoveryPauseActionDraft | null> { throw new Error('Not implemented in stub'); }
  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryPauseActionDraft[]> { throw new Error('Not implemented in stub'); }
  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryPauseActionDraft[]> { throw new Error('Not implemented in stub'); }
  async listByStatus(schoolId: string, status: any): Promise<RecoveryPauseActionDraft[]> { throw new Error('Not implemented in stub'); }
  async update(id: string, data: Partial<RecoveryPauseActionDraft>): Promise<RecoveryPauseActionDraft> { throw new Error('Not implemented in stub'); }
  async markReviewReady(id: string): Promise<RecoveryPauseActionDraft> { throw new Error('Not implemented in stub'); }
  async approveForFutureUse(id: string): Promise<RecoveryPauseActionDraft> { throw new Error('Not implemented in stub'); }
  async suppress(id: string): Promise<RecoveryPauseActionDraft> { throw new Error('Not implemented in stub'); }
  async block(id: string): Promise<RecoveryPauseActionDraft> { throw new Error('Not implemented in stub'); }
  async void(id: string): Promise<RecoveryPauseActionDraft> { throw new Error('Not implemented in stub'); }
}

export class PrismaRecoveryClosureActionDraftRepository implements RecoveryClosureActionDraftRepository {
  constructor(private prisma: PrismaClient) {}
  async create(data: RecoveryClosureActionDraft): Promise<RecoveryClosureActionDraft> { throw new Error('Not implemented in stub'); }
  async getById(id: string): Promise<RecoveryClosureActionDraft | null> { throw new Error('Not implemented in stub'); }
  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryClosureActionDraft[]> { throw new Error('Not implemented in stub'); }
  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryClosureActionDraft[]> { throw new Error('Not implemented in stub'); }
  async listByStatus(schoolId: string, status: any): Promise<RecoveryClosureActionDraft[]> { throw new Error('Not implemented in stub'); }
  async listByClosureType(schoolId: string, closureType: string): Promise<RecoveryClosureActionDraft[]> { throw new Error('Not implemented in stub'); }
  async update(id: string, data: Partial<RecoveryClosureActionDraft>): Promise<RecoveryClosureActionDraft> { throw new Error('Not implemented in stub'); }
  async markReviewReady(id: string): Promise<RecoveryClosureActionDraft> { throw new Error('Not implemented in stub'); }
  async approveForFutureUse(id: string): Promise<RecoveryClosureActionDraft> { throw new Error('Not implemented in stub'); }
  async suppress(id: string): Promise<RecoveryClosureActionDraft> { throw new Error('Not implemented in stub'); }
  async block(id: string): Promise<RecoveryClosureActionDraft> { throw new Error('Not implemented in stub'); }
  async void(id: string): Promise<RecoveryClosureActionDraft> { throw new Error('Not implemented in stub'); }
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
