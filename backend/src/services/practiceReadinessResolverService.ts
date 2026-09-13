import type { PracticeReadiness } from '../contracts/growthAggregateContracts';
import type { LearnerDataTruthState } from '../contracts/learnerDataReliabilityContracts';
import { evaluateDataFreshness } from './dataFreshnessService';

export interface PracticeEvidenceInput {
  skillId: string;
  strength: 'weak' | 'emerging' | 'stable' | 'unknown';
  observedAt?: string;
}

export async function resolvePracticeReadiness(input: {
  studentId: string;
  schoolId?: string | null;
  weakAreas?: PracticeEvidenceInput[];
}): Promise<PracticeReadiness> {
  if (!input.weakAreas || input.weakAreas.length === 0) {
    return {
      recommendedCount: 0,
      truthState: 'empty',
      unavailableReason: 'No weak areas or mastery gaps identified. Learner needs more practice evidence.',
    };
  }

  const recommendable = input.weakAreas.filter(wa => {
    if (wa.strength === 'stable') return false;
    if (wa.strength === 'unknown' && !wa.observedAt) return false;
    return true;
  });

  if (recommendable.length === 0) {
    return {
      recommendedCount: 0,
      truthState: 'sparse',
      unavailableReason: 'No actionable weak areas with sufficient evidence for practice recommendations.',
    };
  }

  const latestObserved = recommendable
    .map(r => r.observedAt)
    .filter(Boolean)
    .sort()
    .pop();

  const freshness = evaluateDataFreshness({ observedAt: latestObserved });

  let truthState: LearnerDataTruthState;
  if (freshness.status === 'stale') {
    truthState = 'stale';
  } else {
    truthState = 'live';
  }

  return {
    recommendedCount: recommendable.length,
    truthState,
  };
}
