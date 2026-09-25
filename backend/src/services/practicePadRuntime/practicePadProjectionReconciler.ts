// ─────────────────────────────────────────────────────────────
// Steadfast AI — Practice Pad PP-12: projection reconciliation entry.
//
// ONE small bounded manual/service entry: reconcilePracticePadLearningProjections.
// Reuses the PracticePadProjectionReceipt durability boundary (no generic
// outbox / job framework, no hidden background agent, no infinite loop).
//
// Ordering policy (explicit):
//   memory → revision → Growth, strictly in order. A FAILED projection
//   blocks later projections in the same run; they stay PENDING. Retry
//   resumes at the first non-SUCCEEDED projection and NEVER repeats a
//   SUCCEEDED one. Canonical evidence remains authoritative throughout;
//   committed evidence is never deleted or rolled back here.
//
// Multi-replica safety: each receipt is claimed via PostgreSQL
// (claimedBy/claimedAt lease) before any projector runs; claim losers
// skip. Tenant isolation: an optional ownership scope refuses receipts
// outside the caller's school/learner without touching them.
// ─────────────────────────────────────────────────────────────

import type {
  PracticeProjectionName,
  PracticeProjectionReceipt,
} from './practicePadProjectionReceiptStore';
import { practicePadProjectionReceiptStore } from './practicePadProjectionReceiptStore';

export interface PracticeProjectionAdmitted {
  committedEvidenceId: string;
  candidate: unknown;
}

export type PracticeProjector = (admitted: PracticeProjectionAdmitted) => Promise<unknown> | unknown;

export interface PracticeProjectionProjectors {
  memory: PracticeProjector;
  revision: PracticeProjector;
  growth: PracticeProjector;
}

export interface PracticeReconcileScope {
  schoolId: string;
  studentId: string;
}

export interface PracticeReconcileResult {
  processed: number;
  completed: number;
  failed: number;
  skippedClaim: number;
  skippedScope: number;
  projectorCalls: Record<PracticeProjectionName, number>;
  details: Array<{
    receiptKey: string;
    committedEvidenceId: string | null;
    outcome: 'COMPLETED' | 'PARTIAL' | 'FAILED' | 'SKIPPED_CLAIM' | 'SKIPPED_SCOPE';
    ran: PracticeProjectionName[];
    skippedAsSucceeded: PracticeProjectionName[];
    failedProjection?: PracticeProjectionName;
    message?: string;
  }>;
}

const ORDER: PracticeProjectionName[] = ['memory', 'revision', 'growth'];

export async function reconcilePracticePadLearningProjections(args: {
  store?: typeof practicePadProjectionReceiptStore;
  projectors: PracticeProjectionProjectors;
  batchSize?: number;
  workerId?: string;
  clockMs?: () => number;
  leaseMs?: number;
  /** When set, receipts outside this ownership scope are never touched. */
  scope?: PracticeReconcileScope | null;
}): Promise<PracticeReconcileResult> {
  const store = args.store ?? practicePadProjectionReceiptStore;
  const batchSize = Math.max(1, Math.min(100, Math.floor(args.batchSize ?? 25) || 25));
  const workerId = args.workerId || `pp12-reconciler-${Date.now()}`;
  const nowMs = args.clockMs ?? (() => Date.now());
  const leaseMs = args.leaseMs ?? 60_000;

  const result: PracticeReconcileResult = {
    processed: 0,
    completed: 0,
    failed: 0,
    skippedClaim: 0,
    skippedScope: 0,
    projectorCalls: { memory: 0, revision: 0, growth: 0 },
    details: [],
  };

  const incomplete = await store.listIncomplete(batchSize);
  for (const receipt of incomplete) {
    // Tenant isolation first: never claim or mutate foreign state.
    if (
      args.scope &&
      (receipt.schoolId !== args.scope.schoolId || receipt.studentId !== args.scope.studentId)
    ) {
      result.skippedScope += 1;
      result.details.push({
        receiptKey: receipt.receiptKey,
        committedEvidenceId: receipt.committedEvidenceId,
        outcome: 'SKIPPED_SCOPE',
        ran: [],
        skippedAsSucceeded: [],
        message: 'Receipt outside caller ownership scope; untouched.',
      });
      continue;
    }
    // ONE shared claimed path (same executor the immediate PP-10 path
    // uses): claim → fresh read → skip SUCCEEDED → run next incomplete
    // → durable conditional state update → release claim.
    const claimed = await executeClaimedProjectionReceipt({
      store,
      receiptKey: receipt.receiptKey,
      workerId,
      leaseMs,
      nowMs: nowMs(),
      projectors: args.projectors,
      projectorCalls: result.projectorCalls,
    });
    if (claimed.claim === 'LOST') {
      result.skippedClaim += 1;
      result.details.push({
        receiptKey: receipt.receiptKey,
        committedEvidenceId: receipt.committedEvidenceId,
        outcome: 'SKIPPED_CLAIM',
        ran: [],
        skippedAsSucceeded: [],
        message: 'Claimed by another replica/run; will resume later.',
      });
      continue;
    }
    if (claimed.outcome === 'COMPLETED' && claimed.ranEffects === 0) {
      result.details.push({
        receiptKey: receipt.receiptKey,
        committedEvidenceId: receipt.committedEvidenceId,
        outcome: 'COMPLETED',
        ran: [],
        skippedAsSucceeded: ['memory', 'revision', 'growth'],
        message: 'Already completed by a concurrent replica; no effect repeated.',
      });
      continue;
    }
    result.processed += 1;
    if (claimed.outcome === 'COMPLETED') result.completed += 1;
    else result.failed += 1;
    const current = await store.getReceipt(receipt.receiptKey);
    const ran: PracticeProjectionName[] = [];
    const skippedAsSucceeded: PracticeProjectionName[] = [];
    for (const name of ORDER) {
      const state = current ? current[`${name}State` as const] : receipt[`${name}State` as const];
      if (state === 'SUCCEEDED') skippedAsSucceeded.push(name);
    }
    result.details.push({
      receiptKey: receipt.receiptKey,
      committedEvidenceId: receipt.committedEvidenceId,
      outcome: claimed.outcome,
      ran,
      skippedAsSucceeded,
    });
  }
  return result;
}

export type PracticeReceiptStoreForReconcile = Pick<
  typeof practicePadProjectionReceiptStore,
  'getReceipt' | 'markProjectionState' | 'claimReceipt' | 'releaseClaim'
>;

export interface PracticeClaimedExecutionResult {
  claim: 'OWNED' | 'LOST';
  outcome: 'COMPLETED' | 'PARTIAL' | 'FAILED' | 'IN_PROGRESS_CLAIMED' | 'MISSING';
  /** Projector effects executed by THIS call (0 for losers/completed). */
  ranEffects: number;
  receipt: PracticeProjectionReceipt | null;
}

/**
 * THE shared single-receipt claimed execution path. BOTH the immediate
 * production PP-10 path and the bounded batch reconciler above MUST use
 * this (never an unclaimed executor, never a private claim wrapper):
 *
 *   claim → fresh read → skip already-SUCCEEDED stages → execute next
 *   incomplete projection → durable conditional state update (bound to
 *   the active claimedBy worker, so a stale worker cannot overwrite
 *   receipt truth after losing its lease) → release claim.
 *
 * Claim loser: executes ZERO projectors; returns a truthful
 * in-progress/completed read (never a fake failure).
 */
export async function executeClaimedProjectionReceipt(args: {
  store: PracticeReceiptStoreForReconcile;
  receiptKey: string;
  workerId: string;
  leaseMs: number;
  nowMs: number;
  projectors: PracticeProjectionProjectors;
  projectorCalls?: Record<PracticeProjectionName, number>;
}): Promise<PracticeClaimedExecutionResult> {
  const claimed = await args.store.claimReceipt(args.receiptKey, args.workerId, args.leaseMs, args.nowMs);
  if (!claimed) {
    const current = await args.store.getReceipt(args.receiptKey);
    const allSucceeded =
      !!current &&
      current.memoryState === 'SUCCEEDED' &&
      current.revisionState === 'SUCCEEDED' &&
      current.growthState === 'SUCCEEDED';
    return {
      claim: 'LOST',
      outcome: allSucceeded ? 'COMPLETED' : 'IN_PROGRESS_CLAIMED',
      ranEffects: 0,
      receipt: current,
    };
  }
  try {
    const fresh = await args.store.getReceipt(args.receiptKey);
    if (!fresh) {
      return { claim: 'OWNED', outcome: 'MISSING', ranEffects: 0, receipt: null };
    }
    const callsBefore = {
      memory: args.projectorCalls?.memory ?? 0,
      revision: args.projectorCalls?.revision ?? 0,
      growth: args.projectorCalls?.growth ?? 0,
    };
    const outcome = await reconcilePracticePadLearningProjectionReceipt({
      store: args.store,
      receipt: fresh,
      projectors: args.projectors,
      projectorCalls: args.projectorCalls,
      claimOwner: args.workerId,
    });
    const ranEffects =
      (args.projectorCalls ? args.projectorCalls.memory - callsBefore.memory : 0) +
      (args.projectorCalls ? args.projectorCalls.revision - callsBefore.revision : 0) +
      (args.projectorCalls ? args.projectorCalls.growth - callsBefore.growth : 0);
    const current = await args.store.getReceipt(args.receiptKey);
    return { claim: 'OWNED', outcome, ranEffects, receipt: current ?? fresh };
  } finally {
    await args.store.releaseClaim(args.receiptKey, args.workerId);
  }
}

/**
 * ONE single-receipt projection executor shared by BOTH:
 *   A. immediate production PP-10 execution (newly committed/current receipt)
 *   B. later bounded batch reconciliation (restart/manual path below)
 *
 * Ordering policy (explicit): memory → revision → Growth, strictly in
 * order. A FAILED projection blocks later projections in the same run;
 * they stay PENDING. Retry resumes at the first non-SUCCEEDED projection
 * and NEVER repeats a SUCCEEDED one. Canonical evidence is never deleted
 * or rolled back here.
 */
export async function reconcilePracticePadLearningProjectionReceipt(args: {
  store: PracticeReceiptStoreForReconcile;
  receipt: PracticeProjectionReceipt;
  projectors: PracticeProjectionProjectors;
  projectorCalls?: Record<PracticeProjectionName, number>;
  /**
   * Active claim owner. When supplied, every durable state transition is
   * conditional on this worker still owning the claim (stale-lease
   * safety); a lost lease surfaces as a truthful PARTIAL via fresh read,
   * never as overwritten truth.
   */
  claimOwner?: string | null;
}): Promise<'COMPLETED' | 'PARTIAL' | 'FAILED'> {
  let receipt = args.receipt;
  const calls = args.projectorCalls;
  let candidate: unknown = {};
  try {
    candidate = JSON.parse(receipt.candidateJson || '{}');
  } catch {
    candidate = {};
  }
  const admitted: PracticeProjectionAdmitted = {
    committedEvidenceId: receipt.committedEvidenceId || '',
    candidate,
  };
  let failed: PracticeProjectionName | null = null;
  for (const name of ORDER) {
    const state = receipt[`${name}State` as const];
    if (state === 'SUCCEEDED') continue; // never repeat success
    try {
      if (calls) calls[name] += 1;
      await args.projectors[name](admitted);
      const updated = await args.store.markProjectionState(
        receipt.receiptKey,
        name,
        'SUCCEEDED',
        null,
        args.claimOwner ?? null,
      );
      // Null with a claim owner means the lease was lost mid-run: keep
      // the fresh durable truth (re-read below); do not overwrite.
      if (updated) receipt = updated;
    } catch (err) {
      failed = name;
      const updated = await args.store.markProjectionState(
        receipt.receiptKey,
        name,
        'FAILED',
        (err as Error)?.message || String(err),
        args.claimOwner ?? null,
      );
      if (updated) receipt = updated;
      break; // ordering policy: later projections wait for retry
    }
  }
  const current = await args.store.getReceipt(receipt.receiptKey);
  const allSucceeded =
    current?.memoryState === 'SUCCEEDED' &&
    current?.revisionState === 'SUCCEEDED' &&
    current?.growthState === 'SUCCEEDED';
  if (allSucceeded) return 'COMPLETED';
  return failed ? 'FAILED' : 'PARTIAL';
}
