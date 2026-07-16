import { PrismaClient } from '@prisma/client';
import type {
  RecoveryCaseAdjudicationReadiness,
  RecoveryCaseReviewSession,
  RecoveryCaseReviewEvidenceBundle,
  RecoveryCaseReviewChecklist,
  RecoveryCaseConflictOfInterestDeclaration,
  RecoveryCaseReviewerDecisionDraft,
  RecoveryCasePriorityOverrideRequest,
  RecoveryCaseSecondReviewRequest,
  RecoveryCaseReviewerConsensus,
  RecoveryCaseDisagreementResolutionDraft,
  RecoveryCaseQueueDisposition,
  RecoveryCaseQualitySample,
  RecoveryCaseAdjudicationSummary,
  CreateAdjudicationReadinessInput,
  CreateReviewSessionInput,
  CreateEvidenceBundleInput,
  CreateReviewChecklistInput,
  CreateConflictDeclarationInput,
  CreateReviewerDecisionInput,
  CreatePriorityOverrideRequestInput,
  CreateSecondReviewRequestInput,
  CreateConsensusInput,
  CreateDisagreementResolutionDraftInput,
  CreateQueueDispositionInput,
  RecoveryCaseQualitySamplingInput,
  CreateAdjudicationSummaryInput,
} from '../contracts/index';
import type {
  RecoveryCaseAdjudicationReadinessRepository,
  RecoveryCaseReviewSessionRepository,
  RecoveryCaseReviewEvidenceBundleRepository,
  RecoveryCaseReviewChecklistRepository,
  RecoveryCaseConflictOfInterestDeclarationRepository,
  RecoveryCaseReviewerDecisionDraftRepository,
  RecoveryCasePriorityOverrideRequestRepository,
  RecoveryCaseSecondReviewRequestRepository,
  RecoveryCaseReviewerConsensusRepository,
  RecoveryCaseDisagreementResolutionDraftRepository,
  RecoveryCaseQueueDispositionRepository,
  RecoveryCaseQualitySampleRepository,
  RecoveryCaseAdjudicationSummaryRepository,
  RecoveryCaseAdjudicationAuditRepository,
  RecoveryCaseAdjudicationIdempotencyRepository,
} from '../contracts/recoveryCaseAdjudicationRepositoryContracts';

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

function parseJsonArray(val: unknown): unknown[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') return JSON.parse(val);
  return [];
}

function parseStringArray(val: unknown): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(String);
  if (typeof val === 'string') return JSON.parse(val);
  return [];
}

export class PrismaRecoveryCaseAdjudicationReadinessRepository implements RecoveryCaseAdjudicationReadinessRepository {
  constructor(private prisma: PrismaClient) {}

  async create(input: CreateAdjudicationReadinessInput): Promise<RecoveryCaseAdjudicationReadiness> {
    const created = await this.prisma.recoveryCaseAdjudicationReadinessRecord.create({
      data: {
        schoolId: input.schoolId,
        studentRef: input.studentRef,
        resultRecoveryPlanId: input.resultRecoveryPlanId,
        queueItemId: input.queueItemId,
        priorityAssessmentId: input.priorityAssessmentId ?? null,
        fairnessCheckId: input.fairnessCheckId ?? null,
        triageReadinessId: input.triageReadinessId ?? null,
        safeReadinessSummary: input.safeReadinessSummary,
        sourceRefsJson: input.sourceRefs as any,
        createdByActorId: input.createdByActorId,
        createdByRole: input.createdByRole,
      },
    });
    return this.toContract(created);
  }

  async getById(adjudicationReadinessId: string): Promise<RecoveryCaseAdjudicationReadiness | null> {
    const record = await this.prisma.recoveryCaseAdjudicationReadinessRecord.findUnique({ where: { adjudicationReadinessId } });
    if (!record) return null;
    return this.toContract(record);
  }

  async listBySchool(schoolId: string): Promise<RecoveryCaseAdjudicationReadiness[]> {
    const records = await this.prisma.recoveryCaseAdjudicationReadinessRecord.findMany({ where: { schoolId } });
    return records.map(r => this.toContract(r));
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryCaseAdjudicationReadiness[]> {
    const records = await this.prisma.recoveryCaseAdjudicationReadinessRecord.findMany({ where: { schoolId, studentRef } });
    return records.map(r => this.toContract(r));
  }

  async listByPlanId(schoolId: string, resultRecoveryPlanId: string): Promise<RecoveryCaseAdjudicationReadiness[]> {
    const records = await this.prisma.recoveryCaseAdjudicationReadinessRecord.findMany({ where: { schoolId, resultRecoveryPlanId } });
    return records.map(r => this.toContract(r));
  }

  async listByQueueItemId(schoolId: string, queueItemId: string): Promise<RecoveryCaseAdjudicationReadiness[]> {
    const records = await this.prisma.recoveryCaseAdjudicationReadinessRecord.findMany({ where: { schoolId, queueItemId } });
    return records.map(r => this.toContract(r));
  }

  async listByStatus(schoolId: string, status: string): Promise<RecoveryCaseAdjudicationReadiness[]> {
    const records = await this.prisma.recoveryCaseAdjudicationReadinessRecord.findMany({ where: { schoolId, readinessStatus: status } });
    return records.map(r => this.toContract(r));
  }

  async updateStatus(adjudicationReadinessId: string, status: string, blockedReasonCodes?: string[]): Promise<RecoveryCaseAdjudicationReadiness> {
    const updated = await this.prisma.recoveryCaseAdjudicationReadinessRecord.update({
      where: { adjudicationReadinessId },
      data: {
        readinessStatus: status,
        ...(blockedReasonCodes !== undefined ? { blockedReasonCodesJson: blockedReasonCodes } : {}),
      },
    });
    return this.toContract(updated);
  }

  async void(adjudicationReadinessId: string): Promise<RecoveryCaseAdjudicationReadiness> {
    const updated = await this.prisma.recoveryCaseAdjudicationReadinessRecord.update({
      where: { adjudicationReadinessId },
      data: { readinessStatus: 'void', voidedAt: new Date() },
    });
    return this.toContract(updated);
  }

  private toContract(record: any): RecoveryCaseAdjudicationReadiness {
    return {
      adjudicationReadinessId: record.adjudicationReadinessId,
      schoolId: record.schoolId,
      studentRef: record.studentRef,
      resultRecoveryPlanId: record.resultRecoveryPlanId,
      queueItemId: record.queueItemId,
      priorityAssessmentId: record.priorityAssessmentId ?? undefined,
      fairnessCheckId: record.fairnessCheckId ?? undefined,
      triageReadinessId: record.triageReadinessId ?? undefined,
      readinessStatus: record.readinessStatus,
      safeReadinessSummary: record.safeReadinessSummary,
      blockedReasonCodes: parseStringArray(record.blockedReasonCodesJson),
      sourceRefs: parseJsonField(record.sourceRefsJson),
      createdByActorId: record.createdByActorId,
      createdByRole: record.createdByRole,
      createdAt: toDateString(record.createdAt) ?? '',
      updatedAt: toDateString(record.updatedAt) ?? '',
      voidedAt: toDateString(record.voidedAt),
    };
  }
}

export class PrismaRecoveryCaseReviewSessionRepository implements RecoveryCaseReviewSessionRepository {
  constructor(private prisma: PrismaClient) {}

  async create(input: CreateReviewSessionInput): Promise<RecoveryCaseReviewSession> {
    const created = await this.prisma.recoveryCaseReviewSessionRecord.create({
      data: {
        schoolId: input.schoolId,
        queueItemId: input.queueItemId,
        adjudicationReadinessId: input.adjudicationReadinessId ?? null,
        reviewerActorId: input.reviewerActorId,
        reviewerRole: input.reviewerRole,
        safeSessionSummary: input.safeSessionSummary,
        sourceRefsJson: input.sourceRefs as any,
        createdByActorId: input.createdByActorId,
        createdByRole: input.createdByRole,
      },
    });
    return this.toContract(created);
  }

  async getById(reviewSessionId: string): Promise<RecoveryCaseReviewSession | null> {
    const record = await this.prisma.recoveryCaseReviewSessionRecord.findUnique({ where: { reviewSessionId } });
    if (!record) return null;
    return this.toContract(record);
  }

  async listBySchool(schoolId: string): Promise<RecoveryCaseReviewSession[]> {
    const records = await this.prisma.recoveryCaseReviewSessionRecord.findMany({ where: { schoolId } });
    return records.map(r => this.toContract(r));
  }

  async listByQueueItemId(schoolId: string, queueItemId: string): Promise<RecoveryCaseReviewSession[]> {
    const records = await this.prisma.recoveryCaseReviewSessionRecord.findMany({ where: { schoolId, queueItemId } });
    return records.map(r => this.toContract(r));
  }

  async listByReviewer(schoolId: string, reviewerActorId: string): Promise<RecoveryCaseReviewSession[]> {
    const records = await this.prisma.recoveryCaseReviewSessionRecord.findMany({ where: { schoolId, reviewerActorId } });
    return records.map(r => this.toContract(r));
  }

  async listByStatus(schoolId: string, status: string): Promise<RecoveryCaseReviewSession[]> {
    const records = await this.prisma.recoveryCaseReviewSessionRecord.findMany({ where: { schoolId, sessionStatus: status } });
    return records.map(r => this.toContract(r));
  }

  async updateStatus(reviewSessionId: string, status: string, blockedReasonCodes?: string[]): Promise<RecoveryCaseReviewSession> {
    const updated = await this.prisma.recoveryCaseReviewSessionRecord.update({
      where: { reviewSessionId },
      data: {
        sessionStatus: status,
        ...(blockedReasonCodes !== undefined ? { blockedReasonCodesJson: blockedReasonCodes } : {}),
      },
    });
    return this.toContract(updated);
  }

  async void(reviewSessionId: string): Promise<RecoveryCaseReviewSession> {
    const updated = await this.prisma.recoveryCaseReviewSessionRecord.update({
      where: { reviewSessionId },
      data: { sessionStatus: 'void', voidedAt: new Date() },
    });
    return this.toContract(updated);
  }

  private toContract(record: any): RecoveryCaseReviewSession {
    return {
      reviewSessionId: record.reviewSessionId,
      schoolId: record.schoolId,
      queueItemId: record.queueItemId,
      adjudicationReadinessId: record.adjudicationReadinessId ?? undefined,
      reviewerActorId: record.reviewerActorId,
      reviewerRole: record.reviewerRole,
      sessionStatus: record.sessionStatus,
      safeSessionSummary: record.safeSessionSummary,
      blockedReasonCodes: parseStringArray(record.blockedReasonCodesJson),
      sourceRefs: parseJsonField(record.sourceRefsJson),
      createdByActorId: record.createdByActorId,
      createdByRole: record.createdByRole,
      createdAt: toDateString(record.createdAt) ?? '',
      updatedAt: toDateString(record.updatedAt) ?? '',
      voidedAt: toDateString(record.voidedAt),
    };
  }
}

export class PrismaRecoveryCaseReviewEvidenceBundleRepository implements RecoveryCaseReviewEvidenceBundleRepository {
  constructor(private prisma: PrismaClient) {}

  async create(input: CreateEvidenceBundleInput): Promise<RecoveryCaseReviewEvidenceBundle> {
    const created = await this.prisma.recoveryCaseReviewEvidenceBundleRecord.create({
      data: {
        schoolId: input.schoolId,
        queueItemId: input.queueItemId,
        priorityAssessmentId: input.priorityAssessmentId ?? null,
        boardSnapshotId: input.boardSnapshotId ?? null,
        boardCardId: input.boardCardId ?? null,
        sourceRefsJson: input.sourceRefs as any,
        safeEvidenceItemsJson: input.safeEvidenceItems as any,
        sourceUpdatedAtJson: input.sourceUpdatedAt as any,
        safeBundleSummary: input.safeBundleSummary,
      },
    });
    return this.toContract(created);
  }

  async getById(evidenceBundleId: string): Promise<RecoveryCaseReviewEvidenceBundle | null> {
    const record = await this.prisma.recoveryCaseReviewEvidenceBundleRecord.findUnique({ where: { evidenceBundleId } });
    if (!record) return null;
    return this.toContract(record);
  }

  async listBySchool(schoolId: string): Promise<RecoveryCaseReviewEvidenceBundle[]> {
    const records = await this.prisma.recoveryCaseReviewEvidenceBundleRecord.findMany({ where: { schoolId } });
    return records.map(r => this.toContract(r));
  }

  async listByQueueItemId(schoolId: string, queueItemId: string): Promise<RecoveryCaseReviewEvidenceBundle[]> {
    const records = await this.prisma.recoveryCaseReviewEvidenceBundleRecord.findMany({ where: { schoolId, queueItemId } });
    return records.map(r => this.toContract(r));
  }

  async listByStatus(schoolId: string, status: string): Promise<RecoveryCaseReviewEvidenceBundle[]> {
    const records = await this.prisma.recoveryCaseReviewEvidenceBundleRecord.findMany({ where: { schoolId, bundleStatus: status } });
    return records.map(r => this.toContract(r));
  }

  async updateStatus(evidenceBundleId: string, status: string, blockedReasonCodes?: string[]): Promise<RecoveryCaseReviewEvidenceBundle> {
    const updated = await this.prisma.recoveryCaseReviewEvidenceBundleRecord.update({
      where: { evidenceBundleId },
      data: {
        bundleStatus: status,
        ...(blockedReasonCodes !== undefined ? { blockedReasonCodesJson: blockedReasonCodes } : {}),
      },
    });
    return this.toContract(updated);
  }

  async updateDigest(evidenceBundleId: string, digest: string): Promise<RecoveryCaseReviewEvidenceBundle> {
    const updated = await this.prisma.recoveryCaseReviewEvidenceBundleRecord.update({
      where: { evidenceBundleId },
      data: { evidenceDigest: digest },
    });
    return this.toContract(updated);
  }

  async void(evidenceBundleId: string): Promise<RecoveryCaseReviewEvidenceBundle> {
    const updated = await this.prisma.recoveryCaseReviewEvidenceBundleRecord.update({
      where: { evidenceBundleId },
      data: { bundleStatus: 'void', voidedAt: new Date() },
    });
    return this.toContract(updated);
  }

  private toContract(record: any): RecoveryCaseReviewEvidenceBundle {
    return {
      evidenceBundleId: record.evidenceBundleId,
      schoolId: record.schoolId,
      queueItemId: record.queueItemId,
      priorityAssessmentId: record.priorityAssessmentId ?? undefined,
      boardSnapshotId: record.boardSnapshotId ?? undefined,
      boardCardId: record.boardCardId ?? undefined,
      sourceRefs: parseJsonField(record.sourceRefsJson),
      safeEvidenceItems: parseJsonArray(record.safeEvidenceItemsJson),
      sourceUpdatedAt: parseJsonField(record.sourceUpdatedAtJson) as Record<string, string>,
      evidenceDigest: record.evidenceDigest,
      digestAlgorithm: record.digestAlgorithm,
      bundleStatus: record.bundleStatus,
      safeBundleSummary: record.safeBundleSummary,
      blockedReasonCodes: parseStringArray(record.blockedReasonCodesJson),
      createdAt: toDateString(record.createdAt) ?? '',
      updatedAt: toDateString(record.updatedAt) ?? '',
      voidedAt: toDateString(record.voidedAt),
    };
  }
}

export class PrismaRecoveryCaseReviewChecklistRepository implements RecoveryCaseReviewChecklistRepository {
  constructor(private prisma: PrismaClient) {}

  async create(input: CreateReviewChecklistInput): Promise<RecoveryCaseReviewChecklist> {
    const created = await this.prisma.recoveryCaseReviewChecklistRecord.create({
      data: {
        schoolId: input.schoolId,
        queueItemId: input.queueItemId,
        evidenceBundleId: input.evidenceBundleId ?? null,
        conflictDeclarationId: input.conflictDeclarationId ?? null,
        checklistResultsJson: input.checklistResults as any,
        safeChecklistSummary: input.safeChecklistSummary,
        createdByActorId: input.createdByActorId,
        createdByRole: input.createdByRole,
      },
    });
    return this.toContract(created);
  }

  async getById(reviewChecklistId: string): Promise<RecoveryCaseReviewChecklist | null> {
    const record = await this.prisma.recoveryCaseReviewChecklistRecord.findUnique({ where: { reviewChecklistId } });
    if (!record) return null;
    return this.toContract(record);
  }

  async listBySchool(schoolId: string): Promise<RecoveryCaseReviewChecklist[]> {
    const records = await this.prisma.recoveryCaseReviewChecklistRecord.findMany({ where: { schoolId } });
    return records.map(r => this.toContract(r));
  }

  async listByQueueItemId(schoolId: string, queueItemId: string): Promise<RecoveryCaseReviewChecklist[]> {
    const records = await this.prisma.recoveryCaseReviewChecklistRecord.findMany({ where: { schoolId, queueItemId } });
    return records.map(r => this.toContract(r));
  }

  async listByOutcome(schoolId: string, outcome: string): Promise<RecoveryCaseReviewChecklist[]> {
    const records = await this.prisma.recoveryCaseReviewChecklistRecord.findMany({ where: { schoolId, checklistOutcome: outcome } });
    return records.map(r => this.toContract(r));
  }

  async updateStatus(reviewChecklistId: string, outcome: string, blockedReasonCodes?: string[]): Promise<RecoveryCaseReviewChecklist> {
    const updated = await this.prisma.recoveryCaseReviewChecklistRecord.update({
      where: { reviewChecklistId },
      data: {
        checklistOutcome: outcome,
        ...(blockedReasonCodes !== undefined ? { blockedReasonCodesJson: blockedReasonCodes } : {}),
      },
    });
    return this.toContract(updated);
  }

  async void(reviewChecklistId: string): Promise<RecoveryCaseReviewChecklist> {
    const updated = await this.prisma.recoveryCaseReviewChecklistRecord.update({
      where: { reviewChecklistId },
      data: { checklistOutcome: 'void', voidedAt: new Date() },
    });
    return this.toContract(updated);
  }

  private toContract(record: any): RecoveryCaseReviewChecklist {
    return {
      reviewChecklistId: record.reviewChecklistId,
      schoolId: record.schoolId,
      queueItemId: record.queueItemId,
      evidenceBundleId: record.evidenceBundleId ?? undefined,
      conflictDeclarationId: record.conflictDeclarationId ?? undefined,
      checklistOutcome: record.checklistOutcome,
      checklistResults: parseJsonField(record.checklistResultsJson),
      safeChecklistSummary: record.safeChecklistSummary,
      blockedReasonCodes: parseStringArray(record.blockedReasonCodesJson),
      createdByActorId: record.createdByActorId,
      createdByRole: record.createdByRole,
      createdAt: toDateString(record.createdAt) ?? '',
      updatedAt: toDateString(record.updatedAt) ?? '',
      voidedAt: toDateString(record.voidedAt),
    };
  }
}

export class PrismaRecoveryCaseConflictOfInterestDeclarationRepository implements RecoveryCaseConflictOfInterestDeclarationRepository {
  constructor(private prisma: PrismaClient) {}

  async create(input: CreateConflictDeclarationInput): Promise<RecoveryCaseConflictOfInterestDeclaration> {
    const created = await this.prisma.recoveryCaseConflictOfInterestDeclarationRecord.create({
      data: {
        schoolId: input.schoolId,
        queueItemId: input.queueItemId,
        reviewerActorId: input.reviewerActorId,
        reviewerRole: input.reviewerRole,
        conflictType: input.conflictType,
        safeDeclarationSummary: input.safeDeclarationSummary,
        createdByActorId: input.createdByActorId,
        createdByRole: input.createdByRole,
      },
    });
    return this.toContract(created);
  }

  async getById(conflictDeclarationId: string): Promise<RecoveryCaseConflictOfInterestDeclaration | null> {
    const record = await this.prisma.recoveryCaseConflictOfInterestDeclarationRecord.findUnique({ where: { conflictDeclarationId } });
    if (!record) return null;
    return this.toContract(record);
  }

  async listBySchool(schoolId: string): Promise<RecoveryCaseConflictOfInterestDeclaration[]> {
    const records = await this.prisma.recoveryCaseConflictOfInterestDeclarationRecord.findMany({ where: { schoolId } });
    return records.map(r => this.toContract(r));
  }

  async listByQueueItemId(schoolId: string, queueItemId: string): Promise<RecoveryCaseConflictOfInterestDeclaration[]> {
    const records = await this.prisma.recoveryCaseConflictOfInterestDeclarationRecord.findMany({ where: { schoolId, queueItemId } });
    return records.map(r => this.toContract(r));
  }

  async listByReviewer(schoolId: string, reviewerActorId: string): Promise<RecoveryCaseConflictOfInterestDeclaration[]> {
    const records = await this.prisma.recoveryCaseConflictOfInterestDeclarationRecord.findMany({ where: { schoolId, reviewerActorId } });
    return records.map(r => this.toContract(r));
  }

  async listByStatus(schoolId: string, status: string): Promise<RecoveryCaseConflictOfInterestDeclaration[]> {
    const records = await this.prisma.recoveryCaseConflictOfInterestDeclarationRecord.findMany({ where: { schoolId, conflictStatus: status } });
    return records.map(r => this.toContract(r));
  }

  async updateStatus(conflictDeclarationId: string, status: string, blockedReasonCodes?: string[]): Promise<RecoveryCaseConflictOfInterestDeclaration> {
    const updated = await this.prisma.recoveryCaseConflictOfInterestDeclarationRecord.update({
      where: { conflictDeclarationId },
      data: {
        conflictStatus: status,
        ...(blockedReasonCodes !== undefined ? { blockedReasonCodesJson: blockedReasonCodes } : {}),
      },
    });
    return this.toContract(updated);
  }

  async void(conflictDeclarationId: string): Promise<RecoveryCaseConflictOfInterestDeclaration> {
    const updated = await this.prisma.recoveryCaseConflictOfInterestDeclarationRecord.update({
      where: { conflictDeclarationId },
      data: { conflictStatus: 'void', voidedAt: new Date() },
    });
    return this.toContract(updated);
  }

  private toContract(record: any): RecoveryCaseConflictOfInterestDeclaration {
    return {
      conflictDeclarationId: record.conflictDeclarationId,
      schoolId: record.schoolId,
      queueItemId: record.queueItemId,
      reviewerActorId: record.reviewerActorId,
      reviewerRole: record.reviewerRole,
      conflictType: record.conflictType,
      conflictStatus: record.conflictStatus,
      safeDeclarationSummary: record.safeDeclarationSummary,
      blockedReasonCodes: parseStringArray(record.blockedReasonCodesJson),
      createdByActorId: record.createdByActorId,
      createdByRole: record.createdByRole,
      createdAt: toDateString(record.createdAt) ?? '',
      updatedAt: toDateString(record.updatedAt) ?? '',
      voidedAt: toDateString(record.voidedAt),
    };
  }
}

export class PrismaRecoveryCaseReviewerDecisionDraftRepository implements RecoveryCaseReviewerDecisionDraftRepository {
  constructor(private prisma: PrismaClient) {}

  async create(input: CreateReviewerDecisionInput): Promise<RecoveryCaseReviewerDecisionDraft> {
    const created = await this.prisma.recoveryCaseReviewerDecisionDraftRecord.create({
      data: {
        schoolId: input.schoolId,
        queueItemId: input.queueItemId,
        reviewSessionId: input.reviewSessionId ?? null,
        reviewerActorId: input.reviewerActorId,
        reviewerRole: input.reviewerRole,
        reviewerPosition: input.reviewerPosition,
        decisionCode: input.decisionCode,
        currentPriorityScore: input.currentPriorityScore ?? null,
        currentPriorityBand: input.currentPriorityBand ?? null,
        recommendedPriorityBand: input.recommendedPriorityBand ?? null,
        safeDecisionSummary: input.safeDecisionSummary,
        reasonCodesJson: input.reasonCodes as any,
        evidenceBundleId: input.evidenceBundleId ?? null,
        checklistId: input.checklistId ?? null,
        conflictDeclarationId: input.conflictDeclarationId ?? null,
        sourceRefsJson: input.sourceRefs as any,
      },
    });
    return this.toContract(created);
  }

  async getById(reviewerDecisionId: string): Promise<RecoveryCaseReviewerDecisionDraft | null> {
    const record = await this.prisma.recoveryCaseReviewerDecisionDraftRecord.findUnique({ where: { reviewerDecisionId } });
    if (!record) return null;
    return this.toContract(record);
  }

  async listBySchool(schoolId: string): Promise<RecoveryCaseReviewerDecisionDraft[]> {
    const records = await this.prisma.recoveryCaseReviewerDecisionDraftRecord.findMany({ where: { schoolId } });
    return records.map(r => this.toContract(r));
  }

  async listByQueueItemId(schoolId: string, queueItemId: string): Promise<RecoveryCaseReviewerDecisionDraft[]> {
    const records = await this.prisma.recoveryCaseReviewerDecisionDraftRecord.findMany({ where: { schoolId, queueItemId } });
    return records.map(r => this.toContract(r));
  }

  async listBySessionId(schoolId: string, reviewSessionId: string): Promise<RecoveryCaseReviewerDecisionDraft[]> {
    const records = await this.prisma.recoveryCaseReviewerDecisionDraftRecord.findMany({ where: { schoolId, reviewSessionId } });
    return records.map(r => this.toContract(r));
  }

  async listByReviewer(schoolId: string, reviewerActorId: string): Promise<RecoveryCaseReviewerDecisionDraft[]> {
    const records = await this.prisma.recoveryCaseReviewerDecisionDraftRecord.findMany({ where: { schoolId, reviewerActorId } });
    return records.map(r => this.toContract(r));
  }

  async listByStatus(schoolId: string, status: string): Promise<RecoveryCaseReviewerDecisionDraft[]> {
    const records = await this.prisma.recoveryCaseReviewerDecisionDraftRecord.findMany({ where: { schoolId, decisionStatus: status } });
    return records.map(r => this.toContract(r));
  }

  async updateStatus(reviewerDecisionId: string, status: string, blockedReasonCodes?: string[]): Promise<RecoveryCaseReviewerDecisionDraft> {
    const updated = await this.prisma.recoveryCaseReviewerDecisionDraftRecord.update({
      where: { reviewerDecisionId },
      data: {
        decisionStatus: status,
        ...(blockedReasonCodes !== undefined ? { blockedReasonCodesJson: blockedReasonCodes } : {}),
      },
    });
    return this.toContract(updated);
  }

  async void(reviewerDecisionId: string): Promise<RecoveryCaseReviewerDecisionDraft> {
    const updated = await this.prisma.recoveryCaseReviewerDecisionDraftRecord.update({
      where: { reviewerDecisionId },
      data: { decisionStatus: 'void', voidedAt: new Date() },
    });
    return this.toContract(updated);
  }

  private toContract(record: any): RecoveryCaseReviewerDecisionDraft {
    return {
      reviewerDecisionId: record.reviewerDecisionId,
      schoolId: record.schoolId,
      queueItemId: record.queueItemId,
      reviewSessionId: record.reviewSessionId ?? undefined,
      reviewerActorId: record.reviewerActorId,
      reviewerRole: record.reviewerRole,
      reviewerPosition: record.reviewerPosition,
      decisionCode: record.decisionCode,
      currentPriorityScore: record.currentPriorityScore ?? undefined,
      currentPriorityBand: record.currentPriorityBand ?? undefined,
      recommendedPriorityBand: record.recommendedPriorityBand ?? undefined,
      safeDecisionSummary: record.safeDecisionSummary,
      reasonCodes: parseJsonField(record.reasonCodesJson),
      evidenceBundleId: record.evidenceBundleId ?? undefined,
      checklistId: record.checklistId ?? undefined,
      conflictDeclarationId: record.conflictDeclarationId ?? undefined,
      sourceRefs: parseJsonField(record.sourceRefsJson),
      decisionStatus: record.decisionStatus,
      createdAt: toDateString(record.createdAt) ?? '',
      updatedAt: toDateString(record.updatedAt) ?? '',
      voidedAt: toDateString(record.voidedAt),
    };
  }
}

export class PrismaRecoveryCasePriorityOverrideRequestRepository implements RecoveryCasePriorityOverrideRequestRepository {
  constructor(private prisma: PrismaClient) {}

  async create(input: CreatePriorityOverrideRequestInput): Promise<RecoveryCasePriorityOverrideRequest> {
    const created = await this.prisma.recoveryCasePriorityOverrideRequestRecord.create({
      data: {
        schoolId: input.schoolId,
        queueItemId: input.queueItemId,
        priorityAssessmentId: input.priorityAssessmentId,
        currentPriorityScore: input.currentPriorityScore ?? null,
        currentPriorityBand: input.currentPriorityBand ?? null,
        requestedPriorityBand: input.requestedPriorityBand,
        safeOverrideRationale: input.safeOverrideRationale,
        reasonCodesJson: input.reasonCodes as any,
        supportingDecisionIdsJson: input.supportingDecisionIds as any,
        supportingEvidenceBundleIdsJson: input.supportingEvidenceBundleIds as any,
        createdByActorId: input.createdByActorId,
        createdByRole: input.createdByRole,
      },
    });
    return this.toContract(created);
  }

  async getById(priorityOverrideRequestId: string): Promise<RecoveryCasePriorityOverrideRequest | null> {
    const record = await this.prisma.recoveryCasePriorityOverrideRequestRecord.findUnique({ where: { priorityOverrideRequestId } });
    if (!record) return null;
    return this.toContract(record);
  }

  async listBySchool(schoolId: string): Promise<RecoveryCasePriorityOverrideRequest[]> {
    const records = await this.prisma.recoveryCasePriorityOverrideRequestRecord.findMany({ where: { schoolId } });
    return records.map(r => this.toContract(r));
  }

  async listByQueueItemId(schoolId: string, queueItemId: string): Promise<RecoveryCasePriorityOverrideRequest[]> {
    const records = await this.prisma.recoveryCasePriorityOverrideRequestRecord.findMany({ where: { schoolId, queueItemId } });
    return records.map(r => this.toContract(r));
  }

  async listByRequestor(schoolId: string, createdByActorId: string): Promise<RecoveryCasePriorityOverrideRequest[]> {
    const records = await this.prisma.recoveryCasePriorityOverrideRequestRecord.findMany({ where: { schoolId, createdByActorId } });
    return records.map(r => this.toContract(r));
  }

  async listByStatus(schoolId: string, status: string): Promise<RecoveryCasePriorityOverrideRequest[]> {
    const records = await this.prisma.recoveryCasePriorityOverrideRequestRecord.findMany({ where: { schoolId, overrideStatus: status } });
    return records.map(r => this.toContract(r));
  }

  async updateStatus(priorityOverrideRequestId: string, status: string, blockedReasonCodes?: string[]): Promise<RecoveryCasePriorityOverrideRequest> {
    const updated = await this.prisma.recoveryCasePriorityOverrideRequestRecord.update({
      where: { priorityOverrideRequestId },
      data: {
        overrideStatus: status,
        ...(blockedReasonCodes !== undefined ? { blockedReasonCodesJson: blockedReasonCodes } : {}),
      },
    });
    return this.toContract(updated);
  }

  async void(priorityOverrideRequestId: string): Promise<RecoveryCasePriorityOverrideRequest> {
    const updated = await this.prisma.recoveryCasePriorityOverrideRequestRecord.update({
      where: { priorityOverrideRequestId },
      data: { overrideStatus: 'void', voidedAt: new Date() },
    });
    return this.toContract(updated);
  }

  private toContract(record: any): RecoveryCasePriorityOverrideRequest {
    return {
      priorityOverrideRequestId: record.priorityOverrideRequestId,
      schoolId: record.schoolId,
      queueItemId: record.queueItemId,
      priorityAssessmentId: record.priorityAssessmentId,
      currentPriorityScore: record.currentPriorityScore ?? undefined,
      currentPriorityBand: record.currentPriorityBand ?? undefined,
      requestedPriorityBand: record.requestedPriorityBand,
      safeOverrideRationale: record.safeOverrideRationale,
      reasonCodes: parseJsonField(record.reasonCodesJson),
      supportingDecisionIds: parseStringArray(record.supportingDecisionIdsJson),
      supportingEvidenceBundleIds: parseStringArray(record.supportingEvidenceBundleIdsJson),
      overrideStatus: record.overrideStatus,
      blockedReasonCodes: parseStringArray(record.blockedReasonCodesJson),
      createdByActorId: record.createdByActorId,
      createdByRole: record.createdByRole,
      createdAt: toDateString(record.createdAt) ?? '',
      updatedAt: toDateString(record.updatedAt) ?? '',
      voidedAt: toDateString(record.voidedAt),
    };
  }
}

export class PrismaRecoveryCaseSecondReviewRequestRepository implements RecoveryCaseSecondReviewRequestRepository {
  constructor(private prisma: PrismaClient) {}

  async create(input: CreateSecondReviewRequestInput): Promise<RecoveryCaseSecondReviewRequest> {
    const created = await this.prisma.recoveryCaseSecondReviewRequestRecord.create({
      data: {
        schoolId: input.schoolId,
        queueItemId: input.queueItemId,
        primaryDecisionId: input.primaryDecisionId,
        requestedReviewerRole: input.requestedReviewerRole,
        requestReasonCodesJson: input.requestReasonCodes as any,
        safeRequestSummary: input.safeRequestSummary,
        createdByActorId: input.createdByActorId,
        createdByRole: input.createdByRole,
      },
    });
    return this.toContract(created);
  }

  async getById(secondReviewRequestId: string): Promise<RecoveryCaseSecondReviewRequest | null> {
    const record = await this.prisma.recoveryCaseSecondReviewRequestRecord.findUnique({ where: { secondReviewRequestId } });
    if (!record) return null;
    return this.toContract(record);
  }

  async listBySchool(schoolId: string): Promise<RecoveryCaseSecondReviewRequest[]> {
    const records = await this.prisma.recoveryCaseSecondReviewRequestRecord.findMany({ where: { schoolId } });
    return records.map(r => this.toContract(r));
  }

  async listByQueueItemId(schoolId: string, queueItemId: string): Promise<RecoveryCaseSecondReviewRequest[]> {
    const records = await this.prisma.recoveryCaseSecondReviewRequestRecord.findMany({ where: { schoolId, queueItemId } });
    return records.map(r => this.toContract(r));
  }

  async listByStatus(schoolId: string, status: string): Promise<RecoveryCaseSecondReviewRequest[]> {
    const records = await this.prisma.recoveryCaseSecondReviewRequestRecord.findMany({ where: { schoolId, requestStatus: status } });
    return records.map(r => this.toContract(r));
  }

  async updateStatus(secondReviewRequestId: string, status: string, blockedReasonCodes?: string[]): Promise<RecoveryCaseSecondReviewRequest> {
    const updated = await this.prisma.recoveryCaseSecondReviewRequestRecord.update({
      where: { secondReviewRequestId },
      data: {
        requestStatus: status,
        ...(blockedReasonCodes !== undefined ? { blockedReasonCodesJson: blockedReasonCodes } : {}),
      },
    });
    return this.toContract(updated);
  }

  async void(secondReviewRequestId: string): Promise<RecoveryCaseSecondReviewRequest> {
    const updated = await this.prisma.recoveryCaseSecondReviewRequestRecord.update({
      where: { secondReviewRequestId },
      data: { requestStatus: 'void', voidedAt: new Date() },
    });
    return this.toContract(updated);
  }

  private toContract(record: any): RecoveryCaseSecondReviewRequest {
    return {
      secondReviewRequestId: record.secondReviewRequestId,
      schoolId: record.schoolId,
      queueItemId: record.queueItemId,
      primaryDecisionId: record.primaryDecisionId,
      requestedReviewerRole: record.requestedReviewerRole,
      requestReasonCodes: parseJsonField(record.requestReasonCodesJson),
      safeRequestSummary: record.safeRequestSummary,
      requestStatus: record.requestStatus,
      createdByActorId: record.createdByActorId,
      createdByRole: record.createdByRole,
      createdAt: toDateString(record.createdAt) ?? '',
      updatedAt: toDateString(record.updatedAt) ?? '',
      voidedAt: toDateString(record.voidedAt),
    };
  }
}

export class PrismaRecoveryCaseReviewerConsensusRepository implements RecoveryCaseReviewerConsensusRepository {
  constructor(private prisma: PrismaClient) {}

  async create(input: CreateConsensusInput): Promise<RecoveryCaseReviewerConsensus> {
    const created = await this.prisma.recoveryCaseReviewerConsensusRecord.create({
      data: {
        schoolId: input.schoolId,
        queueItemId: input.queueItemId,
        primaryDecisionId: input.primaryDecisionId ?? null,
        secondaryDecisionId: input.secondaryDecisionId ?? null,
        resultRecoveryPlanId: input.resultRecoveryPlanId ?? null,
        safeConsensusSummary: input.safeConsensusSummary,
        createdByActorId: input.createdByActorId,
        createdByRole: input.createdByRole,
      },
    });
    return this.toContract(created);
  }

  async getById(consensusId: string): Promise<RecoveryCaseReviewerConsensus | null> {
    const record = await this.prisma.recoveryCaseReviewerConsensusRecord.findUnique({ where: { consensusId } });
    if (!record) return null;
    return this.toContract(record);
  }

  async listBySchool(schoolId: string): Promise<RecoveryCaseReviewerConsensus[]> {
    const records = await this.prisma.recoveryCaseReviewerConsensusRecord.findMany({ where: { schoolId } });
    return records.map(r => this.toContract(r));
  }

  async listByQueueItemId(schoolId: string, queueItemId: string): Promise<RecoveryCaseReviewerConsensus[]> {
    const records = await this.prisma.recoveryCaseReviewerConsensusRecord.findMany({ where: { schoolId, queueItemId } });
    return records.map(r => this.toContract(r));
  }

  async listByStatus(schoolId: string, status: string): Promise<RecoveryCaseReviewerConsensus[]> {
    const records = await this.prisma.recoveryCaseReviewerConsensusRecord.findMany({ where: { schoolId, consensusStatus: status } });
    return records.map(r => this.toContract(r));
  }

  async updateStatus(consensusId: string, status: string, blockedReasonCodes?: string[]): Promise<RecoveryCaseReviewerConsensus> {
    const updated = await this.prisma.recoveryCaseReviewerConsensusRecord.update({
      where: { consensusId },
      data: {
        consensusStatus: status,
        ...(blockedReasonCodes !== undefined ? { blockedReasonCodesJson: blockedReasonCodes } : {}),
      },
    });
    return this.toContract(updated);
  }

  async void(consensusId: string): Promise<RecoveryCaseReviewerConsensus> {
    const updated = await this.prisma.recoveryCaseReviewerConsensusRecord.update({
      where: { consensusId },
      data: { consensusStatus: 'void', voidedAt: new Date() },
    });
    return this.toContract(updated);
  }

  private toContract(record: any): RecoveryCaseReviewerConsensus {
    return {
      consensusId: record.consensusId,
      schoolId: record.schoolId,
      queueItemId: record.queueItemId,
      primaryDecisionId: record.primaryDecisionId ?? undefined,
      secondaryDecisionId: record.secondaryDecisionId ?? undefined,
      resultRecoveryPlanId: record.resultRecoveryPlanId ?? undefined,
      consensusStatus: record.consensusStatus,
      safeConsensusSummary: record.safeConsensusSummary,
      blockedReasonCodes: parseStringArray(record.blockedReasonCodesJson),
      createdByActorId: record.createdByActorId,
      createdByRole: record.createdByRole,
      createdAt: toDateString(record.createdAt) ?? '',
      updatedAt: toDateString(record.updatedAt) ?? '',
      voidedAt: toDateString(record.voidedAt),
    };
  }
}

export class PrismaRecoveryCaseDisagreementResolutionDraftRepository implements RecoveryCaseDisagreementResolutionDraftRepository {
  constructor(private prisma: PrismaClient) {}

  async create(input: CreateDisagreementResolutionDraftInput): Promise<RecoveryCaseDisagreementResolutionDraft> {
    const created = await this.prisma.recoveryCaseDisagreementResolutionDraftRecord.create({
      data: {
        schoolId: input.schoolId,
        queueItemId: input.queueItemId,
        consensusId: input.consensusId ?? null,
        primaryDecisionId: input.primaryDecisionId ?? null,
        secondaryDecisionId: input.secondaryDecisionId ?? null,
        safeDisagreementSummary: input.safeDisagreementSummary,
        reasonCodeComparisonJson: input.reasonCodeComparison as any,
        evidenceGapsJson: input.evidenceGaps as any,
        proposedGovernanceRole: input.proposedGovernanceRole ?? null,
        proposedResolutionOptionsJson: input.proposedResolutionOptions as any,
        createdByActorId: input.createdByActorId,
        createdByRole: input.createdByRole,
      },
    });
    return this.toContract(created);
  }

  async getById(disagreementResolutionDraftId: string): Promise<RecoveryCaseDisagreementResolutionDraft | null> {
    const record = await this.prisma.recoveryCaseDisagreementResolutionDraftRecord.findUnique({ where: { disagreementResolutionDraftId } });
    if (!record) return null;
    return this.toContract(record);
  }

  async listBySchool(schoolId: string): Promise<RecoveryCaseDisagreementResolutionDraft[]> {
    const records = await this.prisma.recoveryCaseDisagreementResolutionDraftRecord.findMany({ where: { schoolId } });
    return records.map(r => this.toContract(r));
  }

  async listByQueueItemId(schoolId: string, queueItemId: string): Promise<RecoveryCaseDisagreementResolutionDraft[]> {
    const records = await this.prisma.recoveryCaseDisagreementResolutionDraftRecord.findMany({ where: { schoolId, queueItemId } });
    return records.map(r => this.toContract(r));
  }

  async listByStatus(schoolId: string, status: string): Promise<RecoveryCaseDisagreementResolutionDraft[]> {
    const records = await this.prisma.recoveryCaseDisagreementResolutionDraftRecord.findMany({ where: { schoolId, draftStatus: status } });
    return records.map(r => this.toContract(r));
  }

  async updateStatus(disagreementResolutionDraftId: string, status: string, blockedReasonCodes?: string[]): Promise<RecoveryCaseDisagreementResolutionDraft> {
    const updated = await this.prisma.recoveryCaseDisagreementResolutionDraftRecord.update({
      where: { disagreementResolutionDraftId },
      data: {
        draftStatus: status,
        ...(blockedReasonCodes !== undefined ? { blockedReasonCodesJson: blockedReasonCodes } : {}),
      },
    });
    return this.toContract(updated);
  }

  async void(disagreementResolutionDraftId: string): Promise<RecoveryCaseDisagreementResolutionDraft> {
    const updated = await this.prisma.recoveryCaseDisagreementResolutionDraftRecord.update({
      where: { disagreementResolutionDraftId },
      data: { draftStatus: 'void', voidedAt: new Date() },
    });
    return this.toContract(updated);
  }

  private toContract(record: any): RecoveryCaseDisagreementResolutionDraft {
    return {
      disagreementResolutionDraftId: record.disagreementResolutionDraftId,
      schoolId: record.schoolId,
      queueItemId: record.queueItemId,
      consensusId: record.consensusId ?? undefined,
      primaryDecisionId: record.primaryDecisionId ?? undefined,
      secondaryDecisionId: record.secondaryDecisionId ?? undefined,
      safeDisagreementSummary: record.safeDisagreementSummary,
      reasonCodeComparison: parseJsonField(record.reasonCodeComparisonJson),
      evidenceGaps: parseJsonArray(record.evidenceGapsJson),
      proposedGovernanceRole: record.proposedGovernanceRole ?? undefined,
      proposedResolutionOptions: parseJsonArray(record.proposedResolutionOptionsJson),
      draftStatus: record.draftStatus,
      blockedReasonCodes: parseStringArray(record.blockedReasonCodesJson),
      createdByActorId: record.createdByActorId,
      createdByRole: record.createdByRole,
      createdAt: toDateString(record.createdAt) ?? '',
      updatedAt: toDateString(record.updatedAt) ?? '',
      voidedAt: toDateString(record.voidedAt),
    };
  }
}

export class PrismaRecoveryCaseQueueDispositionRepository implements RecoveryCaseQueueDispositionRepository {
  constructor(private prisma: PrismaClient) {}

  async create(input: CreateQueueDispositionInput): Promise<RecoveryCaseQueueDisposition> {
    const created = await this.prisma.recoveryCaseQueueDispositionRecord.create({
      data: {
        schoolId: input.schoolId,
        queueItemId: input.queueItemId,
        consensusId: input.consensusId ?? null,
        disagreementResolutionDraftId: input.disagreementResolutionDraftId ?? null,
        priorityOverrideRequestId: input.priorityOverrideRequestId ?? null,
        dispositionCode: input.dispositionCode,
        safeDispositionSummary: input.safeDispositionSummary,
        reasonCodesJson: input.reasonCodes as any,
        sourceRefsJson: input.sourceRefs as any,
        createdByActorId: input.createdByActorId,
        createdByRole: input.createdByRole,
      },
    });
    return this.toContract(created);
  }

  async getById(queueDispositionId: string): Promise<RecoveryCaseQueueDisposition | null> {
    const record = await this.prisma.recoveryCaseQueueDispositionRecord.findUnique({ where: { queueDispositionId } });
    if (!record) return null;
    return this.toContract(record);
  }

  async listBySchool(schoolId: string): Promise<RecoveryCaseQueueDisposition[]> {
    const records = await this.prisma.recoveryCaseQueueDispositionRecord.findMany({ where: { schoolId } });
    return records.map(r => this.toContract(r));
  }

  async listByQueueItemId(schoolId: string, queueItemId: string): Promise<RecoveryCaseQueueDisposition[]> {
    const records = await this.prisma.recoveryCaseQueueDispositionRecord.findMany({ where: { schoolId, queueItemId } });
    return records.map(r => this.toContract(r));
  }

  async listByCode(schoolId: string, code: string): Promise<RecoveryCaseQueueDisposition[]> {
    const records = await this.prisma.recoveryCaseQueueDispositionRecord.findMany({ where: { schoolId, dispositionCode: code } });
    return records.map(r => this.toContract(r));
  }

  async listByStatus(schoolId: string, status: string): Promise<RecoveryCaseQueueDisposition[]> {
    const records = await this.prisma.recoveryCaseQueueDispositionRecord.findMany({ where: { schoolId, dispositionStatus: status } });
    return records.map(r => this.toContract(r));
  }

  async updateStatus(queueDispositionId: string, status: string, blockedReasonCodes?: string[]): Promise<RecoveryCaseQueueDisposition> {
    const updated = await this.prisma.recoveryCaseQueueDispositionRecord.update({
      where: { queueDispositionId },
      data: {
        dispositionStatus: status,
        ...(blockedReasonCodes !== undefined ? { blockedReasonCodesJson: blockedReasonCodes } : {}),
      },
    });
    return this.toContract(updated);
  }

  async void(queueDispositionId: string): Promise<RecoveryCaseQueueDisposition> {
    const updated = await this.prisma.recoveryCaseQueueDispositionRecord.update({
      where: { queueDispositionId },
      data: { dispositionStatus: 'void', voidedAt: new Date() },
    });
    return this.toContract(updated);
  }

  private toContract(record: any): RecoveryCaseQueueDisposition {
    return {
      queueDispositionId: record.queueDispositionId,
      schoolId: record.schoolId,
      queueItemId: record.queueItemId,
      consensusId: record.consensusId ?? undefined,
      disagreementResolutionDraftId: record.disagreementResolutionDraftId ?? undefined,
      priorityOverrideRequestId: record.priorityOverrideRequestId ?? undefined,
      dispositionCode: record.dispositionCode,
      dispositionStatus: record.dispositionStatus,
      safeDispositionSummary: record.safeDispositionSummary,
      reasonCodes: parseJsonField(record.reasonCodesJson),
      sourceRefs: parseJsonField(record.sourceRefsJson),
      createdByActorId: record.createdByActorId,
      createdByRole: record.createdByRole,
      createdAt: toDateString(record.createdAt) ?? '',
      updatedAt: toDateString(record.updatedAt) ?? '',
      voidedAt: toDateString(record.voidedAt),
    };
  }
}

export class PrismaRecoveryCaseQualitySampleRepository implements RecoveryCaseQualitySampleRepository {
  constructor(private prisma: PrismaClient) {}

  async create(input: RecoveryCaseQualitySamplingInput & { selected: boolean; bucket: number; createdByActorId: string; createdByRole: string }): Promise<RecoveryCaseQualitySample> {
    const created = await this.prisma.recoveryCaseQualitySampleRecord.create({
      data: {
        schoolId: input.schoolId,
        queueItemId: input.queueItemId,
        priorityBand: input.priorityBand,
        selected: input.selected,
        bucket: input.bucket,
        sampleBasisPoints: input.sampleBasisPoints,
        policyVersion: input.policyVersion,
        createdByActorId: input.createdByActorId,
        createdByRole: input.createdByRole,
      },
    });
    return this.toContract(created);
  }

  async getById(qualitySampleId: string): Promise<RecoveryCaseQualitySample | null> {
    const record = await this.prisma.recoveryCaseQualitySampleRecord.findUnique({ where: { qualitySampleId } });
    if (!record) return null;
    return this.toContract(record);
  }

  async listBySchool(schoolId: string): Promise<RecoveryCaseQualitySample[]> {
    const records = await this.prisma.recoveryCaseQualitySampleRecord.findMany({ where: { schoolId } });
    return records.map(r => this.toContract(r));
  }

  async listByQueueItemId(schoolId: string, queueItemId: string): Promise<RecoveryCaseQualitySample[]> {
    const records = await this.prisma.recoveryCaseQualitySampleRecord.findMany({ where: { schoolId, queueItemId } });
    return records.map(r => this.toContract(r));
  }

  async listSelected(schoolId: string): Promise<RecoveryCaseQualitySample[]> {
    const records = await this.prisma.recoveryCaseQualitySampleRecord.findMany({ where: { schoolId, selected: true } });
    return records.map(r => this.toContract(r));
  }

  async listByPolicyVersion(schoolId: string, policyVersion: string): Promise<RecoveryCaseQualitySample[]> {
    const records = await this.prisma.recoveryCaseQualitySampleRecord.findMany({ where: { schoolId, policyVersion } });
    return records.map(r => this.toContract(r));
  }

  async void(qualitySampleId: string): Promise<RecoveryCaseQualitySample> {
    const updated = await this.prisma.recoveryCaseQualitySampleRecord.update({
      where: { qualitySampleId },
      data: { sampleStatus: 'void', voidedAt: new Date() },
    });
    return this.toContract(updated);
  }

  private toContract(record: any): RecoveryCaseQualitySample {
    return {
      qualitySampleId: record.qualitySampleId,
      schoolId: record.schoolId,
      queueItemId: record.queueItemId,
      priorityBand: record.priorityBand,
      selected: record.selected,
      bucket: record.bucket,
      sampleBasisPoints: record.sampleBasisPoints,
      policyVersion: record.policyVersion,
      sampleStatus: record.sampleStatus,
      createdByActorId: record.createdByActorId,
      createdByRole: record.createdByRole,
      createdAt: toDateString(record.createdAt) ?? '',
      voidedAt: toDateString(record.voidedAt),
    };
  }
}

export class PrismaRecoveryCaseAdjudicationSummaryRepository implements RecoveryCaseAdjudicationSummaryRepository {
  constructor(private prisma: PrismaClient) {}

  async create(input: CreateAdjudicationSummaryInput): Promise<RecoveryCaseAdjudicationSummary> {
    const created = await this.prisma.recoveryCaseAdjudicationSummaryRecord.create({
      data: {
        schoolId: input.schoolId,
        studentRef: input.studentRef ?? null,
        resultRecoveryPlanId: input.resultRecoveryPlanId ?? null,
        queueItemId: input.queueItemId ?? null,
        safeSummary: input.safeSummary,
        adjudicationCountsJson: input.adjudicationCounts as any,
        consensusCountsJson: input.consensusCounts as any,
        disagreementCountsJson: input.disagreementCounts as any,
        dispositionCountsJson: input.dispositionCounts as any,
        sourceRefsJson: input.sourceRefs as any,
        createdByActorId: input.createdByActorId,
        createdByRole: input.createdByRole,
      },
    });
    return this.toContract(created);
  }

  async getById(adjudicationSummaryId: string): Promise<RecoveryCaseAdjudicationSummary | null> {
    const record = await this.prisma.recoveryCaseAdjudicationSummaryRecord.findUnique({ where: { adjudicationSummaryId } });
    if (!record) return null;
    return this.toContract(record);
  }

  async listBySchool(schoolId: string): Promise<RecoveryCaseAdjudicationSummary[]> {
    const records = await this.prisma.recoveryCaseAdjudicationSummaryRecord.findMany({ where: { schoolId } });
    return records.map(r => this.toContract(r));
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryCaseAdjudicationSummary[]> {
    const records = await this.prisma.recoveryCaseAdjudicationSummaryRecord.findMany({ where: { schoolId, studentRef } });
    return records.map(r => this.toContract(r));
  }

  async listByPlanId(schoolId: string, resultRecoveryPlanId: string): Promise<RecoveryCaseAdjudicationSummary[]> {
    const records = await this.prisma.recoveryCaseAdjudicationSummaryRecord.findMany({ where: { schoolId, resultRecoveryPlanId } });
    return records.map(r => this.toContract(r));
  }

  async listByQueueItemId(schoolId: string, queueItemId: string): Promise<RecoveryCaseAdjudicationSummary[]> {
    const records = await this.prisma.recoveryCaseAdjudicationSummaryRecord.findMany({ where: { schoolId, queueItemId } });
    return records.map(r => this.toContract(r));
  }

  async updateStatus(adjudicationSummaryId: string, status: string, blockedReasonCodes?: string[]): Promise<RecoveryCaseAdjudicationSummary> {
    const updated = await this.prisma.recoveryCaseAdjudicationSummaryRecord.update({
      where: { adjudicationSummaryId },
      data: {
        summaryStatus: status,
        ...(blockedReasonCodes !== undefined ? { blockedReasonCodesJson: blockedReasonCodes } : {}),
      },
    });
    return this.toContract(updated);
  }

  async refresh(adjudicationSummaryId: string, data: Partial<CreateAdjudicationSummaryInput>): Promise<RecoveryCaseAdjudicationSummary> {
    const updateData: any = {};
    if (data.studentRef !== undefined) updateData.studentRef = data.studentRef;
    if (data.resultRecoveryPlanId !== undefined) updateData.resultRecoveryPlanId = data.resultRecoveryPlanId;
    if (data.queueItemId !== undefined) updateData.queueItemId = data.queueItemId;
    if (data.safeSummary !== undefined) updateData.safeSummary = data.safeSummary;
    if (data.adjudicationCounts !== undefined) updateData.adjudicationCountsJson = data.adjudicationCounts as any;
    if (data.consensusCounts !== undefined) updateData.consensusCountsJson = data.consensusCounts as any;
    if (data.disagreementCounts !== undefined) updateData.disagreementCountsJson = data.disagreementCounts as any;
    if (data.dispositionCounts !== undefined) updateData.dispositionCountsJson = data.dispositionCounts as any;
    if (data.sourceRefs !== undefined) updateData.sourceRefsJson = data.sourceRefs as any;
    const updated = await this.prisma.recoveryCaseAdjudicationSummaryRecord.update({
      where: { adjudicationSummaryId },
      data: updateData,
    });
    return this.toContract(updated);
  }

  async void(adjudicationSummaryId: string): Promise<RecoveryCaseAdjudicationSummary> {
    const updated = await this.prisma.recoveryCaseAdjudicationSummaryRecord.update({
      where: { adjudicationSummaryId },
      data: { summaryStatus: 'void', voidedAt: new Date() },
    });
    return this.toContract(updated);
  }

  private toContract(record: any): RecoveryCaseAdjudicationSummary {
    return {
      adjudicationSummaryId: record.adjudicationSummaryId,
      schoolId: record.schoolId,
      studentRef: record.studentRef ?? undefined,
      resultRecoveryPlanId: record.resultRecoveryPlanId ?? undefined,
      queueItemId: record.queueItemId ?? undefined,
      summaryStatus: record.summaryStatus,
      safeSummary: record.safeSummary,
      adjudicationCounts: parseJsonField(record.adjudicationCountsJson) as Record<string, number>,
      consensusCounts: parseJsonField(record.consensusCountsJson) as Record<string, number>,
      disagreementCounts: parseJsonField(record.disagreementCountsJson) as Record<string, number>,
      dispositionCounts: parseJsonField(record.dispositionCountsJson) as Record<string, number>,
      sourceRefs: parseJsonField(record.sourceRefsJson),
      createdByActorId: record.createdByActorId,
      createdByRole: record.createdByRole,
      createdAt: toDateString(record.createdAt) ?? '',
      updatedAt: toDateString(record.updatedAt) ?? '',
      voidedAt: toDateString(record.voidedAt),
    };
  }
}

export class PrismaRecoveryCaseAdjudicationAuditRepository implements RecoveryCaseAdjudicationAuditRepository {
  constructor(private prisma: PrismaClient) {}

  async create(event: { schoolId: string; entityType: string; entityId: string; action: string; actorId: string; actorRole: string; correlationId?: string; safeMetadata?: Record<string, unknown> }): Promise<unknown> {
    const created = await this.prisma.recoveryCaseAdjudicationAuditRecord.create({
      data: {
        schoolId: event.schoolId,
        entityType: event.entityType,
        entityId: event.entityId,
        action: event.action,
        actorId: event.actorId,
        actorRole: event.actorRole,
        correlationId: event.correlationId ?? null,
        safeMetadataJson: (event.safeMetadata ?? {}) as any,
      },
    });
    return this.toContract(created);
  }

  async listBySchool(schoolId: string): Promise<unknown[]> {
    const records = await this.prisma.recoveryCaseAdjudicationAuditRecord.findMany({ where: { schoolId } });
    return records.map(r => this.toContract(r));
  }

  async listByEntityId(schoolId: string, entityId: string): Promise<unknown[]> {
    const records = await this.prisma.recoveryCaseAdjudicationAuditRecord.findMany({ where: { schoolId, entityId } });
    return records.map(r => this.toContract(r));
  }

  private toContract(record: any): unknown {
    return {
      adjudicationAuditEventId: record.adjudicationAuditEventId,
      schoolId: record.schoolId,
      entityType: record.entityType,
      entityId: record.entityId,
      action: record.action,
      actorId: record.actorId,
      actorRole: record.actorRole,
      correlationId: record.correlationId ?? undefined,
      safeMetadata: parseJsonField(record.safeMetadataJson),
      createdAt: toDateString(record.createdAt) ?? '',
    };
  }
}

export class PrismaRecoveryCaseAdjudicationIdempotencyRepository implements RecoveryCaseAdjudicationIdempotencyRepository {
  constructor(private prisma: PrismaClient) {}

  async getByKey(schoolId: string, idempotencyKey: string, operation: string): Promise<{ status: string; responseRef?: string } | null> {
    const record = await this.prisma.recoveryCaseAdjudicationIdempotencyRecord.findFirst({
      where: { schoolId, idempotencyKey, operation },
    });
    if (!record) return null;
    return { status: record.status, responseRef: record.responseRef ?? undefined };
  }

  async create(entry: { schoolId: string; idempotencyKey: string; operation: string; requestHash: string; responseRef?: string; status?: string }): Promise<unknown> {
    const created = await this.prisma.recoveryCaseAdjudicationIdempotencyRecord.create({
      data: {
        schoolId: entry.schoolId,
        idempotencyKey: entry.idempotencyKey,
        operation: entry.operation,
        requestHash: entry.requestHash,
        responseRef: entry.responseRef ?? null,
        status: entry.status ?? 'in_progress',
      },
    });
    return {
      adjudicationIdempotencyId: created.adjudicationIdempotencyId,
      schoolId: created.schoolId,
      idempotencyKey: created.idempotencyKey,
      operation: created.operation,
      requestHash: created.requestHash,
      responseRef: created.responseRef ?? undefined,
      status: created.status,
      createdAt: toDateString(created.createdAt) ?? '',
      completedAt: toDateString(created.completedAt),
    };
  }

  async complete(schoolId: string, idempotencyKey: string, operation: string, responseRef: string): Promise<void> {
    await this.prisma.recoveryCaseAdjudicationIdempotencyRecord.updateMany({
      where: { schoolId, idempotencyKey, operation },
      data: { status: 'completed', responseRef, completedAt: new Date() },
    });
  }
}

export class PrismaRecoveryCaseAdjudicationRepositories {
  adjudicationReadiness: PrismaRecoveryCaseAdjudicationReadinessRepository;
  reviewSession: PrismaRecoveryCaseReviewSessionRepository;
  evidenceBundle: PrismaRecoveryCaseReviewEvidenceBundleRepository;
  reviewChecklist: PrismaRecoveryCaseReviewChecklistRepository;
  conflictOfInterestDeclaration: PrismaRecoveryCaseConflictOfInterestDeclarationRepository;
  reviewerDecisionDraft: PrismaRecoveryCaseReviewerDecisionDraftRepository;
  priorityOverrideRequest: PrismaRecoveryCasePriorityOverrideRequestRepository;
  secondReviewRequest: PrismaRecoveryCaseSecondReviewRequestRepository;
  reviewerConsensus: PrismaRecoveryCaseReviewerConsensusRepository;
  disagreementResolutionDraft: PrismaRecoveryCaseDisagreementResolutionDraftRepository;
  queueDisposition: PrismaRecoveryCaseQueueDispositionRepository;
  qualitySample: PrismaRecoveryCaseQualitySampleRepository;
  adjudicationSummary: PrismaRecoveryCaseAdjudicationSummaryRepository;
  audit: PrismaRecoveryCaseAdjudicationAuditRepository;
  idempotency: PrismaRecoveryCaseAdjudicationIdempotencyRepository;

  constructor(prisma: PrismaClient) {
    this.adjudicationReadiness = new PrismaRecoveryCaseAdjudicationReadinessRepository(prisma);
    this.reviewSession = new PrismaRecoveryCaseReviewSessionRepository(prisma);
    this.evidenceBundle = new PrismaRecoveryCaseReviewEvidenceBundleRepository(prisma);
    this.reviewChecklist = new PrismaRecoveryCaseReviewChecklistRepository(prisma);
    this.conflictOfInterestDeclaration = new PrismaRecoveryCaseConflictOfInterestDeclarationRepository(prisma);
    this.reviewerDecisionDraft = new PrismaRecoveryCaseReviewerDecisionDraftRepository(prisma);
    this.priorityOverrideRequest = new PrismaRecoveryCasePriorityOverrideRequestRepository(prisma);
    this.secondReviewRequest = new PrismaRecoveryCaseSecondReviewRequestRepository(prisma);
    this.reviewerConsensus = new PrismaRecoveryCaseReviewerConsensusRepository(prisma);
    this.disagreementResolutionDraft = new PrismaRecoveryCaseDisagreementResolutionDraftRepository(prisma);
    this.queueDisposition = new PrismaRecoveryCaseQueueDispositionRepository(prisma);
    this.qualitySample = new PrismaRecoveryCaseQualitySampleRepository(prisma);
    this.adjudicationSummary = new PrismaRecoveryCaseAdjudicationSummaryRepository(prisma);
    this.audit = new PrismaRecoveryCaseAdjudicationAuditRepository(prisma);
    this.idempotency = new PrismaRecoveryCaseAdjudicationIdempotencyRepository(prisma);
  }
}
