// ─────────────────────────────────────────────────────────────
// Steadfast AI — Artifact-Aware Practice Scheduler v1
// Creates spaced review recommendations based on answer
// correctness and scheduling rules.
// v1 schedule:
//   first successful answer: review in 1 day
//   second successful spaced review: review in 3 days
//   third successful spaced review: review in 7 days
//   incorrect or needs_review: immediate reteach or same-day review
// ─────────────────────────────────────────────────────────────

import type {
  ArtifactAwarePracticeSession,
  ArtifactAwarePracticeItem,
} from './artifactAwarePracticeContracts';

const INTERVAL_FIRST_REVIEW = 1;
const INTERVAL_SECOND_REVIEW = 3;
const INTERVAL_THIRD_REVIEW = 7;
const INTERVAL_IMMEDIATE_RETEACH = 0;

/**
 * Calculate the due date for a spaced review.
 */
export function calculateSpacedReviewDueAt(
  successfulReviewCount: number,
): string {
  let intervalDays: number;

  if (successfulReviewCount <= 0) {
    intervalDays = INTERVAL_FIRST_REVIEW;
  } else if (successfulReviewCount === 1) {
    intervalDays = INTERVAL_SECOND_REVIEW;
  } else {
    intervalDays = INTERVAL_THIRD_REVIEW;
  }

  const dueAt = new Date(Date.now() + intervalDays * 24 * 60 * 60 * 1000);
  return dueAt.toISOString();
}

/**
 * Calculate the due date for an immediate reteach.
 */
export function calculateImmediateReteachDueAt(): string {
  const dueAt = new Date(Date.now() + INTERVAL_IMMEDIATE_RETEACH * 24 * 60 * 60 * 1000);
  return dueAt.toISOString();
}

/**
 * Check if a scheduled review is due.
 */
export function isReviewDue(dueAt: string): boolean {
  try {
    const due = new Date(dueAt);
    const now = new Date();
    return now >= due;
  } catch {
    return false;
  }
}

/**
 * Determine next review schedule based on last evaluated item status.
 */
export function determineArtifactReviewSchedule(
  session: ArtifactAwarePracticeSession,
  lastEvaluatedItem: ArtifactAwarePracticeItem,
): {
  recommendedReviewAt: string | null;
  dueAt: string | null;
  reason: string;
} {
  const answerStatus = lastEvaluatedItem.status;

  if (answerStatus === 'incorrect' || answerStatus === 'needs_review') {
    return {
      recommendedReviewAt: calculateImmediateReteachDueAt(),
      dueAt: calculateImmediateReteachDueAt(),
      reason: 'Immediate reteach needed — review concept same day.',
    };
  }

  if (answerStatus === 'correct') {
    const successfulCount = session.skillIds.length > 0 ? 1 : 0;
    const dueAt = calculateSpacedReviewDueAt(successfulCount);

    const dayLabel = successfulCount <= 0 ? '1' : successfulCount === 1 ? '3' : '7';
    return {
      recommendedReviewAt: dueAt,
      dueAt,
      reason: `Scheduled review in ${dayLabel} day(s) to reinforce learning.`,
    };
  }

  if (answerStatus === 'partially_correct') {
    const dueAt = calculateSpacedReviewDueAt(0);
    return {
      recommendedReviewAt: dueAt,
      dueAt,
      reason: 'Review scheduled in 1 day to reinforce partially learned concepts.',
    };
  }

  return {
    recommendedReviewAt: null,
    dueAt: null,
    reason: 'No review schedule needed.',
  };
}

/**
 * Generate a next-action prompt based on review schedule.
 */
export function generateArtifactReviewPrompt(
  isDue: boolean,
  dueAt: string | null,
  reason: string,
): string | null {
  if (!dueAt) return null;

  if (isDue) {
    return 'Your review is due now. Let us revisit this topic to reinforce your learning from the material.';
  }

  try {
    const due = new Date(dueAt);
    const now = new Date();
    const diffMs = due.getTime() - now.getTime();
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));

    if (diffHours <= 0) {
      return 'Your review is ready. Let us practice to reinforce your understanding of the material.';
    }
    if (diffHours < 24) {
      return `Your review is scheduled in ${diffHours} hour(s). Keep it in mind!`;
    }
    const diffDays = Math.round(diffHours / 24);
    return `Your next review is in ${diffDays} day(s). Regular review helps long-term retention.`;
  } catch {
    return null;
  }
}
