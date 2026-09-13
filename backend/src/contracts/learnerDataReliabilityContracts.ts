export type LearnerDataSourceKind =
  | 'learner_memory'
  | 'tutor_state'
  | 'mastery_evidence'
  | 'misconception_signal'
  | 'practice_attempt'
  | 'revision_item'
  | 'artifact_learning_signal'
  | 'video_learning_signal'
  | 'teacher_safe_signal'
  | 'system_derived_aggregate'
  | 'unknown';

export type LearnerDataTruthState =
  | 'live'
  | 'partial'
  | 'sparse'
  | 'empty'
  | 'stale'
  | 'unavailable'
  | 'blocked_for_privacy'
  | 'blocked_for_safeguarding'
  | 'fallback_safe_empty';

export const LEARNER_DATA_TRUTH_STATE_LABELS: Record<LearnerDataTruthState, string> = {
  live: 'Sufficient current backend evidence exists with no guard violations.',
  partial: 'Some backend evidence exists but key categories are missing.',
  sparse: 'Learner has minimal history and not enough evidence for strong conclusions.',
  empty: 'No meaningful learner growth data exists yet.',
  stale: 'Evidence exists but is older than freshness thresholds.',
  unavailable: 'Required backing service or storage is unavailable.',
  blocked_for_privacy: 'Data exists but cannot be exposed safely.',
  blocked_for_safeguarding: 'Data exists but is blocked by safeguarding policy.',
  fallback_safe_empty: 'Backend returns empty-safe structure instead of fake data.',
};

export type EvidenceConfidence = 'high' | 'medium' | 'low' | 'unknown';
