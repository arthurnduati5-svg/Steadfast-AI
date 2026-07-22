import { IRecoveryLifecycleClosureRepositories } from '../contracts/recoveryLifecycleClosureRepositoryContracts';
import { RecoveryLifecycleClosureSafeEnvelope } from '../contracts/recoveryLifecycleClosureContracts';
import { v4 as uuid } from 'uuid';

export class RecoveryLifecycleClosureIdempotencyService {
  constructor(private repos: IRecoveryLifecycleClosureRepositories) {}

  async checkIdempotency(
    schoolId: string,
    operation: string,
    idempotencyKey: string,
  ): Promise<{ exists: boolean; existing?: RecoveryLifecycleClosureSafeEnvelope<any> }> {
    const record = await this.repos.closureIdempotency.findByIdempotencyKey(schoolId, operation, idempotencyKey);
    if (!record) {
      return { exists: false };
    }
    return {
      exists: true,
      existing: {
        success: true,
        data: record,
        status: record.status,
        idempotencyKey: record.idempotencyKey,
      },
    };
  }

  async recordIdempotency(
    schoolId: string,
    operation: string,
    idempotencyKey: string,
    requestHash: string,
    resourceType?: string,
    resourceId?: string,
    safeResultSummary?: string,
  ): Promise<void> {
    const now = new Date().toISOString();
    await this.repos.closureIdempotency.create({
      closureIdempotencyId: uuid(),
      schoolId,
      operation,
      idempotencyKey,
      requestHash,
      status: 'in_progress',
      resourceType,
      resourceId,
      safeResultSummary,
      createdAt: now,
      updatedAt: now,
    });
  }

  async completeIdempotency(
    schoolId: string,
    operation: string,
    idempotencyKey: string,
    resourceType?: string,
    resourceId?: string,
    safeResultSummary?: string,
  ): Promise<void> {
    const record = await this.repos.closureIdempotency.findByIdempotencyKey(schoolId, operation, idempotencyKey);
    if (record) {
      await this.repos.closureIdempotency.markCompleted(
        record.closureIdempotencyId,
        resourceType ?? '',
        resourceId ?? '',
        safeResultSummary ?? '',
      );
    }
  }
}
