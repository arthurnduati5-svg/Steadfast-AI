// ─────────────────────────────────────────────────────────────
// Steadfast AI — Socratic Learning Control Contracts v1
// Central runtime decision object that describes how the tutor
// should respond, how much support is allowed, whether AI should
// be called, whether the student must attempt first, how to
// enforce no-final-answer, what next learner action is required,
// and what safe evidence event should be emitted.
//
// This contract UNIFIES scattered decisions from:
//   - SocraticRuntimePolicyPacket
//   - ChatTurnExecutionContext
//   - No-final-answer policy
//   - Academic-integrity guard
//   - Hint ladder
//   - Question ladder
//   - Response safety
//   - Prompt assembly constraints
//   - Evidence event draft
// ─────────────────────────────────────────────────────────────

// ═══════════════════════════════════════════════════════════════
// Central Tutor Mode
// ═══════════════════════════════════════════════════════════════

export type SocraticTutorMode =
  | 'teach'
  | 'homework_support'
  | 'practice'
  | 'revision'
  | 'research'
  | 'assessment_support'
  | 'safeguarding_support'
  | 'integrity_redirect';

// ═══════════════════════════════════════════════════════════════
// Student Attempt Requirement
// ═══════════════════════════════════════════════════════════════

export type StudentAttemptRequirement =
  | 'not_required'
  | 'required_before_hint'
  | 'required_before_next_step'
  | 'required_before_feedback'
  | 'required_due_integrity_risk';

// ═══════════════════════════════════════════════════════════════
// Socratic Support Level
// ═══════════════════════════════════════════════════════════════

export type SocraticSupportLevel =
  | 'question_only'
  | 'reframe'
  | 'concept_cue'
  | 'strategy_hint'
  | 'step_check'
  | 'partial_worked_example'
  | 'full_solution_blocked'
  | 'safe_redirect';

// ═══════════════════════════════════════════════════════════════
// Final Answer Permission
// ═══════════════════════════════════════════════════════════════

export type FinalAnswerPermission =
  | 'blocked'
  | 'not_applicable';

// ═══════════════════════════════════════════════════════════════
// Learning Control Risk
// ═══════════════════════════════════════════════════════════════

export type LearningControlRisk =
  | 'none'
  | 'answer_seeking'
  | 'assignment_shortcut'
  | 'exam_or_test_risk'
  | 'prompt_injection'
  | 'source_injection'
  | 'privacy_risk'
  | 'safeguarding_risk';

// ═══════════════════════════════════════════════════════════════
// Next Learner Action Type
// ═══════════════════════════════════════════════════════════════

export type NextLearnerActionType =
  | 'answer_a_question'
  | 'show_attempt'
  | 'explain_reasoning'
  | 'correct_step'
  | 'try_similar_problem'
  | 'reflect_on_mistake'
  | 'choose_next_topic'
  | 'seek_human_help_if_safety_related';

// ═══════════════════════════════════════════════════════════════
// Central Learning Control Decision
// ═══════════════════════════════════════════════════════════════

export interface SocraticLearningControlDecision {
  /** Unique decision ID for audit tracing */
  decisionId: string;

  /** The tutor mode for this turn */
  tutorMode: SocraticTutorMode;

  /** Whether the student must attempt before receiving help */
  studentAttemptRequirement: StudentAttemptRequirement;

  /** Whether final answers are allowed — always blocked or not_applicable */
  finalAnswerPermission: FinalAnswerPermission;

  /** The Socratic support level for this turn */
  supportLevel: SocraticSupportLevel;

  /** Current hint ladder level (1-8, or 0 for no hint) */
  hintLevel: string;

  /** Current question ladder type, if applicable */
  questionLadderType?: string;

  /** Whether AI generation should be called */
  shouldCallAi: boolean;

  /** Whether a safe immediate response should be returned instead of AI */
  shouldReturnImmediateSafeResponse: boolean;

  /** Integrity risks detected for this turn */
  integrityRisk: LearningControlRisk[];

  /** Safety risks detected for this turn */
  safetyRisk: LearningControlRisk[];

  /** Tutor moves that are explicitly allowed */
  allowedTutorMoves: string[];

  /** Tutor moves that are explicitly forbidden */
  forbiddenTutorMoves: string[];

  /** The type of next learner action required */
  nextLearnerActionType: NextLearnerActionType;

  /** Human-readable next learner action description */
  nextLearnerAction: string;

  /** Student-facing instruction for the tutor response */
  studentFacingInstruction: string;

  /** Internal reason for audit/testing — never includes raw private text */
  internalReason: string;

  /** Optional draft evidence event for this turn */
  evidenceEventDraft?: SocraticLearningEvidenceEventDraft;

  // ── Safety Guarantees (compile-time enforcement) ──
  rawLearnerDataIncluded: false;
  rawPromptIncluded: false;
  rawAiResponseIncluded: false;
  rawTranscriptIncluded: false;
}

// ═══════════════════════════════════════════════════════════════
// Evidence Event Draft
// ═══════════════════════════════════════════════════════════════

export type SocraticLearningEvidenceEventType =
  | 'student_attempt_requested'
  | 'student_attempt_observed'
  | 'hint_given'
  | 'question_asked'
  | 'integrity_redirect'
  | 'response_safety_transform'
  | 'mistake_signal_observed'
  | 'growth_evidence_observed'
  | 'mastery_evidence_candidate'
  | 'safeguarding_safe_response';

export type SocraticLearningEvidenceSurface =
  | 'live_chat'
  | 'chat_pipeline'
  | 'practice'
  | 'artifact'
  | 'video'
  | 'revision'
  | 'unknown';

export type SocraticEvidenceStrength =
  | 'none'
  | 'weak'
  | 'moderate'
  | 'strong'
  | 'mastery_candidate';

export interface SocraticLearningEvidenceEventDraft {
  /** Event type describing what learning activity occurred */
  eventType: SocraticLearningEvidenceEventType;

  /** Surface where the event originated */
  surface: SocraticLearningEvidenceSurface;

  /** Hashed learner identifier — not the raw student ID */
  learnerIdHash?: string;

  /** Subject identifier */
  subjectId?: string;

  /** Skill identifier */
  skillId?: string;

  /** Safe summary of what happened — no raw private data */
  safeSummary: string;

  /** Strength of evidence this event represents */
  evidenceStrength: SocraticEvidenceStrength;

  /** Optional mistake type for taxonomy tracking */
  mistakeType?: string;

  /** Optional hint level associated with this event */
  hintLevel?: string;

  /** Optional support level associated with this event */
  supportLevel?: SocraticSupportLevel;

  /** Compile-time guarantee: no raw private data */
  rawPrivateDataIncluded: false;
}

// ═══════════════════════════════════════════════════════════════
// Control Decision Builder Input
// ═══════════════════════════════════════════════════════════════

export interface SocraticLearningControlInput {
  /** Student message signal (safe bounded summary) */
  studentMessageSignal: string;

  /** Assignment context signal from no-final-answer policy */
  assignmentContextSignal: {
    noFinalAnswerRequired: boolean;
    integritySignal: string;
    allowedTutorMoves: string[];
    forbiddenTutorMoves: string[];
    redirectInstruction: string;
  };

  /** Academic integrity classification */
  academicIntegritySignal: {
    signal: string;
    riskLevel: string;
    allowedResponseMode: string;
    studentFacingRedirect: string;
  };

  /** No-final-answer decision */
  noFinalAnswerDecision: {
    noFinalAnswerRequired: boolean;
    integritySignal: string;
    allowedTutorMoves: string[];
    forbiddenTutorMoves: string[];
    redirectInstruction: string;
  };

  /** Hint ladder decision */
  hintLadderDecision: {
    selectedLevel: number;
    label: string;
    nextRecommendedAction: string;
  };

  /** Question ladder decision */
  questionLadderDecision: {
    selectedType: string;
    nextRecommendedAction: string;
  };

  /** Learner state summary — safe bounded values only */
  learnerStateSummary: {
    masteryLevel: number | null;
    confidenceLevel: number | null;
    attemptCount: number;
    weakAreaCount: number;
    misconceptionCount: number;
    sparseLearnerState: boolean;
  };

  /** Source reliability summary */
  sourceReliabilitySummary: {
    hasVerifiedSources: boolean;
    hasUnsupportedSources: boolean;
    sourceCount: number;
  };

  /** Safeguarding signal */
  safeguardingSignal: {
    signal: string;
    riskLevel: string;
    isActive: boolean;
  };

  /** Runtime mode */
  runtimeMode: string;

  /** Surface where the decision is being made */
  surface: SocraticLearningEvidenceSurface;
}

// ═══════════════════════════════════════════════════════════════
// Safe Tutor Response (immediate non-AI response)
// ═══════════════════════════════════════════════════════════════

export interface SafeTutorResponse {
  message: string;
  responseType: string;
  nextLearnerAction: string;
  allowedTutorMoves: string[];
  forbiddenTutorMoves: string[];
  rawPrivateDataIncluded: false;
}

// ═══════════════════════════════════════════════════════════════
// Adapter bridge for existing SocraticRuntimePolicyPacket
// ═══════════════════════════════════════════════════════════════

export function decisionToSupportLevel(
  existingSupportMode: string,
): SocraticSupportLevel {
  switch (existingSupportMode) {
    case 'question_first':
      return 'question_only';
    case 'hint_first':
      return 'strategy_hint';
    case 'guided_steps':
      return 'step_check';
    case 'concept_reteach':
      return 'reframe';
    case 'misconception_check':
      return 'concept_cue';
    case 'worked_example_without_final_answer':
      return 'partial_worked_example';
    case 'similar_practice':
      return 'strategy_hint';
    case 'challenge_extension':
      return 'question_only';
    case 'reflection_prompt':
      return 'reframe';
    case 'safeguarding_escalation':
      return 'safe_redirect';
    default:
      return 'question_only';
  }
}

export function decisionToTutorMode(
  existingIntegritySignal: string,
  safeguardingActive: boolean,
  existingSupportMode: string,
): SocraticTutorMode {
  if (safeguardingActive) return 'safeguarding_support';
  if (existingIntegritySignal === 'exam_or_quiz_cheating_signal') return 'assessment_support';
  if (existingIntegritySignal === 'direct_final_answer_request') return 'integrity_redirect';
  if (existingIntegritySignal === 'possible_homework_answer_request') return 'homework_support';
  if (existingSupportMode === 'practice' || existingSupportMode === 'similar_practice') return 'practice';
  if (existingSupportMode === 'challenge_extension') return 'practice';
  if (existingSupportMode === 'reflection_prompt') return 'revision';
  return 'teach';
}

export function decisionToStudentAttemptRequirement(
  integritySignal: string,
): StudentAttemptRequirement {
  if (integritySignal === 'exam_or_quiz_cheating_signal') return 'required_due_integrity_risk';
  if (integritySignal === 'direct_final_answer_request') return 'required_before_feedback';
  if (integritySignal === 'possible_homework_answer_request') return 'required_before_next_step';
  if (integritySignal === 'copy_paste_solution_request') return 'required_before_next_step';
  if (integritySignal === 'repeated_shortcut_seeking') return 'required_due_integrity_risk';
  return 'required_before_hint';
}

export function decisionToFinalAnswerPermission(
  noFinalAnswerRequired: boolean,
): FinalAnswerPermission {
  return noFinalAnswerRequired ? 'blocked' : 'not_applicable';
}

export function decisionToLearningControlRisks(
  integritySignal: string,
  safeguardingSignal: string,
): { integrityRisk: LearningControlRisk[]; safetyRisk: LearningControlRisk[] } {
  const integrityRisk: LearningControlRisk[] = ['none'];
  const safetyRisk: LearningControlRisk[] = ['none'];

  if (integritySignal === 'exam_or_quiz_cheating_signal') integrityRisk.push('exam_or_test_risk');
  if (integritySignal === 'direct_final_answer_request') integrityRisk.push('answer_seeking');
  if (integritySignal === 'possible_homework_answer_request') integrityRisk.push('assignment_shortcut');
  if (integritySignal === 'copy_paste_solution_request') integrityRisk.push('assignment_shortcut');
  if (integritySignal === 'repeated_shortcut_seeking') integrityRisk.push('assignment_shortcut');
  if (safeguardingSignal !== 'none') safetyRisk.push('safeguarding_risk');

  return {
    integrityRisk: integrityRisk.length > 1 ? integrityRisk.filter(r => r !== 'none') : ['none'],
    safetyRisk: safetyRisk.length > 1 ? safetyRisk.filter(r => r !== 'none') : ['none'],
  };
}

export function decisionToNextLearnerAction(
  tutorMode: SocraticTutorMode,
  supportLevel: SocraticSupportLevel,
  hintLevel: string,
): { nextLearnerActionType: NextLearnerActionType; nextLearnerAction: string } {
  if (tutorMode === 'safeguarding_support') {
    return {
      nextLearnerActionType: 'seek_human_help_if_safety_related',
      nextLearnerAction: 'Speak with a trusted adult about your concerns.',
    };
  }
  if (tutorMode === 'integrity_redirect') {
    return {
      nextLearnerActionType: 'show_attempt',
      nextLearnerAction: 'Show what you have tried so far.',
    };
  }
  if (supportLevel === 'question_only') {
    return {
      nextLearnerActionType: 'answer_a_question',
      nextLearnerAction: 'Answer the question above to demonstrate your understanding.',
    };
  }
  if (supportLevel === 'concept_cue' || supportLevel === 'strategy_hint') {
    return {
      nextLearnerActionType: 'explain_reasoning',
      nextLearnerAction: 'Explain your reasoning based on the hint provided.',
    };
  }
  if (supportLevel === 'step_check') {
    return {
      nextLearnerActionType: 'correct_step',
      nextLearnerAction: 'Check your current step and correct it if needed.',
    };
  }
  if (supportLevel === 'partial_worked_example') {
    return {
      nextLearnerActionType: 'try_similar_problem',
      nextLearnerAction: 'Apply what you learned to a similar problem.',
    };
  }
  if (hintLevel === '8' || hintLevel === '7') {
    return {
      nextLearnerActionType: 'reflect_on_mistake',
      nextLearnerAction: 'Reflect on what you have learned so far.',
    };
  }
  return {
    nextLearnerActionType: 'answer_a_question',
    nextLearnerAction: 'Respond to the tutor to continue learning.',
  };
}
