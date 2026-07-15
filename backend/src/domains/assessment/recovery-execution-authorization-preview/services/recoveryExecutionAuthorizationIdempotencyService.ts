import { RecoveryExecutionAuthorizationIdempotencyRepository } from '../contracts/recoveryExecutionAuthorizationRepositoryContracts';
import { RecoveryExecutionAuthorizationPreviewSafeEnvelope } from '../contracts/recoveryExecutionAuthorizationPreviewContracts';
import { v4 as uuid } from 'uuid';

export class RecoveryExecutionAuthorizationIdempotencyService {
  constructor(private repo: RecoveryExecutionAuthorizationIdempotencyRepository) {}

  async check(
    schoolId: string,
    operation: string,
    idempotencyKey: string,
  ): Promise<{ exists: boolean; existing?: RecoveryExecutionAuthorizationPreviewSafeEnvelope<any> }> {
    const record = await this.repo.getByKey(schoolId, operation, idempotencyKey);
    if (!record) {
      return { exists: false };
    }
    return {
      exists: true,
      existing: {
        success: true,
        data: record,
        status: record.status,
      },
    };
  }

  async record(
    schoolId: string,
    operation: string,
    idempotencyKey: string,
    requestHash: string,
  ): Promise<void> {
    const now = new Date().toISOString();
    await this.repo.create({
      idempotencyId: uuid(),
      schoolId,
      operation,
      idempotencyKey,
      requestHash,
      status: 'in_progress',
      createdAt: now,
      updatedAt: now,
    });
  }

  async complete(
    schoolId: string,
    operation: string,
    idempotencyKey: string,
    resourceType?: string,
    resourceId?: string,
    safeResultSummary?: string,
  ): Promise<void> {
    const record = await this.repo.getByKey(schoolId, operation, idempotencyKey);
    if (record) {
      await this.repo.updateStatus(
        record.idempotencyId,
        'completed',
        resourceType,
        resourceId,
        safeResultSummary,
      );
    }
  }
}
