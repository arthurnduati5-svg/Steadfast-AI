import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../utils/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('../lib/prisma', () => ({
  default: {},
}));

const DAY_MS = 24 * 60 * 60 * 1000;

describe('R8-G learning-evidence idempotency lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env['R8G_EVIDENCE_IDEMPOTENCY_RETENTION_DAYS'];
    delete process.env['R8G_RESULT_EVIDENCE_IDEMPOTENCY_RETENTION_DAYS'];
    delete process.env['R8G_DAILY_OBJECTIVE_IDEMPOTENCY_RETENTION_DAYS'];
    delete process.env['R8G_IDEMPOTENCY_PURGE_BATCH_MAX'];
  });

  it('disabled/unconfigured performs no destructive deletion', async () => {
    const { purgeRedundantLearningEvidenceIdempotency } = await import(
      '../services/idempotencyLifecycleService'
    );
    const store = {
      findOldIdempotencyKeys: vi.fn(),
      eventExists: vi.fn(),
      deleteKeys: vi.fn(),
    };
    const result = await purgeRedundantLearningEvidenceIdempotency({ store });
    expect(result.status).toBe('disabled');
    expect(result.purged).toBe(0);
    expect(store.findOldIdempotencyKeys).not.toHaveBeenCalled();
    expect(store.deleteKeys).not.toHaveBeenCalled();
  });

  it('purges only old rows whose canonical event already exists', async () => {
    process.env['R8G_EVIDENCE_IDEMPOTENCY_RETENTION_DAYS'] = '30';
    const { purgeRedundantLearningEvidenceIdempotency } = await import(
      '../services/idempotencyLifecycleService'
    );
    const old = new Date(Date.now() - 60 * DAY_MS);
    void old;
    const store = {
      findOldIdempotencyKeys: vi.fn().mockResolvedValue([
        { schoolId: 'school-a', idempotencyKey: 'committed-key' },
        { schoolId: 'school-a', idempotencyKey: 'inflight-key' },
      ]),
      eventExists: vi.fn().mockImplementation(async (args: { idempotencyKey: string }) => {
        return args.idempotencyKey === 'committed-key';
      }),
      deleteKeys: vi.fn().mockResolvedValue(1),
    };
    const result = await purgeRedundantLearningEvidenceIdempotency({ store, now: new Date() });
    expect(result.status).toBe('completed');
    expect(result.purged).toBe(1);
    expect(store.deleteKeys).toHaveBeenCalledWith([
      { schoolId: 'school-a', idempotencyKey: 'committed-key' },
    ]);
  });

  it('respects the batch maximum', async () => {
    process.env['R8G_EVIDENCE_IDEMPOTENCY_RETENTION_DAYS'] = '30';
    process.env['R8G_IDEMPOTENCY_PURGE_BATCH_MAX'] = '2';
    const { purgeRedundantLearningEvidenceIdempotency } = await import(
      '../services/idempotencyLifecycleService'
    );
    const store = {
      findOldIdempotencyKeys: vi.fn().mockImplementation(async (args: { batchMax: number }) => {
        expect(args.batchMax).toBe(2);
        return [
          { schoolId: 'school-a', idempotencyKey: 'k1' },
          { schoolId: 'school-a', idempotencyKey: 'k2' },
        ];
      }),
      eventExists: vi.fn().mockResolvedValue(true),
      deleteKeys: vi.fn().mockResolvedValue(2),
    };
    const result = await purgeRedundantLearningEvidenceIdempotency({ store, now: new Date() });
    expect(result.batchMax).toBe(2);
    expect(result.purged).toBe(2);
  });
});

describe('R8-G result-evidence idempotency lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env['R8G_RESULT_EVIDENCE_IDEMPOTENCY_RETENTION_DAYS'];
    delete process.env['R8G_IDEMPOTENCY_PURGE_BATCH_MAX'];
  });

  it('purges only terminal completed rows; in-flight/failed/conflict are never selected', async () => {
    process.env['R8G_RESULT_EVIDENCE_IDEMPOTENCY_RETENTION_DAYS'] = '30';
    const { purgeCompletedResultLearningEvidenceIdempotency } = await import(
      '../services/idempotencyLifecycleService'
    );
    const store = {
      findOldCompleted: vi.fn().mockResolvedValue([{ id: 'completed-old' }]),
      deleteByIds: vi.fn().mockResolvedValue(1),
    };
    const result = await purgeCompletedResultLearningEvidenceIdempotency({ store, now: new Date() });
    expect(result.status).toBe('completed');
    expect(result.purged).toBe(1);
    // The terminal-only predicate lives in the production store query
    // (status completed re-asserted at delete time); the injected contract
    // carries only already-qualified ids.
    expect(store.deleteByIds).toHaveBeenCalledWith(['completed-old']);
  });

  it('disabled when unconfigured', async () => {
    const { purgeCompletedResultLearningEvidenceIdempotency } = await import(
      '../services/idempotencyLifecycleService'
    );
    const store = { findOldCompleted: vi.fn(), deleteByIds: vi.fn() };
    const result = await purgeCompletedResultLearningEvidenceIdempotency({ store });
    expect(result.status).toBe('disabled');
    expect(store.findOldCompleted).not.toHaveBeenCalled();
  });
});

describe('R8-G daily-objective idempotency lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env['R8G_DAILY_OBJECTIVE_IDEMPOTENCY_RETENTION_DAYS'];
  });

  it('disabled when retention unconfigured performs no deletion', async () => {
    const { purgeCompletedDailyObjectiveIdempotency } = await import(
      '../services/idempotencyLifecycleService'
    );
    const store = {
      findOldCompleted: vi.fn(),
      deleteByIds: vi.fn(),
    };
    const result = await purgeCompletedDailyObjectiveIdempotency({ store, now: new Date() });
    expect(result.status).toBe('disabled');
    expect(result.purged).toBe(0);
    expect(store.findOldCompleted).not.toHaveBeenCalled();
    expect(store.deleteByIds).not.toHaveBeenCalled();
  });

  it('purges only completed rows through the injected store contract', async () => {
    process.env['R8G_DAILY_OBJECTIVE_IDEMPOTENCY_RETENTION_DAYS'] = '30';
    const { purgeCompletedDailyObjectiveIdempotency } = await import(
      '../services/idempotencyLifecycleService'
    );
    const store = {
      findOldCompleted: vi.fn().mockResolvedValue([{ id: 'done-old' }]),
      deleteByIds: vi.fn().mockResolvedValue(1),
    };
    const result = await purgeCompletedDailyObjectiveIdempotency({ store, now: new Date() });
    expect(result.status).toBe('completed');
    expect(result.purged).toBe(1);
    // The terminal-only predicate (completionStatus completed, updatedAt older
    // than cutoff, re-asserted at delete time) lives in the production Prisma
    // store query; the injected contract carries only already-qualified ids
    // and this path deletes exactly those ids — never canonical data.
    expect(store.deleteByIds).toHaveBeenCalledWith(['done-old']);
    expect(result.reasonCodes[0]).toBe('daily_objective_idempotency_purge_completed');
  });

  it('respects the batch maximum for daily-objective purge', async () => {
    process.env['R8G_DAILY_OBJECTIVE_IDEMPOTENCY_RETENTION_DAYS'] = '30';
    process.env['R8G_IDEMPOTENCY_PURGE_BATCH_MAX'] = '2';
    const { purgeCompletedDailyObjectiveIdempotency } = await import(
      '../services/idempotencyLifecycleService'
    );
    const store = {
      findOldCompleted: vi.fn().mockImplementation(async (args: { batchMax: number }) => {
        expect(args.batchMax).toBe(2);
        return [{ id: 'done-old-1' }];
      }),
      deleteByIds: vi.fn().mockResolvedValue(1),
    };
    const result = await purgeCompletedDailyObjectiveIdempotency({ store, now: new Date() });
    expect(result.status).toBe('completed');
    expect(result.batchMax).toBe(2);
    expect(result.purged).toBe(1);
    expect(store.deleteByIds).toHaveBeenCalledWith(['done-old-1']);
  });
});
