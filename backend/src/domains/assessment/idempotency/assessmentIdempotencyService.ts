import { randomUUID } from 'crypto';
import type {
  AssessmentIdempotencyRecord,
  AssessmentIdempotencyResult,
  AssessmentIdempotencyRepository,
} from '../contracts/assessmentIdempotencyContracts';
import type { AssessmentCommandContext } from '../contracts/assessmentCommandContext';

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

export class AssessmentIdempotencyService {
  constructor(private repository: AssessmentIdempotencyRepository) {}

  async checkOrCreate(
    context: AssessmentCommandContext,
    commandType: string,
    commandFingerprint: string,
  ): Promise<AssessmentIdempotencyResult> {
    if (!context.idempotencyKey) {
      return {
        status: 'missing',
        safeMessage: 'idempotencyKey is required for mutating governed commands',
        reasonCode: 'idempotency_key_missing',
      };
    }

    const existing = await this.repository.findByIdempotencyKey(
      context.idempotencyKey,
      context.schoolId,
      context.actorId,
    );

    if (existing) {
      if (existing.commandFingerprint !== commandFingerprint) {
        return {
          status: 'conflict',
          existingRecord: existing,
          safeMessage: 'Idempotency key already used with different command fingerprint',
          reasonCode: 'idempotency_fingerprint_mismatch',
        };
      }
      return {
        status: 'accepted',
        existingRecord: existing,
        safeMessage: 'Idempotent replay accepted',
        reasonCode: 'idempotency_replay_accepted',
      };
    }

    const expiresAt = new Date(Date.now() + DEFAULT_TTL_MS).toISOString();
    const record: AssessmentIdempotencyRecord = {
      idempotencyKey: context.idempotencyKey,
      schoolId: context.schoolId,
      actorId: context.actorId,
      commandType,
      commandFingerprint,
      status: 'in_progress',
      safeResultSummary: '',
      createdAt: new Date().toISOString(),
      expiresAt,
    };

    await this.repository.create(record);

    return {
      status: 'accepted',
      safeMessage: 'Idempotency key registered',
      reasonCode: 'idempotency_registered',
    };
  }

  async complete(
    idempotencyKey: string,
    safeResultSummary: string,
  ): Promise<void> {
    await this.repository.updateStatus(idempotencyKey, 'completed', safeResultSummary);
  }

  async fail(
    idempotencyKey: string,
    safeResultSummary: string,
  ): Promise<void> {
    await this.repository.updateStatus(idempotencyKey, 'failed', safeResultSummary);
  }
}
