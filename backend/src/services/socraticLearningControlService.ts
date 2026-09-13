// ─────────────────────────────────────────────────────────────
// Steadfast AI — Socratic Learning Control Service v1
// Central orchestration service that builds a unified
// SocraticLearningControlDecision from individual policy
// services, hint ladder, question ladder, and learner state.
//
// This is the CANONICAL decision point for all tutor responses.
// Every tutor response path should flow through this service.
// ─────────────────────────────────────────────────────────────

import {
  decisionToSupportLevel,
  decisionToTutorMode,
  decisionToStudentAttemptRequirement,
  decisionToFinalAnswerPermission,
  decisionToLearningControlRisks,
  decisionToNextLearnerAction,
  type SocraticLearningControlDecision,
  type SocraticLearningControlInput,
  type SocraticTutorMode,
  type StudentAttemptRequirement,
  type SocraticSupportLevel,
  type FinalAnswerPermission,
  type LearningControlRisk,
  type NextLearnerActionType,
  type SocraticLearningEvidenceEventDraft,
  type SafeTutorResponse,
  type SocraticLearningEvidenceSurface,
} from './socraticLearningControlContracts';
import {
  buildSupportLevelDecision,
  assertSupportLevelDecisionIsSafe,
  mapSupportLevelToPromptConstraints,
  mapSupportLevelToResponseSafetyRules,
  mapSupportLevelToLearningEvidence,
} from './supportLevelConsistencyService';
import type {
  CanonicalSupportLevel,
  SupportLevelDecision,
  SupportLevelDecisionInput,
} from './supportLevelConsistencyContracts';

// ═══════════════════════════════════════════════════════════════
// Decision ID Generator
// ═══════════════════════════════════════════════════════════════

let _decisionCounter = 0;

export function generateDecisionId(): string {
  _decisionCounter += 1;
  const timestamp = Date.now().toString(36);
  const counter = _decisionCounter.toString(36);
  const random = Math.random().toString(36).slice(2, 6);
  return `slc_${timestamp}_${counter}_${random}`;
}

// ═══════════════════════════════════════════════════════════════
// Builder: Build Decision from Policy Inputs
// ═══════════════════════════════════════════════════════════════

/**
 * Build a central SocraticLearningControlDecision from individual
 * policy service decisions. This is the CANONICAL function that
 * every tutor response path should use.
 */
export function buildSocraticLearningControlDecision(
  input: SocraticLearningControlInput,
): SocraticLearningControlDecision {
  const decisionId = generateDecisionId();

  // 1. Derive tutor mode from existing signals
  const tutorMode: SocraticTutorMode = decisionToTutorMode(
    input.academicIntegritySignal.signal,
    input.safeguardingSignal.isActive,
    input.academicIntegritySignal.allowedResponseMode,
  );

  // 2. Derive student attempt requirement
  const studentAttemptRequirement: StudentAttemptRequirement =
    decisionToStudentAttemptRequirement(
      input.academicIntegritySignal.signal,
    );

  // 3. Derive final answer permission
  const finalAnswerPermission: FinalAnswerPermission =
    decisionToFinalAnswerPermission(
      input.noFinalAnswerDecision.noFinalAnswerRequired,
    );

  // 4. Derive support level from hint ladder and signals
  const supportLevel: SocraticSupportLevel = deriveSupportLevel(
    input.hintLadderDecision.selectedLevel,
    input.safeguardingSignal.isActive,
    input.academicIntegritySignal.signal,
    input.noFinalAnswerDecision.noFinalAnswerRequired,
  );

  // 5. Derive risks
  const { integrityRisk, safetyRisk } = decisionToLearningControlRisks(
    input.academicIntegritySignal.signal,
    input.safeguardingSignal.signal,
  );

  // 6. Derive next learner action
  const { nextLearnerActionType, nextLearnerAction } =
    decisionToNextLearnerAction(tutorMode, supportLevel, String(input.hintLadderDecision.selectedLevel));

  // 7. Build allowed and forbidden tutor moves
  const allowedTutorMoves = buildAllowedTutorMoves(
    input.noFinalAnswerDecision.allowedTutorMoves,
    tutorMode,
    supportLevel,
  );

  const forbiddenTutorMoves = buildForbiddenTutorMoves(
    input.noFinalAnswerDecision.forbiddenTutorMoves,
    tutorMode,
  );

  // 8. Determine if AI should be called or immediate safe response
  const shouldCallAi = determineShouldCallAi(
    tutorMode,
    input.safeguardingSignal.isActive,
    input.academicIntegritySignal.signal,
    input.learnerStateSummary.sparseLearnerState,
  );

  const shouldReturnImmediateSafeResponse =
    !shouldCallAi;

  // 9. Build student-facing instruction
  const studentFacingInstruction = buildStudentFacingInstruction(
    tutorMode,
    supportLevel,
    nextLearnerAction,
    input.noFinalAnswerDecision.redirectInstruction,
    input.academicIntegritySignal.studentFacingRedirect,
  );

  // 10. Build internal reason (no raw private text)
  const internalReason = buildInternalReason(tutorMode, supportLevel, integrityRisk, safetyRisk);

  // 11. Build evidence event draft
  const evidenceEventDraft = buildEvidenceEventDraft(
    tutorMode,
    supportLevel,
    String(input.hintLadderDecision.selectedLevel),
    input.surface,
  );

  return {
    decisionId,
    tutorMode,
    studentAttemptRequirement,
    finalAnswerPermission,
    supportLevel,
    hintLevel: String(input.hintLadderDecision.selectedLevel),
    questionLadderType: input.questionLadderDecision.selectedType,
    shouldCallAi,
    shouldReturnImmediateSafeResponse,
    integrityRisk,
    safetyRisk,
    allowedTutorMoves,
    forbiddenTutorMoves,
    nextLearnerActionType,
    nextLearnerAction,
    studentFacingInstruction,
    internalReason,
    evidenceEventDraft,
    rawLearnerDataIncluded: false,
    rawPromptIncluded: false,
    rawAiResponseIncluded: false,
    rawTranscriptIncluded: false,
  };
}

// ═══════════════════════════════════════════════════════════════
// Merge with Existing SocraticRuntimePolicyPacket
// ═══════════════════════════════════════════════════════════════

/**
 * Merge the central learning control decision with an existing
 * SocraticRuntimePolicyPacket. Use this when the existing packet
 * has already been built and you want to produce a unified decision.
 */
export function mergeLearningControlWithRuntimePolicy(
  decision: SocraticLearningControlDecision,
  existingPacket: {
    supportMode: string;
    challengeLevel: string;
    integritySignal: string;
    safeguardingSignal: string;
    noFinalAnswerRequired: boolean;
    privacyMode: string;
    recommendedTutorMove: string;
    forbiddenTutorMoves: string[];
    allowedTutorMoves: string[];
    auditWarnings?: string[];
  },
): SocraticLearningControlDecision {
  // Use existing packet's signal if it's stronger
  const existingIsIntegrityActive =
    existingPacket.integritySignal !== 'none' && existingPacket.integritySignal !== 'allowed_learning_help';
  const existingIsSafeguardingActive = existingPacket.safeguardingSignal !== 'none';

  if (existingIsIntegrityActive && decision.integrityRisk.length <= 1) {
    // Existing packet has more granular signal — keep existing
    return {
      ...decision,
      allowedTutorMoves: existingPacket.allowedTutorMoves,
      forbiddenTutorMoves: existingPacket.forbiddenTutorMoves,
      studentFacingInstruction: existingPacket.recommendedTutorMove,
    };
  }

  if (existingIsSafeguardingActive && decision.safetyRisk.length <= 1) {
    return {
      ...decision,
      tutorMode: 'safeguarding_support',
      supportLevel: 'safe_redirect',
      shouldCallAi: false,
      shouldReturnImmediateSafeResponse: true,
    };
  }

  return decision;
}

// ═══════════════════════════════════════════════════════════════
// Build Immediate Safe Response
// ═══════════════════════════════════════════════════════════════

/**
 * Build a safe immediate Socratic response when AI should NOT be called.
 */
export function buildImmediateSocraticResponse(
  decision: SocraticLearningControlDecision,
): SafeTutorResponse {
  const message = decision.studentFacingInstruction ||
    'I can help you work through this step by step. What do you already know about this topic?';

  return {
    message,
    responseType: decision.tutorMode === 'safeguarding_support'
      ? 'safeguarding_safe_response'
      : decision.tutorMode === 'integrity_redirect'
        ? 'academic_integrity_redirect'
        : 'socratic_redirect',
    nextLearnerAction: decision.nextLearnerAction,
    allowedTutorMoves: decision.allowedTutorMoves,
    forbiddenTutorMoves: decision.forbiddenTutorMoves,
    rawPrivateDataIncluded: false,
  };
}

// ═══════════════════════════════════════════════════════════════
// Assert Decision Is Safe
// ═══════════════════════════════════════════════════════════════

/**
 * Runtime assertion that a learning control decision is safe.
 * Throws if any safety invariant is violated.
 */
export function assertLearningControlDecisionIsSafe(
  decision: SocraticLearningControlDecision,
): void {
  const errors: string[] = [];

  if (decision.finalAnswerPermission === ('allowed' as string)) {
    errors.push('finalAnswerPermission must be blocked or not_applicable');
  }

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

  if (decision.evidenceEventDraft) {
    if (decision.evidenceEventDraft.rawPrivateDataIncluded !== false) {
      errors.push('evidenceEventDraft.rawPrivateDataIncluded must be false');
    }
  }

  if (errors.length > 0) {
    throw new SocraticLearningControlSafetyError(errors.join('; '));
  }
}

export class SocraticLearningControlSafetyError extends Error {
  public code = 'SOCRATIC_LEARNING_CONTROL_SAFETY_ERROR';
  constructor(message: string) {
    super(`Socratic learning control safety assertion failed: ${message}`);
    this.name = 'SocraticLearningControlSafetyError';
  }
}

// ═══════════════════════════════════════════════════════════════
// Internal Derivation Helpers
// ═══════════════════════════════════════════════════════════════

function deriveSupportLevel(
  hintLevel: number,
  safeguardingActive: boolean,
  integritySignal: string,
  noFinalAnswerRequired: boolean,
): SocraticSupportLevel {
  if (safeguardingActive) return 'safe_redirect';
  if (integritySignal === 'exam_or_quiz_cheating_signal') return 'full_solution_blocked';
  if (integritySignal === 'direct_final_answer_request') return 'full_solution_blocked';
  if (integritySignal === 'possible_homework_answer_request') return 'safe_redirect';
  if (noFinalAnswerRequired) return 'step_check';
  if (hintLevel <= 2) return 'question_only';
  if (hintLevel <= 4) return 'concept_cue';
  if (hintLevel <= 6) return 'strategy_hint';
  if (hintLevel <= 7) return 'step_check';
  if (hintLevel >= 8) return 'reframe';
  return 'question_only';
}

function buildAllowedTutorMoves(
  existingAllowed: string[],
  tutorMode: SocraticTutorMode,
  supportLevel: SocraticSupportLevel,
): string[] {
  const moves = new Set<string>();

  // Always allowed
  moves.add('ask_question');
  moves.add('provide_feedback_without_answer');

  // Mode-specific
  if (tutorMode === 'safeguarding_support') {
    moves.add('provide_supportive_guidance');
    moves.add('refer_to_human_support');
  } else if (tutorMode === 'integrity_redirect') {
    moves.add('redirect_to_socratic_learning');
    moves.add('ask_for_attempt');
  } else {
    moves.add('explain_concept');
    moves.add('give_hint');
    moves.add('suggest_practice');
    moves.add('check_understanding');
  }

  // Merge existing
  for (const move of existingAllowed) {
    moves.add(move);
  }

  return [...moves].filter(Boolean);
}

function buildForbiddenTutorMoves(
  existingForbidden: string[],
  tutorMode: SocraticTutorMode,
): string[] {
  const moves = new Set<string>();

  // Always forbidden
  moves.add('give_final_answer');
  moves.add('provide_solution');
  moves.add('output_answer_key');
  moves.add('provide_copy_paste_text');

  // Merge existing
  for (const move of existingForbidden) {
    moves.add(move);
  }

  return [...moves].filter(Boolean);
}

function determineShouldCallAi(
  tutorMode: SocraticTutorMode,
  safeguardingActive: boolean,
  integritySignal: string,
  sparseLearnerState: boolean,
): boolean {
  if (safeguardingActive) return false;
  if (tutorMode === 'integrity_redirect') return false;
  if (integritySignal === 'exam_or_quiz_cheating_signal') return false;
  if (integritySignal === 'direct_final_answer_request') return false;
  if (tutorMode === 'safeguarding_support') return false;
  if (sparseLearnerState) return true; // AI can still help, with sparse context warnings
  return true;
}

function buildStudentFacingInstruction(
  tutorMode: SocraticTutorMode,
  supportLevel: SocraticSupportLevel,
  nextLearnerAction: string,
  redirectInstruction: string,
  integrityRedirect: string,
): string {
  if (redirectInstruction) return redirectInstruction;
  if (integrityRedirect) return integrityRedirect;

  if (tutorMode === 'safeguarding_support') {
    return 'I want to make sure you are safe. Please speak with a trusted adult about what you are going through. I am here to support you with learning when you are ready.';
  }
  if (tutorMode === 'integrity_redirect') {
    return 'I can help you learn the material, but I will not provide answers directly. Let us start with what you know.';
  }
  if (supportLevel === 'question_only') {
    return 'Let me ask you a question to guide your thinking. ' + nextLearnerAction;
  }
  if (supportLevel === 'concept_cue') {
    return 'Here is a clue to help you move forward. ' + nextLearnerAction;
  }
  if (supportLevel === 'step_check') {
    return 'Let us check your progress step by step. ' + nextLearnerAction;
  }

  return 'Let me help you work through this. ' + nextLearnerAction;
}

function buildInternalReason(
  tutorMode: SocraticTutorMode,
  supportLevel: SocraticSupportLevel,
  integrityRisk: LearningControlRisk[],
  safetyRisk: LearningControlRisk[],
): string {
  const risks = [
    ...integrityRisk.filter(r => r !== 'none'),
    ...safetyRisk.filter(r => r !== 'none'),
  ];
  const riskSummary = risks.length > 0 ? `risks=[${risks.join(',')}]` : 'no_risks_detected';
  return `tutorMode=${tutorMode}; supportLevel=${supportLevel}; ${riskSummary}`;
}

function buildEvidenceEventDraft(
  tutorMode: SocraticTutorMode,
  supportLevel: SocraticSupportLevel,
  hintLevel: string,
  surface: SocraticLearningEvidenceSurface,
): SocraticLearningEvidenceEventDraft | undefined {
  let eventType: SocraticLearningEvidenceEventDraft['eventType'];
  let safeSummary: string;

  if (tutorMode === 'safeguarding_support') {
    eventType = 'safeguarding_safe_response';
    safeSummary = 'Safeguarding response sent; no AI generated.';
  } else if (tutorMode === 'integrity_redirect') {
    eventType = 'integrity_redirect';
    safeSummary = 'Integrity redirect applied; student asked to show attempt.';
  } else if (hintLevel && parseInt(hintLevel) > 0) {
    eventType = 'hint_given';
    safeSummary = `Hint level ${hintLevel} provided; next action requested.`;
  } else {
    eventType = 'question_asked';
    safeSummary = 'Socratic question asked; student response requested.';
  }

  return {
    eventType,
    surface,
    safeSummary,
    evidenceStrength: 'none',
    hintLevel,
    supportLevel,
    rawPrivateDataIncluded: false,
  };
}

// ═══════════════════════════════════════════════════════════════
// Canonical Support-Level Decision Bridge
// ═══════════════════════════════════════════════════════════════

/**
 * Bridge the existing SocraticLearningControlDecision into the
 * canonical SupportLevelDecision used by the consistency service.
 * This allows downstream systems to use a unified support-level model.
 */
export function bridgeToCanonicalSupportDecision(
  decision: SocraticLearningControlDecision,
): SupportLevelDecision {
  const canonicalInput: SupportLevelDecisionInput = {
    studentAttemptSignal: {
      hasAttempted: decision.studentAttemptRequirement === 'not_required',
      isDirectAnswerRequest: decision.integrityRisk.includes('answer_seeking'),
    },
    assignmentRiskSignal: {
      finalAnswerRequested: decision.finalAnswerPermission === 'blocked',
      assignmentShortcutDetected: decision.integrityRisk.includes('assignment_shortcut'),
      examCheatingDetected: decision.integrityRisk.includes('exam_or_test_risk'),
    },
    integrityRiskSignal: {
      integrityActive: decision.integrityRisk.some(r => r !== 'none'),
      signalType: decision.integrityRisk.filter(r => r !== 'none').join(',') || 'none',
      repeatedShortcutSeeking: decision.integrityRisk.includes('assignment_shortcut'),
    },
    safeguardingSignal: {
      isActive: decision.safetyRisk.includes('safeguarding_risk'),
      signalType: decision.safetyRisk.includes('safeguarding_risk') ? 'active' : 'none',
    },
    hintLadderSignal: {
      selectedLevel: parseInt(decision.hintLevel, 10) || 0,
      label: decision.supportLevel,
      nextRecommendedAction: decision.nextLearnerActionType,
    },
    questionLadderSignal: decision.questionLadderType ? {
      selectedType: decision.questionLadderType,
      nextRecommendedAction: decision.nextLearnerActionType,
    } : undefined,
    learnerStateSummary: {
      masteryLevel: null,
      confidenceLevel: null,
      attemptCount: 0,
      weakAreaCount: 0,
      misconceptionCount: 0,
      sparseLearnerState: false,
    },
    surface: 'live_chat',
  };

  const canonicalDecision = buildSupportLevelDecision(canonicalInput);
  return canonicalDecision;
}
