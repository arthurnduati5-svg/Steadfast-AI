import { RecoveryExecutionReadinessBoardCommandContext, RecoveryExecutionReadinessBoardSafeEnvelope } from '../contracts';
import { InMemoryRecoveryExecutionReadinessBoardIdempotencyRepository } from '../repositories/inMemoryRecoveryExecutionReadinessBoardRepositories';

export class RecoveryExecutionReadinessBoardIdempotencyService {
  private idempotencyRepo: InMemoryRecoveryExecutionReadinessBoardIdempotencyRepository;

  constructor() {
    this.idempotencyRepo = new InMemoryRecoveryExecutionReadinessBoardIdempotencyRepository();
  }

  async checkIdempotency(context: RecoveryExecutionReadinessBoardCommandContext): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<any | null>> {
    if (!context.idempotencyKey) {
      return { success: true, status: 'no_key', data: null, correlationId: context.correlationId };
    }
    const existing = await this.idempotencyRepo.getByIdempotencyKey(context.schoolId, 'board_operation', context.idempotencyKey);
    if (existing) {
      return { success: true, status: 'duplicate', data: existing, correlationId: context.correlationId, message: 'Operation already processed' };
    }
    return { success: true, status: 'new', data: null, correlationId: context.correlationId };
  }

  async markInProgress(
    context: RecoveryExecutionReadinessBoardCommandContext,
    resourceType: string,
    resourceId: string,
  ): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<any>> {
    const entry = await this.idempotencyRepo.create({
      schoolId: context.schoolId,
      operation: 'board_operation',
      idempotencyKey: context.idempotencyKey,
      requestHash: context.correlationId || '',
      status: 'in_progress',
      resourceType,
      resourceId,
      createdByActorId: context.actorId,
      createdByRole: context.actorRole,
    });
    return { success: true, status: 'in_progress', data: entry, correlationId: context.correlationId };
  }

  async markComplete(
    context: RecoveryExecutionReadinessBoardCommandContext,
    resultSummary?: string,
  ): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<any>> {
    const existing = await this.idempotencyRepo.getByIdempotencyKey(context.schoolId, 'board_operation', context.idempotencyKey);
    if (!existing) {
      return { success: false, status: 'not_found', error: 'No idempotency entry found', correlationId: context.correlationId };
    }
    const updated = await this.idempotencyRepo.complete(existing.boardIdempotencyId, resultSummary);
    return { success: true, status: 'completed', data: updated, correlationId: context.correlationId };
  }
}
