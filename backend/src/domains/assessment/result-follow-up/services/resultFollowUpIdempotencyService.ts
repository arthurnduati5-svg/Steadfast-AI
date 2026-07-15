import type { FollowUpIdempotencyRepository, FollowUpIdempotencyEntry } from '../contracts/resultFollowUpRepositoryContracts';
import crypto from 'crypto';

export class ResultFollowUpIdempotencyService {
  constructor(private repo: FollowUpIdempotencyRepository) {}

  async startOperation(schoolId: string, operation: string, idempotencyKey: string): Promise<FollowUpIdempotencyEntry | null> {
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
      await this.repo.updateStatus(entry.followUpIdempotencyId, 'completed', safeSummary);
    }
  }

  async failOperation(schoolId: string, operation: string, idempotencyKey: string, safeSummary: string): Promise<void> {
    const entry = await this.repo.getByKey(schoolId, operation, idempotencyKey);
    if (entry) {
      await this.repo.updateStatus(entry.followUpIdempotencyId, 'failed', safeSummary);
    }
  }

  async detectConflict(schoolId: string, operation: string, idempotencyKey: string): Promise<{ conflict: boolean; existing?: FollowUpIdempotencyEntry }> {
    const existing = await this.repo.getByKey(schoolId, operation, idempotencyKey);
    if (!existing) return { conflict: false };
    if (existing.status === 'completed') return { conflict: true, existing };
    return { conflict: false };
  }

  async getExistingOperation(schoolId: string, operation: string, idempotencyKey: string): Promise<FollowUpIdempotencyEntry | null> {
    return this.repo.getByKey(schoolId, operation, idempotencyKey);
  }

  async expireOperation(schoolId: string, operation: string, idempotencyKey: string): Promise<void> {
    const entry = await this.repo.getByKey(schoolId, operation, idempotencyKey);
    if (entry) {
      await this.repo.expire(entry.followUpIdempotencyId);
    }
  }
}
