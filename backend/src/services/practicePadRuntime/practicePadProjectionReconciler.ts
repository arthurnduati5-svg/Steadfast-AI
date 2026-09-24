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
    const claimed = await store.claimReceipt(receipt.receiptKey, workerId, leaseMs, nowMs());
    if (!claimed) {
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
    // Post-claim freshness: a receipt completed by a faster replica after
    // our bounded scan must not run again in this run.
    const fresh = await store.getReceipt(receipt.receiptKey);
    if (
      fresh &&
      fresh.memoryState === 'SUCCEEDED' &&
      fresh.revisionState === 'SUCCEEDED' &&
      fresh.growthState === 'SUCCEEDED'
    ) {
      await store.releaseClaim(receipt.receiptKey, workerId);
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
    try {
      const outcome = await reconcilePracticePadLearningProjectionReceipt({
        store,
        receipt,
        projectors: args.projectors,
        projectorCalls: result.projectorCalls,
      });
      if (outcome === 'COMPLETED') result.completed += 1;
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
        outcome,
        ran,
        skippedAsSucceeded,
      });
    } finally {
      await store.releaseClaim(receipt.receiptKey, workerId);
    }
  }
  return result;
}

export type PracticeReceiptStoreForReconcile = Pick<
  typeof practicePadProjectionReceiptStore,
  'getReceipt' | 'markProjectionState'
>;

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
      const updated = await args.store.markProjectionState(receipt.receiptKey, name, 'SUCCEEDED');
      if (updated) receipt = updated;
    } catch (err) {
      failed = name;
      const updated = await args.store.markProjectionState(
        receipt.receiptKey,
        name,
        'FAILED',
        (err as Error)?.message || String(err),
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
