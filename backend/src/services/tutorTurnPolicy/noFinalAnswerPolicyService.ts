import type { NoFinalAnswerPolicyInput, NoFinalAnswerPolicyResult } from './noFinalAnswerContracts';

export function applyNoFinalAnswerPolicy(input: NoFinalAnswerPolicyInput): NoFinalAnswerPolicyResult {
  const { academicIntegrity } = input;
  const category = academicIntegrity.category;
  const learnerAttemptPresent = academicIntegrity.learnerAttemptPresent;
  const directAnswerRequested = academicIntegrity.directAnswerRequested;

  if (category === 'test_or_exam_answer_request') {
    return {
      finalAnswerBlocked: true,
      allowedAnswerDepth: 'clarify_only',
      mustAskLearnerToTry: true,
      mustAvoidFinalAnswer: true,
      allowedResponsePattern: 'study_support',
      disallowedPatterns: ['give_final_answer', 'provide_solution', 'output_answer_key', 'solve_exam_problem', 'predict_answers'],
      safeRedirectMessage: 'I can help you review the concepts for your test. Would you like to go through a practice example or review a specific topic?',
    };
  }

  if (category === 'essay_or_assignment_completion_request') {
    return {
      finalAnswerBlocked: true,
      allowedAnswerDepth: 'clarify_only',
      mustAskLearnerToTry: true,
      mustAvoidFinalAnswer: true,
      allowedResponsePattern: 'outline_support',
      disallowedPatterns: ['write_complete_essay', 'write_complete_assignment', 'provide_copy_paste_text'],
      safeRedirectMessage: 'I can help you outline your ideas or understand the topic better. What is your main argument or thesis?',
    };
  }

  if (directAnswerRequested && !learnerAttemptPresent) {
    return {
      finalAnswerBlocked: true,
      allowedAnswerDepth: 'hint_only',
      mustAskLearnerToTry: true,
      mustAvoidFinalAnswer: true,
      allowedResponsePattern: 'socratic_redirect',
      disallowedPatterns: ['give_final_answer', 'provide_solution', 'output_answer_key'],
      safeRedirectMessage: 'Let me help you learn how to solve this yourself. What is the first thing you would check or try?',
    };
  }

  if (learnerAttemptPresent) {
    return {
      finalAnswerBlocked: false,
      allowedAnswerDepth: 'attempt_feedback',
      mustAskLearnerToTry: false,
      mustAvoidFinalAnswer: false,
      allowedResponsePattern: 'attempt_feedback',
      disallowedPatterns: ['give_final_answer_without_reasoning_check'],
    };
  }

  if (category === 'normal_learning' || category === 'homework_help') {
    return {
      finalAnswerBlocked: false,
      allowedAnswerDepth: 'conceptual_explanation',
      mustAskLearnerToTry: false,
      mustAvoidFinalAnswer: false,
      allowedResponsePattern: 'socratic_guidance',
      disallowedPatterns: [],
    };
  }

  return {
    finalAnswerBlocked: false,
    allowedAnswerDepth: 'conceptual_explanation',
    mustAskLearnerToTry: false,
    mustAvoidFinalAnswer: false,
    allowedResponsePattern: 'socratic_guidance',
    disallowedPatterns: [],
  };
}
