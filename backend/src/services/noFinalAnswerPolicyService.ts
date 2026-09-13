// ─────────────────────────────────────────────────────────────
// Steadfast AI — No-Final-Answer Policy Service v1
// Detects final-answer-seeking, assignment-solution-seeking,
// and exam/quiz cheating language. Redirects to Socratic help.
// Concept explanations, hints, guided steps, and similar
// practice are always allowed.
//
// DOCTRINE:
// - The tutor must not give final answers to homework/assignment.
// - The tutor must guide thinking through questions, hints, checks.
// - The tutor must not shame students for not knowing.
// ─────────────────────────────────────────────────────────────

import type { AcademicIntegritySignal, SocraticSupportMode } from './socraticTutorPolicyContracts';

// ═══════════════════════════════════════════════════════════════
// Detection Patterns
// ═══════════════════════════════════════════════════════════════

const DIRECT_ANSWER_PATTERNS = [
  /\b(just give(?: me)?(?: the)? answer|final answer|answer only|no steps|tell me the answer|give me the result)\b/i,
  /\b(what is the answer to|what is the solution to|solve this for me|solve it for me|solve this problem for me)\b/i,
  /\b(i need the answer|i want the answer|just tell me|just give me)\b/i,
];

const ASSIGNMENT_SOLUTION_PATTERNS = [
  /\b(can you|could you|please)?\s*(solve|do|complete|finish)\s*(this|it|the)?\s*(problem|homework|assignment|worksheet)?\s*(for me)\b/i,
  /\b(my homework|my assignment|my worksheet|my problem set)\s*(answer|solution|solve|complete|finish)\b/i,
  /\b(do my|complete my|finish my)\s*(homework|assignment|worksheet|problem)\b/i,
  /\b(answer|solution)\s*(for|to)\s*(homework|assignment)\b/i,
  /\b(copy|copy.?paste).*(answer|solution)\b/i,
];

const EXAM_CHEATING_PATTERNS = [
  /\b(cheat|cheating|exam|quiz|test|midterm)\s*(answer|solution|help me pass)\b/i,
  /\b(tell me|give me).*(answers?).*(exam|quiz|test|midterm|final)\b/i,
  /\b(exam|quiz|test|midterm|final exam).*(help me pass|answers?|solutions?)\b/i,
  /\b(i have a test|i have an exam|i have a quiz)\s*(tomorrow|today|coming up)\s*(and|can you).*(help|answer)\b/i,
];

const HOMEWORK_ANSWER_REQUEST_PATTERNS = [
  /\b(is this right|is this correct|check my answer|did i get it right)\b/i,
  /\b(does this look correct|am i correct|am i right)\b/i,
];

// ═══════════════════════════════════════════════════════════════
// Public API
// ═══════════════════════════════════════════════════════════════

export function classifyFinalAnswerRisk(input: {
  message: string;
  artifactContext?: unknown;
  learningMode?: string | null;
  isAssessmentLike?: boolean;
}): {
  noFinalAnswerRequired: boolean;
  integritySignal: AcademicIntegritySignal;
  allowedTutorMoves: string[];
  forbiddenTutorMoves: string[];
  redirectInstruction: string;
} {
  const message = String(input.message || '').trim();
  const learningMode = String(input.learningMode || '').toLowerCase();
  if (!message) {
    return {
      noFinalAnswerRequired: false,
      integritySignal: 'none',
      allowedTutorMoves: ['explain_concept', 'ask_question', 'give_hint', 'provide_guidance', 'suggest_practice'],
      forbiddenTutorMoves: [],
      redirectInstruction: '',
    };
  }

  if (input.isAssessmentLike || /\b(exam|quiz|test|assessment|midterm|final)\b/.test(learningMode)) {
    return {
      noFinalAnswerRequired: true,
      integritySignal: 'exam_or_quiz_cheating_signal',
      allowedTutorMoves: ['concept_review', 'practice_example', 'study_strategy'],
      forbiddenTutorMoves: ['give_final_answer', 'provide_solution', 'output_answer_key', 'solve_exam_problem', 'predict_answers'],
      redirectInstruction: 'I can help you review the concepts for your assessment. Would you like to go through a practice example or review a specific topic?',
    };
  }

  // Check exam/quiz cheating
  for (const pattern of EXAM_CHEATING_PATTERNS) {
    if (pattern.test(message)) {
      return {
        noFinalAnswerRequired: true,
        integritySignal: 'exam_or_quiz_cheating_signal',
        allowedTutorMoves: ['concept_review', 'practice_example', 'study_strategy'],
        forbiddenTutorMoves: ['give_final_answer', 'provide_solution', 'output_answer_key', 'solve_exam_problem', 'predict_answers'],
        redirectInstruction: 'I can help you review the concepts for your test. Would you like to go through a practice example or review a specific topic?',
      };
    }
  }

  // Check assignment solution request
  for (const pattern of ASSIGNMENT_SOLUTION_PATTERNS) {
    if (pattern.test(message)) {
      return {
        noFinalAnswerRequired: true,
        integritySignal: 'possible_homework_answer_request',
        allowedTutorMoves: ['ask_question', 'give_hint', 'concept_explanation', 'similar_practice', 'guided_step'],
        forbiddenTutorMoves: ['give_final_answer', 'provide_solution', 'output_answer_key', 'solve_exact_problem'],
        redirectInstruction: 'I can help you understand the concepts behind this problem rather than solving it directly. Let me ask you a question about the first step.',
      };
    }
  }

  // Check direct final answer request
  for (const pattern of DIRECT_ANSWER_PATTERNS) {
    if (pattern.test(message)) {
      return {
        noFinalAnswerRequired: true,
        integritySignal: 'direct_final_answer_request',
        allowedTutorMoves: ['ask_question', 'give_hint', 'guided_step', 'similar_practice', 'concept_explanation'],
        forbiddenTutorMoves: ['give_final_answer', 'provide_solution', 'output_answer_key'],
        redirectInstruction: 'I will not give the final answer directly, but I can guide you through the method step by step. Let us start with a question to see what you understand so far.',
      };
    }
  }

  // Check homework answer check request
  for (const pattern of HOMEWORK_ANSWER_REQUEST_PATTERNS) {
    if (pattern.test(message)) {
      return {
        noFinalAnswerRequired: true,
        integritySignal: 'possible_homework_answer_request',
        allowedTutorMoves: ['ask_explanation', 'check_reasoning', 'guide_to_correct_method'],
        forbiddenTutorMoves: ['give_final_answer', 'say_correct_without_reasoning'],
        redirectInstruction: 'Instead of telling you if it is right or wrong, let me ask: what steps did you follow to get your answer? Explaining your reasoning helps you learn more deeply.',
      };
    }
  }

  // No final-answer risk detected
  return {
    noFinalAnswerRequired: false,
    integritySignal: 'allowed_learning_help',
    allowedTutorMoves: ['explain_concept', 'ask_question', 'give_hint', 'provide_guidance', 'suggest_practice', 'check_understanding'],
    forbiddenTutorMoves: [],
    redirectInstruction: '',
  };
}

/**
 * Build a tutor-facing instruction for the AI prompt that enforces
 * the no-final-answer policy based on the detected signal.
 */
export function buildNoFinalAnswerTutorInstruction(signal: AcademicIntegritySignal): string {
  switch (signal) {
    case 'direct_final_answer_request':
      return (
        'NO-FINAL-ANSWER POLICY: The student is asking for the final answer directly. ' +
        'Do NOT give the final answer. Do NOT give the solution. ' +
        'Instead, ask a guiding question about the first step they would take. ' +
        'If they persist, offer a hint or a similar worked example (not their exact problem).'
      );
    case 'possible_homework_answer_request':
      return (
        'NO-FINAL-ANSWER POLICY: The student may be asking for help with graded work. ' +
        'Do NOT solve the exact problem. Do NOT give the answer. ' +
        'Instead, explain the underlying concept, provide a similar example with different numbers, ' +
        'or ask a question that helps them reason through the first step.'
      );
    case 'exam_or_quiz_cheating_signal':
      return (
        'NO-FINAL-ANSWER POLICY: The student appears to be asking for exam or quiz answers. ' +
        'Do NOT give any answers. Do NOT predict test questions. ' +
        'Instead, offer concept review, study strategies, or a practice example ' +
        'that is clearly different from their test content.'
      );
    case 'copy_paste_solution_request':
      return (
        'NO-FINAL-ANSWER POLICY: The student appears to want a copy-paste solution. ' +
        'Do NOT provide any text that could be copied as a final answer. ' +
        'Instead, guide them through the reasoning process one step at a time ' +
        'using questions and prompts.'
      );
    case 'plagiarism_signal':
      return (
        'NO-FINAL-ANSWER POLICY: This appears to be a request that could lead to plagiarism. ' +
        'Do NOT generate text that the student could submit as their own work. ' +
        'Instead, focus on teaching the concept and asking the student to produce original reasoning.'
      );
    case 'repeated_shortcut_seeking':
      return (
        'NO-FINAL-ANSWER POLICY: The student has repeatedly asked for shortcuts. ' +
        'Maintain a firm Socratic stance. Do NOT give final answers. ' +
        'Redirect to a specific question about their current understanding. ' +
        'Remind them that learning happens through active problem-solving, not passive answers.'
      );
    case 'none':
    case 'allowed_learning_help':
      return '';
    default:
      return (
        'NO-FINAL-ANSWER POLICY: Use Socratic guidance. Ask questions before giving answers. ' +
        'Guide the student to discover the solution themselves.'
      );
  }
}

/**
 * Get the recommended Socratic support mode for a given integrity signal.
 */
export function getSupportModeForIntegritySignal(signal: AcademicIntegritySignal): SocraticSupportMode {
  switch (signal) {
    case 'direct_final_answer_request':
    case 'possible_homework_answer_request':
    case 'copy_paste_solution_request':
      return 'question_first';
    case 'exam_or_quiz_cheating_signal':
      return 'concept_reteach';
    case 'plagiarism_signal':
      return 'guided_steps';
    case 'repeated_shortcut_seeking':
      return 'reflection_prompt';
    default:
      return 'question_first';
  }
}
