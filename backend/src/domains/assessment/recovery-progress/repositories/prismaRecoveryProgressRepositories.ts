import { PrismaClient } from '@prisma/client';
import {
  RecoveryProgressObservation, RecoveryCheckpointEvaluation, RecoveryOutcomeEvidence,
  RecoveryPlanAdjustmentDraft, RecoveryTeacherReviewDecision,
  RecoveryStudentProgressReflectionDraft, RecoveryParentProgressNoteDraft,
  RecoveryEvidenceRollup, RecoveryProgressSummary, RecoveryProgressAuditEvent,
  RecoveryProgressIdempotencyEntry,
} from '../contracts/recoveryProgressContracts';
import {
  RecoveryProgressObservationRepository, RecoveryCheckpointEvaluationRepository,
  RecoveryOutcomeEvidenceRepository, RecoveryPlanAdjustmentDraftRepository,
  RecoveryTeacherReviewDecisionRepository, RecoveryStudentProgressReflectionDraftRepository,
  RecoveryParentProgressNoteDraftRepository, RecoveryEvidenceRollupRepository,
  RecoveryProgressSummaryRepository, RecoveryProgressAuditRepository,
  RecoveryProgressIdempotencyRepository,
} from '../contracts/recoveryProgressRepositoryContracts';

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

export class PrismaRecoveryProgressObservationRepository implements RecoveryProgressObservationRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: RecoveryProgressObservation): Promise<RecoveryProgressObservation> {
    const record = await this.prisma.recoveryProgressObservationRecord.create({ data: { ...data, createdAt: new Date(data.createdAt), updatedAt: new Date(data.updatedAt) } as any });
    return this.mapOut(record);
  }
  async getById(id: string): Promise<RecoveryProgressObservation | null> {
    const record = await this.prisma.recoveryProgressObservationRecord.findUnique({ where: { recoveryProgressObservationId: id } });
    return record ? this.mapOut(record) : null;
  }
  async listBySchool(schoolId: string): Promise<RecoveryProgressObservation[]> {
    const records = await this.prisma.recoveryProgressObservationRecord.findMany({ where: { schoolId } });
    return records.map(r => this.mapOut(r));
  }
  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryProgressObservation[]> {
    const records = await this.prisma.recoveryProgressObservationRecord.findMany({ where: { schoolId, studentRef } });
    return records.map(r => this.mapOut(r));
  }
  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryProgressObservation[]> {
    const records = await this.prisma.recoveryProgressObservationRecord.findMany({ where: { schoolId, resultRecoveryPlanId: planId } });
    return records.map(r => this.mapOut(r));
  }
  async listByCheckpointId(schoolId: string, checkpointId: string): Promise<RecoveryProgressObservation[]> {
    const records = await this.prisma.recoveryProgressObservationRecord.findMany({ where: { schoolId, resultRecoveryCheckpointId: checkpointId } });
    return records.map(r => this.mapOut(r));
  }
  async listByStatus(schoolId: string, status: string): Promise<RecoveryProgressObservation[]> {
    const records = await this.prisma.recoveryProgressObservationRecord.findMany({ where: { schoolId, observationStatus: status } });
    return records.map(r => this.mapOut(r));
  }
  async listByType(schoolId: string, type: string): Promise<RecoveryProgressObservation[]> {
    const records = await this.prisma.recoveryProgressObservationRecord.findMany({ where: { schoolId, observationType: type } });
    return records.map(r => this.mapOut(r));
  }
  async update(id: string, data: Partial<RecoveryProgressObservation>): Promise<RecoveryProgressObservation> {
    const record = await this.prisma.recoveryProgressObservationRecord.update({ where: { recoveryProgressObservationId: id }, data: { ...data, updatedAt: new Date() } as any });
    return this.mapOut(record);
  }
  async updateStatus(id: string, status: string, timestamp: string): Promise<RecoveryProgressObservation> {
    return this.update(id, { observationStatus: status as any, updatedAt: timestamp } as any);
  }

  private mapOut(r: any): RecoveryProgressObservation {
    return { ...r, createdAt: mapDate(r.createdAt) || '', updatedAt: mapDate(r.updatedAt) || '', recordedAt: mapDate(r.recordedAt), reviewReadyAt: mapDate(r.reviewReadyAt), approvedForFutureUseAt: mapDate(r.approvedForFutureUseAt), suppressedAt: mapDate(r.suppressedAt), blockedAt: mapDate(r.blockedAt), voidedAt: mapDate(r.voidedAt), sourceRefsJson: parseJson(r.sourceRefsJson), observedSignalsJson: parseJson(r.observedSignalsJson), allowedUseJson: parseJson(r.allowedUseJson), blockedUseJson: parseJson(r.blockedUseJson), blockedReasonCodesJson: parseStringArray(r.blockedReasonCodesJson) };
  }
}

export class PrismaRecoveryCheckpointEvaluationRepository implements RecoveryCheckpointEvaluationRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: RecoveryCheckpointEvaluation): Promise<RecoveryCheckpointEvaluation> {
    const record = await this.prisma.recoveryCheckpointEvaluationRecord.create({ data: { ...data, createdAt: new Date(data.createdAt), updatedAt: new Date(data.updatedAt) } as any });
    return this.mapOut(record);
  }
  async getById(id: string): Promise<RecoveryCheckpointEvaluation | null> {
    const record = await this.prisma.recoveryCheckpointEvaluationRecord.findUnique({ where: { recoveryCheckpointEvaluationId: id } });
    return record ? this.mapOut(record) : null;
  }
  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryCheckpointEvaluation[]> {
    const records = await this.prisma.recoveryCheckpointEvaluationRecord.findMany({ where: { schoolId, resultRecoveryPlanId: planId } });
    return records.map(r => this.mapOut(r));
  }
  async listByCheckpointId(schoolId: string, checkpointId: string): Promise<RecoveryCheckpointEvaluation[]> {
    const records = await this.prisma.recoveryCheckpointEvaluationRecord.findMany({ where: { schoolId, resultRecoveryCheckpointId: checkpointId } });
    return records.map(r => this.mapOut(r));
  }
  async listByObservationId(observationId: string): Promise<RecoveryCheckpointEvaluation[]> {
    const records = await this.prisma.recoveryCheckpointEvaluationRecord.findMany({ where: { recoveryProgressObservationId: observationId } });
    return records.map(r => this.mapOut(r));
  }
  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryCheckpointEvaluation[]> {
    const records = await this.prisma.recoveryCheckpointEvaluationRecord.findMany({ where: { schoolId, studentRef } });
    return records.map(r => this.mapOut(r));
  }
  async listByStatus(schoolId: string, status: string): Promise<RecoveryCheckpointEvaluation[]> {
    const records = await this.prisma.recoveryCheckpointEvaluationRecord.findMany({ where: { schoolId, evaluationStatus: status } });
    return records.map(r => this.mapOut(r));
  }
  async listByResult(schoolId: string, result: string): Promise<RecoveryCheckpointEvaluation[]> {
    const records = await this.prisma.recoveryCheckpointEvaluationRecord.findMany({ where: { schoolId, evaluationResult: result } });
    return records.map(r => this.mapOut(r));
  }
  async update(id: string, data: Partial<RecoveryCheckpointEvaluation>): Promise<RecoveryCheckpointEvaluation> {
    const record = await this.prisma.recoveryCheckpointEvaluationRecord.update({ where: { recoveryCheckpointEvaluationId: id }, data: { ...data, updatedAt: new Date() } as any });
    return this.mapOut(record);
  }
  async updateStatus(id: string, status: string, timestamp: string): Promise<RecoveryCheckpointEvaluation> {
    return this.update(id, { evaluationStatus: status as any, updatedAt: timestamp } as any);
  }

  private mapOut(r: any): RecoveryCheckpointEvaluation {
    return { ...r, createdAt: mapDate(r.createdAt) || '', updatedAt: mapDate(r.updatedAt) || '', evaluatedAt: mapDate(r.evaluatedAt), reviewReadyAt: mapDate(r.reviewReadyAt), approvedForFutureUseAt: mapDate(r.approvedForFutureUseAt), suppressedAt: mapDate(r.suppressedAt), blockedAt: mapDate(r.blockedAt), voidedAt: mapDate(r.voidedAt), criteriaRefsJson: parseJson(r.criteriaRefsJson), criteriaResultsJson: parseJson(r.criteriaResultsJson), evidenceRefsJson: parseJson(r.evidenceRefsJson), recommendedNextStateJson: parseJson(r.recommendedNextStateJson), blockedReasonCodesJson: parseStringArray(r.blockedReasonCodesJson) };
  }
}

export class PrismaRecoveryOutcomeEvidenceRepository implements RecoveryOutcomeEvidenceRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: RecoveryOutcomeEvidence): Promise<RecoveryOutcomeEvidence> {
    const record = await this.prisma.recoveryOutcomeEvidenceRecord.create({ data: { ...data, createdAt: new Date(data.createdAt), updatedAt: new Date(data.updatedAt) } as any });
    return this.mapOut(record);
  }
  async getById(id: string): Promise<RecoveryOutcomeEvidence | null> {
    const record = await this.prisma.recoveryOutcomeEvidenceRecord.findUnique({ where: { recoveryOutcomeEvidenceId: id } });
    return record ? this.mapOut(record) : null;
  }
  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryOutcomeEvidence[]> {
    const records = await this.prisma.recoveryOutcomeEvidenceRecord.findMany({ where: { schoolId, resultRecoveryPlanId: planId } });
    return records.map(r => this.mapOut(r));
  }
  async listByObjectiveId(schoolId: string, objectiveId: string): Promise<RecoveryOutcomeEvidence[]> {
    const records = await this.prisma.recoveryOutcomeEvidenceRecord.findMany({ where: { schoolId, resultRecoveryObjectiveId: objectiveId } });
    return records.map(r => this.mapOut(r));
  }
  async listByObservationId(observationId: string): Promise<RecoveryOutcomeEvidence[]> {
    const records = await this.prisma.recoveryOutcomeEvidenceRecord.findMany({ where: { recoveryProgressObservationId: observationId } });
    return records.map(r => this.mapOut(r));
  }
  async listByEvaluationId(evaluationId: string): Promise<RecoveryOutcomeEvidence[]> {
    const records = await this.prisma.recoveryOutcomeEvidenceRecord.findMany({ where: { recoveryCheckpointEvaluationId: evaluationId } });
    return records.map(r => this.mapOut(r));
  }
  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryOutcomeEvidence[]> {
    const records = await this.prisma.recoveryOutcomeEvidenceRecord.findMany({ where: { schoolId, studentRef } });
    return records.map(r => this.mapOut(r));
  }
  async update(id: string, data: Partial<RecoveryOutcomeEvidence>): Promise<RecoveryOutcomeEvidence> {
    const record = await this.prisma.recoveryOutcomeEvidenceRecord.update({ where: { recoveryOutcomeEvidenceId: id }, data: { ...data, updatedAt: new Date() } as any });
    return this.mapOut(record);
  }
  async updateStatus(id: string, status: string, timestamp: string): Promise<RecoveryOutcomeEvidence> {
    return this.update(id, { evidenceStatus: status as any, updatedAt: timestamp } as any);
  }

  private mapOut(r: any): RecoveryOutcomeEvidence {
    return { ...r, createdAt: mapDate(r.createdAt) || '', updatedAt: mapDate(r.updatedAt) || '', reviewReadyAt: mapDate(r.reviewReadyAt), approvedForFutureUseAt: mapDate(r.approvedForFutureUseAt), suppressedAt: mapDate(r.suppressedAt), voidedAt: mapDate(r.voidedAt), sourceEvidenceRefsJson: parseJson(r.sourceEvidenceRefsJson), learningObjectiveRefsJson: parseJson(r.learningObjectiveRefsJson), questionRefsJson: parseJson(r.questionRefsJson), resourceRefsJson: parseJson(r.resourceRefsJson), allowedAudienceJson: parseJson(r.allowedAudienceJson), blockedReasonCodesJson: parseStringArray(r.blockedReasonCodesJson) };
  }
}

export class PrismaRecoveryPlanAdjustmentDraftRepository implements RecoveryPlanAdjustmentDraftRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: RecoveryPlanAdjustmentDraft): Promise<RecoveryPlanAdjustmentDraft> {
    const record = await this.prisma.recoveryPlanAdjustmentDraftRecord.create({ data: { ...data, createdAt: new Date(data.createdAt), updatedAt: new Date(data.updatedAt) } as any });
    return this.mapOut(record);
  }
  async getById(id: string): Promise<RecoveryPlanAdjustmentDraft | null> {
    const record = await this.prisma.recoveryPlanAdjustmentDraftRecord.findUnique({ where: { recoveryPlanAdjustmentDraftId: id } });
    return record ? this.mapOut(record) : null;
  }
  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryPlanAdjustmentDraft[]> {
    const records = await this.prisma.recoveryPlanAdjustmentDraftRecord.findMany({ where: { schoolId, resultRecoveryPlanId: planId } });
    return records.map(r => this.mapOut(r));
  }
  async listByObservationId(observationId: string): Promise<RecoveryPlanAdjustmentDraft[]> {
    const records = await this.prisma.recoveryPlanAdjustmentDraftRecord.findMany({ where: { recoveryProgressObservationId: observationId } });
    return records.map(r => this.mapOut(r));
  }
  async listByEvaluationId(evaluationId: string): Promise<RecoveryPlanAdjustmentDraft[]> {
    const records = await this.prisma.recoveryPlanAdjustmentDraftRecord.findMany({ where: { recoveryCheckpointEvaluationId: evaluationId } });
    return records.map(r => this.mapOut(r));
  }
  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryPlanAdjustmentDraft[]> {
    const records = await this.prisma.recoveryPlanAdjustmentDraftRecord.findMany({ where: { schoolId, studentRef } });
    return records.map(r => this.mapOut(r));
  }
  async update(id: string, data: Partial<RecoveryPlanAdjustmentDraft>): Promise<RecoveryPlanAdjustmentDraft> {
    const record = await this.prisma.recoveryPlanAdjustmentDraftRecord.update({ where: { recoveryPlanAdjustmentDraftId: id }, data: { ...data, updatedAt: new Date() } as any });
    return this.mapOut(record);
  }
  async updateStatus(id: string, status: string, timestamp: string): Promise<RecoveryPlanAdjustmentDraft> {
    return this.update(id, { adjustmentStatus: status as any, updatedAt: timestamp } as any);
  }

  private mapOut(r: any): RecoveryPlanAdjustmentDraft {
    return { ...r, createdAt: mapDate(r.createdAt) || '', updatedAt: mapDate(r.updatedAt) || '', reviewReadyAt: mapDate(r.reviewReadyAt), approvedForFutureUseAt: mapDate(r.approvedForFutureUseAt), suppressedAt: mapDate(r.suppressedAt), blockedAt: mapDate(r.blockedAt), voidedAt: mapDate(r.voidedAt), proposedChangesJson: parseJson(r.proposedChangesJson), reasonCodesJson: parseJson(r.reasonCodesJson), teacherReviewNotesJson: parseJson(r.teacherReviewNotesJson), blockedReasonCodesJson: parseStringArray(r.blockedReasonCodesJson) };
  }
}

export class PrismaRecoveryTeacherReviewDecisionRepository implements RecoveryTeacherReviewDecisionRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: RecoveryTeacherReviewDecision): Promise<RecoveryTeacherReviewDecision> {
    const record = await this.prisma.recoveryTeacherReviewDecisionRecord.create({ data: { ...data, createdAt: new Date(data.createdAt), updatedAt: new Date(data.updatedAt) } as any });
    return this.mapOut(record);
  }
  async getById(id: string): Promise<RecoveryTeacherReviewDecision | null> {
    const record = await this.prisma.recoveryTeacherReviewDecisionRecord.findUnique({ where: { recoveryTeacherReviewDecisionId: id } });
    return record ? this.mapOut(record) : null;
  }
  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryTeacherReviewDecision[]> {
    const records = await this.prisma.recoveryTeacherReviewDecisionRecord.findMany({ where: { schoolId, resultRecoveryPlanId: planId } });
    return records.map(r => this.mapOut(r));
  }
  async listByTeacherRef(schoolId: string, teacherRef: string): Promise<RecoveryTeacherReviewDecision[]> {
    const records = await this.prisma.recoveryTeacherReviewDecisionRecord.findMany({ where: { schoolId, teacherRef } });
    return records.map(r => this.mapOut(r));
  }
  async listByAdjustmentDraftId(adjustmentDraftId: string): Promise<RecoveryTeacherReviewDecision[]> {
    const records = await this.prisma.recoveryTeacherReviewDecisionRecord.findMany({ where: { recoveryPlanAdjustmentDraftId: adjustmentDraftId } });
    return records.map(r => this.mapOut(r));
  }
  async listByEvaluationId(evaluationId: string): Promise<RecoveryTeacherReviewDecision[]> {
    const records = await this.prisma.recoveryTeacherReviewDecisionRecord.findMany({ where: { recoveryCheckpointEvaluationId: evaluationId } });
    return records.map(r => this.mapOut(r));
  }
  async update(id: string, data: Partial<RecoveryTeacherReviewDecision>): Promise<RecoveryTeacherReviewDecision> {
    const record = await this.prisma.recoveryTeacherReviewDecisionRecord.update({ where: { recoveryTeacherReviewDecisionId: id }, data: { ...data, updatedAt: new Date() } as any });
    return this.mapOut(record);
  }
  async updateStatus(id: string, status: string, timestamp: string): Promise<RecoveryTeacherReviewDecision> {
    return this.update(id, { decisionStatus: status as any, updatedAt: timestamp } as any);
  }

  private mapOut(r: any): RecoveryTeacherReviewDecision {
    return { ...r, createdAt: mapDate(r.createdAt) || '', updatedAt: mapDate(r.updatedAt) || '', reviewedAt: mapDate(r.reviewedAt), approvedForFutureUseAt: mapDate(r.approvedForFutureUseAt), suppressedAt: mapDate(r.suppressedAt), blockedAt: mapDate(r.blockedAt), voidedAt: mapDate(r.voidedAt), decisionReasonCodesJson: parseJson(r.decisionReasonCodesJson), approvedFutureUseRefsJson: parseJson(r.approvedFutureUseRefsJson), blockedReasonCodesJson: parseStringArray(r.blockedReasonCodesJson) };
  }
}

export class PrismaRecoveryStudentProgressReflectionDraftRepository implements RecoveryStudentProgressReflectionDraftRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: RecoveryStudentProgressReflectionDraft): Promise<RecoveryStudentProgressReflectionDraft> {
    const record = await this.prisma.recoveryStudentProgressReflectionDraftRecord.create({ data: { ...data, createdAt: new Date(data.createdAt), updatedAt: new Date(data.updatedAt) } as any });
    return this.mapOut(record);
  }
  async getById(id: string): Promise<RecoveryStudentProgressReflectionDraft | null> {
    const record = await this.prisma.recoveryStudentProgressReflectionDraftRecord.findUnique({ where: { recoveryStudentProgressReflectionDraftId: id } });
    return record ? this.mapOut(record) : null;
  }
  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryStudentProgressReflectionDraft[]> {
    const records = await this.prisma.recoveryStudentProgressReflectionDraftRecord.findMany({ where: { schoolId, resultRecoveryPlanId: planId } });
    return records.map(r => this.mapOut(r));
  }
  async listByObservationId(observationId: string): Promise<RecoveryStudentProgressReflectionDraft[]> {
    const records = await this.prisma.recoveryStudentProgressReflectionDraftRecord.findMany({ where: { recoveryProgressObservationId: observationId } });
    return records.map(r => this.mapOut(r));
  }
  async listByEvaluationId(evaluationId: string): Promise<RecoveryStudentProgressReflectionDraft[]> {
    const records = await this.prisma.recoveryStudentProgressReflectionDraftRecord.findMany({ where: { recoveryCheckpointEvaluationId: evaluationId } });
    return records.map(r => this.mapOut(r));
  }
  async update(id: string, data: Partial<RecoveryStudentProgressReflectionDraft>): Promise<RecoveryStudentProgressReflectionDraft> {
    const record = await this.prisma.recoveryStudentProgressReflectionDraftRecord.update({ where: { recoveryStudentProgressReflectionDraftId: id }, data: { ...data, updatedAt: new Date() } as any });
    return this.mapOut(record);
  }
  async updateStatus(id: string, status: string, timestamp: string): Promise<RecoveryStudentProgressReflectionDraft> {
    return this.update(id, { draftStatus: status as any, updatedAt: timestamp } as any);
  }

  private mapOut(r: any): RecoveryStudentProgressReflectionDraft {
    return { ...r, createdAt: mapDate(r.createdAt) || '', updatedAt: mapDate(r.updatedAt) || '', reviewReadyAt: mapDate(r.reviewReadyAt), approvedForFutureUseAt: mapDate(r.approvedForFutureUseAt), suppressedAt: mapDate(r.suppressedAt), blockedAt: mapDate(r.blockedAt), voidedAt: mapDate(r.voidedAt), studentReflectionPromptJson: parseJson(r.studentReflectionPromptJson), scaffoldStepsJson: parseJson(r.scaffoldStepsJson), blockedFieldNamesJson: parseStringArray(r.blockedFieldNamesJson), blockedReasonCodesJson: parseStringArray(r.blockedReasonCodesJson) };
  }
}

export class PrismaRecoveryParentProgressNoteDraftRepository implements RecoveryParentProgressNoteDraftRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: RecoveryParentProgressNoteDraft): Promise<RecoveryParentProgressNoteDraft> {
    const record = await this.prisma.recoveryParentProgressNoteDraftRecord.create({ data: { ...data, createdAt: new Date(data.createdAt), updatedAt: new Date(data.updatedAt) } as any });
    return this.mapOut(record);
  }
  async getById(id: string): Promise<RecoveryParentProgressNoteDraft | null> {
    const record = await this.prisma.recoveryParentProgressNoteDraftRecord.findUnique({ where: { recoveryParentProgressNoteDraftId: id } });
    return record ? this.mapOut(record) : null;
  }
  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryParentProgressNoteDraft[]> {
    const records = await this.prisma.recoveryParentProgressNoteDraftRecord.findMany({ where: { schoolId, resultRecoveryPlanId: planId } });
    return records.map(r => this.mapOut(r));
  }
  async listByObservationId(observationId: string): Promise<RecoveryParentProgressNoteDraft[]> {
    const records = await this.prisma.recoveryParentProgressNoteDraftRecord.findMany({ where: { recoveryProgressObservationId: observationId } });
    return records.map(r => this.mapOut(r));
  }
  async listByEvaluationId(evaluationId: string): Promise<RecoveryParentProgressNoteDraft[]> {
    const records = await this.prisma.recoveryParentProgressNoteDraftRecord.findMany({ where: { recoveryCheckpointEvaluationId: evaluationId } });
    return records.map(r => this.mapOut(r));
  }
  async update(id: string, data: Partial<RecoveryParentProgressNoteDraft>): Promise<RecoveryParentProgressNoteDraft> {
    const record = await this.prisma.recoveryParentProgressNoteDraftRecord.update({ where: { recoveryParentProgressNoteDraftId: id }, data: { ...data, updatedAt: new Date() } as any });
    return this.mapOut(record);
  }
  async updateStatus(id: string, status: string, timestamp: string): Promise<RecoveryParentProgressNoteDraft> {
    return this.update(id, { draftStatus: status as any, updatedAt: timestamp } as any);
  }

  private mapOut(r: any): RecoveryParentProgressNoteDraft {
    return { ...r, createdAt: mapDate(r.createdAt) || '', updatedAt: mapDate(r.updatedAt) || '', reviewReadyAt: mapDate(r.reviewReadyAt), approvedForFutureUseAt: mapDate(r.approvedForFutureUseAt), suppressedAt: mapDate(r.suppressedAt), blockedAt: mapDate(r.blockedAt), voidedAt: mapDate(r.voidedAt), parentProgressBodyJson: parseJson(r.parentProgressBodyJson), allowedFieldNamesJson: parseStringArray(r.allowedFieldNamesJson), blockedFieldNamesJson: parseStringArray(r.blockedFieldNamesJson), blockedReasonCodesJson: parseStringArray(r.blockedReasonCodesJson) };
  }
}

export class PrismaRecoveryEvidenceRollupRepository implements RecoveryEvidenceRollupRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: RecoveryEvidenceRollup): Promise<RecoveryEvidenceRollup> {
    const record = await this.prisma.recoveryEvidenceRollupRecord.create({ data: { ...data, createdAt: new Date(data.createdAt), updatedAt: new Date(data.updatedAt) } as any });
    return this.mapOut(record);
  }
  async getById(id: string): Promise<RecoveryEvidenceRollup | null> {
    const record = await this.prisma.recoveryEvidenceRollupRecord.findUnique({ where: { recoveryEvidenceRollupId: id } });
    return record ? this.mapOut(record) : null;
  }
  async listBySchool(schoolId: string): Promise<RecoveryEvidenceRollup[]> {
    const records = await this.prisma.recoveryEvidenceRollupRecord.findMany({ where: { schoolId } });
    return records.map(r => this.mapOut(r));
  }
  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryEvidenceRollup[]> {
    const records = await this.prisma.recoveryEvidenceRollupRecord.findMany({ where: { schoolId, studentRef } });
    return records.map(r => this.mapOut(r));
  }
  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryEvidenceRollup[]> {
    const records = await this.prisma.recoveryEvidenceRollupRecord.findMany({ where: { schoolId, resultRecoveryPlanId: planId } });
    return records.map(r => this.mapOut(r));
  }
  async listByScope(schoolId: string, scope: string): Promise<RecoveryEvidenceRollup[]> {
    const records = await this.prisma.recoveryEvidenceRollupRecord.findMany({ where: { schoolId, rollupScope: scope } });
    return records.map(r => this.mapOut(r));
  }
  async update(id: string, data: Partial<RecoveryEvidenceRollup>): Promise<RecoveryEvidenceRollup> {
    const record = await this.prisma.recoveryEvidenceRollupRecord.update({ where: { recoveryEvidenceRollupId: id }, data: { ...data, updatedAt: new Date() } as any });
    return this.mapOut(record);
  }
  async updateStatus(id: string, status: string, timestamp: string): Promise<RecoveryEvidenceRollup> {
    return this.update(id, { rollupStatus: status as any, updatedAt: timestamp } as any);
  }

  private mapOut(r: any): RecoveryEvidenceRollup {
    return { ...r, createdAt: mapDate(r.createdAt) || '', updatedAt: mapDate(r.updatedAt) || '', refreshedAt: mapDate(r.refreshedAt), suppressedAt: mapDate(r.suppressedAt), blockedAt: mapDate(r.blockedAt), voidedAt: mapDate(r.voidedAt), observationCountsJson: parseJson(r.observationCountsJson), evaluationCountsJson: parseJson(r.evaluationCountsJson), evidenceCountsJson: parseJson(r.evidenceCountsJson), adjustmentCountsJson: parseJson(r.adjustmentCountsJson), sourceRefsJson: parseJson(r.sourceRefsJson), blockedReasonCodesJson: parseStringArray(r.blockedReasonCodesJson) };
  }
}

export class PrismaRecoveryProgressSummaryRepository implements RecoveryProgressSummaryRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: RecoveryProgressSummary): Promise<RecoveryProgressSummary> {
    const record = await this.prisma.recoveryProgressSummaryRecord.create({ data: { ...data, createdAt: new Date(data.createdAt), updatedAt: new Date(data.updatedAt) } as any });
    return this.mapOut(record);
  }
  async getById(id: string): Promise<RecoveryProgressSummary | null> {
    const record = await this.prisma.recoveryProgressSummaryRecord.findUnique({ where: { recoveryProgressSummaryId: id } });
    return record ? this.mapOut(record) : null;
  }
  async listBySchool(schoolId: string): Promise<RecoveryProgressSummary[]> {
    const records = await this.prisma.recoveryProgressSummaryRecord.findMany({ where: { schoolId } });
    return records.map(r => this.mapOut(r));
  }
  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryProgressSummary[]> {
    const records = await this.prisma.recoveryProgressSummaryRecord.findMany({ where: { schoolId, studentRef } });
    return records.map(r => this.mapOut(r));
  }
  async listByTeacherRef(schoolId: string, teacherRef: string): Promise<RecoveryProgressSummary[]> {
    const records = await this.prisma.recoveryProgressSummaryRecord.findMany({ where: { schoolId, teacherRef } });
    return records.map(r => this.mapOut(r));
  }
  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryProgressSummary[]> {
    const records = await this.prisma.recoveryProgressSummaryRecord.findMany({ where: { schoolId, resultRecoveryPlanId: planId } });
    return records.map(r => this.mapOut(r));
  }
  async listByScope(schoolId: string, scope: string): Promise<RecoveryProgressSummary[]> {
    const records = await this.prisma.recoveryProgressSummaryRecord.findMany({ where: { schoolId, summaryScope: scope } });
    return records.map(r => this.mapOut(r));
  }
  async update(id: string, data: Partial<RecoveryProgressSummary>): Promise<RecoveryProgressSummary> {
    const record = await this.prisma.recoveryProgressSummaryRecord.update({ where: { recoveryProgressSummaryId: id }, data: { ...data, updatedAt: new Date() } as any });
    return this.mapOut(record);
  }
  async updateStatus(id: string, status: string, timestamp: string): Promise<RecoveryProgressSummary> {
    return this.update(id, { summaryStatus: status as any, updatedAt: timestamp } as any);
  }

  private mapOut(r: any): RecoveryProgressSummary {
    return { ...r, createdAt: mapDate(r.createdAt) || '', updatedAt: mapDate(r.updatedAt) || '', refreshedAt: mapDate(r.refreshedAt), voidedAt: mapDate(r.voidedAt), progressStateJson: parseJson(r.progressStateJson), observationCountsJson: parseJson(r.observationCountsJson), checkpointEvaluationCountsJson: parseJson(r.checkpointEvaluationCountsJson), rollupRefsJson: parseJson(r.rollupRefsJson), blockedReasonCodesJson: parseStringArray(r.blockedReasonCodesJson) };
  }
}

export class PrismaRecoveryProgressAuditRepository implements RecoveryProgressAuditRepository {
  constructor(private prisma: PrismaClient) {}

  private mapOut(r: any): RecoveryProgressAuditEvent {
    return {
      ...r,
      createdAt: mapDate(r.createdAt) || '',
      recoveryProgressObservationId: r.recoveryProgressObservationId ?? undefined,
      recoveryCheckpointEvaluationId: r.recoveryCheckpointEvaluationId ?? undefined,
      recoveryOutcomeEvidenceId: r.recoveryOutcomeEvidenceId ?? undefined,
      recoveryPlanAdjustmentDraftId: r.recoveryPlanAdjustmentDraftId ?? undefined,
      recoveryTeacherReviewDecisionId: r.recoveryTeacherReviewDecisionId ?? undefined,
      recoveryStudentProgressReflectionDraftId: r.recoveryStudentProgressReflectionDraftId ?? undefined,
      recoveryParentProgressNoteDraftId: r.recoveryParentProgressNoteDraftId ?? undefined,
      recoveryEvidenceRollupId: r.recoveryEvidenceRollupId ?? undefined,
      recoveryProgressSummaryId: r.recoveryProgressSummaryId ?? undefined,
      requestId: r.requestId ?? undefined,
      correlationId: r.correlationId ?? undefined,
      reasonCodesJson: r.reasonCodesJson ?? undefined,
      metadataJson: r.metadataJson ?? undefined,
    };
  }

  async create(data: RecoveryProgressAuditEvent): Promise<RecoveryProgressAuditEvent> {
    const record = await this.prisma.recoveryProgressAuditRecord.create({ data: { ...data, createdAt: new Date(data.createdAt) } as any });
    return this.mapOut(record);
  }
  async listBySchool(schoolId: string): Promise<RecoveryProgressAuditEvent[]> {
    const records = await this.prisma.recoveryProgressAuditRecord.findMany({ where: { schoolId } });
    return records.map(r => this.mapOut(r));
  }
}

export class PrismaRecoveryProgressIdempotencyRepository implements RecoveryProgressIdempotencyRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: RecoveryProgressIdempotencyEntry): Promise<RecoveryProgressIdempotencyEntry> {
    const record = await this.prisma.recoveryProgressIdempotencyRecord.create({ data: { ...data, createdAt: new Date(data.createdAt), updatedAt: new Date(data.updatedAt) } as any });
    return this.mapOut(record);
  }
  async getByKey(schoolId: string, operation: string, idempotencyKey: string): Promise<RecoveryProgressIdempotencyEntry | null> {
    const record = await this.prisma.recoveryProgressIdempotencyRecord.findUnique({ where: { recoveryProgressIdempotencyRecordUniqueKey: { schoolId, operation, idempotencyKey } } } as any);
    return record ? this.mapOut(record) : null;
  }
  async updateStatus(id: string, status: string, resourceId?: string, resultSummary?: string): Promise<RecoveryProgressIdempotencyEntry> {
    const record = await this.prisma.recoveryProgressIdempotencyRecord.update({ where: { recoveryProgressIdempotencyId: id }, data: { status, resourceId, safeResultSummary: resultSummary, updatedAt: new Date() } });
    return this.mapOut(record);
  }
  async expire(recoveryProgressIdempotencyId: string): Promise<RecoveryProgressIdempotencyEntry> {
    const record = await this.prisma.recoveryProgressIdempotencyRecord.update({ where: { recoveryProgressIdempotencyId }, data: { status: 'expired', updatedAt: new Date(), expiresAt: new Date() } });
    return this.mapOut(record);
  }

  private mapOut(r: any): RecoveryProgressIdempotencyEntry {
    return { ...r, createdAt: mapDate(r.createdAt) || '', updatedAt: mapDate(r.updatedAt) || '', expiresAt: mapDate(r.expiresAt) };
  }
}
