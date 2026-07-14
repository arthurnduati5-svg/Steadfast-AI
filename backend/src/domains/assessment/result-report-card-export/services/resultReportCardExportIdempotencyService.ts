import type { ResultReportCardExportIdempotencyRepository, ResultReportCardExportIdempotencyEntry } from '../contracts/resultReportCardExportRepositoryContracts';
import crypto from 'crypto';

export class ResultReportCardExportIdempotencyService {
  constructor(private repo: ResultReportCardExportIdempotencyRepository) {}

  async startOperation(schoolId: string, operation: string, idempotencyKey: string): Promise<ResultReportCardExportIdempotencyEntry | null> {
    const existing = await this.repo.getByKey(schoolId, operation, idempotencyKey);
    if (existing) return existing.status === 'in_progress' ? existing : null;
    const hash = crypto.createHash('sha256').update(`${schoolId}:${operation}:${idempotencyKey}`).digest('hex');
    return this.repo.create({
      schoolId, operation, idempotencyKey, requestHash: hash, status: 'in_progress',
    });
  }

  async completeOperation(schoolId: string, operation: string, idempotencyKey: string, _resourceType: string, _resourceId: string, safeSummary: string): Promise<void> {
    const entry = await this.repo.getByKey(schoolId, operation, idempotencyKey);
    if (entry) {
      await this.repo.updateStatus(entry.resultReportCardExportIdempotencyId, 'completed', safeSummary);
    }
  }

  async failOperation(schoolId: string, operation: string, idempotencyKey: string, safeSummary: string): Promise<void> {
    const entry = await this.repo.getByKey(schoolId, operation, idempotencyKey);
    if (entry) {
      await this.repo.updateStatus(entry.resultReportCardExportIdempotencyId, 'failed', safeSummary);
    }
  }

  async detectConflict(schoolId: string, operation: string, idempotencyKey: string): Promise<{ conflict: boolean; existing?: ResultReportCardExportIdempotencyEntry }> {
    const existing = await this.repo.getByKey(schoolId, operation, idempotencyKey);
    if (!existing) return { conflict: false };
    if (existing.status === 'completed') return { conflict: true, existing };
    return { conflict: false };
  }

  async getExistingOperation(schoolId: string, operation: string, idempotencyKey: string): Promise<ResultReportCardExportIdempotencyEntry | null> {
    return this.repo.getByKey(schoolId, operation, idempotencyKey);
  }

  async expireOperation(schoolId: string, operation: string, idempotencyKey: string): Promise<void> {
    const entry = await this.repo.getByKey(schoolId, operation, idempotencyKey);
    if (entry) {
      await this.repo.expire(entry.resultReportCardExportIdempotencyId);
    }
  }
}
