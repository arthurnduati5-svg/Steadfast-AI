export type IdempotencyRecordStatus =
  | 'completed'
  | 'in_progress'
  | 'failed'
  | 'conflict';

export interface AssessmentIdempotencyRecord {
  idempotencyKey: string;
  schoolId: string;
  actorId: string;
  commandType: string;
  commandFingerprint: string;
  status: IdempotencyRecordStatus;
  safeResultSummary: string;
  createdAt: string;
  expiresAt: string;
}

export interface AssessmentIdempotencyResult {
  status: 'accepted' | 'conflict' | 'expired' | 'missing';
  existingRecord?: AssessmentIdempotencyRecord;
  safeMessage: string;
  reasonCode: string;
}

export interface AssessmentIdempotencyRepository {
  findByIdempotencyKey(
    idempotencyKey: string,
    schoolId: string,
    actorId: string,
  ): Promise<AssessmentIdempotencyRecord | undefined>;
  create(d: AssessmentIdempotencyRecord): Promise<void>;
  updateStatus(
    idempotencyKey: string,
    status: IdempotencyRecordStatus,
    safeResultSummary: string,
  ): Promise<void>;
}
