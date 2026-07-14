import { createHash } from 'crypto';
import type { ResultLearningEvidenceIdempotencyRepository } from '../contracts/resultLearningEvidenceRepositoryContracts';
import type { ResultLearningEvidenceIdempotencyEntry } from '../contracts/resultLearningEvidenceRepositoryContracts';

export class ResultLearningEvidenceIdempotencyService {
  constructor(private idempotencyRepo: ResultLearningEvidenceIdempotencyRepository) {}

  async startOperation(params: {
    schoolId: string;
    operation: string;
    idempotencyKey: string;
    requestBody: unknown;
  }): Promise<{ ok: boolean; existing?: ResultLearningEvidenceIdempotencyEntry }> {
    const requestHash = createHash('sha256').update(JSON.stringify(params.requestBody)).digest('hex');
    const existing = await this.idempotencyRepo.getByIdempotencyKey(params.schoolId, params.operation, params.idempotencyKey);
    if (existing) {
      if (existing.status === 'completed') {
        return { ok: false, existing };
      }
      if (existing.status === 'in_progress') {
        return { ok: false, existing };
      }
      if (existing.status === 'conflict') {
        throw new Error(`IDEMPOTENCY_CONFLICT: operation ${params.operation} has conflict status`);
      }
    }

    await this.idempotencyRepo.create({
      schoolId: params.schoolId,
      operation: params.operation,
      idempotencyKey: params.idempotencyKey,
      requestHash,
      status: 'in_progress',
    });

    return { ok: true };
  }

  async completeOperation(params: {
    schoolId: string;
    operation: string;
    idempotencyKey: string;
    resourceType: string;
    resourceId: string;
    safeResultSummary: string;
  }): Promise<void> {
    const existing = await this.idempotencyRepo.getByIdempotencyKey(params.schoolId, params.operation, params.idempotencyKey);
    if (!existing || !existing.resultLearningEvidenceIdempotencyId) return;
    await this.idempotencyRepo.updateStatus(
      existing.resultLearningEvidenceIdempotencyId,
      'completed',
      params.resourceType,
      params.resourceId,
      params.safeResultSummary,
    );
  }

  async failOperation(params: {
    schoolId: string;
    operation: string;
    idempotencyKey: string;
  }): Promise<void> {
    const existing = await this.idempotencyRepo.getByIdempotencyKey(params.schoolId, params.operation, params.idempotencyKey);
    if (!existing || !existing.resultLearningEvidenceIdempotencyId) return;
    await this.idempotencyRepo.updateStatus(existing.resultLearningEvidenceIdempotencyId, 'failed');
  }

  async detectConflict(params: {
    schoolId: string;
    operation: string;
    idempotencyKey: string;
  }): Promise<boolean> {
    const existing = await this.idempotencyRepo.getByIdempotencyKey(params.schoolId, params.operation, params.idempotencyKey);
    return existing?.status === 'conflict' || false;
  }

  async getExistingOperation(params: {
    schoolId: string;
    operation: string;
    idempotencyKey: string;
  }): Promise<ResultLearningEvidenceIdempotencyEntry | null> {
    return this.idempotencyRepo.getByIdempotencyKey(params.schoolId, params.operation, params.idempotencyKey);
  }

  async expireOperation(params: {
    schoolId: string;
    operation: string;
    idempotencyKey: string;
    expiresAt: string;
  }): Promise<void> {
    const existing = await this.idempotencyRepo.getByIdempotencyKey(params.schoolId, params.operation, params.idempotencyKey);
    if (!existing || !existing.resultLearningEvidenceIdempotencyId) return;
    await this.idempotencyRepo.expireEntry(existing.resultLearningEvidenceIdempotencyId, params.expiresAt);
  }
}
