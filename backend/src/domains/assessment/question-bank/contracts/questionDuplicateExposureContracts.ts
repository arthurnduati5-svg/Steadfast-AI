export type DuplicateCandidateStatus =
  | 'suspected'
  | 'confirmed_duplicate'
  | 'not_duplicate'
  | 'linked_variant'
  | 'blocked';

export interface QuestionDuplicateCandidate {
  duplicateCandidateId: string;
  schoolId: string;
  sourceQuestionVersionId: string;
  candidateQuestionVersionId: string;
  contentHash: string;
  similarityReason: string;
  status: DuplicateCandidateStatus;
  createdAt: string;
  resolvedAt: string | null;
  resolvedByActorId: string | null;
  resolutionReason: string | null;
}

export type ExposureHoldType =
  | 'leak_suspected'
  | 'quality_issue'
  | 'curriculum_invalid'
  | 'source_rights_expired'
  | 'policy_block';

export type ExposureHoldStatus =
  | 'active'
  | 'released'
  | 'superseded';

export interface QuestionExposureHold {
  exposureHoldId: string;
  schoolId: string;
  questionId: string;
  questionVersionId: string;
  holdType: ExposureHoldType;
  status: ExposureHoldStatus;
  reasonCode: string;
  safeSummary: string;
  createdByActorId: string;
  createdAt: string;
  releasedByActorId: string | null;
  releasedAt: string | null;
  releaseReason: string | null;
}

export interface QuestionDuplicateCandidateRepository {
  create(candidate: QuestionDuplicateCandidate): Promise<QuestionDuplicateCandidate>;
  findById(duplicateCandidateId: string): Promise<QuestionDuplicateCandidate | null>;
  findByContentHash(schoolId: string, contentHash: string): Promise<QuestionDuplicateCandidate[]>;
  findBySourceQuestionVersionId(questionVersionId: string): Promise<QuestionDuplicateCandidate[]>;
  updateStatus(duplicateCandidateId: string, status: DuplicateCandidateStatus, resolvedAt: string | null, resolvedByActorId: string | null, resolutionReason: string | null): Promise<QuestionDuplicateCandidate | null>;
}

export interface QuestionExposureHoldRepository {
  create(hold: QuestionExposureHold): Promise<QuestionExposureHold>;
  findById(exposureHoldId: string): Promise<QuestionExposureHold | null>;
  findByQuestionId(questionId: string): Promise<QuestionExposureHold[]>;
  findActiveByQuestionId(questionId: string): Promise<QuestionExposureHold[]>;
  releaseHold(exposureHoldId: string, releasedByActorId: string, releaseReason: string, releasedAt: string): Promise<QuestionExposureHold | null>;
}
