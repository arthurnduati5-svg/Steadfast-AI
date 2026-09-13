import type { GrowthAggregate } from './growthAggregateContracts';

export type NoFakeGrowthGuardResult = {
  safe: boolean;
  violations: string[];
  checkedAt: string;
};

export const NO_FAKE_GROWTH_VIOLATION_CODES = {
  DEMO_DATA_AS_LIVE: 'demo_data_marked_live',
  FRONTEND_SYNTHESIZED: 'frontend_synthesized_truth',
  WEAK_AREA_ZERO_EVIDENCE: 'weak_area_zero_evidence_count',
  HIGH_CONFIDENCE_ZERO_EVIDENCE: 'high_confidence_mastery_with_zero_evidence',
  RAW_CHAT_INCLUDED: 'raw_chat_included_in_safe_output',
  RAW_LEARNER_MEMORY_INCLUDED: 'raw_learner_memory_included_in_safe_output',
  RAW_TRANSCRIPT_INCLUDED: 'raw_transcript_included_in_safe_output',
  RAW_PROMPT_INCLUDED: 'raw_prompt_included_in_safe_output',
  MISSING_TRUTH_STATE: 'missing_truth_state',
  MISSING_GENERATED_AT: 'missing_generated_at',
  MISSING_SAFE_META: 'missing_safe_meta',
  ANSWER_KEY_IN_SAFE_OUTPUT: 'answer_key_in_safe_output',
} as const;

export function isGrowthAggregate(value: unknown): value is GrowthAggregate {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.studentIdHash === 'string' &&
    typeof v.generatedAt === 'string' &&
    typeof v.truthState === 'string' &&
    typeof v.safeMeta === 'object' &&
    v.safeMeta !== null
  );
}
