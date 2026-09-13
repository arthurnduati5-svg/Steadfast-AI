// ─────────────────────────────────────────────────────────────
// Steadfast AI — Learning Evidence Ledger Contracts v1
// Privacy-safe canonical evidence contract for all learning
// surfaces. Extends existing SocraticLearningEvidenceEvent
// with source quality, freshness, confidence scoring, and
// structured mistake taxonomy integration.
//
// Never includes raw chat, raw prompts, raw AI responses,
// raw transcripts, or raw learner memory.
// ─────────────────────────────────────────────────────────────

// ═══════════════════════════════════════════════════════════════
// Surface Types
// ═══════════════════════════════════════════════════════════════

export type LearningEvidenceSurface =
  | 'live_chat'
  | 'chat_pipeline'
  | 'practice'
  | 'artifact'
  | 'video'
  | 'revision'
  | 'assessment_support'
  | 'unknown';

// ═══════════════════════════════════════════════════════════════
// Event Type
// ═══════════════════════════════════════════════════════════════

export type LearningEvidenceEventType =
  | 'student_attempt_requested'
  | 'student_attempt_observed'
  | 'hint_given'
  | 'socratic_question_answered'
  | 'mistake_signal_observed'
  | 'correction_observed'
  | 'reflection_observed'
  | 'retry_observed'
  | 'transfer_attempt_observed'
  | 'strategy_explanation_observed'
  | 'integrity_redirect'
  | 'response_safety_transform'
  | 'practice_attempt_completed'
  | 'artifact_reasoning_observed'
  | 'video_learning_signal_observed'
  | 'revision_item_completed'
  | 'mastery_evidence_candidate'
  | 'growth_evidence_observed'
  | 'safeguarding_safe_response';

// ═══════════════════════════════════════════════════════════════
// Evidence Quality Types
// ═══════════════════════════════════════════════════════════════

export type LearningEvidenceStrength =
  | 'none'
  | 'weak'
  | 'moderate'
  | 'strong'
  | 'mastery_candidate';

export type LearningEvidenceFreshness =
  | 'fresh'
  | 'recent'
  | 'stale'
  | 'expired'
  | 'unknown';

export type LearningEvidenceSourceQuality =
  | 'real'
  | 'synthetic_test'
  | 'demo'
  | 'fallback'
  | 'unknown';

// ═══════════════════════════════════════════════════════════════
// Mistake Taxonomy Code (forward reference — full taxonomy in
// mistakeTaxonomyContracts.ts)
// ═══════════════════════════════════════════════════════════════

export type MistakeTaxonomyCode =
  | 'conceptual_misunderstanding'
  | 'procedure_gap'
  | 'calculation_error'
  | 'reading_comprehension_error'
  | 'question_misread'
  | 'reasoning_jump'
  | 'evidence_missing'
  | 'source_misuse'
  | 'formula_misuse'
  | 'vocabulary_gap'
  | 'attention_to_detail'
  | 'strategy_selection_error'
  | 'transfer_gap'
  | 'overreliance_on_answer'
  | 'integrity_risk'
  | 'unknown';

// ═══════════════════════════════════════════════════════════════
// Canonical Learning Evidence Ledger Event
// ═══════════════════════════════════════════════════════════════

export interface LearningEvidenceLedgerEvent {
  /** Unique event ID */
  eventId: string;

  /** Hashed learner identifier — never the raw student ID */
  learnerIdHash?: string;

  /** Subject identifier */
  subjectId?: string;

  /** Skill identifier */
  skillId?: string;

  /** Topic identifier */
  topicId?: string;

  /** Surface where the event originated */
  surface: LearningEvidenceSurface;

  /** Event type describing what learning activity occurred */
  eventType: LearningEvidenceEventType;

  /** Strength of evidence this event represents */
  evidenceStrength: LearningEvidenceStrength;

  /** Freshness of the evidence */
  freshness: LearningEvidenceFreshness;

  /** Source quality — real, demo, fallback, synthetic_test */
  sourceQuality: LearningEvidenceSourceQuality;

  /** Safe summary of what happened — no raw private data */
  safeSummary: string;

  /** Mistake taxonomy code, if applicable */
  mistakeType?: MistakeTaxonomyCode;

  /** Support level at the time of this event */
  supportLevel?: string;

  /** Hint level at the time of this event */
  hintLevel?: string;

  /** Number of attempts observed up to this event */
  attemptCount?: number;

  /** Whether a correction was observed */
  correctionObserved?: boolean;

  /** Whether reflection was observed */
  reflectionObserved?: boolean;

  /** Whether transfer (applying knowledge to new context) was observed */
  transferObserved?: boolean;

  /** Confidence score for this event (0-1) */
  confidenceScore: number;

  /** When the event was created */
  createdAt: string;

  /** When this event expires (if applicable) */
  expiresAt?: string;

  // ── Compile-time privacy guarantees ──
  rawLearnerDataIncluded: false;
  rawPromptIncluded: false;
  rawAiResponseIncluded: false;
  rawTranscriptIncluded: false;
  rawLearnerMemoryIncluded: false;
}

// ═══════════════════════════════════════════════════════════════
// Validation Result
// ═══════════════════════════════════════════════════════════════

export interface LearningEvidenceValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  downgradedStrength?: LearningEvidenceStrength;
}

// ═══════════════════════════════════════════════════════════════
// Summary Queries
// ═══════════════════════════════════════════════════════════════

export interface EvidenceSummaryInput {
  learnerIdHash?: string;
  subjectId?: string;
  skillId?: string;
  topicId?: string;
  includeDemoData?: boolean;
}

export interface EvidenceSummary {
  totalEvents: number;
  byStrength: Record<LearningEvidenceStrength, number>;
  bySurface: Record<string, number>;
  byEventType: Record<string, number>;
  byMistakeType: Record<string, number>;
  strongestStrength: LearningEvidenceStrength;
  hasRealEvidence: boolean;
  hasOnlyDemoFallback: boolean;
  isSparse: boolean;
  freshCount: number;
  staleCount: number;
}

export interface RevisionEvidenceInput {
  learnerIdHash?: string;
  subjectId?: string;
  skillId?: string;
  topicId?: string;
  minStrength?: LearningEvidenceStrength;
  includeCompletedRevision?: boolean;
}

export interface GrowthProofEvidenceInput {
  learnerIdHash?: string;
  subjectId?: string;
  skillId?: string;
  topicId?: string;
  requireStrongEvidence?: boolean;
  includeDemoFallback?: boolean;
}

// ═══════════════════════════════════════════════════════════════
// Validation Rules (compile-time constants)
// ═══════════════════════════════════════════════════════════════

export const LEDGER_CONSTANTS = {
  MAX_SAFE_SUMMARY_LENGTH: 500,
  MAX_EVENT_ID_LENGTH: 128,
  MIN_CONFIDENCE_SCORE: 0,
  MAX_CONFIDENCE_SCORE: 1,
  STALE_AFTER_DAYS: 14,
  EXPIRED_AFTER_DAYS: 90,
} as const;

export const STRENGTH_ORDER: LearningEvidenceStrength[] = [
  'none',
  'weak',
  'moderate',
  'strong',
  'mastery_candidate',
];

// ═══════════════════════════════════════════════════════════════
// Strength comparison helper
// ═══════════════════════════════════════════════════════════════

export function compareStrength(
  a: LearningEvidenceStrength,
  b: LearningEvidenceStrength,
): number {
  const ai = STRENGTH_ORDER.indexOf(a);
  const bi = STRENGTH_ORDER.indexOf(b);
  return ai - bi;
}

export function isStrengthAtLeast(
  strength: LearningEvidenceStrength,
  minimum: LearningEvidenceStrength,
): boolean {
  return compareStrength(strength, minimum) >= 0;
}

// ═══════════════════════════════════════════════════════════════
// Freshness computation
// ═══════════════════════════════════════════════════════════════

export function computeFreshness(createdAt: string, now?: string): LearningEvidenceFreshness {
  try {
    const created = new Date(createdAt).getTime();
    const current = now ? new Date(now).getTime() : Date.now();
    const ageMs = current - created;
    const staleMs = LEDGER_CONSTANTS.STALE_AFTER_DAYS * 24 * 60 * 60 * 1000;
    const expiredMs = LEDGER_CONSTANTS.EXPIRED_AFTER_DAYS * 24 * 60 * 60 * 1000;

    if (isNaN(ageMs) || ageMs < 0) return 'unknown';
    if (ageMs < 24 * 60 * 60 * 1000) return 'fresh';
    if (ageMs < staleMs) return 'recent';
    if (ageMs < expiredMs) return 'stale';
    return 'expired';
  } catch {
    return 'unknown';
  }
}

// ═══════════════════════════════════════════════════════════════
// Event validation
// ═══════════════════════════════════════════════════════════════

export function validateLearningEvidenceEvent(
  event: LearningEvidenceLedgerEvent,
): LearningEvidenceValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!event.eventId || event.eventId.length > LEDGER_CONSTANTS.MAX_EVENT_ID_LENGTH) {
    errors.push('eventId is required and must be <= 128 chars');
  }

  if (!event.surface) {
    errors.push('surface is required');
  }

  if (!event.eventType) {
    errors.push('eventType is required');
  }

  if (!event.safeSummary || event.safeSummary.length === 0) {
    errors.push('safeSummary is required');
  }

  if (event.safeSummary && event.safeSummary.length > LEDGER_CONSTANTS.MAX_SAFE_SUMMARY_LENGTH) {
    errors.push(`safeSummary must be <= ${LEDGER_CONSTANTS.MAX_SAFE_SUMMARY_LENGTH} chars`);
  }

  if (!event.evidenceStrength) {
    errors.push('evidenceStrength is required');
  }

  if (!event.sourceQuality) {
    errors.push('sourceQuality is required');
  }

  // Confidence score range
  if (
    typeof event.confidenceScore !== 'number' ||
    event.confidenceScore < LEDGER_CONSTANTS.MIN_CONFIDENCE_SCORE ||
    event.confidenceScore > LEDGER_CONSTANTS.MAX_CONFIDENCE_SCORE
  ) {
    errors.push(`confidenceScore must be between ${LEDGER_CONSTANTS.MIN_CONFIDENCE_SCORE} and ${LEDGER_CONSTANTS.MAX_CONFIDENCE_SCORE}`);
  }

  // Privacy guarantees — must always be false
  if (event.rawLearnerDataIncluded !== false) {
    errors.push('rawLearnerDataIncluded must be false');
  }
  if (event.rawPromptIncluded !== false) {
    errors.push('rawPromptIncluded must be false');
  }
  if (event.rawAiResponseIncluded !== false) {
    errors.push('rawAiResponseIncluded must be false');
  }
  if (event.rawTranscriptIncluded !== false) {
    errors.push('rawTranscriptIncluded must be false');
  }
  if (event.rawLearnerMemoryIncluded !== false) {
    errors.push('rawLearnerMemoryIncluded must be false');
  }

  // Warning: demo/fallback events cannot produce mastery alone
  if (
    event.sourceQuality === 'demo' ||
    event.sourceQuality === 'fallback' ||
    event.sourceQuality === 'synthetic_test'
  ) {
    if (event.evidenceStrength === 'mastery_candidate') {
      warnings.push('Demo/fallback/synthetic_test events cannot produce mastery alone. Downgrading evidence strength.');
    }
  }

  // Warning: weak evidence cannot produce mastery alone
  if (event.evidenceStrength === 'weak') {
    warnings.push('Weak evidence cannot produce mastery alone.');
  }

  // Warning: stale evidence cannot produce current mastery alone
  if (event.freshness === 'stale' || event.freshness === 'expired') {
    if (event.evidenceStrength === 'mastery_candidate') {
      warnings.push('Stale/expired evidence cannot produce current mastery alone.');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
