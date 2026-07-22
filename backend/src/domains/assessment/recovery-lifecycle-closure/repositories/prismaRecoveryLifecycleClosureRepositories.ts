import { PrismaClient } from '@prisma/client';
import { RecoveryLifecycleClosureReadiness } from '../contracts/recoveryLifecycleClosureReadinessContracts';
import { RecoveryPostSimulationHandoffPacket } from '../contracts/recoveryPostSimulationHandoffPacketContracts';
import { RecoveryNextCycleRecommendationDraft } from '../contracts/recoveryNextCycleRecommendationContracts';
import { RecoveryDeferredIntegrationTicket } from '../contracts/recoveryDeferredIntegrationTicketContracts';
import { RecoveryUnresolvedRiskRegister } from '../contracts/recoveryUnresolvedRiskRegisterContracts';
import { RecoveryTeacherClosureReviewPacket, RecoveryAdminGovernanceReviewPacket } from '../contracts/recoveryClosureReviewPacketContracts';
import { RecoveryStudentClosureReflectionDraft, RecoveryParentClosureGuidanceDraft } from '../contracts/recoveryStakeholderClosureDraftContracts';
import { RecoveryArchiveManifest } from '../contracts/recoveryArchiveManifestContracts';
import { RecoveryFinalLifecycleSummary } from '../contracts/recoveryFinalLifecycleSummaryContracts';
import {
  IClosureReadinessRepository,
  IHandoffPacketRepository,
  INextCycleRecommendationRepository,
  IDeferredIntegrationTicketRepository,
  IUnresolvedRiskRegisterRepository,
  ITeacherClosureReviewPacketRepository,
  IAdminGovernanceReviewPacketRepository,
  IStudentClosureReflectionDraftRepository,
  IParentClosureGuidanceDraftRepository,
  IArchiveManifestRepository,
  IFinalLifecycleSummaryRepository,
  IClosureAuditRepository,
  RecoveryLifecycleClosureAuditRecord,
  IClosureIdempotencyRepository,
  RecoveryLifecycleClosureIdempotencyRecord,
  IRecoveryLifecycleClosureRepositories,
} from '../contracts/recoveryLifecycleClosureRepositoryContracts';

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

export class PrismaClosureReadinessRepository implements IClosureReadinessRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Partial<RecoveryLifecycleClosureReadiness>): Promise<RecoveryLifecycleClosureReadiness> {
    const created = await this.prisma.recoveryLifecycleClosureReadinessRecord.create({ data: this.toPrisma(data) });
    return this.fromPrisma(created);
  }

  async getById(id: string): Promise<RecoveryLifecycleClosureReadiness | null> {
    const found = await this.prisma.recoveryLifecycleClosureReadinessRecord.findUnique({ where: { closureReadinessId: id } });
    return found ? this.fromPrisma(found) : null;
  }

  async listBySchool(schoolId: string): Promise<RecoveryLifecycleClosureReadiness[]> {
    const records = await this.prisma.recoveryLifecycleClosureReadinessRecord.findMany({ where: { schoolId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryLifecycleClosureReadiness[]> {
    const records = await this.prisma.recoveryLifecycleClosureReadinessRecord.findMany({ where: { schoolId, studentRef } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByPlanId(schoolId: string, resultRecoveryPlanId: string): Promise<RecoveryLifecycleClosureReadiness[]> {
    const records = await this.prisma.recoveryLifecycleClosureReadinessRecord.findMany({ where: { schoolId, resultRecoveryPlanId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listBySimulationReadinessId(schoolId: string, simulationReadinessId: string): Promise<RecoveryLifecycleClosureReadiness[]> {
    const records = await this.prisma.recoveryLifecycleClosureReadinessRecord.findMany({ where: { schoolId, recoveryOutcomeExecutionSimulationReadinessId: simulationReadinessId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listBySimulationPlanId(schoolId: string, simulationPlanId: string): Promise<RecoveryLifecycleClosureReadiness[]> {
    const records = await this.prisma.recoveryLifecycleClosureReadinessRecord.findMany({ where: { schoolId, recoveryOutcomeExecutionSimulationPlanId: simulationPlanId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listBySimulationRunId(simulationRunId: string): Promise<RecoveryLifecycleClosureReadiness[]> {
    const records = await this.prisma.recoveryLifecycleClosureReadinessRecord.findMany({ where: { recoveryOutcomeExecutionSimulationRunId: simulationRunId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listBySimulationResultId(simulationResultId: string): Promise<RecoveryLifecycleClosureReadiness[]> {
    const records = await this.prisma.recoveryLifecycleClosureReadinessRecord.findMany({ where: { recoveryOutcomeExecutionSimulationResultId: simulationResultId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listBySimulationSummaryId(simulationSummaryId: string): Promise<RecoveryLifecycleClosureReadiness[]> {
    const records = await this.prisma.recoveryLifecycleClosureReadinessRecord.findMany({ where: { recoveryOutcomeExecutionSimulationSummaryId: simulationSummaryId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByStatus(schoolId: string, closureReadinessStatus: string): Promise<RecoveryLifecycleClosureReadiness[]> {
    const records = await this.prisma.recoveryLifecycleClosureReadinessRecord.findMany({ where: { schoolId, closureReadinessStatus } });
    return records.map(r => this.fromPrisma(r));
  }

  async update(id: string, data: Partial<RecoveryLifecycleClosureReadiness>): Promise<RecoveryLifecycleClosureReadiness> {
    const updated = await this.prisma.recoveryLifecycleClosureReadinessRecord.update({
      where: { closureReadinessId: id },
      data: this.toPrisma(data),
    });
    return this.fromPrisma(updated);
  }

  async updateStatus(id: string, status: string): Promise<RecoveryLifecycleClosureReadiness> {
    return this.update(id, { closureReadinessStatus: status } as any);
  }

  async markReviewReady(id: string): Promise<RecoveryLifecycleClosureReadiness> {
    return this.update(id, { closureReadinessStatus: 'review_ready', reviewReadyAt: new Date().toISOString() } as any);
  }

  async approveForFutureUse(id: string): Promise<RecoveryLifecycleClosureReadiness> {
    return this.update(id, { closureReadinessStatus: 'approved_for_future_use', approvedForFutureUseAt: new Date().toISOString() } as any);
  }

  async suppress(id: string): Promise<RecoveryLifecycleClosureReadiness> {
    return this.update(id, { closureReadinessStatus: 'suppressed', suppressedAt: new Date().toISOString() } as any);
  }

  async block(id: string): Promise<RecoveryLifecycleClosureReadiness> {
    return this.update(id, { closureReadinessStatus: 'blocked', blockedAt: new Date().toISOString() } as any);
  }

  async void(id: string): Promise<RecoveryLifecycleClosureReadiness> {
    return this.update(id, { closureReadinessStatus: 'voided', voidedAt: new Date().toISOString() } as any);
  }

  private toPrisma(data: any): any {
    const { ...rest } = data;
    return rest;
  }

  private fromPrisma(data: any): RecoveryLifecycleClosureReadiness {
    return {
      ...data,
      readinessChecksJson: parseJsonField(data.readinessChecksJson),
      blockedReasonCodesJson: parseStringArray(data.blockedReasonCodesJson),
      sourceRefsJson: parseJsonField(data.sourceRefsJson),
      createdAt: toDateString(data.createdAt) || '',
      updatedAt: toDateString(data.updatedAt) || '',
      reviewReadyAt: toDateString(data.reviewReadyAt),
      readyForFutureUseAt: toDateString(data.readyForFutureUseAt),
      approvedForFutureUseAt: toDateString(data.approvedForFutureUseAt),
      blockedAt: toDateString(data.blockedAt),
      suppressedAt: toDateString(data.suppressedAt),
      voidedAt: toDateString(data.voidedAt),
    } as RecoveryLifecycleClosureReadiness;
  }
}

export class PrismaHandoffPacketRepository implements IHandoffPacketRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Partial<RecoveryPostSimulationHandoffPacket>): Promise<RecoveryPostSimulationHandoffPacket> {
    const created = await this.prisma.recoveryPostSimulationHandoffPacketRecord.create({ data: this.toPrisma(data) });
    return this.fromPrisma(created);
  }

  async getById(id: string): Promise<RecoveryPostSimulationHandoffPacket | null> {
    const found = await this.prisma.recoveryPostSimulationHandoffPacketRecord.findUnique({ where: { handoffPacketId: id } });
    return found ? this.fromPrisma(found) : null;
  }

  async listBySchool(schoolId: string): Promise<RecoveryPostSimulationHandoffPacket[]> {
    const records = await this.prisma.recoveryPostSimulationHandoffPacketRecord.findMany({ where: { schoolId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryPostSimulationHandoffPacket[]> {
    const records = await this.prisma.recoveryPostSimulationHandoffPacketRecord.findMany({ where: { schoolId, studentRef } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByPlanId(schoolId: string, resultRecoveryPlanId: string): Promise<RecoveryPostSimulationHandoffPacket[]> {
    const records = await this.prisma.recoveryPostSimulationHandoffPacketRecord.findMany({ where: { schoolId, resultRecoveryPlanId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listBySimulationRunId(simulationRunId: string): Promise<RecoveryPostSimulationHandoffPacket[]> {
    const records = await this.prisma.recoveryPostSimulationHandoffPacketRecord.findMany({ where: { recoveryOutcomeExecutionSimulationRunId: simulationRunId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listBySimulationResultId(simulationResultId: string): Promise<RecoveryPostSimulationHandoffPacket[]> {
    const records = await this.prisma.recoveryPostSimulationHandoffPacketRecord.findMany({ where: { recoveryOutcomeExecutionSimulationResultId: simulationResultId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByActionBundleId(bundleId: string): Promise<RecoveryPostSimulationHandoffPacket[]> {
    const records = await this.prisma.recoveryPostSimulationHandoffPacketRecord.findMany({ where: { recoveryOutcomeActionBundleId: bundleId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByStatus(schoolId: string, handoffStatus: string): Promise<RecoveryPostSimulationHandoffPacket[]> {
    const records = await this.prisma.recoveryPostSimulationHandoffPacketRecord.findMany({ where: { schoolId, handoffStatus } });
    return records.map(r => this.fromPrisma(r));
  }

  async update(id: string, data: Partial<RecoveryPostSimulationHandoffPacket>): Promise<RecoveryPostSimulationHandoffPacket> {
    const updated = await this.prisma.recoveryPostSimulationHandoffPacketRecord.update({
      where: { handoffPacketId: id },
      data: this.toPrisma(data),
    });
    return this.fromPrisma(updated);
  }

  async updateStatus(id: string, status: string): Promise<RecoveryPostSimulationHandoffPacket> {
    return this.update(id, { handoffStatus: status } as any);
  }

  async markReviewReady(id: string): Promise<RecoveryPostSimulationHandoffPacket> {
    return this.update(id, { handoffStatus: 'review_ready', reviewReadyAt: new Date().toISOString() } as any);
  }

  async markHandoffReady(id: string): Promise<RecoveryPostSimulationHandoffPacket> {
    return this.update(id, { handoffStatus: 'handoff_ready', handoffReadyAt: new Date().toISOString() } as any);
  }

  async approveForFutureUse(id: string): Promise<RecoveryPostSimulationHandoffPacket> {
    return this.update(id, { handoffStatus: 'approved_for_future_use', approvedForFutureUseAt: new Date().toISOString() } as any);
  }

  async suppress(id: string): Promise<RecoveryPostSimulationHandoffPacket> {
    return this.update(id, { handoffStatus: 'suppressed', suppressedAt: new Date().toISOString() } as any);
  }

  async block(id: string): Promise<RecoveryPostSimulationHandoffPacket> {
    return this.update(id, { handoffStatus: 'blocked', blockedAt: new Date().toISOString() } as any);
  }

  async void(id: string): Promise<RecoveryPostSimulationHandoffPacket> {
    return this.update(id, { handoffStatus: 'voided', voidedAt: new Date().toISOString() } as any);
  }

  private toPrisma(data: any): any {
    const { ...rest } = data;
    return rest;
  }

  private fromPrisma(data: any): RecoveryPostSimulationHandoffPacket {
    return {
      ...data,
      handoffContentsJson: parseJsonField(data.handoffContentsJson),
      nextStepsJson: parseJsonField(data.nextStepsJson),
      blockedReasonCodesJson: parseStringArray(data.blockedReasonCodesJson),
      sourceRefsJson: parseJsonField(data.sourceRefsJson),
      createdAt: toDateString(data.createdAt) || '',
      updatedAt: toDateString(data.updatedAt) || '',
      reviewReadyAt: toDateString(data.reviewReadyAt),
      handoffReadyAt: toDateString(data.handoffReadyAt),
      approvedForFutureUseAt: toDateString(data.approvedForFutureUseAt),
      suppressedAt: toDateString(data.suppressedAt),
      blockedAt: toDateString(data.blockedAt),
      voidedAt: toDateString(data.voidedAt),
    } as RecoveryPostSimulationHandoffPacket;
  }
}

export class PrismaNextCycleRecommendationDraftRepository implements INextCycleRecommendationRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Partial<RecoveryNextCycleRecommendationDraft>): Promise<RecoveryNextCycleRecommendationDraft> {
    const created = await this.prisma.recoveryNextCycleRecommendationDraftRecord.create({ data: this.toPrisma(data) });
    return this.fromPrisma(created);
  }

  async getById(id: string): Promise<RecoveryNextCycleRecommendationDraft | null> {
    const found = await this.prisma.recoveryNextCycleRecommendationDraftRecord.findUnique({ where: { nextCycleRecommendationId: id } });
    return found ? this.fromPrisma(found) : null;
  }

  async listBySchool(schoolId: string): Promise<RecoveryNextCycleRecommendationDraft[]> {
    const records = await this.prisma.recoveryNextCycleRecommendationDraftRecord.findMany({ where: { schoolId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryNextCycleRecommendationDraft[]> {
    const records = await this.prisma.recoveryNextCycleRecommendationDraftRecord.findMany({ where: { schoolId, studentRef } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByPlanId(schoolId: string, resultRecoveryPlanId: string): Promise<RecoveryNextCycleRecommendationDraft[]> {
    const records = await this.prisma.recoveryNextCycleRecommendationDraftRecord.findMany({ where: { schoolId, resultRecoveryPlanId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listBySimulationSummaryId(simulationSummaryId: string): Promise<RecoveryNextCycleRecommendationDraft[]> {
    const records = await this.prisma.recoveryNextCycleRecommendationDraftRecord.findMany({ where: { recoveryOutcomeExecutionSimulationSummaryId: simulationSummaryId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByType(schoolId: string, recommendationType: string): Promise<RecoveryNextCycleRecommendationDraft[]> {
    const records = await this.prisma.recoveryNextCycleRecommendationDraftRecord.findMany({ where: { schoolId, recommendationType } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByStatus(schoolId: string, recommendationStatus: string): Promise<RecoveryNextCycleRecommendationDraft[]> {
    const records = await this.prisma.recoveryNextCycleRecommendationDraftRecord.findMany({ where: { schoolId, recommendationStatus } });
    return records.map(r => this.fromPrisma(r));
  }

  async update(id: string, data: Partial<RecoveryNextCycleRecommendationDraft>): Promise<RecoveryNextCycleRecommendationDraft> {
    const updated = await this.prisma.recoveryNextCycleRecommendationDraftRecord.update({
      where: { nextCycleRecommendationId: id },
      data: this.toPrisma(data),
    });
    return this.fromPrisma(updated);
  }

  async updateStatus(id: string, status: string): Promise<RecoveryNextCycleRecommendationDraft> {
    return this.update(id, { recommendationStatus: status } as any);
  }

  async markReviewReady(id: string): Promise<RecoveryNextCycleRecommendationDraft> {
    return this.update(id, { recommendationStatus: 'review_ready', reviewReadyAt: new Date().toISOString() } as any);
  }

  async approveForFutureUse(id: string): Promise<RecoveryNextCycleRecommendationDraft> {
    return this.update(id, { recommendationStatus: 'approved_for_future_use', approvedForFutureUseAt: new Date().toISOString() } as any);
  }

  async suppress(id: string): Promise<RecoveryNextCycleRecommendationDraft> {
    return this.update(id, { recommendationStatus: 'suppressed', suppressedAt: new Date().toISOString() } as any);
  }

  async block(id: string): Promise<RecoveryNextCycleRecommendationDraft> {
    return this.update(id, { recommendationStatus: 'blocked', blockedAt: new Date().toISOString() } as any);
  }

  async void(id: string): Promise<RecoveryNextCycleRecommendationDraft> {
    return this.update(id, { recommendationStatus: 'voided', voidedAt: new Date().toISOString() } as any);
  }

  private toPrisma(data: any): any {
    const { ...rest } = data;
    return rest;
  }

  private fromPrisma(data: any): RecoveryNextCycleRecommendationDraft {
    return {
      ...data,
      recommendationDetailsJson: parseJsonField(data.recommendationDetailsJson),
      blockedReasonCodesJson: parseStringArray(data.blockedReasonCodesJson),
      sourceRefsJson: parseJsonField(data.sourceRefsJson),
      createdAt: toDateString(data.createdAt) || '',
      updatedAt: toDateString(data.updatedAt) || '',
      reviewReadyAt: toDateString(data.reviewReadyAt),
      approvedForFutureUseAt: toDateString(data.approvedForFutureUseAt),
      suppressedAt: toDateString(data.suppressedAt),
      blockedAt: toDateString(data.blockedAt),
      voidedAt: toDateString(data.voidedAt),
    } as RecoveryNextCycleRecommendationDraft;
  }
}

export class PrismaDeferredIntegrationTicketRepository implements IDeferredIntegrationTicketRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Partial<RecoveryDeferredIntegrationTicket>): Promise<RecoveryDeferredIntegrationTicket> {
    const created = await this.prisma.recoveryDeferredIntegrationTicketRecord.create({ data: this.toPrisma(data) });
    return this.fromPrisma(created);
  }

  async getById(id: string): Promise<RecoveryDeferredIntegrationTicket | null> {
    const found = await this.prisma.recoveryDeferredIntegrationTicketRecord.findUnique({ where: { deferredIntegrationTicketId: id } });
    return found ? this.fromPrisma(found) : null;
  }

  async listBySchool(schoolId: string): Promise<RecoveryDeferredIntegrationTicket[]> {
    const records = await this.prisma.recoveryDeferredIntegrationTicketRecord.findMany({ where: { schoolId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByPlanId(schoolId: string, resultRecoveryPlanId: string): Promise<RecoveryDeferredIntegrationTicket[]> {
    const records = await this.prisma.recoveryDeferredIntegrationTicketRecord.findMany({ where: { schoolId, resultRecoveryPlanId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByType(schoolId: string, ticketType: string): Promise<RecoveryDeferredIntegrationTicket[]> {
    const records = await this.prisma.recoveryDeferredIntegrationTicketRecord.findMany({ where: { schoolId, ticketType } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByStatus(schoolId: string, ticketStatus: string): Promise<RecoveryDeferredIntegrationTicket[]> {
    const records = await this.prisma.recoveryDeferredIntegrationTicketRecord.findMany({ where: { schoolId, ticketStatus } });
    return records.map(r => this.fromPrisma(r));
  }

  async update(id: string, data: Partial<RecoveryDeferredIntegrationTicket>): Promise<RecoveryDeferredIntegrationTicket> {
    const updated = await this.prisma.recoveryDeferredIntegrationTicketRecord.update({
      where: { deferredIntegrationTicketId: id },
      data: this.toPrisma(data),
    });
    return this.fromPrisma(updated);
  }

  async updateStatus(id: string, status: string): Promise<RecoveryDeferredIntegrationTicket> {
    return this.update(id, { ticketStatus: status } as any);
  }

  async markReviewReady(id: string): Promise<RecoveryDeferredIntegrationTicket> {
    return this.update(id, { ticketStatus: 'review_ready', reviewReadyAt: new Date().toISOString() } as any);
  }

  async approveForFutureUse(id: string): Promise<RecoveryDeferredIntegrationTicket> {
    return this.update(id, { ticketStatus: 'approved_for_future_use', approvedForFutureUseAt: new Date().toISOString() } as any);
  }

  async suppress(id: string): Promise<RecoveryDeferredIntegrationTicket> {
    return this.update(id, { ticketStatus: 'suppressed', suppressedAt: new Date().toISOString() } as any);
  }

  async block(id: string): Promise<RecoveryDeferredIntegrationTicket> {
    return this.update(id, { ticketStatus: 'blocked', blockedAt: new Date().toISOString() } as any);
  }

  async void(id: string): Promise<RecoveryDeferredIntegrationTicket> {
    return this.update(id, { ticketStatus: 'voided', voidedAt: new Date().toISOString() } as any);
  }

  private toPrisma(data: any): any {
    const { ...rest } = data;
    return rest;
  }

  private fromPrisma(data: any): RecoveryDeferredIntegrationTicket {
    return {
      ...data,
      ticketDetailsJson: parseJsonField(data.ticketDetailsJson),
      blockedReasonCodesJson: parseStringArray(data.blockedReasonCodesJson),
      sourceRefsJson: parseJsonField(data.sourceRefsJson),
      createdAt: toDateString(data.createdAt) || '',
      updatedAt: toDateString(data.updatedAt) || '',
      reviewReadyAt: toDateString(data.reviewReadyAt),
      approvedForFutureUseAt: toDateString(data.approvedForFutureUseAt),
      suppressedAt: toDateString(data.suppressedAt),
      blockedAt: toDateString(data.blockedAt),
      voidedAt: toDateString(data.voidedAt),
    } as RecoveryDeferredIntegrationTicket;
  }
}

export class PrismaUnresolvedRiskRegisterRepository implements IUnresolvedRiskRegisterRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Partial<RecoveryUnresolvedRiskRegister>): Promise<RecoveryUnresolvedRiskRegister> {
    const created = await this.prisma.recoveryUnresolvedRiskRegisterRecord.create({ data: this.toPrisma(data) });
    return this.fromPrisma(created);
  }

  async getById(id: string): Promise<RecoveryUnresolvedRiskRegister | null> {
    const found = await this.prisma.recoveryUnresolvedRiskRegisterRecord.findUnique({ where: { unresolvedRiskRegisterId: id } });
    return found ? this.fromPrisma(found) : null;
  }

  async listBySchool(schoolId: string): Promise<RecoveryUnresolvedRiskRegister[]> {
    const records = await this.prisma.recoveryUnresolvedRiskRegisterRecord.findMany({ where: { schoolId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByPlanId(schoolId: string, resultRecoveryPlanId: string): Promise<RecoveryUnresolvedRiskRegister[]> {
    const records = await this.prisma.recoveryUnresolvedRiskRegisterRecord.findMany({ where: { schoolId, resultRecoveryPlanId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByRiskLevel(schoolId: string, riskLevel: string): Promise<RecoveryUnresolvedRiskRegister[]> {
    const records = await this.prisma.recoveryUnresolvedRiskRegisterRecord.findMany({ where: { schoolId, riskLevel } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByStatus(schoolId: string, riskStatus: string): Promise<RecoveryUnresolvedRiskRegister[]> {
    const records = await this.prisma.recoveryUnresolvedRiskRegisterRecord.findMany({ where: { schoolId, riskStatus } });
    return records.map(r => this.fromPrisma(r));
  }

  async update(id: string, data: Partial<RecoveryUnresolvedRiskRegister>): Promise<RecoveryUnresolvedRiskRegister> {
    const updated = await this.prisma.recoveryUnresolvedRiskRegisterRecord.update({
      where: { unresolvedRiskRegisterId: id },
      data: this.toPrisma(data),
    });
    return this.fromPrisma(updated);
  }

  async updateStatus(id: string, status: string): Promise<RecoveryUnresolvedRiskRegister> {
    return this.update(id, { riskStatus: status } as any);
  }

  async markReviewReady(id: string): Promise<RecoveryUnresolvedRiskRegister> {
    return this.update(id, { riskStatus: 'review_ready', reviewReadyAt: new Date().toISOString() } as any);
  }

  async suppress(id: string): Promise<RecoveryUnresolvedRiskRegister> {
    return this.update(id, { riskStatus: 'suppressed', suppressedAt: new Date().toISOString() } as any);
  }

  async block(id: string): Promise<RecoveryUnresolvedRiskRegister> {
    return this.update(id, { riskStatus: 'blocked', blockedAt: new Date().toISOString() } as any);
  }

  async void(id: string): Promise<RecoveryUnresolvedRiskRegister> {
    return this.update(id, { riskStatus: 'voided', voidedAt: new Date().toISOString() } as any);
  }

  private toPrisma(data: any): any {
    const { ...rest } = data;
    return rest;
  }

  private fromPrisma(data: any): RecoveryUnresolvedRiskRegister {
    return {
      ...data,
      riskDetailsJson: parseJsonField(data.riskDetailsJson),
      blockedReasonCodesJson: parseStringArray(data.blockedReasonCodesJson),
      sourceRefsJson: parseJsonField(data.sourceRefsJson),
      createdAt: toDateString(data.createdAt) || '',
      updatedAt: toDateString(data.updatedAt) || '',
      reviewReadyAt: toDateString(data.reviewReadyAt),
      suppressedAt: toDateString(data.suppressedAt),
      blockedAt: toDateString(data.blockedAt),
      voidedAt: toDateString(data.voidedAt),
    } as RecoveryUnresolvedRiskRegister;
  }
}

export class PrismaTeacherClosureReviewPacketRepository implements ITeacherClosureReviewPacketRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Partial<RecoveryTeacherClosureReviewPacket>): Promise<RecoveryTeacherClosureReviewPacket> {
    const created = await this.prisma.recoveryTeacherClosureReviewPacketRecord.create({ data: this.toPrisma(data) });
    return this.fromPrisma(created);
  }

  async getById(id: string): Promise<RecoveryTeacherClosureReviewPacket | null> {
    const found = await this.prisma.recoveryTeacherClosureReviewPacketRecord.findUnique({ where: { teacherClosureReviewPacketId: id } });
    return found ? this.fromPrisma(found) : null;
  }

  async listBySchool(schoolId: string): Promise<RecoveryTeacherClosureReviewPacket[]> {
    const records = await this.prisma.recoveryTeacherClosureReviewPacketRecord.findMany({ where: { schoolId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryTeacherClosureReviewPacket[]> {
    const records = await this.prisma.recoveryTeacherClosureReviewPacketRecord.findMany({ where: { schoolId, studentRef } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByPlanId(schoolId: string, resultRecoveryPlanId: string): Promise<RecoveryTeacherClosureReviewPacket[]> {
    const records = await this.prisma.recoveryTeacherClosureReviewPacketRecord.findMany({ where: { schoolId, resultRecoveryPlanId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listBySimulationSummaryId(simulationSummaryId: string): Promise<RecoveryTeacherClosureReviewPacket[]> {
    const records = await this.prisma.recoveryTeacherClosureReviewPacketRecord.findMany({ where: { recoveryOutcomeExecutionSimulationSummaryId: simulationSummaryId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByTeacherRef(schoolId: string, teacherRef: string): Promise<RecoveryTeacherClosureReviewPacket[]> {
    const records = await this.prisma.recoveryTeacherClosureReviewPacketRecord.findMany({ where: { schoolId, teacherRef } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByStatus(schoolId: string, reviewStatus: string): Promise<RecoveryTeacherClosureReviewPacket[]> {
    const records = await this.prisma.recoveryTeacherClosureReviewPacketRecord.findMany({ where: { schoolId, reviewStatus } });
    return records.map(r => this.fromPrisma(r));
  }

  async update(id: string, data: Partial<RecoveryTeacherClosureReviewPacket>): Promise<RecoveryTeacherClosureReviewPacket> {
    const updated = await this.prisma.recoveryTeacherClosureReviewPacketRecord.update({
      where: { teacherClosureReviewPacketId: id },
      data: this.toPrisma(data),
    });
    return this.fromPrisma(updated);
  }

  async updateStatus(id: string, status: string): Promise<RecoveryTeacherClosureReviewPacket> {
    return this.update(id, { reviewStatus: status } as any);
  }

  async markReviewReady(id: string): Promise<RecoveryTeacherClosureReviewPacket> {
    return this.update(id, { reviewStatus: 'review_ready', reviewReadyAt: new Date().toISOString() } as any);
  }

  async approveForFutureUse(id: string): Promise<RecoveryTeacherClosureReviewPacket> {
    return this.update(id, { reviewStatus: 'approved_for_future_use', approvedForFutureUseAt: new Date().toISOString() } as any);
  }

  async suppress(id: string): Promise<RecoveryTeacherClosureReviewPacket> {
    return this.update(id, { reviewStatus: 'suppressed', suppressedAt: new Date().toISOString() } as any);
  }

  async block(id: string): Promise<RecoveryTeacherClosureReviewPacket> {
    return this.update(id, { reviewStatus: 'blocked', blockedAt: new Date().toISOString() } as any);
  }

  async void(id: string): Promise<RecoveryTeacherClosureReviewPacket> {
    return this.update(id, { reviewStatus: 'voided', voidedAt: new Date().toISOString() } as any);
  }

  private toPrisma(data: any): any {
    const { ...rest } = data;
    return rest;
  }

  private fromPrisma(data: any): RecoveryTeacherClosureReviewPacket {
    return {
      ...data,
      teacherReviewNotesJson: parseJsonField(data.teacherReviewNotesJson),
      blockedReasonCodesJson: parseStringArray(data.blockedReasonCodesJson),
      sourceRefsJson: parseJsonField(data.sourceRefsJson),
      createdAt: toDateString(data.createdAt) || '',
      updatedAt: toDateString(data.updatedAt) || '',
      reviewReadyAt: toDateString(data.reviewReadyAt),
      approvedForFutureUseAt: toDateString(data.approvedForFutureUseAt),
      suppressedAt: toDateString(data.suppressedAt),
      blockedAt: toDateString(data.blockedAt),
      voidedAt: toDateString(data.voidedAt),
    } as RecoveryTeacherClosureReviewPacket;
  }
}

export class PrismaAdminGovernanceReviewPacketRepository implements IAdminGovernanceReviewPacketRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Partial<RecoveryAdminGovernanceReviewPacket>): Promise<RecoveryAdminGovernanceReviewPacket> {
    const created = await this.prisma.recoveryAdminGovernanceReviewPacketRecord.create({ data: this.toPrisma(data) });
    return this.fromPrisma(created);
  }

  async getById(id: string): Promise<RecoveryAdminGovernanceReviewPacket | null> {
    const found = await this.prisma.recoveryAdminGovernanceReviewPacketRecord.findUnique({ where: { adminGovernanceReviewPacketId: id } });
    return found ? this.fromPrisma(found) : null;
  }

  async listBySchool(schoolId: string): Promise<RecoveryAdminGovernanceReviewPacket[]> {
    const records = await this.prisma.recoveryAdminGovernanceReviewPacketRecord.findMany({ where: { schoolId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryAdminGovernanceReviewPacket[]> {
    const records = await this.prisma.recoveryAdminGovernanceReviewPacketRecord.findMany({ where: { schoolId, studentRef } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByPlanId(schoolId: string, resultRecoveryPlanId: string): Promise<RecoveryAdminGovernanceReviewPacket[]> {
    const records = await this.prisma.recoveryAdminGovernanceReviewPacketRecord.findMany({ where: { schoolId, resultRecoveryPlanId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listBySimulationSummaryId(simulationSummaryId: string): Promise<RecoveryAdminGovernanceReviewPacket[]> {
    const records = await this.prisma.recoveryAdminGovernanceReviewPacketRecord.findMany({ where: { recoveryOutcomeExecutionSimulationSummaryId: simulationSummaryId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByAdminRef(schoolId: string, adminRef: string): Promise<RecoveryAdminGovernanceReviewPacket[]> {
    const records = await this.prisma.recoveryAdminGovernanceReviewPacketRecord.findMany({ where: { schoolId, adminRef } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByStatus(schoolId: string, reviewStatus: string): Promise<RecoveryAdminGovernanceReviewPacket[]> {
    const records = await this.prisma.recoveryAdminGovernanceReviewPacketRecord.findMany({ where: { schoolId, reviewStatus } });
    return records.map(r => this.fromPrisma(r));
  }

  async update(id: string, data: Partial<RecoveryAdminGovernanceReviewPacket>): Promise<RecoveryAdminGovernanceReviewPacket> {
    const updated = await this.prisma.recoveryAdminGovernanceReviewPacketRecord.update({
      where: { adminGovernanceReviewPacketId: id },
      data: this.toPrisma(data),
    });
    return this.fromPrisma(updated);
  }

  async updateStatus(id: string, status: string): Promise<RecoveryAdminGovernanceReviewPacket> {
    return this.update(id, { reviewStatus: status } as any);
  }

  async markReviewReady(id: string): Promise<RecoveryAdminGovernanceReviewPacket> {
    return this.update(id, { reviewStatus: 'review_ready', reviewReadyAt: new Date().toISOString() } as any);
  }

  async approveForFutureUse(id: string): Promise<RecoveryAdminGovernanceReviewPacket> {
    return this.update(id, { reviewStatus: 'approved_for_future_use', approvedForFutureUseAt: new Date().toISOString() } as any);
  }

  async suppress(id: string): Promise<RecoveryAdminGovernanceReviewPacket> {
    return this.update(id, { reviewStatus: 'suppressed', suppressedAt: new Date().toISOString() } as any);
  }

  async block(id: string): Promise<RecoveryAdminGovernanceReviewPacket> {
    return this.update(id, { reviewStatus: 'blocked', blockedAt: new Date().toISOString() } as any);
  }

  async void(id: string): Promise<RecoveryAdminGovernanceReviewPacket> {
    return this.update(id, { reviewStatus: 'voided', voidedAt: new Date().toISOString() } as any);
  }

  private toPrisma(data: any): any {
    const { ...rest } = data;
    return rest;
  }

  private fromPrisma(data: any): RecoveryAdminGovernanceReviewPacket {
    return {
      ...data,
      governanceReviewNotesJson: parseJsonField(data.governanceReviewNotesJson),
      blockedReasonCodesJson: parseStringArray(data.blockedReasonCodesJson),
      sourceRefsJson: parseJsonField(data.sourceRefsJson),
      createdAt: toDateString(data.createdAt) || '',
      updatedAt: toDateString(data.updatedAt) || '',
      reviewReadyAt: toDateString(data.reviewReadyAt),
      approvedForFutureUseAt: toDateString(data.approvedForFutureUseAt),
      suppressedAt: toDateString(data.suppressedAt),
      blockedAt: toDateString(data.blockedAt),
      voidedAt: toDateString(data.voidedAt),
    } as RecoveryAdminGovernanceReviewPacket;
  }
}

export class PrismaStudentClosureReflectionDraftRepository implements IStudentClosureReflectionDraftRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Partial<RecoveryStudentClosureReflectionDraft>): Promise<RecoveryStudentClosureReflectionDraft> {
    const created = await this.prisma.recoveryStudentClosureReflectionDraftRecord.create({ data: this.toPrisma(data) });
    return this.fromPrisma(created);
  }

  async getById(id: string): Promise<RecoveryStudentClosureReflectionDraft | null> {
    const found = await this.prisma.recoveryStudentClosureReflectionDraftRecord.findUnique({ where: { studentClosureReflectionDraftId: id } });
    return found ? this.fromPrisma(found) : null;
  }

  async listBySchool(schoolId: string): Promise<RecoveryStudentClosureReflectionDraft[]> {
    const records = await this.prisma.recoveryStudentClosureReflectionDraftRecord.findMany({ where: { schoolId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryStudentClosureReflectionDraft[]> {
    const records = await this.prisma.recoveryStudentClosureReflectionDraftRecord.findMany({ where: { schoolId, studentRef } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByPlanId(schoolId: string, resultRecoveryPlanId: string): Promise<RecoveryStudentClosureReflectionDraft[]> {
    const records = await this.prisma.recoveryStudentClosureReflectionDraftRecord.findMany({ where: { schoolId, resultRecoveryPlanId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listBySimulationRunId(simulationRunId: string): Promise<RecoveryStudentClosureReflectionDraft[]> {
    const records = await this.prisma.recoveryStudentClosureReflectionDraftRecord.findMany({ where: { recoveryOutcomeExecutionSimulationRunId: simulationRunId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByStatus(schoolId: string, draftStatus: string): Promise<RecoveryStudentClosureReflectionDraft[]> {
    const records = await this.prisma.recoveryStudentClosureReflectionDraftRecord.findMany({ where: { schoolId, draftStatus } });
    return records.map(r => this.fromPrisma(r));
  }

  async update(id: string, data: Partial<RecoveryStudentClosureReflectionDraft>): Promise<RecoveryStudentClosureReflectionDraft> {
    const updated = await this.prisma.recoveryStudentClosureReflectionDraftRecord.update({
      where: { studentClosureReflectionDraftId: id },
      data: this.toPrisma(data),
    });
    return this.fromPrisma(updated);
  }

  async updateStatus(id: string, status: string): Promise<RecoveryStudentClosureReflectionDraft> {
    return this.update(id, { draftStatus: status } as any);
  }

  async markReviewReady(id: string): Promise<RecoveryStudentClosureReflectionDraft> {
    return this.update(id, { draftStatus: 'review_ready', reviewReadyAt: new Date().toISOString() } as any);
  }

  async approveForFutureUse(id: string): Promise<RecoveryStudentClosureReflectionDraft> {
    return this.update(id, { draftStatus: 'approved_for_future_use', approvedForFutureUseAt: new Date().toISOString() } as any);
  }

  async suppress(id: string): Promise<RecoveryStudentClosureReflectionDraft> {
    return this.update(id, { draftStatus: 'suppressed', suppressedAt: new Date().toISOString() } as any);
  }

  async block(id: string): Promise<RecoveryStudentClosureReflectionDraft> {
    return this.update(id, { draftStatus: 'blocked', blockedAt: new Date().toISOString() } as any);
  }

  async void(id: string): Promise<RecoveryStudentClosureReflectionDraft> {
    return this.update(id, { draftStatus: 'voided', voidedAt: new Date().toISOString() } as any);
  }

  private toPrisma(data: any): any {
    const { ...rest } = data;
    return rest;
  }

  private fromPrisma(data: any): RecoveryStudentClosureReflectionDraft {
    return {
      ...data,
      reflectionContentJson: parseJsonField(data.reflectionContentJson),
      blockedReasonCodesJson: parseStringArray(data.blockedReasonCodesJson),
      sourceRefsJson: parseJsonField(data.sourceRefsJson),
      createdAt: toDateString(data.createdAt) || '',
      updatedAt: toDateString(data.updatedAt) || '',
      reviewReadyAt: toDateString(data.reviewReadyAt),
      approvedForFutureUseAt: toDateString(data.approvedForFutureUseAt),
      suppressedAt: toDateString(data.suppressedAt),
      blockedAt: toDateString(data.blockedAt),
      voidedAt: toDateString(data.voidedAt),
    } as RecoveryStudentClosureReflectionDraft;
  }
}

export class PrismaParentClosureGuidanceDraftRepository implements IParentClosureGuidanceDraftRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Partial<RecoveryParentClosureGuidanceDraft>): Promise<RecoveryParentClosureGuidanceDraft> {
    const created = await this.prisma.recoveryParentClosureGuidanceDraftRecord.create({ data: this.toPrisma(data) });
    return this.fromPrisma(created);
  }

  async getById(id: string): Promise<RecoveryParentClosureGuidanceDraft | null> {
    const found = await this.prisma.recoveryParentClosureGuidanceDraftRecord.findUnique({ where: { parentClosureGuidanceDraftId: id } });
    return found ? this.fromPrisma(found) : null;
  }

  async listBySchool(schoolId: string): Promise<RecoveryParentClosureGuidanceDraft[]> {
    const records = await this.prisma.recoveryParentClosureGuidanceDraftRecord.findMany({ where: { schoolId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryParentClosureGuidanceDraft[]> {
    const records = await this.prisma.recoveryParentClosureGuidanceDraftRecord.findMany({ where: { schoolId, studentRef } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByPlanId(schoolId: string, resultRecoveryPlanId: string): Promise<RecoveryParentClosureGuidanceDraft[]> {
    const records = await this.prisma.recoveryParentClosureGuidanceDraftRecord.findMany({ where: { schoolId, resultRecoveryPlanId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listBySimulationRunId(simulationRunId: string): Promise<RecoveryParentClosureGuidanceDraft[]> {
    const records = await this.prisma.recoveryParentClosureGuidanceDraftRecord.findMany({ where: { recoveryOutcomeExecutionSimulationRunId: simulationRunId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByStatus(schoolId: string, draftStatus: string): Promise<RecoveryParentClosureGuidanceDraft[]> {
    const records = await this.prisma.recoveryParentClosureGuidanceDraftRecord.findMany({ where: { schoolId, draftStatus } });
    return records.map(r => this.fromPrisma(r));
  }

  async update(id: string, data: Partial<RecoveryParentClosureGuidanceDraft>): Promise<RecoveryParentClosureGuidanceDraft> {
    const updated = await this.prisma.recoveryParentClosureGuidanceDraftRecord.update({
      where: { parentClosureGuidanceDraftId: id },
      data: this.toPrisma(data),
    });
    return this.fromPrisma(updated);
  }

  async updateStatus(id: string, status: string): Promise<RecoveryParentClosureGuidanceDraft> {
    return this.update(id, { draftStatus: status } as any);
  }

  async markReviewReady(id: string): Promise<RecoveryParentClosureGuidanceDraft> {
    return this.update(id, { draftStatus: 'review_ready', reviewReadyAt: new Date().toISOString() } as any);
  }

  async approveForFutureUse(id: string): Promise<RecoveryParentClosureGuidanceDraft> {
    return this.update(id, { draftStatus: 'approved_for_future_use', approvedForFutureUseAt: new Date().toISOString() } as any);
  }

  async suppress(id: string): Promise<RecoveryParentClosureGuidanceDraft> {
    return this.update(id, { draftStatus: 'suppressed', suppressedAt: new Date().toISOString() } as any);
  }

  async block(id: string): Promise<RecoveryParentClosureGuidanceDraft> {
    return this.update(id, { draftStatus: 'blocked', blockedAt: new Date().toISOString() } as any);
  }

  async void(id: string): Promise<RecoveryParentClosureGuidanceDraft> {
    return this.update(id, { draftStatus: 'voided', voidedAt: new Date().toISOString() } as any);
  }

  private toPrisma(data: any): any {
    const { ...rest } = data;
    return rest;
  }

  private fromPrisma(data: any): RecoveryParentClosureGuidanceDraft {
    return {
      ...data,
      guidanceContentJson: parseJsonField(data.guidanceContentJson),
      blockedReasonCodesJson: parseStringArray(data.blockedReasonCodesJson),
      sourceRefsJson: parseJsonField(data.sourceRefsJson),
      createdAt: toDateString(data.createdAt) || '',
      updatedAt: toDateString(data.updatedAt) || '',
      reviewReadyAt: toDateString(data.reviewReadyAt),
      approvedForFutureUseAt: toDateString(data.approvedForFutureUseAt),
      suppressedAt: toDateString(data.suppressedAt),
      blockedAt: toDateString(data.blockedAt),
      voidedAt: toDateString(data.voidedAt),
    } as RecoveryParentClosureGuidanceDraft;
  }
}

export class PrismaArchiveManifestRepository implements IArchiveManifestRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Partial<RecoveryArchiveManifest>): Promise<RecoveryArchiveManifest> {
    const created = await this.prisma.recoveryArchiveManifestRecord.create({ data: this.toPrisma(data) });
    return this.fromPrisma(created);
  }

  async getById(id: string): Promise<RecoveryArchiveManifest | null> {
    const found = await this.prisma.recoveryArchiveManifestRecord.findUnique({ where: { archiveManifestId: id } });
    return found ? this.fromPrisma(found) : null;
  }

  async listBySchool(schoolId: string): Promise<RecoveryArchiveManifest[]> {
    const records = await this.prisma.recoveryArchiveManifestRecord.findMany({ where: { schoolId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryArchiveManifest[]> {
    const records = await this.prisma.recoveryArchiveManifestRecord.findMany({ where: { schoolId, studentRef } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByPlanId(schoolId: string, resultRecoveryPlanId: string): Promise<RecoveryArchiveManifest[]> {
    const records = await this.prisma.recoveryArchiveManifestRecord.findMany({ where: { schoolId, resultRecoveryPlanId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByStatus(schoolId: string, manifestStatus: string): Promise<RecoveryArchiveManifest[]> {
    const records = await this.prisma.recoveryArchiveManifestRecord.findMany({ where: { schoolId, manifestStatus } });
    return records.map(r => this.fromPrisma(r));
  }

  async update(id: string, data: Partial<RecoveryArchiveManifest>): Promise<RecoveryArchiveManifest> {
    const updated = await this.prisma.recoveryArchiveManifestRecord.update({
      where: { archiveManifestId: id },
      data: this.toPrisma(data),
    });
    return this.fromPrisma(updated);
  }

  async updateStatus(id: string, status: string): Promise<RecoveryArchiveManifest> {
    return this.update(id, { manifestStatus: status } as any);
  }

  async markReviewReady(id: string): Promise<RecoveryArchiveManifest> {
    return this.update(id, { manifestStatus: 'review_ready', reviewReadyAt: new Date().toISOString() } as any);
  }

  async markArchiveReady(id: string): Promise<RecoveryArchiveManifest> {
    return this.update(id, { manifestStatus: 'archive_ready', archiveReadyAt: new Date().toISOString() } as any);
  }

  async approveForFutureUse(id: string): Promise<RecoveryArchiveManifest> {
    return this.update(id, { manifestStatus: 'approved_for_future_use', approvedForFutureUseAt: new Date().toISOString() } as any);
  }

  async suppress(id: string): Promise<RecoveryArchiveManifest> {
    return this.update(id, { manifestStatus: 'suppressed', suppressedAt: new Date().toISOString() } as any);
  }

  async block(id: string): Promise<RecoveryArchiveManifest> {
    return this.update(id, { manifestStatus: 'blocked', blockedAt: new Date().toISOString() } as any);
  }

  async void(id: string): Promise<RecoveryArchiveManifest> {
    return this.update(id, { manifestStatus: 'voided', voidedAt: new Date().toISOString() } as any);
  }

  private toPrisma(data: any): any {
    const { ...rest } = data;
    return rest;
  }

  private fromPrisma(data: any): RecoveryArchiveManifest {
    return {
      ...data,
      manifestContentsJson: parseJsonField(data.manifestContentsJson),
      recordCountsJson: parseJsonField(data.recordCountsJson),
      blockedReasonCodesJson: parseStringArray(data.blockedReasonCodesJson),
      sourceRefsJson: parseJsonField(data.sourceRefsJson),
      createdAt: toDateString(data.createdAt) || '',
      updatedAt: toDateString(data.updatedAt) || '',
      reviewReadyAt: toDateString(data.reviewReadyAt),
      archiveReadyAt: toDateString(data.archiveReadyAt),
      approvedForFutureUseAt: toDateString(data.approvedForFutureUseAt),
      suppressedAt: toDateString(data.suppressedAt),
      blockedAt: toDateString(data.blockedAt),
      voidedAt: toDateString(data.voidedAt),
    } as RecoveryArchiveManifest;
  }
}

export class PrismaFinalLifecycleSummaryRepository implements IFinalLifecycleSummaryRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Partial<RecoveryFinalLifecycleSummary>): Promise<RecoveryFinalLifecycleSummary> {
    const created = await this.prisma.recoveryFinalLifecycleSummaryRecord.create({ data: this.toPrisma(data) });
    return this.fromPrisma(created);
  }

  async getById(id: string): Promise<RecoveryFinalLifecycleSummary | null> {
    const found = await this.prisma.recoveryFinalLifecycleSummaryRecord.findUnique({ where: { finalLifecycleSummaryId: id } });
    return found ? this.fromPrisma(found) : null;
  }

  async listBySchool(schoolId: string): Promise<RecoveryFinalLifecycleSummary[]> {
    const records = await this.prisma.recoveryFinalLifecycleSummaryRecord.findMany({ where: { schoolId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryFinalLifecycleSummary[]> {
    const records = await this.prisma.recoveryFinalLifecycleSummaryRecord.findMany({ where: { schoolId, studentRef } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByPlanId(schoolId: string, resultRecoveryPlanId: string): Promise<RecoveryFinalLifecycleSummary[]> {
    const records = await this.prisma.recoveryFinalLifecycleSummaryRecord.findMany({ where: { schoolId, resultRecoveryPlanId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listBySimulationSummaryId(simulationSummaryId: string): Promise<RecoveryFinalLifecycleSummary[]> {
    const records = await this.prisma.recoveryFinalLifecycleSummaryRecord.findMany({ where: { recoveryOutcomeExecutionSimulationSummaryId: simulationSummaryId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByStatus(schoolId: string, summaryStatus: string): Promise<RecoveryFinalLifecycleSummary[]> {
    const records = await this.prisma.recoveryFinalLifecycleSummaryRecord.findMany({ where: { schoolId, summaryStatus } });
    return records.map(r => this.fromPrisma(r));
  }

  async update(id: string, data: Partial<RecoveryFinalLifecycleSummary>): Promise<RecoveryFinalLifecycleSummary> {
    const updated = await this.prisma.recoveryFinalLifecycleSummaryRecord.update({
      where: { finalLifecycleSummaryId: id },
      data: this.toPrisma(data),
    });
    return this.fromPrisma(updated);
  }

  async updateStatus(id: string, status: string): Promise<RecoveryFinalLifecycleSummary> {
    return this.update(id, { summaryStatus: status } as any);
  }

  async markReviewReady(id: string): Promise<RecoveryFinalLifecycleSummary> {
    return this.update(id, { summaryStatus: 'review_ready', reviewReadyAt: new Date().toISOString() } as any);
  }

  async approveForFutureUse(id: string): Promise<RecoveryFinalLifecycleSummary> {
    return this.update(id, { summaryStatus: 'approved_for_future_use', approvedForFutureUseAt: new Date().toISOString() } as any);
  }

  async refresh(id: string): Promise<RecoveryFinalLifecycleSummary> {
    const existing = await this.prisma.recoveryFinalLifecycleSummaryRecord.findUnique({ where: { finalLifecycleSummaryId: id } });
    if (!existing) throw new Error(`FinalLifecycleSummary ${id} not found`);
    const updated = await this.prisma.recoveryFinalLifecycleSummaryRecord.update({
      where: { finalLifecycleSummaryId: id },
      data: { summaryStatus: 'active', refreshedAt: new Date(), updatedAt: new Date() } as any,
    });
    return this.fromPrisma(updated);
  }

  async markStale(id: string): Promise<RecoveryFinalLifecycleSummary> {
    return this.update(id, { summaryStatus: 'stale', staleAt: new Date().toISOString() } as any);
  }

  async block(id: string): Promise<RecoveryFinalLifecycleSummary> {
    return this.update(id, { summaryStatus: 'blocked', blockedAt: new Date().toISOString() } as any);
  }

  async void(id: string): Promise<RecoveryFinalLifecycleSummary> {
    return this.update(id, { summaryStatus: 'voided', voidedAt: new Date().toISOString() } as any);
  }

  private toPrisma(data: any): any {
    const { ...rest } = data;
    return rest;
  }

  private fromPrisma(data: any): RecoveryFinalLifecycleSummary {
    return {
      ...data,
      lifecycleOverviewJson: parseJsonField(data.lifecycleOverviewJson),
      outcomesJson: parseJsonField(data.outcomesJson),
      nextStepsJson: parseJsonField(data.nextStepsJson),
      blockedReasonCodesJson: parseStringArray(data.blockedReasonCodesJson),
      sourceRefsJson: parseJsonField(data.sourceRefsJson),
      createdAt: toDateString(data.createdAt) || '',
      updatedAt: toDateString(data.updatedAt) || '',
      refreshedAt: toDateString(data.refreshedAt),
      staleAt: toDateString(data.staleAt),
      reviewReadyAt: toDateString(data.reviewReadyAt),
      approvedForFutureUseAt: toDateString(data.approvedForFutureUseAt),
      blockedAt: toDateString(data.blockedAt),
      voidedAt: toDateString(data.voidedAt),
    } as RecoveryFinalLifecycleSummary;
  }
}

export class PrismaClosureAuditRepository implements IClosureAuditRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Partial<RecoveryLifecycleClosureAuditRecord>): Promise<RecoveryLifecycleClosureAuditRecord> {
    const created = await this.prisma.recoveryLifecycleClosureAuditRecord.create({ data: this.toPrisma(data) });
    return this.fromPrisma(created);
  }

  async listBySchool(schoolId: string): Promise<RecoveryLifecycleClosureAuditRecord[]> {
    const records = await this.prisma.recoveryLifecycleClosureAuditRecord.findMany({ where: { schoolId } });
    return records.map(r => this.fromPrisma(r));
  }

  private toPrisma(data: any): any {
    const { ...rest } = data;
    return rest;
  }

  private fromPrisma(data: any): RecoveryLifecycleClosureAuditRecord {
    return {
      ...data,
      reasonCodesJson: parseJsonField(data.reasonCodesJson),
      metadataJson: parseJsonField(data.metadataJson),
      createdAt: toDateString(data.createdAt) || '',
    } as RecoveryLifecycleClosureAuditRecord;
  }
}

export class PrismaClosureIdempotencyRepository implements IClosureIdempotencyRepository {
  constructor(private prisma: PrismaClient) {}

  async findByIdempotencyKey(
    schoolId: string,
    operation: string,
    idempotencyKey: string
  ): Promise<RecoveryLifecycleClosureIdempotencyRecord | null> {
    const found = await this.prisma.recoveryLifecycleClosureIdempotencyRecord.findFirst({
      where: { schoolId, operation, idempotencyKey },
    });
    return found ? this.fromPrisma(found) : null;
  }

  async create(data: Partial<RecoveryLifecycleClosureIdempotencyRecord>): Promise<RecoveryLifecycleClosureIdempotencyRecord> {
    const created = await this.prisma.recoveryLifecycleClosureIdempotencyRecord.create({ data: this.toPrisma(data) });
    return this.fromPrisma(created);
  }

  async markCompleted(id: string, resourceType: string, resourceId: string, safeResultSummary: string): Promise<RecoveryLifecycleClosureIdempotencyRecord> {
    const updated = await this.prisma.recoveryLifecycleClosureIdempotencyRecord.update({
      where: { closureIdempotencyId: id },
      data: { status: 'completed', resourceType, resourceId, safeResultSummary } as any,
    });
    return this.fromPrisma(updated);
  }

  async markFailed(id: string, safeResultSummary: string): Promise<RecoveryLifecycleClosureIdempotencyRecord> {
    const updated = await this.prisma.recoveryLifecycleClosureIdempotencyRecord.update({
      where: { closureIdempotencyId: id },
      data: { status: 'failed', safeResultSummary } as any,
    });
    return this.fromPrisma(updated);
  }

  private toPrisma(data: any): any {
    const { ...rest } = data;
    return rest;
  }

  private fromPrisma(data: any): RecoveryLifecycleClosureIdempotencyRecord {
    return {
      ...data,
      createdAt: toDateString(data.createdAt) || '',
      updatedAt: toDateString(data.updatedAt) || '',
      expiresAt: toDateString(data.expiresAt),
    } as RecoveryLifecycleClosureIdempotencyRecord;
  }
}

export class PrismaRecoveryLifecycleClosureRepositories implements IRecoveryLifecycleClosureRepositories {
  constructor(private prisma: PrismaClient) {}

  closureReadiness = new PrismaClosureReadinessRepository(this.prisma);
  handoffPacket = new PrismaHandoffPacketRepository(this.prisma);
  nextCycleRecommendationDraft = new PrismaNextCycleRecommendationDraftRepository(this.prisma);
  deferredIntegrationTicket = new PrismaDeferredIntegrationTicketRepository(this.prisma);
  unresolvedRiskRegister = new PrismaUnresolvedRiskRegisterRepository(this.prisma);
  teacherClosureReviewPacket = new PrismaTeacherClosureReviewPacketRepository(this.prisma);
  adminGovernanceReviewPacket = new PrismaAdminGovernanceReviewPacketRepository(this.prisma);
  studentClosureReflectionDraft = new PrismaStudentClosureReflectionDraftRepository(this.prisma);
  parentClosureGuidanceDraft = new PrismaParentClosureGuidanceDraftRepository(this.prisma);
  archiveManifest = new PrismaArchiveManifestRepository(this.prisma);
  finalLifecycleSummary = new PrismaFinalLifecycleSummaryRepository(this.prisma);
  closureAudit = new PrismaClosureAuditRepository(this.prisma);
  closureIdempotency = new PrismaClosureIdempotencyRepository(this.prisma);
}
