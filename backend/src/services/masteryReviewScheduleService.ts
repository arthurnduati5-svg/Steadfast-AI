// ─────────────────────────────────────────────────────────────
// Steadfast AI — Mastery Review Schedule Service v1
// Creates reviewAfter signals and spaced review schedules
// based on mastery level, confidence, and evidence.
// ─────────────────────────────────────────────────────────────

import type { MasteryLevel, MasteryConfidence } from './masteryContracts';

function nowISO(): string {
  return new Date().toISOString();
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// ── Review interval policy ──

const REVIEW_INTERVALS: Record<MasteryLevel, { minDays: number; maxDays: number }> = {
  unknown: { minDays: 1, maxDays: 1 },
  introduced: { minDays: 1, maxDays: 2 },
  emerging: { minDays: 2, maxDays: 3 },
  developing: { minDays: 3, maxDays: 5 },
  proficient: { minDays: 7, maxDays: 14 },
  mastered: { minDays: 21, maxDays: 45 },
  regressing: { minDays: 1, maxDays: 2 },
  needs_remediation: { minDays: 1, maxDays: 1 },
};

// ── MasteryReviewScheduleService ──

export class MasteryReviewScheduleService {
  /**
   * Compute review after date based on mastery level and confidence.
   * Returns an ISO date string or null if no review needed.
   */
  computeReviewAfter(
    masteryLevel: MasteryLevel,
    confidence: MasteryConfidence,
    streakCorrect: number,
    streakIncorrect: number,
  ): string | null {
    const interval = REVIEW_INTERVALS[masteryLevel];
    if (!interval) return null;

    // Faster review for weak/regressing skills
    if (masteryLevel === 'needs_remediation' || masteryLevel === 'regressing') {
      return addDays(new Date(), interval.minDays).toISOString();
    }

    // Adjust interval based on confidence
    const confMultiplier: Record<MasteryConfidence, number> = {
      low: 0.7,
      medium: 1.0,
      high: 1.3,
    };

    const multiplier = confMultiplier[confidence] || 1.0;
    const baseDays = (interval.minDays + interval.maxDays) / 2;
    const adjustedDays = Math.round(baseDays * multiplier);

    // Shorter if still struggling
    if (streakIncorrect > 0 && masteryLevel !== 'mastered') {
      return addDays(new Date(), Math.max(1, adjustedDays - streakIncorrect * 2)).toISOString();
    }

    // Longer if strong streaks
    if (streakCorrect >= 3 && (masteryLevel === 'proficient' || masteryLevel === 'mastered')) {
      return addDays(new Date(), adjustedDays + streakCorrect * 2).toISOString();
    }

    return addDays(new Date(), Math.max(1, adjustedDays)).toISOString();
  }

  /**
   * Compute review interval in days.
   */
  computeReviewIntervalDays(
    masteryLevel: MasteryLevel,
    confidence: MasteryConfidence,
  ): number {
    const interval = REVIEW_INTERVALS[masteryLevel];
    if (!interval) return 7;

    const confMultiplier: Record<MasteryConfidence, number> = {
      low: 0.7,
      medium: 1.0,
      high: 1.3,
    };

    const multiplier = confMultiplier[confidence] || 1.0;
    const baseDays = (interval.minDays + interval.maxDays) / 2;
    return Math.max(1, Math.round(baseDays * multiplier));
  }

  /**
   * Check if a review is due based on reviewAfter date.
   */
  isReviewDue(reviewAfter: string | null | undefined): boolean {
    if (!reviewAfter) return false;
    const now = new Date();
    const due = new Date(reviewAfter);
    return due <= now;
  }

  /**
   * Build a review summary string.
   */
  buildReviewSummary(
    masteryLevel: MasteryLevel,
    confidence: MasteryConfidence,
    intervalDays: number,
  ): string {
    const levelLabel = masteryLevel.replace(/_/g, ' ');
    return `Review in ${intervalDays} day(s) — ${levelLabel} (${confidence} confidence)`;
  }
}

// Singleton
export const masteryReviewScheduleService = new MasteryReviewScheduleService();
