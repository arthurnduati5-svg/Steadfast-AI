import { ISimulationIdempotencyRepository, RecoveryOutcomeExecutionSimulationIdempotencyRecord } from '../contracts/recoveryOutcomeExecutionSimulationRepositoryContracts';
import { createHash } from 'crypto';

export class RecoveryOutcomeExecutionSimulationIdempotencyService {
  constructor(private idempotencyRepo: ISimulationIdempotencyRepository) {}

  async checkIdempotency(
    schoolId: string,
    operation: string,
    idempotencyKey: string,
  ): Promise<RecoveryOutcomeExecutionSimulationIdempotencyRecord | null> {
    return this.idempotencyRepo.findByIdempotencyKey(schoolId, operation, idempotencyKey);
  }

  async createIdempotencyEntry(
    schoolId: string,
    operation: string,
    idempotencyKey: string,
    requestHash: string,
    resourceType?: string,
    resourceId?: string,
  ): Promise<RecoveryOutcomeExecutionSimulationIdempotencyRecord> {
    return this.idempotencyRepo.create({
      simulationIdempotencyId: '',
      schoolId,
      operation,
      idempotencyKey,
      requestHash,
      status: 'in_progress',
      resourceType,
      resourceId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  async markCompleted(
    schoolId: string,
    operation: string,
    idempotencyKey: string,
    safeResultSummary: string,
  ): Promise<void> {
    const existing = await this.idempotencyRepo.findByIdempotencyKey(schoolId, operation, idempotencyKey);
    if (existing) {
      await this.idempotencyRepo.markCompleted(
        existing.simulationIdempotencyId,
        operation,
        idempotencyKey,
        safeResultSummary,
      );
    }
  }

  async markFailed(
    schoolId: string,
    operation: string,
    idempotencyKey: string,
    safeResultSummary: string,
  ): Promise<void> {
    const existing = await this.idempotencyRepo.findByIdempotencyKey(schoolId, operation, idempotencyKey);
    if (existing) {
      await this.idempotencyRepo.markFailed(existing.simulationIdempotencyId, safeResultSummary);
    }
  }

  async computeRequestHash(operation: string, body: Record<string, unknown>): Promise<string> {
    return createHash('sha256').update(JSON.stringify({ operation, body })).digest('hex');
  }
}
