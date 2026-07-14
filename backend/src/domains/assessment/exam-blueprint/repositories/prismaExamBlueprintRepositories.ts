import { PrismaClient } from '@prisma/client';
import { prisma } from '../../../utils/prisma';
import {
  ExamBlueprint, ExamBlueprintVersion, ExamBlueprintRequirement,
  ExamDraftSet, ExamDraft, ExamDraftQuestion,
  QuestionSelectionRun, QuestionSelectionCandidate,
} from '../contracts';
import {
  ExamBlueprintRepository, ExamBlueprintVersionRepository,
  ExamBlueprintRequirementRepository, ExamDraftSetRepository,
  ExamDraftRepository, ExamDraftQuestionRepository,
  QuestionSelectionRunRepository, QuestionSelectionCandidateRepository,
} from '../contracts/examBlueprintRepositoryContracts';

function mapPrismaBlueprint(row: any): ExamBlueprint {
  return {
    blueprintId: row.blueprintId,
    schoolId: row.schoolId,
    status: row.status,
    title: row.title,
    subjectId: row.subjectId,
    curriculumVersionId: row.curriculumVersionId,
    gradeBand: row.gradeBand,
    examType: row.examType,
    createdByActorId: row.createdByActorId,
    createdByRole: row.createdByRole,
    currentVersionId: row.currentVersionId ?? null,
    createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
    updatedAt: row.updatedAt?.toISOString() ?? new Date().toISOString(),
    archivedAt: row.archivedAt?.toISOString() ?? null,
  };
}

function mapPrismaBlueprintVersion(row: any): ExamBlueprintVersion {
  return {
    blueprintVersionId: row.blueprintVersionId,
    blueprintId: row.blueprintId,
    versionNumber: row.versionNumber,
    status: row.status,
    title: row.title,
    safeDescription: row.safeDescription,
    durationMinutes: row.durationMinutes,
    totalMarks: row.totalMarks,
    targetQuestionCount: row.targetQuestionCount,
    difficultyMixJson: row.difficultyMixJson ? JSON.stringify(row.difficultyMixJson) : '{}',
    questionTypeMixJson: row.questionTypeMixJson ? JSON.stringify(row.questionTypeMixJson) : '{}',
    securityClassRequirement: row.securityClassRequirement,
    coveragePolicy: row.coveragePolicy,
    selectionStrategy: row.selectionStrategy,
    createdByActorId: row.createdByActorId,
    createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
    approvedAt: row.approvedAt?.toISOString() ?? null,
    supersededAt: row.supersededAt?.toISOString() ?? null,
  };
}

function mapPrismaRequirement(row: any): ExamBlueprintRequirement {
  return {
    requirementId: row.requirementId,
    blueprintVersionId: row.blueprintVersionId,
    schoolId: row.schoolId,
    requirementType: row.requirementType,
    subjectId: row.subjectId,
    topicId: row.topicId,
    skillId: row.skillId,
    objectiveId: row.objectiveId,
    requiredQuestionCount: row.requiredQuestionCount,
    requiredMarks: row.requiredMarks,
    minimumDifficulty: row.minimumDifficulty,
    maximumDifficulty: row.maximumDifficulty,
    questionType: row.questionType,
    weight: row.weight,
    isMandatory: row.isMandatory,
    createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
  };
}

function mapPrismaDraftSet(row: any): ExamDraftSet {
  return {
    draftSetId: row.draftSetId,
    schoolId: row.schoolId,
    blueprintId: row.blueprintId,
    blueprintVersionId: row.blueprintVersionId,
    status: row.status,
    requestedDraftCount: row.requestedDraftCount,
    generatedDraftCount: row.generatedDraftCount,
    selectionStrategy: row.selectionStrategy,
    createdByActorId: row.createdByActorId,
    createdByRole: row.createdByRole,
    safeSummary: row.safeSummary,
    coverageGapSummary: row.coverageGapSummary,
    createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
    updatedAt: row.updatedAt?.toISOString() ?? new Date().toISOString(),
    completedAt: row.completedAt?.toISOString() ?? null,
  };
}

function mapPrismaDraft(row: any): ExamDraft {
  return {
    draftId: row.draftId,
    draftSetId: row.draftSetId,
    schoolId: row.schoolId,
    blueprintId: row.blueprintId,
    blueprintVersionId: row.blueprintVersionId,
    rank: row.rank,
    status: row.status,
    draftTitle: row.draftTitle,
    totalMarks: row.totalMarks,
    estimatedDurationMinutes: row.estimatedDurationMinutes,
    questionCount: row.questionCount,
    coverageScore: row.coverageScore,
    difficultyBalanceScore: row.difficultyBalanceScore,
    securityScore: row.securityScore,
    freshnessScore: row.freshnessScore,
    overallScore: row.overallScore,
    recommendationReason: row.recommendationReason,
    safeTeacherSummary: row.safeTeacherSummary,
    differenceFromPreviousDraft: row.differenceFromPreviousDraft,
    warningCodesJson: row.warningCodesJson ? JSON.stringify(row.warningCodesJson) : '[]',
    createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
    updatedAt: row.updatedAt?.toISOString() ?? new Date().toISOString(),
  };
}

function mapPrismaDraftQuestion(row: any): ExamDraftQuestion {
  return {
    draftQuestionId: row.draftQuestionId,
    draftId: row.draftId,
    schoolId: row.schoolId,
    questionId: row.questionId,
    questionVersionId: row.questionVersionId,
    position: row.position,
    sectionKey: row.sectionKey,
    marksAllocated: row.marksAllocated,
    selectionReason: row.selectionReason,
    requirementId: row.requirementId,
    coverageTagsJson: row.coverageTagsJson ? JSON.stringify(row.coverageTagsJson) : '[]',
    warningCodesJson: row.warningCodesJson ? JSON.stringify(row.warningCodesJson) : '[]',
    createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
  };
}

function mapPrismaSelectionRun(row: any): QuestionSelectionRun {
  return {
    selectionRunId: row.selectionRunId,
    schoolId: row.schoolId,
    blueprintId: row.blueprintId,
    blueprintVersionId: row.blueprintVersionId,
    draftSetId: row.draftSetId,
    status: row.status,
    strategy: row.strategy,
    candidatePoolSize: row.candidatePoolSize,
    eligiblePoolSize: row.eligiblePoolSize,
    selectedCount: row.selectedCount,
    rejectedCount: row.rejectedCount,
    gapCount: row.gapCount,
    safeSummary: row.safeSummary,
    createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
    completedAt: row.completedAt?.toISOString() ?? null,
  };
}

function mapPrismaSelectionCandidate(row: any): QuestionSelectionCandidate {
  return {
    selectionCandidateId: row.selectionCandidateId,
    selectionRunId: row.selectionRunId,
    schoolId: row.schoolId,
    questionId: row.questionId,
    questionVersionId: row.questionVersionId,
    eligible: row.eligible,
    selected: row.selected,
    rejectionReasonCode: row.rejectionReasonCode,
    score: row.score,
    coverageContributionJson: row.coverageContributionJson ? JSON.stringify(row.coverageContributionJson) : '[]',
    riskFlagsJson: row.riskFlagsJson ? JSON.stringify(row.riskFlagsJson) : '[]',
    createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
  };
}

export class PrismaExamBlueprintRepository implements ExamBlueprintRepository {
  constructor(private db: PrismaClient = prisma) {}
  async create(item: ExamBlueprint): Promise<ExamBlueprint> {
    const row = await this.db.examBlueprintRecord.create({ data: { ...item, createdAt: new Date(item.createdAt), updatedAt: new Date(item.updatedAt), archivedAt: item.archivedAt ? new Date(item.archivedAt) : null } });
    return mapPrismaBlueprint(row);
  }
  async findById(blueprintId: string): Promise<ExamBlueprint | null> {
    const row = await this.db.examBlueprintRecord.findUnique({ where: { blueprintId } });
    return row ? mapPrismaBlueprint(row) : null;
  }
  async findBySchoolId(schoolId: string): Promise<ExamBlueprint[]> {
    const rows = await this.db.examBlueprintRecord.findMany({ where: { schoolId } });
    return rows.map(mapPrismaBlueprint);
  }
  async findBySchoolIdAndStatus(schoolId: string, status: string): Promise<ExamBlueprint[]> {
    const rows = await this.db.examBlueprintRecord.findMany({ where: { schoolId, status } });
    return rows.map(mapPrismaBlueprint);
  }
  async findBySchoolIdAndSubject(schoolId: string, subjectId: string): Promise<ExamBlueprint[]> {
    const rows = await this.db.examBlueprintRecord.findMany({ where: { schoolId, subjectId } });
    return rows.map(mapPrismaBlueprint);
  }
  async findByCurriculumVersionId(curriculumVersionId: string): Promise<ExamBlueprint[]> {
    const rows = await this.db.examBlueprintRecord.findMany({ where: { curriculumVersionId } });
    return rows.map(mapPrismaBlueprint);
  }
  async findByCurrentVersionId(currentVersionId: string): Promise<ExamBlueprint | null> {
    const row = await this.db.examBlueprintRecord.findFirst({ where: { currentVersionId } });
    return row ? mapPrismaBlueprint(row) : null;
  }
  async update(item: ExamBlueprint): Promise<ExamBlueprint | null> {
    const existing = await this.db.examBlueprintRecord.findUnique({ where: { blueprintId: item.blueprintId } });
    if (!existing) return null;
    const row = await this.db.examBlueprintRecord.update({ where: { blueprintId: item.blueprintId }, data: { ...item, createdAt: new Date(item.createdAt), updatedAt: new Date(item.updatedAt), archivedAt: item.archivedAt ? new Date(item.archivedAt) : null } });
    return mapPrismaBlueprint(row);
  }
}

export class PrismaExamBlueprintVersionRepository implements ExamBlueprintVersionRepository {
  constructor(private db: PrismaClient = prisma) {}
  async create(item: ExamBlueprintVersion): Promise<ExamBlueprintVersion> {
    const row = await this.db.examBlueprintVersionRecord.create({ data: { ...item, createdAt: new Date(item.createdAt), approvedAt: item.approvedAt ? new Date(item.approvedAt) : null, supersededAt: item.supersededAt ? new Date(item.supersededAt) : null } });
    return mapPrismaBlueprintVersion(row);
  }
  async findById(blueprintVersionId: string): Promise<ExamBlueprintVersion | null> {
    const row = await this.db.examBlueprintVersionRecord.findUnique({ where: { blueprintVersionId } });
    return row ? mapPrismaBlueprintVersion(row) : null;
  }
  async findByBlueprintId(blueprintId: string): Promise<ExamBlueprintVersion[]> {
    const rows = await this.db.examBlueprintVersionRecord.findMany({ where: { blueprintId }, orderBy: { versionNumber: 'desc' } });
    return rows.map(mapPrismaBlueprintVersion);
  }
  async findLatestByBlueprintId(blueprintId: string): Promise<ExamBlueprintVersion | null> {
    const row = await this.db.examBlueprintVersionRecord.findFirst({ where: { blueprintId }, orderBy: { versionNumber: 'desc' } });
    return row ? mapPrismaBlueprintVersion(row) : null;
  }
  async findByStatus(status: string): Promise<ExamBlueprintVersion[]> {
    const rows = await this.db.examBlueprintVersionRecord.findMany({ where: { status } });
    return rows.map(mapPrismaBlueprintVersion);
  }
  async update(item: ExamBlueprintVersion): Promise<ExamBlueprintVersion | null> {
    const existing = await this.db.examBlueprintVersionRecord.findUnique({ where: { blueprintVersionId: item.blueprintVersionId } });
    if (!existing) return null;
    const row = await this.db.examBlueprintVersionRecord.update({ where: { blueprintVersionId: item.blueprintVersionId }, data: { ...item, createdAt: new Date(item.createdAt), approvedAt: item.approvedAt ? new Date(item.approvedAt) : null, supersededAt: item.supersededAt ? new Date(item.supersededAt) : null } });
    return mapPrismaBlueprintVersion(row);
  }
}

export class PrismaExamBlueprintRequirementRepository implements ExamBlueprintRequirementRepository {
  constructor(private db: PrismaClient = prisma) {}
  async create(item: ExamBlueprintRequirement): Promise<ExamBlueprintRequirement> {
    const row = await this.db.examBlueprintRequirementRecord.create({ data: { ...item, createdAt: new Date(item.createdAt) } });
    return mapPrismaRequirement(row);
  }
  async findById(requirementId: string): Promise<ExamBlueprintRequirement | null> {
    const row = await this.db.examBlueprintRequirementRecord.findUnique({ where: { requirementId } });
    return row ? mapPrismaRequirement(row) : null;
  }
  async findByBlueprintVersionId(blueprintVersionId: string): Promise<ExamBlueprintRequirement[]> {
    const rows = await this.db.examBlueprintRequirementRecord.findMany({ where: { blueprintVersionId } });
    return rows.map(mapPrismaRequirement);
  }
  async findBySchoolId(schoolId: string): Promise<ExamBlueprintRequirement[]> {
    const rows = await this.db.examBlueprintRequirementRecord.findMany({ where: { schoolId } });
    return rows.map(mapPrismaRequirement);
  }
  async findByObjectiveId(objectiveId: string): Promise<ExamBlueprintRequirement[]> {
    const rows = await this.db.examBlueprintRequirementRecord.findMany({ where: { objectiveId } });
    return rows.map(mapPrismaRequirement);
  }
  async findByTopicId(topicId: string): Promise<ExamBlueprintRequirement[]> {
    const rows = await this.db.examBlueprintRequirementRecord.findMany({ where: { topicId } });
    return rows.map(mapPrismaRequirement);
  }
  async findBySkillId(skillId: string): Promise<ExamBlueprintRequirement[]> {
    const rows = await this.db.examBlueprintRequirementRecord.findMany({ where: { skillId } });
    return rows.map(mapPrismaRequirement);
  }
  async findByQuestionType(questionType: string): Promise<ExamBlueprintRequirement[]> {
    const rows = await this.db.examBlueprintRequirementRecord.findMany({ where: { questionType } });
    return rows.map(mapPrismaRequirement);
  }
}

export class PrismaExamDraftSetRepository implements ExamDraftSetRepository {
  constructor(private db: PrismaClient = prisma) {}
  async create(item: ExamDraftSet): Promise<ExamDraftSet> {
    const row = await this.db.examDraftSetRecord.create({ data: { ...item, createdAt: new Date(item.createdAt), updatedAt: new Date(item.updatedAt), completedAt: item.completedAt ? new Date(item.completedAt) : null } });
    return mapPrismaDraftSet(row);
  }
  async findById(draftSetId: string): Promise<ExamDraftSet | null> {
    const row = await this.db.examDraftSetRecord.findUnique({ where: { draftSetId } });
    return row ? mapPrismaDraftSet(row) : null;
  }
  async findBySchoolId(schoolId: string): Promise<ExamDraftSet[]> {
    const rows = await this.db.examDraftSetRecord.findMany({ where: { schoolId } });
    return rows.map(mapPrismaDraftSet);
  }
  async findBySchoolIdAndStatus(schoolId: string, status: string): Promise<ExamDraftSet[]> {
    const rows = await this.db.examDraftSetRecord.findMany({ where: { schoolId, status } });
    return rows.map(mapPrismaDraftSet);
  }
  async findByBlueprintId(blueprintId: string): Promise<ExamDraftSet[]> {
    const rows = await this.db.examDraftSetRecord.findMany({ where: { blueprintId } });
    return rows.map(mapPrismaDraftSet);
  }
  async findByBlueprintVersionId(blueprintVersionId: string): Promise<ExamDraftSet[]> {
    const rows = await this.db.examDraftSetRecord.findMany({ where: { blueprintVersionId } });
    return rows.map(mapPrismaDraftSet);
  }
  async update(item: ExamDraftSet): Promise<ExamDraftSet | null> {
    const existing = await this.db.examDraftSetRecord.findUnique({ where: { draftSetId: item.draftSetId } });
    if (!existing) return null;
    const row = await this.db.examDraftSetRecord.update({ where: { draftSetId: item.draftSetId }, data: { ...item, createdAt: new Date(item.createdAt), updatedAt: new Date(item.updatedAt), completedAt: item.completedAt ? new Date(item.completedAt) : null } });
    return mapPrismaDraftSet(row);
  }
}

export class PrismaExamDraftRepository implements ExamDraftRepository {
  constructor(private db: PrismaClient = prisma) {}
  async create(item: ExamDraft): Promise<ExamDraft> {
    const row = await this.db.examDraftRecord.create({ data: { ...item, createdAt: new Date(item.createdAt), updatedAt: new Date(item.updatedAt) } });
    return mapPrismaDraft(row);
  }
  async findById(draftId: string): Promise<ExamDraft | null> {
    const row = await this.db.examDraftRecord.findUnique({ where: { draftId } });
    return row ? mapPrismaDraft(row) : null;
  }
  async findByDraftSetId(draftSetId: string): Promise<ExamDraft[]> {
    const rows = await this.db.examDraftRecord.findMany({ where: { draftSetId }, orderBy: { rank: 'asc' } });
    return rows.map(mapPrismaDraft);
  }
  async findBySchoolId(schoolId: string): Promise<ExamDraft[]> {
    const rows = await this.db.examDraftRecord.findMany({ where: { schoolId } });
    return rows.map(mapPrismaDraft);
  }
  async findByRank(draftSetId: string, rank: number): Promise<ExamDraft | null> {
    const row = await this.db.examDraftRecord.findFirst({ where: { draftSetId, rank } });
    return row ? mapPrismaDraft(row) : null;
  }
  async update(item: ExamDraft): Promise<ExamDraft | null> {
    const existing = await this.db.examDraftRecord.findUnique({ where: { draftId: item.draftId } });
    if (!existing) return null;
    const row = await this.db.examDraftRecord.update({ where: { draftId: item.draftId }, data: { ...item, createdAt: new Date(item.createdAt), updatedAt: new Date(item.updatedAt) } });
    return mapPrismaDraft(row);
  }
}

export class PrismaExamDraftQuestionRepository implements ExamDraftQuestionRepository {
  constructor(private db: PrismaClient = prisma) {}
  async create(item: ExamDraftQuestion): Promise<ExamDraftQuestion> {
    const row = await this.db.examDraftQuestionRecord.create({ data: { ...item, createdAt: new Date(item.createdAt) } });
    return mapPrismaDraftQuestion(row);
  }
  async findById(draftQuestionId: string): Promise<ExamDraftQuestion | null> {
    const row = await this.db.examDraftQuestionRecord.findUnique({ where: { draftQuestionId } });
    return row ? mapPrismaDraftQuestion(row) : null;
  }
  async findByDraftId(draftId: string): Promise<ExamDraftQuestion[]> {
    const rows = await this.db.examDraftQuestionRecord.findMany({ where: { draftId }, orderBy: { position: 'asc' } });
    return rows.map(mapPrismaDraftQuestion);
  }
  async findBySchoolId(schoolId: string): Promise<ExamDraftQuestion[]> {
    const rows = await this.db.examDraftQuestionRecord.findMany({ where: { schoolId } });
    return rows.map(mapPrismaDraftQuestion);
  }
  async findByQuestionId(questionId: string): Promise<ExamDraftQuestion[]> {
    const rows = await this.db.examDraftQuestionRecord.findMany({ where: { questionId } });
    return rows.map(mapPrismaDraftQuestion);
  }
  async findByRequirementId(requirementId: string): Promise<ExamDraftQuestion[]> {
    const rows = await this.db.examDraftQuestionRecord.findMany({ where: { requirementId } });
    return rows.map(mapPrismaDraftQuestion);
  }
  async findByDraftIdAndPosition(draftId: string, position: number): Promise<ExamDraftQuestion | null> {
    const row = await this.db.examDraftQuestionRecord.findFirst({ where: { draftId, position } });
    return row ? mapPrismaDraftQuestion(row) : null;
  }
}

export class PrismaQuestionSelectionRunRepository implements QuestionSelectionRunRepository {
  constructor(private db: PrismaClient = prisma) {}
  async create(item: QuestionSelectionRun): Promise<QuestionSelectionRun> {
    const row = await this.db.questionSelectionRunRecord.create({ data: { ...item, createdAt: new Date(item.createdAt), completedAt: item.completedAt ? new Date(item.completedAt) : null } });
    return mapPrismaSelectionRun(row);
  }
  async findById(selectionRunId: string): Promise<QuestionSelectionRun | null> {
    const row = await this.db.questionSelectionRunRecord.findUnique({ where: { selectionRunId } });
    return row ? mapPrismaSelectionRun(row) : null;
  }
  async findBySchoolId(schoolId: string): Promise<QuestionSelectionRun[]> {
    const rows = await this.db.questionSelectionRunRecord.findMany({ where: { schoolId } });
    return rows.map(mapPrismaSelectionRun);
  }
  async findByBlueprintVersionId(blueprintVersionId: string): Promise<QuestionSelectionRun[]> {
    const rows = await this.db.questionSelectionRunRecord.findMany({ where: { blueprintVersionId } });
    return rows.map(mapPrismaSelectionRun);
  }
  async findByDraftSetId(draftSetId: string): Promise<QuestionSelectionRun | null> {
    const row = await this.db.questionSelectionRunRecord.findFirst({ where: { draftSetId } });
    return row ? mapPrismaSelectionRun(row) : null;
  }
  async findByStatus(status: string): Promise<QuestionSelectionRun[]> {
    const rows = await this.db.questionSelectionRunRecord.findMany({ where: { status } });
    return rows.map(mapPrismaSelectionRun);
  }
  async update(item: QuestionSelectionRun): Promise<QuestionSelectionRun | null> {
    const existing = await this.db.questionSelectionRunRecord.findUnique({ where: { selectionRunId: item.selectionRunId } });
    if (!existing) return null;
    const row = await this.db.questionSelectionRunRecord.update({ where: { selectionRunId: item.selectionRunId }, data: { ...item, createdAt: new Date(item.createdAt), completedAt: item.completedAt ? new Date(item.completedAt) : null } });
    return mapPrismaSelectionRun(row);
  }
}

export class PrismaQuestionSelectionCandidateRepository implements QuestionSelectionCandidateRepository {
  constructor(private db: PrismaClient = prisma) {}
  async create(item: QuestionSelectionCandidate): Promise<QuestionSelectionCandidate> {
    const row = await this.db.questionSelectionCandidateRecord.create({ data: { ...item, createdAt: new Date(item.createdAt) } });
    return mapPrismaSelectionCandidate(row);
  }
  async findById(selectionCandidateId: string): Promise<QuestionSelectionCandidate | null> {
    const row = await this.db.questionSelectionCandidateRecord.findUnique({ where: { selectionCandidateId } });
    return row ? mapPrismaSelectionCandidate(row) : null;
  }
  async findBySelectionRunId(selectionRunId: string): Promise<QuestionSelectionCandidate[]> {
    const rows = await this.db.questionSelectionCandidateRecord.findMany({ where: { selectionRunId } });
    return rows.map(mapPrismaSelectionCandidate);
  }
  async findBySchoolId(schoolId: string): Promise<QuestionSelectionCandidate[]> {
    const rows = await this.db.questionSelectionCandidateRecord.findMany({ where: { schoolId } });
    return rows.map(mapPrismaSelectionCandidate);
  }
  async findByQuestionId(questionId: string): Promise<QuestionSelectionCandidate[]> {
    const rows = await this.db.questionSelectionCandidateRecord.findMany({ where: { questionId } });
    return rows.map(mapPrismaSelectionCandidate);
  }
  async findByEligible(eligible: boolean): Promise<QuestionSelectionCandidate[]> {
    const rows = await this.db.questionSelectionCandidateRecord.findMany({ where: { eligible } });
    return rows.map(mapPrismaSelectionCandidate);
  }
  async findBySelected(selected: boolean): Promise<QuestionSelectionCandidate[]> {
    const rows = await this.db.questionSelectionCandidateRecord.findMany({ where: { selected } });
    return rows.map(mapPrismaSelectionCandidate);
  }
}
