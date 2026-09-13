import type { LearnerDataSourceKind } from './learnerDataReliabilityContracts';

export type FreshnessStatus = 'fresh' | 'aging' | 'stale' | 'unknown';

export type DataFreshnessState = {
  status: FreshnessStatus;
  ageMs?: number;
  staleAfterMs?: number;
  checkedAt: string;
};

export const DEFAULT_FRESHNESS_THRESHOLDS_MS: Record<string, number> = {
  learner_memory: 7 * 24 * 60 * 60 * 1000,
  tutor_state: 24 * 60 * 60 * 1000,
  mastery_evidence: 14 * 24 * 60 * 60 * 1000,
  misconception_signal: 30 * 24 * 60 * 60 * 1000,
  practice_attempt: 30 * 24 * 60 * 60 * 1000,
  revision_item: 7 * 24 * 60 * 60 * 1000,
  artifact_learning_signal: 30 * 24 * 60 * 60 * 1000,
  video_learning_signal: 30 * 24 * 60 * 60 * 1000,
  teacher_safe_signal: 60 * 24 * 60 * 60 * 1000,
  system_derived_aggregate: 7 * 24 * 60 * 60 * 1000,
  unknown: 0,
};

export function getFreshnessThreshold(sourceKind: LearnerDataSourceKind): number {
  return DEFAULT_FRESHNESS_THRESHOLDS_MS[sourceKind] ?? DEFAULT_FRESHNESS_THRESHOLDS_MS.unknown;
}

export const AGING_FACTOR = 0.75;
