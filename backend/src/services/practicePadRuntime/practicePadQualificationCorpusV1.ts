// ─────────────────────────────────────────────────────────────
// Steadfast AI — Practice Pad PP-11: qualification corpus v1
//
// ONE versioned, data-only corpus. Cases are DATA, not hidden
// assertions: every case has a stable ID, a category (A–N), an
// observable input, and an observable expected behavior. No live
// provider expectations. No chain-of-thought. No private function
// names as educational truth.
//
// Corpus version: practice-pad-qualification-corpus-v1
// ─────────────────────────────────────────────────────────────

export const PP11_CORPUS_VERSION = 'practice-pad-qualification-corpus-v1' as const;

export type PP11CaseKind =
  | 'math'
  | 'divergence'
  | 'intervention'
  | 'leakage'
  | 'recovery'
  | 'transfer'
  | 'interpretation'
  | 'integrity'
  | 'evidence';

export type PP11CriticalTag =
  | 'FALSE_MATH_CONFIRMATION'
  | 'FALSE_CAUSAL_DIVERGENCE'
  | 'ANSWER_KEY_LEAKAGE'
  | 'UNCONFIRMED_INTERPRETATION_USED'
  | 'FALSE_INDEPENDENT_TRANSFER'
  | 'FALSE_MASTERY_MUTATION'
  | 'INTEGRITY_PUNITIVE_ACTION'
  | 'CROSS_LEARNER_AUTHORITY'
  | 'DUPLICATE_PROTECTED_MUTATION'
  | 'FAIL_OPEN_PROTECTED_STATE';

export interface PP11MathInput {
  candidate: string;
  expected: string;
}
export interface PP11MathExpected {
  status: 'CORRECT' | 'INCORRECT' | 'UNSUPPORTED' | 'INVALID';
}

export interface PP11DivergenceInput {
  problemPrompt: string;
  steps: string[];
}
export interface PP11DivergenceExpected {
  status: 'ALL_VALID' | 'DIVERGED' | 'NEEDS_SEMANTIC_ANALYSIS' | 'NEEDS_CLARIFICATION';
  firstDivergenceStepIndex: number | null;
  confirmedPrefixCount: number;
}

export interface PP11InterventionInput {
  checkStatus:
    | 'CONFIRMED_CORRECT'
    | 'CONFIRMED_INCORRECT'
    | 'NEEDS_SEMANTIC_ANALYSIS'
    | 'NEEDS_CLARIFICATION'
    | 'NOT_EVALUATED';
  firstDivergenceStepIndex?: number | null;
  trustedSupportCount?: number;
  expectedAnswerSecret: string;
}
export interface PP11InterventionExpected {
  level: 'L0' | 'L1' | 'L2' | 'L3' | 'L4' | 'L5';
  targetStepIndex?: number | null;
  semanticLanguageRequired?: boolean;
}

export interface PP11LeakageInput {
  feedbackText: string;
  nextLearnerAction: string;
  expectedAnswerSecret: string;
  acceptableAnswerForms?: string[];
}
export interface PP11LeakageExpected {
  valid: false;
}

export interface PP11RecoverySupport {
  basedOnVersion: number;
  level: 'L0' | 'L1' | 'L2' | 'L3' | 'L4' | 'L5';
}
export interface PP11RecoveryInput {
  priorCheckId: string;
  currentCheckId: string;
  priorVersion: number;
  currentVersion: number;
  priorStatus: 'CONFIRMED_CORRECT' | 'CONFIRMED_INCORRECT' | 'NEEDS_SEMANTIC_ANALYSIS';
  currentStatus: 'CONFIRMED_CORRECT' | 'CONFIRMED_INCORRECT' | 'NEEDS_SEMANTIC_ANALYSIS';
  priorDivergence?: { stepIndex: number; reasonCode?: string | null } | null;
  currentDivergence?: { stepIndex: number; reasonCode?: string | null } | null;
  supportReceived: PP11RecoverySupport[];
  supportHistoryAvailable?: boolean;
}
export interface PP11RecoveryExpected {
  classification:
    | 'SELF_CORRECTED'
    | 'CORRECTED_AFTER_SUPPORT'
    | 'SAME_ERROR_PATTERN'
    | 'NEW_ERROR_PATTERN'
    | 'PARTIAL_RECOVERY'
    | 'UNRESOLVED';
  independentOfSupport: boolean;
}

export interface PP11TransferInput {
  originalProblemId: string;
  transferProblemId: string;
  sameGovernedSkill: boolean;
  transferSolvedDeterministically: boolean;
  supportDeliveredOnTransfer: boolean;
}
export interface PP11TransferExpected {
  independent: boolean;
  reason:
    | 'independent_transfer_success'
    | 'same_problem_correction_not_transfer'
    | 'unrelated_skill_not_transfer'
    | 'transfer_not_solved'
    | 'supported_transfer_not_independent';
}

export interface PP11InterpretationInput {
  status: 'UNINTERPRETED' | 'CANDIDATES_AVAILABLE' | 'CONFIRMATION_REQUIRED' | 'CONFIRMED' | 'REJECTED' | 'UNSUPPORTED';
  representationClass: 'TEXT' | 'EQUATION' | 'DIAGRAM' | 'UNKNOWN';
  hashMatchesCurrentWork: boolean;
  sameLearner: boolean;
}
export interface PP11InterpretationExpected {
  admissible: boolean;
}

export interface PP11IntegrityEvent {
  type:
    | 'PRACTICE_VISIBLE'
    | 'PRACTICE_HIDDEN'
    | 'FOCUS_GAINED'
    | 'FOCUS_LOST'
    | 'CHECK_REQUESTED'
    | 'CHECK_COMPLETED'
    | 'SUPPORT_DELIVERED';
  atOffsetMs: number;
  clientObservedAt?: string | null;
  malformedClientTime?: boolean;
}
export interface PP11IntegrityInput {
  events: PP11IntegrityEvent[];
  readers?: {
    workChars?: number | null;
    revisionCount?: number | null;
    reasoningSteps?: number | null;
    hadIncorrectBeforeCorrect?: boolean | null;
    transferCorrect?: boolean | null;
  };
}
export interface PP11IntegrityExpected {
  outcomeCode: 'ok' | 'OUT_OF_ORDER';
  concern?: 'NONE' | 'LOW' | 'MODERATE' | 'INSUFFICIENT_EVIDENCE';
  action?: 'NONE' | 'ASK_REASONING_QUESTION' | 'REQUEST_TRANSFER_PROBLEM' | 'REQUIRE_MORE_WORK_EVIDENCE';
}

export interface PP11EvidenceInput {
  checkStatus: 'CONFIRMED_CORRECT' | 'CONFIRMED_INCORRECT' | 'NEEDS_SEMANTIC_ANALYSIS';
  checkConfidence: number;
  checkIsCurrent: boolean;
  versionMatchesHead: boolean;
  problemStatus: 'READY' | 'INVALID' | 'AMBIGUOUS';
  interpretationRequired: boolean;
  interpretationStatus: 'CONFIRMED' | 'CANDIDATES_AVAILABLE' | null;
  evidenceCommitterOk: boolean;
  replaySeen: boolean;
  priorIncorrectWithDivergence: boolean;
  priorSupportLevel: 'L0' | 'L1' | 'L2' | null;
  integrityConcern: 'NONE' | 'MODERATE' | null;
}
export interface PP11EvidenceExpected {
  admitted: boolean;
  failureCode?: string;
  masteryProjected: boolean;
  memoryProjected: boolean;
  revisionProjected: boolean;
  growthProjected: boolean;
  evidenceHeldForTransfer?: boolean;
  supportQuality?: string;
  masterySignal?: string | null;
}

export interface PP11Case {
  id: string;
  category: string;
  kind: PP11CaseKind;
  label: string;
  input:
    | PP11MathInput
    | PP11DivergenceInput
    | PP11InterventionInput
    | PP11LeakageInput
    | PP11RecoveryInput
    | PP11TransferInput
    | PP11InterpretationInput
    | PP11IntegrityInput
    | PP11EvidenceInput;
  expected:
    | PP11MathExpected
    | PP11DivergenceExpected
    | PP11InterventionExpected
    | PP11LeakageExpected
    | PP11RecoveryExpected
    | PP11TransferExpected
    | PP11InterpretationExpected
    | PP11IntegrityExpected
    | PP11EvidenceExpected;
  criticalFailureTags: PP11CriticalTag[];
}

export const PP11_CORPUS: PP11Case[] = [
  // ── A. deterministic correctness (PP-04) ──
  { id: 'PP11-M-01', category: 'A', kind: 'math', label: 'numeric equality', input: { candidate: '42', expected: '42' }, expected: { status: 'CORRECT' }, criticalFailureTags: ['FALSE_MATH_CONFIRMATION'] },
  { id: 'PP11-M-02', category: 'A', kind: 'math', label: 'exact rational equality 2/4 = 1/2', input: { candidate: '2/4', expected: '1/2' }, expected: { status: 'CORRECT' }, criticalFailureTags: ['FALSE_MATH_CONFIRMATION'] },
  { id: 'PP11-M-03', category: 'A', kind: 'math', label: 'operator precedence 2 + 3 * 4 = 14', input: { candidate: '2 + 3 * 4', expected: '14' }, expected: { status: 'CORRECT' }, criticalFailureTags: ['FALSE_MATH_CONFIRMATION'] },
  { id: 'PP11-M-04', category: 'A', kind: 'math', label: 'equivalent algebraic form 2(x+3) = 2x+6', input: { candidate: '2(x + 3)', expected: '2x + 6' }, expected: { status: 'CORRECT' }, criticalFailureTags: ['FALSE_MATH_CONFIRMATION'] },
  { id: 'PP11-M-05', category: 'A', kind: 'math', label: 'linear solution set x = 9 - 5 solves x + 5 = 9', input: { candidate: 'x = 9 - 5', expected: 'x + 5 = 9' }, expected: { status: 'CORRECT' }, criticalFailureTags: ['FALSE_MATH_CONFIRMATION'] },
  { id: 'PP11-M-06', category: 'A', kind: 'math', label: 'deliberate wrong distribution 2x + 3 vs 2(x+3)', input: { candidate: '2x + 3', expected: '2(x + 3)' }, expected: { status: 'INCORRECT' }, criticalFailureTags: ['FALSE_MATH_CONFIRMATION'] },
  { id: 'PP11-M-07', category: 'A', kind: 'math', label: 'fraction sums outside the decidable grammar stay unsupported, never guessed', input: { candidate: '1/2 + 1/3', expected: '5/6' }, expected: { status: 'UNSUPPORTED' }, criticalFailureTags: ['FALSE_MATH_CONFIRMATION'] },
  { id: 'PP11-M-08', category: 'A', kind: 'math', label: 'negative values -5 + 3 = -2', input: { candidate: '-5 + 3', expected: '-2' }, expected: { status: 'CORRECT' }, criticalFailureTags: ['FALSE_MATH_CONFIRMATION'] },
  { id: 'PP11-M-09', category: 'A', kind: 'math', label: 'decimals 0.1 + 0.2 = 0.3', input: { candidate: '0.1 + 0.2', expected: '0.3' }, expected: { status: 'CORRECT' }, criticalFailureTags: ['FALSE_MATH_CONFIRMATION'] },
  { id: 'PP11-M-10', category: 'A', kind: 'math', label: 'alternative rearrangement 2x = 10 - 4 vs 2x = 6', input: { candidate: '2x = 10 - 4', expected: '2x = 6' }, expected: { status: 'CORRECT' }, criticalFailureTags: ['FALSE_MATH_CONFIRMATION'] },
  { id: 'PP11-M-11', category: 'A', kind: 'math', label: 'deliberate wrong solution x = 4 vs x + 2 = 7', input: { candidate: 'x = 4', expected: 'x + 2 = 7' }, expected: { status: 'INCORRECT' }, criticalFailureTags: ['FALSE_MATH_CONFIRMATION'] },
  { id: 'PP11-M-12', category: 'A', kind: 'math', label: 'identity x + 0 = x', input: { candidate: 'x + 0', expected: 'x' }, expected: { status: 'CORRECT' }, criticalFailureTags: ['FALSE_MATH_CONFIRMATION'] },
  // ── E (part 1). unsupported / malformed mathematical work ──
  { id: 'PP11-M-13', category: 'E', kind: 'math', label: 'multi-variable system stays unsupported, never guessed', input: { candidate: '2x + 3y = 8', expected: '2x + 3y = 7' }, expected: { status: 'UNSUPPORTED' }, criticalFailureTags: ['FALSE_MATH_CONFIRMATION'] },
  { id: 'PP11-M-14', category: 'E', kind: 'math', label: 'division by zero is malformed, never a value', input: { candidate: '1/0', expected: '0' }, expected: { status: 'INVALID' }, criticalFailureTags: ['FALSE_MATH_CONFIRMATION'] },

  // ── B. alternative valid methods (all-valid anchored walks) ──
  { id: 'PP11-A-01', category: 'B', kind: 'divergence', label: 'standard isolate-then-divide route', input: { problemPrompt: 'Find x. 2x + 4 = 10', steps: ['2x = 6', 'x = 3'] }, expected: { status: 'ALL_VALID', firstDivergenceStepIndex: null, confirmedPrefixCount: 2 }, criticalFailureTags: ['FALSE_CAUSAL_DIVERGENCE'] },
  { id: 'PP11-A-02', category: 'B', kind: 'divergence', label: 'subtract-then-simplify route', input: { problemPrompt: 'Find x. 2x + 4 = 10', steps: ['2x = 10 - 4', '2x = 6', 'x = 3'] }, expected: { status: 'ALL_VALID', firstDivergenceStepIndex: null, confirmedPrefixCount: 3 }, criticalFailureTags: ['FALSE_CAUSAL_DIVERGENCE'] },
  { id: 'PP11-A-03', category: 'B', kind: 'divergence', label: 'fraction simplification mid-route', input: { problemPrompt: 'Find x. 2x + 4 = 10', steps: ['2x = 6', 'x = 6/2', 'x = 3'] }, expected: { status: 'ALL_VALID', firstDivergenceStepIndex: null, confirmedPrefixCount: 3 }, criticalFailureTags: ['FALSE_CAUSAL_DIVERGENCE'] },
  { id: 'PP11-A-04', category: 'B', kind: 'divergence', label: 'fraction equation route', input: { problemPrompt: 'Find x. x/2 + 1 = 4', steps: ['x/2 = 3', 'x = 6'] }, expected: { status: 'ALL_VALID', firstDivergenceStepIndex: null, confirmedPrefixCount: 2 }, criticalFailureTags: ['FALSE_CAUSAL_DIVERGENCE'] },
  { id: 'PP11-A-05', category: 'B', kind: 'divergence', label: 'negative coefficient route', input: { problemPrompt: 'Find x. -2x + 4 = 10', steps: ['-2x = 6', 'x = -3'] }, expected: { status: 'ALL_VALID', firstDivergenceStepIndex: null, confirmedPrefixCount: 2 }, criticalFailureTags: ['FALSE_CAUSAL_DIVERGENCE'] },
  { id: 'PP11-A-06', category: 'B', kind: 'divergence', label: 'scaled-coefficient route', input: { problemPrompt: 'Find x. 4x + 8 = 20', steps: ['4x = 12', 'x = 3'] }, expected: { status: 'ALL_VALID', firstDivergenceStepIndex: null, confirmedPrefixCount: 2 }, criticalFailureTags: ['FALSE_CAUSAL_DIVERGENCE'] },
  { id: 'PP11-A-07', category: 'B', kind: 'divergence', label: 'distribution-first route', input: { problemPrompt: 'Find x. 2(x + 1) = 8', steps: ['2x + 2 = 8', '2x = 6', 'x = 3'] }, expected: { status: 'ALL_VALID', firstDivergenceStepIndex: null, confirmedPrefixCount: 3 }, criticalFailureTags: ['FALSE_CAUSAL_DIVERGENCE'] },
  { id: 'PP11-A-08', category: 'B', kind: 'divergence', label: 'divide-first route', input: { problemPrompt: 'Find x. 2(x + 1) = 8', steps: ['x + 1 = 4', 'x = 3'] }, expected: { status: 'ALL_VALID', firstDivergenceStepIndex: null, confirmedPrefixCount: 2 }, criticalFailureTags: ['FALSE_CAUSAL_DIVERGENCE'] },

  // ── C. first-divergence localization ──
  { id: 'PP11-D-01', category: 'C', kind: 'divergence', label: 'first step wrong', input: { problemPrompt: 'Find x. 2x + 4 = 10', steps: ['2x = 4', 'x = 2'] }, expected: { status: 'DIVERGED', firstDivergenceStepIndex: 0, confirmedPrefixCount: 0 }, criticalFailureTags: ['FALSE_CAUSAL_DIVERGENCE'] },
  { id: 'PP11-D-02', category: 'C', kind: 'divergence', label: 'middle step wrong', input: { problemPrompt: 'Find x. 2x + 4 = 10', steps: ['2x = 6', 'x = 5'] }, expected: { status: 'DIVERGED', firstDivergenceStepIndex: 1, confirmedPrefixCount: 1 }, criticalFailureTags: ['FALSE_CAUSAL_DIVERGENCE'] },
  { id: 'PP11-D-03', category: 'C', kind: 'divergence', label: 'late step wrong', input: { problemPrompt: 'Find x. 2x + 4 = 10', steps: ['2x = 6', 'x = 6/2', 'x = 4'] }, expected: { status: 'DIVERGED', firstDivergenceStepIndex: 2, confirmedPrefixCount: 2 }, criticalFailureTags: ['FALSE_CAUSAL_DIVERGENCE'] },
  { id: 'PP11-D-04', category: 'C', kind: 'divergence', label: 'all steps valid, no divergence', input: { problemPrompt: 'Find x. 3x - 3 = 9', steps: ['3x = 12', 'x = 4'] }, expected: { status: 'ALL_VALID', firstDivergenceStepIndex: null, confirmedPrefixCount: 2 }, criticalFailureTags: ['FALSE_CAUSAL_DIVERGENCE'] },
  { id: 'PP11-D-05', category: 'C', kind: 'divergence', label: 'alternative valid path is not divergence', input: { problemPrompt: 'Find x. 3x - 3 = 9', steps: ['3x = 9 + 3', '3x = 12', 'x = 4'] }, expected: { status: 'ALL_VALID', firstDivergenceStepIndex: null, confirmedPrefixCount: 3 }, criticalFailureTags: ['FALSE_CAUSAL_DIVERGENCE'] },
  { id: 'PP11-D-06', category: 'C', kind: 'divergence', label: 'unsupported earlier step blocks later causal claim', input: { problemPrompt: 'Find x. 2x = 6', steps: ['y = 2x + 1', 'x = 999'] }, expected: { status: 'NEEDS_SEMANTIC_ANALYSIS', firstDivergenceStepIndex: null, confirmedPrefixCount: 0 }, criticalFailureTags: ['FALSE_CAUSAL_DIVERGENCE'] },
  { id: 'PP11-D-07', category: 'C', kind: 'divergence', label: 'malformed intermediate step needs clarification', input: { problemPrompt: 'Find x. 2x + 4 = 10', steps: ['2x + = 6', 'x = 3'] }, expected: { status: 'NEEDS_CLARIFICATION', firstDivergenceStepIndex: null, confirmedPrefixCount: 0 }, criticalFailureTags: ['FALSE_CAUSAL_DIVERGENCE'] },
  { id: 'PP11-D-08', category: 'D', kind: 'divergence', label: 'unanchored prompt never fabricates divergence', input: { problemPrompt: 'Solve the problem shown in the diagram', steps: ['x = 3', 'x = 4'] }, expected: { status: 'NEEDS_SEMANTIC_ANALYSIS', firstDivergenceStepIndex: null, confirmedPrefixCount: 0 }, criticalFailureTags: ['FALSE_CAUSAL_DIVERGENCE'] },

  // ── F/G. Socratic intervention selection + answer-leakage resistance ──
  { id: 'PP11-I-01', category: 'F', kind: 'intervention', label: 'first encounter delivers L1 at target', input: { checkStatus: 'CONFIRMED_INCORRECT', firstDivergenceStepIndex: 0, trustedSupportCount: 0, expectedAnswerSecret: 'x = 3' }, expected: { level: 'L1', targetStepIndex: 0 }, criticalFailureTags: ['ANSWER_KEY_LEAKAGE'] },
  { id: 'PP11-I-02', category: 'F', kind: 'intervention', label: 'repeated unresolved attempt escalates one rung per trusted support', input: { checkStatus: 'CONFIRMED_INCORRECT', firstDivergenceStepIndex: 1, trustedSupportCount: 2, expectedAnswerSecret: 'x = 3' }, expected: { level: 'L3', targetStepIndex: 1 }, criticalFailureTags: ['ANSWER_KEY_LEAKAGE'] },
  { id: 'PP11-I-03', category: 'F', kind: 'intervention', label: 'correct learner work acknowledged at L0', input: { checkStatus: 'CONFIRMED_CORRECT', trustedSupportCount: 0, expectedAnswerSecret: 'x = 3' }, expected: { level: 'L0', targetStepIndex: null }, criticalFailureTags: ['ANSWER_KEY_LEAKAGE'] },
  { id: 'PP11-I-04', category: 'F', kind: 'intervention', label: 'ambiguous input stays at safe L1 clarification', input: { checkStatus: 'NEEDS_SEMANTIC_ANALYSIS', trustedSupportCount: 0, expectedAnswerSecret: 'x = 3' }, expected: { level: 'L1', semanticLanguageRequired: true }, criticalFailureTags: ['ANSWER_KEY_LEAKAGE'] },
  { id: 'PP11-I-05', category: 'F', kind: 'intervention', label: 'wrong final without localizable step fabricates no target', input: { checkStatus: 'CONFIRMED_INCORRECT', firstDivergenceStepIndex: null, trustedSupportCount: 0, expectedAnswerSecret: 'x = 3' }, expected: { level: 'L1', targetStepIndex: null }, criticalFailureTags: ['ANSWER_KEY_LEAKAGE'] },
  { id: 'PP11-I-06', category: 'G', kind: 'leakage', label: 'direct-answer-shaped candidate is rejected by validator', input: { feedbackText: 'The answer is x = 3, just write that down.', nextLearnerAction: 'Copy x = 3 into your work.', expectedAnswerSecret: 'x = 3' }, expected: { valid: false }, criticalFailureTags: ['ANSWER_KEY_LEAKAGE'] },
  { id: 'PP11-I-07', category: 'G', kind: 'leakage', label: 'hidden-answer paraphrase is rejected by validator', input: { feedbackText: 'Since twice a number plus four is ten, x=3 is the value that works here.', nextLearnerAction: 'Show your steps.', expectedAnswerSecret: 'x = 3', acceptableAnswerForms: ['x=3'] }, expected: { valid: false }, criticalFailureTags: ['ANSWER_KEY_LEAKAGE'] },
  { id: 'PP11-I-08', category: 'F', kind: 'intervention', label: 'escalation caps at L5 and never reveals the answer', input: { checkStatus: 'CONFIRMED_INCORRECT', firstDivergenceStepIndex: 2, trustedSupportCount: 10, expectedAnswerSecret: 'x = 3' }, expected: { level: 'L5', targetStepIndex: 2 }, criticalFailureTags: ['ANSWER_KEY_LEAKAGE'] },

  // ── H/I. recovery / support-sensitive recovery ──
  { id: 'PP11-R-01', category: 'H', kind: 'recovery', label: 'self-corrected with zero support', input: { priorCheckId: 'chk-p1', currentCheckId: 'chk-c1', priorVersion: 1, currentVersion: 2, priorStatus: 'CONFIRMED_INCORRECT', currentStatus: 'CONFIRMED_CORRECT', priorDivergence: { stepIndex: 0, reasonCode: 'VALUE_CHANGED' }, currentDivergence: null, supportReceived: [], supportHistoryAvailable: true }, expected: { classification: 'SELF_CORRECTED', independentOfSupport: true }, criticalFailureTags: ['FALSE_MASTERY_MUTATION'] },
  { id: 'PP11-R-02', category: 'H', kind: 'recovery', label: 'corrected after one support is never independent', input: { priorCheckId: 'chk-p2', currentCheckId: 'chk-c2', priorVersion: 1, currentVersion: 2, priorStatus: 'CONFIRMED_INCORRECT', currentStatus: 'CONFIRMED_CORRECT', priorDivergence: { stepIndex: 1, reasonCode: 'SOLUTION_SET_CHANGED' }, currentDivergence: null, supportReceived: [{ basedOnVersion: 1, level: 'L1' }], supportHistoryAvailable: true }, expected: { classification: 'CORRECTED_AFTER_SUPPORT', independentOfSupport: false }, criticalFailureTags: ['FALSE_MASTERY_MUTATION'] },
  { id: 'PP11-R-03', category: 'H', kind: 'recovery', label: 'same error pattern repeats', input: { priorCheckId: 'chk-p3', currentCheckId: 'chk-c3', priorVersion: 1, currentVersion: 2, priorStatus: 'CONFIRMED_INCORRECT', currentStatus: 'CONFIRMED_INCORRECT', priorDivergence: { stepIndex: 1, reasonCode: 'SOLUTION_SET_CHANGED' }, currentDivergence: { stepIndex: 1, reasonCode: 'SOLUTION_SET_CHANGED' }, supportReceived: [{ basedOnVersion: 1, level: 'L1' }], supportHistoryAvailable: true }, expected: { classification: 'SAME_ERROR_PATTERN', independentOfSupport: false }, criticalFailureTags: ['FALSE_MASTERY_MUTATION'] },
  { id: 'PP11-R-04', category: 'I', kind: 'recovery', label: 'partial recovery progresses past original error', input: { priorCheckId: 'chk-p4', currentCheckId: 'chk-c4', priorVersion: 1, currentVersion: 2, priorStatus: 'CONFIRMED_INCORRECT', currentStatus: 'CONFIRMED_INCORRECT', priorDivergence: { stepIndex: 0, reasonCode: 'SOLUTION_SET_CHANGED' }, currentDivergence: { stepIndex: 2, reasonCode: 'VALUE_CHANGED', }, supportReceived: [], supportHistoryAvailable: true }, expected: { classification: 'PARTIAL_RECOVERY', independentOfSupport: false }, criticalFailureTags: ['FALSE_MASTERY_MUTATION'] },
  { id: 'PP11-R-05', category: 'I', kind: 'recovery', label: 'new error pattern elsewhere', input: { priorCheckId: 'chk-p5', currentCheckId: 'chk-c5', priorVersion: 1, currentVersion: 2, priorStatus: 'CONFIRMED_INCORRECT', currentStatus: 'CONFIRMED_INCORRECT', priorDivergence: { stepIndex: 2, reasonCode: 'SOLUTION_SET_CHANGED' }, currentDivergence: { stepIndex: 0, reasonCode: 'VALUE_CHANGED' }, supportReceived: [], supportHistoryAvailable: true }, expected: { classification: 'NEW_ERROR_PATTERN', independentOfSupport: false }, criticalFailureTags: ['FALSE_MASTERY_MUTATION'] },
  { id: 'PP11-R-06', category: 'I', kind: 'recovery', label: 'unavailable history never assumes zero support', input: { priorCheckId: 'chk-p6', currentCheckId: 'chk-c6', priorVersion: 1, currentVersion: 2, priorStatus: 'CONFIRMED_INCORRECT', currentStatus: 'CONFIRMED_CORRECT', priorDivergence: { stepIndex: 0, reasonCode: 'VALUE_CHANGED' }, currentDivergence: null, supportReceived: [], supportHistoryAvailable: false }, expected: { classification: 'UNRESOLVED', independentOfSupport: false }, criticalFailureTags: ['FALSE_MASTERY_MUTATION', 'FAIL_OPEN_PROTECTED_STATE'] },

  // ── J. independent transfer ──
  { id: 'PP11-T-01', category: 'J', kind: 'transfer', label: 'independent correct transfer same skill', input: { originalProblemId: 'prob-a', transferProblemId: 'prob-b', sameGovernedSkill: true, transferSolvedDeterministically: true, supportDeliveredOnTransfer: false }, expected: { independent: true, reason: 'independent_transfer_success' }, criticalFailureTags: ['FALSE_INDEPENDENT_TRANSFER'] },
  { id: 'PP11-T-02', category: 'J', kind: 'transfer', label: 'same-problem correction is never transfer', input: { originalProblemId: 'prob-a', transferProblemId: 'prob-a', sameGovernedSkill: true, transferSolvedDeterministically: true, supportDeliveredOnTransfer: false }, expected: { independent: false, reason: 'same_problem_correction_not_transfer' }, criticalFailureTags: ['FALSE_INDEPENDENT_TRANSFER'] },
  { id: 'PP11-T-03', category: 'J', kind: 'transfer', label: 'unrelated skill unsolved is not transfer', input: { originalProblemId: 'prob-a', transferProblemId: 'prob-c', sameGovernedSkill: false, transferSolvedDeterministically: false, supportDeliveredOnTransfer: false }, expected: { independent: false, reason: 'unrelated_skill_not_transfer' }, criticalFailureTags: ['FALSE_INDEPENDENT_TRANSFER'] },
  { id: 'PP11-T-04', category: 'J', kind: 'transfer', label: 'supported transfer is not independent', input: { originalProblemId: 'prob-a', transferProblemId: 'prob-b', sameGovernedSkill: true, transferSolvedDeterministically: true, supportDeliveredOnTransfer: true }, expected: { independent: false, reason: 'supported_transfer_not_independent' }, criticalFailureTags: ['FALSE_INDEPENDENT_TRANSFER'] },
  { id: 'PP11-T-05', category: 'J', kind: 'transfer', label: 'unsolved transfer is not transfer', input: { originalProblemId: 'prob-a', transferProblemId: 'prob-b', sameGovernedSkill: true, transferSolvedDeterministically: false, supportDeliveredOnTransfer: false }, expected: { independent: false, reason: 'transfer_not_solved' }, criticalFailureTags: ['FALSE_INDEPENDENT_TRANSFER'] },
  { id: 'PP11-T-06', category: 'J', kind: 'transfer', label: 'solved unrelated-skill work is still not transfer', input: { originalProblemId: 'prob-a', transferProblemId: 'prob-c', sameGovernedSkill: false, transferSolvedDeterministically: true, supportDeliveredOnTransfer: false }, expected: { independent: false, reason: 'unrelated_skill_not_transfer' }, criticalFailureTags: ['FALSE_INDEPENDENT_TRANSFER'] },

  // ── K. handwriting / interpretation authority ──
  { id: 'PP11-K-01', category: 'K', kind: 'interpretation', label: 'raw handwriting only generates no evidence', input: { status: 'UNINTERPRETED', representationClass: 'UNKNOWN', hashMatchesCurrentWork: true, sameLearner: true }, expected: { admissible: false }, criticalFailureTags: ['UNCONFIRMED_INTERPRETATION_USED'] },
  { id: 'PP11-K-02', category: 'K', kind: 'interpretation', label: 'unconfirmed candidates generate no evidence', input: { status: 'CANDIDATES_AVAILABLE', representationClass: 'EQUATION', hashMatchesCurrentWork: true, sameLearner: true }, expected: { admissible: false }, criticalFailureTags: ['UNCONFIRMED_INTERPRETATION_USED'] },
  { id: 'PP11-K-03', category: 'K', kind: 'interpretation', label: 'confirmed equation with matching hash is admissible', input: { status: 'CONFIRMED', representationClass: 'EQUATION', hashMatchesCurrentWork: true, sameLearner: true }, expected: { admissible: true }, criticalFailureTags: ['UNCONFIRMED_INTERPRETATION_USED'] },
  { id: 'PP11-K-04', category: 'K', kind: 'interpretation', label: 'stale interpretation never generates evidence', input: { status: 'CONFIRMED', representationClass: 'EQUATION', hashMatchesCurrentWork: false, sameLearner: true }, expected: { admissible: false }, criticalFailureTags: ['UNCONFIRMED_INTERPRETATION_USED'] },
  { id: 'PP11-K-05', category: 'K', kind: 'interpretation', label: 'foreign learner interpretation never generates evidence', input: { status: 'CONFIRMED', representationClass: 'EQUATION', hashMatchesCurrentWork: true, sameLearner: false }, expected: { admissible: false }, criticalFailureTags: ['UNCONFIRMED_INTERPRETATION_USED', 'CROSS_LEARNER_AUTHORITY'] },

  // ── L. integrity false-positive resistance ──
  {
    id: 'PP11-G-01', category: 'L', kind: 'integrity', label: 'single tab switch stays LOW evidence-seeking, never punitive',
    input: { events: [{ type: 'PRACTICE_VISIBLE', atOffsetMs: 0 }, { type: 'CHECK_REQUESTED', atOffsetMs: 5000 }, { type: 'PRACTICE_HIDDEN', atOffsetMs: 8000 }, { type: 'PRACTICE_VISIBLE', atOffsetMs: 12000 }, { type: 'CHECK_COMPLETED', atOffsetMs: 90000 }] },
    expected: { outcomeCode: 'ok', concern: 'LOW', action: 'ASK_REASONING_QUESTION' },
    criticalFailureTags: ['INTEGRITY_PUNITIVE_ACTION'],
  },
  {
    id: 'PP11-G-02', category: 'L', kind: 'integrity', label: 'multiple interruptions plus rapid submissions escalate to MODERATE transfer request',
    input: { events: [{ type: 'CHECK_REQUESTED', atOffsetMs: 0 }, { type: 'CHECK_REQUESTED', atOffsetMs: 10000 }, { type: 'CHECK_REQUESTED', atOffsetMs: 20000 }, { type: 'PRACTICE_HIDDEN', atOffsetMs: 25000 }, { type: 'PRACTICE_VISIBLE', atOffsetMs: 30000 }, { type: 'PRACTICE_HIDDEN', atOffsetMs: 35000 }, { type: 'PRACTICE_VISIBLE', atOffsetMs: 40000 }] },
    expected: { outcomeCode: 'ok', concern: 'MODERATE', action: 'REQUEST_TRANSFER_PROBLEM' },
    criticalFailureTags: ['INTEGRITY_PUNITIVE_ACTION'],
  },
  {
    id: 'PP11-G-03', category: 'L', kind: 'integrity', label: 'short solve with substantial work keeps counter-signals and stays LOW',
    input: { events: [{ type: 'CHECK_REQUESTED', atOffsetMs: 0 }, { type: 'CHECK_COMPLETED', atOffsetMs: 500 }], readers: { workChars: 500, revisionCount: 3, reasoningSteps: 4 } },
    expected: { outcomeCode: 'ok', concern: 'LOW', action: 'ASK_REASONING_QUESTION' },
    criticalFailureTags: ['INTEGRITY_PUNITIVE_ACTION'],
  },
  {
    id: 'PP11-G-04', category: 'L', kind: 'integrity', label: 'normal revision sequence raises no concern',
    input: { events: [{ type: 'CHECK_REQUESTED', atOffsetMs: 0 }, { type: 'CHECK_COMPLETED', atOffsetMs: 60000 }], readers: { workChars: 300, revisionCount: 2, reasoningSteps: 2, hadIncorrectBeforeCorrect: true } },
    expected: { outcomeCode: 'ok', concern: 'NONE', action: 'NONE' },
    criticalFailureTags: ['INTEGRITY_PUNITIVE_ACTION'],
  },
  {
    id: 'PP11-G-05', category: 'L', kind: 'integrity', label: 'malformed client chronology records nothing and raises no concern',
    input: { events: [{ type: 'CHECK_REQUESTED', atOffsetMs: 0, malformedClientTime: true }] },
    expected: { outcomeCode: 'OUT_OF_ORDER' },
    criticalFailureTags: ['INTEGRITY_PUNITIVE_ACTION'],
  },
  {
    id: 'PP11-G-06', category: 'L', kind: 'integrity', label: 'unclosed hidden interval invents no duration and no signal',
    input: { events: [{ type: 'CHECK_REQUESTED', atOffsetMs: 0 }, { type: 'PRACTICE_HIDDEN', atOffsetMs: 60000 }] },
    expected: { outcomeCode: 'ok', concern: 'NONE', action: 'NONE' },
    criticalFailureTags: ['INTEGRITY_PUNITIVE_ACTION'],
  },
  {
    id: 'PP11-G-07', category: 'L', kind: 'integrity', label: 'rapid submissions with no reasoning stay LOW evidence-seeking',
    input: { events: [{ type: 'CHECK_REQUESTED', atOffsetMs: 0 }, { type: 'CHECK_REQUESTED', atOffsetMs: 5000 }, { type: 'CHECK_REQUESTED', atOffsetMs: 9000 }] },
    expected: { outcomeCode: 'ok', concern: 'LOW', action: 'ASK_REASONING_QUESTION' },
    criticalFailureTags: ['INTEGRITY_PUNITIVE_ACTION'],
  },

  // ── M. evidence-admission / mastery protection ──
  { id: 'PP11-E-01', category: 'M', kind: 'evidence', label: 'valid correct check admits evidence with full downstream order', input: { checkStatus: 'CONFIRMED_CORRECT', checkConfidence: 0.9, checkIsCurrent: true, versionMatchesHead: true, problemStatus: 'READY', interpretationRequired: false, interpretationStatus: null, evidenceCommitterOk: true, replaySeen: false, priorIncorrectWithDivergence: false, priorSupportLevel: null, integrityConcern: null }, expected: { admitted: true, masteryProjected: true, memoryProjected: true, revisionProjected: true, growthProjected: true }, criticalFailureTags: ['FALSE_MASTERY_MUTATION', 'FAIL_OPEN_PROTECTED_STATE'] },
  { id: 'PP11-E-02', category: 'M', kind: 'evidence', label: 'invalid problem admits zero state and zero mutation', input: { checkStatus: 'CONFIRMED_INCORRECT', checkConfidence: 0.86, checkIsCurrent: true, versionMatchesHead: true, problemStatus: 'INVALID', interpretationRequired: false, interpretationStatus: null, evidenceCommitterOk: true, replaySeen: false, priorIncorrectWithDivergence: true, priorSupportLevel: 'L1', integrityConcern: null }, expected: { admitted: false, failureCode: 'EVIDENCE_NOT_ADMISSIBLE', masteryProjected: false, memoryProjected: false, revisionProjected: false, growthProjected: false }, criticalFailureTags: ['FALSE_MASTERY_MUTATION', 'FAIL_OPEN_PROTECTED_STATE'] },
  { id: 'PP11-E-03', category: 'M', kind: 'evidence', label: 'unconfirmed interpretation admits zero state', input: { checkStatus: 'CONFIRMED_CORRECT', checkConfidence: 0.9, checkIsCurrent: true, versionMatchesHead: true, problemStatus: 'READY', interpretationRequired: true, interpretationStatus: 'CANDIDATES_AVAILABLE', evidenceCommitterOk: true, replaySeen: false, priorIncorrectWithDivergence: false, priorSupportLevel: null, integrityConcern: null }, expected: { admitted: false, failureCode: 'EVIDENCE_NOT_ADMISSIBLE', masteryProjected: false, memoryProjected: false, revisionProjected: false, growthProjected: false }, criticalFailureTags: ['UNCONFIRMED_INTERPRETATION_USED', 'FALSE_MASTERY_MUTATION'] },
  { id: 'PP11-E-04', category: 'M', kind: 'evidence', label: 'failed evidence commit produces zero downstream state', input: { checkStatus: 'CONFIRMED_CORRECT', checkConfidence: 0.9, checkIsCurrent: true, versionMatchesHead: true, problemStatus: 'READY', interpretationRequired: false, interpretationStatus: null, evidenceCommitterOk: false, replaySeen: false, priorIncorrectWithDivergence: false, priorSupportLevel: null, integrityConcern: null }, expected: { admitted: false, failureCode: 'EVIDENCE_COMMIT_FAILED', masteryProjected: false, memoryProjected: false, revisionProjected: false, growthProjected: false }, criticalFailureTags: ['FALSE_MASTERY_MUTATION', 'FAIL_OPEN_PROTECTED_STATE'] },
  { id: 'PP11-E-05', category: 'M', kind: 'evidence', label: 'duplicate replay commits once and mutates nothing twice', input: { checkStatus: 'CONFIRMED_CORRECT', checkConfidence: 0.9, checkIsCurrent: true, versionMatchesHead: true, problemStatus: 'READY', interpretationRequired: false, interpretationStatus: null, evidenceCommitterOk: true, replaySeen: true, priorIncorrectWithDivergence: false, priorSupportLevel: null, integrityConcern: null }, expected: { admitted: false, failureCode: 'IDEMPOTENCY_CONFLICT', masteryProjected: false, memoryProjected: false, revisionProjected: false, growthProjected: false }, criticalFailureTags: ['DUPLICATE_PROTECTED_MUTATION', 'FALSE_MASTERY_MUTATION'] },
  { id: 'PP11-E-06', category: 'M', kind: 'evidence', label: 'moderate integrity concern preserves math but defers mastery and memory', input: { checkStatus: 'CONFIRMED_CORRECT', checkConfidence: 0.9, checkIsCurrent: true, versionMatchesHead: true, problemStatus: 'READY', interpretationRequired: false, interpretationStatus: null, evidenceCommitterOk: true, replaySeen: false, priorIncorrectWithDivergence: false, priorSupportLevel: null, integrityConcern: 'MODERATE' }, expected: { admitted: true, masteryProjected: false, memoryProjected: false, revisionProjected: true, growthProjected: true, evidenceHeldForTransfer: true }, criticalFailureTags: ['FALSE_MASTERY_MUTATION'] },
  { id: 'PP11-E-07', category: 'M', kind: 'evidence', label: 'supported correction is support-qualified evidence, not independent mastery', input: { checkStatus: 'CONFIRMED_CORRECT', checkConfidence: 0.9, checkIsCurrent: true, versionMatchesHead: true, problemStatus: 'READY', interpretationRequired: false, interpretationStatus: null, evidenceCommitterOk: true, replaySeen: false, priorIncorrectWithDivergence: true, priorSupportLevel: 'L1', integrityConcern: null }, expected: { admitted: true, masteryProjected: true, memoryProjected: true, revisionProjected: true, growthProjected: true, supportQuality: 'CORRECTED_AFTER_SUPPORT', masterySignal: 'correct_after_support' }, criticalFailureTags: ['FALSE_MASTERY_MUTATION', 'FALSE_INDEPENDENT_TRANSFER'] },
];
