import type { QuestionBankItem } from '../contracts/questionBankItemContracts';
import type { QuestionVersion, QuestionPartVersion, QuestionAssetVersion } from '../contracts/questionVersionContracts';
import type { AnswerKeyVersion, RubricVersion } from '../contracts/answerKeyAndRubricContracts';
import type { QuestionObjectiveMapping } from '../contracts/questionObjectiveMappingContracts';
import type { QuestionSourceRecord } from '../contracts/questionSourceRecordContracts';
import type { QuestionCurriculumValidity, QuestionUsageEligibility, ContentSafetyReview } from '../contracts/questionGovernanceContracts';
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

export class InMemoryQuestionBankItemRepository implements QuestionBankItemRepository {
  private items = new Map<string, QuestionBankItem>();

  async create(item: QuestionBankItem): Promise<QuestionBankItem> {
    this.items.set(item.questionId, { ...item });
    return item;
  }

  async findById(questionId: string): Promise<QuestionBankItem | null> {
    return this.items.get(questionId) ?? null;
  }

  async findBySchoolId(schoolId: string): Promise<QuestionBankItem[]> {
    return Array.from(this.items.values()).filter(i => i.schoolId === schoolId);
  }

  async updateStatus(questionId: string, status: QuestionBankItem['status'], updatedAt: string): Promise<QuestionBankItem | null> {
    const item = this.items.get(questionId);
    if (!item) return null;
    item.status = status;
    item.updatedAt = updatedAt;
    return { ...item };
  }

  async updateCurrentVersion(questionId: string, currentVersionId: string, updatedAt: string): Promise<QuestionBankItem | null> {
    const item = this.items.get(questionId);
    if (!item) return null;
    item.currentVersionId = currentVersionId;
    item.updatedAt = updatedAt;
    return { ...item };
  }

  async findBySubjectId(schoolId: string, subjectId: string): Promise<QuestionBankItem[]> {
    return Array.from(this.items.values()).filter(i => i.schoolId === schoolId && i.subjectId === subjectId);
  }

  reset(): void {
    this.items.clear();
  }
}

export class InMemoryQuestionVersionRepository implements QuestionVersionRepository {
  private versions = new Map<string, QuestionVersion>();

  async create(version: QuestionVersion): Promise<QuestionVersion> {
    this.versions.set(version.questionVersionId, { ...version });
    return version;
  }

  async findById(questionVersionId: string): Promise<QuestionVersion | null> {
    return this.versions.get(questionVersionId) ?? null;
  }

  async findByQuestionId(questionId: string): Promise<QuestionVersion[]> {
    return Array.from(this.versions.values()).filter(v => v.questionId === questionId);
  }

  async findCurrentByQuestionId(questionId: string): Promise<QuestionVersion | null> {
    const all = Array.from(this.versions.values())
      .filter(v => v.questionId === questionId)
      .sort((a, b) => b.versionNumber - a.versionNumber);
    return all[0] ?? null;
  }

  async updateStatus(questionVersionId: string, status: QuestionVersion['status']): Promise<QuestionVersion | null> {
    const version = this.versions.get(questionVersionId);
    if (!version) return null;
    version.status = status;
    return { ...version };
  }

  reset(): void {
    this.versions.clear();
  }
}

export class InMemoryQuestionPartVersionRepository implements QuestionPartVersionRepository {
  private parts = new Map<string, QuestionPartVersion>();

  async create(part: QuestionPartVersion): Promise<QuestionPartVersion> {
    this.parts.set(part.questionPartVersionId, { ...part });
    return part;
  }

  async findByQuestionVersionId(questionVersionId: string): Promise<QuestionPartVersion[]> {
    return Array.from(this.parts.values())
      .filter(p => p.questionVersionId === questionVersionId)
      .sort((a, b) => a.partOrder - b.partOrder);
  }

  reset(): void {
    this.parts.clear();
  }
}

export class InMemoryQuestionAssetVersionRepository implements QuestionAssetVersionRepository {
  private assets = new Map<string, QuestionAssetVersion>();

  async create(asset: QuestionAssetVersion): Promise<QuestionAssetVersion> {
    this.assets.set(asset.assetVersionId, { ...asset });
    return asset;
  }

  async findByQuestionVersionId(questionVersionId: string): Promise<QuestionAssetVersion[]> {
    return Array.from(this.assets.values()).filter(a => a.questionVersionId === questionVersionId);
  }

  reset(): void {
    this.assets.clear();
  }
}

export class InMemoryAnswerKeyVersionRepository implements AnswerKeyVersionRepository {
  private answerKeys = new Map<string, AnswerKeyVersion>();

  async create(answerKey: AnswerKeyVersion): Promise<AnswerKeyVersion> {
    this.answerKeys.set(answerKey.answerKeyVersionId, { ...answerKey });
    return answerKey;
  }

  async findByQuestionVersionId(questionVersionId: string): Promise<AnswerKeyVersion | null> {
    return Array.from(this.answerKeys.values())
      .find(k => k.questionVersionId === questionVersionId) ?? null;
  }

  async updateStatus(answerKeyVersionId: string, status: AnswerKeyVersion['status']): Promise<AnswerKeyVersion | null> {
    const key = this.answerKeys.get(answerKeyVersionId);
    if (!key) return null;
    key.status = status;
    return { ...key };
  }

  reset(): void {
    this.answerKeys.clear();
  }
}

export class InMemoryRubricVersionRepository implements RubricVersionRepository {
  private rubrics = new Map<string, RubricVersion>();

  async create(rubric: RubricVersion): Promise<RubricVersion> {
    this.rubrics.set(rubric.rubricVersionId, { ...rubric });
    return rubric;
  }

  async findByQuestionVersionId(questionVersionId: string): Promise<RubricVersion | null> {
    return Array.from(this.rubrics.values())
      .find(r => r.questionVersionId === questionVersionId) ?? null;
  }

  async updateStatus(rubricVersionId: string, status: RubricVersion['status']): Promise<RubricVersion | null> {
    const rubric = this.rubrics.get(rubricVersionId);
    if (!rubric) return null;
    rubric.status = status;
    return { ...rubric };
  }

  reset(): void {
    this.rubrics.clear();
  }
}

export class InMemoryQuestionObjectiveMappingRepository implements QuestionObjectiveMappingRepository {
  private mappings = new Map<string, QuestionObjectiveMapping>();

  async create(mapping: QuestionObjectiveMapping): Promise<QuestionObjectiveMapping> {
    this.mappings.set(mapping.mappingId, { ...mapping });
    return mapping;
  }

  async findByQuestionVersionId(questionVersionId: string): Promise<QuestionObjectiveMapping[]> {
    return Array.from(this.mappings.values()).filter(m => m.questionVersionId === questionVersionId);
  }

  async findPrimaryByQuestionVersionId(questionVersionId: string): Promise<QuestionObjectiveMapping | null> {
    return Array.from(this.mappings.values())
      .find(m => m.questionVersionId === questionVersionId && m.mappingStrength === 'primary') ?? null;
  }

  reset(): void {
    this.mappings.clear();
  }
}

export class InMemoryQuestionSourceRecordRepository implements QuestionSourceRecordRepository {
  private records = new Map<string, QuestionSourceRecord>();

  async create(record: QuestionSourceRecord): Promise<QuestionSourceRecord> {
    this.records.set(record.sourceRecordId, { ...record });
    return record;
  }

  async findByQuestionId(questionId: string): Promise<QuestionSourceRecord[]> {
    return Array.from(this.records.values()).filter(r => r.questionId === questionId);
  }

  reset(): void {
    this.records.clear();
  }
}

export class InMemoryQuestionGovernanceRepository implements QuestionGovernanceRepository {
  private validityRecords = new Map<string, QuestionCurriculumValidity>();
  private eligibilityRecords = new Map<string, QuestionUsageEligibility>();
  private safetyReviews = new Map<string, ContentSafetyReview>();

  async saveCurriculumValidity(validity: QuestionCurriculumValidity): Promise<QuestionCurriculumValidity> {
    this.validityRecords.set(validity.questionVersionId, { ...validity });
    return validity;
  }

  async findCurriculumValidity(questionVersionId: string): Promise<QuestionCurriculumValidity | null> {
    return this.validityRecords.get(questionVersionId) ?? null;
  }

  async saveUsageEligibility(eligibility: QuestionUsageEligibility): Promise<QuestionUsageEligibility> {
    const key = `${eligibility.questionVersionId}:${eligibility.usageMode}`;
    this.eligibilityRecords.set(key, { ...eligibility });
    return eligibility;
  }

  async findUsageEligibility(questionVersionId: string, usageMode: string): Promise<QuestionUsageEligibility | null> {
    const key = `${questionVersionId}:${usageMode}`;
    return this.eligibilityRecords.get(key) ?? null;
  }

  async saveContentSafetyReview(review: ContentSafetyReview): Promise<ContentSafetyReview> {
    this.safetyReviews.set(review.questionVersionId, { ...review });
    return review;
  }

  async findContentSafetyReview(questionVersionId: string): Promise<ContentSafetyReview | null> {
    return this.safetyReviews.get(questionVersionId) ?? null;
  }

  reset(): void {
    this.validityRecords.clear();
    this.eligibilityRecords.clear();
    this.safetyReviews.clear();
  }
}
