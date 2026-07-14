import type { PrismaClient } from '@prisma/client';
import { prisma } from '../../../../lib/prisma';

import type { QuestionBankItem } from '../contracts/questionBankItemContracts';
import type { QuestionVersion, QuestionPartVersion, QuestionAssetVersion } from '../contracts/questionVersionContracts';
import type { AnswerKeyVersion, RubricVersion } from '../contracts/answerKeyAndRubricContracts';
import type { QuestionObjectiveMapping } from '../contracts/questionObjectiveMappingContracts';
import type { QuestionSourceRecord } from '../contracts/questionSourceRecordContracts';
import type { QuestionCurriculumValidity, QuestionUsageEligibility, ContentSafetyReview } from '../contracts/questionGovernanceContracts';
import type { QuestionApprovalRequest, QuestionApprovalRecord, ApprovalRequestStatus, ApprovalDecision } from '../contracts/questionApprovalContracts';
import type { QuestionIngestionBatch, QuestionIngestionCandidate, IngestionBatchStatus, IngestionCandidateStatus } from '../contracts/questionIngestionContracts';
import type { QuestionDuplicateCandidate, QuestionExposureHold, DuplicateCandidateStatus } from '../contracts/questionDuplicateExposureContracts';

import type {
  QuestionBankItemRepository,
  QuestionVersionRepository,
  QuestionPartVersionRepository,
  QuestionAssetVersionRepository,
  AnswerKeyVersionRepository,
  RubricVersionRepository,
  QuestionObjectiveMappingRepository,
  QuestionSourceRecordRepository,
  QuestionGovernanceRepository,
} from '../contracts/questionBankRepositoryContracts';

import type {
  QuestionApprovalRequestRepository,
  QuestionApprovalRecordRepository,
} from '../contracts/questionApprovalContracts';

import type {
  QuestionIngestionBatchRepository,
  QuestionIngestionCandidateRepository,
} from '../contracts/questionIngestionContracts';

import type {
  QuestionDuplicateCandidateRepository,
  QuestionExposureHoldRepository,
} from '../contracts/questionDuplicateExposureContracts';

function mapPrismaItemToContract(row: any): QuestionBankItem {
  return {
    questionId: row.questionId,
    schoolId: row.schoolId,
    status: row.status,
    subjectId: row.subjectId,
    topicId: row.topicId,
    skillId: row.skillId,
    curriculumVersionId: row.curriculumVersionId,
    primaryObjectiveId: row.primaryObjectiveId,
    currentVersionId: row.currentVersionId,
    createdByActorId: row.createdByActorId,
    createdByRole: row.createdByRole,
    sourceType: row.sourceType,
    securityClass: row.securityClass,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    archivedAt: row.archivedAt?.toISOString() ?? null,
  };
}

function mapPrismaVersionToContract(row: any): QuestionVersion {
  return {
    questionVersionId: row.questionVersionId,
    questionId: row.questionId,
    versionNumber: row.versionNumber,
    status: row.status,
    stemSafeText: row.stemSafeText,
    questionType: row.questionType,
    difficultyBand: row.difficultyBand,
    language: row.language,
    studentSafeExplanation: row.studentSafeExplanation,
    teacherExplanation: row.teacherExplanation,
    estimatedTimeSeconds: row.estimatedTimeSeconds,
    createdByActorId: row.createdByActorId,
    createdAt: row.createdAt.toISOString(),
    approvedAt: row.approvedAt?.toISOString() ?? null,
    supersededAt: row.supersededAt?.toISOString() ?? null,
    contentHash: row.contentHash,
  };
}

function mapPrismaPartToContract(row: any): QuestionPartVersion {
  return {
    questionPartVersionId: row.questionPartVersionId,
    questionVersionId: row.questionVersionId,
    partKey: row.partKey,
    partOrder: row.partOrder,
    promptSafeText: row.promptSafeText,
    marksAvailable: row.marksAvailable,
    expectedWorkingVisibility: row.expectedWorkingVisibility,
    studentInputMode: row.studentInputMode,
    createdAt: row.createdAt.toISOString(),
  };
}

function mapPrismaAssetToContract(row: any): QuestionAssetVersion {
  return {
    assetVersionId: row.assetVersionId,
    questionVersionId: row.questionVersionId,
    assetType: row.assetType,
    assetRef: row.assetRef,
    assetFingerprint: row.assetFingerprint,
    studentVisible: row.studentVisible,
    teacherOnly: row.teacherOnly,
    altText: row.altText,
    createdAt: row.createdAt.toISOString(),
  };
}

function mapPrismaAnswerKeyToContract(row: any): AnswerKeyVersion {
  return {
    answerKeyVersionId: row.answerKeyVersionId,
    questionVersionId: row.questionVersionId,
    status: row.status,
    answerKeySafeRef: row.answerKeySafeRef,
    correctAnswerSummary: row.correctAnswerSummary,
    markingNotesTeacherOnly: row.markingNotesTeacherOnly,
    createdByActorId: row.createdByActorId,
    createdAt: row.createdAt.toISOString(),
    approvedAt: row.approvedAt?.toISOString() ?? null,
  };
}

function mapPrismaRubricToContract(row: any): RubricVersion {
  return {
    rubricVersionId: row.rubricVersionId,
    questionVersionId: row.questionVersionId,
    status: row.status,
    rubricPublicSummary: row.rubricPublicSummary,
    rubricInternal: row.rubricInternal,
    marksTotal: row.marksTotal,
    criteriaJson: row.criteriaJson ? JSON.stringify(row.criteriaJson) : '',
    createdByActorId: row.createdByActorId,
    createdAt: row.createdAt.toISOString(),
    approvedAt: row.approvedAt?.toISOString() ?? null,
  };
}

function mapPrismaMappingToContract(row: any): QuestionObjectiveMapping {
  return {
    mappingId: row.mappingId,
    questionVersionId: row.questionVersionId,
    objectiveId: row.objectiveId,
    objectiveVersionId: row.objectiveVersionId,
    mappingStrength: row.mappingStrength,
    mappingReason: row.mappingReason,
    createdAt: row.createdAt.toISOString(),
  };
}

function mapPrismaSourceToContract(row: any): QuestionSourceRecord {
  return {
    sourceRecordId: row.sourceRecordId,
    questionId: row.questionId,
    questionVersionId: row.questionVersionId,
    sourceType: row.sourceType,
    sourceRef: row.sourceRef,
    approvedSourceId: row.approvedSourceId ?? null,
    importBatchId: row.importBatchId ?? null,
    createdByActorId: row.createdByActorId,
    createdAt: row.createdAt.toISOString(),
    safeSummary: row.safeSummary,
  };
}

function mapPrismaCurriculumValidityToContract(row: any): QuestionCurriculumValidity {
  return {
    questionVersionId: row.questionVersionId,
    schoolId: row.schoolId,
    curriculumVersionId: row.curriculumVersionId,
    objectiveIds: (row.objectiveIdsJson as string[]) ?? [],
    valid: row.valid,
    reasonCodes: (row.reasonCodesJson as string[]) ?? [],
    checkedAt: row.checkedAt.toISOString(),
  };
}

function mapPrismaUsageEligibilityToContract(row: any): QuestionUsageEligibility {
  return {
    questionVersionId: row.questionVersionId,
    usageMode: row.usageMode,
    eligible: row.eligible,
    reasonCodes: (row.reasonCodesJson as string[]) ?? [],
    checkedAt: row.checkedAt.toISOString(),
  };
}

function mapPrismaSafetyReviewToContract(row: any): ContentSafetyReview {
  return {
    reviewId: row.id,
    questionVersionId: row.targetId,
    reviewState: row.reviewState,
    reviewedByActorId: row.reviewedByActorId ?? null,
    reviewedByRole: row.reviewedByRole ?? null,
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
    decision: row.decision,
    reasonCodes: (row.reasonCodes as string[]) ?? [],
    safeNotes: row.safeNotes ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

function mapPrismaApprovalRequestToContract(row: any): QuestionApprovalRequest {
  return {
    approvalRequestId: row.approvalRequestId,
    schoolId: row.schoolId,
    questionId: row.questionId,
    questionVersionId: row.questionVersionId,
    requestedByActorId: row.requestedByActorId,
    requestedByRole: row.requestedByRole,
    status: row.status,
    requestReason: row.requestReason,
    policyVersionRefsJson: (row.policyVersionRefsJson as string[]) ?? [],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    closedAt: row.closedAt?.toISOString() ?? null,
  };
}

function mapPrismaApprovalRecordToContract(row: any): QuestionApprovalRecord {
  return {
    approvalRecordId: row.approvalRecordId,
    schoolId: row.schoolId,
    approvalRequestId: row.approvalRequestId,
    questionId: row.questionId,
    questionVersionId: row.questionVersionId,
    decision: row.decision,
    decidedByActorId: row.decidedByActorId,
    decidedByRole: row.decidedByRole,
    decisionReason: row.decisionReason,
    reasonCodesJson: (row.reasonCodesJson as string[]) ?? [],
    createdAt: row.createdAt.toISOString(),
  };
}

function mapPrismaIngestionBatchToContract(row: any): QuestionIngestionBatch {
  return {
    ingestionBatchId: row.ingestionBatchId,
    schoolId: row.schoolId,
    sourceType: row.sourceType,
    approvedSourceId: row.approvedSourceId ?? null,
    importBatchRef: row.importBatchRef ?? null,
    status: row.status,
    createdByActorId: row.createdByActorId,
    createdByRole: row.createdByRole,
    candidateCount: row.candidateCount,
    acceptedCount: row.acceptedCount,
    rejectedCount: row.rejectedCount,
    warningCount: row.warningCount,
    safeSummary: row.safeSummary,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    completedAt: row.completedAt?.toISOString() ?? null,
  };
}

function mapPrismaIngestionCandidateToContract(row: any): QuestionIngestionCandidate {
  return {
    candidateId: row.candidateId,
    ingestionBatchId: row.ingestionBatchId,
    schoolId: row.schoolId,
    status: row.status,
    candidateType: row.candidateType,
    stemSafeText: row.stemSafeText,
    questionType: row.questionType,
    subjectId: row.subjectId,
    topicId: row.topicId,
    skillId: row.skillId,
    curriculumVersionId: row.curriculumVersionId,
    primaryObjectiveId: row.primaryObjectiveId,
    approvedSourceId: row.approvedSourceId ?? null,
    sourceRef: row.sourceRef,
    contentHash: row.contentHash,
    warningsJson: (row.warningsJson as string[]) ?? [],
    safeMetadataJson: (row.safeMetadataJson as Record<string, unknown>) ?? {},
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    acceptedQuestionId: row.acceptedQuestionId ?? null,
    acceptedQuestionVersionId: row.acceptedQuestionVersionId ?? null,
    rejectedReasonCode: row.rejectedReasonCode ?? null,
  };
}

function mapPrismaDuplicateCandidateToContract(row: any): QuestionDuplicateCandidate {
  return {
    duplicateCandidateId: row.duplicateCandidateId,
    schoolId: row.schoolId,
    sourceQuestionVersionId: row.sourceQuestionVersionId,
    candidateQuestionVersionId: row.candidateQuestionVersionId,
    contentHash: row.contentHash,
    similarityReason: row.similarityReason,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    resolvedAt: row.resolvedAt?.toISOString() ?? null,
    resolvedByActorId: row.resolvedByActorId ?? null,
    resolutionReason: row.resolutionReason ?? null,
  };
}

function mapPrismaExposureHoldToContract(row: any): QuestionExposureHold {
  return {
    exposureHoldId: row.exposureHoldId,
    schoolId: row.schoolId,
    questionId: row.questionId,
    questionVersionId: row.questionVersionId,
    holdType: row.holdType,
    status: row.status,
    reasonCode: row.reasonCode,
    safeSummary: row.safeSummary,
    createdByActorId: row.createdByActorId,
    createdAt: row.createdAt.toISOString(),
    releasedByActorId: row.releasedByActorId ?? null,
    releasedAt: row.releasedAt?.toISOString() ?? null,
    releaseReason: row.releaseReason ?? null,
  };
}

export class PrismaQuestionBankItemRepository implements QuestionBankItemRepository {
  constructor(private db: PrismaClient = prisma) {}

  async create(item: QuestionBankItem): Promise<QuestionBankItem> {
    const row = await this.db.questionBankItemRecord.create({
      data: {
        questionId: item.questionId,
        schoolId: item.schoolId,
        status: item.status,
        subjectId: item.subjectId,
        topicId: item.topicId,
        skillId: item.skillId,
        curriculumVersionId: item.curriculumVersionId,
        primaryObjectiveId: item.primaryObjectiveId,
        currentVersionId: item.currentVersionId,
        createdByActorId: item.createdByActorId,
        createdByRole: item.createdByRole,
        sourceType: item.sourceType,
        securityClass: item.securityClass,
      },
    });
    return mapPrismaItemToContract(row);
  }

  async findById(questionId: string): Promise<QuestionBankItem | null> {
    const row = await this.db.questionBankItemRecord.findUnique({ where: { questionId } });
    return row ? mapPrismaItemToContract(row) : null;
  }

  async findBySchoolId(schoolId: string): Promise<QuestionBankItem[]> {
    const rows = await this.db.questionBankItemRecord.findMany({ where: { schoolId } });
    return rows.map(mapPrismaItemToContract);
  }

  async updateStatus(questionId: string, status: QuestionBankItem['status'], updatedAt: string): Promise<QuestionBankItem | null> {
    const row = await this.db.questionBankItemRecord.update({
      where: { questionId },
      data: { status },
    });
    return row ? mapPrismaItemToContract(row) : null;
  }

  async updateCurrentVersion(questionId: string, currentVersionId: string): Promise<QuestionBankItem | null> {
    const row = await this.db.questionBankItemRecord.update({
      where: { questionId },
      data: { currentVersionId },
    });
    return row ? mapPrismaItemToContract(row) : null;
  }

  async findBySubjectId(schoolId: string, subjectId: string): Promise<QuestionBankItem[]> {
    const rows = await this.db.questionBankItemRecord.findMany({
      where: { schoolId, subjectId },
    });
    return rows.map(mapPrismaItemToContract);
  }
}

export class PrismaQuestionVersionRepository implements QuestionVersionRepository {
  constructor(private db: PrismaClient = prisma) {}

  async create(version: QuestionVersion): Promise<QuestionVersion> {
    const row = await this.db.questionVersionRecord.create({
      data: {
        questionVersionId: version.questionVersionId,
        questionId: version.questionId,
        versionNumber: version.versionNumber,
        status: version.status,
        stemSafeText: version.stemSafeText,
        questionType: version.questionType,
        difficultyBand: version.difficultyBand,
        language: version.language,
        studentSafeExplanation: version.studentSafeExplanation,
        teacherExplanation: version.teacherExplanation,
        estimatedTimeSeconds: version.estimatedTimeSeconds,
        createdByActorId: version.createdByActorId,
        contentHash: version.contentHash,
      },
    });
    return mapPrismaVersionToContract(row);
  }

  async findById(questionVersionId: string): Promise<QuestionVersion | null> {
    const row = await this.db.questionVersionRecord.findUnique({ where: { questionVersionId } });
    return row ? mapPrismaVersionToContract(row) : null;
  }

  async findByQuestionId(questionId: string): Promise<QuestionVersion[]> {
    const rows = await this.db.questionVersionRecord.findMany({
      where: { questionId },
      orderBy: { versionNumber: 'desc' },
    });
    return rows.map(mapPrismaVersionToContract);
  }

  async findCurrentByQuestionId(questionId: string): Promise<QuestionVersion | null> {
    const row = await this.db.questionVersionRecord.findFirst({
      where: { questionId, status: 'approved' },
      orderBy: { versionNumber: 'desc' },
    });
    return row ? mapPrismaVersionToContract(row) : null;
  }

  async updateStatus(questionVersionId: string, status: QuestionVersion['status']): Promise<QuestionVersion | null> {
    const row = await this.db.questionVersionRecord.update({
      where: { questionVersionId },
      data: { status },
    });
    return row ? mapPrismaVersionToContract(row) : null;
  }
}

export class PrismaQuestionPartVersionRepository implements QuestionPartVersionRepository {
  constructor(private db: PrismaClient = prisma) {}

  async create(part: QuestionPartVersion): Promise<QuestionPartVersion> {
    const row = await this.db.questionPartVersionRecord.create({ data: part as any });
    return mapPrismaPartToContract(row);
  }

  async findByQuestionVersionId(questionVersionId: string): Promise<QuestionPartVersion[]> {
    const rows = await this.db.questionPartVersionRecord.findMany({
      where: { questionVersionId },
      orderBy: { partOrder: 'asc' },
    });
    return rows.map(mapPrismaPartToContract);
  }
}

export class PrismaQuestionAssetVersionRepository implements QuestionAssetVersionRepository {
  constructor(private db: PrismaClient = prisma) {}

  async create(asset: QuestionAssetVersion): Promise<QuestionAssetVersion> {
    const row = await this.db.questionAssetVersionRecord.create({ data: asset as any });
    return mapPrismaAssetToContract(row);
  }

  async findByQuestionVersionId(questionVersionId: string): Promise<QuestionAssetVersion[]> {
    const rows = await this.db.questionAssetVersionRecord.findMany({ where: { questionVersionId } });
    return rows.map(mapPrismaAssetToContract);
  }
}

export class PrismaAnswerKeyVersionRepository implements AnswerKeyVersionRepository {
  constructor(private db: PrismaClient = prisma) {}

  async create(answerKey: AnswerKeyVersion): Promise<AnswerKeyVersion> {
    const row = await this.db.answerKeyVersionRecord.create({
      data: {
        answerKeyVersionId: answerKey.answerKeyVersionId,
        questionVersionId: answerKey.questionVersionId,
        status: answerKey.status,
        answerKeySafeRef: answerKey.answerKeySafeRef,
        correctAnswerSummary: answerKey.correctAnswerSummary,
        markingNotesTeacherOnly: answerKey.markingNotesTeacherOnly,
        createdByActorId: answerKey.createdByActorId,
      },
    });
    return mapPrismaAnswerKeyToContract(row);
  }

  async findByQuestionVersionId(questionVersionId: string): Promise<AnswerKeyVersion | null> {
    const row = await this.db.answerKeyVersionRecord.findFirst({ where: { questionVersionId } });
    return row ? mapPrismaAnswerKeyToContract(row) : null;
  }

  async updateStatus(answerKeyVersionId: string, status: AnswerKeyVersion['status']): Promise<AnswerKeyVersion | null> {
    const row = await this.db.answerKeyVersionRecord.update({
      where: { answerKeyVersionId },
      data: { status },
    });
    return row ? mapPrismaAnswerKeyToContract(row) : null;
  }
}

export class PrismaRubricVersionRepository implements RubricVersionRepository {
  constructor(private db: PrismaClient = prisma) {}

  async create(rubric: RubricVersion): Promise<RubricVersion> {
    const row = await this.db.rubricVersionRecord.create({
      data: {
        rubricVersionId: rubric.rubricVersionId,
        questionVersionId: rubric.questionVersionId,
        status: rubric.status,
        rubricPublicSummary: rubric.rubricPublicSummary,
        rubricInternal: rubric.rubricInternal,
        marksTotal: rubric.marksTotal,
        criteriaJson: rubric.criteriaJson ? JSON.parse(rubric.criteriaJson) : undefined,
        createdByActorId: rubric.createdByActorId,
      },
    });
    return mapPrismaRubricToContract(row);
  }

  async findByQuestionVersionId(questionVersionId: string): Promise<RubricVersion | null> {
    const row = await this.db.rubricVersionRecord.findFirst({ where: { questionVersionId } });
    return row ? mapPrismaRubricToContract(row) : null;
  }

  async updateStatus(rubricVersionId: string, status: RubricVersion['status']): Promise<RubricVersion | null> {
    const row = await this.db.rubricVersionRecord.update({
      where: { rubricVersionId },
      data: { status },
    });
    return row ? mapPrismaRubricToContract(row) : null;
  }
}

export class PrismaQuestionObjectiveMappingRepository implements QuestionObjectiveMappingRepository {
  constructor(private db: PrismaClient = prisma) {}

  async create(mapping: QuestionObjectiveMapping): Promise<QuestionObjectiveMapping> {
    const row = await this.db.questionObjectiveMappingRecord.create({ data: mapping as any });
    return mapPrismaMappingToContract(row);
  }

  async findByQuestionVersionId(questionVersionId: string): Promise<QuestionObjectiveMapping[]> {
    const rows = await this.db.questionObjectiveMappingRecord.findMany({ where: { questionVersionId } });
    return rows.map(mapPrismaMappingToContract);
  }

  async findPrimaryByQuestionVersionId(questionVersionId: string): Promise<QuestionObjectiveMapping | null> {
    const row = await this.db.questionObjectiveMappingRecord.findFirst({
      where: { questionVersionId, mappingStrength: 'primary' },
    });
    return row ? mapPrismaMappingToContract(row) : null;
  }
}

export class PrismaQuestionSourceRecordRepository implements QuestionSourceRecordRepository {
  constructor(private db: PrismaClient = prisma) {}

  async create(record: QuestionSourceRecord): Promise<QuestionSourceRecord> {
    const row = await this.db.questionSourceRecordRecord.create({
      data: {
        sourceRecordId: record.sourceRecordId,
        questionId: record.questionId,
        questionVersionId: record.questionVersionId,
        sourceType: record.sourceType,
        sourceRef: record.sourceRef,
        approvedSourceId: record.approvedSourceId,
        importBatchId: record.importBatchId,
        createdByActorId: record.createdByActorId,
        safeSummary: record.safeSummary,
      },
    });
    return mapPrismaSourceToContract(row);
  }

  async findByQuestionId(questionId: string): Promise<QuestionSourceRecord[]> {
    const rows = await this.db.questionSourceRecordRecord.findMany({ where: { questionId } });
    return rows.map(mapPrismaSourceToContract);
  }
}

export class PrismaQuestionGovernanceRepository implements QuestionGovernanceRepository {
  constructor(private db: PrismaClient = prisma) {}

  async saveCurriculumValidity(validity: QuestionCurriculumValidity): Promise<QuestionCurriculumValidity> {
    const row = await this.db.questionCurriculumValidityRecord.upsert({
      where: { id: validity.questionVersionId + '_' + validity.curriculumVersionId },
      create: {
        questionVersionId: validity.questionVersionId,
        schoolId: validity.schoolId,
        curriculumVersionId: validity.curriculumVersionId,
        objectiveIdsJson: validity.objectiveIds,
        valid: validity.valid,
        reasonCodesJson: validity.reasonCodes,
      },
      update: {
        objectiveIdsJson: validity.objectiveIds,
        valid: validity.valid,
        reasonCodesJson: validity.reasonCodes,
        checkedAt: new Date(),
      },
    });
    return mapPrismaCurriculumValidityToContract(row);
  }

  async findCurriculumValidity(questionVersionId: string): Promise<QuestionCurriculumValidity | null> {
    const row = await this.db.questionCurriculumValidityRecord.findFirst({ where: { questionVersionId } });
    return row ? mapPrismaCurriculumValidityToContract(row) : null;
  }

  async saveUsageEligibility(eligibility: QuestionUsageEligibility): Promise<QuestionUsageEligibility> {
    const row = await this.db.questionUsageEligibilityRecord.create({
      data: {
        questionVersionId: eligibility.questionVersionId,
        usageMode: eligibility.usageMode,
        eligible: eligibility.eligible,
        reasonCodesJson: eligibility.reasonCodes,
      },
    });
    return mapPrismaUsageEligibilityToContract(row);
  }

  async findUsageEligibility(questionVersionId: string, usageMode: string): Promise<QuestionUsageEligibility | null> {
    const row = await this.db.questionUsageEligibilityRecord.findFirst({
      where: { questionVersionId, usageMode },
    });
    return row ? mapPrismaUsageEligibilityToContract(row) : null;
  }

  async saveContentSafetyReview(review: ContentSafetyReview): Promise<ContentSafetyReview> {
    const row = await this.db.contentReviewRecord.create({
      data: {
        schoolId: review.reviewId ? review.reviewId.substring(0, 36) : undefined,
        targetType: 'question_version',
        targetId: review.questionVersionId,
        reviewState: review.reviewState,
        reviewedByActorId: review.reviewedByActorId,
        reviewedByRole: review.reviewedByRole,
        reviewedAt: review.reviewedAt ? new Date(review.reviewedAt) : undefined,
        decision: review.decision,
        reasonCodes: review.reasonCodes,
        safeNotes: review.safeNotes,
      },
    });
    return mapPrismaSafetyReviewToContract(row);
  }

  async findContentSafetyReview(questionVersionId: string): Promise<ContentSafetyReview | null> {
    const row = await this.db.contentReviewRecord.findFirst({
      where: { targetType: 'question_version', targetId: questionVersionId },
      orderBy: { createdAt: 'desc' },
    });
    return row ? mapPrismaSafetyReviewToContract(row) : null;
  }
}

export class PrismaQuestionApprovalRequestRepository implements QuestionApprovalRequestRepository {
  constructor(private db: PrismaClient = prisma) {}

  async create(request: QuestionApprovalRequest): Promise<QuestionApprovalRequest> {
    const row = await this.db.questionApprovalRequestRecord.create({
      data: {
        approvalRequestId: request.approvalRequestId,
        schoolId: request.schoolId,
        questionId: request.questionId,
        questionVersionId: request.questionVersionId,
        requestedByActorId: request.requestedByActorId,
        requestedByRole: request.requestedByRole,
        status: request.status,
        requestReason: request.requestReason,
        policyVersionRefsJson: request.policyVersionRefsJson,
      },
    });
    return mapPrismaApprovalRequestToContract(row);
  }

  async findById(approvalRequestId: string): Promise<QuestionApprovalRequest | null> {
    const row = await this.db.questionApprovalRequestRecord.findUnique({ where: { approvalRequestId } });
    return row ? mapPrismaApprovalRequestToContract(row) : null;
  }

  async findBySchoolId(schoolId: string): Promise<QuestionApprovalRequest[]> {
    const rows = await this.db.questionApprovalRequestRecord.findMany({ where: { schoolId } });
    return rows.map(mapPrismaApprovalRequestToContract);
  }

  async findByQuestionVersionId(questionVersionId: string): Promise<QuestionApprovalRequest[]> {
    const rows = await this.db.questionApprovalRequestRecord.findMany({ where: { questionVersionId } });
    return rows.map(mapPrismaApprovalRequestToContract);
  }

  async findPendingBySchoolId(schoolId: string): Promise<QuestionApprovalRequest[]> {
    const rows = await this.db.questionApprovalRequestRecord.findMany({
      where: { schoolId, status: 'pending' },
    });
    return rows.map(mapPrismaApprovalRequestToContract);
  }

  async updateStatus(approvalRequestId: string, status: ApprovalRequestStatus, closedAt: string | null): Promise<QuestionApprovalRequest | null> {
    const row = await this.db.questionApprovalRequestRecord.update({
      where: { approvalRequestId },
      data: {
        status,
        closedAt: closedAt ? new Date(closedAt) : undefined,
      },
    });
    return row ? mapPrismaApprovalRequestToContract(row) : null;
  }
}

export class PrismaQuestionApprovalRecordRepository implements QuestionApprovalRecordRepository {
  constructor(private db: PrismaClient = prisma) {}

  async create(record: QuestionApprovalRecord): Promise<QuestionApprovalRecord> {
    const row = await this.db.questionApprovalRecord.create({
      data: {
        approvalRecordId: record.approvalRecordId,
        schoolId: record.schoolId,
        approvalRequestId: record.approvalRequestId,
        questionId: record.questionId,
        questionVersionId: record.questionVersionId,
        decision: record.decision,
        decidedByActorId: record.decidedByActorId,
        decidedByRole: record.decidedByRole,
        decisionReason: record.decisionReason,
        reasonCodesJson: record.reasonCodesJson,
      },
    });
    return mapPrismaApprovalRecordToContract(row);
  }

  async findByApprovalRequestId(approvalRequestId: string): Promise<QuestionApprovalRecord[]> {
    const rows = await this.db.questionApprovalRecord.findMany({ where: { approvalRequestId } });
    return rows.map(mapPrismaApprovalRecordToContract);
  }

  async findByQuestionVersionId(questionVersionId: string): Promise<QuestionApprovalRecord[]> {
    const rows = await this.db.questionApprovalRecord.findMany({ where: { questionVersionId } });
    return rows.map(mapPrismaApprovalRecordToContract);
  }
}

export class PrismaQuestionIngestionBatchRepository implements QuestionIngestionBatchRepository {
  constructor(private db: PrismaClient = prisma) {}

  async create(batch: QuestionIngestionBatch): Promise<QuestionIngestionBatch> {
    const row = await this.db.questionIngestionBatchRecord.create({
      data: {
        ingestionBatchId: batch.ingestionBatchId,
        schoolId: batch.schoolId,
        sourceType: batch.sourceType,
        approvedSourceId: batch.approvedSourceId,
        importBatchRef: batch.importBatchRef,
        status: batch.status,
        createdByActorId: batch.createdByActorId,
        createdByRole: batch.createdByRole,
        candidateCount: batch.candidateCount,
        acceptedCount: batch.acceptedCount,
        rejectedCount: batch.rejectedCount,
        warningCount: batch.warningCount,
        safeSummary: batch.safeSummary,
      },
    });
    return mapPrismaIngestionBatchToContract(row);
  }

  async findById(ingestionBatchId: string): Promise<QuestionIngestionBatch | null> {
    const row = await this.db.questionIngestionBatchRecord.findUnique({ where: { ingestionBatchId } });
    return row ? mapPrismaIngestionBatchToContract(row) : null;
  }

  async findBySchoolId(schoolId: string): Promise<QuestionIngestionBatch[]> {
    const rows = await this.db.questionIngestionBatchRecord.findMany({ where: { schoolId } });
    return rows.map(mapPrismaIngestionBatchToContract);
  }

  async updateStatus(ingestionBatchId: string, status: IngestionBatchStatus, completedAt: string | null): Promise<QuestionIngestionBatch | null> {
    const row = await this.db.questionIngestionBatchRecord.update({
      where: { ingestionBatchId },
      data: {
        status,
        completedAt: completedAt ? new Date(completedAt) : undefined,
      },
    });
    return row ? mapPrismaIngestionBatchToContract(row) : null;
  }

  async updateCounts(ingestionBatchId: string, candidateCount: number, acceptedCount: number, rejectedCount: number, warningCount: number): Promise<QuestionIngestionBatch | null> {
    const row = await this.db.questionIngestionBatchRecord.update({
      where: { ingestionBatchId },
      data: { candidateCount, acceptedCount, rejectedCount, warningCount },
    });
    return row ? mapPrismaIngestionBatchToContract(row) : null;
  }
}

export class PrismaQuestionIngestionCandidateRepository implements QuestionIngestionCandidateRepository {
  constructor(private db: PrismaClient = prisma) {}

  async create(candidate: QuestionIngestionCandidate): Promise<QuestionIngestionCandidate> {
    const row = await this.db.questionIngestionCandidateRecord.create({
      data: {
        candidateId: candidate.candidateId,
        ingestionBatchId: candidate.ingestionBatchId,
        schoolId: candidate.schoolId,
        status: candidate.status,
        candidateType: candidate.candidateType,
        stemSafeText: candidate.stemSafeText,
        questionType: candidate.questionType,
        subjectId: candidate.subjectId,
        topicId: candidate.topicId,
        skillId: candidate.skillId,
        curriculumVersionId: candidate.curriculumVersionId,
        primaryObjectiveId: candidate.primaryObjectiveId,
        approvedSourceId: candidate.approvedSourceId,
        sourceRef: candidate.sourceRef,
        contentHash: candidate.contentHash,
        warningsJson: candidate.warningsJson,
        safeMetadataJson: candidate.safeMetadataJson as any,
      },
    });
    return mapPrismaIngestionCandidateToContract(row);
  }

  async findById(candidateId: string): Promise<QuestionIngestionCandidate | null> {
    const row = await this.db.questionIngestionCandidateRecord.findUnique({ where: { candidateId } });
    return row ? mapPrismaIngestionCandidateToContract(row) : null;
  }

  async findByBatchId(ingestionBatchId: string): Promise<QuestionIngestionCandidate[]> {
    const rows = await this.db.questionIngestionCandidateRecord.findMany({ where: { ingestionBatchId } });
    return rows.map(mapPrismaIngestionCandidateToContract);
  }

  async findBySchoolId(schoolId: string): Promise<QuestionIngestionCandidate[]> {
    const rows = await this.db.questionIngestionCandidateRecord.findMany({ where: { schoolId } });
    return rows.map(mapPrismaIngestionCandidateToContract);
  }

  async findByContentHash(schoolId: string, contentHash: string): Promise<QuestionIngestionCandidate[]> {
    const rows = await this.db.questionIngestionCandidateRecord.findMany({
      where: { schoolId, contentHash },
    });
    return rows.map(mapPrismaIngestionCandidateToContract);
  }

  async updateStatus(candidateId: string, status: IngestionCandidateStatus): Promise<QuestionIngestionCandidate | null> {
    const row = await this.db.questionIngestionCandidateRecord.update({
      where: { candidateId },
      data: { status },
    });
    return row ? mapPrismaIngestionCandidateToContract(row) : null;
  }

  async updateAcceptedRef(candidateId: string, acceptedQuestionId: string, acceptedQuestionVersionId: string): Promise<QuestionIngestionCandidate | null> {
    const row = await this.db.questionIngestionCandidateRecord.update({
      where: { candidateId },
      data: { acceptedQuestionId, acceptedQuestionVersionId, status: 'accepted' },
    });
    return row ? mapPrismaIngestionCandidateToContract(row) : null;
  }

  async rejectCandidate(candidateId: string, rejectedReasonCode: string): Promise<QuestionIngestionCandidate | null> {
    const row = await this.db.questionIngestionCandidateRecord.update({
      where: { candidateId },
      data: { rejectedReasonCode, status: 'rejected' },
    });
    return row ? mapPrismaIngestionCandidateToContract(row) : null;
  }
}

export class PrismaQuestionDuplicateCandidateRepository implements QuestionDuplicateCandidateRepository {
  constructor(private db: PrismaClient = prisma) {}

  async create(candidate: QuestionDuplicateCandidate): Promise<QuestionDuplicateCandidate> {
    const row = await this.db.questionDuplicateCandidateRecord.create({
      data: candidate as any,
    });
    return mapPrismaDuplicateCandidateToContract(row);
  }

  async findById(duplicateCandidateId: string): Promise<QuestionDuplicateCandidate | null> {
    const row = await this.db.questionDuplicateCandidateRecord.findUnique({ where: { duplicateCandidateId } });
    return row ? mapPrismaDuplicateCandidateToContract(row) : null;
  }

  async findByContentHash(schoolId: string, contentHash: string): Promise<QuestionDuplicateCandidate[]> {
    const rows = await this.db.questionDuplicateCandidateRecord.findMany({
      where: { schoolId, contentHash },
    });
    return rows.map(mapPrismaDuplicateCandidateToContract);
  }

  async findBySourceQuestionVersionId(questionVersionId: string): Promise<QuestionDuplicateCandidate[]> {
    const rows = await this.db.questionDuplicateCandidateRecord.findMany({
      where: { sourceQuestionVersionId: questionVersionId },
    });
    return rows.map(mapPrismaDuplicateCandidateToContract);
  }

  async updateStatus(duplicateCandidateId: string, status: DuplicateCandidateStatus, resolvedAt: string | null, resolvedByActorId: string | null, resolutionReason: string | null): Promise<QuestionDuplicateCandidate | null> {
    const row = await this.db.questionDuplicateCandidateRecord.update({
      where: { duplicateCandidateId },
      data: {
        status,
        resolvedAt: resolvedAt ? new Date(resolvedAt) : undefined,
        resolvedByActorId,
        resolutionReason,
      },
    });
    return row ? mapPrismaDuplicateCandidateToContract(row) : null;
  }
}

export class PrismaQuestionExposureHoldRepository implements QuestionExposureHoldRepository {
  constructor(private db: PrismaClient = prisma) {}

  async create(hold: QuestionExposureHold): Promise<QuestionExposureHold> {
    const row = await this.db.questionExposureHoldRecord.create({
      data: hold as any,
    });
    return mapPrismaExposureHoldToContract(row);
  }

  async findById(exposureHoldId: string): Promise<QuestionExposureHold | null> {
    const row = await this.db.questionExposureHoldRecord.findUnique({ where: { exposureHoldId } });
    return row ? mapPrismaExposureHoldToContract(row) : null;
  }

  async findByQuestionId(questionId: string): Promise<QuestionExposureHold[]> {
    const rows = await this.db.questionExposureHoldRecord.findMany({ where: { questionId } });
    return rows.map(mapPrismaExposureHoldToContract);
  }

  async findActiveByQuestionId(questionId: string): Promise<QuestionExposureHold[]> {
    const rows = await this.db.questionExposureHoldRecord.findMany({
      where: { questionId, status: 'active' },
    });
    return rows.map(mapPrismaExposureHoldToContract);
  }

  async releaseHold(exposureHoldId: string, releasedByActorId: string, releaseReason: string, releasedAt: string): Promise<QuestionExposureHold | null> {
    const row = await this.db.questionExposureHoldRecord.update({
      where: { exposureHoldId },
      data: {
        status: 'released',
        releasedByActorId,
        releaseReason,
        releasedAt: new Date(releasedAt),
      },
    });
    return row ? mapPrismaExposureHoldToContract(row) : null;
  }
}
