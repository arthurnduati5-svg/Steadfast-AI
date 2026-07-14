import type { ResultReportCardCommandContext } from '../contracts/resultReportCardContracts';
import type { ResultReportCardIdempotencyEntry, ResultReportCardIdempotencyRepository } from '../contracts/resultReportCardRepositoryContracts';
import { randomUUID } from 'crypto';

export class ResultReportCardIdempotencyService {
  constructor(private idempotencyRepo: ResultReportCardIdempotencyRepository) {}

  private async makeEntry(
    ctx: ResultReportCardCommandContext,
    operation: string,
  ): Promise<ResultReportCardIdempotencyEntry> {
    const hash = randomUUID();
    return this.idempotencyRepo.create({
      schoolId: ctx.schoolId,
      operation,
      idempotencyKey: ctx.idempotencyKey,
      requestHash: hash,
      status: 'in_progress',
    });
  }

  async startOperation(
    ctx: ResultReportCardCommandContext,
    operation: string,
  ): Promise<string | null> {
    try {
      const entry = await this.makeEntry(ctx, operation);
      return entry.resultReportCardIdempotencyId ?? null;
    } catch {
      const existing = await this.idempotencyRepo.getByKey(ctx.schoolId, operation, ctx.idempotencyKey);
      if (existing) return existing.resultReportCardIdempotencyId ?? null;
      return null;
    }
  }

  async detectConflict(
    ctx: ResultReportCardCommandContext,
    operation: string,
  ): Promise<ResultReportCardIdempotencyEntry | null> {
    const existing = await this.idempotencyRepo.getByKey(ctx.schoolId, operation, ctx.idempotencyKey);
    if (!existing) return null;
    if (existing.status === 'completed' || existing.status === 'in_progress') return existing;
    return null;
  }

  async getExistingOperation(ctx: ResultReportCardCommandContext, operation: string): Promise<ResultReportCardIdempotencyEntry | null> {
    return this.idempotencyRepo.getByKey(ctx.schoolId, operation, ctx.idempotencyKey);
  }

  async completeOperation(
    idempotencyEntry: string,
    resourceId: string,
    summary?: string,
  ): Promise<void> {
    await this.idempotencyRepo.update(idempotencyEntry, { status: 'completed', resourceId, safeResultSummary: summary ?? null });
  }

  async failOperation(idempotencyEntry: string, error: string): Promise<void> {
    await this.idempotencyRepo.update(idempotencyEntry, { status: 'failed', safeResultSummary: error });
  }

  async expireOperation(ctx: ResultReportCardCommandContext, operation: string): Promise<void> {
    const entry = await this.idempotencyRepo.getByKey(ctx.schoolId, operation, ctx.idempotencyKey);
    if (entry) {
      await this.idempotencyRepo.update(entry.resultReportCardIdempotencyId, { status: 'expired' });
    }
  }
}