import crypto from 'crypto';

export interface ProgressIdempotencyEntry {
  recoveryProgressIdempotencyId: string;
  schoolId: string;
  operation: string;
  idempotencyKey: string;
  requestHash: string;
  status: string;
  resourceType: string | null;
  resourceId: string | null;
  safeResultSummary: string | null;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
}

export interface ProgressIdempotencyRepository {
  create(input: {
    schoolId: string;
    operation: string;
    idempotencyKey: string;
    requestHash: string;
    status?: string;
    resourceType?: string | null;
    resourceId?: string | null;
    safeResultSummary?: string | null;
    expiresAt?: string;
  }): Promise<ProgressIdempotencyEntry>;
  getByKey(schoolId: string, operation: string, idempotencyKey: string): Promise<ProgressIdempotencyEntry | null>;
  updateStatus(recoveryProgressIdempotencyId: string, status: string, safeResultSummary?: string): Promise<ProgressIdempotencyEntry>;
  expire(recoveryProgressIdempotencyId: string): Promise<ProgressIdempotencyEntry>;
}

export class RecoveryProgressIdempotencyService {
  constructor(private repo: ProgressIdempotencyRepository) {}

  async startOperation(schoolId: string, operation: string, idempotencyKey: string): Promise<ProgressIdempotencyEntry | null> {
    const existing = await this.repo.getByKey(schoolId, operation, idempotencyKey);
    if (existing) return existing.status === 'in_progress' ? existing : null;
    const hash = crypto.createHash('sha256').update(`${schoolId}:${operation}:${idempotencyKey}`).digest('hex');
    return this.repo.create({
      schoolId, operation, idempotencyKey, requestHash: hash, status: 'in_progress',
    });
  }

  async completeOperation(schoolId: string, operation: string, idempotencyKey: string, _resourceType: string, _resourceId: string, safeSummary: string): Promise<void> {
    const entry = await this.repo.getByKey(schoolId, operation, idempotencyKey);
    if (entry) {
      await this.repo.updateStatus(entry.recoveryProgressIdempotencyId, 'completed', safeSummary);
    }
  }

  async failOperation(schoolId: string, operation: string, idempotencyKey: string, safeSummary: string): Promise<void> {
    const entry = await this.repo.getByKey(schoolId, operation, idempotencyKey);
    if (entry) {
      await this.repo.updateStatus(entry.recoveryProgressIdempotencyId, 'failed', safeSummary);
    }
  }

  async detectConflict(schoolId: string, operation: string, idempotencyKey: string): Promise<{ conflict: boolean; existing?: ProgressIdempotencyEntry }> {
    const existing = await this.repo.getByKey(schoolId, operation, idempotencyKey);
    if (!existing) return { conflict: false };
    if (existing.status === 'completed') return { conflict: true, existing };
    return { conflict: false };
  }

  async getExistingOperation(schoolId: string, operation: string, idempotencyKey: string): Promise<ProgressIdempotencyEntry | null> {
    return this.repo.getByKey(schoolId, operation, idempotencyKey);
  }

  async expireOperation(schoolId: string, operation: string, idempotencyKey: string): Promise<void> {
    const entry = await this.repo.getByKey(schoolId, operation, idempotencyKey);
    if (entry) {
      await this.repo.expire(entry.recoveryProgressIdempotencyId);
    }
  }
}
