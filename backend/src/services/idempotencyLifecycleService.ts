import prisma from '../lib/prisma';
import { logger } from '../utils/logger';
import { getR8GBoundsConfig } from '../config/r8gBackendBounds';

/**
 * R8-G safe lifecycle for redundant idempotency metadata.
 *
 * HARD LAWS:
 * - Canonical evidence (LearningEvidenceEvent, mastery evidence, audit
 *   records, results) is NEVER deleted by this module.
 * - Disabled or unconfigured retention performs NO destructive deletion.
 * - In-flight records (non-terminal status) are NEVER purged.
 * - Every execution is bounded (batch maximum respected).
 * - Every execution is observable (structured result + log line).
 *
 * One shared primitive serves both evidence idempotency families so the
 * backend does not grow two unrelated cleanup frameworks.
 */

export interface IdempotencyPurgeResult {
  /** Machine-readable lifecycle outcome. */
  status:
    | 'disabled'
    | 'completed'
    | 'invalid_configuration';
  purged: number;
  /** Upper bound applied to this execution. */
  batchMax: number;
  /** Retention threshold applied (days), if any. */
  retentionDays: number | null;
  /** Old completed rows observed but retained because the batch cap was hit. */
  retainedDueToCap: number;
  reasonCodes: string[];
}

function disabledResult(reason: string): IdempotencyPurgeResult {
  return {
    status: 'disabled',
    purged: 0,
    batchMax: 0,
    retentionDays: null,
    retainedDueToCap: 0,
    reasonCodes: [reason],
  };
}

function cutoffDate(retentionDays: number, now: Date): Date {
  return new Date(now.getTime() - retentionDays * 24 * 60 * 60 * 1000);
}

export interface EvidencePurgeOptions {
  retentionDays?: number | null;
  batchMax?: number;
  now?: Date;
  /**
   * Injectable store for focused proofs. Defaults to the production Prisma
   * delegates. Canonical event tables are never in the delete set.
   */
  store?: {
    findOldIdempotencyKeys(args: {
      cutoff: Date;
      batchMax: number;
    }): Promise<Array<{ schoolId: string; idempotencyKey: string }>>;
    eventExists(args: { schoolId: string; idempotencyKey: string }): Promise<boolean>;
    deleteKeys(keys: Array<{ schoolId: string; idempotencyKey: string }>): Promise<number>;
  };
}

const defaultEvidenceStore = {
  async findOldIdempotencyKeys(args: { cutoff: Date; batchMax: number }) {
    const rows = await prisma.learningEvidenceIdempotency.findMany({
      where: { createdAt: { lt: args.cutoff } },
      select: { schoolId: true, idempotencyKey: true },
      take: args.batchMax,
      orderBy: { createdAt: 'asc' },
    });
    return rows;
  },
  async eventExists(args: { schoolId: string; idempotencyKey: string }) {
    const event = await prisma.learningEvidenceEvent.findUnique({
      where: { schoolId_idempotencyKey: { schoolId: args.schoolId, idempotencyKey: args.idempotencyKey } },
      select: { eventId: true },
    });
    return event !== null;
  },
  async deleteKeys(keys: Array<{ schoolId: string; idempotencyKey: string }>) {
    if (keys.length === 0) return 0;
    // Bounded: delete only the explicitly verified redundant keys.
    let deleted = 0;
    for (const key of keys) {
      const write = await prisma.learningEvidenceIdempotency.deleteMany({
        where: { schoolId: key.schoolId, idempotencyKey: key.idempotencyKey },
      });
      deleted += write.count;
    }
    return deleted;
  },
};

/**
 * Purge redundant LearningEvidenceIdempotency rows.
 *
 * A row qualifies ONLY when it is older than the configured retention AND
 * its canonical LearningEvidenceEvent already exists (same school +
 * idempotencyKey). Rows without a canonical event are retained — they may
 * still guard uncommitted work.
 */
export async function purgeRedundantLearningEvidenceIdempotency(
  options: EvidencePurgeOptions = {},
): Promise<IdempotencyPurgeResult> {
  const bounds = getR8GBoundsConfig().config;
  const retentionDays = options.retentionDays ?? bounds.evidenceIdempotencyRetentionDays;
  if (retentionDays === null || retentionDays === undefined) {
    return disabledResult('evidence_idempotency_lifecycle_disabled');
  }
  const batchMax = options.batchMax ?? bounds.idempotencyPurgeBatchMax;
  const now = options.now ?? new Date();
  const store = options.store ?? defaultEvidenceStore;
  const cutoff = cutoffDate(retentionDays, now);

  const candidates = await store.findOldIdempotencyKeys({ cutoff, batchMax });
  const redundant: Array<{ schoolId: string; idempotencyKey: string }> = [];
  for (const candidate of candidates) {
    // Canonical referenced evidence must already exist — otherwise retain.
    if (await store.eventExists(candidate)) redundant.push(candidate);
  }
  const purged = await store.deleteKeys(redundant);
  const result: IdempotencyPurgeResult = {
    status: 'completed',
    purged,
    batchMax,
    retentionDays,
    retainedDueToCap: candidates.length >= batchMax ? candidates.length - redundant.length : 0,
    reasonCodes: ['evidence_idempotency_purge_completed', `purged:${purged}`, `candidates:${candidates.length}`],
  };
  logger.info(
    { purged: result.purged, candidates: candidates.length, batchMax, retentionDays },
    '[IdempotencyLifecycle] LearningEvidenceIdempotency purge completed',
  );
  return result;
}

export interface TerminalPurgeOptions {
  retentionDays?: number | null;
  batchMax?: number;
  now?: Date;
  store?: {
    findOldCompleted(args: {
      cutoff: Date;
      batchMax: number;
    }): Promise<Array<{ id: string }>>;
    deleteByIds(ids: string[]): Promise<number>;
  };
}

const defaultResultEvidenceStore = {
  async findOldCompleted(args: { cutoff: Date; batchMax: number }) {
    // ONLY terminal completed rows qualify. in_progress (in-flight/retryable),
    // failed (diagnosis), and conflict (review) rows are never selected.
    const rows = await prisma.resultLearningEvidenceIdempotencyRecord.findMany({
      where: { status: 'completed', updatedAt: { lt: args.cutoff } },
      select: { resultLearningEvidenceIdempotencyId: true },
      take: args.batchMax,
      orderBy: { updatedAt: 'asc' },
    });
    return rows.map((row) => ({ id: row.resultLearningEvidenceIdempotencyId }));
  },
  async deleteByIds(ids: string[]) {
    if (ids.length === 0) return 0;
    const write = await prisma.resultLearningEvidenceIdempotencyRecord.deleteMany({
      where: { resultLearningEvidenceIdempotencyId: { in: ids }, status: 'completed' },
    });
    return write.count;
  },
};

const defaultDailyObjectiveStore = {
  async findOldCompleted(args: { cutoff: Date; batchMax: number }) {
    // ONLY terminal completed rows qualify. In-flight / non-completed rows
    // (null or other completionStatus values) are never selected.
    const rows = await prisma.dailyObjectiveCheckCompletionIdempotencyRecord.findMany({
      where: { completionStatus: 'completed', updatedAt: { lt: args.cutoff } },
      select: { idempotencyKey: true },
      take: args.batchMax,
      orderBy: { updatedAt: 'asc' },
    });
    return rows.map((row) => ({ id: row.idempotencyKey }));
  },
  async deleteByIds(ids: string[]) {
    if (ids.length === 0) return 0;
    const write = await prisma.dailyObjectiveCheckCompletionIdempotencyRecord.deleteMany({
      where: { idempotencyKey: { in: ids }, completionStatus: 'completed' },
    });
    return write.count;
  },
};

/**
 * Purge completed ResultLearningEvidenceIdempotencyRecord rows older than the
 * configured retention. The status predicate is re-asserted at delete time so
 * a row that left the completed state can never be removed by this path.
 */
export async function purgeCompletedResultLearningEvidenceIdempotency(
  options: TerminalPurgeOptions = {},
): Promise<IdempotencyPurgeResult> {
  const bounds = getR8GBoundsConfig().config;
  const retentionDays = options.retentionDays ?? bounds.resultEvidenceIdempotencyRetentionDays;
  if (retentionDays === null || retentionDays === undefined) {
    return disabledResult('result_evidence_idempotency_lifecycle_disabled');
  }
  const batchMax = options.batchMax ?? bounds.idempotencyPurgeBatchMax;
  const now = options.now ?? new Date();
  const store = options.store ?? defaultResultEvidenceStore;
  const cutoff = cutoffDate(retentionDays, now);

  const candidates = await store.findOldCompleted({ cutoff, batchMax });
  const purged = await store.deleteByIds(candidates.map((candidate) => candidate.id));
  const result: IdempotencyPurgeResult = {
    status: 'completed',
    purged,
    batchMax,
    retentionDays,
    retainedDueToCap: 0,
    reasonCodes: ['result_evidence_idempotency_purge_completed', `purged:${purged}`, `candidates:${candidates.length}`],
  };
  logger.info(
    { purged: result.purged, candidates: candidates.length, batchMax, retentionDays },
    '[IdempotencyLifecycle] ResultLearningEvidenceIdempotencyRecord purge completed',
  );
  return result;
}

/**
 * Purge completed daily-objective idempotency rows older than the configured
 * retention.
 *
 * Production path uses the durable
 * `dailyObjectiveCheckCompletionIdempotencyRecord` delegate restored in
 * prisma/schema.prisma (migration
 * 20260901000000_r4_daily_objective_check_durable). Only rows with
 * completionStatus 'completed' older than the cutoff qualify; in-flight or
 * non-completed rows are never selected, and the completed predicate is
 * re-asserted at delete time. Canonical objective/evidence/mastery data is
 * never touched by this path.
 */
export async function purgeCompletedDailyObjectiveIdempotency(
  options: TerminalPurgeOptions = {},
): Promise<IdempotencyPurgeResult> {
  const bounds = getR8GBoundsConfig().config;
  const retentionDays = options.retentionDays ?? bounds.dailyObjectiveIdempotencyRetentionDays;
  if (retentionDays === null || retentionDays === undefined) {
    return disabledResult('daily_objective_idempotency_lifecycle_disabled');
  }
  const batchMax = options.batchMax ?? bounds.idempotencyPurgeBatchMax;
  const now = options.now ?? new Date();
  const store = options.store ?? defaultDailyObjectiveStore;
  const cutoff = cutoffDate(retentionDays, now);
  // Terminal-only predicate lives in the production store query
  // (completionStatus completed re-asserted at delete time); the injected
  // contract carries only already-qualified ids.
  const candidates = await store.findOldCompleted({ cutoff, batchMax });
  const purged = await store.deleteByIds(candidates.map((candidate) => candidate.id));
  logger.info(
    { purged, candidates: candidates.length, batchMax, retentionDays },
    '[IdempotencyLifecycle] DailyObjective idempotency purge completed',
  );
  return {
    status: 'completed',
    purged,
    batchMax,
    retentionDays,
    retainedDueToCap: 0,
    reasonCodes: ['daily_objective_idempotency_purge_completed', `purged:${purged}`, `candidates:${candidates.length}`],
  };
}
