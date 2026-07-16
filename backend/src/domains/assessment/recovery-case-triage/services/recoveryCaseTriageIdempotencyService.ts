import { v4 as uuid } from 'uuid';
import { RecoveryCaseTriageCommandContext, RecoveryCaseTriageSafeEnvelope } from '../contracts/recoveryCaseTriageContracts';
import { RecoveryCaseTriageIdempotencyEntry, RecoveryCaseTriageIdempotencyRepository } from '../contracts/recoveryCaseTriageRepositoryContracts';
import { RecoveryCasePriorityEngineService } from './recoveryCasePriorityEngineService';

export class RecoveryCaseTriageIdempotencyService {
  constructor(
    private repo: RecoveryCaseTriageIdempotencyRepository,
    private engine: RecoveryCasePriorityEngineService,
  ) {}

  async createIdempotencyEntry(ctx: RecoveryCaseTriageCommandContext, schoolId: string, operation: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseTriageIdempotencyEntry>> {
    try {
      if (ctx.schoolId !== schoolId) return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      const existing = await this.repo.getByKey(schoolId, operation, ctx.idempotencyKey);
      if (existing) {
        return { success: true, data: existing, status: 'duplicate', message: 'Idempotency key already exists', correlationId: ctx.correlationId };
      }
      const requestHash = this.engine.calculateRequestHash(ctx);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const created = await this.repo.create({
        schoolId: ctx.schoolId,
        operation,
        idempotencyKey: ctx.idempotencyKey,
        requestHash,
        status: 'pending',
        resourceType: null,
        resourceId: null,
        safeResultSummary: null,
        expiresAt,
      });
      return { success: true, data: created, status: 'created', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }

  async getIdempotencyEntry(schoolId: string, id: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseTriageIdempotencyEntry>> {
    try {
      const entry = await this.repo.getByKey(schoolId, '', '');
      if (!entry) return { success: false, status: 'NOT_FOUND', message: 'Idempotency entry not found' };
      return { success: true, data: entry, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async completeIdempotencyEntry(schoolId: string, operation: string, idempotencyKey: string, safeResultSummary: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseTriageIdempotencyEntry>> {
    try {
      const entry = await this.repo.getByKey(schoolId, operation, idempotencyKey);
      if (!entry) return { success: false, status: 'NOT_FOUND', message: 'Idempotency entry not found' };
      const updated = await this.repo.complete(entry.triageIdempotencyId, safeResultSummary);
      return { success: true, data: updated, status: 'completed', correlationId: undefined };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async isDuplicateRequest(ctx: RecoveryCaseTriageCommandContext, schoolId: string, operation: string): Promise<RecoveryCaseTriageSafeEnvelope<{ isDuplicate: boolean; existingEntry: RecoveryCaseTriageIdempotencyEntry | null }>> {
    try {
      if (ctx.schoolId !== schoolId) return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      const entry = await this.repo.getByKey(schoolId, operation, ctx.idempotencyKey);
      if (!entry) {
        return { success: true, data: { isDuplicate: false, existingEntry: null }, status: 'found', correlationId: ctx.correlationId };
      }
      const requestHash = this.engine.calculateRequestHash(ctx);
      const isDuplicate = entry.requestHash === requestHash && entry.status === 'completed';
      return { success: true, data: { isDuplicate, existingEntry: entry }, status: 'found', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }
}
