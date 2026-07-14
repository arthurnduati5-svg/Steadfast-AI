import { MarkingInvocationIdempotencyEntry, MarkingInvocationIdempotencyRepository } from '../contracts/markingInvocationRepositoryContracts';
import { InMemoryMarkingInvocationIdempotencyRepository } from '../repositories/inMemoryMarkingInvocationRepositories';
import crypto from 'crypto';

export class MarkingInvocationIdempotencyService {
  constructor(
    private idempotencyRepo: MarkingInvocationIdempotencyRepository = new InMemoryMarkingInvocationIdempotencyRepository(),
  ) {}

  async startOperation(schoolId: string, operation: string, idempotencyKey: string): Promise<{ isNew: boolean; existing: MarkingInvocationIdempotencyEntry | null }> {
    const existing = await this.idempotencyRepo.findBySchoolIdOperationAndKey(schoolId, operation, idempotencyKey);
    if (existing) {
      if (existing.status === 'completed') return { isNew: false, existing };
      if (existing.status === 'in_progress') throw new Error('IDEMPOTENCY_CONFLICT: Operation already in progress');
    }
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const entry: MarkingInvocationIdempotencyEntry = {
      markingInvocationIdempotencyId: crypto.randomUUID(),
      schoolId,
      operation,
      idempotencyKey,
      requestHash: crypto.createHash('sha256').update(`${schoolId}:${operation}:${idempotencyKey}:${now}`).digest('hex'),
      status: 'in_progress',
      resourceType: null,
      resourceId: null,
      safeResultSummary: null,
      createdAt: now,
      updatedAt: now,
      expiresAt,
    };
    const created = await this.idempotencyRepo.create(entry);
    return { isNew: true, existing: created };
  }

  async completeOperation(schoolId: string, operation: string, idempotencyKey: string, resourceType: string, resourceId: string, summary: string): Promise<MarkingInvocationIdempotencyEntry> {
    const existing = await this.idempotencyRepo.findBySchoolIdOperationAndKey(schoolId, operation, idempotencyKey);
    if (!existing) throw new Error('NOT_FOUND: Idempotency entry not found');
    existing.status = 'completed';
    existing.resourceType = resourceType;
    existing.resourceId = resourceId;
    existing.safeResultSummary = summary;
    existing.updatedAt = new Date().toISOString();
    return this.idempotencyRepo.update(existing);
  }

  async failOperation(schoolId: string, operation: string, idempotencyKey: string, errorSummary: string): Promise<MarkingInvocationIdempotencyEntry> {
    const existing = await this.idempotencyRepo.findBySchoolIdOperationAndKey(schoolId, operation, idempotencyKey);
    if (!existing) throw new Error('NOT_FOUND: Idempotency entry not found');
    existing.status = 'failed';
    existing.safeResultSummary = errorSummary;
    existing.updatedAt = new Date().toISOString();
    return this.idempotencyRepo.update(existing);
  }

  async detectConflict(schoolId: string, operation: string, idempotencyKey: string): Promise<MarkingInvocationIdempotencyEntry | null> {
    return this.idempotencyRepo.findBySchoolIdOperationAndKey(schoolId, operation, idempotencyKey);
  }

  async getExistingOperation(schoolId: string, operation: string, idempotencyKey: string): Promise<MarkingInvocationIdempotencyEntry | null> {
    return this.idempotencyRepo.findBySchoolIdOperationAndKey(schoolId, operation, idempotencyKey);
  }

  async expireOperation(schoolId: string, operation: string, idempotencyKey: string): Promise<MarkingInvocationIdempotencyEntry> {
    const existing = await this.idempotencyRepo.findBySchoolIdOperationAndKey(schoolId, operation, idempotencyKey);
    if (!existing) throw new Error('NOT_FOUND: Idempotency entry not found');
    existing.status = 'expired';
    existing.updatedAt = new Date().toISOString();
    return this.idempotencyRepo.update(existing);
  }
}
