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

import type { QuestionApprovalRequest, QuestionApprovalRecord, ApprovalRequestStatus, ApprovalDecision } from '../contracts/questionApprovalContracts';
import type { QuestionApprovalRequestRepository, QuestionApprovalRecordRepository } from '../contracts/questionApprovalContracts';
import type { QuestionIngestionBatch, QuestionIngestionCandidate, IngestionBatchStatus, IngestionCandidateStatus } from '../contracts/questionIngestionContracts';
import type { QuestionIngestionBatchRepository, QuestionIngestionCandidateRepository } from '../contracts/questionIngestionContracts';
import type { QuestionDuplicateCandidate, QuestionExposureHold, DuplicateCandidateStatus } from '../contracts/questionDuplicateExposureContracts';
import type { QuestionDuplicateCandidateRepository, QuestionExposureHoldRepository } from '../contracts/questionDuplicateExposureContracts';

export class InMemoryQuestionApprovalRequestRepository implements QuestionApprovalRequestRepository {
  private requests = new Map<string, QuestionApprovalRequest>();

  async create(request: QuestionApprovalRequest): Promise<QuestionApprovalRequest> {
    this.requests.set(request.approvalRequestId, { ...request });
    return request;
  }

  async findById(approvalRequestId: string): Promise<QuestionApprovalRequest | null> {
    return this.requests.get(approvalRequestId) ?? null;
  }

  async findBySchoolId(schoolId: string): Promise<QuestionApprovalRequest[]> {
    return Array.from(this.requests.values()).filter(r => r.schoolId === schoolId);
  }

  async findByQuestionVersionId(questionVersionId: string): Promise<QuestionApprovalRequest[]> {
    return Array.from(this.requests.values()).filter(r => r.questionVersionId === questionVersionId);
  }

  async findPendingBySchoolId(schoolId: string): Promise<QuestionApprovalRequest[]> {
    return Array.from(this.requests.values()).filter(r => r.schoolId === schoolId && r.status === 'pending');
  }

  async updateStatus(approvalRequestId: string, status: ApprovalRequestStatus, closedAt: string | null): Promise<QuestionApprovalRequest | null> {
    const req = this.requests.get(approvalRequestId);
    if (!req) return null;
    req.status = status;
    req.closedAt = closedAt;
    return { ...req };
  }

  reset(): void {
    this.requests.clear();
  }
}

export class InMemoryQuestionApprovalRecordRepository implements QuestionApprovalRecordRepository {
  private records = new Map<string, QuestionApprovalRecord>();

  async create(record: QuestionApprovalRecord): Promise<QuestionApprovalRecord> {
    this.records.set(record.approvalRecordId, { ...record });
    return record;
  }

  async findByApprovalRequestId(approvalRequestId: string): Promise<QuestionApprovalRecord[]> {
    return Array.from(this.records.values()).filter(r => r.approvalRequestId === approvalRequestId);
  }

  async findByQuestionVersionId(questionVersionId: string): Promise<QuestionApprovalRecord[]> {
    return Array.from(this.records.values()).filter(r => r.questionVersionId === questionVersionId);
  }

  reset(): void {
    this.records.clear();
  }
}

export class InMemoryQuestionIngestionBatchRepository implements QuestionIngestionBatchRepository {
  private batches = new Map<string, QuestionIngestionBatch>();

  async create(batch: QuestionIngestionBatch): Promise<QuestionIngestionBatch> {
    this.batches.set(batch.ingestionBatchId, { ...batch });
    return batch;
  }

  async findById(ingestionBatchId: string): Promise<QuestionIngestionBatch | null> {
    return this.batches.get(ingestionBatchId) ?? null;
  }

  async findBySchoolId(schoolId: string): Promise<QuestionIngestionBatch[]> {
    return Array.from(this.batches.values()).filter(b => b.schoolId === schoolId);
  }

  async updateStatus(ingestionBatchId: string, status: IngestionBatchStatus, completedAt: string | null): Promise<QuestionIngestionBatch | null> {
    const batch = this.batches.get(ingestionBatchId);
    if (!batch) return null;
    batch.status = status;
    batch.completedAt = completedAt;
    return { ...batch };
  }

  async updateCounts(ingestionBatchId: string, candidateCount: number, acceptedCount: number, rejectedCount: number, warningCount: number): Promise<QuestionIngestionBatch | null> {
    const batch = this.batches.get(ingestionBatchId);
    if (!batch) return null;
    batch.candidateCount = candidateCount;
    batch.acceptedCount = acceptedCount;
    batch.rejectedCount = rejectedCount;
    batch.warningCount = warningCount;
    return { ...batch };
  }

  reset(): void {
    this.batches.clear();
  }
}

export class InMemoryQuestionIngestionCandidateRepository implements QuestionIngestionCandidateRepository {
  private candidates = new Map<string, QuestionIngestionCandidate>();

  async create(candidate: QuestionIngestionCandidate): Promise<QuestionIngestionCandidate> {
    this.candidates.set(candidate.candidateId, { ...candidate });
    return candidate;
  }

  async findById(candidateId: string): Promise<QuestionIngestionCandidate | null> {
    return this.candidates.get(candidateId) ?? null;
  }

  async findByBatchId(ingestionBatchId: string): Promise<QuestionIngestionCandidate[]> {
    return Array.from(this.candidates.values()).filter(c => c.ingestionBatchId === ingestionBatchId);
  }

  async findBySchoolId(schoolId: string): Promise<QuestionIngestionCandidate[]> {
    return Array.from(this.candidates.values()).filter(c => c.schoolId === schoolId);
  }

  async findByContentHash(schoolId: string, contentHash: string): Promise<QuestionIngestionCandidate[]> {
    return Array.from(this.candidates.values()).filter(c => c.schoolId === schoolId && c.contentHash === contentHash);
  }

  async updateStatus(candidateId: string, status: IngestionCandidateStatus): Promise<QuestionIngestionCandidate | null> {
    const c = this.candidates.get(candidateId);
    if (!c) return null;
    c.status = status;
    return { ...c };
  }

  async updateAcceptedRef(candidateId: string, acceptedQuestionId: string, acceptedQuestionVersionId: string): Promise<QuestionIngestionCandidate | null> {
    const c = this.candidates.get(candidateId);
    if (!c) return null;
    c.acceptedQuestionId = acceptedQuestionId;
    c.acceptedQuestionVersionId = acceptedQuestionVersionId;
    c.status = 'accepted';
    return { ...c };
  }

  async rejectCandidate(candidateId: string, rejectedReasonCode: string): Promise<QuestionIngestionCandidate | null> {
    const c = this.candidates.get(candidateId);
    if (!c) return null;
    c.rejectedReasonCode = rejectedReasonCode;
    c.status = 'rejected';
    return { ...c };
  }

  reset(): void {
    this.candidates.clear();
  }
}

export class InMemoryQuestionDuplicateCandidateRepository implements QuestionDuplicateCandidateRepository {
  private candidates = new Map<string, QuestionDuplicateCandidate>();

  async create(candidate: QuestionDuplicateCandidate): Promise<QuestionDuplicateCandidate> {
    this.candidates.set(candidate.duplicateCandidateId, { ...candidate });
    return candidate;
  }

  async findById(duplicateCandidateId: string): Promise<QuestionDuplicateCandidate | null> {
    return this.candidates.get(duplicateCandidateId) ?? null;
  }

  async findByContentHash(schoolId: string, contentHash: string): Promise<QuestionDuplicateCandidate[]> {
    return Array.from(this.candidates.values()).filter(c => c.schoolId === schoolId && c.contentHash === contentHash);
  }

  async findBySourceQuestionVersionId(questionVersionId: string): Promise<QuestionDuplicateCandidate[]> {
    return Array.from(this.candidates.values()).filter(c => c.sourceQuestionVersionId === questionVersionId);
  }

  async updateStatus(duplicateCandidateId: string, status: DuplicateCandidateStatus, resolvedAt: string | null, resolvedByActorId: string | null, resolutionReason: string | null): Promise<QuestionDuplicateCandidate | null> {
    const c = this.candidates.get(duplicateCandidateId);
    if (!c) return null;
    c.status = status;
    c.resolvedAt = resolvedAt;
    c.resolvedByActorId = resolvedByActorId;
    c.resolutionReason = resolutionReason;
    return { ...c };
  }

  reset(): void {
    this.candidates.clear();
  }
}

export class InMemoryQuestionExposureHoldRepository implements QuestionExposureHoldRepository {
  private holds = new Map<string, QuestionExposureHold>();

  async create(hold: QuestionExposureHold): Promise<QuestionExposureHold> {
    this.holds.set(hold.exposureHoldId, { ...hold });
    return hold;
  }

  async findById(exposureHoldId: string): Promise<QuestionExposureHold | null> {
    return this.holds.get(exposureHoldId) ?? null;
  }

  async findByQuestionId(questionId: string): Promise<QuestionExposureHold[]> {
    return Array.from(this.holds.values()).filter(h => h.questionId === questionId);
  }

  async findActiveByQuestionId(questionId: string): Promise<QuestionExposureHold[]> {
    return Array.from(this.holds.values()).filter(h => h.questionId === questionId && h.status === 'active');
  }

  async releaseHold(exposureHoldId: string, releasedByActorId: string, releaseReason: string, releasedAt: string): Promise<QuestionExposureHold | null> {
    const hold = this.holds.get(exposureHoldId);
    if (!hold) return null;
    hold.status = 'released';
    hold.releasedByActorId = releasedByActorId;
    hold.releaseReason = releaseReason;
    hold.releasedAt = releasedAt;
    return { ...hold };
  }

  reset(): void {
    this.holds.clear();
  }
}
