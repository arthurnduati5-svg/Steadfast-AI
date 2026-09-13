import type { SpacedReviewPlan, RevisionPriority, RevisionReason } from './task011Contracts';
import type { ResolvedTutorIdentity } from '../tutorStateContracts';

function nowISO(): string {
  return new Date().toISOString();
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

const DEFAULT_INTERVALS: Record<RevisionPriority, number> = {
  high: 1,
  medium: 3,
  low: 7,
  none: 30,
};

const SECURE_MAINTENANCE_INTERVAL = 14;
const STRONG_MAINTENANCE_INTERVAL = 30;

export class SpacedReviewPlanner {
  planReview(params: {
    skillId: string;
    subject: string;
    topic: string;
    priority: RevisionPriority;
    reason: RevisionReason;
    masteryLevel: string;
    confidenceScore: number;
    mistakeCount: number;
    independentSuccessCount: number;
  }): SpacedReviewPlan {
    let intervalDays = DEFAULT_INTERVALS[params.priority] ?? 7;

    if (params.masteryLevel === 'secure') {
      intervalDays = Math.max(intervalDays, SECURE_MAINTENANCE_INTERVAL);
    } else if (params.masteryLevel === 'strong') {
      intervalDays = Math.max(intervalDays, STRONG_MAINTENANCE_INTERVAL);
    }

    if (params.mistakeCount >= 3) {
      intervalDays = Math.min(intervalDays, 1);
    } else if (params.independentSuccessCount >= 5) {
      intervalDays = Math.min(Math.max(intervalDays, 14), 60);
    }

    intervalDays = Math.max(1, Math.min(intervalDays, 90));

    const dueAt = addDays(new Date(), intervalDays).toISOString();

    return {
      skillId: params.skillId,
      subject: params.subject,
      topic: params.topic,
      intervalDays,
      dueAt,
      priority: params.priority,
      reason: params.reason,
    };
  }

  planBatchReviews(
    items: Array<{
      skillId: string;
      subject: string;
      topic: string;
      priority: RevisionPriority;
      reason: RevisionReason;
      masteryLevel: string;
      confidenceScore: number;
      mistakeCount: number;
      independentSuccessCount: number;
    }>,
  ): SpacedReviewPlan[] {
    return items.map((item) => this.planReview(item));
  }
}

export const spacedReviewPlanner = new SpacedReviewPlanner();
