import type { ResultReleaseIdempotencyRepository, ResultReleaseIdempotencyEntry } from '../contracts/resultReleaseRepositoryContracts';
import { randomUUID } from 'crypto';

export class ResultReleaseIdempotencyService {
  constructor(private idempotencyRepo: ResultReleaseIdempotencyRepository) {}

  private async makeEntry(
    schoolId: string,
    operation: string,
    idempotencyKey: string,
    resourceType?: string,
  ): Promise<ResultReleaseIdempotencyEntry> {
    const hash = randomUUID();
    return this.idempotencyRepo.create({
      schoolId,
      operation,
      idempotencyKey,
      requestHash: hash,
      status: 'in_progress',
      resourceType,
    });
  }

  async startOperation(
    schoolId: string,
    operation: string,
    idempotencyKey: string,
    resourceType?: string,
  ): Promise<string | null> {
    try {
      const entry = await this.makeEntry(schoolId, operation, idempotencyKey, resourceType);
      return entry.resultReleaseIdempotencyId ?? null;
    } catch {
      const existing = await this.idempotencyRepo.getByKey(schoolId, operation, idempotencyKey);
      if (existing) return existing.resultReleaseIdempotencyId ?? null;
      return null;
    }
  }

  async detectConflict(
    schoolId: string,
    operation: string,
    idempotencyKey: string,
  ): Promise<ResultReleaseIdempotencyEntry | null> {
    const existing = await this.idempotencyRepo.getByKey(schoolId, operation, idempotencyKey);
    if (!existing) return null;
    if (existing.status === 'completed' || existing.status === 'in_progress') return existing;
    return null;
  }

  async getExistingOperation(entryId: string): Promise<ResultReleaseIdempotencyEntry | null> {
    return this.idempotencyRepo.updateStatus(entryId, 'in_progress');
  }

  async completeOperation(
    entryId: string,
    resourceId: string,
    safeResultSummary?: string,
  ): Promise<void> {
    await this.idempotencyRepo.updateStatus(entryId, 'completed', resourceId, safeResultSummary);
  }

  async failOperation(entryId: string, errorSummary: string): Promise<void> {
    await this.idempotencyRepo.updateStatus(entryId, 'failed', undefined, errorSummary);
  }

  async expireOperation(entryId: string, expiresAt: string): Promise<void> {
    await this.idempotencyRepo.expireEntry(entryId, expiresAt);
  }
}
