// ─────────────────────────────────────────────────────────────
// Steadfast AI — Spaced Review Service v1
// Schedules future review for weak, partial, stale, or newly
// learned skills.  Uses v1 interval policy — not over-engineered.
// ─────────────────────────────────────────────────────────────

import { createHash } from 'crypto';
import prisma from '../lib/prisma';
import type {
  SpacedReviewItem,
  PracticeAttempt,
  PracticeOutcome,
  SkillMasterySnapshot,
  ReviewScheduleStatus,
  ReviewReason,
} from './practiceMasteryContracts';
import type { ResolvedTutorIdentity } from './tutorStateContracts';

// ── In-memory fallback store ──
const reviewStore = new Map<string, SpacedReviewItem>();
const reviewLookupByKey = new Map<string, string[]>(); // schoolId:studentId -> reviewId[]
const reviewDedupeKey = new Map<string, string[]>(); // dedupeKey -> reviewId[]

let _prismaAvailable: boolean | null = null;

async function isPrismaAvailable(): Promise<boolean> {
  if (_prismaAvailable !== null) return _prismaAvailable;
  try {
    await (prisma as any).$queryRaw`SELECT 1`;
    _prismaAvailable = true;
  } catch {
    _prismaAvailable = false;
  }
  return _prismaAvailable;
}

function nowISO(): string {
  return new Date().toISOString();
}

function generateId(): string {
  return `rev_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function memoryKey(schoolId: string, studentId: string): string {
  return `${schoolId}:${studentId}`;
}

function dedupeKey(schoolId: string, studentId: string, skillId: string): string {
  return `${schoolId}:${studentId}:${skillId}`;
}

/**
 * V1 interval policy.
 */
function computeInterval(outcome: PracticeOutcome, confidenceScore: number): number {
  switch (outcome) {
    case 'incorrect':
      return 1;
    case 'partially_correct':
      return 2;
    case 'correct':
      if (confidenceScore < 0.4) return 3;
      if (confidenceScore < 0.65) return 7;
      return 14;
    default:
      return 3;
  }
}

function computeDueDate(intervalDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + intervalDays);
  return d.toISOString();
}

function isSameDueWindow(dateA: string, dateB: string, windowDays: number): boolean {
  const a = new Date(dateA);
  const b = new Date(dateB);
  const diff = Math.abs(a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24);
  return diff <= windowDays;
}

// ── SpacedReviewService ──

/**
 * Smallest backward-compatible durability extension for crash-safe
 * callers (Practice Pad PP-10). Existing 3-arg callers keep existing
 * behavior: random review IDs, same-window dedupe, swallowed
 * persistence failures (in-memory fallback).
 *
 * When options.idempotencyKey is supplied:
 *   - review identity is deterministic (stable key + skillId), so an
 *     identical retry reuses the SAME durable review — no duplicate.
 * When options.requireDurable is true:
 *   - a database persistence failure THROWS instead of degrading to
 *     in-memory-only success (production must never mark SUCCEEDED
 *     on a swallowed write).
 */
export interface ScheduleReviewOptions {
  idempotencyKey?: string;
  requireDurable?: boolean;
}

/** Deterministic review identity for a stable caller key + skill. No migration: the existing PK carries it. */
export function deterministicReviewId(idempotencyKey: string, skillId: string): string {
  return `pp10_${createHash('sha256').update(`${idempotencyKey}::${skillId}`).digest('hex').slice(0, 24)}`;
}

export class SpacedReviewService {
  /**
   * Schedule review from a practice attempt and optional mastery snapshot.
   * Returns null if no review is needed or a duplicate would be created.
   */
  async scheduleReviewFromAttempt(
    identity: ResolvedTutorIdentity,
    attempt: PracticeAttempt,
    masterySnapshot: SkillMasterySnapshot | null,
    options?: ScheduleReviewOptions,
  ): Promise<SpacedReviewItem | null> {
    const outcome = attempt.outcome;

    // Don't schedule review for non-evaluated attempts
    if (outcome === 'not_evaluated' || outcome === 'unclear') return null;

    const skillIds = attempt.skillIds;
    if (skillIds.length === 0) return null;

    const subject = attempt.subject || 'General';
    const topic = attempt.topic || 'General';

    const reason: ReviewReason =
      outcome === 'incorrect'
        ? 'incorrect_attempt'
        : outcome === 'partially_correct'
          ? 'partial_attempt'
          : 'scheduled_reinforcement';

    const confidenceScore = masterySnapshot?.confidenceScore ?? 0;
    const intervalDays = computeInterval(outcome, confidenceScore);
    const dueAt = computeDueDate(intervalDays);

    const items: SpacedReviewItem[] = [];

    for (const skillId of skillIds) {
      // Stable-identity reuse comes FIRST: an identical retry (same
      // caller key) must return its durable review even inside the same
      // due window, instead of degrading to a null duplicate.
      const stableId =
        options?.idempotencyKey != null && options.idempotencyKey !== ''
          ? deterministicReviewId(options.idempotencyKey, skillId)
          : null;
      if (stableId) {
        const reused = await this._getStableReview(identity, stableId);
        if (reused) {
          items.push(reused);
          continue;
        }
      }
      const dk = dedupeKey(identity.schoolId, identity.studentId, skillId);
      const existingIds = reviewDedupeKey.get(dk) || [];

      // Check for duplicate in same due window
      let isDuplicate = false;
      for (const eid of existingIds) {
        const existing = reviewStore.get(eid);
        if (!existing) continue;
        if (existing.status === 'completed' || existing.status === 'cancelled') continue;
        if (isSameDueWindow(existing.dueAt, dueAt, intervalDays * 0.5)) {
          isDuplicate = true;
          break;
        }
      }

      if (!isDuplicate) {
        // Also check Prisma for duplicates
        const prismaDup = await this._findDuplicatePrismaReview(identity, skillId, dueAt, intervalDays);
        if (prismaDup) {
          isDuplicate = true;
        }
      }

      if (isDuplicate) continue;

      const now = nowISO();
      const reviewId = stableId ?? generateId();
      const review: SpacedReviewItem = {
        reviewId,
        schoolId: identity.schoolId,
        studentId: identity.studentId,
        subject,
        topic,
        skillId,
        skillLabel: masterySnapshot?.skillLabel || skillId.replace(/[_-]/g, ' '),
        masteryId: masterySnapshot?.masteryId || null,
        dueAt,
        intervalDays,
        status: 'scheduled',
        reason,
        createdAt: now,
        completedAt: null,
      };

      reviewStore.set(reviewId, review);
      const mk = memoryKey(identity.schoolId, identity.studentId);
      const ids = reviewLookupByKey.get(mk) || [];
      ids.push(reviewId);
      reviewLookupByKey.set(mk, ids);

      const dedupes = reviewDedupeKey.get(dk) || [];
      dedupes.push(reviewId);
      reviewDedupeKey.set(dk, dedupes);

      await this._persistPrismaReview(review, options?.requireDurable === true ? { requireDurable: true } : undefined);
      items.push(review);
    }

    return items.length > 0 ? items[0] : null;
  }

  /**
   * List due reviews for the learner.
   */
  async listDueReviews(
    identity: ResolvedTutorIdentity,
    options?: {
      subject?: string;
      topic?: string;
      limit?: number;
    },
  ): Promise<SpacedReviewItem[]> {
    const limit = options?.limit || 50;
    const now = nowISO();

    const fromDb = await this._listPrismaDueReviews(identity, now, options);
    if (fromDb && fromDb.length > 0) return fromDb.slice(0, limit);

    // Fallback: in-memory
    const mk = memoryKey(identity.schoolId, identity.studentId);
    const ids = reviewLookupByKey.get(mk) || [];
    const results: SpacedReviewItem[] = [];

    for (const rid of ids) {
      const r = reviewStore.get(rid);
      if (!r) continue;
      if (r.schoolId !== identity.schoolId || r.studentId !== identity.studentId) continue;
      if (r.status === 'completed' || r.status === 'cancelled' || r.status === 'skipped') continue;
      if (r.dueAt > now) continue;
      if (options?.subject && r.subject !== options.subject) continue;
      if (options?.topic && r.topic !== options.topic) continue;
      results.push(r);
    }

    results.sort((a, b) => a.dueAt.localeCompare(b.dueAt));
    return results.slice(0, limit);
  }

  /**
   * List all scheduled reviews (due and upcoming).
   */
  async listReviews(
    identity: ResolvedTutorIdentity,
    options?: {
      subject?: string;
      topic?: string;
      limit?: number;
    },
  ): Promise<SpacedReviewItem[]> {
    const limit = options?.limit || 50;

    const fromDb = await this._listPrismaReviews(identity, options);
    if (fromDb && fromDb.length > 0) return fromDb.slice(0, limit);

    const mk = memoryKey(identity.schoolId, identity.studentId);
    const ids = reviewLookupByKey.get(mk) || [];
    const results: SpacedReviewItem[] = [];

    for (const rid of ids) {
      const r = reviewStore.get(rid);
      if (!r) continue;
      if (r.schoolId !== identity.schoolId || r.studentId !== identity.studentId) continue;
      if (options?.subject && r.subject !== options.subject) continue;
      if (options?.topic && r.topic !== options.topic) continue;
      results.push(r);
    }

    results.sort((a, b) => a.dueAt.localeCompare(b.dueAt));
    return results.slice(0, limit);
  }

  /**
   * Mark a review as completed.
   */
  async completeReview(
    identity: ResolvedTutorIdentity,
    reviewId: string,
  ): Promise<SpacedReviewItem> {
    const r = await this._getReviewInternal(identity, reviewId);
    if (!r) {
      throw new ReviewNotFoundError(reviewId);
    }

    const updated: SpacedReviewItem = {
      ...r,
      status: 'completed',
      completedAt: nowISO(),
    };

    reviewStore.set(reviewId, updated);
    await this._upsertPrismaReview(updated);
    return updated;
  }

  /**
   * Cancel a review.
   */
  async cancelReview(
    identity: ResolvedTutorIdentity,
    reviewId: string,
  ): Promise<SpacedReviewItem> {
    const r = await this._getReviewInternal(identity, reviewId);
    if (!r) {
      throw new ReviewNotFoundError(reviewId);
    }

    const updated: SpacedReviewItem = {
      ...r,
      status: 'cancelled',
    };

    reviewStore.set(reviewId, updated);
    await this._upsertPrismaReview(updated);
    return updated;
  }

  private async _getReviewInternal(
    identity: ResolvedTutorIdentity,
    reviewId: string,
  ): Promise<SpacedReviewItem | null> {
    const mem = reviewStore.get(reviewId);
    if (mem) {
      if (mem.schoolId !== identity.schoolId || mem.studentId !== identity.studentId) return null;
      return mem;
    }
    return this._getPrismaReview(identity, reviewId);
  }

  // ── Prisma helpers ──

  /** Stable-identity read: in-memory first, then the durable row. Scope-checked. */
  private async _getStableReview(
    identity: ResolvedTutorIdentity,
    reviewId: string,
  ): Promise<SpacedReviewItem | null> {
    const mem = reviewStore.get(reviewId);
    if (mem) {
      if (mem.schoolId !== identity.schoolId || mem.studentId !== identity.studentId) return null;
      return mem;
    }
    return this._getPrismaReview(identity, reviewId);
  }

  private async _persistPrismaReview(r: SpacedReviewItem, options?: { requireDurable?: boolean }): Promise<void> {
    const available = await isPrismaAvailable();
    if (!available) return;
    try {
      await (prisma as any).spacedReviewItem.create({
        data: {
          id: r.reviewId,
          schoolId: r.schoolId,
          studentId: r.studentId,
          subject: r.subject,
          topic: r.topic,
          skillId: r.skillId,
          skillLabel: r.skillLabel,
          masteryId: r.masteryId,
          dueAt: new Date(r.dueAt),
          intervalDays: r.intervalDays,
          status: r.status,
          reason: r.reason,
          completedAt: r.completedAt ? new Date(r.completedAt) : null,
        },
      });
    } catch (err) {
      // Create race: a concurrent worker with the same stable identity
      // won the row — reuse it instead of duplicating or failing.
      try {
        const winner = await (prisma as any).spacedReviewItem.findUnique({ where: { id: r.reviewId } });
        if (winner) return;
      } catch {
        // Read-back failed; fall through to durable handling below.
      }
      if (options?.requireDurable === true) {
        throw new Error(
          `SpacedReviewItem persistence failed and requireDurable=true; refusing in-memory-only success. Cause: ${String((err as Error)?.message || err)}`,
        );
      }
      // Legacy fallback: in-memory copy only.
    }
  }

  private async _upsertPrismaReview(r: SpacedReviewItem): Promise<void> {
    const available = await isPrismaAvailable();
    if (!available) return;
    try {
      const existing = await (prisma as any).spacedReviewItem.findUnique({
        where: { id: r.reviewId },
      });
      if (existing) {
        await (prisma as any).spacedReviewItem.update({
          where: { id: r.reviewId },
          data: {
            status: r.status,
            completedAt: r.completedAt ? new Date(r.completedAt) : null,
          },
        });
      } else {
        await this._persistPrismaReview(r);
      }
    } catch {
      // in-memory fallback
    }
  }

  private async _findDuplicatePrismaReview(
    identity: ResolvedTutorIdentity,
    skillId: string,
    dueAt: string,
    intervalDays: number,
  ): Promise<boolean> {
    const available = await isPrismaAvailable();
    if (!available) return false;
    try {
      const records = await (prisma as any).spacedReviewItem.findMany({
        where: {
          schoolId: identity.schoolId,
          studentId: identity.studentId,
          skillId,
          status: { notIn: ['completed', 'cancelled'] },
        },
        take: 5,
      });
      if (!records || records.length === 0) return false;
      for (const r of records) {
        if (isSameDueWindow(r.dueAt.toISOString(), dueAt, intervalDays * 0.5)) {
          return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  }

  private async _listPrismaDueReviews(
    identity: ResolvedTutorIdentity,
    now: string,
    options?: { subject?: string; topic?: string; limit?: number },
  ): Promise<SpacedReviewItem[] | null> {
    const available = await isPrismaAvailable();
    if (!available) return null;
    try {
      const where: Record<string, any> = {
        schoolId: identity.schoolId,
        studentId: identity.studentId,
        dueAt: { lte: new Date(now) },
        status: { notIn: ['completed', 'cancelled', 'skipped'] },
      };
      if (options?.subject) where.subject = options.subject;
      if (options?.topic) where.topic = options.topic;

      const records = await (prisma as any).spacedReviewItem.findMany({
        where,
        orderBy: { dueAt: 'asc' },
        take: options?.limit || 50,
      });
      if (!records || records.length === 0) return null;
      return records.map((r: any) => this._mapPrismaReview(r));
    } catch {
      return null;
    }
  }

  private async _listPrismaReviews(
    identity: ResolvedTutorIdentity,
    options?: { subject?: string; topic?: string; limit?: number },
  ): Promise<SpacedReviewItem[] | null> {
    const available = await isPrismaAvailable();
    if (!available) return null;
    try {
      const where: Record<string, any> = {
        schoolId: identity.schoolId,
        studentId: identity.studentId,
      };
      if (options?.subject) where.subject = options.subject;
      if (options?.topic) where.topic = options.topic;

      const records = await (prisma as any).spacedReviewItem.findMany({
        where,
        orderBy: { dueAt: 'asc' },
        take: options?.limit || 50,
      });
      if (!records || records.length === 0) return null;
      return records.map((r: any) => this._mapPrismaReview(r));
    } catch {
      return null;
    }
  }

  private async _getPrismaReview(
    identity: ResolvedTutorIdentity,
    reviewId: string,
  ): Promise<SpacedReviewItem | null> {
    const available = await isPrismaAvailable();
    if (!available) return null;
    try {
      const record = await (prisma as any).spacedReviewItem.findUnique({
        where: { id: reviewId },
      });
      if (!record) return null;
      if (record.schoolId !== identity.schoolId || record.studentId !== identity.studentId) return null;
      return this._mapPrismaReview(record);
    } catch {
      return null;
    }
  }

  private _mapPrismaReview(record: any): SpacedReviewItem {
    return {
      reviewId: record.id,
      schoolId: record.schoolId,
      studentId: record.studentId,
      subject: record.subject,
      topic: record.topic,
      skillId: record.skillId,
      skillLabel: record.skillLabel || record.skillId,
      masteryId: record.masteryId ?? null,
      dueAt: record.dueAt?.toISOString?.() || nowISO(),
      intervalDays: record.intervalDays ?? 3,
      status: (record.status || 'scheduled') as ReviewScheduleStatus,
      reason: (record.reason || 'scheduled_reinforcement') as ReviewReason,
      createdAt: record.createdAt?.toISOString?.() || nowISO(),
      completedAt: record.completedAt?.toISOString?.() || null,
    };
  }
}

export class ReviewNotFoundError extends Error {
  public code = 'REVIEW_NOT_FOUND';
  public statusCode = 404;
  constructor(reviewId: string) {
    super(`Spaced review item not found: ${reviewId}`);
    this.name = 'ReviewNotFoundError';
  }
}

// Singleton
export const spacedReviewService = new SpacedReviewService();

// For testing
export function _clearReviewStoreForTest(): void {
  reviewStore.clear();
  reviewLookupByKey.clear();
  reviewDedupeKey.clear();
}
