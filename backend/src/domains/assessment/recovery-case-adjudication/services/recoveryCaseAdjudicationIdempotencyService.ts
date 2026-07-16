import { createHash } from 'crypto';
import type { RecoveryCaseAdjudicationIdempotencyRepository } from '../contracts';

export class RecoveryCaseAdjudicationIdempotencyService {
  constructor(private repo: RecoveryCaseAdjudicationIdempotencyRepository) {}

  async checkIdempotency(
    schoolId: string,
    idempotencyKey: string,
    operation: string,
  ): Promise<{ exists: boolean; status?: string; responseRef?: string }> {
    const record = await this.repo.getByKey(schoolId, idempotencyKey, operation);
    if (!record) {
      return { exists: false };
    }
    return { exists: true, status: record.status, responseRef: record.responseRef };
  }

  async createIdempotencyEntry(
    schoolId: string,
    idempotencyKey: string,
    operation: string,
    requestHash: string,
  ): Promise<void> {
    await this.repo.create({
      schoolId,
      idempotencyKey,
      operation,
      requestHash,
      status: 'in_progress',
    });
  }

  async completeIdempotencyEntry(
    schoolId: string,
    idempotencyKey: string,
    operation: string,
    responseRef: string,
  ): Promise<void> {
    await this.repo.complete(schoolId, idempotencyKey, operation, responseRef);
  }

  hashRequest(payload: string): string {
    return createHash('sha256').update(payload).digest('hex');
  }
}
