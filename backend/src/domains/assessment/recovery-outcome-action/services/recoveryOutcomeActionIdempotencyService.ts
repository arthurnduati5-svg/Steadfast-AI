import { RecoveryOutcomeActionIdempotencyRepository } from '../contracts/recoveryOutcomeActionRepositoryContracts';
import { RecoveryOutcomeActionCommandContext } from '../contracts/recoveryOutcomeActionContracts';
import { createHash } from 'crypto';

export class RecoveryOutcomeActionIdempotencyService {
  constructor(private idempotencyRepo: RecoveryOutcomeActionIdempotencyRepository) {}

  async processIdempotency(
    ctx: RecoveryOutcomeActionCommandContext,
    operation: string,
    body: Record<string, unknown>,
  ): Promise<{ isDuplicate: boolean; existingResourceId?: string }> {
    const existing = await this.idempotencyRepo.getByKey(ctx.schoolId, ctx.idempotencyKey);
    if (existing) {
      if (existing.status === 'completed') {
        return { isDuplicate: true, existingResourceId: existing.resourceId ?? undefined };
      }
      return { isDuplicate: true };
    }

    const requestHash = createHash('sha256').update(JSON.stringify({ operation, body })).digest('hex');
    await this.idempotencyRepo.create({
      idempotencyId: '',
      schoolId: ctx.schoolId,
      operation,
      idempotencyKey: ctx.idempotencyKey,
      requestHash,
      status: 'in_progress',
      createdAt: new Date(),
    });

    return { isDuplicate: false };
  }

  async markCompleted(ctx: RecoveryOutcomeActionCommandContext, resourceType: string, resourceId: string): Promise<void> {
    const existing = await this.idempotencyRepo.getByKey(ctx.schoolId, ctx.idempotencyKey);
    if (existing) {
      await this.idempotencyRepo.markCompleted(existing.idempotencyId, resourceType, resourceId);
    }
  }
}
