// ─────────────────────────────────────────────────────────────
// Steadfast AI — Support Level Consistency Service v1
// Canonical service that builds support-level decisions from
// safe input signals, normalizes support levels from various
// sources, and produces consistent outputs for all downstream
// systems (prompt assembly, response safety, evidence ledger,
// revision queue, growth proof).
// ─────────────────────────────────────────────────────────────

import {
  type CanonicalSupportLevel,
  type SupportLevelDecision,
  type SupportLevelDecisionInput,
  type SupportLevelEvidenceSignal,
  type PromptSupportConstraints,
  type ResponseSafetySupportRules,
  type MaxAllowedTutorMove,
  type HintDependencyWeight,
  HINT_LEVEL_TO_CANONICAL_MAP,
  QUESTION_LADDER_TO_CANONICAL_MAP,
  DEFAULT_FORBIDDEN_TUTOR_MOVES,
  canonicalLevelToMaxMove,
} from './supportLevelConsistencyContracts';

// ═══════════════════════════════════════════════════════════════
// Decision ID Generator
// ═══════════════════════════════════════════════════════════════

let _decisionCounter = 0;

export function generateSupportDecisionId(): string {
  _decisionCounter += 1;
  const timestamp = Date.now().toString(36);
  const counter = _decisionCounter.toString(36);
  const random = Math.random().toString(36).slice(2, 6);
  return `spc_${timestamp}_${counter}_${random}`;
}

// ═══════════════════════════════════════════════════════════════
// Normalize any input to canonical support level
// ═══════════════════════════════════════════════════════════════

export function normalizeSupportLevel(input: unknown): CanonicalSupportLevel {
  if (typeof input === 'number') {
    return HINT_LEVEL_TO_CANONICAL_MAP[input] || 'question_only';
  }
  if (typeof input === 'string') {
    const valid: CanonicalSupportLevel[] = [
      'question_only', 'reframe', 'concept_cue', 'strategy_hint',
      'step_check', 'partial_worked_example', 'similar_example',
      'reflection_prompt', 'revision_redirect', 'safe_integrity_redirect',
      'safeguarding_safe_response', 'full_solution_blocked',
    ];
    if (valid.includes(input as CanonicalSupportLevel)) {
      return input as CanonicalSupportLevel;
    }
    // Check legacy maps
    const fromModeMap: Record<string, CanonicalSupportLevel> = {
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
    if (fromModeMap[input]) return fromModeMap[input];
  }
  return 'question_only';
}

// ═══════════════════════════════════════════════════════════════
// Derive support level from signals
// ═══════════════════════════════════════════════════════════════

export function deriveCanonicalSupportLevel(
  hintLevel: number,
  safeguardingActive: boolean,
  integritySignal: string,
  finalAnswerBlocked: boolean,
): CanonicalSupportLevel {
  if (safeguardingActive) return 'safeguarding_safe_response';
  if (integritySignal === 'exam_or_quiz_cheating_signal') return 'full_solution_blocked';
  if (integritySignal === 'direct_final_answer_request') return 'full_solution_blocked';
  if (integritySignal === 'possible_homework_answer_request') return 'safe_integrity_redirect';
  if (integritySignal === 'repeated_shortcut_seeking') return 'safe_integrity_redirect';
  if (finalAnswerBlocked) return 'step_check';
  if (hintLevel <= 0) return 'question_only';
  if (hintLevel <= 2) return 'question_only';
  if (hintLevel <= 4) return 'concept_cue';
  if (hintLevel <= 6) return 'strategy_hint';
  if (hintLevel <= 7) return 'step_check';
  if (hintLevel >= 8) return 'reframe';
  return 'question_only';
}

// ═══════════════════════════════════════════════════════════════
// Build the full support-level decision from input signals
// ═══════════════════════════════════════════════════════════════

export function buildSupportLevelDecision(
  input: SupportLevelDecisionInput,
): SupportLevelDecision {
  const decisionId = generateSupportDecisionId();

  const safeguardingActive = input.safeguardingSignal?.isActive ?? false;
  const integritySignalType = input.integrityRiskSignal?.signalType ?? 'none';
  const integrityActive = input.integrityRiskSignal?.integrityActive ?? false;
  const assignmentShortcutDetected = input.assignmentRiskSignal?.assignmentShortcutDetected ?? false;
  const examCheatingDetected = input.assignmentRiskSignal?.examCheatingDetected ?? false;
  const finalAnswerRequested = input.assignmentRiskSignal?.finalAnswerRequested ?? false;
  const finalAnswerBlocked = finalAnswerRequested || assignmentShortcutDetected || examCheatingDetected;
  const hasAttempted = input.studentAttemptSignal?.hasAttempted ?? false;
  const isDirectAnswerRequest = input.studentAttemptSignal?.isDirectAnswerRequest ?? false;
  const hintLevel = input.hintLadderSignal?.selectedLevel ?? 0;
  const questionType = input.questionLadderSignal?.selectedType;
  const hintDependencyDetected = input.hintDependencySignal?.hintDependencyDetected ?? false;
  const hintDependencyLevel = input.hintDependencySignal?.hintDependencyLevel ?? 'none';
  const sparseState = input.learnerStateSummary?.sparseLearnerState ?? false;
  const repeatedMistake = input.mistakeSignal?.repeatedMistake ?? false;
  const correctionObserved = input.mistakeSignal?.correctionObserved ?? false;
  const repeatedShortcut = input.integrityRiskSignal?.repeatedShortcutSeeking ?? false;
  const hasStrongEvidence = input.evidenceStrengthSignal?.hasStrongEvidence ?? false;

  // 1. Derive canonical support level
  const supportLevel = deriveCanonicalSupportLevel(
    hintLevel,
    safeguardingActive,
    integritySignalType,
    finalAnswerBlocked,
  );

  // 2. Derive allowed and forbidden tutor moves
  const allowedTutorMoves = buildAllowedTutorMoves(
    supportLevel,
    safeguardingActive,
    integrityActive,
    repeatedShortcut,
    hintDependencyDetected,
    sparseState,
  );

  const forbiddenTutorMoves = buildForbiddenTutorMoves(
    supportLevel,
    finalAnswerBlocked,
    safeguardingActive,
  );

  // 3. Derive max allowed tutor move
  const maxMove = canonicalLevelToMaxMove(supportLevel);

  // 4. Derive next learner action
  const nextLearnerAction = buildNextLearnerAction(
    supportLevel,
    safeguardingActive,
    integrityActive,
    hasAttempted,
    isDirectAnswerRequest,
    hintDependencyDetected,
    repeatedMistake,
    correctionObserved,
    sparseState,
  );

  // 5. Derive evidence signal
  const evidenceSignal = buildEvidenceSignal(
    supportLevel,
    hintLevel,
    hintDependencyDetected,
    hintDependencyLevel,
    hasAttempted,
  );

  // 6. Build reasons
  const safeReason = buildSafeReason(supportLevel, safeguardingActive, finalAnswerBlocked);
  const internalReason = buildInternalReason(
    supportLevel,
    hintLevel,
    safeguardingActive,
    integritySignalType,
    finalAnswerBlocked,
    hintDependencyDetected,
    sparseState,
  );

  return {
    decisionId,
    supportLevel,
    hintLevel: String(hintLevel),
    questionLadderType: questionType,
    studentAttemptRequired: !hasAttempted && (finalAnswerBlocked || integrityActive || isDirectAnswerRequest),
    studentAttemptObserved: hasAttempted,
    finalAnswerBlocked,
    assignmentRisk: assignmentShortcutDetected,
    examRisk: examCheatingDetected,
    integrityRisk: integrityActive || repeatedShortcut,
    safeguardingRisk: safeguardingActive,
    maxAllowedTutorMove: maxMove,
    allowedTutorMoves,
    forbiddenTutorMoves,
    nextLearnerAction,
    evidenceSignal,
    safeReason,
    internalReason,
    rawLearnerDataIncluded: false,
    rawPromptIncluded: false,
    rawAiResponseIncluded: false,
    rawTranscriptIncluded: false,
  };
}

// ═══════════════════════════════════════════════════════════════
// Build allowed tutor moves
// ═══════════════════════════════════════════════════════════════

function buildAllowedTutorMoves(
  supportLevel: CanonicalSupportLevel,
  safeguardingActive: boolean,
  integrityActive: boolean,
  repeatedShortcut: boolean,
  hintDependencyDetected: boolean,
  sparseState: boolean,
): string[] {
  const moves: string[] = ['ask_question', 'provide_feedback_without_answer'];

  if (safeguardingActive) {
    moves.push('provide_supportive_guidance', 'refer_to_human_support');
    return moves;
  }

  if (integrityActive || repeatedShortcut) {
    moves.push('redirect_to_socratic_learning', 'ask_for_attempt');
    return moves;
  }

  if (supportLevel === 'question_only' || supportLevel === 'reframe') {
    moves.push('ask_question', 'explain_concept');
    return moves;
  }

  if (supportLevel === 'concept_cue') {
    moves.push('give_hint', 'explain_concept', 'ask_question');
    return moves;
  }

  if (supportLevel === 'strategy_hint' || supportLevel === 'step_check') {
    moves.push('give_hint', 'check_understanding', 'suggest_practice', 'ask_question');
    return moves;
  }

  if (supportLevel === 'partial_worked_example' || supportLevel === 'similar_example') {
    moves.push('give_hint', 'suggest_practice', 'check_understanding', 'ask_question');
    return moves;
  }

  if (supportLevel === 'reflection_prompt') {
    moves.push('ask_question', 'check_understanding');
    return moves;
  }

  if (supportLevel === 'revision_redirect' || hintDependencyDetected) {
    moves.push('redirect_to_revision', 'suggest_practice', 'ask_question');
    return moves;
  }

  moves.push('ask_question', 'explain_concept', 'check_understanding');
  return moves;
}

// ═══════════════════════════════════════════════════════════════
// Build forbidden tutor moves
// ═══════════════════════════════════════════════════════════════

function buildForbiddenTutorMoves(
  supportLevel: CanonicalSupportLevel,
  finalAnswerBlocked: boolean,
  safeguardingActive: boolean,
): string[] {
  const moves = [...DEFAULT_FORBIDDEN_TUTOR_MOVES];

  if (finalAnswerBlocked || supportLevel === 'full_solution_blocked') {
    moves.push('show_solution', 'give_complete_answer');
  }

  if (supportLevel === 'safe_integrity_redirect' || supportLevel === 'safeguarding_safe_response') {
    moves.push('continue_normal_tutoring');
  }

  if (supportLevel === 'partial_worked_example' || supportLevel === 'similar_example') {
    moves.push('give_current_assignment_answer');
  }

  return [...new Set(moves)].filter(Boolean);
}

// ═══════════════════════════════════════════════════════════════
// Build next learner action
// ═══════════════════════════════════════════════════════════════

function buildNextLearnerAction(
  supportLevel: CanonicalSupportLevel,
  safeguardingActive: boolean,
  integrityActive: boolean,
  hasAttempted: boolean,
  isDirectAnswerRequest: boolean,
  hintDependencyDetected: boolean,
  repeatedMistake: boolean,
  correctionObserved: boolean,
  sparseState: boolean,
): string {
  if (safeguardingActive) {
    return 'Speak with a trusted adult about your concerns.';
  }
  if (integrityActive || isDirectAnswerRequest) {
    return 'Show what you have tried so far before I can help.';
  }
  if (hintDependencyDetected) {
    return 'Review what you have learned and try a similar problem on your own.';
  }
  if (repeatedMistake && !correctionObserved) {
    return 'Review the concept and correct your approach.';
  }
  if (supportLevel === 'question_only' || supportLevel === 'reframe') {
    return 'Answer the question above to demonstrate your understanding.';
  }
  if (supportLevel === 'concept_cue' || supportLevel === 'strategy_hint') {
    return 'Explain your reasoning based on the hint provided.';
  }
  if (supportLevel === 'step_check') {
    return 'Check your current step and correct it if needed.';
  }
  if (supportLevel === 'partial_worked_example' || supportLevel === 'similar_example') {
    return 'Apply what you learned to a similar problem on your own.';
  }
  if (supportLevel === 'reflection_prompt') {
    return 'Reflect on what you have learned so far.';
  }
  if (supportLevel === 'revision_redirect') {
    return 'Review the material and try a practice question.';
  }
  return 'Respond to the tutor to continue learning.';
}

// ═══════════════════════════════════════════════════════════════
// Build evidence signal
// ═══════════════════════════════════════════════════════════════

function buildEvidenceSignal(
  supportLevel: CanonicalSupportLevel,
  hintLevel: number,
  hintDependencyDetected: boolean,
  hintDependencyLevel: HintDependencyWeight,
  hasAttempted: boolean,
): SupportLevelEvidenceSignal {
  const shouldRecordHintGiven = hintLevel > 0;
  const shouldRecordAttemptRequired = !hasAttempted;
  const shouldRecordHintDependency = hintDependencyDetected || hintLevel >= 5;

  let dependencyWeight: HintDependencyWeight = 'none';
  if (hintDependencyDetected) {
    dependencyWeight = hintDependencyLevel !== 'none' ? hintDependencyLevel : 'high';
  } else if (hintLevel >= 7) {
    dependencyWeight = 'medium';
  } else if (hintLevel >= 5) {
    dependencyWeight = 'low';
  }

  return {
    shouldRecordHintGiven,
    shouldRecordAttemptRequired,
    shouldRecordHintDependency,
    hintDependencyWeight: dependencyWeight,
  };
}

// ═══════════════════════════════════════════════════════════════
// Build reason strings
// ═══════════════════════════════════════════════════════════════

function buildSafeReason(
  supportLevel: CanonicalSupportLevel,
  safeguardingActive: boolean,
  finalAnswerBlocked: boolean,
): string {
  if (safeguardingActive) return 'Safeguarding risk detected; safe response routed.';
  if (finalAnswerBlocked) return 'Final answer request blocked; Socratic guidance provided.';
  return `Support level: ${supportLevel}.`;
}

function buildInternalReason(
  supportLevel: CanonicalSupportLevel,
  hintLevel: number,
  safeguardingActive: boolean,
  integritySignalType: string,
  finalAnswerBlocked: boolean,
  hintDependencyDetected: boolean,
  sparseState: boolean,
): string {
  const parts: string[] = [
    `supportLevel=${supportLevel}`,
    `hintLevel=${hintLevel}`,
  ];
  if (safeguardingActive) parts.push('safeguarding=true');
  if (integritySignalType !== 'none') parts.push(`integrity=${integritySignalType}`);
  if (finalAnswerBlocked) parts.push('finalAnswerBlocked=true');
  if (hintDependencyDetected) parts.push('hintDependency=true');
  if (sparseState) parts.push('sparse=true');
  return parts.join('; ');
}

// ═══════════════════════════════════════════════════════════════
// Assert decision is safe
// ═══════════════════════════════════════════════════════════════

export function assertSupportLevelDecisionIsSafe(
  decision: SupportLevelDecision,
): void {
  const errors: string[] = [];

  if (!decision.nextLearnerAction || !decision.nextLearnerAction.trim()) {
    errors.push('nextLearnerAction must be present');
  }
  if (decision.allowedTutorMoves.length === 0) {
    errors.push('allowedTutorMoves must have at least one move');
  }
  if (decision.forbiddenTutorMoves.length === 0) {
    errors.push('forbiddenTutorMoves must have at least one move');
  }
  if (decision.rawLearnerDataIncluded !== false) {
    errors.push('rawLearnerDataIncluded must be false');
  }
  if (decision.rawPromptIncluded !== false) {
    errors.push('rawPromptIncluded must be false');
  }
  if (decision.rawAiResponseIncluded !== false) {
    errors.push('rawAiResponseIncluded must be false');
  }
  if (decision.rawTranscriptIncluded !== false) {
    errors.push('rawTranscriptIncluded must be false');
  }
  if (decision.finalAnswerBlocked && decision.allowedTutorMoves.includes('give_final_answer')) {
    errors.push('finalAnswerBlocked but allowedTutorMoves includes give_final_answer');
  }

  if (errors.length > 0) {
    throw new SupportLevelConsistencyError(errors.join('; '));
  }
}

export class SupportLevelConsistencyError extends Error {
  public code = 'SUPPORT_LEVEL_CONSISTENCY_ERROR';
  constructor(message: string) {
    super(`Support level consistency assertion failed: ${message}`);
    this.name = 'SupportLevelConsistencyError';
  }
}

// ═══════════════════════════════════════════════════════════════
// Map support-level decision to prompt constraints
// ═══════════════════════════════════════════════════════════════

export function mapSupportLevelToPromptConstraints(
  decision: SupportLevelDecision,
): PromptSupportConstraints {
  return {
    supportLevel: decision.supportLevel,
    hintLevel: decision.hintLevel,
    questionLadderType: decision.questionLadderType,
    nextLearnerAction: decision.nextLearnerAction,
    allowedTutorMoves: decision.allowedTutorMoves,
    forbiddenTutorMoves: decision.forbiddenTutorMoves,
    studentAttemptRequired: decision.studentAttemptRequired,
    finalAnswerBlocked: decision.finalAnswerBlocked,
    assignmentRisk: decision.assignmentRisk,
    examRisk: decision.examRisk,
    maxAllowedTutorMove: decision.maxAllowedTutorMove,
    rawLearnerDataIncluded: false,
    rawPromptIncluded: false,
    rawAiResponseIncluded: false,
    rawTranscriptIncluded: false,
  };
}

// ═══════════════════════════════════════════════════════════════
// Map support-level decision to response safety rules
// ═══════════════════════════════════════════════════════════════

export function mapSupportLevelToResponseSafetyRules(
  decision: SupportLevelDecision,
): ResponseSafetySupportRules {
  const isFinalAnswerBlocked = decision.finalAnswerBlocked ||
    decision.supportLevel === 'full_solution_blocked';
  const isAssignmentRisk = decision.assignmentRisk || decision.examRisk;

  return {
    supportLevel: decision.supportLevel,
    blockFinalAnswer: isFinalAnswerBlocked,
    blockAssignmentShortcut: isAssignmentRisk,
    blockDirectSolution: isFinalAnswerBlocked || isAssignmentRisk,
    allowPartialWorkedExample: decision.supportLevel === 'partial_worked_example',
    allowSimilarExample: decision.supportLevel === 'similar_example',
    enforceSocraticFraming: !decision.safeguardingRisk,
    maxAllowedTutorMove: decision.maxAllowedTutorMove,
  };
}

// ═══════════════════════════════════════════════════════════════
// Map support-level decision to evidence signal
// ═══════════════════════════════════════════════════════════════

export function mapSupportLevelToLearningEvidence(
  decision: SupportLevelDecision,
): SupportLevelEvidenceSignal {
  return { ...decision.evidenceSignal };
}
