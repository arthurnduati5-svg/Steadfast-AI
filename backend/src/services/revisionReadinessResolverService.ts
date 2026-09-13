import type { RevisionReadiness } from '../contracts/growthAggregateContracts';
import type { LearnerDataTruthState } from '../contracts/learnerDataReliabilityContracts';
import { evaluateDataFreshness } from './dataFreshnessService';

export interface RevisionItemInput {
  id: string;
  skillId?: string;
  createdAt?: string;
  updatedAt?: string;
  scheduledAt?: string;
  reviewedAt?: string;
}

export async function resolveRevisionReadiness(input: {
  studentId: string;
  schoolId?: string | null;
  revisionItems?: RevisionItemInput[];
}): Promise<RevisionReadiness> {
  if (!input.revisionItems || input.revisionItems.length === 0) {
    return {
      dueCount: 0,
      staleCount: 0,
      truthState: 'empty',
      unavailableReason: 'No revision data available for this learner.',
    };
  }

  const now = new Date();
  let dueCount = 0;
  let staleCount = 0;

  for (const item of input.revisionItems) {
    const freshness = evaluateDataFreshness({
      observedAt: item.scheduledAt || item.updatedAt || item.createdAt,
    });

    if (freshness.status === 'stale') {
      staleCount++;
    }

    if (item.scheduledAt) {
      try {
        const scheduledDate = new Date(item.scheduledAt);
        if (!isNaN(scheduledDate.getTime()) && scheduledDate <= now) {
          dueCount++;
        }
      } catch {
        continue;
      }
    }
  }

  let truthState: LearnerDataTruthState;
  if (dueCount > 0) {
    truthState = 'live';
  } else if (staleCount > 0) {
    truthState = 'stale';
  } else {
    truthState = 'partial';
  }

  return {
    dueCount,
    staleCount,
    truthState,
  };
}
