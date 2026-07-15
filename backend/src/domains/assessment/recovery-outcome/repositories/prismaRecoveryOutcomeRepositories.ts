import { PrismaClient } from '@prisma/client';
import {
  RecoveryOutcomeDecisionReadiness,
  RecoveryOutcomeDecisionReadinessCreateRequest,
} from '../contracts/recoveryOutcomeDecisionReadinessContracts';
import {
  RecoveryExitCriteria,
  RecoveryExitCriteriaCreateRequest,
} from '../contracts/recoveryExitCriteriaContracts';
import {
  RecoveryContinuationDecisionDraft,
  RecoveryIntensificationDecisionDraft,
  RecoveryPauseDecisionDraft,
  RecoveryClosureDecisionDraft,
  DecisionDraftCreateRequest,
} from '../contracts/recoveryDecisionDraftContracts';
import {
  RecoveryOutcomeTeacherReviewPacket,
  RecoveryOutcomeTeacherReviewPacketCreateRequest,
} from '../contracts/recoveryOutcomeTeacherReviewPacketContracts';
import {
  RecoveryOutcomeStudentNextStepDraft,
  RecoveryOutcomeStudentNextStepDraftCreateRequest,
} from '../contracts/recoveryOutcomeStudentNextStepDraftContracts';
import {
  RecoveryOutcomeParentUpdateDraft,
  RecoveryOutcomeParentUpdateDraftCreateRequest,
} from '../contracts/recoveryOutcomeParentUpdateDraftContracts';
import {
  RecoveryOutcomeDecisionSummary,
  RecoveryOutcomeDecisionSummaryCreateRequest,
} from '../contracts/recoveryOutcomeSummaryContracts';
import {
  RecoveryOutcomeAuditEvent,
  RecoveryOutcomeIdempotencyEntry,
} from '../contracts/recoveryOutcomeContracts';
import {
  RecoveryOutcomeDecisionReadinessRepository,
  RecoveryExitCriteriaRepository,
  RecoveryContinuationDecisionDraftRepository,
  RecoveryIntensificationDecisionDraftRepository,
  RecoveryPauseDecisionDraftRepository,
  RecoveryClosureDecisionDraftRepository,
  RecoveryOutcomeTeacherReviewPacketRepository,
  RecoveryOutcomeStudentNextStepDraftRepository,
  RecoveryOutcomeParentUpdateDraftRepository,
  RecoveryOutcomeDecisionSummaryRepository,
  RecoveryOutcomeAuditRepository,
  RecoveryOutcomeIdempotencyRepository,
} from '../contracts/recoveryOutcomeRepositoryContracts';
import {
  RecoveryExitCriteriaEvaluation,
  RecoveryExitCriteriaEvaluationRepository,
} from './inMemoryRecoveryOutcomeRepositories';

function mapDate(d: Date | null | undefined): string | undefined {
  return d ? d.toISOString() : undefined;
}

function parseJson(v: unknown): Record<string, unknown> {
  if (v && typeof v === 'object') return v as Record<string, unknown>;
  return {};
}

function parseStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v as string[];
  return [];
}

export class PrismaRecoveryOutcomeDecisionReadinessRepository implements RecoveryOutcomeDecisionReadinessRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: RecoveryOutcomeDecisionReadinessCreateRequest & { createdByActorId: string; createdByRole: string }): Promise<RecoveryOutcomeDecisionReadiness> {
    const record = await this.prisma.recoveryOutcomeDecisionReadinessRecord.create({ data: { ...data, createdAt: new Date(), updatedAt: new Date() } as any });
    return this.mapOut(record);
  }
  async getById(id: string): Promise<RecoveryOutcomeDecisionReadiness | null> {
    const record = await this.prisma.recoveryOutcomeDecisionReadinessRecord.findUnique({ where: { recoveryOutcomeDecisionReadinessId: id } });
    return record ? this.mapOut(record) : null;
  }
  async listBySchool(schoolId: string): Promise<RecoveryOutcomeDecisionReadiness[]> {
    const records = await this.prisma.recoveryOutcomeDecisionReadinessRecord.findMany({ where: { schoolId } });
    return records.map(r => this.mapOut(r));
  }
  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryOutcomeDecisionReadiness[]> {
    const records = await this.prisma.recoveryOutcomeDecisionReadinessRecord.findMany({ where: { schoolId, studentRef } });
    return records.map(r => this.mapOut(r));
  }
  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryOutcomeDecisionReadiness[]> {
    const records = await this.prisma.recoveryOutcomeDecisionReadinessRecord.findMany({ where: { schoolId, resultRecoveryPlanId: planId } });
    return records.map(r => this.mapOut(r));
  }
  async listByProgressSummaryId(progressSummaryId: string): Promise<RecoveryOutcomeDecisionReadiness[]> {
    const records = await this.prisma.recoveryOutcomeDecisionReadinessRecord.findMany({ where: { recoveryProgressSummaryId: progressSummaryId } });
    return records.map(r => this.mapOut(r));
  }
  async listByEvidenceRollupId(evidenceRollupId: string): Promise<RecoveryOutcomeDecisionReadiness[]> {
    const records = await this.prisma.recoveryOutcomeDecisionReadinessRecord.findMany({ where: { recoveryEvidenceRollupId: evidenceRollupId } });
    return records.map(r => this.mapOut(r));
  }
  async listByStatus(schoolId: string, status: string): Promise<RecoveryOutcomeDecisionReadiness[]> {
    const records = await this.prisma.recoveryOutcomeDecisionReadinessRecord.findMany({ where: { schoolId, readinessStatus: status } });
    return records.map(r => this.mapOut(r));
  }
  async update(id: string, data: Partial<RecoveryOutcomeDecisionReadiness>): Promise<RecoveryOutcomeDecisionReadiness> {
    const record = await this.prisma.recoveryOutcomeDecisionReadinessRecord.update({ where: { recoveryOutcomeDecisionReadinessId: id }, data: { ...data, updatedAt: new Date() } as any });
    return this.mapOut(record);
  }
  async updateStatus(id: string, status: string, timestamp: string): Promise<RecoveryOutcomeDecisionReadiness> {
    return this.update(id, { readinessStatus: status as any, updatedAt: timestamp } as any);
  }

  private mapOut(r: any): RecoveryOutcomeDecisionReadiness {
    return { ...r, createdAt: mapDate(r.createdAt) || '', updatedAt: mapDate(r.updatedAt) || '', reviewReadyAt: mapDate(r.reviewReadyAt), approvedForFutureUseAt: mapDate(r.approvedForFutureUseAt), suppressedAt: mapDate(r.suppressedAt), blockedAt: mapDate(r.blockedAt), voidedAt: mapDate(r.voidedAt), readinessChecksJson: parseJson(r.readinessChecksJson), blockedReasonCodesJson: parseStringArray(r.blockedReasonCodesJson), sourceRefsJson: parseJson(r.sourceRefsJson) };
  }
}

export class PrismaRecoveryExitCriteriaRepository implements RecoveryExitCriteriaRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: RecoveryExitCriteriaCreateRequest & { createdByActorId: string; createdByRole: string }): Promise<RecoveryExitCriteria> {
    const record = await this.prisma.recoveryExitCriteriaRecord.create({ data: { ...data, createdAt: new Date(), updatedAt: new Date() } as any });
    return this.mapOut(record);
  }
  async getById(id: string): Promise<RecoveryExitCriteria | null> {
    const record = await this.prisma.recoveryExitCriteriaRecord.findUnique({ where: { recoveryExitCriteriaId: id } });
    return record ? this.mapOut(record) : null;
  }
  async listBySchool(schoolId: string): Promise<RecoveryExitCriteria[]> {
    const records = await this.prisma.recoveryExitCriteriaRecord.findMany({ where: { schoolId } });
    return records.map(r => this.mapOut(r));
  }
  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryExitCriteria[]> {
    const records = await this.prisma.recoveryExitCriteriaRecord.findMany({ where: { schoolId, resultRecoveryPlanId: planId } });
    return records.map(r => this.mapOut(r));
  }
  async listByStatus(schoolId: string, status: string): Promise<RecoveryExitCriteria[]> {
    const records = await this.prisma.recoveryExitCriteriaRecord.findMany({ where: { schoolId, criteriaStatus: status } });
    return records.map(r => this.mapOut(r));
  }
  async listByDecisionType(schoolId: string, type: string): Promise<RecoveryExitCriteria[]> {
    const records = await this.prisma.recoveryExitCriteriaRecord.findMany({ where: { schoolId, criteriaType: type } });
    return records.map(r => this.mapOut(r));
  }
  async update(id: string, data: Partial<RecoveryExitCriteria>): Promise<RecoveryExitCriteria> {
    const record = await this.prisma.recoveryExitCriteriaRecord.update({ where: { recoveryExitCriteriaId: id }, data: { ...data, updatedAt: new Date() } as any });
    return this.mapOut(record);
  }
  async updateStatus(id: string, status: string, timestamp: string): Promise<RecoveryExitCriteria> {
    return this.update(id, { criteriaStatus: status as any, updatedAt: timestamp } as any);
  }

  private mapOut(r: any): RecoveryExitCriteria {
    return { ...r, createdAt: mapDate(r.createdAt) || '', updatedAt: mapDate(r.updatedAt) || '', reviewReadyAt: mapDate(r.reviewReadyAt), approvedForFutureUseAt: mapDate(r.approvedForFutureUseAt), suppressedAt: mapDate(r.suppressedAt), blockedAt: mapDate(r.blockedAt), voidedAt: mapDate(r.voidedAt), criteriaDetailsJson: parseJson(r.criteriaDetailsJson), blockedReasonCodesJson: parseStringArray(r.blockedReasonCodesJson) };
  }
}

export class PrismaRecoveryExitCriteriaEvaluationRepository implements RecoveryExitCriteriaEvaluationRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: RecoveryExitCriteriaEvaluation): Promise<RecoveryExitCriteriaEvaluation> {
    const record = await this.prisma.recoveryExitCriteriaEvaluationRecord.create({ data: { ...data, createdAt: new Date(data.createdAt), updatedAt: new Date(data.updatedAt) } as any });
    return this.mapOut(record);
  }
  async getById(id: string): Promise<RecoveryExitCriteriaEvaluation | null> {
    const record = await this.prisma.recoveryExitCriteriaEvaluationRecord.findUnique({ where: { recoveryExitCriteriaEvaluationId: id } });
    return record ? this.mapOut(record) : null;
  }
  async listBySchool(schoolId: string): Promise<RecoveryExitCriteriaEvaluation[]> {
    const records = await this.prisma.recoveryExitCriteriaEvaluationRecord.findMany({ where: { schoolId } });
    return records.map(r => this.mapOut(r));
  }
  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryExitCriteriaEvaluation[]> {
    const records = await this.prisma.recoveryExitCriteriaEvaluationRecord.findMany({ where: { schoolId, studentRef } });
    return records.map(r => this.mapOut(r));
  }
  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryExitCriteriaEvaluation[]> {
    const records = await this.prisma.recoveryExitCriteriaEvaluationRecord.findMany({ where: { schoolId, resultRecoveryPlanId: planId } });
    return records.map(r => this.mapOut(r));
  }
  async listByCriteriaId(criteriaId: string): Promise<RecoveryExitCriteriaEvaluation[]> {
    const records = await this.prisma.recoveryExitCriteriaEvaluationRecord.findMany({ where: { recoveryExitCriteriaId: criteriaId } });
    return records.map(r => this.mapOut(r));
  }
  async listByStatus(schoolId: string, status: string): Promise<RecoveryExitCriteriaEvaluation[]> {
    const records = await this.prisma.recoveryExitCriteriaEvaluationRecord.findMany({ where: { schoolId, evaluationStatus: status } });
    return records.map(r => this.mapOut(r));
  }
  async listByResult(schoolId: string, result: string): Promise<RecoveryExitCriteriaEvaluation[]> {
    const records = await this.prisma.recoveryExitCriteriaEvaluationRecord.findMany({ where: { schoolId, evaluationResult: result } });
    return records.map(r => this.mapOut(r));
  }
  async update(id: string, data: Partial<RecoveryExitCriteriaEvaluation>): Promise<RecoveryExitCriteriaEvaluation> {
    const record = await this.prisma.recoveryExitCriteriaEvaluationRecord.update({ where: { recoveryExitCriteriaEvaluationId: id }, data: { ...data, updatedAt: new Date() } as any });
    return this.mapOut(record);
  }
  async updateStatus(id: string, status: string, timestamp: string): Promise<RecoveryExitCriteriaEvaluation> {
    return this.update(id, { evaluationStatus: status as any, updatedAt: timestamp } as any);
  }

  private mapOut(r: any): RecoveryExitCriteriaEvaluation {
    return { ...r, createdAt: mapDate(r.createdAt) || '', updatedAt: mapDate(r.updatedAt) || '', reviewReadyAt: mapDate(r.reviewReadyAt), approvedForFutureUseAt: mapDate(r.approvedForFutureUseAt), suppressedAt: mapDate(r.suppressedAt), blockedAt: mapDate(r.blockedAt), voidedAt: mapDate(r.voidedAt), evidenceRefsJson: parseJson(r.evidenceRefsJson), blockedReasonCodesJson: parseStringArray(r.blockedReasonCodesJson), sourceRefsJson: parseJson(r.sourceRefsJson) };
  }
}

export class PrismaRecoveryContinuationDecisionDraftRepository implements RecoveryContinuationDecisionDraftRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: DecisionDraftCreateRequest & { createdByActorId: string; createdByRole: string; draftStatus?: string }): Promise<RecoveryContinuationDecisionDraft> {
    const record = await this.prisma.recoveryContinuationDecisionDraftRecord.create({ data: { ...data, createdAt: new Date(), updatedAt: new Date() } as any });
    return this.mapOut(record);
  }
  async getById(id: string): Promise<RecoveryContinuationDecisionDraft | null> {
    const record = await this.prisma.recoveryContinuationDecisionDraftRecord.findUnique({ where: { recoveryContinuationDecisionDraftId: id } });
    return record ? this.mapOut(record) : null;
  }
  async listBySchool(schoolId: string): Promise<RecoveryContinuationDecisionDraft[]> {
    const records = await this.prisma.recoveryContinuationDecisionDraftRecord.findMany({ where: { schoolId } });
    return records.map(r => this.mapOut(r));
  }
  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryContinuationDecisionDraft[]> {
    const records = await this.prisma.recoveryContinuationDecisionDraftRecord.findMany({ where: { schoolId, studentRef } });
    return records.map(r => this.mapOut(r));
  }
  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryContinuationDecisionDraft[]> {
    const records = await this.prisma.recoveryContinuationDecisionDraftRecord.findMany({ where: { schoolId, resultRecoveryPlanId: planId } });
    return records.map(r => this.mapOut(r));
  }
  async listByProgressSummaryId(progressSummaryId: string): Promise<RecoveryContinuationDecisionDraft[]> {
    const records = await this.prisma.recoveryContinuationDecisionDraftRecord.findMany({ where: { recoveryProgressSummaryId: progressSummaryId } });
    return records.map(r => this.mapOut(r));
  }
  async listByEvidenceRollupId(evidenceRollupId: string): Promise<RecoveryContinuationDecisionDraft[]> {
    const records = await this.prisma.recoveryContinuationDecisionDraftRecord.findMany({ where: { recoveryEvidenceRollupId: evidenceRollupId } });
    return records.map(r => this.mapOut(r));
  }
  async listByStatus(schoolId: string, status: string): Promise<RecoveryContinuationDecisionDraft[]> {
    const records = await this.prisma.recoveryContinuationDecisionDraftRecord.findMany({ where: { schoolId, draftStatus: status } });
    return records.map(r => this.mapOut(r));
  }
  async update(id: string, data: Partial<RecoveryContinuationDecisionDraft>): Promise<RecoveryContinuationDecisionDraft> {
    const record = await this.prisma.recoveryContinuationDecisionDraftRecord.update({ where: { recoveryContinuationDecisionDraftId: id }, data: { ...data, updatedAt: new Date() } as any });
    return this.mapOut(record);
  }
  async updateStatus(id: string, status: string, timestamp: string): Promise<RecoveryContinuationDecisionDraft> {
    return this.update(id, { draftStatus: status as any, updatedAt: timestamp } as any);
  }

  private mapOut(r: any): RecoveryContinuationDecisionDraft {
    return { ...r, createdAt: mapDate(r.createdAt) || '', updatedAt: mapDate(r.updatedAt) || '', reviewReadyAt: mapDate(r.reviewReadyAt), approvedForFutureUseAt: mapDate(r.approvedForFutureUseAt), suppressedAt: mapDate(r.suppressedAt), blockedAt: mapDate(r.blockedAt), voidedAt: mapDate(r.voidedAt), rationaleJson: parseJson(r.rationaleJson), blockedReasonCodesJson: parseStringArray(r.blockedReasonCodesJson), sourceRefsJson: parseJson(r.sourceRefsJson) };
  }
}

export class PrismaRecoveryIntensificationDecisionDraftRepository implements RecoveryIntensificationDecisionDraftRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: DecisionDraftCreateRequest & { createdByActorId: string; createdByRole: string; draftStatus?: string }): Promise<RecoveryIntensificationDecisionDraft> {
    const record = await this.prisma.recoveryIntensificationDecisionDraftRecord.create({ data: { ...data, createdAt: new Date(), updatedAt: new Date() } as any });
    return this.mapOut(record);
  }
  async getById(id: string): Promise<RecoveryIntensificationDecisionDraft | null> {
    const record = await this.prisma.recoveryIntensificationDecisionDraftRecord.findUnique({ where: { recoveryIntensificationDecisionDraftId: id } });
    return record ? this.mapOut(record) : null;
  }
  async listBySchool(schoolId: string): Promise<RecoveryIntensificationDecisionDraft[]> {
    const records = await this.prisma.recoveryIntensificationDecisionDraftRecord.findMany({ where: { schoolId } });
    return records.map(r => this.mapOut(r));
  }
  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryIntensificationDecisionDraft[]> {
    const records = await this.prisma.recoveryIntensificationDecisionDraftRecord.findMany({ where: { schoolId, studentRef } });
    return records.map(r => this.mapOut(r));
  }
  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryIntensificationDecisionDraft[]> {
    const records = await this.prisma.recoveryIntensificationDecisionDraftRecord.findMany({ where: { schoolId, resultRecoveryPlanId: planId } });
    return records.map(r => this.mapOut(r));
  }
  async listByProgressSummaryId(progressSummaryId: string): Promise<RecoveryIntensificationDecisionDraft[]> {
    const records = await this.prisma.recoveryIntensificationDecisionDraftRecord.findMany({ where: { recoveryProgressSummaryId: progressSummaryId } });
    return records.map(r => this.mapOut(r));
  }
  async listByEvidenceRollupId(evidenceRollupId: string): Promise<RecoveryIntensificationDecisionDraft[]> {
    const records = await this.prisma.recoveryIntensificationDecisionDraftRecord.findMany({ where: { recoveryEvidenceRollupId: evidenceRollupId } });
    return records.map(r => this.mapOut(r));
  }
  async listByStatus(schoolId: string, status: string): Promise<RecoveryIntensificationDecisionDraft[]> {
    const records = await this.prisma.recoveryIntensificationDecisionDraftRecord.findMany({ where: { schoolId, draftStatus: status } });
    return records.map(r => this.mapOut(r));
  }
  async update(id: string, data: Partial<RecoveryIntensificationDecisionDraft>): Promise<RecoveryIntensificationDecisionDraft> {
    const record = await this.prisma.recoveryIntensificationDecisionDraftRecord.update({ where: { recoveryIntensificationDecisionDraftId: id }, data: { ...data, updatedAt: new Date() } as any });
    return this.mapOut(record);
  }
  async updateStatus(id: string, status: string, timestamp: string): Promise<RecoveryIntensificationDecisionDraft> {
    return this.update(id, { draftStatus: status as any, updatedAt: timestamp } as any);
  }

  private mapOut(r: any): RecoveryIntensificationDecisionDraft {
    return { ...r, createdAt: mapDate(r.createdAt) || '', updatedAt: mapDate(r.updatedAt) || '', reviewReadyAt: mapDate(r.reviewReadyAt), approvedForFutureUseAt: mapDate(r.approvedForFutureUseAt), suppressedAt: mapDate(r.suppressedAt), blockedAt: mapDate(r.blockedAt), voidedAt: mapDate(r.voidedAt), rationaleJson: parseJson(r.rationaleJson), blockedReasonCodesJson: parseStringArray(r.blockedReasonCodesJson), sourceRefsJson: parseJson(r.sourceRefsJson) };
  }
}

export class PrismaRecoveryPauseDecisionDraftRepository implements RecoveryPauseDecisionDraftRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: DecisionDraftCreateRequest & { createdByActorId: string; createdByRole: string; draftStatus?: string }): Promise<RecoveryPauseDecisionDraft> {
    const record = await this.prisma.recoveryPauseDecisionDraftRecord.create({ data: { ...data, createdAt: new Date(), updatedAt: new Date() } as any });
    return this.mapOut(record);
  }
  async getById(id: string): Promise<RecoveryPauseDecisionDraft | null> {
    const record = await this.prisma.recoveryPauseDecisionDraftRecord.findUnique({ where: { recoveryPauseDecisionDraftId: id } });
    return record ? this.mapOut(record) : null;
  }
  async listBySchool(schoolId: string): Promise<RecoveryPauseDecisionDraft[]> {
    const records = await this.prisma.recoveryPauseDecisionDraftRecord.findMany({ where: { schoolId } });
    return records.map(r => this.mapOut(r));
  }
  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryPauseDecisionDraft[]> {
    const records = await this.prisma.recoveryPauseDecisionDraftRecord.findMany({ where: { schoolId, studentRef } });
    return records.map(r => this.mapOut(r));
  }
  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryPauseDecisionDraft[]> {
    const records = await this.prisma.recoveryPauseDecisionDraftRecord.findMany({ where: { schoolId, resultRecoveryPlanId: planId } });
    return records.map(r => this.mapOut(r));
  }
  async listByProgressSummaryId(progressSummaryId: string): Promise<RecoveryPauseDecisionDraft[]> {
    const records = await this.prisma.recoveryPauseDecisionDraftRecord.findMany({ where: { recoveryProgressSummaryId: progressSummaryId } });
    return records.map(r => this.mapOut(r));
  }
  async listByEvidenceRollupId(evidenceRollupId: string): Promise<RecoveryPauseDecisionDraft[]> {
    const records = await this.prisma.recoveryPauseDecisionDraftRecord.findMany({ where: { recoveryEvidenceRollupId: evidenceRollupId } });
    return records.map(r => this.mapOut(r));
  }
  async listByStatus(schoolId: string, status: string): Promise<RecoveryPauseDecisionDraft[]> {
    const records = await this.prisma.recoveryPauseDecisionDraftRecord.findMany({ where: { schoolId, draftStatus: status } });
    return records.map(r => this.mapOut(r));
  }
  async update(id: string, data: Partial<RecoveryPauseDecisionDraft>): Promise<RecoveryPauseDecisionDraft> {
    const record = await this.prisma.recoveryPauseDecisionDraftRecord.update({ where: { recoveryPauseDecisionDraftId: id }, data: { ...data, updatedAt: new Date() } as any });
    return this.mapOut(record);
  }
  async updateStatus(id: string, status: string, timestamp: string): Promise<RecoveryPauseDecisionDraft> {
    return this.update(id, { draftStatus: status as any, updatedAt: timestamp } as any);
  }

  private mapOut(r: any): RecoveryPauseDecisionDraft {
    return { ...r, createdAt: mapDate(r.createdAt) || '', updatedAt: mapDate(r.updatedAt) || '', reviewReadyAt: mapDate(r.reviewReadyAt), approvedForFutureUseAt: mapDate(r.approvedForFutureUseAt), suppressedAt: mapDate(r.suppressedAt), blockedAt: mapDate(r.blockedAt), voidedAt: mapDate(r.voidedAt), rationaleJson: parseJson(r.rationaleJson), blockedReasonCodesJson: parseStringArray(r.blockedReasonCodesJson), sourceRefsJson: parseJson(r.sourceRefsJson) };
  }
}

export class PrismaRecoveryClosureDecisionDraftRepository implements RecoveryClosureDecisionDraftRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: DecisionDraftCreateRequest & { createdByActorId: string; createdByRole: string; draftStatus?: string }): Promise<RecoveryClosureDecisionDraft> {
    const record = await this.prisma.recoveryClosureDecisionDraftRecord.create({ data: { ...data, createdAt: new Date(), updatedAt: new Date() } as any });
    return this.mapOut(record);
  }
  async getById(id: string): Promise<RecoveryClosureDecisionDraft | null> {
    const record = await this.prisma.recoveryClosureDecisionDraftRecord.findUnique({ where: { recoveryClosureDecisionDraftId: id } });
    return record ? this.mapOut(record) : null;
  }
  async listBySchool(schoolId: string): Promise<RecoveryClosureDecisionDraft[]> {
    const records = await this.prisma.recoveryClosureDecisionDraftRecord.findMany({ where: { schoolId } });
    return records.map(r => this.mapOut(r));
  }
  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryClosureDecisionDraft[]> {
    const records = await this.prisma.recoveryClosureDecisionDraftRecord.findMany({ where: { schoolId, studentRef } });
    return records.map(r => this.mapOut(r));
  }
  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryClosureDecisionDraft[]> {
    const records = await this.prisma.recoveryClosureDecisionDraftRecord.findMany({ where: { schoolId, resultRecoveryPlanId: planId } });
    return records.map(r => this.mapOut(r));
  }
  async listByProgressSummaryId(progressSummaryId: string): Promise<RecoveryClosureDecisionDraft[]> {
    const records = await this.prisma.recoveryClosureDecisionDraftRecord.findMany({ where: { recoveryProgressSummaryId: progressSummaryId } });
    return records.map(r => this.mapOut(r));
  }
  async listByEvidenceRollupId(evidenceRollupId: string): Promise<RecoveryClosureDecisionDraft[]> {
    const records = await this.prisma.recoveryClosureDecisionDraftRecord.findMany({ where: { recoveryEvidenceRollupId: evidenceRollupId } });
    return records.map(r => this.mapOut(r));
  }
  async listByStatus(schoolId: string, status: string): Promise<RecoveryClosureDecisionDraft[]> {
    const records = await this.prisma.recoveryClosureDecisionDraftRecord.findMany({ where: { schoolId, draftStatus: status } });
    return records.map(r => this.mapOut(r));
  }
  async listByClosureType(schoolId: string, closureType: string): Promise<RecoveryClosureDecisionDraft[]> {
    const records = await this.prisma.recoveryClosureDecisionDraftRecord.findMany({ where: { schoolId, closureType } });
    return records.map(r => this.mapOut(r));
  }
  async update(id: string, data: Partial<RecoveryClosureDecisionDraft>): Promise<RecoveryClosureDecisionDraft> {
    const record = await this.prisma.recoveryClosureDecisionDraftRecord.update({ where: { recoveryClosureDecisionDraftId: id }, data: { ...data, updatedAt: new Date() } as any });
    return this.mapOut(record);
  }
  async updateStatus(id: string, status: string, timestamp: string): Promise<RecoveryClosureDecisionDraft> {
    return this.update(id, { draftStatus: status as any, updatedAt: timestamp } as any);
  }

  private mapOut(r: any): RecoveryClosureDecisionDraft {
    return { ...r, createdAt: mapDate(r.createdAt) || '', updatedAt: mapDate(r.updatedAt) || '', reviewReadyAt: mapDate(r.reviewReadyAt), approvedForFutureUseAt: mapDate(r.approvedForFutureUseAt), suppressedAt: mapDate(r.suppressedAt), blockedAt: mapDate(r.blockedAt), voidedAt: mapDate(r.voidedAt), rationaleJson: parseJson(r.rationaleJson), futureReviewRefsJson: parseJson(r.futureReviewRefsJson), blockedReasonCodesJson: parseStringArray(r.blockedReasonCodesJson), sourceRefsJson: parseJson(r.sourceRefsJson) };
  }
}

export class PrismaRecoveryOutcomeTeacherReviewPacketRepository implements RecoveryOutcomeTeacherReviewPacketRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: RecoveryOutcomeTeacherReviewPacketCreateRequest & { createdByActorId: string; createdByRole: string }): Promise<RecoveryOutcomeTeacherReviewPacket> {
    const record = await this.prisma.recoveryOutcomeTeacherReviewPacketRecord.create({ data: { ...data, createdAt: new Date(), updatedAt: new Date() } as any });
    return this.mapOut(record);
  }
  async getById(id: string): Promise<RecoveryOutcomeTeacherReviewPacket | null> {
    const record = await this.prisma.recoveryOutcomeTeacherReviewPacketRecord.findUnique({ where: { recoveryOutcomeTeacherReviewPacketId: id } });
    return record ? this.mapOut(record) : null;
  }
  async listBySchool(schoolId: string): Promise<RecoveryOutcomeTeacherReviewPacket[]> {
    const records = await this.prisma.recoveryOutcomeTeacherReviewPacketRecord.findMany({ where: { schoolId } });
    return records.map(r => this.mapOut(r));
  }
  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryOutcomeTeacherReviewPacket[]> {
    const records = await this.prisma.recoveryOutcomeTeacherReviewPacketRecord.findMany({ where: { schoolId, studentRef } });
    return records.map(r => this.mapOut(r));
  }
  async listByTeacherRef(schoolId: string, teacherRef: string): Promise<RecoveryOutcomeTeacherReviewPacket[]> {
    const records = await this.prisma.recoveryOutcomeTeacherReviewPacketRecord.findMany({ where: { schoolId, teacherRef } });
    return records.map(r => this.mapOut(r));
  }
  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryOutcomeTeacherReviewPacket[]> {
    const records = await this.prisma.recoveryOutcomeTeacherReviewPacketRecord.findMany({ where: { schoolId, resultRecoveryPlanId: planId } });
    return records.map(r => this.mapOut(r));
  }
  async listByProgressSummaryId(progressSummaryId: string): Promise<RecoveryOutcomeTeacherReviewPacket[]> {
    const records = await this.prisma.recoveryOutcomeTeacherReviewPacketRecord.findMany({ where: { recoveryProgressSummaryId: progressSummaryId } });
    return records.map(r => this.mapOut(r));
  }
  async listByEvidenceRollupId(evidenceRollupId: string): Promise<RecoveryOutcomeTeacherReviewPacket[]> {
    const records = await this.prisma.recoveryOutcomeTeacherReviewPacketRecord.findMany({ where: { recoveryEvidenceRollupId: evidenceRollupId } });
    return records.map(r => this.mapOut(r));
  }
  async listByStatus(schoolId: string, status: string): Promise<RecoveryOutcomeTeacherReviewPacket[]> {
    const records = await this.prisma.recoveryOutcomeTeacherReviewPacketRecord.findMany({ where: { schoolId, packetStatus: status } });
    return records.map(r => this.mapOut(r));
  }
  async update(id: string, data: Partial<RecoveryOutcomeTeacherReviewPacket>): Promise<RecoveryOutcomeTeacherReviewPacket> {
    const record = await this.prisma.recoveryOutcomeTeacherReviewPacketRecord.update({ where: { recoveryOutcomeTeacherReviewPacketId: id }, data: { ...data, updatedAt: new Date() } as any });
    return this.mapOut(record);
  }
  async updateStatus(id: string, status: string, timestamp: string): Promise<RecoveryOutcomeTeacherReviewPacket> {
    return this.update(id, { packetStatus: status as any, updatedAt: timestamp } as any);
  }

  private mapOut(r: any): RecoveryOutcomeTeacherReviewPacket {
    return { ...r, createdAt: mapDate(r.createdAt) || '', updatedAt: mapDate(r.updatedAt) || '', teacherReviewCompleteAt: mapDate(r.teacherReviewCompleteAt), reviewReadyAt: mapDate(r.reviewReadyAt), approvedForFutureUseAt: mapDate(r.approvedForFutureUseAt), suppressedAt: mapDate(r.suppressedAt), blockedAt: mapDate(r.blockedAt), voidedAt: mapDate(r.voidedAt), readinessSnapshotJson: parseJson(r.readinessSnapshotJson), decisionDraftRefsJson: parseJson(r.decisionDraftRefsJson), reviewNotesJson: parseJson(r.reviewNotesJson), blockedReasonCodesJson: parseStringArray(r.blockedReasonCodesJson), sourceRefsJson: parseJson(r.sourceRefsJson) };
  }
}

export class PrismaRecoveryOutcomeStudentNextStepDraftRepository implements RecoveryOutcomeStudentNextStepDraftRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: RecoveryOutcomeStudentNextStepDraftCreateRequest & { createdByActorId: string; createdByRole: string }): Promise<RecoveryOutcomeStudentNextStepDraft> {
    const record = await this.prisma.recoveryOutcomeStudentNextStepDraftRecord.create({ data: { ...data, createdAt: new Date(), updatedAt: new Date() } as any });
    return this.mapOut(record);
  }
  async getById(id: string): Promise<RecoveryOutcomeStudentNextStepDraft | null> {
    const record = await this.prisma.recoveryOutcomeStudentNextStepDraftRecord.findUnique({ where: { recoveryOutcomeStudentNextStepDraftId: id } });
    return record ? this.mapOut(record) : null;
  }
  async listBySchool(schoolId: string): Promise<RecoveryOutcomeStudentNextStepDraft[]> {
    const records = await this.prisma.recoveryOutcomeStudentNextStepDraftRecord.findMany({ where: { schoolId } });
    return records.map(r => this.mapOut(r));
  }
  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryOutcomeStudentNextStepDraft[]> {
    const records = await this.prisma.recoveryOutcomeStudentNextStepDraftRecord.findMany({ where: { schoolId, studentRef } });
    return records.map(r => this.mapOut(r));
  }
  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryOutcomeStudentNextStepDraft[]> {
    const records = await this.prisma.recoveryOutcomeStudentNextStepDraftRecord.findMany({ where: { schoolId, resultRecoveryPlanId: planId } });
    return records.map(r => this.mapOut(r));
  }
  async listByStatus(schoolId: string, status: string): Promise<RecoveryOutcomeStudentNextStepDraft[]> {
    const records = await this.prisma.recoveryOutcomeStudentNextStepDraftRecord.findMany({ where: { schoolId, draftStatus: status } });
    return records.map(r => this.mapOut(r));
  }
  async update(id: string, data: Partial<RecoveryOutcomeStudentNextStepDraft>): Promise<RecoveryOutcomeStudentNextStepDraft> {
    const record = await this.prisma.recoveryOutcomeStudentNextStepDraftRecord.update({ where: { recoveryOutcomeStudentNextStepDraftId: id }, data: { ...data, updatedAt: new Date() } as any });
    return this.mapOut(record);
  }
  async updateStatus(id: string, status: string, timestamp: string): Promise<RecoveryOutcomeStudentNextStepDraft> {
    return this.update(id, { draftStatus: status as any, updatedAt: timestamp } as any);
  }

  private mapOut(r: any): RecoveryOutcomeStudentNextStepDraft {
    return { ...r, createdAt: mapDate(r.createdAt) || '', updatedAt: mapDate(r.updatedAt) || '', reviewReadyAt: mapDate(r.reviewReadyAt), approvedForFutureUseAt: mapDate(r.approvedForFutureUseAt), suppressedAt: mapDate(r.suppressedAt), blockedAt: mapDate(r.blockedAt), voidedAt: mapDate(r.voidedAt), socraticPromptJson: parseJson(r.socraticPromptJson), allowedReflectionsJson: parseJson(r.allowedReflectionsJson), blockedReasonCodesJson: parseStringArray(r.blockedReasonCodesJson), sourceRefsJson: parseJson(r.sourceRefsJson) };
  }
}

export class PrismaRecoveryOutcomeParentUpdateDraftRepository implements RecoveryOutcomeParentUpdateDraftRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: RecoveryOutcomeParentUpdateDraftCreateRequest & { createdByActorId: string; createdByRole: string }): Promise<RecoveryOutcomeParentUpdateDraft> {
    const record = await this.prisma.recoveryOutcomeParentUpdateDraftRecord.create({ data: { ...data, createdAt: new Date(), updatedAt: new Date() } as any });
    return this.mapOut(record);
  }
  async getById(id: string): Promise<RecoveryOutcomeParentUpdateDraft | null> {
    const record = await this.prisma.recoveryOutcomeParentUpdateDraftRecord.findUnique({ where: { recoveryOutcomeParentUpdateDraftId: id } });
    return record ? this.mapOut(record) : null;
  }
  async listBySchool(schoolId: string): Promise<RecoveryOutcomeParentUpdateDraft[]> {
    const records = await this.prisma.recoveryOutcomeParentUpdateDraftRecord.findMany({ where: { schoolId } });
    return records.map(r => this.mapOut(r));
  }
  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryOutcomeParentUpdateDraft[]> {
    const records = await this.prisma.recoveryOutcomeParentUpdateDraftRecord.findMany({ where: { schoolId, studentRef } });
    return records.map(r => this.mapOut(r));
  }
  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryOutcomeParentUpdateDraft[]> {
    const records = await this.prisma.recoveryOutcomeParentUpdateDraftRecord.findMany({ where: { schoolId, resultRecoveryPlanId: planId } });
    return records.map(r => this.mapOut(r));
  }
  async listByParentRef(schoolId: string, parentRef: string): Promise<RecoveryOutcomeParentUpdateDraft[]> {
    const records = await this.prisma.recoveryOutcomeParentUpdateDraftRecord.findMany({ where: { schoolId, parentRef } });
    return records.map(r => this.mapOut(r));
  }
  async listByStatus(schoolId: string, status: string): Promise<RecoveryOutcomeParentUpdateDraft[]> {
    const records = await this.prisma.recoveryOutcomeParentUpdateDraftRecord.findMany({ where: { schoolId, draftStatus: status } });
    return records.map(r => this.mapOut(r));
  }
  async update(id: string, data: Partial<RecoveryOutcomeParentUpdateDraft>): Promise<RecoveryOutcomeParentUpdateDraft> {
    const record = await this.prisma.recoveryOutcomeParentUpdateDraftRecord.update({ where: { recoveryOutcomeParentUpdateDraftId: id }, data: { ...data, updatedAt: new Date() } as any });
    return this.mapOut(record);
  }
  async updateStatus(id: string, status: string, timestamp: string): Promise<RecoveryOutcomeParentUpdateDraft> {
    return this.update(id, { draftStatus: status as any, updatedAt: timestamp } as any);
  }

  private mapOut(r: any): RecoveryOutcomeParentUpdateDraft {
    return { ...r, createdAt: mapDate(r.createdAt) || '', updatedAt: mapDate(r.updatedAt) || '', reviewReadyAt: mapDate(r.reviewReadyAt), approvedForFutureUseAt: mapDate(r.approvedForFutureUseAt), suppressedAt: mapDate(r.suppressedAt), blockedAt: mapDate(r.blockedAt), voidedAt: mapDate(r.voidedAt), updateBodyJson: parseJson(r.updateBodyJson), allowedFieldNamesJson: parseStringArray(r.allowedFieldNamesJson), blockedFieldNamesJson: parseStringArray(r.blockedFieldNamesJson), blockedReasonCodesJson: parseStringArray(r.blockedReasonCodesJson), sourceRefsJson: parseJson(r.sourceRefsJson) };
  }
}

export class PrismaRecoveryOutcomeDecisionSummaryRepository implements RecoveryOutcomeDecisionSummaryRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: RecoveryOutcomeDecisionSummaryCreateRequest & { createdByActorId: string; createdByRole: string }): Promise<RecoveryOutcomeDecisionSummary> {
    const record = await this.prisma.recoveryOutcomeDecisionSummaryRecord.create({ data: { ...data, createdAt: new Date(), updatedAt: new Date() } as any });
    return this.mapOut(record);
  }
  async getById(id: string): Promise<RecoveryOutcomeDecisionSummary | null> {
    const record = await this.prisma.recoveryOutcomeDecisionSummaryRecord.findUnique({ where: { recoveryOutcomeDecisionSummaryId: id } });
    return record ? this.mapOut(record) : null;
  }
  async listBySchool(schoolId: string): Promise<RecoveryOutcomeDecisionSummary[]> {
    const records = await this.prisma.recoveryOutcomeDecisionSummaryRecord.findMany({ where: { schoolId } });
    return records.map(r => this.mapOut(r));
  }
  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryOutcomeDecisionSummary[]> {
    const records = await this.prisma.recoveryOutcomeDecisionSummaryRecord.findMany({ where: { schoolId, studentRef } });
    return records.map(r => this.mapOut(r));
  }
  async listByTeacherRef(schoolId: string, teacherRef: string): Promise<RecoveryOutcomeDecisionSummary[]> {
    const records = await this.prisma.recoveryOutcomeDecisionSummaryRecord.findMany({ where: { schoolId, teacherRef } });
    return records.map(r => this.mapOut(r));
  }
  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryOutcomeDecisionSummary[]> {
    const records = await this.prisma.recoveryOutcomeDecisionSummaryRecord.findMany({ where: { schoolId, resultRecoveryPlanId: planId } });
    return records.map(r => this.mapOut(r));
  }
  async listByProgressSummaryId(progressSummaryId: string): Promise<RecoveryOutcomeDecisionSummary[]> {
    const records = await this.prisma.recoveryOutcomeDecisionSummaryRecord.findMany({ where: { recoveryProgressSummaryId: progressSummaryId } });
    return records.map(r => this.mapOut(r));
  }
  async listByEvidenceRollupId(evidenceRollupId: string): Promise<RecoveryOutcomeDecisionSummary[]> {
    const records = await this.prisma.recoveryOutcomeDecisionSummaryRecord.findMany({ where: { recoveryEvidenceRollupId: evidenceRollupId } });
    return records.map(r => this.mapOut(r));
  }
  async listByStatus(schoolId: string, status: string): Promise<RecoveryOutcomeDecisionSummary[]> {
    const records = await this.prisma.recoveryOutcomeDecisionSummaryRecord.findMany({ where: { schoolId, summaryStatus: status } });
    return records.map(r => this.mapOut(r));
  }
  async update(id: string, data: Partial<RecoveryOutcomeDecisionSummary>): Promise<RecoveryOutcomeDecisionSummary> {
    const record = await this.prisma.recoveryOutcomeDecisionSummaryRecord.update({ where: { recoveryOutcomeDecisionSummaryId: id }, data: { ...data, updatedAt: new Date() } as any });
    return this.mapOut(record);
  }
  async updateStatus(id: string, status: string, timestamp: string): Promise<RecoveryOutcomeDecisionSummary> {
    return this.update(id, { summaryStatus: status as any, updatedAt: timestamp } as any);
  }
  async refresh(id: string): Promise<RecoveryOutcomeDecisionSummary> {
    const record = await this.prisma.recoveryOutcomeDecisionSummaryRecord.update({ where: { recoveryOutcomeDecisionSummaryId: id }, data: { refreshedAt: new Date(), updatedAt: new Date() } });
    return this.mapOut(record);
  }

  private mapOut(r: any): RecoveryOutcomeDecisionSummary {
    return { ...r, createdAt: mapDate(r.createdAt) || '', updatedAt: mapDate(r.updatedAt) || '', refreshedAt: mapDate(r.refreshedAt), staleAt: mapDate(r.staleAt), blockedAt: mapDate(r.blockedAt), voidedAt: mapDate(r.voidedAt), decisionCountsJson: parseJson(r.decisionCountsJson), topDecisionsJson: parseJson(r.topDecisionsJson), nextActionRefsJson: parseJson(r.nextActionRefsJson), blockedReasonCodesJson: parseStringArray(r.blockedReasonCodesJson), sourceRefsJson: parseJson(r.sourceRefsJson) };
  }
}

export class PrismaRecoveryOutcomeAuditRepository implements RecoveryOutcomeAuditRepository {
  constructor(private prisma: PrismaClient) {}

  private mapOut(r: any): RecoveryOutcomeAuditEvent {
    return {
      ...r,
      createdAt: mapDate(r.createdAt) || '',
      recoveryOutcomeDecisionReadinessId: r.recoveryOutcomeDecisionReadinessId ?? undefined,
      recoveryExitCriteriaId: r.recoveryExitCriteriaId ?? undefined,
      recoveryContinuationDecisionDraftId: r.recoveryContinuationDecisionDraftId ?? undefined,
      recoveryIntensificationDecisionDraftId: r.recoveryIntensificationDecisionDraftId ?? undefined,
      recoveryPauseDecisionDraftId: r.recoveryPauseDecisionDraftId ?? undefined,
      recoveryClosureDecisionDraftId: r.recoveryClosureDecisionDraftId ?? undefined,
      recoveryOutcomeTeacherReviewPacketId: r.recoveryOutcomeTeacherReviewPacketId ?? undefined,
      recoveryOutcomeStudentNextStepDraftId: r.recoveryOutcomeStudentNextStepDraftId ?? undefined,
      recoveryOutcomeParentUpdateDraftId: r.recoveryOutcomeParentUpdateDraftId ?? undefined,
      recoveryOutcomeDecisionSummaryId: r.recoveryOutcomeDecisionSummaryId ?? undefined,
      requestId: r.requestId ?? undefined,
      correlationId: r.correlationId ?? undefined,
      reasonCodesJson: r.reasonCodesJson ?? undefined,
      metadataJson: r.metadataJson ?? undefined,
    };
  }

  async create(data: RecoveryOutcomeAuditEvent): Promise<RecoveryOutcomeAuditEvent> {
    const record = await this.prisma.recoveryOutcomeAuditRecord.create({ data: { ...data, createdAt: new Date(data.createdAt) } as any });
    return this.mapOut(record);
  }
  async listBySchool(schoolId: string): Promise<RecoveryOutcomeAuditEvent[]> {
    const records = await this.prisma.recoveryOutcomeAuditRecord.findMany({ where: { schoolId } });
    return records.map(r => this.mapOut(r));
  }
}

export class PrismaRecoveryOutcomeIdempotencyRepository implements RecoveryOutcomeIdempotencyRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: RecoveryOutcomeIdempotencyEntry): Promise<RecoveryOutcomeIdempotencyEntry> {
    const record = await this.prisma.recoveryOutcomeIdempotencyRecord.create({ data: { ...data, createdAt: new Date(data.createdAt), updatedAt: new Date(data.updatedAt) } as any });
    return this.mapOut(record);
  }
  async getByKey(schoolId: string, operation: string, idempotencyKey: string): Promise<RecoveryOutcomeIdempotencyEntry | null> {
    const record = await this.prisma.recoveryOutcomeIdempotencyRecord.findUnique({ where: { recoveryOutcomeIdempotencyRecordUniqueKey: { schoolId, operation, idempotencyKey } } } as any);
    return record ? this.mapOut(record) : null;
  }
  async updateStatus(id: string, status: string, safeResultSummary?: string): Promise<RecoveryOutcomeIdempotencyEntry> {
    const record = await this.prisma.recoveryOutcomeIdempotencyRecord.update({ where: { recoveryOutcomeIdempotencyId: id }, data: { status, safeResultSummary, updatedAt: new Date() } });
    return this.mapOut(record);
  }
  async expire(recoveryOutcomeIdempotencyId: string): Promise<RecoveryOutcomeIdempotencyEntry> {
    const record = await this.prisma.recoveryOutcomeIdempotencyRecord.update({ where: { recoveryOutcomeIdempotencyId }, data: { status: 'expired', updatedAt: new Date(), expiresAt: new Date() } });
    return this.mapOut(record);
  }

  private mapOut(r: any): RecoveryOutcomeIdempotencyEntry {
    return { ...r, createdAt: mapDate(r.createdAt) || '', updatedAt: mapDate(r.updatedAt) || '', expiresAt: mapDate(r.expiresAt) };
  }
}
