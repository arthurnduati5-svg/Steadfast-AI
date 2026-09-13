import type { AcademicIntegrityPolicyInput, AcademicIntegrityPolicyResult, AcademicIntegrityCategory } from './academicIntegrityContracts';

const DIRECT_ANSWER_PATTERNS = [
  /\b(just give(?: me)?(?: the)? answer|final answer|answer only|tell me(?: the)? answer|give me(?: the)? answer|give me the result)\b/i,
  /\b(what is the answer|what is the solution|solve this for me|solve it for me)\b/i,
  /\b(i need the answer|i want the answer|just tell me|just give me)\b/i,
  /\bgive me the answer\b/i,
];

const HOMEWORK_ANSWER_PATTERNS = [
  /\b(answer|solution).{0,30}(homework|assignment)\b/i,
  /\b(homework|assignment).{0,30}(answer|solution)\b/i,
  /\b(do my|complete my|finish my|solve my).{0,20}(homework|assignment|worksheet|problem)\b/i,
  /\b(can you|could you|please).{0,30}(solve|do|complete|finish).{0,20}(this|it|the|my).{0,20}(problem|homework|assignment|worksheet).{0,20}(for me)?\b/i,
];

const EXAM_TEST_PATTERNS = [
  /\b(tell me|give me).{0,20}(answers?|solutions?).{0,20}(exam|quiz|test|midterm|final)\b/i,
  /\b(exam|quiz|test|midterm|final).{0,20}(answers?|solutions?|cheat|help me pass)\b/i,
  /\b(i have a test|i have an exam|i have a quiz).{0,30}(and|can you).{0,30}(help|answer)\b/i,
];

const ESSAY_ASSIGNMENT_PATTERNS = [
  /\b(write my essay|write my paper|write my report|write my assignment)\b/i,
  /\b(write the|give the|provide the).{0,20}(essay|paper|report|assignment|paragraph|composition).{0,20}(for|about)\b/i,
  /\b(make it look like|make it seem like).{0,30}(i wrote|i wrote it)\b/i,
];

const LEARNER_ATTEMPT_PATTERNS = [
  /\b(i tried|my answer is|is this correct|check my work|i got|here is my step|i attempted|my solution|i think|i got|my reasoning)\b/i,
  /\b(did i get it right|does this look correct|am i correct|am i right)\b/i,
];

const LEGITIMATE_HELP_PATTERNS = [
  /\b(explain|understand|how does|how do|what does|can you explain|teach me|help me understand)\b/i,
  /\b(what is the first step|where do I start|how would I)\b/i,
];

function hasLearnerAttempt(text: string): boolean {
  return LEARNER_ATTEMPT_PATTERNS.some(p => p.test(text));
}

function isLegitimateHelp(text: string): boolean {
  return LEGITIMATE_HELP_PATTERNS.some(p => p.test(text));
}

export function evaluateAcademicIntegrity(input: AcademicIntegrityPolicyInput): AcademicIntegrityPolicyResult {
  const text = String(input.messageText || '').trim();

  if (!text) {
    return {
      category: 'unknown',
      integrityRisk: 'none',
      directAnswerRequested: false,
      learnerAttemptPresent: false,
      allowedSupportModes: [],
      disallowedBehaviors: [],
      reasons: ['empty_message'],
    };
  }

  const learnerAttemptPresent = hasLearnerAttempt(text);

  if (learnerAttemptPresent) {
    return {
      category: 'attempt_feedback',
      integrityRisk: 'none',
      directAnswerRequested: false,
      learnerAttemptPresent: true,
      allowedSupportModes: ['attempt_feedback', 'hint', 'one_step_guidance', 'concept_explanation'],
      disallowedBehaviors: ['give_final_answer_without_reasoning_check'],
      reasons: ['learner_attempt_detected'],
    };
  }

  if (isLegitimateHelp(text)) {
    return {
      category: 'normal_learning',
      integrityRisk: 'none',
      directAnswerRequested: false,
      learnerAttemptPresent: false,
      allowedSupportModes: ['concept_explanation', 'hint', 'practice_question', 'one_step_guidance'],
      disallowedBehaviors: [],
      reasons: ['legitimate_learning_help'],
    };
  }

  for (const pattern of EXAM_TEST_PATTERNS) {
    if (pattern.test(text)) {
      return {
        category: 'test_or_exam_answer_request',
        integrityRisk: 'high',
        directAnswerRequested: true,
        learnerAttemptPresent: false,
        allowedSupportModes: ['study_strategy', 'practice_question', 'concept_explanation'],
        disallowedBehaviors: ['give_final_answer', 'provide_solution', 'output_answer_key', 'solve_exam_problem', 'predict_answers'],
        reasons: ['exam_answer_request_detected'],
      };
    }
  }

  for (const pattern of ESSAY_ASSIGNMENT_PATTERNS) {
    if (pattern.test(text)) {
      return {
        category: 'essay_or_assignment_completion_request',
        integrityRisk: 'high',
        directAnswerRequested: true,
        learnerAttemptPresent: false,
        allowedSupportModes: ['outline_support', 'concept_explanation', 'practice_question'],
        disallowedBehaviors: ['write_complete_essay', 'write_complete_assignment', 'provide_copy_paste_text'],
        reasons: ['essay_completion_request_detected'],
      };
    }
  }

  for (const pattern of DIRECT_ANSWER_PATTERNS) {
    if (pattern.test(text)) {
      return {
        category: 'direct_final_answer_request',
        integrityRisk: 'medium',
        directAnswerRequested: true,
        learnerAttemptPresent: false,
        allowedSupportModes: ['hint', 'one_step_guidance', 'concept_explanation', 'practice_question'],
        disallowedBehaviors: ['give_final_answer', 'provide_solution', 'output_answer_key'],
        reasons: ['direct_final_answer_request_detected'],
      };
    }
  }

  for (const pattern of HOMEWORK_ANSWER_PATTERNS) {
    if (pattern.test(text)) {
      return {
        category: 'homework_help',
        integrityRisk: 'low',
        directAnswerRequested: true,
        learnerAttemptPresent: false,
        allowedSupportModes: ['hint', 'one_step_guidance', 'concept_explanation', 'practice_question'],
        disallowedBehaviors: ['give_final_answer', 'provide_solution', 'solve_exact_problem'],
        reasons: ['homework_solution_request_detected'],
      };
    }
  }

  return {
    category: 'normal_learning',
    integrityRisk: 'none',
    directAnswerRequested: false,
    learnerAttemptPresent: false,
    allowedSupportModes: ['concept_explanation', 'hint', 'practice_question', 'one_step_guidance'],
    disallowedBehaviors: [],
    reasons: ['normal_learning_no_integrity_concern'],
  };
}
