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
import { v4 as uuid } from 'uuid';

export class InMemoryClosureReadinessRepository implements IClosureReadinessRepository {
  private store = new Map<string, RecoveryLifecycleClosureReadiness>();

  async create(data: Partial<RecoveryLifecycleClosureReadiness>): Promise<RecoveryLifecycleClosureReadiness> {
    const record: RecoveryLifecycleClosureReadiness = {
      ...data as RecoveryLifecycleClosureReadiness,
      closureReadinessId: data.closureReadinessId || uuid(),
    };
    this.store.set(record.closureReadinessId, record);
    return record;
  }

  async getById(id: string): Promise<RecoveryLifecycleClosureReadiness | null> {
    return this.store.get(id) ?? null;
  }

  async listBySchool(schoolId: string): Promise<RecoveryLifecycleClosureReadiness[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryLifecycleClosureReadiness[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.studentRef === studentRef);
  }

  async listByPlanId(schoolId: string, resultRecoveryPlanId: string): Promise<RecoveryLifecycleClosureReadiness[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultRecoveryPlanId === resultRecoveryPlanId);
  }

  async listBySimulationReadinessId(schoolId: string, simulationReadinessId: string): Promise<RecoveryLifecycleClosureReadiness[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.recoveryOutcomeExecutionSimulationReadinessId === simulationReadinessId);
  }

  async listBySimulationPlanId(schoolId: string, simulationPlanId: string): Promise<RecoveryLifecycleClosureReadiness[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.recoveryOutcomeExecutionSimulationPlanId === simulationPlanId);
  }

  async listBySimulationRunId(simulationRunId: string): Promise<RecoveryLifecycleClosureReadiness[]> {
    return Array.from(this.store.values()).filter(r => r.recoveryOutcomeExecutionSimulationRunId === simulationRunId);
  }

  async listBySimulationResultId(simulationResultId: string): Promise<RecoveryLifecycleClosureReadiness[]> {
    return Array.from(this.store.values()).filter(r => r.recoveryOutcomeExecutionSimulationResultId === simulationResultId);
  }

  async listBySimulationSummaryId(simulationSummaryId: string): Promise<RecoveryLifecycleClosureReadiness[]> {
    return Array.from(this.store.values()).filter(r => r.recoveryOutcomeExecutionSimulationSummaryId === simulationSummaryId);
  }

  async listByStatus(schoolId: string, closureReadinessStatus: string): Promise<RecoveryLifecycleClosureReadiness[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.closureReadinessStatus === closureReadinessStatus);
  }

  async update(id: string, data: Partial<RecoveryLifecycleClosureReadiness>): Promise<RecoveryLifecycleClosureReadiness> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`ClosureReadiness ${id} not found`);
    const updated: RecoveryLifecycleClosureReadiness = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
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
}

export class InMemoryHandoffPacketRepository implements IHandoffPacketRepository {
  private store = new Map<string, RecoveryPostSimulationHandoffPacket>();

  async create(data: Partial<RecoveryPostSimulationHandoffPacket>): Promise<RecoveryPostSimulationHandoffPacket> {
    const record: RecoveryPostSimulationHandoffPacket = {
      ...data as RecoveryPostSimulationHandoffPacket,
      handoffPacketId: data.handoffPacketId || uuid(),
    };
    this.store.set(record.handoffPacketId, record);
    return record;
  }

  async getById(id: string): Promise<RecoveryPostSimulationHandoffPacket | null> {
    return this.store.get(id) ?? null;
  }

  async listBySchool(schoolId: string): Promise<RecoveryPostSimulationHandoffPacket[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryPostSimulationHandoffPacket[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.studentRef === studentRef);
  }

  async listByPlanId(schoolId: string, resultRecoveryPlanId: string): Promise<RecoveryPostSimulationHandoffPacket[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultRecoveryPlanId === resultRecoveryPlanId);
  }

  async listBySimulationRunId(simulationRunId: string): Promise<RecoveryPostSimulationHandoffPacket[]> {
    return Array.from(this.store.values()).filter(r => r.recoveryOutcomeExecutionSimulationRunId === simulationRunId);
  }

  async listBySimulationResultId(simulationResultId: string): Promise<RecoveryPostSimulationHandoffPacket[]> {
    return Array.from(this.store.values()).filter(r => r.recoveryOutcomeExecutionSimulationResultId === simulationResultId);
  }

  async listByActionBundleId(bundleId: string): Promise<RecoveryPostSimulationHandoffPacket[]> {
    return Array.from(this.store.values()).filter(r => r.recoveryOutcomeActionBundleId === bundleId);
  }

  async listByStatus(schoolId: string, handoffStatus: string): Promise<RecoveryPostSimulationHandoffPacket[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.handoffStatus === handoffStatus);
  }

  async update(id: string, data: Partial<RecoveryPostSimulationHandoffPacket>): Promise<RecoveryPostSimulationHandoffPacket> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`HandoffPacket ${id} not found`);
    const updated: RecoveryPostSimulationHandoffPacket = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
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
}

export class InMemoryNextCycleRecommendationDraftRepository implements INextCycleRecommendationRepository {
  private store = new Map<string, RecoveryNextCycleRecommendationDraft>();

  async create(data: Partial<RecoveryNextCycleRecommendationDraft>): Promise<RecoveryNextCycleRecommendationDraft> {
    const record: RecoveryNextCycleRecommendationDraft = {
      ...data as RecoveryNextCycleRecommendationDraft,
      nextCycleRecommendationId: data.nextCycleRecommendationId || uuid(),
    };
    this.store.set(record.nextCycleRecommendationId, record);
    return record;
  }

  async getById(id: string): Promise<RecoveryNextCycleRecommendationDraft | null> {
    return this.store.get(id) ?? null;
  }

  async listBySchool(schoolId: string): Promise<RecoveryNextCycleRecommendationDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryNextCycleRecommendationDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.studentRef === studentRef);
  }

  async listByPlanId(schoolId: string, resultRecoveryPlanId: string): Promise<RecoveryNextCycleRecommendationDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultRecoveryPlanId === resultRecoveryPlanId);
  }

  async listBySimulationSummaryId(simulationSummaryId: string): Promise<RecoveryNextCycleRecommendationDraft[]> {
    return Array.from(this.store.values()).filter(r => r.recoveryOutcomeExecutionSimulationSummaryId === simulationSummaryId);
  }

  async listByType(schoolId: string, recommendationType: string): Promise<RecoveryNextCycleRecommendationDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.recommendationType === recommendationType);
  }

  async listByStatus(schoolId: string, recommendationStatus: string): Promise<RecoveryNextCycleRecommendationDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.recommendationStatus === recommendationStatus);
  }

  async update(id: string, data: Partial<RecoveryNextCycleRecommendationDraft>): Promise<RecoveryNextCycleRecommendationDraft> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`NextCycleRecommendationDraft ${id} not found`);
    const updated: RecoveryNextCycleRecommendationDraft = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
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
}

export class InMemoryDeferredIntegrationTicketRepository implements IDeferredIntegrationTicketRepository {
  private store = new Map<string, RecoveryDeferredIntegrationTicket>();

  async create(data: Partial<RecoveryDeferredIntegrationTicket>): Promise<RecoveryDeferredIntegrationTicket> {
    const record: RecoveryDeferredIntegrationTicket = {
      ...data as RecoveryDeferredIntegrationTicket,
      deferredIntegrationTicketId: data.deferredIntegrationTicketId || uuid(),
    };
    this.store.set(record.deferredIntegrationTicketId, record);
    return record;
  }

  async getById(id: string): Promise<RecoveryDeferredIntegrationTicket | null> {
    return this.store.get(id) ?? null;
  }

  async listBySchool(schoolId: string): Promise<RecoveryDeferredIntegrationTicket[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByPlanId(schoolId: string, resultRecoveryPlanId: string): Promise<RecoveryDeferredIntegrationTicket[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultRecoveryPlanId === resultRecoveryPlanId);
  }

  async listByType(schoolId: string, ticketType: string): Promise<RecoveryDeferredIntegrationTicket[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.ticketType === ticketType);
  }

  async listByStatus(schoolId: string, ticketStatus: string): Promise<RecoveryDeferredIntegrationTicket[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.ticketStatus === ticketStatus);
  }

  async update(id: string, data: Partial<RecoveryDeferredIntegrationTicket>): Promise<RecoveryDeferredIntegrationTicket> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`DeferredIntegrationTicket ${id} not found`);
    const updated: RecoveryDeferredIntegrationTicket = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
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
}

export class InMemoryUnresolvedRiskRegisterRepository implements IUnresolvedRiskRegisterRepository {
  private store = new Map<string, RecoveryUnresolvedRiskRegister>();

  async create(data: Partial<RecoveryUnresolvedRiskRegister>): Promise<RecoveryUnresolvedRiskRegister> {
    const record: RecoveryUnresolvedRiskRegister = {
      ...data as RecoveryUnresolvedRiskRegister,
      unresolvedRiskRegisterId: data.unresolvedRiskRegisterId || uuid(),
    };
    this.store.set(record.unresolvedRiskRegisterId, record);
    return record;
  }

  async getById(id: string): Promise<RecoveryUnresolvedRiskRegister | null> {
    return this.store.get(id) ?? null;
  }

  async listBySchool(schoolId: string): Promise<RecoveryUnresolvedRiskRegister[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByPlanId(schoolId: string, resultRecoveryPlanId: string): Promise<RecoveryUnresolvedRiskRegister[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultRecoveryPlanId === resultRecoveryPlanId);
  }

  async listByRiskLevel(schoolId: string, riskLevel: string): Promise<RecoveryUnresolvedRiskRegister[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.riskLevel === riskLevel);
  }

  async listByStatus(schoolId: string, riskStatus: string): Promise<RecoveryUnresolvedRiskRegister[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.riskStatus === riskStatus);
  }

  async update(id: string, data: Partial<RecoveryUnresolvedRiskRegister>): Promise<RecoveryUnresolvedRiskRegister> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`UnresolvedRiskRegister ${id} not found`);
    const updated: RecoveryUnresolvedRiskRegister = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
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
}

export class InMemoryTeacherClosureReviewPacketRepository implements ITeacherClosureReviewPacketRepository {
  private store = new Map<string, RecoveryTeacherClosureReviewPacket>();

  async create(data: Partial<RecoveryTeacherClosureReviewPacket>): Promise<RecoveryTeacherClosureReviewPacket> {
    const record: RecoveryTeacherClosureReviewPacket = {
      ...data as RecoveryTeacherClosureReviewPacket,
      teacherClosureReviewPacketId: data.teacherClosureReviewPacketId || uuid(),
    };
    this.store.set(record.teacherClosureReviewPacketId, record);
    return record;
  }

  async getById(id: string): Promise<RecoveryTeacherClosureReviewPacket | null> {
    return this.store.get(id) ?? null;
  }

  async listBySchool(schoolId: string): Promise<RecoveryTeacherClosureReviewPacket[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryTeacherClosureReviewPacket[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.studentRef === studentRef);
  }

  async listByPlanId(schoolId: string, resultRecoveryPlanId: string): Promise<RecoveryTeacherClosureReviewPacket[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultRecoveryPlanId === resultRecoveryPlanId);
  }

  async listBySimulationSummaryId(simulationSummaryId: string): Promise<RecoveryTeacherClosureReviewPacket[]> {
    return Array.from(this.store.values()).filter(r => r.recoveryOutcomeExecutionSimulationSummaryId === simulationSummaryId);
  }

  async listByTeacherRef(schoolId: string, teacherRef: string): Promise<RecoveryTeacherClosureReviewPacket[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.teacherRef === teacherRef);
  }

  async listByStatus(schoolId: string, reviewStatus: string): Promise<RecoveryTeacherClosureReviewPacket[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.reviewStatus === reviewStatus);
  }

  async update(id: string, data: Partial<RecoveryTeacherClosureReviewPacket>): Promise<RecoveryTeacherClosureReviewPacket> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`TeacherClosureReviewPacket ${id} not found`);
    const updated: RecoveryTeacherClosureReviewPacket = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
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
}

export class InMemoryAdminGovernanceReviewPacketRepository implements IAdminGovernanceReviewPacketRepository {
  private store = new Map<string, RecoveryAdminGovernanceReviewPacket>();

  async create(data: Partial<RecoveryAdminGovernanceReviewPacket>): Promise<RecoveryAdminGovernanceReviewPacket> {
    const record: RecoveryAdminGovernanceReviewPacket = {
      ...data as RecoveryAdminGovernanceReviewPacket,
      adminGovernanceReviewPacketId: data.adminGovernanceReviewPacketId || uuid(),
    };
    this.store.set(record.adminGovernanceReviewPacketId, record);
    return record;
  }

  async getById(id: string): Promise<RecoveryAdminGovernanceReviewPacket | null> {
    return this.store.get(id) ?? null;
  }

  async listBySchool(schoolId: string): Promise<RecoveryAdminGovernanceReviewPacket[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryAdminGovernanceReviewPacket[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.studentRef === studentRef);
  }

  async listByPlanId(schoolId: string, resultRecoveryPlanId: string): Promise<RecoveryAdminGovernanceReviewPacket[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultRecoveryPlanId === resultRecoveryPlanId);
  }

  async listBySimulationSummaryId(simulationSummaryId: string): Promise<RecoveryAdminGovernanceReviewPacket[]> {
    return Array.from(this.store.values()).filter(r => r.recoveryOutcomeExecutionSimulationSummaryId === simulationSummaryId);
  }

  async listByAdminRef(schoolId: string, adminRef: string): Promise<RecoveryAdminGovernanceReviewPacket[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.adminRef === adminRef);
  }

  async listByStatus(schoolId: string, reviewStatus: string): Promise<RecoveryAdminGovernanceReviewPacket[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.reviewStatus === reviewStatus);
  }

  async update(id: string, data: Partial<RecoveryAdminGovernanceReviewPacket>): Promise<RecoveryAdminGovernanceReviewPacket> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`AdminGovernanceReviewPacket ${id} not found`);
    const updated: RecoveryAdminGovernanceReviewPacket = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
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
}

export class InMemoryStudentClosureReflectionDraftRepository implements IStudentClosureReflectionDraftRepository {
  private store = new Map<string, RecoveryStudentClosureReflectionDraft>();

  async create(data: Partial<RecoveryStudentClosureReflectionDraft>): Promise<RecoveryStudentClosureReflectionDraft> {
    const record: RecoveryStudentClosureReflectionDraft = {
      ...data as RecoveryStudentClosureReflectionDraft,
      studentClosureReflectionDraftId: data.studentClosureReflectionDraftId || uuid(),
    };
    this.store.set(record.studentClosureReflectionDraftId, record);
    return record;
  }

  async getById(id: string): Promise<RecoveryStudentClosureReflectionDraft | null> {
    return this.store.get(id) ?? null;
  }

  async listBySchool(schoolId: string): Promise<RecoveryStudentClosureReflectionDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryStudentClosureReflectionDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.studentRef === studentRef);
  }

  async listByPlanId(schoolId: string, resultRecoveryPlanId: string): Promise<RecoveryStudentClosureReflectionDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultRecoveryPlanId === resultRecoveryPlanId);
  }

  async listBySimulationRunId(simulationRunId: string): Promise<RecoveryStudentClosureReflectionDraft[]> {
    return Array.from(this.store.values()).filter(r => r.recoveryOutcomeExecutionSimulationRunId === simulationRunId);
  }

  async listByStatus(schoolId: string, draftStatus: string): Promise<RecoveryStudentClosureReflectionDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.draftStatus === draftStatus);
  }

  async update(id: string, data: Partial<RecoveryStudentClosureReflectionDraft>): Promise<RecoveryStudentClosureReflectionDraft> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`StudentClosureReflectionDraft ${id} not found`);
    const updated: RecoveryStudentClosureReflectionDraft = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
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
}

export class InMemoryParentClosureGuidanceDraftRepository implements IParentClosureGuidanceDraftRepository {
  private store = new Map<string, RecoveryParentClosureGuidanceDraft>();

  async create(data: Partial<RecoveryParentClosureGuidanceDraft>): Promise<RecoveryParentClosureGuidanceDraft> {
    const record: RecoveryParentClosureGuidanceDraft = {
      ...data as RecoveryParentClosureGuidanceDraft,
      parentClosureGuidanceDraftId: data.parentClosureGuidanceDraftId || uuid(),
    };
    this.store.set(record.parentClosureGuidanceDraftId, record);
    return record;
  }

  async getById(id: string): Promise<RecoveryParentClosureGuidanceDraft | null> {
    return this.store.get(id) ?? null;
  }

  async listBySchool(schoolId: string): Promise<RecoveryParentClosureGuidanceDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryParentClosureGuidanceDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.studentRef === studentRef);
  }

  async listByPlanId(schoolId: string, resultRecoveryPlanId: string): Promise<RecoveryParentClosureGuidanceDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultRecoveryPlanId === resultRecoveryPlanId);
  }

  async listBySimulationRunId(simulationRunId: string): Promise<RecoveryParentClosureGuidanceDraft[]> {
    return Array.from(this.store.values()).filter(r => r.recoveryOutcomeExecutionSimulationRunId === simulationRunId);
  }

  async listByStatus(schoolId: string, draftStatus: string): Promise<RecoveryParentClosureGuidanceDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.draftStatus === draftStatus);
  }

  async update(id: string, data: Partial<RecoveryParentClosureGuidanceDraft>): Promise<RecoveryParentClosureGuidanceDraft> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`ParentClosureGuidanceDraft ${id} not found`);
    const updated: RecoveryParentClosureGuidanceDraft = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
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
}

export class InMemoryArchiveManifestRepository implements IArchiveManifestRepository {
  private store = new Map<string, RecoveryArchiveManifest>();

  async create(data: Partial<RecoveryArchiveManifest>): Promise<RecoveryArchiveManifest> {
    const record: RecoveryArchiveManifest = {
      ...data as RecoveryArchiveManifest,
      archiveManifestId: data.archiveManifestId || uuid(),
    };
    this.store.set(record.archiveManifestId, record);
    return record;
  }

  async getById(id: string): Promise<RecoveryArchiveManifest | null> {
    return this.store.get(id) ?? null;
  }

  async listBySchool(schoolId: string): Promise<RecoveryArchiveManifest[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryArchiveManifest[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.studentRef === studentRef);
  }

  async listByPlanId(schoolId: string, resultRecoveryPlanId: string): Promise<RecoveryArchiveManifest[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultRecoveryPlanId === resultRecoveryPlanId);
  }

  async listByStatus(schoolId: string, manifestStatus: string): Promise<RecoveryArchiveManifest[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.manifestStatus === manifestStatus);
  }

  async update(id: string, data: Partial<RecoveryArchiveManifest>): Promise<RecoveryArchiveManifest> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`ArchiveManifest ${id} not found`);
    const updated: RecoveryArchiveManifest = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
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
}

export class InMemoryFinalLifecycleSummaryRepository implements IFinalLifecycleSummaryRepository {
  private store = new Map<string, RecoveryFinalLifecycleSummary>();

  async create(data: Partial<RecoveryFinalLifecycleSummary>): Promise<RecoveryFinalLifecycleSummary> {
    const record: RecoveryFinalLifecycleSummary = {
      ...data as RecoveryFinalLifecycleSummary,
      finalLifecycleSummaryId: data.finalLifecycleSummaryId || uuid(),
    };
    this.store.set(record.finalLifecycleSummaryId, record);
    return record;
  }

  async getById(id: string): Promise<RecoveryFinalLifecycleSummary | null> {
    return this.store.get(id) ?? null;
  }

  async listBySchool(schoolId: string): Promise<RecoveryFinalLifecycleSummary[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryFinalLifecycleSummary[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.studentRef === studentRef);
  }

  async listByPlanId(schoolId: string, resultRecoveryPlanId: string): Promise<RecoveryFinalLifecycleSummary[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultRecoveryPlanId === resultRecoveryPlanId);
  }

  async listBySimulationSummaryId(simulationSummaryId: string): Promise<RecoveryFinalLifecycleSummary[]> {
    return Array.from(this.store.values()).filter(r => r.recoveryOutcomeExecutionSimulationSummaryId === simulationSummaryId);
  }

  async listByStatus(schoolId: string, summaryStatus: string): Promise<RecoveryFinalLifecycleSummary[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.summaryStatus === summaryStatus);
  }

  async update(id: string, data: Partial<RecoveryFinalLifecycleSummary>): Promise<RecoveryFinalLifecycleSummary> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`FinalLifecycleSummary ${id} not found`);
    const updated: RecoveryFinalLifecycleSummary = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
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
    const existing = this.store.get(id);
    if (!existing) throw new Error(`FinalLifecycleSummary ${id} not found`);
    const updated: RecoveryFinalLifecycleSummary = {
      ...existing,
      summaryStatus: 'active' as any,
      refreshedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.store.set(id, updated);
    return updated;
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
}

export class InMemoryClosureAuditRepository implements IClosureAuditRepository {
  private store = new Map<string, RecoveryLifecycleClosureAuditRecord>();

  async create(data: Partial<RecoveryLifecycleClosureAuditRecord>): Promise<RecoveryLifecycleClosureAuditRecord> {
    const record: RecoveryLifecycleClosureAuditRecord = {
      ...data as RecoveryLifecycleClosureAuditRecord,
      closureAuditEventId: data.closureAuditEventId || uuid(),
    };
    this.store.set(record.closureAuditEventId, record);
    return record;
  }

  async listBySchool(schoolId: string): Promise<RecoveryLifecycleClosureAuditRecord[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }
}

export class InMemoryClosureIdempotencyRepository implements IClosureIdempotencyRepository {
  private store = new Map<string, RecoveryLifecycleClosureIdempotencyRecord>();

  async findByIdempotencyKey(
    schoolId: string,
    operation: string,
    idempotencyKey: string
  ): Promise<RecoveryLifecycleClosureIdempotencyRecord | null> {
    return Array.from(this.store.values())
      .find(r => r.schoolId === schoolId && r.operation === operation && r.idempotencyKey === idempotencyKey) ?? null;
  }

  async create(data: Partial<RecoveryLifecycleClosureIdempotencyRecord>): Promise<RecoveryLifecycleClosureIdempotencyRecord> {
    const record: RecoveryLifecycleClosureIdempotencyRecord = {
      ...data as RecoveryLifecycleClosureIdempotencyRecord,
      closureIdempotencyId: data.closureIdempotencyId || uuid(),
    };
    this.store.set(record.closureIdempotencyId, record);
    return record;
  }

  async markCompleted(id: string, resourceType: string, resourceId: string, safeResultSummary: string): Promise<RecoveryLifecycleClosureIdempotencyRecord> {
    return this.update(id, { status: 'completed', resourceType, resourceId, safeResultSummary } as any);
  }

  async markFailed(id: string, safeResultSummary: string): Promise<RecoveryLifecycleClosureIdempotencyRecord> {
    return this.update(id, { status: 'failed', safeResultSummary } as any);
  }

  private async update(id: string, data: Partial<RecoveryLifecycleClosureIdempotencyRecord>): Promise<RecoveryLifecycleClosureIdempotencyRecord> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`ClosureIdempotencyRecord ${id} not found`);
    const updated: RecoveryLifecycleClosureIdempotencyRecord = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
  }
}

export class InMemoryRecoveryLifecycleClosureRepositories implements IRecoveryLifecycleClosureRepositories {
  closureReadiness: InMemoryClosureReadinessRepository;
  handoffPacket: InMemoryHandoffPacketRepository;
  nextCycleRecommendationDraft: InMemoryNextCycleRecommendationDraftRepository;
  deferredIntegrationTicket: InMemoryDeferredIntegrationTicketRepository;
  unresolvedRiskRegister: InMemoryUnresolvedRiskRegisterRepository;
  teacherClosureReviewPacket: InMemoryTeacherClosureReviewPacketRepository;
  adminGovernanceReviewPacket: InMemoryAdminGovernanceReviewPacketRepository;
  studentClosureReflectionDraft: InMemoryStudentClosureReflectionDraftRepository;
  parentClosureGuidanceDraft: InMemoryParentClosureGuidanceDraftRepository;
  archiveManifest: InMemoryArchiveManifestRepository;
  finalLifecycleSummary: InMemoryFinalLifecycleSummaryRepository;
  closureAudit: InMemoryClosureAuditRepository;
  closureIdempotency: InMemoryClosureIdempotencyRepository;

  constructor() {
    this.closureReadiness = new InMemoryClosureReadinessRepository();
    this.handoffPacket = new InMemoryHandoffPacketRepository();
    this.nextCycleRecommendationDraft = new InMemoryNextCycleRecommendationDraftRepository();
    this.deferredIntegrationTicket = new InMemoryDeferredIntegrationTicketRepository();
    this.unresolvedRiskRegister = new InMemoryUnresolvedRiskRegisterRepository();
    this.teacherClosureReviewPacket = new InMemoryTeacherClosureReviewPacketRepository();
    this.adminGovernanceReviewPacket = new InMemoryAdminGovernanceReviewPacketRepository();
    this.studentClosureReflectionDraft = new InMemoryStudentClosureReflectionDraftRepository();
    this.parentClosureGuidanceDraft = new InMemoryParentClosureGuidanceDraftRepository();
    this.archiveManifest = new InMemoryArchiveManifestRepository();
    this.finalLifecycleSummary = new InMemoryFinalLifecycleSummaryRepository();
    this.closureAudit = new InMemoryClosureAuditRepository();
    this.closureIdempotency = new InMemoryClosureIdempotencyRepository();
  }
}
