// ─────────────────────────────────────────────────────────────
// Steadfast AI — Support Level Consistency Contracts v1
// Canonical support-level contract that bridges existing
// Socratic support levels, hint ladder states, question ladder
// states, and the Socratic Learning Control decision.
//
// This defines ONE canonical support-level model used by:
//   - Socratic Learning Control Core
//   - Prompt assembly
//   - Response safety
//   - Learning Evidence Ledger
//   - Revision Queue
//   - Growth Proof
// ─────────────────────────────────────────────────────────────

// ═══════════════════════════════════════════════════════════════
// Canonical Support Level — superset of SocraticSupportLevel
// ═══════════════════════════════════════════════════════════════

export type CanonicalSupportLevel =
  | 'question_only'
  | 'reframe'
  | 'concept_cue'
  | 'strategy_hint'
  | 'step_check'
  | 'partial_worked_example'
  | 'similar_example'
  | 'reflection_prompt'
  | 'revision_redirect'
  | 'safe_integrity_redirect'
  | 'safeguarding_safe_response'
  | 'full_solution_blocked';

// ═══════════════════════════════════════════════════════════════
// Max Allowed Tutor Move
// ═══════════════════════════════════════════════════════════════

export type MaxAllowedTutorMove =
  | 'ask_question'
  | 'reframe_problem'
  | 'give_concept_cue'
  | 'give_strategy_hint'
  | 'check_student_step'
  | 'give_similar_example'
  | 'give_partial_worked_example'
  | 'redirect_to_revision'
  | 'safe_integrity_redirect'
  | 'safeguarding_safe_response';

// ═══════════════════════════════════════════════════════════════
// Hint Dependency Weight
// ═══════════════════════════════════════════════════════════════

export type HintDependencyWeight = 'none' | 'low' | 'medium' | 'high';

// ═══════════════════════════════════════════════════════════════
// Evidence Signal — controls what evidence should be recorded
// ═══════════════════════════════════════════════════════════════

export interface SupportLevelEvidenceSignal {
  shouldRecordHintGiven: boolean;
  shouldRecordAttemptRequired: boolean;
  shouldRecordHintDependency: boolean;
  hintDependencyWeight: HintDependencyWeight;
}

// ═══════════════════════════════════════════════════════════════
// Support Level Decision — full decision metadata
// ═══════════════════════════════════════════════════════════════

export interface SupportLevelDecision {
  /** Unique decision ID for audit tracing */
  decisionId: string;

  /** The canonical support level for this turn */
  supportLevel: CanonicalSupportLevel;

  /** Current hint ladder level (1-8, or 0 for no hint) */
  hintLevel: string;

  /** Current question ladder type, if applicable */
  questionLadderType?: string;

  /** Whether the student must attempt before receiving help */
  studentAttemptRequired: boolean;

  /** Whether the student has already attempted */
  studentAttemptObserved: boolean;

  /** Whether final answer is blocked */
  finalAnswerBlocked: boolean;

  /** Whether assignment shortcut risk is detected */
  assignmentRisk: boolean;

  /** Whether exam/test risk is detected */
  examRisk: boolean;

  /** Whether academic integrity risk is detected */
  integrityRisk: boolean;

  /** Whether safeguarding risk is detected */
  safeguardingRisk: boolean;

  /** The maximum allowed tutor move — the most permissive move allowed */
  maxAllowedTutorMove: MaxAllowedTutorMove;

  /** All tutor moves explicitly allowed */
  allowedTutorMoves: string[];

  /** All tutor moves explicitly forbidden */
  forbiddenTutorMoves: string[];

  /** The next learner action required */
  nextLearnerAction: string;

  /** Evidence signal — what evidence should be recorded */
  evidenceSignal: SupportLevelEvidenceSignal;

  /** Safe reason for audit/testing — no raw private data */
  safeReason: string;

  /** Internal reason for audit/testing — no raw private data */
  internalReason: string;

  // ── Compile-time privacy guarantees ──
  rawLearnerDataIncluded: false;
  rawPromptIncluded: false;
  rawAiResponseIncluded: false;
  rawTranscriptIncluded: false;
}

// ═══════════════════════════════════════════════════════════════
// Input for building a support-level decision
// ═══════════════════════════════════════════════════════════════

export interface SupportLevelDecisionInput {
  /** Bounded summary of student message signal */
  studentAttemptSignal?: {
    hasAttempted: boolean;
    attemptContent?: string;
    isDirectAnswerRequest: boolean;
  };

  /** Assignment risk signal from no-final-answer policy */
  assignmentRiskSignal?: {
    finalAnswerRequested: boolean;
    assignmentShortcutDetected: boolean;
    examCheatingDetected: boolean;
  };

  /** Academic integrity signal */
  integrityRiskSignal?: {
    integrityActive: boolean;
    signalType: string;
    repeatedShortcutSeeking: boolean;
  };

  /** Safeguarding signal */
  safeguardingSignal?: {
    isActive: boolean;
    signalType: string;
  };

  /** Hint ladder signal */
  hintLadderSignal?: {
    selectedLevel: number;
    label: string;
    nextRecommendedAction: string;
  };

  /** Question ladder signal */
  questionLadderSignal?: {
    selectedType: string;
    nextRecommendedAction: string;
  };

  /** Mistake signal from mistake taxonomy */
  mistakeSignal?: {
    mistakeType: string;
    repeatedMistake: boolean;
    correctionObserved: boolean;
  };

  /** Evidence strength signal from evidence ledger */
  evidenceStrengthSignal?: {
    hasStrongEvidence: boolean;
    hasMasteryCandidate: boolean;
    hasStaleEvidence: boolean;
  };

  /** Hint dependency signal from revision/growth */
  hintDependencySignal?: {
    hintDependencyDetected: boolean;
    hintDependencyLevel: 'none' | 'low' | 'medium' | 'high';
  };

  /** Learner state summary — safe bounded values only */
  learnerStateSummary?: {
    masteryLevel: number | null;
    confidenceLevel: number | null;
    attemptCount: number;
    weakAreaCount: number;
    misconceptionCount: number;
    sparseLearnerState: boolean;
  };

  /** Runtime mode */
  surface: string;
}

// ═══════════════════════════════════════════════════════════════
// Prompt Support Constraints — for prompt assembly
// ═══════════════════════════════════════════════════════════════

export interface PromptSupportConstraints {
  supportLevel: CanonicalSupportLevel;
  hintLevel: string;
  questionLadderType?: string;
  nextLearnerAction: string;
  allowedTutorMoves: string[];
  forbiddenTutorMoves: string[];
  studentAttemptRequired: boolean;
  finalAnswerBlocked: boolean;
  assignmentRisk: boolean;
  examRisk: boolean;
  maxAllowedTutorMove: MaxAllowedTutorMove;
  rawLearnerDataIncluded: false;
  rawPromptIncluded: false;
  rawAiResponseIncluded: false;
  rawTranscriptIncluded: false;
}

// ═══════════════════════════════════════════════════════════════
// Response Safety Support Rules — for response safety service
// ═══════════════════════════════════════════════════════════════

export interface ResponseSafetySupportRules {
  supportLevel: CanonicalSupportLevel;
  blockFinalAnswer: boolean;
  blockAssignmentShortcut: boolean;
  blockDirectSolution: boolean;
  allowPartialWorkedExample: boolean;
  allowSimilarExample: boolean;
  enforceSocraticFraming: boolean;
  maxAllowedTutorMove: MaxAllowedTutorMove;
}

// ═══════════════════════════════════════════════════════════════
// Mapping from numeric hint levels to canonical support levels
// ═══════════════════════════════════════════════════════════════

export const HINT_LEVEL_TO_CANONICAL_MAP: Record<number, CanonicalSupportLevel> = {
  0: 'question_only',
  1: 'question_only',
  2: 'question_only',
  3: 'concept_cue',
  4: 'concept_cue',
  5: 'strategy_hint',
  6: 'strategy_hint',
  7: 'step_check',
  8: 'reframe',
};

// ═══════════════════════════════════════════════════════════════
// Mapping from question ladder types to canonical support levels
// ═══════════════════════════════════════════════════════════════

export const QUESTION_LADDER_TO_CANONICAL_MAP: Record<string, CanonicalSupportLevel> = {
  clarify_what_is_being_asked: 'question_only',
  identify_knowns_and_unknowns: 'reframe',
  activate_prior_knowledge: 'question_only',
  ask_for_first_step: 'strategy_hint',
  check_misconception: 'concept_cue',
  ask_why: 'reframe',
  ask_how_they_know: 'reflection_prompt',
  ask_for_alternative_method: 'strategy_hint',
  ask_to_explain_in_own_words: 'reflection_prompt',
  ask_to_transfer_idea_to_similar_problem: 'similar_example',
};

// ═══════════════════════════════════════════════════════════════
// Mapping from SocraticSupportMode (legacy) to canonical
// ═══════════════════════════════════════════════════════════════

export const SUPPORT_MODE_TO_CANONICAL_MAP: Record<string, CanonicalSupportLevel> = {
  question_first: 'question_only',
  hint_first: 'strategy_hint',
  guided_steps: 'step_check',
  concept_reteach: 'reframe',
  misconception_check: 'concept_cue',
  worked_example_without_final_answer: 'partial_worked_example',
  similar_practice: 'strategy_hint',
  challenge_extension: 'question_only',
  reflection_prompt: 'reflection_prompt',
  safeguarding_escalation: 'safeguarding_safe_response',
};

// ═══════════════════════════════════════════════════════════════
// Default forbidden tutor moves (always forbidden)
// ═══════════════════════════════════════════════════════════════

export const DEFAULT_FORBIDDEN_TUTOR_MOVES: string[] = [
  'give_final_answer',
  'provide_solution',
  'output_answer_key',
  'provide_copy_paste_text',
  'show_complete_worked_solution',
  'reveal_direct_answer',
];

// ═══════════════════════════════════════════════════════════════
// Helper: map CanonicalSupportLevel to MaxAllowedTutorMove
// ═══════════════════════════════════════════════════════════════

export function canonicalLevelToMaxMove(
  level: CanonicalSupportLevel,
): MaxAllowedTutorMove {
  switch (level) {
    case 'question_only': return 'ask_question';
    case 'reframe': return 'reframe_problem';
    case 'concept_cue': return 'give_concept_cue';
    case 'strategy_hint': return 'give_strategy_hint';
    case 'step_check': return 'check_student_step';
    case 'partial_worked_example': return 'give_partial_worked_example';
    case 'similar_example': return 'give_similar_example';
    case 'reflection_prompt': return 'check_student_step';
    case 'revision_redirect': return 'redirect_to_revision';
    case 'safe_integrity_redirect': return 'safe_integrity_redirect';
    case 'safeguarding_safe_response': return 'safeguarding_safe_response';
    case 'full_solution_blocked': return 'redirect_to_revision';
  }
}
