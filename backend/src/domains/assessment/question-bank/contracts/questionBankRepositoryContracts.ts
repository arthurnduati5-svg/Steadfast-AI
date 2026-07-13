import type { QuestionBankItem } from './questionBankItemContracts';
import type { QuestionVersion, QuestionPartVersion, QuestionAssetVersion } from './questionVersionContracts';
import type { AnswerKeyVersion, RubricVersion } from './answerKeyAndRubricContracts';
import type { QuestionObjectiveMapping } from './questionObjectiveMappingContracts';
import type { QuestionSourceRecord } from './questionSourceRecordContracts';
import type { QuestionCurriculumValidity, QuestionUsageEligibility, ContentSafetyReview } from './questionGovernanceContracts';

export interface QuestionBankItemRepository {
  create(item: QuestionBankItem): Promise<QuestionBankItem>;
  findById(questionId: string): Promise<QuestionBankItem | null>;
  findBySchoolId(schoolId: string): Promise<QuestionBankItem[]>;
  updateStatus(questionId: string, status: QuestionBankItem['status'], updatedAt: string): Promise<QuestionBankItem | null>;
  updateCurrentVersion(questionId: string, currentVersionId: string, updatedAt: string): Promise<QuestionBankItem | null>;
  findBySubjectId(schoolId: string, subjectId: string): Promise<QuestionBankItem[]>;
}

export interface QuestionVersionRepository {
  create(version: QuestionVersion): Promise<QuestionVersion>;
  findById(questionVersionId: string): Promise<QuestionVersion | null>;
  findByQuestionId(questionId: string): Promise<QuestionVersion[]>;
  findCurrentByQuestionId(questionId: string): Promise<QuestionVersion | null>;
  updateStatus(questionVersionId: string, status: QuestionVersion['status']): Promise<QuestionVersion | null>;
}

export interface QuestionPartVersionRepository {
  create(part: QuestionPartVersion): Promise<QuestionPartVersion>;
  findByQuestionVersionId(questionVersionId: string): Promise<QuestionPartVersion[]>;
}

export interface QuestionAssetVersionRepository {
  create(asset: QuestionAssetVersion): Promise<QuestionAssetVersion>;
  findByQuestionVersionId(questionVersionId: string): Promise<QuestionAssetVersion[]>;
}

export interface AnswerKeyVersionRepository {
  create(answerKey: AnswerKeyVersion): Promise<AnswerKeyVersion>;
  findByQuestionVersionId(questionVersionId: string): Promise<AnswerKeyVersion | null>;
  updateStatus(answerKeyVersionId: string, status: AnswerKeyVersion['status']): Promise<AnswerKeyVersion | null>;
}

export interface RubricVersionRepository {
  create(rubric: RubricVersion): Promise<RubricVersion>;
  findByQuestionVersionId(questionVersionId: string): Promise<RubricVersion | null>;
  updateStatus(rubricVersionId: string, status: RubricVersion['status']): Promise<RubricVersion | null>;
}

export interface QuestionObjectiveMappingRepository {
  create(mapping: QuestionObjectiveMapping): Promise<QuestionObjectiveMapping>;
  findByQuestionVersionId(questionVersionId: string): Promise<QuestionObjectiveMapping[]>;
  findPrimaryByQuestionVersionId(questionVersionId: string): Promise<QuestionObjectiveMapping | null>;
}

export interface QuestionSourceRecordRepository {
  create(record: QuestionSourceRecord): Promise<QuestionSourceRecord>;
  findByQuestionId(questionId: string): Promise<QuestionSourceRecord[]>;
}

export interface QuestionGovernanceRepository {
  saveCurriculumValidity(validity: QuestionCurriculumValidity): Promise<QuestionCurriculumValidity>;
  findCurriculumValidity(questionVersionId: string): Promise<QuestionCurriculumValidity | null>;
  saveUsageEligibility(eligibility: QuestionUsageEligibility): Promise<QuestionUsageEligibility>;
  findUsageEligibility(questionVersionId: string, usageMode: string): Promise<QuestionUsageEligibility | null>;
  saveContentSafetyReview(review: ContentSafetyReview): Promise<ContentSafetyReview>;
  findContentSafetyReview(questionVersionId: string): Promise<ContentSafetyReview | null>;
}
