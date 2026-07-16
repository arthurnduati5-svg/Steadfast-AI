import { PrismaClient } from '@prisma/client';
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

export class PrismaRecoveryCaseTriageReadinessRepository implements RecoveryCaseTriageReadinessRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Partial<RecoveryCaseTriageReadiness> & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<RecoveryCaseTriageReadiness> {
    const created = await this.prisma.recoveryCaseTriageReadinessRecord.create({ data: this.toPrisma(data) });
    return this.fromPrisma(created);
  }

  async getById(id: string): Promise<RecoveryCaseTriageReadiness | null> {
    const found = await this.prisma.recoveryCaseTriageReadinessRecord.findUnique({ where: { triageReadinessId: id } });
    if (!found) return null;
    return this.fromPrisma(found);
  }

  async listBySchool(schoolId: string): Promise<RecoveryCaseTriageReadiness[]> {
    const records = await this.prisma.recoveryCaseTriageReadinessRecord.findMany({ where: { schoolId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryCaseTriageReadiness[]> {
    const records = await this.prisma.recoveryCaseTriageReadinessRecord.findMany({ where: { schoolId, studentRef } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryCaseTriageReadiness[]> {
    const records = await this.prisma.recoveryCaseTriageReadinessRecord.findMany({ where: { schoolId, resultRecoveryPlanId: planId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByBoardSnapshotId(schoolId: string, boardSnapshotId: string): Promise<RecoveryCaseTriageReadiness[]> {
    const records = await this.prisma.recoveryCaseTriageReadinessRecord.findMany({ where: { schoolId, boardSnapshotId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByBoardCardId(schoolId: string, boardCardId: string): Promise<RecoveryCaseTriageReadiness[]> {
    const records = await this.prisma.recoveryCaseTriageReadinessRecord.findMany({ where: { schoolId, boardCardId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByStatus(schoolId: string, status: string): Promise<RecoveryCaseTriageReadiness[]> {
    const records = await this.prisma.recoveryCaseTriageReadinessRecord.findMany({ where: { schoolId, triageStatus: status } });
    return records.map(r => this.fromPrisma(r));
  }

  async update(id: string, data: Partial<RecoveryCaseTriageReadiness>): Promise<RecoveryCaseTriageReadiness> {
    const updated = await this.prisma.recoveryCaseTriageReadinessRecord.update({
      where: { triageReadinessId: id },
      data: this.toPrisma(data),
    });
    return this.fromPrisma(updated);
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

  private toPrisma(data: any): any {
    const { ...rest } = data;
    return rest;
  }

  private fromPrisma(data: any): RecoveryCaseTriageReadiness {
    return {
      ...data,
      readinessChecksJson: parseJsonField(data.readinessChecksJson),
      blockedReasonCodesJson: parseStringArray(data.blockedReasonCodesJson),
      sourceRefsJson: parseJsonField(data.sourceRefsJson),
      createdAt: toDateString(data.createdAt) || '',
      updatedAt: toDateString(data.updatedAt) || '',
      voidedAt: toDateString(data.voidedAt),
    } as RecoveryCaseTriageReadiness;
  }
}
export class PrismaRecoveryCasePriorityAssessmentRepository implements RecoveryCasePriorityAssessmentRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Partial<RecoveryCasePriorityAssessment> & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<RecoveryCasePriorityAssessment> {
    const created = await this.prisma.recoveryCasePriorityAssessmentRecord.create({ data: this.toPrisma(data) });
    return this.fromPrisma(created);
  }

  async getById(id: string): Promise<RecoveryCasePriorityAssessment | null> {
    const found = await this.prisma.recoveryCasePriorityAssessmentRecord.findUnique({ where: { priorityAssessmentId: id } });
    if (!found) return null;
    return this.fromPrisma(found);
  }

  async listBySchool(schoolId: string): Promise<RecoveryCasePriorityAssessment[]> {
    const records = await this.prisma.recoveryCasePriorityAssessmentRecord.findMany({ where: { schoolId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryCasePriorityAssessment[]> {
    const records = await this.prisma.recoveryCasePriorityAssessmentRecord.findMany({ where: { schoolId, studentRef } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryCasePriorityAssessment[]> {
    const records = await this.prisma.recoveryCasePriorityAssessmentRecord.findMany({ where: { schoolId, resultRecoveryPlanId: planId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByBoardSnapshotId(schoolId: string, boardSnapshotId: string): Promise<RecoveryCasePriorityAssessment[]> {
    const records = await this.prisma.recoveryCasePriorityAssessmentRecord.findMany({ where: { schoolId, boardSnapshotId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByBoardCardId(schoolId: string, boardCardId: string): Promise<RecoveryCasePriorityAssessment[]> {
    const records = await this.prisma.recoveryCasePriorityAssessmentRecord.findMany({ where: { schoolId, boardCardId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByBand(schoolId: string, band: string): Promise<RecoveryCasePriorityAssessment[]> {
    const records = await this.prisma.recoveryCasePriorityAssessmentRecord.findMany({ where: { schoolId, priorityBand: band } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByStatus(schoolId: string, status: string): Promise<RecoveryCasePriorityAssessment[]> {
    const records = await this.prisma.recoveryCasePriorityAssessmentRecord.findMany({ where: { schoolId, assessmentStatus: status } });
    return records.map(r => this.fromPrisma(r));
  }

  async update(id: string, data: Partial<RecoveryCasePriorityAssessment>): Promise<RecoveryCasePriorityAssessment> {
    const updated = await this.prisma.recoveryCasePriorityAssessmentRecord.update({
      where: { priorityAssessmentId: id },
      data: this.toPrisma(data),
    });
    return this.fromPrisma(updated);
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

  private toPrisma(data: any): any {
    const { priorityStatus, totalScore, safeAssessmentSummary, triageReadinessId, priorityFactorsJson, decision, scoredAt, reviewReadyAt, staleAt, blockedAt, ...rest } = data;
    return {
      ...rest,
      ...(priorityStatus !== undefined ? { assessmentStatus: priorityStatus } : {}),
      ...(totalScore !== undefined ? { priorityScore: totalScore } : {}),
      ...(safeAssessmentSummary !== undefined ? { safePrioritySummary: safeAssessmentSummary } : {}),
    };
  }

  private fromPrisma(data: any): RecoveryCasePriorityAssessment {
    return {
      ...data,
      priorityStatus: data.assessmentStatus || 'draft',
      totalScore: data.priorityScore ?? 0,
      safeAssessmentSummary: data.safePrioritySummary || '',
      priorityFactorsJson: {},
      triageReadinessId: '',
      decision: '',
      blockedReasonCodesJson: parseStringArray(data.blockedReasonCodesJson),
      sourceRefsJson: parseJsonField(data.sourceRefsJson),
      createdAt: toDateString(data.createdAt) || '',
      updatedAt: toDateString(data.updatedAt) || '',
      voidedAt: toDateString(data.voidedAt),
    } as RecoveryCasePriorityAssessment;
  }
}

export class PrismaRecoveryCasePriorityFactorRepository implements RecoveryCasePriorityFactorRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Partial<RecoveryCasePriorityFactor> & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<RecoveryCasePriorityFactor> {
    const created = await this.prisma.recoveryCasePriorityFactorRecord.create({ data: this.toPrisma(data) });
    return this.fromPrisma(created);
  }

  async getById(id: string): Promise<RecoveryCasePriorityFactor | null> {
    const found = await this.prisma.recoveryCasePriorityFactorRecord.findUnique({ where: { priorityFactorId: id } });
    if (!found) return null;
    return this.fromPrisma(found);
  }

  async listByAssessment(priorityAssessmentId: string): Promise<RecoveryCasePriorityFactor[]> {
    const records = await this.prisma.recoveryCasePriorityFactorRecord.findMany({ where: { priorityAssessmentId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listBySchool(schoolId: string): Promise<RecoveryCasePriorityFactor[]> {
    const records = await this.prisma.recoveryCasePriorityFactorRecord.findMany({ where: { schoolId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByFactorCode(schoolId: string, factorCode: string): Promise<RecoveryCasePriorityFactor[]> {
    const records = await this.prisma.recoveryCasePriorityFactorRecord.findMany({ where: { schoolId, factorCode } });
    return records.map(r => this.fromPrisma(r));
  }

  async update(id: string, data: Partial<RecoveryCasePriorityFactor>): Promise<RecoveryCasePriorityFactor> {
    const updated = await this.prisma.recoveryCasePriorityFactorRecord.update({
      where: { priorityFactorId: id },
      data: this.toPrisma(data),
    });
    return this.fromPrisma(updated);
  }

  private toPrisma(data: any): any {
    const { factorExplanation, factorSourceJson, ...rest } = data;
    return {
      ...rest,
      ...(factorExplanation !== undefined ? { safeFactorExplanation: factorExplanation } : {}),
      ...(factorSourceJson !== undefined ? { factorValueJson: factorSourceJson } : {}),
    };
  }

  private fromPrisma(data: any): RecoveryCasePriorityFactor {
    return {
      ...data,
      factorExplanation: data.safeFactorExplanation || '',
      factorSourceJson: parseJsonField(data.factorValueJson),
      createdAt: toDateString(data.createdAt) || '',
    } as RecoveryCasePriorityFactor;
  }
}

export class PrismaRecoveryCaseFairnessCheckRepository implements RecoveryCaseFairnessCheckRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Partial<RecoveryCaseFairnessCheck> & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<RecoveryCaseFairnessCheck> {
    const created = await this.prisma.recoveryCaseFairnessCheckRecord.create({ data: this.toPrisma(data) });
    return this.fromPrisma(created);
  }

  async getById(id: string): Promise<RecoveryCaseFairnessCheck | null> {
    const found = await this.prisma.recoveryCaseFairnessCheckRecord.findUnique({ where: { fairnessCheckId: id } });
    if (!found) return null;
    return this.fromPrisma(found);
  }

  async listBySchool(schoolId: string): Promise<RecoveryCaseFairnessCheck[]> {
    const records = await this.prisma.recoveryCaseFairnessCheckRecord.findMany({ where: { schoolId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByAssessment(priorityAssessmentId: string): Promise<RecoveryCaseFairnessCheck[]> {
    const records = await this.prisma.recoveryCaseFairnessCheckRecord.findMany({ where: { priorityAssessmentId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByQueue(queueSnapshotId: string): Promise<RecoveryCaseFairnessCheck[]> {
    const records = await this.prisma.recoveryCaseFairnessCheckRecord.findMany({ where: { queueSnapshotId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByStatus(schoolId: string, status: string): Promise<RecoveryCaseFairnessCheck[]> {
    const records = await this.prisma.recoveryCaseFairnessCheckRecord.findMany({ where: { schoolId, fairnessStatus: status } });
    return records.map(r => this.fromPrisma(r));
  }

  async update(id: string, data: Partial<RecoveryCaseFairnessCheck>): Promise<RecoveryCaseFairnessCheck> {
    const updated = await this.prisma.recoveryCaseFairnessCheckRecord.update({
      where: { fairnessCheckId: id },
      data: this.toPrisma(data),
    });
    return this.fromPrisma(updated);
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

  private toPrisma(data: any): any {
    const { fairnessChecksJson, sourceRefsJson, queueItemId, blockedAt, voidedAt, updatedAt, ...rest } = data;
    return {
      ...rest,
      ...(fairnessChecksJson !== undefined ? { checkedFactorCodesJson: fairnessChecksJson } : {}),
    };
  }

  private fromPrisma(data: any): RecoveryCaseFairnessCheck {
    return {
      ...data,
      fairnessChecksJson: parseJsonField(data.checkedFactorCodesJson),
      blockedReasonCodesJson: parseStringArray(data.blockedReasonCodesJson),
      sourceRefsJson: {},
      queueItemId: null,
      createdAt: toDateString(data.createdAt) || '',
      updatedAt: toDateString(data.createdAt) || '',
    } as RecoveryCaseFairnessCheck;
  }
}

export class PrismaRecoveryCaseCapacitySnapshotRepository implements RecoveryCaseCapacitySnapshotRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Partial<RecoveryCaseCapacitySnapshot> & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<RecoveryCaseCapacitySnapshot> {
    const created = await this.prisma.recoveryCaseCapacitySnapshotRecord.create({ data: this.toPrisma(data) });
    return this.fromPrisma(created);
  }

  async getById(id: string): Promise<RecoveryCaseCapacitySnapshot | null> {
    const found = await this.prisma.recoveryCaseCapacitySnapshotRecord.findUnique({ where: { capacitySnapshotId: id } });
    if (!found) return null;
    return this.fromPrisma(found);
  }

  async listBySchool(schoolId: string): Promise<RecoveryCaseCapacitySnapshot[]> {
    const records = await this.prisma.recoveryCaseCapacitySnapshotRecord.findMany({ where: { schoolId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByRole(schoolId: string, audienceRole: string): Promise<RecoveryCaseCapacitySnapshot[]> {
    const records = await this.prisma.recoveryCaseCapacitySnapshotRecord.findMany({ where: { schoolId, audienceRole } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByReviewer(schoolId: string, reviewerRef: string): Promise<RecoveryCaseCapacitySnapshot[]> {
    const records = await this.prisma.recoveryCaseCapacitySnapshotRecord.findMany({ where: { schoolId, reviewerRef } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByWindow(schoolId: string, reviewWindowId: string): Promise<RecoveryCaseCapacitySnapshot[]> {
    const records = await this.prisma.recoveryCaseCapacitySnapshotRecord.findMany({ where: { schoolId } });
    return records.map(r => this.fromPrisma(r));
  }

  async update(id: string, data: Partial<RecoveryCaseCapacitySnapshot>): Promise<RecoveryCaseCapacitySnapshot> {
    const updated = await this.prisma.recoveryCaseCapacitySnapshotRecord.update({
      where: { capacitySnapshotId: id },
      data: this.toPrisma(data),
    });
    return this.fromPrisma(updated);
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

  private toPrisma(data: any): any {
    const { totalCapacity, usedCapacity, availableCapacity, capacityThreshold, capacityDetailsJson, reviewWindowId, reviewReadyAt, capacityExceededAt, voidedAt, ...rest } = data;
    return {
      ...rest,
      ...(totalCapacity !== undefined ? { capacityLimit: totalCapacity } : {}),
      ...(usedCapacity !== undefined ? { currentLoad: usedCapacity } : {}),
      ...(availableCapacity !== undefined ? { availableSlots: availableCapacity } : {}),
    };
  }

  private fromPrisma(data: any): RecoveryCaseCapacitySnapshot {
    return {
      ...data,
      totalCapacity: data.capacityLimit ?? 0,
      usedCapacity: data.currentLoad ?? 0,
      availableCapacity: data.availableSlots ?? 0,
      capacityThreshold: 0,
      capacityDetailsJson: {},
      reviewWindowId: null,
      sourceRefsJson: parseJsonField(data.sourceRefsJson),
      createdAt: toDateString(data.createdAt) || '',
      updatedAt: toDateString(data.updatedAt) || '',
    } as RecoveryCaseCapacitySnapshot;
  }
}
export class PrismaRecoveryCaseTriageQueueSnapshotRepository implements RecoveryCaseTriageQueueSnapshotRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Partial<RecoveryCaseTriageQueueSnapshot> & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<RecoveryCaseTriageQueueSnapshot> {
    const created = await this.prisma.recoveryCaseTriageQueueSnapshotRecord.create({ data: this.toPrisma(data) });
    return this.fromPrisma(created);
  }

  async getById(id: string): Promise<RecoveryCaseTriageQueueSnapshot | null> {
    const found = await this.prisma.recoveryCaseTriageQueueSnapshotRecord.findUnique({ where: { queueSnapshotId: id } });
    if (!found) return null;
    return this.fromPrisma(found);
  }

  async listBySchool(schoolId: string): Promise<RecoveryCaseTriageQueueSnapshot[]> {
    const records = await this.prisma.recoveryCaseTriageQueueSnapshotRecord.findMany({ where: { schoolId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByAudienceRole(schoolId: string, audienceRole: string): Promise<RecoveryCaseTriageQueueSnapshot[]> {
    const records = await this.prisma.recoveryCaseTriageQueueSnapshotRecord.findMany({ where: { schoolId, audienceRole } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByStatus(schoolId: string, status: string): Promise<RecoveryCaseTriageQueueSnapshot[]> {
    const records = await this.prisma.recoveryCaseTriageQueueSnapshotRecord.findMany({ where: { schoolId, queueStatus: status } });
    return records.map(r => this.fromPrisma(r));
  }

  async update(id: string, data: Partial<RecoveryCaseTriageQueueSnapshot>): Promise<RecoveryCaseTriageQueueSnapshot> {
    const updated = await this.prisma.recoveryCaseTriageQueueSnapshotRecord.update({ where: { queueSnapshotId: id }, data: this.toPrisma(data) });
    return this.fromPrisma(updated);
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

  private toPrisma(data: any): any {
    const { queueMetadataJson, blockedReasonCodesJson, generatedAt, reviewReadyAt, staleAt, blockedAt, voidedAt, ...rest } = data;
    return {
      ...rest,
      ...(data.queueSummary !== undefined ? { safeQueueSummary: data.queueSummary } : {}),
    };
  }

  private fromPrisma(data: any): RecoveryCaseTriageQueueSnapshot {
    return {
      ...data,
      queueSummary: data.safeQueueSummary || '',
      totalItems: data.candidateCount ?? 0,
      queueMetadataJson: {},
      blockedReasonCodesJson: parseStringArray(data.blockedReasonCodesJson),
      sourceRefsJson: parseJsonField(data.sourceRefsJson),
      createdAt: toDateString(data.createdAt) || '',
      updatedAt: toDateString(data.updatedAt) || '',
      generatedAt: toDateString(data.generatedAt),
      voidedAt: toDateString(data.voidedAt),
    } as RecoveryCaseTriageQueueSnapshot;
  }
}
export class PrismaRecoveryCaseTriageQueueItemRepository implements RecoveryCaseTriageQueueItemRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Partial<RecoveryCaseTriageQueueItem> & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<RecoveryCaseTriageQueueItem> {
    const created = await this.prisma.recoveryCaseTriageQueueItemRecord.create({ data: this.toPrisma(data) });
    return this.fromPrisma(created);
  }

  async getById(id: string): Promise<RecoveryCaseTriageQueueItem | null> {
    const found = await this.prisma.recoveryCaseTriageQueueItemRecord.findUnique({ where: { queueItemId: id } });
    if (!found) return null;
    return this.fromPrisma(found);
  }

  async listBySchool(schoolId: string): Promise<RecoveryCaseTriageQueueItem[]> {
    const records = await this.prisma.recoveryCaseTriageQueueItemRecord.findMany({ where: { schoolId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByQueueSnapshot(queueSnapshotId: string): Promise<RecoveryCaseTriageQueueItem[]> {
    const records = await this.prisma.recoveryCaseTriageQueueItemRecord.findMany({ where: { queueSnapshotId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryCaseTriageQueueItem[]> {
    const records = await this.prisma.recoveryCaseTriageQueueItemRecord.findMany({ where: { schoolId, studentRef } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryCaseTriageQueueItem[]> {
    const records = await this.prisma.recoveryCaseTriageQueueItemRecord.findMany({ where: { schoolId, resultRecoveryPlanId: planId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByBand(schoolId: string, band: string): Promise<RecoveryCaseTriageQueueItem[]> {
    const records = await this.prisma.recoveryCaseTriageQueueItemRecord.findMany({ where: { schoolId, priorityBand: band } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByStatus(schoolId: string, status: string): Promise<RecoveryCaseTriageQueueItem[]> {
    const records = await this.prisma.recoveryCaseTriageQueueItemRecord.findMany({ where: { schoolId, queueItemStatus: status } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByTriageDecision(schoolId: string, triageDecision: string): Promise<RecoveryCaseTriageQueueItem[]> {
    const records = await this.prisma.recoveryCaseTriageQueueItemRecord.findMany({ where: { schoolId, triageDecision } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByRank(queueSnapshotId: string): Promise<RecoveryCaseTriageQueueItem[]> {
    const records = await this.prisma.recoveryCaseTriageQueueItemRecord.findMany({ where: { queueSnapshotId }, orderBy: { rank: 'asc' } });
    return records.map(r => this.fromPrisma(r));
  }

  async update(id: string, data: Partial<RecoveryCaseTriageQueueItem>): Promise<RecoveryCaseTriageQueueItem> {
    const updated = await this.prisma.recoveryCaseTriageQueueItemRecord.update({ where: { queueItemId: id }, data: this.toPrisma(data) });
    return this.fromPrisma(updated);
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

  private toPrisma(data: any): any {
    const { queueStatus, totalScore, queueRank, decisionReasonJson, safeItemSummary, boardSnapshotId, fairnessCheckId, riskRank, reviewReadyAt, deferredAt, capacityExceededAt, blockedAt, voidedAt, ...rest } = data;
    return { ...rest, ...(queueStatus !== undefined ? { queueItemStatus: queueStatus } : {}), ...(totalScore !== undefined ? { priorityScore: totalScore } : {}), ...(queueRank !== undefined ? { rank: queueRank } : {}) };
  }

  private fromPrisma(data: any): RecoveryCaseTriageQueueItem {
    return { ...data, queueStatus: data.queueItemStatus || 'queued', totalScore: data.priorityScore ?? 0, queueRank: data.rank ?? 0, decisionReasonJson: {}, blockedReasonCodesJson: parseStringArray(data.blockedReasonCodesJson), sourceRefsJson: parseJsonField(data.sourceRefsJson), safeItemSummary: data.safeItemSummary || '', boardSnapshotId: '', fairnessCheckId: null, createdAt: toDateString(data.createdAt) || '', updatedAt: toDateString(data.updatedAt) || '', voidedAt: toDateString(data.voidedAt) } as RecoveryCaseTriageQueueItem;
  }
}
export class PrismaRecoveryCaseWorkloadAllocationDraftRepository implements RecoveryCaseWorkloadAllocationDraftRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Partial<RecoveryCaseWorkloadAllocationDraft> & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<RecoveryCaseWorkloadAllocationDraft> {
    const created = await this.prisma.recoveryCaseWorkloadAllocationDraftRecord.create({ data: this.toPrisma(data) });
    return this.fromPrisma(created);
  }

  async getById(id: string): Promise<RecoveryCaseWorkloadAllocationDraft | null> {
    const found = await this.prisma.recoveryCaseWorkloadAllocationDraftRecord.findUnique({ where: { allocationDraftId: id } });
    if (!found) return null;
    return this.fromPrisma(found);
  }

  async listBySchool(schoolId: string): Promise<RecoveryCaseWorkloadAllocationDraft[]> {
    const records = await this.prisma.recoveryCaseWorkloadAllocationDraftRecord.findMany({ where: { schoolId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByQueue(queueSnapshotId: string): Promise<RecoveryCaseWorkloadAllocationDraft[]> {
    const records = await this.prisma.recoveryCaseWorkloadAllocationDraftRecord.findMany();
    return records.map(r => this.fromPrisma(r));
  }

  async listByReviewer(schoolId: string, reviewerRef: string): Promise<RecoveryCaseWorkloadAllocationDraft[]> {
    const records = await this.prisma.recoveryCaseWorkloadAllocationDraftRecord.findMany({ where: { schoolId, proposedReviewerRef: reviewerRef } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByStatus(schoolId: string, status: string): Promise<RecoveryCaseWorkloadAllocationDraft[]> {
    const records = await this.prisma.recoveryCaseWorkloadAllocationDraftRecord.findMany({ where: { schoolId, allocationStatus: status } });
    return records.map(r => this.fromPrisma(r));
  }

  async update(id: string, data: Partial<RecoveryCaseWorkloadAllocationDraft>): Promise<RecoveryCaseWorkloadAllocationDraft> {
    const updated = await this.prisma.recoveryCaseWorkloadAllocationDraftRecord.update({ where: { allocationDraftId: id }, data: this.toPrisma(data) });
    return this.fromPrisma(updated);
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

  private toPrisma(data: any): any {
    const { allocationDraftStatus, queueSnapshotId, reviewerRef, audienceRole, allocatedItemIdsJson, totalAllocated, allocationDetailsJson, sourceRefsJson, reviewReadyAt, approvedAt, blockedAt, suppressedAt, voidedAt, ...rest } = data;
    return { ...rest, ...(allocationDraftStatus !== undefined ? { allocationStatus: allocationDraftStatus } : {}), ...(queueSnapshotId !== undefined ? { queueItemId: queueSnapshotId } : {}), ...(reviewerRef !== undefined ? { proposedReviewerRef: reviewerRef } : {}), ...(audienceRole !== undefined ? { proposedReviewerRole: audienceRole } : {}), ...(allocationDetailsJson !== undefined ? { allocationReasonsJson: allocationDetailsJson } : {}) };
  }

  private fromPrisma(data: any): RecoveryCaseWorkloadAllocationDraft {
    return { ...data, allocationDraftStatus: data.allocationStatus || 'draft', queueSnapshotId: data.queueItemId || '', reviewerRef: data.proposedReviewerRef || '', audienceRole: data.proposedReviewerRole || '', allocatedItemIdsJson: [], totalAllocated: 0, allocationDetailsJson: parseJsonField(data.allocationReasonsJson), sourceRefsJson: {}, createdAt: toDateString(data.createdAt) || '', updatedAt: toDateString(data.updatedAt) || '', voidedAt: toDateString(data.voidedAt) } as RecoveryCaseWorkloadAllocationDraft;
  }
}
export class PrismaRecoveryCaseEscalationDraftRepository implements RecoveryCaseEscalationDraftRepository {
  constructor(private prisma: PrismaClient) {}
  async create(data: Partial<RecoveryCaseEscalationDraft> & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<RecoveryCaseEscalationDraft> {
    const created = await this.prisma.recoveryCaseEscalationDraftRecord.create({ data: this.toPrisma(data) });
    return this.fromPrisma(created);
  }
  async getById(id: string): Promise<RecoveryCaseEscalationDraft | null> {
    const found = await this.prisma.recoveryCaseEscalationDraftRecord.findUnique({ where: { escalationDraftId: id } });
    if (!found) return null;
    return this.fromPrisma(found);
  }
  async listBySchool(schoolId: string): Promise<RecoveryCaseEscalationDraft[]> {
    const records = await this.prisma.recoveryCaseEscalationDraftRecord.findMany({ where: { schoolId } });
    return records.map(r => this.fromPrisma(r));
  }
  async listByQueue(queueSnapshotId: string): Promise<RecoveryCaseEscalationDraft[]> {
    const records = await this.prisma.recoveryCaseEscalationDraftRecord.findMany();
    return records.map(r => this.fromPrisma(r));
  }
  async listByLevel(schoolId: string, escalationLevel: string): Promise<RecoveryCaseEscalationDraft[]> {
    const records = await this.prisma.recoveryCaseEscalationDraftRecord.findMany({ where: { schoolId, escalationLevel } });
    return records.map(r => this.fromPrisma(r));
  }
  async listByStatus(schoolId: string, status: string): Promise<RecoveryCaseEscalationDraft[]> {
    const records = await this.prisma.recoveryCaseEscalationDraftRecord.findMany({ where: { schoolId, escalationStatus: status } });
    return records.map(r => this.fromPrisma(r));
  }
  async update(id: string, data: Partial<RecoveryCaseEscalationDraft>): Promise<RecoveryCaseEscalationDraft> {
    const updated = await this.prisma.recoveryCaseEscalationDraftRecord.update({ where: { escalationDraftId: id }, data: this.toPrisma(data) });
    return this.fromPrisma(updated);
  }
  async updateStatus(id: string, status: string): Promise<RecoveryCaseEscalationDraft> { return this.update(id, { escalationDraftStatus: status } as any); }
  async markReviewReady(id: string): Promise<RecoveryCaseEscalationDraft> { return this.update(id, { escalationDraftStatus: 'review_ready', reviewReadyAt: new Date().toISOString() } as any); }
  async approveFutureUse(id: string): Promise<RecoveryCaseEscalationDraft> { return this.update(id, { escalationDraftStatus: 'approved_for_future_use', approvedAt: new Date().toISOString() } as any); }
  async block(id: string, reasonCode: string, safeMessage: string): Promise<RecoveryCaseEscalationDraft> { return this.update(id, { escalationDraftStatus: 'blocked', blockedAt: new Date().toISOString() } as any); }
  async suppress(id: string, reasonCode: string, safeMessage: string): Promise<RecoveryCaseEscalationDraft> { return this.update(id, { escalationDraftStatus: 'suppressed', suppressedAt: new Date().toISOString() } as any); }
  async void(id: string, reasonCode: string, safeMessage: string): Promise<RecoveryCaseEscalationDraft> { return this.update(id, { escalationDraftStatus: 'void', voidedAt: new Date().toISOString() } as any); }
  private toPrisma(data: any): any {
    const { escalationDraftStatus, escalatedToRole, escalationReason, escalationNotesJson, sourceRefsJson, queueSnapshotId, reviewReadyAt, approvedAt, blockedAt, suppressedAt, voidedAt, ...rest } = data;
    return { ...rest, ...(escalationDraftStatus !== undefined ? { escalationStatus: escalationDraftStatus } : {}), ...(escalatedToRole !== undefined ? { proposedTargetRole: escalatedToRole } : {}), ...(escalationReason !== undefined ? { safeEscalationSummary: escalationReason } : {}), ...(escalationNotesJson !== undefined ? { reasonCodesJson: escalationNotesJson } : {}), ...(queueSnapshotId !== undefined ? { queueItemId: queueSnapshotId } : {}) };
  }
  private fromPrisma(data: any): RecoveryCaseEscalationDraft {
    return { ...data, escalationDraftStatus: data.escalationStatus || 'draft', escalatedToRole: data.proposedTargetRole || '', escalationReason: data.safeEscalationSummary || '', escalationNotesJson: parseJsonField(data.reasonCodesJson), queueSnapshotId: data.queueItemId || '', sourceRefsJson: {}, createdAt: toDateString(data.createdAt) || '', updatedAt: toDateString(data.updatedAt) || '', voidedAt: toDateString(data.voidedAt) } as RecoveryCaseEscalationDraft;
  }
}
export class PrismaRecoveryCaseReviewWindowDraftRepository implements RecoveryCaseReviewWindowDraftRepository {
  constructor(private prisma: PrismaClient) {}
  async create(data: Partial<RecoveryCaseReviewWindowDraft> & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<RecoveryCaseReviewWindowDraft> {
    const created = await this.prisma.recoveryCaseReviewWindowDraftRecord.create({ data: this.toPrisma(data) });
    return this.fromPrisma(created);
  }
  async getById(id: string): Promise<RecoveryCaseReviewWindowDraft | null> {
    const found = await this.prisma.recoveryCaseReviewWindowDraftRecord.findUnique({ where: { reviewWindowDraftId: id } });
    if (!found) return null;
    return this.fromPrisma(found);
  }
  async listBySchool(schoolId: string): Promise<RecoveryCaseReviewWindowDraft[]> {
    const records = await this.prisma.recoveryCaseReviewWindowDraftRecord.findMany({ where: { schoolId } });
    return records.map(r => this.fromPrisma(r));
  }
  async listByQueue(queueSnapshotId: string): Promise<RecoveryCaseReviewWindowDraft[]> {
    const records = await this.prisma.recoveryCaseReviewWindowDraftRecord.findMany();
    return records.map(r => this.fromPrisma(r));
  }
  async listByReviewer(schoolId: string, reviewerRef: string): Promise<RecoveryCaseReviewWindowDraft[]> {
    const records = await this.prisma.recoveryCaseReviewWindowDraftRecord.findMany({ where: { schoolId, proposedReviewerRef: reviewerRef } });
    return records.map(r => this.fromPrisma(r));
  }
  async listByStatus(schoolId: string, status: string): Promise<RecoveryCaseReviewWindowDraft[]> {
    const records = await this.prisma.recoveryCaseReviewWindowDraftRecord.findMany({ where: { schoolId, windowStatus: status } });
    return records.map(r => this.fromPrisma(r));
  }
  async update(id: string, data: Partial<RecoveryCaseReviewWindowDraft>): Promise<RecoveryCaseReviewWindowDraft> {
    const updated = await this.prisma.recoveryCaseReviewWindowDraftRecord.update({ where: { reviewWindowDraftId: id }, data: this.toPrisma(data) });
    return this.fromPrisma(updated);
  }
  async updateStatus(id: string, status: string): Promise<RecoveryCaseReviewWindowDraft> { return this.update(id, { reviewWindowDraftStatus: status } as any); }
  async markReviewReady(id: string): Promise<RecoveryCaseReviewWindowDraft> { return this.update(id, { reviewWindowDraftStatus: 'review_ready', reviewReadyAt: new Date().toISOString() } as any); }
  async approveFutureUse(id: string): Promise<RecoveryCaseReviewWindowDraft> { return this.update(id, { reviewWindowDraftStatus: 'approved_for_future_use', approvedAt: new Date().toISOString() } as any); }
  async block(id: string, reasonCode: string, safeMessage: string): Promise<RecoveryCaseReviewWindowDraft> { return this.update(id, { reviewWindowDraftStatus: 'blocked', blockedAt: new Date().toISOString() } as any); }
  async suppress(id: string, reasonCode: string, safeMessage: string): Promise<RecoveryCaseReviewWindowDraft> { return this.update(id, { reviewWindowDraftStatus: 'suppressed', suppressedAt: new Date().toISOString() } as any); }
  async void(id: string, reasonCode: string, safeMessage: string): Promise<RecoveryCaseReviewWindowDraft> { return this.update(id, { reviewWindowDraftStatus: 'void', voidedAt: new Date().toISOString() } as any); }
  private toPrisma(data: any): any {
    const { reviewWindowDraftStatus, queueSnapshotId, reviewerRef, audienceRole, windowStartAt, windowEndAt, maxCapacity, safeWindowSummary, windowDetailsJson, sourceRefsJson, reviewReadyAt, approvedAt, blockedAt, suppressedAt, voidedAt, ...rest } = data;
    return { ...rest, ...(reviewWindowDraftStatus !== undefined ? { windowStatus: reviewWindowDraftStatus } : {}), ...(queueSnapshotId !== undefined ? { queueItemId: queueSnapshotId } : {}), ...(reviewerRef !== undefined ? { proposedReviewerRef: reviewerRef } : {}), ...(windowStartAt !== undefined ? { windowStart: windowStartAt } : {}), ...(windowEndAt !== undefined ? { windowEnd: windowEndAt } : {}) };
  }
  private fromPrisma(data: any): RecoveryCaseReviewWindowDraft {
    return { ...data, reviewWindowDraftStatus: data.windowStatus || 'draft', queueSnapshotId: data.queueItemId || '', reviewerRef: data.proposedReviewerRef || '', audienceRole: '', windowStartAt: toDateString(data.windowStart) || '', windowEndAt: toDateString(data.windowEnd) || '', maxCapacity: 0, safeWindowSummary: data.safeWindowSummary || '', windowDetailsJson: {}, sourceRefsJson: {}, createdAt: toDateString(data.createdAt) || '', updatedAt: toDateString(data.updatedAt) || '', voidedAt: toDateString(data.voidedAt) } as RecoveryCaseReviewWindowDraft;
  }
}
export class PrismaRecoveryCaseQueueExplanationRepository implements RecoveryCaseQueueExplanationRepository {
  constructor(private prisma: PrismaClient) {}
  async create(data: Partial<RecoveryCaseQueueExplanation> & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<RecoveryCaseQueueExplanation> {
    const created = await this.prisma.recoveryCaseQueueExplanationRecord.create({ data: this.toPrisma(data) });
    return this.fromPrisma(created);
  }
  async getById(id: string): Promise<RecoveryCaseQueueExplanation | null> {
    const found = await this.prisma.recoveryCaseQueueExplanationRecord.findUnique({ where: { queueExplanationId: id } });
    if (!found) return null;
    return this.fromPrisma(found);
  }
  async listBySchool(schoolId: string): Promise<RecoveryCaseQueueExplanation[]> {
    const records = await this.prisma.recoveryCaseQueueExplanationRecord.findMany({ where: { schoolId } });
    return records.map(r => this.fromPrisma(r));
  }
  async listByQueueItem(queueItemId: string): Promise<RecoveryCaseQueueExplanation[]> {
    const records = await this.prisma.recoveryCaseQueueExplanationRecord.findMany({ where: { queueItemId } });
    return records.map(r => this.fromPrisma(r));
  }
  async listByAssessment(priorityAssessmentId: string): Promise<RecoveryCaseQueueExplanation[]> {
    const records = await this.prisma.recoveryCaseQueueExplanationRecord.findMany({ where: { priorityAssessmentId } });
    return records.map(r => this.fromPrisma(r));
  }
  async listBySnapshot(queueSnapshotId: string): Promise<RecoveryCaseQueueExplanation[]> {
    const records = await this.prisma.recoveryCaseQueueExplanationRecord.findMany();
    return records.map(r => this.fromPrisma(r));
  }
  private toPrisma(data: any): any {
    const { explanationText, factorBreakdownJson, sourceRefsJson, createdByActorId, createdByRole, queueSnapshotId, ...rest } = data;
    return { ...rest, ...(explanationText !== undefined ? { safeExplanation: explanationText } : {}), ...(factorBreakdownJson !== undefined ? { factorBreakdownJson } : {}) };
  }
  private fromPrisma(data: any): RecoveryCaseQueueExplanation {
    return { ...data, explanationText: data.safeExplanation || '', factorBreakdownJson: parseJsonField(data.factorBreakdownJson), sourceRefsJson: {}, queueSnapshotId: data.queueSnapshotId || '', createdByActorId: data.createdByActorId || '', createdByRole: data.createdByRole || '', createdAt: toDateString(data.createdAt) || '' } as RecoveryCaseQueueExplanation;
  }
}
export class PrismaRecoveryCaseDuplicateSuppressionRepository implements RecoveryCaseDuplicateSuppressionRepository {
  constructor(private prisma: PrismaClient) {}
  async create(data: Partial<RecoveryCaseDuplicateSuppression> & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<RecoveryCaseDuplicateSuppression> {
    const created = await this.prisma.recoveryCaseDuplicateSuppressionRecord.create({ data: this.toPrisma(data) });
    return this.fromPrisma(created);
  }
  async getById(id: string): Promise<RecoveryCaseDuplicateSuppression | null> {
    const found = await this.prisma.recoveryCaseDuplicateSuppressionRecord.findUnique({ where: { duplicateSuppressionId: id } });
    if (!found) return null;
    return this.fromPrisma(found);
  }
  async listBySchool(schoolId: string): Promise<RecoveryCaseDuplicateSuppression[]> {
    const records = await this.prisma.recoveryCaseDuplicateSuppressionRecord.findMany({ where: { schoolId } });
    return records.map(r => this.fromPrisma(r));
  }
  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryCaseDuplicateSuppression[]> {
    const records = await this.prisma.recoveryCaseDuplicateSuppressionRecord.findMany({ where: { schoolId, resultRecoveryPlanId: planId } });
    return records.map(r => this.fromPrisma(r));
  }
  async listByCanonicalCard(schoolId: string, canonicalBoardCardId: string): Promise<RecoveryCaseDuplicateSuppression[]> {
    const records = await this.prisma.recoveryCaseDuplicateSuppressionRecord.findMany({ where: { schoolId, canonicalBoardCardId } });
    return records.map(r => this.fromPrisma(r));
  }
  async listByDuplicateCard(schoolId: string, duplicateBoardCardId: string): Promise<RecoveryCaseDuplicateSuppression[]> {
    const records = await this.prisma.recoveryCaseDuplicateSuppressionRecord.findMany({ where: { schoolId, duplicateBoardCardId } });
    return records.map(r => this.fromPrisma(r));
  }
  async listByStatus(schoolId: string, status: string): Promise<RecoveryCaseDuplicateSuppression[]> {
    const records = await this.prisma.recoveryCaseDuplicateSuppressionRecord.findMany({ where: { schoolId, suppressionStatus: status } });
    return records.map(r => this.fromPrisma(r));
  }
  async update(id: string, data: Partial<RecoveryCaseDuplicateSuppression>): Promise<RecoveryCaseDuplicateSuppression> {
    const updated = await this.prisma.recoveryCaseDuplicateSuppressionRecord.update({ where: { duplicateSuppressionId: id }, data: this.toPrisma(data) });
    return this.fromPrisma(updated);
  }
  async updateStatus(id: string, status: string): Promise<RecoveryCaseDuplicateSuppression> { return this.update(id, { suppressionStatus: status } as any); }
  async void(id: string, reasonCode: string, safeMessage: string): Promise<RecoveryCaseDuplicateSuppression> { return this.update(id, { suppressionStatus: 'void', voidedAt: new Date().toISOString() } as any); }
  private toPrisma(data: any): any {
    const { suppressionReason, suppressionDetailsJson, sourceRefsJson, updatedAt, voidedAt, ...rest } = data;
    return { ...rest, ...(suppressionReason !== undefined ? { safeSuppressionSummary: suppressionReason } : {}), ...(suppressionDetailsJson !== undefined ? { matchingKeysJson: suppressionDetailsJson } : {}) };
  }
  private fromPrisma(data: any): RecoveryCaseDuplicateSuppression {
    return { ...data, suppressionReason: data.safeSuppressionSummary || '', suppressionDetailsJson: parseJsonField(data.matchingKeysJson), sourceRefsJson: {}, updatedAt: toDateString(data.createdAt) || '', voidedAt: toDateString(data.voidedAt) } as RecoveryCaseDuplicateSuppression;
  }
}
export class PrismaRecoveryCaseTriageSummaryRepository implements RecoveryCaseTriageSummaryRepository {
  constructor(private prisma: PrismaClient) {}
  async create(data: Partial<RecoveryCaseTriageSummary> & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<RecoveryCaseTriageSummary> {
    const created = await this.prisma.recoveryCaseTriageSummaryRecord.create({ data: this.toPrisma(data) });
    return this.fromPrisma(created);
  }
  async getById(id: string): Promise<RecoveryCaseTriageSummary | null> {
    const found = await this.prisma.recoveryCaseTriageSummaryRecord.findUnique({ where: { triageSummaryId: id } });
    if (!found) return null;
    return this.fromPrisma(found);
  }
  async listBySchool(schoolId: string): Promise<RecoveryCaseTriageSummary[]> {
    const records = await this.prisma.recoveryCaseTriageSummaryRecord.findMany({ where: { schoolId } });
    return records.map(r => this.fromPrisma(r));
  }
  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryCaseTriageSummary[]> {
    const records = await this.prisma.recoveryCaseTriageSummaryRecord.findMany({ where: { schoolId, studentRef } });
    return records.map(r => this.fromPrisma(r));
  }
  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryCaseTriageSummary[]> {
    const records = await this.prisma.recoveryCaseTriageSummaryRecord.findMany({ where: { schoolId, resultRecoveryPlanId: planId } });
    return records.map(r => this.fromPrisma(r));
  }
  async listByQueueSnapshot(queueSnapshotId: string): Promise<RecoveryCaseTriageSummary[]> {
    const records = await this.prisma.recoveryCaseTriageSummaryRecord.findMany({ where: { queueSnapshotId } });
    return records.map(r => this.fromPrisma(r));
  }
  async listByStatus(schoolId: string, status: string): Promise<RecoveryCaseTriageSummary[]> {
    const records = await this.prisma.recoveryCaseTriageSummaryRecord.findMany({ where: { schoolId, summaryStatus: status } });
    return records.map(r => this.fromPrisma(r));
  }
  async update(id: string, data: Partial<RecoveryCaseTriageSummary>): Promise<RecoveryCaseTriageSummary> {
    const updated = await this.prisma.recoveryCaseTriageSummaryRecord.update({ where: { triageSummaryId: id }, data: this.toPrisma(data) });
    return this.fromPrisma(updated);
  }
  async updateStatus(id: string, status: string): Promise<RecoveryCaseTriageSummary> { return this.update(id, { triageSummaryStatus: status } as any); }
  async refresh(id: string): Promise<RecoveryCaseTriageSummary> { return this.update(id, { triageSummaryStatus: 'draft' } as any); }
  async markReviewReady(id: string): Promise<RecoveryCaseTriageSummary> { return this.update(id, { triageSummaryStatus: 'review_ready', reviewReadyAt: new Date().toISOString() } as any); }
  async markStale(id: string): Promise<RecoveryCaseTriageSummary> { return this.update(id, { triageSummaryStatus: 'stale', staleAt: new Date().toISOString() } as any); }
  async block(id: string, reasonCode: string, safeMessage: string): Promise<RecoveryCaseTriageSummary> { return this.update(id, { triageSummaryStatus: 'blocked', blockedAt: new Date().toISOString() } as any); }
  async void(id: string, reasonCode: string, safeMessage: string): Promise<RecoveryCaseTriageSummary> { return this.update(id, { triageSummaryStatus: 'void', voidedAt: new Date().toISOString() } as any); }
  private toPrisma(data: any): any {
    const { triageSummaryStatus, totalScore, priorityBand, riskRank, readinessSummary, fairnessSummary, capacitySummary, queueSummary, summaryDetailsJson, sourceRefsJson, reviewReadyAt, staleAt, blockedAt, voidedAt, ...rest } = data;
    return { ...rest, ...(triageSummaryStatus !== undefined ? { summaryStatus: triageSummaryStatus } : {}) };
  }
  private fromPrisma(data: any): RecoveryCaseTriageSummary {
    return { ...data, triageSummaryStatus: data.summaryStatus || 'draft', totalScore: 0, priorityBand: '', riskRank: '', readinessSummary: '', fairnessSummary: '', capacitySummary: '', queueSummary: '', summaryDetailsJson: parseJsonField(data.priorityBandCountsJson), sourceRefsJson: parseJsonField(data.sourceRefsJson), createdAt: toDateString(data.createdAt) || '', updatedAt: toDateString(data.updatedAt) || '', voidedAt: toDateString(data.voidedAt) } as RecoveryCaseTriageSummary;
  }
}
export class PrismaRecoveryCaseTriageAuditRepository implements RecoveryCaseTriageAuditRepository {
  constructor(private prisma: PrismaClient) {}
  async create(event: Partial<RecoveryCaseTriageAuditEvent> & { schoolId: string; actorId: string; actorRole: string }): Promise<RecoveryCaseTriageAuditEvent> {
    const created = await this.prisma.recoveryCaseTriageAuditRecord.create({ data: this.toPrisma(event) });
    return this.fromPrisma(created);
  }
  async listBySchool(schoolId: string): Promise<RecoveryCaseTriageAuditEvent[]> {
    const records = await this.prisma.recoveryCaseTriageAuditRecord.findMany({ where: { schoolId } });
    return records.map(r => this.fromPrisma(r));
  }
  async listByEntity(schoolId: string, entityType: string, entityId: string): Promise<RecoveryCaseTriageAuditEvent[]> {
    const records = await this.prisma.recoveryCaseTriageAuditRecord.findMany({ where: { schoolId, entityType, entityId } });
    return records.map(r => this.fromPrisma(r));
  }
  async listByAction(schoolId: string, action: string): Promise<RecoveryCaseTriageAuditEvent[]> {
    const records = await this.prisma.recoveryCaseTriageAuditRecord.findMany({ where: { schoolId, action } });
    return records.map(r => this.fromPrisma(r));
  }
  async listByActor(schoolId: string, actorId: string): Promise<RecoveryCaseTriageAuditEvent[]> {
    const records = await this.prisma.recoveryCaseTriageAuditRecord.findMany({ where: { schoolId, actorId } });
    return records.map(r => this.fromPrisma(r));
  }
  private toPrisma(data: any): any {
    const { safeSummary, reasonCodesJson, metadataJson, createdAt, ...rest } = data;
    return { ...rest, ...(metadataJson !== undefined ? { safeMetadataJson: metadataJson } : {}) };
  }
  private fromPrisma(data: any): RecoveryCaseTriageAuditEvent {
    return { ...data, triageAuditId: data.triageAuditEventId, safeSummary: '', reasonCodesJson: null, metadataJson: parseJsonField(data.safeMetadataJson), createdAt: toDateString(data.createdAt) || '' } as RecoveryCaseTriageAuditEvent;
  }
}
export class PrismaRecoveryCaseTriageIdempotencyRepository implements RecoveryCaseTriageIdempotencyRepository {
  constructor(private prisma: PrismaClient) {}
  async create(input: { schoolId: string; operation: string; idempotencyKey: string; requestHash: string; status?: string; resourceType?: string | null; resourceId?: string | null; safeResultSummary?: string | null; expiresAt?: string }): Promise<RecoveryCaseTriageIdempotencyEntry> {
    const created = await this.prisma.recoveryCaseTriageIdempotencyRecord.create({ data: this.toPrisma(input) });
    return this.fromPrisma(created);
  }
  async getByKey(schoolId: string, operation: string, idempotencyKey: string): Promise<RecoveryCaseTriageIdempotencyEntry | null> {
    const found = await this.prisma.recoveryCaseTriageIdempotencyRecord.findFirst({ where: { schoolId, idempotencyKey, operation } });
    if (!found) return null;
    return this.fromPrisma(found);
  }
  async update(id: string, data: Partial<RecoveryCaseTriageIdempotencyEntry>): Promise<RecoveryCaseTriageIdempotencyEntry> {
    const updated = await this.prisma.recoveryCaseTriageIdempotencyRecord.update({ where: { triageIdempotencyId: id }, data: data as any });
    return this.fromPrisma(updated);
  }
  async complete(id: string, safeResultSummary: string, resourceType?: string, resourceId?: string): Promise<RecoveryCaseTriageIdempotencyEntry> {
    const updated = await this.prisma.recoveryCaseTriageIdempotencyRecord.update({ where: { triageIdempotencyId: id }, data: { status: 'completed', responseRef: safeResultSummary, completedAt: new Date() } as any });
    return this.fromPrisma(updated);
  }
  async listBySchool(schoolId: string): Promise<RecoveryCaseTriageIdempotencyEntry[]> {
    const records = await this.prisma.recoveryCaseTriageIdempotencyRecord.findMany({ where: { schoolId } });
    return records.map(r => this.fromPrisma(r));
  }
  async listByOperation(schoolId: string, operation: string): Promise<RecoveryCaseTriageIdempotencyEntry[]> {
    const records = await this.prisma.recoveryCaseTriageIdempotencyRecord.findMany({ where: { schoolId, operation } });
    return records.map(r => this.fromPrisma(r));
  }
  private toPrisma(data: any): any {
    const { status, resourceType, resourceId, safeResultSummary, expiresAt, createdAt, ...rest } = data;
    return { ...rest, ...(status !== undefined ? { status } : {}) };
  }
  private fromPrisma(data: any): RecoveryCaseTriageIdempotencyEntry {
    return { ...data, resourceType: null, resourceId: null, safeResultSummary: data.responseRef || null, updatedAt: toDateString(data.completedAt) || toDateString(data.createdAt) || '', expiresAt: null } as RecoveryCaseTriageIdempotencyEntry;
  }
}
export class PrismaRecoveryCaseTriageRepositories {
  triageReadiness: PrismaRecoveryCaseTriageReadinessRepository;
  priorityAssessment: PrismaRecoveryCasePriorityAssessmentRepository;
  priorityFactor: PrismaRecoveryCasePriorityFactorRepository;
  fairnessCheck: PrismaRecoveryCaseFairnessCheckRepository;
  capacitySnapshot: PrismaRecoveryCaseCapacitySnapshotRepository;
  queueSnapshot: PrismaRecoveryCaseTriageQueueSnapshotRepository;
  queueItem: PrismaRecoveryCaseTriageQueueItemRepository;
  workloadAllocationDraft: PrismaRecoveryCaseWorkloadAllocationDraftRepository;
  escalationDraft: PrismaRecoveryCaseEscalationDraftRepository;
  reviewWindowDraft: PrismaRecoveryCaseReviewWindowDraftRepository;
  queueExplanation: PrismaRecoveryCaseQueueExplanationRepository;
  duplicateSuppression: PrismaRecoveryCaseDuplicateSuppressionRepository;
  triageSummary: PrismaRecoveryCaseTriageSummaryRepository;
  audit: PrismaRecoveryCaseTriageAuditRepository;
  idempotency: PrismaRecoveryCaseTriageIdempotencyRepository;

  constructor(prisma: PrismaClient) {
    this.triageReadiness = new PrismaRecoveryCaseTriageReadinessRepository(prisma);
    this.priorityAssessment = new PrismaRecoveryCasePriorityAssessmentRepository(prisma);
    this.priorityFactor = new PrismaRecoveryCasePriorityFactorRepository(prisma);
    this.fairnessCheck = new PrismaRecoveryCaseFairnessCheckRepository(prisma);
    this.capacitySnapshot = new PrismaRecoveryCaseCapacitySnapshotRepository(prisma);
    this.queueSnapshot = new PrismaRecoveryCaseTriageQueueSnapshotRepository(prisma);
    this.queueItem = new PrismaRecoveryCaseTriageQueueItemRepository(prisma);
    this.workloadAllocationDraft = new PrismaRecoveryCaseWorkloadAllocationDraftRepository(prisma);
    this.escalationDraft = new PrismaRecoveryCaseEscalationDraftRepository(prisma);
    this.reviewWindowDraft = new PrismaRecoveryCaseReviewWindowDraftRepository(prisma);
    this.queueExplanation = new PrismaRecoveryCaseQueueExplanationRepository(prisma);
    this.duplicateSuppression = new PrismaRecoveryCaseDuplicateSuppressionRepository(prisma);
    this.triageSummary = new PrismaRecoveryCaseTriageSummaryRepository(prisma);
    this.audit = new PrismaRecoveryCaseTriageAuditRepository(prisma);
    this.idempotency = new PrismaRecoveryCaseTriageIdempotencyRepository(prisma);
  }
}
