import type { ResultDeliveryIdempotencyRepository } from '../contracts/resultDeliveryRepositoryContracts';
import type { ResultDeliveryIdempotencyEntry } from '../contracts/resultDeliveryIdempotencyContracts';
import { randomUUID } from 'crypto';

export class ResultDeliveryIdempotencyService {
  constructor(private idempotencyRepo: ResultDeliveryIdempotencyRepository) {}

  private async makeEntry(
    schoolId: string,
    operation: string,
    idempotencyKey: string,
    resourceType?: string,
  ): Promise<ResultDeliveryIdempotencyEntry> {
    const hash = randomUUID();
    return this.idempotencyRepo.create({
      schoolId,
      operation,
      idempotencyKey,
      requestHash: hash,
      status: 'in_progress',
      resourceType: resourceType ?? null,
      resourceId: null,
      safeResultSummary: null,
      createdAt: '',
      updatedAt: '',
      expiresAt: null,
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
      return entry.resultDeliveryIdempotencyId ?? null;
    } catch {
      const existing = await this.idempotencyRepo.findByKey(schoolId, operation, idempotencyKey);
      if (existing) return existing.resultDeliveryIdempotencyId ?? null;
      return null;
    }
  }

  async detectConflict(
    schoolId: string,
    operation: string,
    idempotencyKey: string,
  ): Promise<ResultDeliveryIdempotencyEntry | null> {
    const existing = await this.idempotencyRepo.findByKey(schoolId, operation, idempotencyKey);
    if (!existing) return null;
    if (existing.status === 'completed' || existing.status === 'in_progress') return existing;
    return null;
  }

  async getExistingOperation(entryId: string): Promise<ResultDeliveryIdempotencyEntry | null> {
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
    await this.idempotencyRepo.expire(entryId, expiresAt);
  }
}
