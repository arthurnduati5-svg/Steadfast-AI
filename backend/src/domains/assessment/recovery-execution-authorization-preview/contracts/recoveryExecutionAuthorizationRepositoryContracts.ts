import { RecoveryExecutionAuthorizationPreviewReadiness } from './recoveryExecutionAuthorizationReadinessContracts';
import { RecoveryExecutionAuthorizationRequestDraft } from './recoveryExecutionAuthorizationRequestContracts';
import { RecoveryExecutionAuthorizationEligibilityCheck } from './recoveryExecutionAuthorizationEligibilityContracts';
import { RecoveryExecutionAuthorityMatrixSnapshot } from './recoveryExecutionAuthorityMatrixContracts';
import { RecoveryExecutionApprovalChainDraft } from './recoveryExecutionApprovalChainContracts';
import { RecoveryExecutionRiskAttestation } from './recoveryExecutionRiskAttestationContracts';
import { RecoveryExecutionConsentBoundaryCheck } from './recoveryExecutionConsentBoundaryContracts';
import { RecoveryExecutionVeto } from './recoveryExecutionVetoContracts';
import { RecoveryExecutionPreflightChecklist } from './recoveryExecutionPreflightChecklistContracts';
import { RecoveryExecutionAuthorizationDryRun } from './recoveryExecutionAuthorizationDryRunContracts';
import { RecoveryExecutionPreLiveDecisionPacket } from './recoveryExecutionPreLiveDecisionPacketContracts';
import { RecoveryExecutionMockAuthorizationReceipt } from './recoveryExecutionMockAuthorizationReceiptContracts';
import { RecoveryExecutionAuthorizationSummary } from './recoveryExecutionAuthorizationSummaryContracts';

export interface RecoveryExecutionAuthorizationPreviewReadinessRepository {
  create(data: Partial<RecoveryExecutionAuthorizationPreviewReadiness>): Promise<RecoveryExecutionAuthorizationPreviewReadiness>;
  getById(schoolId: string, id: string): Promise<RecoveryExecutionAuthorizationPreviewReadiness | null>;
  listBySchool(schoolId: string): Promise<RecoveryExecutionAuthorizationPreviewReadiness[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryExecutionAuthorizationPreviewReadiness[]>;
  listByPlanId(schoolId: string, planId: string): Promise<RecoveryExecutionAuthorizationPreviewReadiness[]>;
  listByStatus(schoolId: string, status: string): Promise<RecoveryExecutionAuthorizationPreviewReadiness[]>;
  update(id: string, data: Partial<RecoveryExecutionAuthorizationPreviewReadiness>): Promise<RecoveryExecutionAuthorizationPreviewReadiness>;
}

export interface RecoveryExecutionAuthorizationRequestDraftRepository {
  create(data: Partial<RecoveryExecutionAuthorizationRequestDraft>): Promise<RecoveryExecutionAuthorizationRequestDraft>;
  getById(schoolId: string, id: string): Promise<RecoveryExecutionAuthorizationRequestDraft | null>;
  listBySchool(schoolId: string): Promise<RecoveryExecutionAuthorizationRequestDraft[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryExecutionAuthorizationRequestDraft[]>;
  listByPlanId(schoolId: string, planId: string): Promise<RecoveryExecutionAuthorizationRequestDraft[]>;
  listByStatus(schoolId: string, status: string): Promise<RecoveryExecutionAuthorizationRequestDraft[]>;
  update(id: string, data: Partial<RecoveryExecutionAuthorizationRequestDraft>): Promise<RecoveryExecutionAuthorizationRequestDraft>;
}

export interface RecoveryExecutionAuthorizationEligibilityCheckRepository {
  create(data: Partial<RecoveryExecutionAuthorizationEligibilityCheck>): Promise<RecoveryExecutionAuthorizationEligibilityCheck>;
  getById(schoolId: string, id: string): Promise<RecoveryExecutionAuthorizationEligibilityCheck | null>;
  listBySchool(schoolId: string): Promise<RecoveryExecutionAuthorizationEligibilityCheck[]>;
  listByPlanId(schoolId: string, planId: string): Promise<RecoveryExecutionAuthorizationEligibilityCheck[]>;
  listByDecision(schoolId: string, decision: string): Promise<RecoveryExecutionAuthorizationEligibilityCheck[]>;
  update(id: string, data: Partial<RecoveryExecutionAuthorizationEligibilityCheck>): Promise<RecoveryExecutionAuthorizationEligibilityCheck>;
}

export interface RecoveryExecutionAuthorityMatrixSnapshotRepository {
  create(data: Partial<RecoveryExecutionAuthorityMatrixSnapshot>): Promise<RecoveryExecutionAuthorityMatrixSnapshot>;
  getById(schoolId: string, id: string): Promise<RecoveryExecutionAuthorityMatrixSnapshot | null>;
  listBySchool(schoolId: string): Promise<RecoveryExecutionAuthorityMatrixSnapshot[]>;
  listByPlanId(schoolId: string, planId: string): Promise<RecoveryExecutionAuthorityMatrixSnapshot[]>;
  listByStatus(schoolId: string, status: string): Promise<RecoveryExecutionAuthorityMatrixSnapshot[]>;
  update(id: string, data: Partial<RecoveryExecutionAuthorityMatrixSnapshot>): Promise<RecoveryExecutionAuthorityMatrixSnapshot>;
}

export interface RecoveryExecutionApprovalChainDraftRepository {
  create(data: Partial<RecoveryExecutionApprovalChainDraft>): Promise<RecoveryExecutionApprovalChainDraft>;
  getById(schoolId: string, id: string): Promise<RecoveryExecutionApprovalChainDraft | null>;
  listBySchool(schoolId: string): Promise<RecoveryExecutionApprovalChainDraft[]>;
  listByPlanId(schoolId: string, planId: string): Promise<RecoveryExecutionApprovalChainDraft[]>;
  listByApproverRef(schoolId: string, approverRef: string): Promise<RecoveryExecutionApprovalChainDraft[]>;
  listByStatus(schoolId: string, status: string): Promise<RecoveryExecutionApprovalChainDraft[]>;
  update(id: string, data: Partial<RecoveryExecutionApprovalChainDraft>): Promise<RecoveryExecutionApprovalChainDraft>;
}

export interface RecoveryExecutionRiskAttestationRepository {
  create(data: Partial<RecoveryExecutionRiskAttestation>): Promise<RecoveryExecutionRiskAttestation>;
  getById(schoolId: string, id: string): Promise<RecoveryExecutionRiskAttestation | null>;
  listBySchool(schoolId: string): Promise<RecoveryExecutionRiskAttestation[]>;
  listByPlanId(schoolId: string, planId: string): Promise<RecoveryExecutionRiskAttestation[]>;
  listByRiskLevel(schoolId: string, riskLevel: string): Promise<RecoveryExecutionRiskAttestation[]>;
  listByStatus(schoolId: string, status: string): Promise<RecoveryExecutionRiskAttestation[]>;
  listByActorRef(schoolId: string, actorRef: string): Promise<RecoveryExecutionRiskAttestation[]>;
  update(id: string, data: Partial<RecoveryExecutionRiskAttestation>): Promise<RecoveryExecutionRiskAttestation>;
}

export interface RecoveryExecutionConsentBoundaryCheckRepository {
  create(data: Partial<RecoveryExecutionConsentBoundaryCheck>): Promise<RecoveryExecutionConsentBoundaryCheck>;
  getById(schoolId: string, id: string): Promise<RecoveryExecutionConsentBoundaryCheck | null>;
  listBySchool(schoolId: string): Promise<RecoveryExecutionConsentBoundaryCheck[]>;
  listByPlanId(schoolId: string, planId: string): Promise<RecoveryExecutionConsentBoundaryCheck[]>;
  listByDecision(schoolId: string, decision: string): Promise<RecoveryExecutionConsentBoundaryCheck[]>;
  update(id: string, data: Partial<RecoveryExecutionConsentBoundaryCheck>): Promise<RecoveryExecutionConsentBoundaryCheck>;
}

export interface RecoveryExecutionVetoRepository {
  create(data: Partial<RecoveryExecutionVeto>): Promise<RecoveryExecutionVeto>;
  getById(schoolId: string, id: string): Promise<RecoveryExecutionVeto | null>;
  listBySchool(schoolId: string): Promise<RecoveryExecutionVeto[]>;
  listByPlanId(schoolId: string, planId: string): Promise<RecoveryExecutionVeto[]>;
  listByReason(schoolId: string, reason: string): Promise<RecoveryExecutionVeto[]>;
  listByActor(schoolId: string, actorRef: string): Promise<RecoveryExecutionVeto[]>;
  update(id: string, data: Partial<RecoveryExecutionVeto>): Promise<RecoveryExecutionVeto>;
}

export interface RecoveryExecutionPreflightChecklistRepository {
  create(data: Partial<RecoveryExecutionPreflightChecklist>): Promise<RecoveryExecutionPreflightChecklist>;
  getById(schoolId: string, id: string): Promise<RecoveryExecutionPreflightChecklist | null>;
  listBySchool(schoolId: string): Promise<RecoveryExecutionPreflightChecklist[]>;
  listByPlanId(schoolId: string, planId: string): Promise<RecoveryExecutionPreflightChecklist[]>;
  listByStatus(schoolId: string, status: string): Promise<RecoveryExecutionPreflightChecklist[]>;
  update(id: string, data: Partial<RecoveryExecutionPreflightChecklist>): Promise<RecoveryExecutionPreflightChecklist>;
}

export interface RecoveryExecutionAuthorizationDryRunRepository {
  create(data: Partial<RecoveryExecutionAuthorizationDryRun>): Promise<RecoveryExecutionAuthorizationDryRun>;
  getById(schoolId: string, id: string): Promise<RecoveryExecutionAuthorizationDryRun | null>;
  listBySchool(schoolId: string): Promise<RecoveryExecutionAuthorizationDryRun[]>;
  listByPlanId(schoolId: string, planId: string): Promise<RecoveryExecutionAuthorizationDryRun[]>;
  listByDecision(schoolId: string, decision: string): Promise<RecoveryExecutionAuthorizationDryRun[]>;
  update(id: string, data: Partial<RecoveryExecutionAuthorizationDryRun>): Promise<RecoveryExecutionAuthorizationDryRun>;
}

export interface RecoveryExecutionPreLiveDecisionPacketRepository {
  create(data: Partial<RecoveryExecutionPreLiveDecisionPacket>): Promise<RecoveryExecutionPreLiveDecisionPacket>;
  getById(schoolId: string, id: string): Promise<RecoveryExecutionPreLiveDecisionPacket | null>;
  listBySchool(schoolId: string): Promise<RecoveryExecutionPreLiveDecisionPacket[]>;
  listByPlanId(schoolId: string, planId: string): Promise<RecoveryExecutionPreLiveDecisionPacket[]>;
  listByStatus(schoolId: string, status: string): Promise<RecoveryExecutionPreLiveDecisionPacket[]>;
  update(id: string, data: Partial<RecoveryExecutionPreLiveDecisionPacket>): Promise<RecoveryExecutionPreLiveDecisionPacket>;
}

export interface RecoveryExecutionMockAuthorizationReceiptRepository {
  create(data: Partial<RecoveryExecutionMockAuthorizationReceipt>): Promise<RecoveryExecutionMockAuthorizationReceipt>;
  getById(schoolId: string, id: string): Promise<RecoveryExecutionMockAuthorizationReceipt | null>;
  listBySchool(schoolId: string): Promise<RecoveryExecutionMockAuthorizationReceipt[]>;
  listByPlanId(schoolId: string, planId: string): Promise<RecoveryExecutionMockAuthorizationReceipt[]>;
  listByDecision(schoolId: string, decision: string): Promise<RecoveryExecutionMockAuthorizationReceipt[]>;
  update(id: string, data: Partial<RecoveryExecutionMockAuthorizationReceipt>): Promise<RecoveryExecutionMockAuthorizationReceipt>;
}

export interface RecoveryExecutionAuthorizationSummaryRepository {
  create(data: Partial<RecoveryExecutionAuthorizationSummary>): Promise<RecoveryExecutionAuthorizationSummary>;
  getById(schoolId: string, id: string): Promise<RecoveryExecutionAuthorizationSummary | null>;
  listBySchool(schoolId: string): Promise<RecoveryExecutionAuthorizationSummary[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryExecutionAuthorizationSummary[]>;
  listByPlanId(schoolId: string, planId: string): Promise<RecoveryExecutionAuthorizationSummary[]>;
  update(id: string, data: Partial<RecoveryExecutionAuthorizationSummary>): Promise<RecoveryExecutionAuthorizationSummary>;
}

export interface RecoveryExecutionAuthorizationAuditRepository {
  create(data: Partial<any>): Promise<any>;
  listBySchool(schoolId: string): Promise<any[]>;
  listByEventType(schoolId: string, eventType: string): Promise<any[]>;
}

export interface RecoveryExecutionAuthorizationIdempotencyRepository {
  create(data: Partial<any>): Promise<any>;
  getByKey(schoolId: string, operation: string, idempotencyKey: string): Promise<any | null>;
  updateStatus(id: string, status: string, resourceType?: string, resourceId?: string, safeResultSummary?: string): Promise<any>;
  listExpired(): Promise<any[]>;
}
