import { PrismaClient } from '@prisma/client';
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

export class PrismaAuthorizationPreviewReadinessRepository implements RecoveryExecutionAuthorizationPreviewReadinessRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Partial<RecoveryExecutionAuthorizationPreviewReadiness>): Promise<RecoveryExecutionAuthorizationPreviewReadiness> {
    const created = await this.prisma.recoveryExecutionAuthorizationPreviewReadinessRecord.create({ data: this.toPrisma(data) });
    return this.fromPrisma(created);
  }

  async getById(schoolId: string, id: string): Promise<RecoveryExecutionAuthorizationPreviewReadiness | null> {
    const found = await this.prisma.recoveryExecutionAuthorizationPreviewReadinessRecord.findUnique({ where: { authorizationReadinessId: id } });
    if (!found || found.schoolId !== schoolId) return null;
    return this.fromPrisma(found);
  }

  async listBySchool(schoolId: string): Promise<RecoveryExecutionAuthorizationPreviewReadiness[]> {
    const records = await this.prisma.recoveryExecutionAuthorizationPreviewReadinessRecord.findMany({ where: { schoolId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryExecutionAuthorizationPreviewReadiness[]> {
    const records = await this.prisma.recoveryExecutionAuthorizationPreviewReadinessRecord.findMany({ where: { schoolId, studentRef } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryExecutionAuthorizationPreviewReadiness[]> {
    const records = await this.prisma.recoveryExecutionAuthorizationPreviewReadinessRecord.findMany({ where: { schoolId, resultRecoveryPlanId: planId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByStatus(schoolId: string, status: string): Promise<RecoveryExecutionAuthorizationPreviewReadiness[]> {
    const records = await this.prisma.recoveryExecutionAuthorizationPreviewReadinessRecord.findMany({ where: { schoolId, status } });
    return records.map(r => this.fromPrisma(r));
  }

  async update(id: string, data: Partial<RecoveryExecutionAuthorizationPreviewReadiness>): Promise<RecoveryExecutionAuthorizationPreviewReadiness> {
    const updated = await this.prisma.recoveryExecutionAuthorizationPreviewReadinessRecord.update({
      where: { authorizationReadinessId: id },
      data: this.toPrisma(data),
    });
    return this.fromPrisma(updated);
  }

  private toPrisma(data: any): any {
    const { ...rest } = data;
    return rest;
  }

  private fromPrisma(data: any): RecoveryExecutionAuthorizationPreviewReadiness {
    return {
      ...data,
      sourceRefsJson: parseJsonField(data.sourceRefsJson),
      blockedReasonCodesJson: parseStringArray(data.blockedReasonCodesJson),
      createdAt: toDateString(data.createdAt) || '',
      updatedAt: toDateString(data.updatedAt) || '',
      reviewReadyAt: toDateString(data.reviewReadyAt),
      authorizationPreviewReadyAt: toDateString(data.authorizationPreviewReadyAt),
      suppressedAt: toDateString(data.suppressedAt),
      blockedAt: toDateString(data.blockedAt),
      voidedAt: toDateString(data.voidedAt),
    } as RecoveryExecutionAuthorizationPreviewReadiness;
  }
}

export class PrismaAuthorizationRequestDraftRepository implements RecoveryExecutionAuthorizationRequestDraftRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Partial<RecoveryExecutionAuthorizationRequestDraft>): Promise<RecoveryExecutionAuthorizationRequestDraft> {
    const created = await this.prisma.recoveryExecutionAuthorizationRequestDraftRecord.create({ data: this.toPrisma(data) });
    return this.fromPrisma(created);
  }

  async getById(schoolId: string, id: string): Promise<RecoveryExecutionAuthorizationRequestDraft | null> {
    const found = await this.prisma.recoveryExecutionAuthorizationRequestDraftRecord.findUnique({ where: { authorizationRequestDraftId: id } });
    if (!found || found.schoolId !== schoolId) return null;
    return this.fromPrisma(found);
  }

  async listBySchool(schoolId: string): Promise<RecoveryExecutionAuthorizationRequestDraft[]> {
    const records = await this.prisma.recoveryExecutionAuthorizationRequestDraftRecord.findMany({ where: { schoolId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryExecutionAuthorizationRequestDraft[]> {
    const records = await this.prisma.recoveryExecutionAuthorizationRequestDraftRecord.findMany({ where: { schoolId, studentRef } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryExecutionAuthorizationRequestDraft[]> {
    const records = await this.prisma.recoveryExecutionAuthorizationRequestDraftRecord.findMany({ where: { schoolId, resultRecoveryPlanId: planId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByStatus(schoolId: string, status: string): Promise<RecoveryExecutionAuthorizationRequestDraft[]> {
    const records = await this.prisma.recoveryExecutionAuthorizationRequestDraftRecord.findMany({ where: { schoolId, requestStatus: status } });
    return records.map(r => this.fromPrisma(r));
  }

  async update(id: string, data: Partial<RecoveryExecutionAuthorizationRequestDraft>): Promise<RecoveryExecutionAuthorizationRequestDraft> {
    const updated = await this.prisma.recoveryExecutionAuthorizationRequestDraftRecord.update({
      where: { authorizationRequestDraftId: id },
      data: this.toPrisma(data),
    });
    return this.fromPrisma(updated);
  }

  private toPrisma(data: any): any {
    const { ...rest } = data;
    return rest;
  }

  private fromPrisma(data: any): RecoveryExecutionAuthorizationRequestDraft {
    return {
      ...data,
      requestedActionsJson: parseJsonField(data.requestedActionsJson),
      requestedApproversJson: parseJsonField(data.requestedApproversJson),
      sourceRefsJson: parseJsonField(data.sourceRefsJson),
      blockedReasonCodesJson: parseStringArray(data.blockedReasonCodesJson),
      createdAt: toDateString(data.createdAt) || '',
      updatedAt: toDateString(data.updatedAt) || '',
      reviewReadyAt: toDateString(data.reviewReadyAt),
      authorizationPreviewReadyAt: toDateString(data.authorizationPreviewReadyAt),
      suppressedAt: toDateString(data.suppressedAt),
      blockedAt: toDateString(data.blockedAt),
      voidedAt: toDateString(data.voidedAt),
    } as RecoveryExecutionAuthorizationRequestDraft;
  }
}

export class PrismaAuthorizationEligibilityCheckRepository implements RecoveryExecutionAuthorizationEligibilityCheckRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Partial<RecoveryExecutionAuthorizationEligibilityCheck>): Promise<RecoveryExecutionAuthorizationEligibilityCheck> {
    const created = await this.prisma.recoveryExecutionAuthorizationEligibilityCheckRecord.create({ data: this.toPrisma(data) });
    return this.fromPrisma(created);
  }

  async getById(schoolId: string, id: string): Promise<RecoveryExecutionAuthorizationEligibilityCheck | null> {
    const found = await this.prisma.recoveryExecutionAuthorizationEligibilityCheckRecord.findUnique({ where: { authorizationEligibilityCheckId: id } });
    if (!found || found.schoolId !== schoolId) return null;
    return this.fromPrisma(found);
  }

  async listBySchool(schoolId: string): Promise<RecoveryExecutionAuthorizationEligibilityCheck[]> {
    const records = await this.prisma.recoveryExecutionAuthorizationEligibilityCheckRecord.findMany({ where: { schoolId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryExecutionAuthorizationEligibilityCheck[]> {
    const records = await this.prisma.recoveryExecutionAuthorizationEligibilityCheckRecord.findMany({ where: { schoolId, resultRecoveryPlanId: planId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByDecision(schoolId: string, decision: string): Promise<RecoveryExecutionAuthorizationEligibilityCheck[]> {
    const records = await this.prisma.recoveryExecutionAuthorizationEligibilityCheckRecord.findMany({ where: { schoolId, decision } });
    return records.map(r => this.fromPrisma(r));
  }

  async update(id: string, data: Partial<RecoveryExecutionAuthorizationEligibilityCheck>): Promise<RecoveryExecutionAuthorizationEligibilityCheck> {
    const updated = await this.prisma.recoveryExecutionAuthorizationEligibilityCheckRecord.update({
      where: { authorizationEligibilityCheckId: id },
      data: this.toPrisma(data),
    });
    return this.fromPrisma(updated);
  }

  private toPrisma(data: any): any {
    const { ...rest } = data;
    return rest;
  }

  private fromPrisma(data: any): RecoveryExecutionAuthorizationEligibilityCheck {
    return {
      ...data,
      eligibilityDetailsJson: parseJsonField(data.eligibilityDetailsJson),
      sourceRefsJson: parseJsonField(data.sourceRefsJson),
      blockedReasonCodesJson: parseStringArray(data.blockedReasonCodesJson),
      createdAt: toDateString(data.createdAt) || '',
      updatedAt: toDateString(data.updatedAt) || '',
      reviewReadyAt: toDateString(data.reviewReadyAt),
      blockedAt: toDateString(data.blockedAt),
      voidedAt: toDateString(data.voidedAt),
    } as RecoveryExecutionAuthorizationEligibilityCheck;
  }
}

export class PrismaAuthorityMatrixSnapshotRepository implements RecoveryExecutionAuthorityMatrixSnapshotRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Partial<RecoveryExecutionAuthorityMatrixSnapshot>): Promise<RecoveryExecutionAuthorityMatrixSnapshot> {
    const created = await this.prisma.recoveryExecutionAuthorityMatrixSnapshotRecord.create({ data: this.toPrisma(data) });
    return this.fromPrisma(created);
  }

  async getById(schoolId: string, id: string): Promise<RecoveryExecutionAuthorityMatrixSnapshot | null> {
    const found = await this.prisma.recoveryExecutionAuthorityMatrixSnapshotRecord.findUnique({ where: { authorityMatrixSnapshotId: id } });
    if (!found || found.schoolId !== schoolId) return null;
    return this.fromPrisma(found);
  }

  async listBySchool(schoolId: string): Promise<RecoveryExecutionAuthorityMatrixSnapshot[]> {
    const records = await this.prisma.recoveryExecutionAuthorityMatrixSnapshotRecord.findMany({ where: { schoolId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryExecutionAuthorityMatrixSnapshot[]> {
    const records = await this.prisma.recoveryExecutionAuthorityMatrixSnapshotRecord.findMany({ where: { schoolId, resultRecoveryPlanId: planId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByStatus(schoolId: string, status: string): Promise<RecoveryExecutionAuthorityMatrixSnapshot[]> {
    const records = await this.prisma.recoveryExecutionAuthorityMatrixSnapshotRecord.findMany({ where: { schoolId, snapshotStatus: status } });
    return records.map(r => this.fromPrisma(r));
  }

  async update(id: string, data: Partial<RecoveryExecutionAuthorityMatrixSnapshot>): Promise<RecoveryExecutionAuthorityMatrixSnapshot> {
    const updated = await this.prisma.recoveryExecutionAuthorityMatrixSnapshotRecord.update({
      where: { authorityMatrixSnapshotId: id },
      data: this.toPrisma(data),
    });
    return this.fromPrisma(updated);
  }

  private toPrisma(data: any): any {
    const { ...rest } = data;
    return rest;
  }

  private fromPrisma(data: any): RecoveryExecutionAuthorityMatrixSnapshot {
    return {
      ...data,
      authorityMatrixJson: parseJsonField(data.authorityMatrixJson),
      rolePermissionsJson: parseJsonField(data.rolePermissionsJson),
      sourceRefsJson: parseJsonField(data.sourceRefsJson),
      blockedReasonCodesJson: parseStringArray(data.blockedReasonCodesJson),
      createdAt: toDateString(data.createdAt) || '',
      updatedAt: toDateString(data.updatedAt) || '',
      reviewReadyAt: toDateString(data.reviewReadyAt),
      approvalChainReadyAt: toDateString(data.approvalChainReadyAt),
      suppressedAt: toDateString(data.suppressedAt),
      blockedAt: toDateString(data.blockedAt),
      voidedAt: toDateString(data.voidedAt),
    } as RecoveryExecutionAuthorityMatrixSnapshot;
  }
}

export class PrismaApprovalChainDraftRepository implements RecoveryExecutionApprovalChainDraftRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Partial<RecoveryExecutionApprovalChainDraft>): Promise<RecoveryExecutionApprovalChainDraft> {
    const created = await this.prisma.recoveryExecutionApprovalChainDraftRecord.create({ data: this.toPrisma(data) });
    return this.fromPrisma(created);
  }

  async getById(schoolId: string, id: string): Promise<RecoveryExecutionApprovalChainDraft | null> {
    const found = await this.prisma.recoveryExecutionApprovalChainDraftRecord.findUnique({ where: { approvalChainDraftId: id } });
    if (!found || found.schoolId !== schoolId) return null;
    return this.fromPrisma(found);
  }

  async listBySchool(schoolId: string): Promise<RecoveryExecutionApprovalChainDraft[]> {
    const records = await this.prisma.recoveryExecutionApprovalChainDraftRecord.findMany({ where: { schoolId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryExecutionApprovalChainDraft[]> {
    const records = await this.prisma.recoveryExecutionApprovalChainDraftRecord.findMany({ where: { schoolId, resultRecoveryPlanId: planId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByApproverRef(schoolId: string, approverRef: string): Promise<RecoveryExecutionApprovalChainDraft[]> {
    const records = await this.prisma.recoveryExecutionApprovalChainDraftRecord.findMany({ where: { schoolId } });
    return records.filter(r => {
      const refs = typeof r.approverRefsJson === 'object' ? r.approverRefsJson as any : {};
      return refs.approverRef === approverRef;
    }).map(r => this.fromPrisma(r));
  }

  async listByStatus(schoolId: string, status: string): Promise<RecoveryExecutionApprovalChainDraft[]> {
    const records = await this.prisma.recoveryExecutionApprovalChainDraftRecord.findMany({ where: { schoolId, chainStatus: status } });
    return records.map(r => this.fromPrisma(r));
  }

  async update(id: string, data: Partial<RecoveryExecutionApprovalChainDraft>): Promise<RecoveryExecutionApprovalChainDraft> {
    const updated = await this.prisma.recoveryExecutionApprovalChainDraftRecord.update({
      where: { approvalChainDraftId: id },
      data: this.toPrisma(data),
    });
    return this.fromPrisma(updated);
  }

  private toPrisma(data: any): any {
    const { ...rest } = data;
    return rest;
  }

  private fromPrisma(data: any): RecoveryExecutionApprovalChainDraft {
    return {
      ...data,
      approvalChainJson: parseJsonField(data.approvalChainJson),
      approverRefsJson: parseJsonField(data.approverRefsJson),
      sourceRefsJson: parseJsonField(data.sourceRefsJson),
      blockedReasonCodesJson: parseStringArray(data.blockedReasonCodesJson),
      createdAt: toDateString(data.createdAt) || '',
      updatedAt: toDateString(data.updatedAt) || '',
      reviewReadyAt: toDateString(data.reviewReadyAt),
      approvalChainReadyAt: toDateString(data.approvalChainReadyAt),
      suppressedAt: toDateString(data.suppressedAt),
      blockedAt: toDateString(data.blockedAt),
      voidedAt: toDateString(data.voidedAt),
    } as RecoveryExecutionApprovalChainDraft;
  }
}

export class PrismaRiskAttestationRepository implements RecoveryExecutionRiskAttestationRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Partial<RecoveryExecutionRiskAttestation>): Promise<RecoveryExecutionRiskAttestation> {
    const created = await this.prisma.recoveryExecutionRiskAttestationRecord.create({ data: this.toPrisma(data) });
    return this.fromPrisma(created);
  }

  async getById(schoolId: string, id: string): Promise<RecoveryExecutionRiskAttestation | null> {
    const found = await this.prisma.recoveryExecutionRiskAttestationRecord.findUnique({ where: { riskAttestationId: id } });
    if (!found || found.schoolId !== schoolId) return null;
    return this.fromPrisma(found);
  }

  async listBySchool(schoolId: string): Promise<RecoveryExecutionRiskAttestation[]> {
    const records = await this.prisma.recoveryExecutionRiskAttestationRecord.findMany({ where: { schoolId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryExecutionRiskAttestation[]> {
    const records = await this.prisma.recoveryExecutionRiskAttestationRecord.findMany({ where: { schoolId, resultRecoveryPlanId: planId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByRiskLevel(schoolId: string, riskLevel: string): Promise<RecoveryExecutionRiskAttestation[]> {
    const records = await this.prisma.recoveryExecutionRiskAttestationRecord.findMany({ where: { schoolId, riskLevel } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByStatus(schoolId: string, status: string): Promise<RecoveryExecutionRiskAttestation[]> {
    const records = await this.prisma.recoveryExecutionRiskAttestationRecord.findMany({ where: { schoolId, attestationStatus: status } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByActorRef(schoolId: string, actorRef: string): Promise<RecoveryExecutionRiskAttestation[]> {
    const records = await this.prisma.recoveryExecutionRiskAttestationRecord.findMany({ where: { schoolId, attestorActorId: actorRef } });
    return records.map(r => this.fromPrisma(r));
  }

  async update(id: string, data: Partial<RecoveryExecutionRiskAttestation>): Promise<RecoveryExecutionRiskAttestation> {
    const updated = await this.prisma.recoveryExecutionRiskAttestationRecord.update({
      where: { riskAttestationId: id },
      data: this.toPrisma(data),
    });
    return this.fromPrisma(updated);
  }

  private toPrisma(data: any): any {
    const { ...rest } = data;
    return rest;
  }

  private fromPrisma(data: any): RecoveryExecutionRiskAttestation {
    return {
      ...data,
      riskDetailsJson: parseJsonField(data.riskDetailsJson),
      mitigationsJson: parseJsonField(data.mitigationsJson),
      sourceRefsJson: parseJsonField(data.sourceRefsJson),
      blockedReasonCodesJson: parseStringArray(data.blockedReasonCodesJson),
      createdAt: toDateString(data.createdAt) || '',
      updatedAt: toDateString(data.updatedAt) || '',
      reviewReadyAt: toDateString(data.reviewReadyAt),
      riskAttestedAt: toDateString(data.riskAttestedAt),
      vetoedAt: toDateString(data.vetoedAt),
      suppressedAt: toDateString(data.suppressedAt),
      blockedAt: toDateString(data.blockedAt),
      voidedAt: toDateString(data.voidedAt),
    } as RecoveryExecutionRiskAttestation;
  }
}

export class PrismaConsentBoundaryCheckRepository implements RecoveryExecutionConsentBoundaryCheckRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Partial<RecoveryExecutionConsentBoundaryCheck>): Promise<RecoveryExecutionConsentBoundaryCheck> {
    const created = await this.prisma.recoveryExecutionConsentBoundaryCheckRecord.create({ data: this.toPrisma(data) });
    return this.fromPrisma(created);
  }

  async getById(schoolId: string, id: string): Promise<RecoveryExecutionConsentBoundaryCheck | null> {
    const found = await this.prisma.recoveryExecutionConsentBoundaryCheckRecord.findUnique({ where: { consentBoundaryCheckId: id } });
    if (!found || found.schoolId !== schoolId) return null;
    return this.fromPrisma(found);
  }

  async listBySchool(schoolId: string): Promise<RecoveryExecutionConsentBoundaryCheck[]> {
    const records = await this.prisma.recoveryExecutionConsentBoundaryCheckRecord.findMany({ where: { schoolId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryExecutionConsentBoundaryCheck[]> {
    const records = await this.prisma.recoveryExecutionConsentBoundaryCheckRecord.findMany({ where: { schoolId, resultRecoveryPlanId: planId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByDecision(schoolId: string, decision: string): Promise<RecoveryExecutionConsentBoundaryCheck[]> {
    const records = await this.prisma.recoveryExecutionConsentBoundaryCheckRecord.findMany({ where: { schoolId, decision } });
    return records.map(r => this.fromPrisma(r));
  }

  async update(id: string, data: Partial<RecoveryExecutionConsentBoundaryCheck>): Promise<RecoveryExecutionConsentBoundaryCheck> {
    const updated = await this.prisma.recoveryExecutionConsentBoundaryCheckRecord.update({
      where: { consentBoundaryCheckId: id },
      data: this.toPrisma(data),
    });
    return this.fromPrisma(updated);
  }

  private toPrisma(data: any): any {
    const { ...rest } = data;
    return rest;
  }

  private fromPrisma(data: any): RecoveryExecutionConsentBoundaryCheck {
    return {
      ...data,
      consentBoundaryDetailsJson: parseJsonField(data.consentBoundaryDetailsJson),
      sourceRefsJson: parseJsonField(data.sourceRefsJson),
      blockedReasonCodesJson: parseStringArray(data.blockedReasonCodesJson),
      createdAt: toDateString(data.createdAt) || '',
      updatedAt: toDateString(data.updatedAt) || '',
      reviewReadyAt: toDateString(data.reviewReadyAt),
      blockedAt: toDateString(data.blockedAt),
      voidedAt: toDateString(data.voidedAt),
    } as RecoveryExecutionConsentBoundaryCheck;
  }
}

export class PrismaVetoRepository implements RecoveryExecutionVetoRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Partial<RecoveryExecutionVeto>): Promise<RecoveryExecutionVeto> {
    const created = await this.prisma.recoveryExecutionVetoRecord.create({ data: this.toPrisma(data) });
    return this.fromPrisma(created);
  }

  async getById(schoolId: string, id: string): Promise<RecoveryExecutionVeto | null> {
    const found = await this.prisma.recoveryExecutionVetoRecord.findUnique({ where: { vetoId: id } });
    if (!found || found.schoolId !== schoolId) return null;
    return this.fromPrisma(found);
  }

  async listBySchool(schoolId: string): Promise<RecoveryExecutionVeto[]> {
    const records = await this.prisma.recoveryExecutionVetoRecord.findMany({ where: { schoolId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryExecutionVeto[]> {
    const records = await this.prisma.recoveryExecutionVetoRecord.findMany({ where: { schoolId, resultRecoveryPlanId: planId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByReason(schoolId: string, reason: string): Promise<RecoveryExecutionVeto[]> {
    const records = await this.prisma.recoveryExecutionVetoRecord.findMany({ where: { schoolId, vetoReason: reason } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByActor(schoolId: string, actorRef: string): Promise<RecoveryExecutionVeto[]> {
    const records = await this.prisma.recoveryExecutionVetoRecord.findMany({ where: { schoolId, vetoActorId: actorRef } });
    return records.map(r => this.fromPrisma(r));
  }

  async update(id: string, data: Partial<RecoveryExecutionVeto>): Promise<RecoveryExecutionVeto> {
    const updated = await this.prisma.recoveryExecutionVetoRecord.update({
      where: { vetoId: id },
      data: this.toPrisma(data),
    });
    return this.fromPrisma(updated);
  }

  private toPrisma(data: any): any {
    const { ...rest } = data;
    return rest;
  }

  private fromPrisma(data: any): RecoveryExecutionVeto {
    return {
      ...data,
      vetoDetailsJson: parseJsonField(data.vetoDetailsJson),
      sourceRefsJson: parseJsonField(data.sourceRefsJson),
      blockedReasonCodesJson: parseStringArray(data.blockedReasonCodesJson),
      createdAt: toDateString(data.createdAt) || '',
      updatedAt: toDateString(data.updatedAt) || '',
      reviewReadyAt: toDateString(data.reviewReadyAt),
      suppressedAt: toDateString(data.suppressedAt),
      voidedAt: toDateString(data.voidedAt),
    } as RecoveryExecutionVeto;
  }
}

export class PrismaPreflightChecklistRepository implements RecoveryExecutionPreflightChecklistRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Partial<RecoveryExecutionPreflightChecklist>): Promise<RecoveryExecutionPreflightChecklist> {
    const created = await this.prisma.recoveryExecutionPreflightChecklistRecord.create({ data: this.toPrisma(data) });
    return this.fromPrisma(created);
  }

  async getById(schoolId: string, id: string): Promise<RecoveryExecutionPreflightChecklist | null> {
    const found = await this.prisma.recoveryExecutionPreflightChecklistRecord.findUnique({ where: { preflightChecklistId: id } });
    if (!found || found.schoolId !== schoolId) return null;
    return this.fromPrisma(found);
  }

  async listBySchool(schoolId: string): Promise<RecoveryExecutionPreflightChecklist[]> {
    const records = await this.prisma.recoveryExecutionPreflightChecklistRecord.findMany({ where: { schoolId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryExecutionPreflightChecklist[]> {
    const records = await this.prisma.recoveryExecutionPreflightChecklistRecord.findMany({ where: { schoolId, resultRecoveryPlanId: planId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByStatus(schoolId: string, status: string): Promise<RecoveryExecutionPreflightChecklist[]> {
    const records = await this.prisma.recoveryExecutionPreflightChecklistRecord.findMany({ where: { schoolId, checklistStatus: status } });
    return records.map(r => this.fromPrisma(r));
  }

  async update(id: string, data: Partial<RecoveryExecutionPreflightChecklist>): Promise<RecoveryExecutionPreflightChecklist> {
    const updated = await this.prisma.recoveryExecutionPreflightChecklistRecord.update({
      where: { preflightChecklistId: id },
      data: this.toPrisma(data),
    });
    return this.fromPrisma(updated);
  }

  private toPrisma(data: any): any {
    const { ...rest } = data;
    return rest;
  }

  private fromPrisma(data: any): RecoveryExecutionPreflightChecklist {
    return {
      ...data,
      checklistItemsJson: parseJsonField(data.checklistItemsJson),
      passedItemsJson: parseJsonField(data.passedItemsJson),
      failedItemsJson: parseJsonField(data.failedItemsJson),
      sourceRefsJson: parseJsonField(data.sourceRefsJson),
      blockedReasonCodesJson: parseStringArray(data.blockedReasonCodesJson),
      createdAt: toDateString(data.createdAt) || '',
      updatedAt: toDateString(data.updatedAt) || '',
      reviewReadyAt: toDateString(data.reviewReadyAt),
      authorizationPreviewReadyAt: toDateString(data.authorizationPreviewReadyAt),
      blockedAt: toDateString(data.blockedAt),
      voidedAt: toDateString(data.voidedAt),
    } as RecoveryExecutionPreflightChecklist;
  }
}

export class PrismaAuthorizationDryRunRepository implements RecoveryExecutionAuthorizationDryRunRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Partial<RecoveryExecutionAuthorizationDryRun>): Promise<RecoveryExecutionAuthorizationDryRun> {
    const created = await this.prisma.recoveryExecutionAuthorizationDryRunRecord.create({ data: this.toPrisma(data) });
    return this.fromPrisma(created);
  }

  async getById(schoolId: string, id: string): Promise<RecoveryExecutionAuthorizationDryRun | null> {
    const found = await this.prisma.recoveryExecutionAuthorizationDryRunRecord.findUnique({ where: { authorizationDryRunId: id } });
    if (!found || found.schoolId !== schoolId) return null;
    return this.fromPrisma(found);
  }

  async listBySchool(schoolId: string): Promise<RecoveryExecutionAuthorizationDryRun[]> {
    const records = await this.prisma.recoveryExecutionAuthorizationDryRunRecord.findMany({ where: { schoolId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryExecutionAuthorizationDryRun[]> {
    const records = await this.prisma.recoveryExecutionAuthorizationDryRunRecord.findMany({ where: { schoolId, resultRecoveryPlanId: planId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByDecision(schoolId: string, decision: string): Promise<RecoveryExecutionAuthorizationDryRun[]> {
    const records = await this.prisma.recoveryExecutionAuthorizationDryRunRecord.findMany({ where: { schoolId, dryRunDecision: decision } });
    return records.map(r => this.fromPrisma(r));
  }

  async update(id: string, data: Partial<RecoveryExecutionAuthorizationDryRun>): Promise<RecoveryExecutionAuthorizationDryRun> {
    const updated = await this.prisma.recoveryExecutionAuthorizationDryRunRecord.update({
      where: { authorizationDryRunId: id },
      data: this.toPrisma(data),
    });
    return this.fromPrisma(updated);
  }

  private toPrisma(data: any): any {
    const { ...rest } = data;
    return rest;
  }

  private fromPrisma(data: any): RecoveryExecutionAuthorizationDryRun {
    return {
      ...data,
      dryRunDetailsJson: parseJsonField(data.dryRunDetailsJson),
      mockApprovalsJson: parseJsonField(data.mockApprovalsJson),
      mockDenialsJson: parseJsonField(data.mockDenialsJson),
      sourceRefsJson: parseJsonField(data.sourceRefsJson),
      blockedReasonCodesJson: parseStringArray(data.blockedReasonCodesJson),
      createdAt: toDateString(data.createdAt) || '',
      updatedAt: toDateString(data.updatedAt) || '',
      reviewReadyAt: toDateString(data.reviewReadyAt),
      mockAuthorizedAt: toDateString(data.mockAuthorizedAt),
      mockDeniedAt: toDateString(data.mockDeniedAt),
      voidedAt: toDateString(data.voidedAt),
    } as RecoveryExecutionAuthorizationDryRun;
  }
}

export class PrismaPreLiveDecisionPacketRepository implements RecoveryExecutionPreLiveDecisionPacketRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Partial<RecoveryExecutionPreLiveDecisionPacket>): Promise<RecoveryExecutionPreLiveDecisionPacket> {
    const created = await this.prisma.recoveryExecutionPreLiveDecisionPacketRecord.create({ data: this.toPrisma(data) });
    return this.fromPrisma(created);
  }

  async getById(schoolId: string, id: string): Promise<RecoveryExecutionPreLiveDecisionPacket | null> {
    const found = await this.prisma.recoveryExecutionPreLiveDecisionPacketRecord.findUnique({ where: { preLiveDecisionPacketId: id } });
    if (!found || found.schoolId !== schoolId) return null;
    return this.fromPrisma(found);
  }

  async listBySchool(schoolId: string): Promise<RecoveryExecutionPreLiveDecisionPacket[]> {
    const records = await this.prisma.recoveryExecutionPreLiveDecisionPacketRecord.findMany({ where: { schoolId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryExecutionPreLiveDecisionPacket[]> {
    const records = await this.prisma.recoveryExecutionPreLiveDecisionPacketRecord.findMany({ where: { schoolId, resultRecoveryPlanId: planId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByStatus(schoolId: string, status: string): Promise<RecoveryExecutionPreLiveDecisionPacket[]> {
    const records = await this.prisma.recoveryExecutionPreLiveDecisionPacketRecord.findMany({ where: { schoolId, packetStatus: status } });
    return records.map(r => this.fromPrisma(r));
  }

  async update(id: string, data: Partial<RecoveryExecutionPreLiveDecisionPacket>): Promise<RecoveryExecutionPreLiveDecisionPacket> {
    const updated = await this.prisma.recoveryExecutionPreLiveDecisionPacketRecord.update({
      where: { preLiveDecisionPacketId: id },
      data: this.toPrisma(data),
    });
    return this.fromPrisma(updated);
  }

  private toPrisma(data: any): any {
    const { ...rest } = data;
    return rest;
  }

  private fromPrisma(data: any): RecoveryExecutionPreLiveDecisionPacket {
    return {
      ...data,
      decisionPacketJson: parseJsonField(data.decisionPacketJson),
      authorizationChainJson: parseJsonField(data.authorizationChainJson),
      riskSummaryJson: parseJsonField(data.riskSummaryJson),
      sourceRefsJson: parseJsonField(data.sourceRefsJson),
      blockedReasonCodesJson: parseStringArray(data.blockedReasonCodesJson),
      createdAt: toDateString(data.createdAt) || '',
      updatedAt: toDateString(data.updatedAt) || '',
      reviewReadyAt: toDateString(data.reviewReadyAt),
      authorizationPreviewReadyAt: toDateString(data.authorizationPreviewReadyAt),
      suppressedAt: toDateString(data.suppressedAt),
      blockedAt: toDateString(data.blockedAt),
      voidedAt: toDateString(data.voidedAt),
    } as RecoveryExecutionPreLiveDecisionPacket;
  }
}

export class PrismaMockAuthorizationReceiptRepository implements RecoveryExecutionMockAuthorizationReceiptRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Partial<RecoveryExecutionMockAuthorizationReceipt>): Promise<RecoveryExecutionMockAuthorizationReceipt> {
    const created = await this.prisma.recoveryExecutionMockAuthorizationReceiptRecord.create({ data: this.toPrisma(data) });
    return this.fromPrisma(created);
  }

  async getById(schoolId: string, id: string): Promise<RecoveryExecutionMockAuthorizationReceipt | null> {
    const found = await this.prisma.recoveryExecutionMockAuthorizationReceiptRecord.findUnique({ where: { mockAuthorizationReceiptId: id } });
    if (!found || found.schoolId !== schoolId) return null;
    return this.fromPrisma(found);
  }

  async listBySchool(schoolId: string): Promise<RecoveryExecutionMockAuthorizationReceipt[]> {
    const records = await this.prisma.recoveryExecutionMockAuthorizationReceiptRecord.findMany({ where: { schoolId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryExecutionMockAuthorizationReceipt[]> {
    const records = await this.prisma.recoveryExecutionMockAuthorizationReceiptRecord.findMany({ where: { schoolId, resultRecoveryPlanId: planId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByDecision(schoolId: string, decision: string): Promise<RecoveryExecutionMockAuthorizationReceipt[]> {
    const records = await this.prisma.recoveryExecutionMockAuthorizationReceiptRecord.findMany({ where: { schoolId, receiptDecision: decision } });
    return records.map(r => this.fromPrisma(r));
  }

  async update(id: string, data: Partial<RecoveryExecutionMockAuthorizationReceipt>): Promise<RecoveryExecutionMockAuthorizationReceipt> {
    const updated = await this.prisma.recoveryExecutionMockAuthorizationReceiptRecord.update({
      where: { mockAuthorizationReceiptId: id },
      data: this.toPrisma(data),
    });
    return this.fromPrisma(updated);
  }

  private toPrisma(data: any): any {
    const { ...rest } = data;
    return rest;
  }

  private fromPrisma(data: any): RecoveryExecutionMockAuthorizationReceipt {
    return {
      ...data,
      receiptContentsJson: parseJsonField(data.receiptContentsJson),
      mockAuthorizationDetailsJson: parseJsonField(data.mockAuthorizationDetailsJson),
      sourceRefsJson: parseJsonField(data.sourceRefsJson),
      createdAt: toDateString(data.createdAt) || '',
      updatedAt: toDateString(data.updatedAt) || '',
      voidedAt: toDateString(data.voidedAt),
    } as RecoveryExecutionMockAuthorizationReceipt;
  }
}

export class PrismaAuthorizationSummaryRepository implements RecoveryExecutionAuthorizationSummaryRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Partial<RecoveryExecutionAuthorizationSummary>): Promise<RecoveryExecutionAuthorizationSummary> {
    const created = await this.prisma.recoveryExecutionAuthorizationSummaryRecord.create({ data: this.toPrisma(data) });
    return this.fromPrisma(created);
  }

  async getById(schoolId: string, id: string): Promise<RecoveryExecutionAuthorizationSummary | null> {
    const found = await this.prisma.recoveryExecutionAuthorizationSummaryRecord.findUnique({ where: { authorizationSummaryId: id } });
    if (!found || found.schoolId !== schoolId) return null;
    return this.fromPrisma(found);
  }

  async listBySchool(schoolId: string): Promise<RecoveryExecutionAuthorizationSummary[]> {
    const records = await this.prisma.recoveryExecutionAuthorizationSummaryRecord.findMany({ where: { schoolId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryExecutionAuthorizationSummary[]> {
    const records = await this.prisma.recoveryExecutionAuthorizationSummaryRecord.findMany({ where: { schoolId, studentRef } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryExecutionAuthorizationSummary[]> {
    const records = await this.prisma.recoveryExecutionAuthorizationSummaryRecord.findMany({ where: { schoolId, resultRecoveryPlanId: planId } });
    return records.map(r => this.fromPrisma(r));
  }

  async update(id: string, data: Partial<RecoveryExecutionAuthorizationSummary>): Promise<RecoveryExecutionAuthorizationSummary> {
    const updated = await this.prisma.recoveryExecutionAuthorizationSummaryRecord.update({
      where: { authorizationSummaryId: id },
      data: this.toPrisma(data),
    });
    return this.fromPrisma(updated);
  }

  private toPrisma(data: any): any {
    const { ...rest } = data;
    return rest;
  }

  private fromPrisma(data: any): RecoveryExecutionAuthorizationSummary {
    return {
      ...data,
      authorizationOverviewJson: parseJsonField(data.authorizationOverviewJson),
      readinessSummaryJson: parseJsonField(data.readinessSummaryJson),
      requestSummaryJson: parseJsonField(data.requestSummaryJson),
      eligibilitySummaryJson: parseJsonField(data.eligibilitySummaryJson),
      authorityMatrixSummaryJson: parseJsonField(data.authorityMatrixSummaryJson),
      approvalChainSummaryJson: parseJsonField(data.approvalChainSummaryJson),
      riskAttestationSummaryJson: parseJsonField(data.riskAttestationSummaryJson),
      consentBoundarySummaryJson: parseJsonField(data.consentBoundarySummaryJson),
      vetoSummaryJson: parseJsonField(data.vetoSummaryJson),
      preflightSummaryJson: parseJsonField(data.preflightSummaryJson),
      dryRunSummaryJson: parseJsonField(data.dryRunSummaryJson),
      preLiveDecisionPacketSummaryJson: parseJsonField(data.preLiveDecisionPacketSummaryJson),
      mockAuthorizationReceiptSummaryJson: parseJsonField(data.mockAuthorizationReceiptSummaryJson),
      sourceRefsJson: parseJsonField(data.sourceRefsJson),
      blockedReasonCodesJson: parseStringArray(data.blockedReasonCodesJson),
      createdAt: toDateString(data.createdAt) || '',
      updatedAt: toDateString(data.updatedAt) || '',
      refreshedAt: toDateString(data.refreshedAt),
      staleAt: toDateString(data.staleAt),
      reviewReadyAt: toDateString(data.reviewReadyAt),
      blockedAt: toDateString(data.blockedAt),
      voidedAt: toDateString(data.voidedAt),
    } as RecoveryExecutionAuthorizationSummary;
  }
}

export class PrismaAuthorizationAuditRepository implements RecoveryExecutionAuthorizationAuditRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Partial<any>): Promise<any> {
    const created = await this.prisma.recoveryExecutionAuthorizationAuditRecord.create({ data: data as any });
    return created;
  }

  async listBySchool(schoolId: string): Promise<any[]> {
    return this.prisma.recoveryExecutionAuthorizationAuditRecord.findMany({ where: { schoolId } });
  }

  async listByEventType(schoolId: string, eventType: string): Promise<any[]> {
    return this.prisma.recoveryExecutionAuthorizationAuditRecord.findMany({ where: { schoolId, eventType } });
  }
}

export class PrismaAuthorizationIdempotencyRepository implements RecoveryExecutionAuthorizationIdempotencyRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Partial<any>): Promise<any> {
    const created = await this.prisma.recoveryExecutionAuthorizationIdempotencyRecord.create({ data: data as any });
    return created;
  }

  async getByKey(schoolId: string, operation: string, idempotencyKey: string): Promise<any | null> {
    return this.prisma.recoveryExecutionAuthorizationIdempotencyRecord.findFirst({
      where: { schoolId, operation, idempotencyKey },
    });
  }

  async updateStatus(id: string, status: string, resourceType?: string, resourceId?: string, safeResultSummary?: string): Promise<any> {
    return this.prisma.recoveryExecutionAuthorizationIdempotencyRecord.update({
      where: { authorizationIdempotencyId: id },
      data: { status, ...(resourceType ? { resourceType } : {}), ...(resourceId ? { resourceId } : {}), ...(safeResultSummary ? { safeResultSummary } : {}) } as any,
    });
  }

  async listExpired(): Promise<any[]> {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return this.prisma.recoveryExecutionAuthorizationIdempotencyRecord.findMany({
      where: { createdAt: { lt: cutoff } },
    });
  }
}
