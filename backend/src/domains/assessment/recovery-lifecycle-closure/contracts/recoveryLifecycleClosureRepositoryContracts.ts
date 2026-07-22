import { RecoveryLifecycleClosureReadiness } from './recoveryLifecycleClosureReadinessContracts';
import { RecoveryPostSimulationHandoffPacket } from './recoveryPostSimulationHandoffPacketContracts';
import { RecoveryNextCycleRecommendationDraft } from './recoveryNextCycleRecommendationContracts';
import { RecoveryDeferredIntegrationTicket } from './recoveryDeferredIntegrationTicketContracts';
import { RecoveryUnresolvedRiskRegister } from './recoveryUnresolvedRiskRegisterContracts';
import { RecoveryTeacherClosureReviewPacket, RecoveryAdminGovernanceReviewPacket } from './recoveryClosureReviewPacketContracts';
import { RecoveryStudentClosureReflectionDraft, RecoveryParentClosureGuidanceDraft } from './recoveryStakeholderClosureDraftContracts';
import { RecoveryArchiveManifest } from './recoveryArchiveManifestContracts';
import { RecoveryFinalLifecycleSummary } from './recoveryFinalLifecycleSummaryContracts';
import { RecoveryLifecycleClosureSafeEnvelope } from './recoveryLifecycleClosureContracts';

export interface IClosureReadinessRepository {
  create(data: Partial<RecoveryLifecycleClosureReadiness>): Promise<RecoveryLifecycleClosureReadiness>;
  getById(id: string): Promise<RecoveryLifecycleClosureReadiness | null>;
  listBySchool(schoolId: string): Promise<RecoveryLifecycleClosureReadiness[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryLifecycleClosureReadiness[]>;
  listByPlanId(schoolId: string, resultRecoveryPlanId: string): Promise<RecoveryLifecycleClosureReadiness[]>;
  listBySimulationReadinessId(schoolId: string, simulationReadinessId: string): Promise<RecoveryLifecycleClosureReadiness[]>;
  listBySimulationPlanId(schoolId: string, simulationPlanId: string): Promise<RecoveryLifecycleClosureReadiness[]>;
  listBySimulationRunId(simulationRunId: string): Promise<RecoveryLifecycleClosureReadiness[]>;
  listBySimulationResultId(simulationResultId: string): Promise<RecoveryLifecycleClosureReadiness[]>;
  listBySimulationSummaryId(simulationSummaryId: string): Promise<RecoveryLifecycleClosureReadiness[]>;
  listByStatus(schoolId: string, closureReadinessStatus: string): Promise<RecoveryLifecycleClosureReadiness[]>;
  update(id: string, data: Partial<RecoveryLifecycleClosureReadiness>): Promise<RecoveryLifecycleClosureReadiness>;
  updateStatus(id: string, status: string): Promise<RecoveryLifecycleClosureReadiness>;
  markReviewReady(id: string): Promise<RecoveryLifecycleClosureReadiness>;
  approveForFutureUse(id: string): Promise<RecoveryLifecycleClosureReadiness>;
  suppress(id: string): Promise<RecoveryLifecycleClosureReadiness>;
  block(id: string): Promise<RecoveryLifecycleClosureReadiness>;
  void(id: string): Promise<RecoveryLifecycleClosureReadiness>;
}

export interface IHandoffPacketRepository {
  create(data: Partial<RecoveryPostSimulationHandoffPacket>): Promise<RecoveryPostSimulationHandoffPacket>;
  getById(id: string): Promise<RecoveryPostSimulationHandoffPacket | null>;
  listBySchool(schoolId: string): Promise<RecoveryPostSimulationHandoffPacket[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryPostSimulationHandoffPacket[]>;
  listByPlanId(schoolId: string, resultRecoveryPlanId: string): Promise<RecoveryPostSimulationHandoffPacket[]>;
  listBySimulationRunId(simulationRunId: string): Promise<RecoveryPostSimulationHandoffPacket[]>;
  listBySimulationResultId(simulationResultId: string): Promise<RecoveryPostSimulationHandoffPacket[]>;
  listByActionBundleId(bundleId: string): Promise<RecoveryPostSimulationHandoffPacket[]>;
  listByStatus(schoolId: string, handoffStatus: string): Promise<RecoveryPostSimulationHandoffPacket[]>;
  update(id: string, data: Partial<RecoveryPostSimulationHandoffPacket>): Promise<RecoveryPostSimulationHandoffPacket>;
  updateStatus(id: string, status: string): Promise<RecoveryPostSimulationHandoffPacket>;
  markReviewReady(id: string): Promise<RecoveryPostSimulationHandoffPacket>;
  markHandoffReady(id: string): Promise<RecoveryPostSimulationHandoffPacket>;
  approveForFutureUse(id: string): Promise<RecoveryPostSimulationHandoffPacket>;
  suppress(id: string): Promise<RecoveryPostSimulationHandoffPacket>;
  block(id: string): Promise<RecoveryPostSimulationHandoffPacket>;
  void(id: string): Promise<RecoveryPostSimulationHandoffPacket>;
}

export interface INextCycleRecommendationRepository {
  create(data: Partial<RecoveryNextCycleRecommendationDraft>): Promise<RecoveryNextCycleRecommendationDraft>;
  getById(id: string): Promise<RecoveryNextCycleRecommendationDraft | null>;
  listBySchool(schoolId: string): Promise<RecoveryNextCycleRecommendationDraft[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryNextCycleRecommendationDraft[]>;
  listByPlanId(schoolId: string, resultRecoveryPlanId: string): Promise<RecoveryNextCycleRecommendationDraft[]>;
  listBySimulationSummaryId(simulationSummaryId: string): Promise<RecoveryNextCycleRecommendationDraft[]>;
  listByType(schoolId: string, recommendationType: string): Promise<RecoveryNextCycleRecommendationDraft[]>;
  listByStatus(schoolId: string, recommendationStatus: string): Promise<RecoveryNextCycleRecommendationDraft[]>;
  update(id: string, data: Partial<RecoveryNextCycleRecommendationDraft>): Promise<RecoveryNextCycleRecommendationDraft>;
  updateStatus(id: string, status: string): Promise<RecoveryNextCycleRecommendationDraft>;
  markReviewReady(id: string): Promise<RecoveryNextCycleRecommendationDraft>;
  approveForFutureUse(id: string): Promise<RecoveryNextCycleRecommendationDraft>;
  suppress(id: string): Promise<RecoveryNextCycleRecommendationDraft>;
  block(id: string): Promise<RecoveryNextCycleRecommendationDraft>;
  void(id: string): Promise<RecoveryNextCycleRecommendationDraft>;
}

export interface IDeferredIntegrationTicketRepository {
  create(data: Partial<RecoveryDeferredIntegrationTicket>): Promise<RecoveryDeferredIntegrationTicket>;
  getById(id: string): Promise<RecoveryDeferredIntegrationTicket | null>;
  listBySchool(schoolId: string): Promise<RecoveryDeferredIntegrationTicket[]>;
  listByPlanId(schoolId: string, resultRecoveryPlanId: string): Promise<RecoveryDeferredIntegrationTicket[]>;
  listByType(schoolId: string, ticketType: string): Promise<RecoveryDeferredIntegrationTicket[]>;
  listByStatus(schoolId: string, ticketStatus: string): Promise<RecoveryDeferredIntegrationTicket[]>;
  update(id: string, data: Partial<RecoveryDeferredIntegrationTicket>): Promise<RecoveryDeferredIntegrationTicket>;
  updateStatus(id: string, status: string): Promise<RecoveryDeferredIntegrationTicket>;
  markReviewReady(id: string): Promise<RecoveryDeferredIntegrationTicket>;
  approveForFutureUse(id: string): Promise<RecoveryDeferredIntegrationTicket>;
  suppress(id: string): Promise<RecoveryDeferredIntegrationTicket>;
  block(id: string): Promise<RecoveryDeferredIntegrationTicket>;
  void(id: string): Promise<RecoveryDeferredIntegrationTicket>;
}

export interface IUnresolvedRiskRegisterRepository {
  create(data: Partial<RecoveryUnresolvedRiskRegister>): Promise<RecoveryUnresolvedRiskRegister>;
  getById(id: string): Promise<RecoveryUnresolvedRiskRegister | null>;
  listBySchool(schoolId: string): Promise<RecoveryUnresolvedRiskRegister[]>;
  listByPlanId(schoolId: string, resultRecoveryPlanId: string): Promise<RecoveryUnresolvedRiskRegister[]>;
  listByRiskLevel(schoolId: string, riskLevel: string): Promise<RecoveryUnresolvedRiskRegister[]>;
  listByStatus(schoolId: string, riskStatus: string): Promise<RecoveryUnresolvedRiskRegister[]>;
  update(id: string, data: Partial<RecoveryUnresolvedRiskRegister>): Promise<RecoveryUnresolvedRiskRegister>;
  updateStatus(id: string, status: string): Promise<RecoveryUnresolvedRiskRegister>;
  markReviewReady(id: string): Promise<RecoveryUnresolvedRiskRegister>;
  suppress(id: string): Promise<RecoveryUnresolvedRiskRegister>;
  block(id: string): Promise<RecoveryUnresolvedRiskRegister>;
  void(id: string): Promise<RecoveryUnresolvedRiskRegister>;
}

export interface ITeacherClosureReviewPacketRepository {
  create(data: Partial<RecoveryTeacherClosureReviewPacket>): Promise<RecoveryTeacherClosureReviewPacket>;
  getById(id: string): Promise<RecoveryTeacherClosureReviewPacket | null>;
  listBySchool(schoolId: string): Promise<RecoveryTeacherClosureReviewPacket[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryTeacherClosureReviewPacket[]>;
  listByPlanId(schoolId: string, resultRecoveryPlanId: string): Promise<RecoveryTeacherClosureReviewPacket[]>;
  listBySimulationSummaryId(simulationSummaryId: string): Promise<RecoveryTeacherClosureReviewPacket[]>;
  listByTeacherRef(schoolId: string, teacherRef: string): Promise<RecoveryTeacherClosureReviewPacket[]>;
  listByStatus(schoolId: string, reviewStatus: string): Promise<RecoveryTeacherClosureReviewPacket[]>;
  update(id: string, data: Partial<RecoveryTeacherClosureReviewPacket>): Promise<RecoveryTeacherClosureReviewPacket>;
  updateStatus(id: string, status: string): Promise<RecoveryTeacherClosureReviewPacket>;
  markReviewReady(id: string): Promise<RecoveryTeacherClosureReviewPacket>;
  approveForFutureUse(id: string): Promise<RecoveryTeacherClosureReviewPacket>;
  suppress(id: string): Promise<RecoveryTeacherClosureReviewPacket>;
  block(id: string): Promise<RecoveryTeacherClosureReviewPacket>;
  void(id: string): Promise<RecoveryTeacherClosureReviewPacket>;
}

export interface IAdminGovernanceReviewPacketRepository {
  create(data: Partial<RecoveryAdminGovernanceReviewPacket>): Promise<RecoveryAdminGovernanceReviewPacket>;
  getById(id: string): Promise<RecoveryAdminGovernanceReviewPacket | null>;
  listBySchool(schoolId: string): Promise<RecoveryAdminGovernanceReviewPacket[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryAdminGovernanceReviewPacket[]>;
  listByPlanId(schoolId: string, resultRecoveryPlanId: string): Promise<RecoveryAdminGovernanceReviewPacket[]>;
  listBySimulationSummaryId(simulationSummaryId: string): Promise<RecoveryAdminGovernanceReviewPacket[]>;
  listByAdminRef(schoolId: string, adminRef: string): Promise<RecoveryAdminGovernanceReviewPacket[]>;
  listByStatus(schoolId: string, reviewStatus: string): Promise<RecoveryAdminGovernanceReviewPacket[]>;
  update(id: string, data: Partial<RecoveryAdminGovernanceReviewPacket>): Promise<RecoveryAdminGovernanceReviewPacket>;
  updateStatus(id: string, status: string): Promise<RecoveryAdminGovernanceReviewPacket>;
  markReviewReady(id: string): Promise<RecoveryAdminGovernanceReviewPacket>;
  approveForFutureUse(id: string): Promise<RecoveryAdminGovernanceReviewPacket>;
  suppress(id: string): Promise<RecoveryAdminGovernanceReviewPacket>;
  block(id: string): Promise<RecoveryAdminGovernanceReviewPacket>;
  void(id: string): Promise<RecoveryAdminGovernanceReviewPacket>;
}

export interface IStudentClosureReflectionDraftRepository {
  create(data: Partial<RecoveryStudentClosureReflectionDraft>): Promise<RecoveryStudentClosureReflectionDraft>;
  getById(id: string): Promise<RecoveryStudentClosureReflectionDraft | null>;
  listBySchool(schoolId: string): Promise<RecoveryStudentClosureReflectionDraft[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryStudentClosureReflectionDraft[]>;
  listByPlanId(schoolId: string, resultRecoveryPlanId: string): Promise<RecoveryStudentClosureReflectionDraft[]>;
  listBySimulationRunId(simulationRunId: string): Promise<RecoveryStudentClosureReflectionDraft[]>;
  listByStatus(schoolId: string, draftStatus: string): Promise<RecoveryStudentClosureReflectionDraft[]>;
  update(id: string, data: Partial<RecoveryStudentClosureReflectionDraft>): Promise<RecoveryStudentClosureReflectionDraft>;
  updateStatus(id: string, status: string): Promise<RecoveryStudentClosureReflectionDraft>;
  markReviewReady(id: string): Promise<RecoveryStudentClosureReflectionDraft>;
  approveForFutureUse(id: string): Promise<RecoveryStudentClosureReflectionDraft>;
  suppress(id: string): Promise<RecoveryStudentClosureReflectionDraft>;
  block(id: string): Promise<RecoveryStudentClosureReflectionDraft>;
  void(id: string): Promise<RecoveryStudentClosureReflectionDraft>;
}

export interface IParentClosureGuidanceDraftRepository {
  create(data: Partial<RecoveryParentClosureGuidanceDraft>): Promise<RecoveryParentClosureGuidanceDraft>;
  getById(id: string): Promise<RecoveryParentClosureGuidanceDraft | null>;
  listBySchool(schoolId: string): Promise<RecoveryParentClosureGuidanceDraft[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryParentClosureGuidanceDraft[]>;
  listByPlanId(schoolId: string, resultRecoveryPlanId: string): Promise<RecoveryParentClosureGuidanceDraft[]>;
  listBySimulationRunId(simulationRunId: string): Promise<RecoveryParentClosureGuidanceDraft[]>;
  listByStatus(schoolId: string, draftStatus: string): Promise<RecoveryParentClosureGuidanceDraft[]>;
  update(id: string, data: Partial<RecoveryParentClosureGuidanceDraft>): Promise<RecoveryParentClosureGuidanceDraft>;
  updateStatus(id: string, status: string): Promise<RecoveryParentClosureGuidanceDraft>;
  markReviewReady(id: string): Promise<RecoveryParentClosureGuidanceDraft>;
  approveForFutureUse(id: string): Promise<RecoveryParentClosureGuidanceDraft>;
  suppress(id: string): Promise<RecoveryParentClosureGuidanceDraft>;
  block(id: string): Promise<RecoveryParentClosureGuidanceDraft>;
  void(id: string): Promise<RecoveryParentClosureGuidanceDraft>;
}

export interface IArchiveManifestRepository {
  create(data: Partial<RecoveryArchiveManifest>): Promise<RecoveryArchiveManifest>;
  getById(id: string): Promise<RecoveryArchiveManifest | null>;
  listBySchool(schoolId: string): Promise<RecoveryArchiveManifest[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryArchiveManifest[]>;
  listByPlanId(schoolId: string, resultRecoveryPlanId: string): Promise<RecoveryArchiveManifest[]>;
  listByStatus(schoolId: string, manifestStatus: string): Promise<RecoveryArchiveManifest[]>;
  update(id: string, data: Partial<RecoveryArchiveManifest>): Promise<RecoveryArchiveManifest>;
  updateStatus(id: string, status: string): Promise<RecoveryArchiveManifest>;
  markReviewReady(id: string): Promise<RecoveryArchiveManifest>;
  markArchiveReady(id: string): Promise<RecoveryArchiveManifest>;
  approveForFutureUse(id: string): Promise<RecoveryArchiveManifest>;
  suppress(id: string): Promise<RecoveryArchiveManifest>;
  block(id: string): Promise<RecoveryArchiveManifest>;
  void(id: string): Promise<RecoveryArchiveManifest>;
}

export interface IFinalLifecycleSummaryRepository {
  create(data: Partial<RecoveryFinalLifecycleSummary>): Promise<RecoveryFinalLifecycleSummary>;
  getById(id: string): Promise<RecoveryFinalLifecycleSummary | null>;
  listBySchool(schoolId: string): Promise<RecoveryFinalLifecycleSummary[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryFinalLifecycleSummary[]>;
  listByPlanId(schoolId: string, resultRecoveryPlanId: string): Promise<RecoveryFinalLifecycleSummary[]>;
  listBySimulationSummaryId(simulationSummaryId: string): Promise<RecoveryFinalLifecycleSummary[]>;
  listByStatus(schoolId: string, summaryStatus: string): Promise<RecoveryFinalLifecycleSummary[]>;
  update(id: string, data: Partial<RecoveryFinalLifecycleSummary>): Promise<RecoveryFinalLifecycleSummary>;
  updateStatus(id: string, status: string): Promise<RecoveryFinalLifecycleSummary>;
  markReviewReady(id: string): Promise<RecoveryFinalLifecycleSummary>;
  approveForFutureUse(id: string): Promise<RecoveryFinalLifecycleSummary>;
  refresh(id: string): Promise<RecoveryFinalLifecycleSummary>;
  markStale(id: string): Promise<RecoveryFinalLifecycleSummary>;
  block(id: string): Promise<RecoveryFinalLifecycleSummary>;
  void(id: string): Promise<RecoveryFinalLifecycleSummary>;
}

export interface IClosureAuditRepository {
  create(data: Partial<RecoveryLifecycleClosureAuditRecord>): Promise<RecoveryLifecycleClosureAuditRecord>;
  listBySchool(schoolId: string): Promise<RecoveryLifecycleClosureAuditRecord[]>;
}

export interface IClosureIdempotencyRepository {
  findByIdempotencyKey(schoolId: string, operation: string, idempotencyKey: string): Promise<RecoveryLifecycleClosureIdempotencyRecord | null>;
  create(data: Partial<RecoveryLifecycleClosureIdempotencyRecord>): Promise<RecoveryLifecycleClosureIdempotencyRecord>;
  markCompleted(id: string, resourceType: string, resourceId: string, safeResultSummary: string): Promise<RecoveryLifecycleClosureIdempotencyRecord>;
  markFailed(id: string, safeResultSummary: string): Promise<RecoveryLifecycleClosureIdempotencyRecord>;
}

export interface RecoveryLifecycleClosureAuditRecord {
  closureAuditEventId: string;
  schoolId: string;
  closureReadinessId?: string;
  handoffPacketId?: string;
  nextCycleRecommendationId?: string;
  deferredIntegrationTicketId?: string;
  unresolvedRiskRegisterId?: string;
  teacherClosureReviewPacketId?: string;
  adminGovernanceReviewPacketId?: string;
  studentClosureReflectionDraftId?: string;
  parentClosureGuidanceDraftId?: string;
  archiveManifestId?: string;
  finalLifecycleSummaryId?: string;
  actorId: string;
  actorRole: string;
  eventType: string;
  decision: string;
  safeSummary: string;
  reasonCodesJson: Record<string, unknown>;
  metadataJson: Record<string, unknown>;
  requestId?: string;
  correlationId?: string;
  createdAt: string;
}

export interface RecoveryLifecycleClosureIdempotencyRecord {
  closureIdempotencyId: string;
  schoolId: string;
  operation: string;
  idempotencyKey: string;
  requestHash: string;
  status: string;
  resourceType?: string;
  resourceId?: string;
  safeResultSummary?: string;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
}

export type ClosureAuditRecordResponse = RecoveryLifecycleClosureSafeEnvelope<RecoveryLifecycleClosureAuditRecord>;
export type ClosureAuditRecordListResponse = RecoveryLifecycleClosureSafeEnvelope<RecoveryLifecycleClosureAuditRecord[]>;

export interface IRecoveryLifecycleClosureRepositories {
  closureReadiness: IClosureReadinessRepository;
  handoffPacket: IHandoffPacketRepository;
  nextCycleRecommendationDraft: INextCycleRecommendationRepository;
  deferredIntegrationTicket: IDeferredIntegrationTicketRepository;
  unresolvedRiskRegister: IUnresolvedRiskRegisterRepository;
  teacherClosureReviewPacket: ITeacherClosureReviewPacketRepository;
  adminGovernanceReviewPacket: IAdminGovernanceReviewPacketRepository;
  studentClosureReflectionDraft: IStudentClosureReflectionDraftRepository;
  parentClosureGuidanceDraft: IParentClosureGuidanceDraftRepository;
  archiveManifest: IArchiveManifestRepository;
  finalLifecycleSummary: IFinalLifecycleSummaryRepository;
  closureAudit: IClosureAuditRepository;
  closureIdempotency: IClosureIdempotencyRepository;
}
