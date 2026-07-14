import { createHash } from 'crypto';
import type { ResultGovernanceIdempotencyRepository } from '../contracts/resultGovernanceRepositoryContracts';
import type { ResultGovernanceIdempotencyEntry } from '../contracts/resultGovernanceRepositoryContracts';

export class ResultGovernanceIdempotencyService {
  constructor(private idempotencyRepo: ResultGovernanceIdempotencyRepository) {}

  async startOperation(params: {
    schoolId: string;
    operation: string;
    idempotencyKey: string;
    requestBody: unknown;
  }): Promise<{ ok: boolean; existing?: ResultGovernanceIdempotencyEntry }> {
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
    if (!existing || !existing.resultGovernanceIdempotencyId) return;
    await this.idempotencyRepo.updateStatus(
      existing.resultGovernanceIdempotencyId,
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
    if (!existing || !existing.resultGovernanceIdempotencyId) return;
    await this.idempotencyRepo.updateStatus(existing.resultGovernanceIdempotencyId, 'failed');
  }

  async detectConflict(params: {
    schoolId: string;
    operation: string;
    idempotencyKey: string;
  }): Promise<ResultGovernanceIdempotencyEntry | null> {
    return this.idempotencyRepo.getByIdempotencyKey(params.schoolId, params.operation, params.idempotencyKey);
  }

  async getExistingOperation(params: {
    schoolId: string;
    operation: string;
    idempotencyKey: string;
  }): Promise<ResultGovernanceIdempotencyEntry | null> {
    return this.idempotencyRepo.getByIdempotencyKey(params.schoolId, params.operation, params.idempotencyKey);
  }

  async expireOperation(params: {
    schoolId: string;
    operation: string;
    idempotencyKey: string;
  }): Promise<void> {
    const existing = await this.idempotencyRepo.getByIdempotencyKey(params.schoolId, params.operation, params.idempotencyKey);
    if (!existing || !existing.resultGovernanceIdempotencyId) return;
    await this.idempotencyRepo.updateStatus(existing.resultGovernanceIdempotencyId, 'expired', undefined, undefined, 'Operation expired');
  }
}
