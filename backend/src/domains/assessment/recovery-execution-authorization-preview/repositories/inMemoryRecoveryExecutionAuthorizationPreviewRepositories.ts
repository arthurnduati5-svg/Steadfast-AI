import { RecoveryExecutionAuthorizationPreviewReadiness } from '../contracts/recoveryExecutionAuthorizationReadinessContracts';
import { RecoveryExecutionAuthorizationRequestDraft } from '../contracts/recoveryExecutionAuthorizationRequestContracts';
import { RecoveryExecutionAuthorizationEligibilityCheck } from '../contracts/recoveryExecutionAuthorizationEligibilityContracts';
import { RecoveryExecutionAuthorityMatrixSnapshot } from '../contracts/recoveryExecutionAuthorityMatrixContracts';
import { RecoveryExecutionApprovalChainDraft } from '../contracts/recoveryExecutionApprovalChainContracts';
import { RecoveryExecutionRiskAttestation } from '../contracts/recoveryExecutionRiskAttestationContracts';
import { RecoveryExecutionConsentBoundaryCheck } from '../contracts/recoveryExecutionConsentBoundaryContracts';
import { RecoveryExecutionVeto } from '../contracts/recoveryExecutionVetoContracts';
import { RecoveryExecutionPreflightChecklist } from '../contracts/recoveryExecutionPreflightChecklistContracts';
import { RecoveryExecutionAuthorizationDryRun } from '../contracts/recoveryExecutionAuthorizationDryRunContracts';
import { RecoveryExecutionPreLiveDecisionPacket } from '../contracts/recoveryExecutionPreLiveDecisionPacketContracts';
import { RecoveryExecutionMockAuthorizationReceipt } from '../contracts/recoveryExecutionMockAuthorizationReceiptContracts';
import { RecoveryExecutionAuthorizationSummary } from '../contracts/recoveryExecutionAuthorizationSummaryContracts';
import {
  RecoveryExecutionAuthorizationPreviewReadinessRepository,
  RecoveryExecutionAuthorizationRequestDraftRepository,
  RecoveryExecutionAuthorizationEligibilityCheckRepository,
  RecoveryExecutionAuthorityMatrixSnapshotRepository,
  RecoveryExecutionApprovalChainDraftRepository,
  RecoveryExecutionRiskAttestationRepository,
  RecoveryExecutionConsentBoundaryCheckRepository,
  RecoveryExecutionVetoRepository,
  RecoveryExecutionPreflightChecklistRepository,
  RecoveryExecutionAuthorizationDryRunRepository,
  RecoveryExecutionPreLiveDecisionPacketRepository,
  RecoveryExecutionMockAuthorizationReceiptRepository,
  RecoveryExecutionAuthorizationSummaryRepository,
  RecoveryExecutionAuthorizationAuditRepository,
  RecoveryExecutionAuthorizationIdempotencyRepository,
} from '../contracts/recoveryExecutionAuthorizationRepositoryContracts';

export class InMemoryAuthorizationPreviewReadinessRepository implements RecoveryExecutionAuthorizationPreviewReadinessRepository {
  private store = new Map<string, RecoveryExecutionAuthorizationPreviewReadiness>();

  async create(data: Partial<RecoveryExecutionAuthorizationPreviewReadiness>): Promise<RecoveryExecutionAuthorizationPreviewReadiness> {
    const now = new Date().toISOString();
    const record: RecoveryExecutionAuthorizationPreviewReadiness = {
      ...data as RecoveryExecutionAuthorizationPreviewReadiness,
      authorizationReadinessId: data.authorizationReadinessId || crypto.randomUUID(),
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
    };
    this.store.set(record.authorizationReadinessId, record);
    return record;
  }

  async getById(schoolId: string, id: string): Promise<RecoveryExecutionAuthorizationPreviewReadiness | null> {
    const record = this.store.get(id) ?? null;
    if (record && record.schoolId !== schoolId) return null;
    return record;
  }

  async listBySchool(schoolId: string): Promise<RecoveryExecutionAuthorizationPreviewReadiness[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryExecutionAuthorizationPreviewReadiness[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.studentRef === studentRef);
  }

  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryExecutionAuthorizationPreviewReadiness[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultRecoveryPlanId === planId);
  }

  async listByStatus(schoolId: string, status: string): Promise<RecoveryExecutionAuthorizationPreviewReadiness[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.status === status);
  }

  async update(id: string, data: Partial<RecoveryExecutionAuthorizationPreviewReadiness>): Promise<RecoveryExecutionAuthorizationPreviewReadiness> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`AuthorizationPreviewReadiness ${id} not found`);
    const updated: RecoveryExecutionAuthorizationPreviewReadiness = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
  }
}

export class InMemoryAuthorizationRequestDraftRepository implements RecoveryExecutionAuthorizationRequestDraftRepository {
  private store = new Map<string, RecoveryExecutionAuthorizationRequestDraft>();

  async create(data: Partial<RecoveryExecutionAuthorizationRequestDraft>): Promise<RecoveryExecutionAuthorizationRequestDraft> {
    const now = new Date().toISOString();
    const record: RecoveryExecutionAuthorizationRequestDraft = {
      ...data as RecoveryExecutionAuthorizationRequestDraft,
      authorizationRequestDraftId: data.authorizationRequestDraftId || crypto.randomUUID(),
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
    };
    this.store.set(record.authorizationRequestDraftId, record);
    return record;
  }

  async getById(schoolId: string, id: string): Promise<RecoveryExecutionAuthorizationRequestDraft | null> {
    const record = this.store.get(id) ?? null;
    if (record && record.schoolId !== schoolId) return null;
    return record;
  }

  async listBySchool(schoolId: string): Promise<RecoveryExecutionAuthorizationRequestDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryExecutionAuthorizationRequestDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.studentRef === studentRef);
  }

  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryExecutionAuthorizationRequestDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultRecoveryPlanId === planId);
  }

  async listByStatus(schoolId: string, status: string): Promise<RecoveryExecutionAuthorizationRequestDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.requestStatus === status);
  }

  async update(id: string, data: Partial<RecoveryExecutionAuthorizationRequestDraft>): Promise<RecoveryExecutionAuthorizationRequestDraft> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`AuthorizationRequestDraft ${id} not found`);
    const updated: RecoveryExecutionAuthorizationRequestDraft = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
  }
}

export class InMemoryAuthorizationEligibilityCheckRepository implements RecoveryExecutionAuthorizationEligibilityCheckRepository {
  private store = new Map<string, RecoveryExecutionAuthorizationEligibilityCheck>();

  async create(data: Partial<RecoveryExecutionAuthorizationEligibilityCheck>): Promise<RecoveryExecutionAuthorizationEligibilityCheck> {
    const now = new Date().toISOString();
    const record: RecoveryExecutionAuthorizationEligibilityCheck = {
      ...data as RecoveryExecutionAuthorizationEligibilityCheck,
      authorizationEligibilityCheckId: data.authorizationEligibilityCheckId || crypto.randomUUID(),
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
    };
    this.store.set(record.authorizationEligibilityCheckId, record);
    return record;
  }

  async getById(schoolId: string, id: string): Promise<RecoveryExecutionAuthorizationEligibilityCheck | null> {
    const record = this.store.get(id) ?? null;
    if (record && record.schoolId !== schoolId) return null;
    return record;
  }

  async listBySchool(schoolId: string): Promise<RecoveryExecutionAuthorizationEligibilityCheck[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryExecutionAuthorizationEligibilityCheck[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultRecoveryPlanId === planId);
  }

  async listByDecision(schoolId: string, decision: string): Promise<RecoveryExecutionAuthorizationEligibilityCheck[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.decision === decision);
  }

  async update(id: string, data: Partial<RecoveryExecutionAuthorizationEligibilityCheck>): Promise<RecoveryExecutionAuthorizationEligibilityCheck> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`AuthorizationEligibilityCheck ${id} not found`);
    const updated: RecoveryExecutionAuthorizationEligibilityCheck = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
  }
}

export class InMemoryAuthorityMatrixSnapshotRepository implements RecoveryExecutionAuthorityMatrixSnapshotRepository {
  private store = new Map<string, RecoveryExecutionAuthorityMatrixSnapshot>();

  async create(data: Partial<RecoveryExecutionAuthorityMatrixSnapshot>): Promise<RecoveryExecutionAuthorityMatrixSnapshot> {
    const now = new Date().toISOString();
    const record: RecoveryExecutionAuthorityMatrixSnapshot = {
      ...data as RecoveryExecutionAuthorityMatrixSnapshot,
      authorityMatrixSnapshotId: data.authorityMatrixSnapshotId || crypto.randomUUID(),
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
    };
    this.store.set(record.authorityMatrixSnapshotId, record);
    return record;
  }

  async getById(schoolId: string, id: string): Promise<RecoveryExecutionAuthorityMatrixSnapshot | null> {
    const record = this.store.get(id) ?? null;
    if (record && record.schoolId !== schoolId) return null;
    return record;
  }

  async listBySchool(schoolId: string): Promise<RecoveryExecutionAuthorityMatrixSnapshot[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryExecutionAuthorityMatrixSnapshot[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultRecoveryPlanId === planId);
  }

  async listByStatus(schoolId: string, status: string): Promise<RecoveryExecutionAuthorityMatrixSnapshot[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.snapshotStatus === status);
  }

  async update(id: string, data: Partial<RecoveryExecutionAuthorityMatrixSnapshot>): Promise<RecoveryExecutionAuthorityMatrixSnapshot> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`AuthorityMatrixSnapshot ${id} not found`);
    const updated: RecoveryExecutionAuthorityMatrixSnapshot = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
  }
}

export class InMemoryApprovalChainDraftRepository implements RecoveryExecutionApprovalChainDraftRepository {
  private store = new Map<string, RecoveryExecutionApprovalChainDraft>();

  async create(data: Partial<RecoveryExecutionApprovalChainDraft>): Promise<RecoveryExecutionApprovalChainDraft> {
    const now = new Date().toISOString();
    const record: RecoveryExecutionApprovalChainDraft = {
      ...data as RecoveryExecutionApprovalChainDraft,
      approvalChainDraftId: data.approvalChainDraftId || crypto.randomUUID(),
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
    };
    this.store.set(record.approvalChainDraftId, record);
    return record;
  }

  async getById(schoolId: string, id: string): Promise<RecoveryExecutionApprovalChainDraft | null> {
    const record = this.store.get(id) ?? null;
    if (record && record.schoolId !== schoolId) return null;
    return record;
  }

  async listBySchool(schoolId: string): Promise<RecoveryExecutionApprovalChainDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryExecutionApprovalChainDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultRecoveryPlanId === planId);
  }

  async listByApproverRef(schoolId: string, approverRef: string): Promise<RecoveryExecutionApprovalChainDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.approverRefsJson && (r.approverRefsJson as any).approverRef === approverRef);
  }

  async listByStatus(schoolId: string, status: string): Promise<RecoveryExecutionApprovalChainDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.chainStatus === status);
  }

  async update(id: string, data: Partial<RecoveryExecutionApprovalChainDraft>): Promise<RecoveryExecutionApprovalChainDraft> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`ApprovalChainDraft ${id} not found`);
    const updated: RecoveryExecutionApprovalChainDraft = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
  }
}

export class InMemoryRiskAttestationRepository implements RecoveryExecutionRiskAttestationRepository {
  private store = new Map<string, RecoveryExecutionRiskAttestation>();

  async create(data: Partial<RecoveryExecutionRiskAttestation>): Promise<RecoveryExecutionRiskAttestation> {
    const now = new Date().toISOString();
    const record: RecoveryExecutionRiskAttestation = {
      ...data as RecoveryExecutionRiskAttestation,
      riskAttestationId: data.riskAttestationId || crypto.randomUUID(),
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
    };
    this.store.set(record.riskAttestationId, record);
    return record;
  }

  async getById(schoolId: string, id: string): Promise<RecoveryExecutionRiskAttestation | null> {
    const record = this.store.get(id) ?? null;
    if (record && record.schoolId !== schoolId) return null;
    return record;
  }

  async listBySchool(schoolId: string): Promise<RecoveryExecutionRiskAttestation[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryExecutionRiskAttestation[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultRecoveryPlanId === planId);
  }

  async listByRiskLevel(schoolId: string, riskLevel: string): Promise<RecoveryExecutionRiskAttestation[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.riskLevel === riskLevel);
  }

  async listByStatus(schoolId: string, status: string): Promise<RecoveryExecutionRiskAttestation[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.attestationStatus === status);
  }

  async listByActorRef(schoolId: string, actorRef: string): Promise<RecoveryExecutionRiskAttestation[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.attestorActorId === actorRef);
  }

  async update(id: string, data: Partial<RecoveryExecutionRiskAttestation>): Promise<RecoveryExecutionRiskAttestation> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`RiskAttestation ${id} not found`);
    const updated: RecoveryExecutionRiskAttestation = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
  }
}

export class InMemoryConsentBoundaryCheckRepository implements RecoveryExecutionConsentBoundaryCheckRepository {
  private store = new Map<string, RecoveryExecutionConsentBoundaryCheck>();

  async create(data: Partial<RecoveryExecutionConsentBoundaryCheck>): Promise<RecoveryExecutionConsentBoundaryCheck> {
    const now = new Date().toISOString();
    const record: RecoveryExecutionConsentBoundaryCheck = {
      ...data as RecoveryExecutionConsentBoundaryCheck,
      consentBoundaryCheckId: data.consentBoundaryCheckId || crypto.randomUUID(),
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
    };
    this.store.set(record.consentBoundaryCheckId, record);
    return record;
  }

  async getById(schoolId: string, id: string): Promise<RecoveryExecutionConsentBoundaryCheck | null> {
    const record = this.store.get(id) ?? null;
    if (record && record.schoolId !== schoolId) return null;
    return record;
  }

  async listBySchool(schoolId: string): Promise<RecoveryExecutionConsentBoundaryCheck[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryExecutionConsentBoundaryCheck[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultRecoveryPlanId === planId);
  }

  async listByDecision(schoolId: string, decision: string): Promise<RecoveryExecutionConsentBoundaryCheck[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.decision === decision);
  }

  async update(id: string, data: Partial<RecoveryExecutionConsentBoundaryCheck>): Promise<RecoveryExecutionConsentBoundaryCheck> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`ConsentBoundaryCheck ${id} not found`);
    const updated: RecoveryExecutionConsentBoundaryCheck = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
  }
}

export class InMemoryVetoRepository implements RecoveryExecutionVetoRepository {
  private store = new Map<string, RecoveryExecutionVeto>();

  async create(data: Partial<RecoveryExecutionVeto>): Promise<RecoveryExecutionVeto> {
    const now = new Date().toISOString();
    const record: RecoveryExecutionVeto = {
      ...data as RecoveryExecutionVeto,
      vetoId: data.vetoId || crypto.randomUUID(),
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
    };
    this.store.set(record.vetoId, record);
    return record;
  }

  async getById(schoolId: string, id: string): Promise<RecoveryExecutionVeto | null> {
    const record = this.store.get(id) ?? null;
    if (record && record.schoolId !== schoolId) return null;
    return record;
  }

  async listBySchool(schoolId: string): Promise<RecoveryExecutionVeto[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryExecutionVeto[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultRecoveryPlanId === planId);
  }

  async listByReason(schoolId: string, reason: string): Promise<RecoveryExecutionVeto[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.vetoReason === reason);
  }

  async listByActor(schoolId: string, actorRef: string): Promise<RecoveryExecutionVeto[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.vetoActorId === actorRef);
  }

  async update(id: string, data: Partial<RecoveryExecutionVeto>): Promise<RecoveryExecutionVeto> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`Veto ${id} not found`);
    const updated: RecoveryExecutionVeto = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
  }
}

export class InMemoryPreflightChecklistRepository implements RecoveryExecutionPreflightChecklistRepository {
  private store = new Map<string, RecoveryExecutionPreflightChecklist>();

  async create(data: Partial<RecoveryExecutionPreflightChecklist>): Promise<RecoveryExecutionPreflightChecklist> {
    const now = new Date().toISOString();
    const record: RecoveryExecutionPreflightChecklist = {
      ...data as RecoveryExecutionPreflightChecklist,
      preflightChecklistId: data.preflightChecklistId || crypto.randomUUID(),
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
    };
    this.store.set(record.preflightChecklistId, record);
    return record;
  }

  async getById(schoolId: string, id: string): Promise<RecoveryExecutionPreflightChecklist | null> {
    const record = this.store.get(id) ?? null;
    if (record && record.schoolId !== schoolId) return null;
    return record;
  }

  async listBySchool(schoolId: string): Promise<RecoveryExecutionPreflightChecklist[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryExecutionPreflightChecklist[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultRecoveryPlanId === planId);
  }

  async listByStatus(schoolId: string, status: string): Promise<RecoveryExecutionPreflightChecklist[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.checklistStatus === status);
  }

  async update(id: string, data: Partial<RecoveryExecutionPreflightChecklist>): Promise<RecoveryExecutionPreflightChecklist> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`PreflightChecklist ${id} not found`);
    const updated: RecoveryExecutionPreflightChecklist = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
  }
}

export class InMemoryAuthorizationDryRunRepository implements RecoveryExecutionAuthorizationDryRunRepository {
  private store = new Map<string, RecoveryExecutionAuthorizationDryRun>();

  async create(data: Partial<RecoveryExecutionAuthorizationDryRun>): Promise<RecoveryExecutionAuthorizationDryRun> {
    const now = new Date().toISOString();
    const record: RecoveryExecutionAuthorizationDryRun = {
      ...data as RecoveryExecutionAuthorizationDryRun,
      authorizationDryRunId: data.authorizationDryRunId || crypto.randomUUID(),
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
    };
    this.store.set(record.authorizationDryRunId, record);
    return record;
  }

  async getById(schoolId: string, id: string): Promise<RecoveryExecutionAuthorizationDryRun | null> {
    const record = this.store.get(id) ?? null;
    if (record && record.schoolId !== schoolId) return null;
    return record;
  }

  async listBySchool(schoolId: string): Promise<RecoveryExecutionAuthorizationDryRun[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryExecutionAuthorizationDryRun[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultRecoveryPlanId === planId);
  }

  async listByDecision(schoolId: string, decision: string): Promise<RecoveryExecutionAuthorizationDryRun[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.dryRunDecision === decision);
  }

  async update(id: string, data: Partial<RecoveryExecutionAuthorizationDryRun>): Promise<RecoveryExecutionAuthorizationDryRun> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`AuthorizationDryRun ${id} not found`);
    const updated: RecoveryExecutionAuthorizationDryRun = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
  }
}

export class InMemoryPreLiveDecisionPacketRepository implements RecoveryExecutionPreLiveDecisionPacketRepository {
  private store = new Map<string, RecoveryExecutionPreLiveDecisionPacket>();

  async create(data: Partial<RecoveryExecutionPreLiveDecisionPacket>): Promise<RecoveryExecutionPreLiveDecisionPacket> {
    const now = new Date().toISOString();
    const record: RecoveryExecutionPreLiveDecisionPacket = {
      ...data as RecoveryExecutionPreLiveDecisionPacket,
      preLiveDecisionPacketId: data.preLiveDecisionPacketId || crypto.randomUUID(),
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
    };
    this.store.set(record.preLiveDecisionPacketId, record);
    return record;
  }

  async getById(schoolId: string, id: string): Promise<RecoveryExecutionPreLiveDecisionPacket | null> {
    const record = this.store.get(id) ?? null;
    if (record && record.schoolId !== schoolId) return null;
    return record;
  }

  async listBySchool(schoolId: string): Promise<RecoveryExecutionPreLiveDecisionPacket[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryExecutionPreLiveDecisionPacket[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultRecoveryPlanId === planId);
  }

  async listByStatus(schoolId: string, status: string): Promise<RecoveryExecutionPreLiveDecisionPacket[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.packetStatus === status);
  }

  async update(id: string, data: Partial<RecoveryExecutionPreLiveDecisionPacket>): Promise<RecoveryExecutionPreLiveDecisionPacket> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`PreLiveDecisionPacket ${id} not found`);
    const updated: RecoveryExecutionPreLiveDecisionPacket = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
  }
}

export class InMemoryMockAuthorizationReceiptRepository implements RecoveryExecutionMockAuthorizationReceiptRepository {
  private store = new Map<string, RecoveryExecutionMockAuthorizationReceipt>();

  async create(data: Partial<RecoveryExecutionMockAuthorizationReceipt>): Promise<RecoveryExecutionMockAuthorizationReceipt> {
    const now = new Date().toISOString();
    const record: RecoveryExecutionMockAuthorizationReceipt = {
      ...data as RecoveryExecutionMockAuthorizationReceipt,
      mockAuthorizationReceiptId: data.mockAuthorizationReceiptId || crypto.randomUUID(),
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
    };
    this.store.set(record.mockAuthorizationReceiptId, record);
    return record;
  }

  async getById(schoolId: string, id: string): Promise<RecoveryExecutionMockAuthorizationReceipt | null> {
    const record = this.store.get(id) ?? null;
    if (record && record.schoolId !== schoolId) return null;
    return record;
  }

  async listBySchool(schoolId: string): Promise<RecoveryExecutionMockAuthorizationReceipt[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryExecutionMockAuthorizationReceipt[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultRecoveryPlanId === planId);
  }

  async listByDecision(schoolId: string, decision: string): Promise<RecoveryExecutionMockAuthorizationReceipt[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.receiptDecision === decision);
  }

  async update(id: string, data: Partial<RecoveryExecutionMockAuthorizationReceipt>): Promise<RecoveryExecutionMockAuthorizationReceipt> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`MockAuthorizationReceipt ${id} not found`);
    const updated: RecoveryExecutionMockAuthorizationReceipt = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
  }
}

export class InMemoryAuthorizationSummaryRepository implements RecoveryExecutionAuthorizationSummaryRepository {
  private store = new Map<string, RecoveryExecutionAuthorizationSummary>();

  async create(data: Partial<RecoveryExecutionAuthorizationSummary>): Promise<RecoveryExecutionAuthorizationSummary> {
    const now = new Date().toISOString();
    const record: RecoveryExecutionAuthorizationSummary = {
      ...data as RecoveryExecutionAuthorizationSummary,
      authorizationSummaryId: data.authorizationSummaryId || crypto.randomUUID(),
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
    };
    this.store.set(record.authorizationSummaryId, record);
    return record;
  }

  async getById(schoolId: string, id: string): Promise<RecoveryExecutionAuthorizationSummary | null> {
    const record = this.store.get(id) ?? null;
    if (record && record.schoolId !== schoolId) return null;
    return record;
  }

  async listBySchool(schoolId: string): Promise<RecoveryExecutionAuthorizationSummary[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryExecutionAuthorizationSummary[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.studentRef === studentRef);
  }

  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryExecutionAuthorizationSummary[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultRecoveryPlanId === planId);
  }

  async update(id: string, data: Partial<RecoveryExecutionAuthorizationSummary>): Promise<RecoveryExecutionAuthorizationSummary> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`AuthorizationSummary ${id} not found`);
    const updated: RecoveryExecutionAuthorizationSummary = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
  }
}

interface AuditRecord {
  auditEventId: string;
  schoolId: string;
  eventType: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export class InMemoryAuthorizationAuditRepository implements RecoveryExecutionAuthorizationAuditRepository {
  private store = new Map<string, AuditRecord>();

  async create(data: Partial<any>): Promise<any> {
    const now = new Date().toISOString();
    const record = {
      ...data,
      auditEventId: data.auditEventId || crypto.randomUUID(),
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
    } as AuditRecord;
    this.store.set(record.auditEventId, record);
    return record;
  }

  async listBySchool(schoolId: string): Promise<any[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByEventType(schoolId: string, eventType: string): Promise<any[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.eventType === eventType);
  }
}

interface IdempotencyRecord {
  idempotencyId: string;
  schoolId: string;
  operation: string;
  idempotencyKey: string;
  status: string;
  resourceType?: string;
  resourceId?: string;
  safeResultSummary?: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export class InMemoryAuthorizationIdempotencyRepository implements RecoveryExecutionAuthorizationIdempotencyRepository {
  private store = new Map<string, IdempotencyRecord>();

  async create(data: Partial<any>): Promise<any> {
    const now = new Date().toISOString();
    const record = {
      ...data,
      idempotencyId: data.idempotencyId || crypto.randomUUID(),
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
    } as IdempotencyRecord;
    this.store.set(record.idempotencyId, record);
    return record;
  }

  async getByKey(schoolId: string, operation: string, idempotencyKey: string): Promise<any | null> {
    return Array.from(this.store.values())
      .find(r => r.schoolId === schoolId && r.operation === operation && r.idempotencyKey === idempotencyKey) ?? null;
  }

  async updateStatus(id: string, status: string, resourceType?: string, resourceId?: string, safeResultSummary?: string): Promise<any> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`IdempotencyRecord ${id} not found`);
    const updated = {
      ...existing,
      status,
      ...(resourceType !== undefined ? { resourceType } : {}),
      ...(resourceId !== undefined ? { resourceId } : {}),
      ...(safeResultSummary !== undefined ? { safeResultSummary } : {}),
      updatedAt: new Date().toISOString(),
    } as IdempotencyRecord;
    this.store.set(id, updated);
    return updated;
  }

  async listExpired(): Promise<any[]> {
    const now = new Date();
    return Array.from(this.store.values()).filter(r => {
      const age = now.getTime() - new Date(r.createdAt).getTime();
      return age > 24 * 60 * 60 * 1000;
    });
  }
}

export class InMemoryRecoveryExecutionAuthorizationPreviewRepositories {
  authorizationReadiness: InMemoryAuthorizationPreviewReadinessRepository;
  authorizationRequestDraft: InMemoryAuthorizationRequestDraftRepository;
  authorizationEligibilityCheck: InMemoryAuthorizationEligibilityCheckRepository;
  authorityMatrixSnapshot: InMemoryAuthorityMatrixSnapshotRepository;
  approvalChainDraft: InMemoryApprovalChainDraftRepository;
  riskAttestation: InMemoryRiskAttestationRepository;
  consentBoundaryCheck: InMemoryConsentBoundaryCheckRepository;
  veto: InMemoryVetoRepository;
  preflightChecklist: InMemoryPreflightChecklistRepository;
  authorizationDryRun: InMemoryAuthorizationDryRunRepository;
  preLiveDecisionPacket: InMemoryPreLiveDecisionPacketRepository;
  mockAuthorizationReceipt: InMemoryMockAuthorizationReceiptRepository;
  authorizationSummary: InMemoryAuthorizationSummaryRepository;
  authorizationAudit: InMemoryAuthorizationAuditRepository;
  authorizationIdempotency: InMemoryAuthorizationIdempotencyRepository;

  constructor() {
    this.authorizationReadiness = new InMemoryAuthorizationPreviewReadinessRepository();
    this.authorizationRequestDraft = new InMemoryAuthorizationRequestDraftRepository();
    this.authorizationEligibilityCheck = new InMemoryAuthorizationEligibilityCheckRepository();
    this.authorityMatrixSnapshot = new InMemoryAuthorityMatrixSnapshotRepository();
    this.approvalChainDraft = new InMemoryApprovalChainDraftRepository();
    this.riskAttestation = new InMemoryRiskAttestationRepository();
    this.consentBoundaryCheck = new InMemoryConsentBoundaryCheckRepository();
    this.veto = new InMemoryVetoRepository();
    this.preflightChecklist = new InMemoryPreflightChecklistRepository();
    this.authorizationDryRun = new InMemoryAuthorizationDryRunRepository();
    this.preLiveDecisionPacket = new InMemoryPreLiveDecisionPacketRepository();
    this.mockAuthorizationReceipt = new InMemoryMockAuthorizationReceiptRepository();
    this.authorizationSummary = new InMemoryAuthorizationSummaryRepository();
    this.authorizationAudit = new InMemoryAuthorizationAuditRepository();
    this.authorizationIdempotency = new InMemoryAuthorizationIdempotencyRepository();
  }
}
