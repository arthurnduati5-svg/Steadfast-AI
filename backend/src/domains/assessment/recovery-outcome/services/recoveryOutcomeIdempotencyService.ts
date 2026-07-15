import crypto from 'crypto';
import type { RecoveryOutcomeIdempotencyEntry } from '../contracts/recoveryOutcomeContracts';

export interface OutcomeIdempotencyRepository {
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
  }): Promise<RecoveryOutcomeIdempotencyEntry>;
  getByKey(schoolId: string, operation: string, idempotencyKey: string): Promise<RecoveryOutcomeIdempotencyEntry | null>;
  updateStatus(recoveryOutcomeIdempotencyId: string, status: string, safeResultSummary?: string): Promise<RecoveryOutcomeIdempotencyEntry>;
  expire(recoveryOutcomeIdempotencyId: string): Promise<RecoveryOutcomeIdempotencyEntry>;
}

export class RecoveryOutcomeIdempotencyService {
  constructor(private repo: OutcomeIdempotencyRepository) {}

  async checkIdempotency(schoolId: string, operation: string, idempotencyKey: string): Promise<RecoveryOutcomeIdempotencyEntry | null> {
    const existing = await this.repo.getByKey(schoolId, operation, idempotencyKey);
    if (existing && existing.status === 'completed') return existing;
    return null;
  }

  async createIdempotencyEntry(schoolId: string, operation: string, idempotencyKey: string, requestHash: string, resourceType?: string, resourceId?: string): Promise<RecoveryOutcomeIdempotencyEntry> {
    return this.repo.create({
      schoolId, operation, idempotencyKey, requestHash, status: 'in_progress',
      resourceType: resourceType || null, resourceId: resourceId || null,
    });
  }

  async markCompleted(recoveryOutcomeIdempotencyId: string, safeResultSummary: string): Promise<void> {
    await this.repo.updateStatus(recoveryOutcomeIdempotencyId, 'completed', safeResultSummary);
  }

  async markFailed(recoveryOutcomeIdempotencyId: string, reason: string): Promise<void> {
    await this.repo.updateStatus(recoveryOutcomeIdempotencyId, 'failed', reason);
  }

  async detectConflict(schoolId: string, operation: string, idempotencyKey: string): Promise<{ conflict: boolean; existing?: RecoveryOutcomeIdempotencyEntry }> {
    const existing = await this.repo.getByKey(schoolId, operation, idempotencyKey);
    if (!existing) return { conflict: false };
    if (existing.status === 'completed') return { conflict: true, existing };
    return { conflict: false };
  }

  async startOperation(schoolId: string, operation: string, idempotencyKey: string): Promise<RecoveryOutcomeIdempotencyEntry> {
    const hash = crypto.createHash('sha256').update(`${schoolId}:${operation}:${idempotencyKey}`).digest('hex');
    return this.repo.create({
      schoolId, operation, idempotencyKey, requestHash: hash, status: 'in_progress',
    });
  }

  async completeOperation(schoolId: string, operation: string, idempotencyKey: string, _resourceType: string, _resourceId: string, safeSummary: string): Promise<void> {
    const entry = await this.repo.getByKey(schoolId, operation, idempotencyKey);
    if (entry) {
      await this.repo.updateStatus(entry.recoveryOutcomeIdempotencyId, 'completed', safeSummary);
    }
  }

  async failOperation(schoolId: string, operation: string, idempotencyKey: string, safeSummary: string): Promise<void> {
    const entry = await this.repo.getByKey(schoolId, operation, idempotencyKey);
    if (entry) {
      await this.repo.updateStatus(entry.recoveryOutcomeIdempotencyId, 'failed', safeSummary);
    }
  }
}
