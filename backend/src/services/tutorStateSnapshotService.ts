// ─────────────────────────────────────────────────────────────
// Steadfast AI — Tutor State Snapshot Service v2 (R8-G.3A-D1)
// Creates bounded, redacted snapshots of the tutor state.
// Snapshots are later-retrieval durable state (NOT cache): the
// production canonical owner is Prisma (TutorStateSnapshotRecord).
// Production default is fail-closed: when the database is unreachable,
// canonical writes/reads throw instead of silently succeeding against
// process-local memory. In-memory storage remains ONLY as explicit
// test injection (TUTORSTATE_ALLOW_MEMORY_FALLBACK=1).
// Set TUTORSTATE_REQUIRE_DURABLE=1 to force strict mode anywhere.
// Never stores raw artifact text, OCR, transcripts, answer keys,
// or hidden prompts.
// ─────────────────────────────────────────────────────────────

import prisma from '../lib/prisma';

import type {
  DedicatedTutorState,
  TutorStateEndpointResponse,
  TutorStateHistoryResponse,
  TutorStateSnapshotSummary,
  TutorStateSourceDomain,
} from './tutorStateEndpointContracts';

import { MAX_HISTORY_SNAPSHOTS } from './tutorStateEndpointContracts';

import type { ResolvedTutorIdentity } from './tutorStateContracts';

// ── StoredSnapshot contract (source truth for the Prisma mapping) ──

export interface StoredSnapshot {
  snapshotId: string;
  stateVersion: number;
  createdAt: string;
  reason?: string | null;
  domainsIncluded: TutorStateSourceDomain[];
  topic?: string | null;
  // The full redacted state is retained for history detail
  state: DedicatedTutorState;
}

// Minimal structural delegate type so tests can inject a throwing stub
// (persistence-failure proof) without a live database.
export interface TutorSnapshotRecordDelegate {
  create(args: unknown): Promise<any>;
  findMany(args: unknown): Promise<any[]>;
  findFirst(args: unknown): Promise<any | null>;
  deleteMany(args: unknown): Promise<unknown>;
}

export interface TutorSnapshotClientLike {
  tutorStateSnapshotRecord?: TutorSnapshotRecordDelegate | null;
}

// ── Explicit test-injection gate ──
// Silent Prisma failure → memory success is forbidden for canonical
// state. Outside test/dev, persistence failures throw (fail-closed).

export function isTutorSnapshotMemoryFallbackAllowed(): boolean {
  // R8-G.3A-D1C: canonical memory fallback requires explicit opt-in.
  // Strict/durable flag wins over fallback. NODE_ENV alone never enables
  // memory; legacy tests must set TUTORSTATE_ALLOW_MEMORY_FALLBACK=1.
  if (process.env.TUTORSTATE_REQUIRE_DURABLE === '1') return false;
  return process.env.TUTORSTATE_ALLOW_MEMORY_FALLBACK === '1';
}

// ── In-memory store: EXPLICIT TEST INJECTION ONLY ──
// Never canonical. Unreachable in production/strict mode (every public
// method throws before touching it when the fallback is not allowed).

const memoryTestInjectionStore = new Map<string, StoredSnapshot[]>();

function getKey(schoolId: string, studentId: string): string {
  return `${schoolId}:${studentId}`;
}

function generateMemoryId(): string {
  return `tssnap_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function nowISO(): string {
  return new Date().toISOString();
}

function toSummary(snapshot: StoredSnapshot): TutorStateSnapshotSummary {
  return {
    snapshotId: snapshot.snapshotId,
    stateVersion: snapshot.stateVersion,
    createdAt: snapshot.createdAt,
    reason: snapshot.reason || null,
    domainsIncluded: snapshot.domainsIncluded,
    topic: snapshot.topic || null,
  };
}

function recordToStoredSnapshot(record: any): StoredSnapshot {
  return {
    snapshotId: record.id,
    stateVersion: record.stateVersion,
    createdAt: record.createdAt?.toISOString?.() || nowISO(),
    reason: record.reason ?? null,
    domainsIncluded: (record.domainsIncluded as TutorStateSourceDomain[]) || [],
    topic: record.topic ?? null,
    state: record.snapshot as DedicatedTutorState,
  };
}

// ── Service ──

export class TutorStateSnapshotService {
  private readonly client: TutorSnapshotClientLike;

  constructor(client?: TutorSnapshotClientLike) {
    this.client = client || (prisma as unknown as TutorSnapshotClientLike);
  }

  private delegate(): TutorSnapshotRecordDelegate {
    const delegate = this.client?.tutorStateSnapshotRecord;
    if (!delegate) {
      throw new Error(
        'TutorState snapshot persistence unavailable: snapshot record store is unreachable.',
      );
    }
    return delegate;
  }

  private buildSnapshot(input: {
    state: DedicatedTutorState;
    reason?: string | null;
    includeSafePromptContext?: boolean;
  }): Omit<StoredSnapshot, 'snapshotId' | 'createdAt'> & { createdAt?: string } {
    const { state, reason, includeSafePromptContext } = input;
    return {
      stateVersion: state.stateVersion,
      reason: reason || null,
      domainsIncluded: state.metadata.domainsIncluded,
      topic: state.currentLearning.topic || null,
      state: {
        ...state,
        // If safePromptContext not requested, exclude it
        safePromptContext: includeSafePromptContext
          ? state.safePromptContext
          : { allowed: false, summary: '', excluded: [], warnings: [] },
      },
    };
  }

  /**
   * Create a snapshot of the current tutor state.
   * Durable (Prisma) first; throws when persistence fails in
   * production/strict mode. Memory only as explicit test injection.
   */
  async createSnapshot(input: {
    identity: ResolvedTutorIdentity;
    state: DedicatedTutorState;
    reason?: string | null;
    includeSafePromptContext?: boolean;
  }): Promise<TutorStateEndpointResponse> {
    const { identity, state, reason, includeSafePromptContext } = input;
    const warnings: string[] = [];

    const prepared = this.buildSnapshot({ state, reason, includeSafePromptContext });

    try {
      const record = await this.delegate().create({
        data: {
          schoolId: identity.schoolId,
          studentId: identity.studentId,
          stateVersion: prepared.stateVersion,
          snapshot: prepared.state as any,
          reason: prepared.reason,
          domainsIncluded: prepared.domainsIncluded as any,
          topic: prepared.topic,
        },
      });
      const stored = recordToStoredSnapshot(record);

      // Bounded hygiene: keep only the newest MAX_HISTORY_SNAPSHOTS rows.
      // Best-effort AFTER the durable write; never masks a write result.
      try {
        const beyond = (await this.delegate().findMany({
          where: { schoolId: identity.schoolId, studentId: identity.studentId },
          select: { id: true },
          orderBy: { createdAt: 'desc' },
          skip: MAX_HISTORY_SNAPSHOTS,
          take: MAX_HISTORY_SNAPSHOTS,
        })) as Array<{ id: string }>;
        if (beyond.length > 0) {
          await this.delegate().deleteMany({
            where: {
              schoolId: identity.schoolId,
              studentId: identity.studentId,
              id: { in: beyond.map((r) => r.id) },
            },
          });
        }
      } catch {
        // Prune hygiene only; the snapshot itself is already durable.
      }

      return {
        ok: true,
        status: 'snapshot_created',
        state: stored.state,
        warnings,
      };
    } catch (err) {
      if (!isTutorSnapshotMemoryFallbackAllowed()) {
        throw new Error(
          `TutorState snapshot persistence failed: database unreachable and in-memory fallback is disabled (R8-G.3A-D1 durable-canonical default). Cause: ${String(err)}`,
        );
      }
      // Explicit test/dev injection path (legacy behavior preserved).
      const snapshot: StoredSnapshot = {
        snapshotId: generateMemoryId(),
        stateVersion: prepared.stateVersion,
        createdAt: nowISO(),
        reason: prepared.reason || null,
        domainsIncluded: prepared.domainsIncluded,
        topic: prepared.topic || null,
        state: prepared.state,
      };
      const key = getKey(identity.schoolId, identity.studentId);
      const existing = memoryTestInjectionStore.get(key) || [];
      existing.unshift(snapshot);
      memoryTestInjectionStore.set(key, existing.slice(0, MAX_HISTORY_SNAPSHOTS));

      return {
        ok: true,
        status: 'snapshot_created',
        state: snapshot.state,
        warnings,
      };
    }
  }

  /**
   * List recent snapshots (summaries, not full state).
   */
  async listSnapshots(input: {
    identity: ResolvedTutorIdentity;
    limit?: number;
  }): Promise<TutorStateHistoryResponse> {
    const { identity, limit } = input;
    const warnings: string[] = [];
    const maxLimit = Math.min(limit || 10, MAX_HISTORY_SNAPSHOTS);

    try {
      const records = (await this.delegate().findMany({
        where: { schoolId: identity.schoolId, studentId: identity.studentId },
        orderBy: { createdAt: 'desc' },
        take: maxLimit,
      })) as any[];
      const snapshots = records.map(recordToStoredSnapshot);

      if (snapshots.length === 0) {
        return {
          ok: true,
          status: 'empty',
          snapshots: [],
          warnings: ['No state snapshots available.'],
        };
      }

      return {
        ok: true,
        status: 'resolved',
        snapshots: snapshots.map(toSummary),
        warnings,
      };
    } catch (err) {
      if (!isTutorSnapshotMemoryFallbackAllowed()) {
        throw new Error(
          `TutorState snapshot persistence unavailable: database unreachable and in-memory fallback is disabled (R8-G.3A-D1 durable-canonical default). Cause: ${String(err)}`,
        );
      }
      const key = getKey(identity.schoolId, identity.studentId);
      const snapshots = memoryTestInjectionStore.get(key) || [];

      if (snapshots.length === 0) {
        return {
          ok: true,
          status: 'empty',
          snapshots: [],
          warnings: ['No state snapshots available.'],
        };
      }

      const summaries = snapshots.slice(0, maxLimit).map(toSummary);

      return {
        ok: true,
        status: 'resolved',
        snapshots: summaries,
        warnings,
      };
    }
  }

  /**
   * Get a single snapshot by ID (school + learner scoped).
   */
  async getSnapshot(input: {
    identity: ResolvedTutorIdentity;
    snapshotId: string;
  }): Promise<TutorStateEndpointResponse | null> {
    const { identity, snapshotId } = input;

    try {
      const record = (await this.delegate().findFirst({
        where: {
          id: snapshotId,
          schoolId: identity.schoolId,
          studentId: identity.studentId,
        },
      })) as any;
      if (!record) return null;
      const stored = recordToStoredSnapshot(record);

      return {
        ok: true,
        status: 'resolved',
        state: stored.state,
        warnings: [],
      };
    } catch (err) {
      if (!isTutorSnapshotMemoryFallbackAllowed()) {
        throw new Error(
          `TutorState snapshot persistence unavailable: database unreachable and in-memory fallback is disabled (R8-G.3A-D1 durable-canonical default). Cause: ${String(err)}`,
        );
      }
      const key = getKey(identity.schoolId, identity.studentId);
      const snapshots = memoryTestInjectionStore.get(key) || [];
      const found = snapshots.find((s) => s.snapshotId === snapshotId);

      if (!found) return null;

      return {
        ok: true,
        status: 'resolved',
        state: found.state,
        warnings: [],
      };
    }
  }

  /**
   * For testing: clear the test-injection store.
   */
  _clearStoreForTest(): void {
    memoryTestInjectionStore.clear();
  }
}

// ── Singleton ──

export const tutorStateSnapshotService = new TutorStateSnapshotService();
