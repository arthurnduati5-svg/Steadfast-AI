import { PrismaClient } from '@prisma/client';
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

function toDateString(val: unknown): string | undefined {
  if (!val) return undefined;
  if (typeof val === 'string') return val;
  if (val instanceof Date) return val.toISOString();
  return String(val);
}

function parseJsonField(val: unknown): Record<string, unknown> {
  if (!val) return {};
  if (typeof val === 'object') return val as Record<string, unknown>;
  if (typeof val === 'string') return JSON.parse(val);
  return {};
}

function parseStringArray(val: unknown): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(String);
  if (typeof val === 'string') return JSON.parse(val);
  return [];
}

export class PrismaRecoveryExecutionReadinessBoardSnapshotRepository implements RecoveryExecutionReadinessBoardSnapshotRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Partial<RecoveryExecutionReadinessBoardSnapshot>): Promise<RecoveryExecutionReadinessBoardSnapshot> {
    const created = await this.prisma.recoveryExecutionReadinessBoardSnapshotRecord.create({ data: this.toPrisma(data) });
    return this.fromPrisma(created);
  }

  async getById(id: string): Promise<RecoveryExecutionReadinessBoardSnapshot | null> {
    const found = await this.prisma.recoveryExecutionReadinessBoardSnapshotRecord.findUnique({ where: { boardSnapshotId: id } });
    if (!found) return null;
    return this.fromPrisma(found);
  }

  async listBySchool(schoolId: string): Promise<RecoveryExecutionReadinessBoardSnapshot[]> {
    const records = await this.prisma.recoveryExecutionReadinessBoardSnapshotRecord.findMany({ where: { schoolId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryExecutionReadinessBoardSnapshot[]> {
    const records = await this.prisma.recoveryExecutionReadinessBoardSnapshotRecord.findMany({ where: { schoolId, studentRef } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByPlanId(planId: string): Promise<RecoveryExecutionReadinessBoardSnapshot[]> {
    const records = await this.prisma.recoveryExecutionReadinessBoardSnapshotRecord.findMany({ where: { resultRecoveryPlanId: planId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByStatus(status: string): Promise<RecoveryExecutionReadinessBoardSnapshot[]> {
    const records = await this.prisma.recoveryExecutionReadinessBoardSnapshotRecord.findMany({ where: { boardStatus: status } });
    return records.map(r => this.fromPrisma(r));
  }

  async update(id: string, data: Partial<RecoveryExecutionReadinessBoardSnapshot>): Promise<RecoveryExecutionReadinessBoardSnapshot> {
    const updated = await this.prisma.recoveryExecutionReadinessBoardSnapshotRecord.update({
      where: { boardSnapshotId: id },
      data: this.toPrisma(data),
    });
    return this.fromPrisma(updated);
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

  private toPrisma(data: any): any {
    const { ...rest } = data;
    return rest;
  }

  private fromPrisma(data: any): RecoveryExecutionReadinessBoardSnapshot {
    return {
      ...data,
      snapshotDetailsJson: parseJsonField(data.snapshotDetailsJson),
      laneKeysJson: parseStringArray(data.laneKeysJson),
      cardCountsJson: parseJsonField(data.cardCountsJson),
      riskSignalsJson: parseJsonField(data.riskSignalsJson),
      blockedReasonCodesJson: parseStringArray(data.blockedReasonCodesJson),
      sourceRefsJson: parseJsonField(data.sourceRefsJson),
      createdAt: toDateString(data.createdAt) || '',
      updatedAt: toDateString(data.updatedAt) || '',
      voidedAt: toDateString(data.voidedAt),
    } as RecoveryExecutionReadinessBoardSnapshot;
  }
}

export class PrismaRecoveryExecutionReadinessBoardLaneRepository implements RecoveryExecutionReadinessBoardLaneRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Partial<RecoveryExecutionReadinessBoardLane>): Promise<RecoveryExecutionReadinessBoardLane> {
    const created = await this.prisma.recoveryExecutionReadinessBoardLaneRecord.create({ data: this.toPrisma(data) });
    return this.fromPrisma(created);
  }

  async getById(id: string): Promise<RecoveryExecutionReadinessBoardLane | null> {
    const found = await this.prisma.recoveryExecutionReadinessBoardLaneRecord.findUnique({ where: { boardLaneId: id } });
    if (!found) return null;
    return this.fromPrisma(found);
  }

  async listBySnapshotId(snapshotId: string): Promise<RecoveryExecutionReadinessBoardLane[]> {
    const records = await this.prisma.recoveryExecutionReadinessBoardLaneRecord.findMany({ where: { boardSnapshotId: snapshotId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByLaneKey(laneKey: string): Promise<RecoveryExecutionReadinessBoardLane[]> {
    const records = await this.prisma.recoveryExecutionReadinessBoardLaneRecord.findMany({ where: { laneKey } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByStatus(status: string): Promise<RecoveryExecutionReadinessBoardLane[]> {
    const records = await this.prisma.recoveryExecutionReadinessBoardLaneRecord.findMany({ where: { laneStatus: status } });
    return records.map(r => this.fromPrisma(r));
  }

  async update(id: string, data: Partial<RecoveryExecutionReadinessBoardLane>): Promise<RecoveryExecutionReadinessBoardLane> {
    const updated = await this.prisma.recoveryExecutionReadinessBoardLaneRecord.update({
      where: { boardLaneId: id },
      data: this.toPrisma(data),
    });
    return this.fromPrisma(updated);
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

  private toPrisma(data: any): any {
    const { ...rest } = data;
    return rest;
  }

  private fromPrisma(data: any): RecoveryExecutionReadinessBoardLane {
    return {
      ...data,
      laneDetailsJson: parseJsonField(data.laneDetailsJson),
      cardKeysJson: parseStringArray(data.cardKeysJson),
      blockedReasonCodesJson: parseStringArray(data.blockedReasonCodesJson),
      sourceRefsJson: parseJsonField(data.sourceRefsJson),
      createdAt: toDateString(data.createdAt) || '',
      updatedAt: toDateString(data.updatedAt) || '',
      voidedAt: toDateString(data.voidedAt),
    } as RecoveryExecutionReadinessBoardLane;
  }
}

export class PrismaRecoveryExecutionReadinessBoardCardRepository implements RecoveryExecutionReadinessBoardCardRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Partial<RecoveryExecutionReadinessBoardCard>): Promise<RecoveryExecutionReadinessBoardCard> {
    const created = await this.prisma.recoveryExecutionReadinessBoardCardRecord.create({ data: this.toPrisma(data) });
    return this.fromPrisma(created);
  }

  async getById(id: string): Promise<RecoveryExecutionReadinessBoardCard | null> {
    const found = await this.prisma.recoveryExecutionReadinessBoardCardRecord.findUnique({ where: { boardCardId: id } });
    if (!found) return null;
    return this.fromPrisma(found);
  }

  async listBySnapshotId(snapshotId: string): Promise<RecoveryExecutionReadinessBoardCard[]> {
    const records = await this.prisma.recoveryExecutionReadinessBoardCardRecord.findMany({ where: { boardSnapshotId: snapshotId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryExecutionReadinessBoardCard[]> {
    const records = await this.prisma.recoveryExecutionReadinessBoardCardRecord.findMany({ where: { schoolId, studentRef } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByPlanId(planId: string): Promise<RecoveryExecutionReadinessBoardCard[]> {
    const records = await this.prisma.recoveryExecutionReadinessBoardCardRecord.findMany({ where: { resultRecoveryPlanId: planId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByLaneKey(laneKey: string): Promise<RecoveryExecutionReadinessBoardCard[]> {
    const records = await this.prisma.recoveryExecutionReadinessBoardCardRecord.findMany({ where: { laneKey } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByStatus(status: string): Promise<RecoveryExecutionReadinessBoardCard[]> {
    const records = await this.prisma.recoveryExecutionReadinessBoardCardRecord.findMany({ where: { cardStatus: status } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByPriority(priority: string): Promise<RecoveryExecutionReadinessBoardCard[]> {
    const records = await this.prisma.recoveryExecutionReadinessBoardCardRecord.findMany({ where: { cardPriority: priority } });
    return records.map(r => this.fromPrisma(r));
  }

  async update(id: string, data: Partial<RecoveryExecutionReadinessBoardCard>): Promise<RecoveryExecutionReadinessBoardCard> {
    const updated = await this.prisma.recoveryExecutionReadinessBoardCardRecord.update({
      where: { boardCardId: id },
      data: this.toPrisma(data),
    });
    return this.fromPrisma(updated);
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

  private toPrisma(data: any): any {
    const { ...rest } = data;
    return rest;
  }

  private fromPrisma(data: any): RecoveryExecutionReadinessBoardCard {
    return {
      ...data,
      cardDetailsJson: parseJsonField(data.cardDetailsJson),
      blockedReasonCodesJson: parseStringArray(data.blockedReasonCodesJson),
      sourceRefsJson: parseJsonField(data.sourceRefsJson),
      createdAt: toDateString(data.createdAt) || '',
      updatedAt: toDateString(data.updatedAt) || '',
      voidedAt: toDateString(data.voidedAt),
    } as RecoveryExecutionReadinessBoardCard;
  }
}

export class PrismaRecoveryExecutionReadinessBoardFilterPresetRepository implements RecoveryExecutionReadinessBoardFilterPresetRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Partial<RecoveryExecutionReadinessBoardFilterPreset>): Promise<RecoveryExecutionReadinessBoardFilterPreset> {
    const created = await this.prisma.recoveryExecutionReadinessBoardFilterPresetRecord.create({ data: this.toPrisma(data) });
    return this.fromPrisma(created);
  }

  async getById(id: string): Promise<RecoveryExecutionReadinessBoardFilterPreset | null> {
    const found = await this.prisma.recoveryExecutionReadinessBoardFilterPresetRecord.findUnique({ where: { boardFilterPresetId: id } });
    if (!found) return null;
    return this.fromPrisma(found);
  }

  async listBySchool(schoolId: string): Promise<RecoveryExecutionReadinessBoardFilterPreset[]> {
    const records = await this.prisma.recoveryExecutionReadinessBoardFilterPresetRecord.findMany({ where: { schoolId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByActor(schoolId: string, actorId: string): Promise<RecoveryExecutionReadinessBoardFilterPreset[]> {
    const records = await this.prisma.recoveryExecutionReadinessBoardFilterPresetRecord.findMany({ where: { schoolId, actorId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByRole(schoolId: string, role: string): Promise<RecoveryExecutionReadinessBoardFilterPreset[]> {
    const records = await this.prisma.recoveryExecutionReadinessBoardFilterPresetRecord.findMany({ where: { schoolId, actorRole: role } });
    return records.map(r => this.fromPrisma(r));
  }

  async update(id: string, data: Partial<RecoveryExecutionReadinessBoardFilterPreset>): Promise<RecoveryExecutionReadinessBoardFilterPreset> {
    const updated = await this.prisma.recoveryExecutionReadinessBoardFilterPresetRecord.update({
      where: { boardFilterPresetId: id },
      data: this.toPrisma(data),
    });
    return this.fromPrisma(updated);
  }

  async suppress(id: string): Promise<RecoveryExecutionReadinessBoardFilterPreset> {
    return this.update(id, { presetStatus: 'suppressed' } as any);
  }

  async void(id: string): Promise<RecoveryExecutionReadinessBoardFilterPreset> {
    return this.update(id, { presetStatus: 'voided' } as any);
  }

  private toPrisma(data: any): any {
    const { ...rest } = data;
    return rest;
  }

  private fromPrisma(data: any): RecoveryExecutionReadinessBoardFilterPreset {
    return {
      ...data,
      filterCriteriaJson: parseJsonField(data.filterCriteriaJson),
      laneFiltersJson: parseJsonField(data.laneFiltersJson),
      statusFiltersJson: parseJsonField(data.statusFiltersJson),
      riskFiltersJson: parseJsonField(data.riskFiltersJson),
      priorityFiltersJson: parseJsonField(data.priorityFiltersJson),
      sourceRefsJson: parseJsonField(data.sourceRefsJson),
      blockedReasonCodesJson: parseStringArray(data.blockedReasonCodesJson),
      createdAt: toDateString(data.createdAt) || '',
      updatedAt: toDateString(data.updatedAt) || '',
    } as RecoveryExecutionReadinessBoardFilterPreset;
  }
}

export class PrismaRecoveryExecutionReadinessBoardRiskSignalRepository implements RecoveryExecutionReadinessBoardRiskSignalRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Partial<RecoveryExecutionReadinessBoardRiskSignal>): Promise<RecoveryExecutionReadinessBoardRiskSignal> {
    const created = await this.prisma.recoveryExecutionReadinessBoardRiskSignalRecord.create({ data: this.toPrisma(data) });
    return this.fromPrisma(created);
  }

  async getById(id: string): Promise<RecoveryExecutionReadinessBoardRiskSignal | null> {
    const found = await this.prisma.recoveryExecutionReadinessBoardRiskSignalRecord.findUnique({ where: { boardRiskSignalId: id } });
    if (!found) return null;
    return this.fromPrisma(found);
  }

  async listBySnapshotId(snapshotId: string): Promise<RecoveryExecutionReadinessBoardRiskSignal[]> {
    const records = await this.prisma.recoveryExecutionReadinessBoardRiskSignalRecord.findMany({ where: { boardSnapshotId: snapshotId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryExecutionReadinessBoardRiskSignal[]> {
    const records = await this.prisma.recoveryExecutionReadinessBoardRiskSignalRecord.findMany({ where: { schoolId, studentRef } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByPlanId(planId: string): Promise<RecoveryExecutionReadinessBoardRiskSignal[]> {
    const records = await this.prisma.recoveryExecutionReadinessBoardRiskSignalRecord.findMany({ where: { resultRecoveryPlanId: planId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByRiskLevel(riskLevel: string): Promise<RecoveryExecutionReadinessBoardRiskSignal[]> {
    const records = await this.prisma.recoveryExecutionReadinessBoardRiskSignalRecord.findMany({ where: { riskLevel } });
    return records.map(r => this.fromPrisma(r));
  }

  async update(id: string, data: Partial<RecoveryExecutionReadinessBoardRiskSignal>): Promise<RecoveryExecutionReadinessBoardRiskSignal> {
    const updated = await this.prisma.recoveryExecutionReadinessBoardRiskSignalRecord.update({
      where: { boardRiskSignalId: id },
      data: this.toPrisma(data),
    });
    return this.fromPrisma(updated);
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

  private toPrisma(data: any): any {
    const { ...rest } = data;
    return rest;
  }

  private fromPrisma(data: any): RecoveryExecutionReadinessBoardRiskSignal {
    return {
      ...data,
      riskDetailsJson: parseJsonField(data.riskDetailsJson),
      mitigationsJson: parseJsonField(data.mitigationsJson),
      blockedReasonCodesJson: parseStringArray(data.blockedReasonCodesJson),
      sourceRefsJson: parseJsonField(data.sourceRefsJson),
      createdAt: toDateString(data.createdAt) || '',
      updatedAt: toDateString(data.updatedAt) || '',
      voidedAt: toDateString(data.voidedAt),
    } as RecoveryExecutionReadinessBoardRiskSignal;
  }
}

export class PrismaRecoveryExecutionReadinessBoardBlockerRepository implements RecoveryExecutionReadinessBoardBlockerRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Partial<RecoveryExecutionReadinessBoardBlocker>): Promise<RecoveryExecutionReadinessBoardBlocker> {
    const created = await this.prisma.recoveryExecutionReadinessBoardBlockerRecord.create({ data: this.toPrisma(data) });
    return this.fromPrisma(created);
  }

  async getById(id: string): Promise<RecoveryExecutionReadinessBoardBlocker | null> {
    const found = await this.prisma.recoveryExecutionReadinessBoardBlockerRecord.findUnique({ where: { boardBlockerId: id } });
    if (!found) return null;
    return this.fromPrisma(found);
  }

  async listBySnapshotId(snapshotId: string): Promise<RecoveryExecutionReadinessBoardBlocker[]> {
    const records = await this.prisma.recoveryExecutionReadinessBoardBlockerRecord.findMany({ where: { boardSnapshotId: snapshotId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryExecutionReadinessBoardBlocker[]> {
    const records = await this.prisma.recoveryExecutionReadinessBoardBlockerRecord.findMany({ where: { schoolId, studentRef } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByPlanId(planId: string): Promise<RecoveryExecutionReadinessBoardBlocker[]> {
    const records = await this.prisma.recoveryExecutionReadinessBoardBlockerRecord.findMany({ where: { resultRecoveryPlanId: planId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByStatus(status: string): Promise<RecoveryExecutionReadinessBoardBlocker[]> {
    const records = await this.prisma.recoveryExecutionReadinessBoardBlockerRecord.findMany({ where: { blockerStatus: status } });
    return records.map(r => this.fromPrisma(r));
  }

  async update(id: string, data: Partial<RecoveryExecutionReadinessBoardBlocker>): Promise<RecoveryExecutionReadinessBoardBlocker> {
    const updated = await this.prisma.recoveryExecutionReadinessBoardBlockerRecord.update({
      where: { boardBlockerId: id },
      data: this.toPrisma(data),
    });
    return this.fromPrisma(updated);
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

  private toPrisma(data: any): any {
    const { ...rest } = data;
    return rest;
  }

  private fromPrisma(data: any): RecoveryExecutionReadinessBoardBlocker {
    return {
      ...data,
      blockerDetailsJson: parseJsonField(data.blockerDetailsJson),
      resolutionNotesJson: parseJsonField(data.resolutionNotesJson),
      blockedReasonCodesJson: parseStringArray(data.blockedReasonCodesJson),
      sourceRefsJson: parseJsonField(data.sourceRefsJson),
      createdAt: toDateString(data.createdAt) || '',
      updatedAt: toDateString(data.updatedAt) || '',
      resolvedAt: toDateString(data.resolvedAt),
      voidedAt: toDateString(data.voidedAt),
    } as RecoveryExecutionReadinessBoardBlocker;
  }
}

export class PrismaRecoveryExecutionReadinessBoardGovernanceNoteRepository implements RecoveryExecutionReadinessBoardGovernanceNoteRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Partial<RecoveryExecutionReadinessBoardGovernanceNote>): Promise<RecoveryExecutionReadinessBoardGovernanceNote> {
    const created = await this.prisma.recoveryExecutionReadinessBoardGovernanceNoteRecord.create({ data: this.toPrisma(data) });
    return this.fromPrisma(created);
  }

  async getById(id: string): Promise<RecoveryExecutionReadinessBoardGovernanceNote | null> {
    const found = await this.prisma.recoveryExecutionReadinessBoardGovernanceNoteRecord.findUnique({ where: { boardGovernanceNoteId: id } });
    if (!found) return null;
    return this.fromPrisma(found);
  }

  async listBySnapshotId(snapshotId: string): Promise<RecoveryExecutionReadinessBoardGovernanceNote[]> {
    const records = await this.prisma.recoveryExecutionReadinessBoardGovernanceNoteRecord.findMany({ where: { boardSnapshotId: snapshotId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByPlanId(planId: string): Promise<RecoveryExecutionReadinessBoardGovernanceNote[]> {
    const records = await this.prisma.recoveryExecutionReadinessBoardGovernanceNoteRecord.findMany({ where: { resultRecoveryPlanId: planId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByActor(actorId: string): Promise<RecoveryExecutionReadinessBoardGovernanceNote[]> {
    const records = await this.prisma.recoveryExecutionReadinessBoardGovernanceNoteRecord.findMany({ where: { createdByActorId: actorId } });
    return records.map(r => this.fromPrisma(r));
  }

  async update(id: string, data: Partial<RecoveryExecutionReadinessBoardGovernanceNote>): Promise<RecoveryExecutionReadinessBoardGovernanceNote> {
    const updated = await this.prisma.recoveryExecutionReadinessBoardGovernanceNoteRecord.update({
      where: { boardGovernanceNoteId: id },
      data: this.toPrisma(data),
    });
    return this.fromPrisma(updated);
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

  private toPrisma(data: any): any {
    const { ...rest } = data;
    return rest;
  }

  private fromPrisma(data: any): RecoveryExecutionReadinessBoardGovernanceNote {
    return {
      ...data,
      noteDetailsJson: parseJsonField(data.noteDetailsJson),
      blockedReasonCodesJson: parseStringArray(data.blockedReasonCodesJson),
      sourceRefsJson: parseJsonField(data.sourceRefsJson),
      createdAt: toDateString(data.createdAt) || '',
      updatedAt: toDateString(data.updatedAt) || '',
      voidedAt: toDateString(data.voidedAt),
    } as RecoveryExecutionReadinessBoardGovernanceNote;
  }
}

export class PrismaRecoveryExecutionReadinessBoardRoleProjectionRepository implements RecoveryExecutionReadinessBoardRoleProjectionRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Partial<RecoveryExecutionReadinessBoardRoleProjection>): Promise<RecoveryExecutionReadinessBoardRoleProjection> {
    const created = await this.prisma.recoveryExecutionReadinessBoardRoleProjectionRecord.create({ data: this.toPrisma(data) });
    return this.fromPrisma(created);
  }

  async getById(id: string): Promise<RecoveryExecutionReadinessBoardRoleProjection | null> {
    const found = await this.prisma.recoveryExecutionReadinessBoardRoleProjectionRecord.findUnique({ where: { boardRoleProjectionId: id } });
    if (!found) return null;
    return this.fromPrisma(found);
  }

  async listBySnapshotId(snapshotId: string): Promise<RecoveryExecutionReadinessBoardRoleProjection[]> {
    const records = await this.prisma.recoveryExecutionReadinessBoardRoleProjectionRecord.findMany({ where: { boardSnapshotId: snapshotId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByRole(role: string): Promise<RecoveryExecutionReadinessBoardRoleProjection[]> {
    const records = await this.prisma.recoveryExecutionReadinessBoardRoleProjectionRecord.findMany({ where: { targetRole: role } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByActor(actorId: string): Promise<RecoveryExecutionReadinessBoardRoleProjection[]> {
    const records = await this.prisma.recoveryExecutionReadinessBoardRoleProjectionRecord.findMany({ where: { actorId } });
    return records.map(r => this.fromPrisma(r));
  }

  async update(id: string, data: Partial<RecoveryExecutionReadinessBoardRoleProjection>): Promise<RecoveryExecutionReadinessBoardRoleProjection> {
    const updated = await this.prisma.recoveryExecutionReadinessBoardRoleProjectionRecord.update({
      where: { boardRoleProjectionId: id },
      data: this.toPrisma(data),
    });
    return this.fromPrisma(updated);
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

  private toPrisma(data: any): any {
    const { ...rest } = data;
    return rest;
  }

  private fromPrisma(data: any): RecoveryExecutionReadinessBoardRoleProjection {
    return {
      ...data,
      projectionDetailsJson: parseJsonField(data.projectionDetailsJson),
      visibleLaneKeysJson: parseStringArray(data.visibleLaneKeysJson),
      visibleCardKeysJson: parseStringArray(data.visibleCardKeysJson),
      blockedReasonCodesJson: parseStringArray(data.blockedReasonCodesJson),
      sourceRefsJson: parseJsonField(data.sourceRefsJson),
      createdAt: toDateString(data.createdAt) || '',
      updatedAt: toDateString(data.updatedAt) || '',
      voidedAt: toDateString(data.voidedAt),
    } as RecoveryExecutionReadinessBoardRoleProjection;
  }
}

export class PrismaRecoveryExecutionReadinessBoardTeacherQueueRepository implements RecoveryExecutionReadinessBoardTeacherQueueRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Partial<RecoveryExecutionReadinessBoardTeacherQueue>): Promise<RecoveryExecutionReadinessBoardTeacherQueue> {
    const created = await this.prisma.recoveryExecutionReadinessBoardTeacherQueueRecord.create({ data: this.toPrisma(data) });
    return this.fromPrisma(created);
  }

  async getById(id: string): Promise<RecoveryExecutionReadinessBoardTeacherQueue | null> {
    const found = await this.prisma.recoveryExecutionReadinessBoardTeacherQueueRecord.findUnique({ where: { boardTeacherQueueId: id } });
    if (!found) return null;
    return this.fromPrisma(found);
  }

  async listBySchool(schoolId: string): Promise<RecoveryExecutionReadinessBoardTeacherQueue[]> {
    const records = await this.prisma.recoveryExecutionReadinessBoardTeacherQueueRecord.findMany({ where: { schoolId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByTeacher(teacherRef: string): Promise<RecoveryExecutionReadinessBoardTeacherQueue[]> {
    const records = await this.prisma.recoveryExecutionReadinessBoardTeacherQueueRecord.findMany({ where: { teacherRef } });
    return records.map(r => this.fromPrisma(r));
  }

  async update(id: string, data: Partial<RecoveryExecutionReadinessBoardTeacherQueue>): Promise<RecoveryExecutionReadinessBoardTeacherQueue> {
    const updated = await this.prisma.recoveryExecutionReadinessBoardTeacherQueueRecord.update({
      where: { boardTeacherQueueId: id },
      data: this.toPrisma(data),
    });
    return this.fromPrisma(updated);
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

  private toPrisma(data: any): any {
    const { ...rest } = data;
    return rest;
  }

  private fromPrisma(data: any): RecoveryExecutionReadinessBoardTeacherQueue {
    return {
      ...data,
      queueItemsJson: parseJsonField(data.queueItemsJson),
      laneBreakdownJson: parseJsonField(data.laneBreakdownJson),
      pendingCardsJson: parseStringArray(data.pendingCardsJson),
      reviewReadyCardsJson: parseStringArray(data.reviewReadyCardsJson),
      riskFlaggedCardsJson: parseStringArray(data.riskFlaggedCardsJson),
      blockerCardsJson: parseStringArray(data.blockerCardsJson),
      blockedReasonCodesJson: parseStringArray(data.blockedReasonCodesJson),
      sourceRefsJson: parseJsonField(data.sourceRefsJson),
      createdAt: toDateString(data.createdAt) || '',
      updatedAt: toDateString(data.updatedAt) || '',
      voidedAt: toDateString(data.voidedAt),
    } as RecoveryExecutionReadinessBoardTeacherQueue;
  }
}

export class PrismaRecoveryExecutionReadinessBoardAdminQueueRepository implements RecoveryExecutionReadinessBoardAdminQueueRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Partial<RecoveryExecutionReadinessBoardAdminQueue>): Promise<RecoveryExecutionReadinessBoardAdminQueue> {
    const created = await this.prisma.recoveryExecutionReadinessBoardAdminQueueRecord.create({ data: this.toPrisma(data) });
    return this.fromPrisma(created);
  }

  async getById(id: string): Promise<RecoveryExecutionReadinessBoardAdminQueue | null> {
    const found = await this.prisma.recoveryExecutionReadinessBoardAdminQueueRecord.findUnique({ where: { boardAdminQueueId: id } });
    if (!found) return null;
    return this.fromPrisma(found);
  }

  async listBySchool(schoolId: string): Promise<RecoveryExecutionReadinessBoardAdminQueue[]> {
    const records = await this.prisma.recoveryExecutionReadinessBoardAdminQueueRecord.findMany({ where: { schoolId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByAdmin(adminRef: string): Promise<RecoveryExecutionReadinessBoardAdminQueue[]> {
    const records = await this.prisma.recoveryExecutionReadinessBoardAdminQueueRecord.findMany({ where: { adminRef } });
    return records.map(r => this.fromPrisma(r));
  }

  async update(id: string, data: Partial<RecoveryExecutionReadinessBoardAdminQueue>): Promise<RecoveryExecutionReadinessBoardAdminQueue> {
    const updated = await this.prisma.recoveryExecutionReadinessBoardAdminQueueRecord.update({
      where: { boardAdminQueueId: id },
      data: this.toPrisma(data),
    });
    return this.fromPrisma(updated);
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

  private toPrisma(data: any): any {
    const { ...rest } = data;
    return rest;
  }

  private fromPrisma(data: any): RecoveryExecutionReadinessBoardAdminQueue {
    return {
      ...data,
      queueItemsJson: parseJsonField(data.queueItemsJson),
      laneBreakdownJson: parseJsonField(data.laneBreakdownJson),
      pendingCardsJson: parseStringArray(data.pendingCardsJson),
      reviewReadyCardsJson: parseStringArray(data.reviewReadyCardsJson),
      riskFlaggedCardsJson: parseStringArray(data.riskFlaggedCardsJson),
      blockerCardsJson: parseStringArray(data.blockerCardsJson),
      governanceNotesJson: parseJsonField(data.governanceNotesJson),
      blockedReasonCodesJson: parseStringArray(data.blockedReasonCodesJson),
      sourceRefsJson: parseJsonField(data.sourceRefsJson),
      createdAt: toDateString(data.createdAt) || '',
      updatedAt: toDateString(data.updatedAt) || '',
      voidedAt: toDateString(data.voidedAt),
    } as RecoveryExecutionReadinessBoardAdminQueue;
  }
}

export class PrismaRecoveryExecutionReadinessBoardStudentSafeStatusDraftRepository implements RecoveryExecutionReadinessBoardStudentSafeStatusDraftRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Partial<RecoveryExecutionReadinessBoardStudentSafeStatusDraft>): Promise<RecoveryExecutionReadinessBoardStudentSafeStatusDraft> {
    const created = await this.prisma.recoveryExecutionReadinessBoardStudentSafeStatusDraftRecord.create({ data: this.toPrisma(data) });
    return this.fromPrisma(created);
  }

  async getById(id: string): Promise<RecoveryExecutionReadinessBoardStudentSafeStatusDraft | null> {
    const found = await this.prisma.recoveryExecutionReadinessBoardStudentSafeStatusDraftRecord.findUnique({ where: { boardStudentSafeDraftId: id } });
    if (!found) return null;
    return this.fromPrisma(found);
  }

  async listByPlanId(planId: string): Promise<RecoveryExecutionReadinessBoardStudentSafeStatusDraft[]> {
    const records = await this.prisma.recoveryExecutionReadinessBoardStudentSafeStatusDraftRecord.findMany({ where: { resultRecoveryPlanId: planId } });
    return records.map(r => this.fromPrisma(r));
  }

  async update(id: string, data: Partial<RecoveryExecutionReadinessBoardStudentSafeStatusDraft>): Promise<RecoveryExecutionReadinessBoardStudentSafeStatusDraft> {
    const updated = await this.prisma.recoveryExecutionReadinessBoardStudentSafeStatusDraftRecord.update({
      where: { boardStudentSafeDraftId: id },
      data: this.toPrisma(data),
    });
    return this.fromPrisma(updated);
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

  private toPrisma(data: any): any {
    const { ...rest } = data;
    return rest;
  }

  private fromPrisma(data: any): RecoveryExecutionReadinessBoardStudentSafeStatusDraft {
    return {
      ...data,
      statusDetailsJson: parseJsonField(data.statusDetailsJson),
      visibleLaneSummaryJson: parseJsonField(data.visibleLaneSummaryJson),
      blockedReasonCodesJson: parseStringArray(data.blockedReasonCodesJson),
      sourceRefsJson: parseJsonField(data.sourceRefsJson),
      createdAt: toDateString(data.createdAt) || '',
      updatedAt: toDateString(data.updatedAt) || '',
      voidedAt: toDateString(data.voidedAt),
    } as RecoveryExecutionReadinessBoardStudentSafeStatusDraft;
  }
}

export class PrismaRecoveryExecutionReadinessBoardParentSafeStatusDraftRepository implements RecoveryExecutionReadinessBoardParentSafeStatusDraftRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Partial<RecoveryExecutionReadinessBoardParentSafeStatusDraft>): Promise<RecoveryExecutionReadinessBoardParentSafeStatusDraft> {
    const created = await this.prisma.recoveryExecutionReadinessBoardParentSafeStatusDraftRecord.create({ data: this.toPrisma(data) });
    return this.fromPrisma(created);
  }

  async getById(id: string): Promise<RecoveryExecutionReadinessBoardParentSafeStatusDraft | null> {
    const found = await this.prisma.recoveryExecutionReadinessBoardParentSafeStatusDraftRecord.findUnique({ where: { boardParentSafeDraftId: id } });
    if (!found) return null;
    return this.fromPrisma(found);
  }

  async listByPlanId(planId: string): Promise<RecoveryExecutionReadinessBoardParentSafeStatusDraft[]> {
    const records = await this.prisma.recoveryExecutionReadinessBoardParentSafeStatusDraftRecord.findMany({ where: { resultRecoveryPlanId: planId } });
    return records.map(r => this.fromPrisma(r));
  }

  async update(id: string, data: Partial<RecoveryExecutionReadinessBoardParentSafeStatusDraft>): Promise<RecoveryExecutionReadinessBoardParentSafeStatusDraft> {
    const updated = await this.prisma.recoveryExecutionReadinessBoardParentSafeStatusDraftRecord.update({
      where: { boardParentSafeDraftId: id },
      data: this.toPrisma(data),
    });
    return this.fromPrisma(updated);
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

  private toPrisma(data: any): any {
    const { ...rest } = data;
    return rest;
  }

  private fromPrisma(data: any): RecoveryExecutionReadinessBoardParentSafeStatusDraft {
    return {
      ...data,
      statusDetailsJson: parseJsonField(data.statusDetailsJson),
      visibleLaneSummaryJson: parseJsonField(data.visibleLaneSummaryJson),
      blockedReasonCodesJson: parseStringArray(data.blockedReasonCodesJson),
      sourceRefsJson: parseJsonField(data.sourceRefsJson),
      createdAt: toDateString(data.createdAt) || '',
      updatedAt: toDateString(data.updatedAt) || '',
      voidedAt: toDateString(data.voidedAt),
    } as RecoveryExecutionReadinessBoardParentSafeStatusDraft;
  }
}

export class PrismaRecoveryExecutionReadinessBoardRefreshJobRepository implements RecoveryExecutionReadinessBoardRefreshJobRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Partial<RecoveryExecutionReadinessBoardRefreshJob>): Promise<RecoveryExecutionReadinessBoardRefreshJob> {
    const created = await this.prisma.recoveryExecutionReadinessBoardRefreshJobRecord.create({ data: this.toPrisma(data) });
    return this.fromPrisma(created);
  }

  async getById(id: string): Promise<RecoveryExecutionReadinessBoardRefreshJob | null> {
    const found = await this.prisma.recoveryExecutionReadinessBoardRefreshJobRecord.findUnique({ where: { boardRefreshJobId: id } });
    if (!found) return null;
    return this.fromPrisma(found);
  }

  async listBySchool(schoolId: string): Promise<RecoveryExecutionReadinessBoardRefreshJob[]> {
    const records = await this.prisma.recoveryExecutionReadinessBoardRefreshJobRecord.findMany({ where: { schoolId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listBySnapshotId(snapshotId: string): Promise<RecoveryExecutionReadinessBoardRefreshJob[]> {
    const records = await this.prisma.recoveryExecutionReadinessBoardRefreshJobRecord.findMany({ where: { boardSnapshotId: snapshotId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByStatus(status: string): Promise<RecoveryExecutionReadinessBoardRefreshJob[]> {
    const records = await this.prisma.recoveryExecutionReadinessBoardRefreshJobRecord.findMany({ where: { jobStatus: status } });
    return records.map(r => this.fromPrisma(r));
  }

  async update(id: string, data: Partial<RecoveryExecutionReadinessBoardRefreshJob>): Promise<RecoveryExecutionReadinessBoardRefreshJob> {
    const updated = await this.prisma.recoveryExecutionReadinessBoardRefreshJobRecord.update({
      where: { boardRefreshJobId: id },
      data: this.toPrisma(data),
    });
    return this.fromPrisma(updated);
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

  private toPrisma(data: any): any {
    const { ...rest } = data;
    return rest;
  }

  private fromPrisma(data: any): RecoveryExecutionReadinessBoardRefreshJob {
    return {
      ...data,
      refreshResultsJson: parseJsonField(data.refreshResultsJson),
      errorDetailsJson: parseJsonField(data.errorDetailsJson),
      blockedReasonCodesJson: parseStringArray(data.blockedReasonCodesJson),
      sourceRefsJson: parseJsonField(data.sourceRefsJson),
      createdAt: toDateString(data.createdAt) || '',
      updatedAt: toDateString(data.updatedAt) || '',
      completedAt: toDateString(data.completedAt),
      voidedAt: toDateString(data.voidedAt),
    } as RecoveryExecutionReadinessBoardRefreshJob;
  }
}

export class PrismaRecoveryExecutionReadinessBoardSummaryRepository implements RecoveryExecutionReadinessBoardSummaryRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Partial<RecoveryExecutionReadinessBoardSummary>): Promise<RecoveryExecutionReadinessBoardSummary> {
    const created = await this.prisma.recoveryExecutionReadinessBoardSummaryRecord.create({ data: this.toPrisma(data) });
    return this.fromPrisma(created);
  }

  async getById(id: string): Promise<RecoveryExecutionReadinessBoardSummary | null> {
    const found = await this.prisma.recoveryExecutionReadinessBoardSummaryRecord.findUnique({ where: { boardSummaryId: id } });
    if (!found) return null;
    return this.fromPrisma(found);
  }

  async listBySchool(schoolId: string): Promise<RecoveryExecutionReadinessBoardSummary[]> {
    const records = await this.prisma.recoveryExecutionReadinessBoardSummaryRecord.findMany({ where: { schoolId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryExecutionReadinessBoardSummary[]> {
    const records = await this.prisma.recoveryExecutionReadinessBoardSummaryRecord.findMany({ where: { schoolId, studentRef } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByPlanId(planId: string): Promise<RecoveryExecutionReadinessBoardSummary[]> {
    const records = await this.prisma.recoveryExecutionReadinessBoardSummaryRecord.findMany({ where: { resultRecoveryPlanId: planId } });
    return records.map(r => this.fromPrisma(r));
  }

  async update(id: string, data: Partial<RecoveryExecutionReadinessBoardSummary>): Promise<RecoveryExecutionReadinessBoardSummary> {
    const updated = await this.prisma.recoveryExecutionReadinessBoardSummaryRecord.update({
      where: { boardSummaryId: id },
      data: this.toPrisma(data),
    });
    return this.fromPrisma(updated);
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

  private toPrisma(data: any): any {
    const { ...rest } = data;
    return rest;
  }

  private fromPrisma(data: any): RecoveryExecutionReadinessBoardSummary {
    return {
      ...data,
      overviewJson: parseJsonField(data.overviewJson),
      laneStatusSummaryJson: parseJsonField(data.laneStatusSummaryJson),
      cardCountSummaryJson: parseJsonField(data.cardCountSummaryJson),
      riskSummaryJson: parseJsonField(data.riskSummaryJson),
      blockerSummaryJson: parseJsonField(data.blockerSummaryJson),
      governanceNotesSummaryJson: parseJsonField(data.governanceNotesSummaryJson),
      queueSummaryJson: parseJsonField(data.queueSummaryJson),
      blockedReasonCodesJson: parseStringArray(data.blockedReasonCodesJson),
      sourceRefsJson: parseJsonField(data.sourceRefsJson),
      createdAt: toDateString(data.createdAt) || '',
      updatedAt: toDateString(data.updatedAt) || '',
      voidedAt: toDateString(data.voidedAt),
    } as RecoveryExecutionReadinessBoardSummary;
  }
}

export class PrismaRecoveryExecutionReadinessBoardAuditRepository implements RecoveryExecutionReadinessBoardAuditRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Partial<any>): Promise<any> {
    const created = await this.prisma.recoveryExecutionReadinessBoardAuditRecord.create({ data: data as any });
    return created;
  }

  async listBySchool(schoolId: string): Promise<any[]> {
    return this.prisma.recoveryExecutionReadinessBoardAuditRecord.findMany({ where: { schoolId } });
  }

  async listBySnapshotId(snapshotId: string): Promise<any[]> {
    return this.prisma.recoveryExecutionReadinessBoardAuditRecord.findMany({       where: { boardSnapshotId: snapshotId } });
  }
}

export class PrismaRecoveryExecutionReadinessBoardIdempotencyRepository implements RecoveryExecutionReadinessBoardIdempotencyRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Partial<any>): Promise<any> {
    const created = await this.prisma.recoveryExecutionReadinessBoardIdempotencyRecord.create({ data: data as any });
    return created;
  }

  async getByIdempotencyKey(schoolId: string, operation: string, idempotencyKey: string): Promise<any | null> {
    return this.prisma.recoveryExecutionReadinessBoardIdempotencyRecord.findFirst({
      where: { schoolId, operation, idempotencyKey },
    });
  }

  async update(id: string, data: Partial<any>): Promise<any> {
    return this.prisma.recoveryExecutionReadinessBoardIdempotencyRecord.update({
      where: { boardIdempotencyId: id },
      data: data as any,
    });
  }

  async complete(id: string, resultSummary?: string): Promise<any> {
    return this.prisma.recoveryExecutionReadinessBoardIdempotencyRecord.update({
      where: { boardIdempotencyId: id },
      data: { status: 'completed', ...(resultSummary ? { resultSummary } : {}) } as any,
    });
  }
}

export class PrismaRecoveryExecutionReadinessBoardRepositories {
  boardSnapshot: PrismaRecoveryExecutionReadinessBoardSnapshotRepository;
  boardLane: PrismaRecoveryExecutionReadinessBoardLaneRepository;
  boardCard: PrismaRecoveryExecutionReadinessBoardCardRepository;
  filterPreset: PrismaRecoveryExecutionReadinessBoardFilterPresetRepository;
  riskSignal: PrismaRecoveryExecutionReadinessBoardRiskSignalRepository;
  blocker: PrismaRecoveryExecutionReadinessBoardBlockerRepository;
  governanceNote: PrismaRecoveryExecutionReadinessBoardGovernanceNoteRepository;
  roleProjection: PrismaRecoveryExecutionReadinessBoardRoleProjectionRepository;
  teacherQueue: PrismaRecoveryExecutionReadinessBoardTeacherQueueRepository;
  adminQueue: PrismaRecoveryExecutionReadinessBoardAdminQueueRepository;
  studentSafeStatusDraft: PrismaRecoveryExecutionReadinessBoardStudentSafeStatusDraftRepository;
  parentSafeStatusDraft: PrismaRecoveryExecutionReadinessBoardParentSafeStatusDraftRepository;
  refreshJob: PrismaRecoveryExecutionReadinessBoardRefreshJobRepository;
  summary: PrismaRecoveryExecutionReadinessBoardSummaryRepository;
  audit: PrismaRecoveryExecutionReadinessBoardAuditRepository;
  idempotency: PrismaRecoveryExecutionReadinessBoardIdempotencyRepository;

  constructor(prisma: PrismaClient) {
    this.boardSnapshot = new PrismaRecoveryExecutionReadinessBoardSnapshotRepository(prisma);
    this.boardLane = new PrismaRecoveryExecutionReadinessBoardLaneRepository(prisma);
    this.boardCard = new PrismaRecoveryExecutionReadinessBoardCardRepository(prisma);
    this.filterPreset = new PrismaRecoveryExecutionReadinessBoardFilterPresetRepository(prisma);
    this.riskSignal = new PrismaRecoveryExecutionReadinessBoardRiskSignalRepository(prisma);
    this.blocker = new PrismaRecoveryExecutionReadinessBoardBlockerRepository(prisma);
    this.governanceNote = new PrismaRecoveryExecutionReadinessBoardGovernanceNoteRepository(prisma);
    this.roleProjection = new PrismaRecoveryExecutionReadinessBoardRoleProjectionRepository(prisma);
    this.teacherQueue = new PrismaRecoveryExecutionReadinessBoardTeacherQueueRepository(prisma);
    this.adminQueue = new PrismaRecoveryExecutionReadinessBoardAdminQueueRepository(prisma);
    this.studentSafeStatusDraft = new PrismaRecoveryExecutionReadinessBoardStudentSafeStatusDraftRepository(prisma);
    this.parentSafeStatusDraft = new PrismaRecoveryExecutionReadinessBoardParentSafeStatusDraftRepository(prisma);
    this.refreshJob = new PrismaRecoveryExecutionReadinessBoardRefreshJobRepository(prisma);
    this.summary = new PrismaRecoveryExecutionReadinessBoardSummaryRepository(prisma);
    this.audit = new PrismaRecoveryExecutionReadinessBoardAuditRepository(prisma);
    this.idempotency = new PrismaRecoveryExecutionReadinessBoardIdempotencyRepository(prisma);
  }
}
