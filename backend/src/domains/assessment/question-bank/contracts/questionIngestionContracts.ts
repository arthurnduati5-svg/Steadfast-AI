export type IngestionBatchStatus =
  | 'draft'
  | 'validating'
  | 'ready_for_review'
  | 'partially_accepted'
  | 'accepted'
  | 'rejected'
  | 'blocked'
  | 'failed'
  | 'cancelled';

export interface QuestionIngestionBatch {
  ingestionBatchId: string;
  schoolId: string;
  sourceType: string;
  approvedSourceId: string | null;
  importBatchRef: string | null;
  status: IngestionBatchStatus;
  createdByActorId: string;
  createdByRole: string;
  candidateCount: number;
  acceptedCount: number;
  rejectedCount: number;
  warningCount: number;
  safeSummary: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export type IngestionCandidateStatus =
  | 'draft'
  | 'needs_correction'
  | 'ready'
  | 'accepted'
  | 'rejected'
  | 'blocked'
  | 'duplicate_suspected';

export type IngestionCandidateType =
  | 'manual_seed'
  | 'teacher_import'
  | 'approved_source_import'
  | 'artifact_extract_manual'
  | 'legacy_seed';

export interface QuestionIngestionCandidate {
  candidateId: string;
  ingestionBatchId: string;
  schoolId: string;
  status: IngestionCandidateStatus;
  candidateType: IngestionCandidateType;
  stemSafeText: string;
  questionType: string;
  subjectId: string;
  topicId: string;
  skillId: string;
  curriculumVersionId: string;
  primaryObjectiveId: string;
  approvedSourceId: string | null;
  sourceRef: string;
  contentHash: string;
  warningsJson: string[];
  safeMetadataJson: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  acceptedQuestionId: string | null;
  acceptedQuestionVersionId: string | null;
  rejectedReasonCode: string | null;
}

export interface QuestionIngestionBatchRepository {
  create(batch: QuestionIngestionBatch): Promise<QuestionIngestionBatch>;
  findById(ingestionBatchId: string): Promise<QuestionIngestionBatch | null>;
  findBySchoolId(schoolId: string): Promise<QuestionIngestionBatch[]>;
  updateStatus(ingestionBatchId: string, status: IngestionBatchStatus, completedAt: string | null): Promise<QuestionIngestionBatch | null>;
  updateCounts(ingestionBatchId: string, candidateCount: number, acceptedCount: number, rejectedCount: number, warningCount: number): Promise<QuestionIngestionBatch | null>;
}

export interface QuestionIngestionCandidateRepository {
  create(candidate: QuestionIngestionCandidate): Promise<QuestionIngestionCandidate>;
  findById(candidateId: string): Promise<QuestionIngestionCandidate | null>;
  findByBatchId(ingestionBatchId: string): Promise<QuestionIngestionCandidate[]>;
  findBySchoolId(schoolId: string): Promise<QuestionIngestionCandidate[]>;
  findByContentHash(schoolId: string, contentHash: string): Promise<QuestionIngestionCandidate[]>;
  updateStatus(candidateId: string, status: IngestionCandidateStatus): Promise<QuestionIngestionCandidate | null>;
  updateAcceptedRef(candidateId: string, acceptedQuestionId: string, acceptedQuestionVersionId: string): Promise<QuestionIngestionCandidate | null>;
  rejectCandidate(candidateId: string, rejectedReasonCode: string): Promise<QuestionIngestionCandidate | null>;
}
