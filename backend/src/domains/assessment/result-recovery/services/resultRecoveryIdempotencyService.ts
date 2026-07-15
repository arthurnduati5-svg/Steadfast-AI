import crypto from 'crypto';
import { randomUUID } from 'crypto';

export interface RecoveryIdempotencyEntry {
  resultRecoveryIdempotencyId: string;
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

export interface RecoveryIdempotencyRepository {
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
  }): Promise<RecoveryIdempotencyEntry>;
  getByKey(schoolId: string, operation: string, idempotencyKey: string): Promise<RecoveryIdempotencyEntry | null>;
  updateStatus(recoveryIdempotencyId: string, status: string, safeResultSummary?: string): Promise<RecoveryIdempotencyEntry>;
  expire(recoveryIdempotencyId: string): Promise<RecoveryIdempotencyEntry>;
}

export class ResultRecoveryIdempotencyService {
  constructor(private repo: RecoveryIdempotencyRepository) {}

  async startOperation(schoolId: string, operation: string, idempotencyKey: string): Promise<RecoveryIdempotencyEntry | null> {
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
      await this.repo.updateStatus(entry.resultRecoveryIdempotencyId, 'completed', safeSummary);
    }
  }

  async failOperation(schoolId: string, operation: string, idempotencyKey: string, safeSummary: string): Promise<void> {
    const entry = await this.repo.getByKey(schoolId, operation, idempotencyKey);
    if (entry) {
      await this.repo.updateStatus(entry.resultRecoveryIdempotencyId, 'failed', safeSummary);
    }
  }

  async detectConflict(schoolId: string, operation: string, idempotencyKey: string): Promise<{ conflict: boolean; existing?: RecoveryIdempotencyEntry }> {
    const existing = await this.repo.getByKey(schoolId, operation, idempotencyKey);
    if (!existing) return { conflict: false };
    if (existing.status === 'completed') return { conflict: true, existing };
    return { conflict: false };
  }

  async getExistingOperation(schoolId: string, operation: string, idempotencyKey: string): Promise<RecoveryIdempotencyEntry | null> {
    return this.repo.getByKey(schoolId, operation, idempotencyKey);
  }

  async expireOperation(schoolId: string, operation: string, idempotencyKey: string): Promise<void> {
    const entry = await this.repo.getByKey(schoolId, operation, idempotencyKey);
    if (entry) {
      await this.repo.expire(entry.resultRecoveryIdempotencyId);
    }
  }
}
