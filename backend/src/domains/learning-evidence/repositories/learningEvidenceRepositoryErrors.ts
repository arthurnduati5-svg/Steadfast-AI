export class LearningEvidenceConcurrencyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LearningEvidenceConcurrencyError';
  }
}

export class LearningEvidenceIdempotencyConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LearningEvidenceIdempotencyConflictError';
  }
}
