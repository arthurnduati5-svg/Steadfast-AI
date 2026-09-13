import type { TutorResponseMove } from './tutorOrchestrationContracts';
import type { LearningResponsePlan } from './learningResponsePlannerContracts';

export interface OutputValidationInput {
  requestId: string;
  responseText: string;
  responseMove: TutorResponseMove;
  plan: LearningResponsePlan;
  deenSourceSensitive?: boolean;
  includesGuidingQuestion: boolean;
  revealsFinalAnswer: boolean;
}

export interface OutputValidationResult {
  requestId: string;
  valid: boolean;
  violations: string[];
  repaired: boolean;
  safeResponseText: string;
}

const FINAL_ANSWER_PATTERNS = [
  /the answer is/i,
  /the correct answer is/i,
  /answer:\s*$/im,
  /^here is the answer/im,
  /^here's the answer/im,
];

const DEEN_INVENTION_PATTERNS = [
  /allah says.*without.*source/i,
  /the prophet said/i,
  /in the quran it says/i,
  /hadith states/i,
  /quran.*verse.*\d+:\d+/i,
];

const GUIDING_QUESTION_PATTERNS = [
  /\?/,
  /what do you think/i,
  /can you/i,
  /how would you/i,
  /why do you/i,
  /try to/i,
  /your turn/i,
];

export function validateOrchestrationOutput(input: OutputValidationInput): OutputValidationResult {
  const violations: string[] = [];
  const text = input.responseText || '';

  if (!text || text.trim().length === 0) {
    violations.push('empty_response');
    return {
      requestId: input.requestId,
      valid: false,
      violations,
      repaired: false,
      safeResponseText: 'I am not able to generate a response right now. Please try again.',
    };
  }

  if (input.revealsFinalAnswer && input.plan.allowedAnswerDepth === 'hint_only') {
    violations.push('final_answer_revealed_when_blocked');
  }

  if (input.plan.allowedAnswerDepth === 'hint_only' || input.plan.allowedAnswerDepth === 'one_step_guidance') {
    const hasFinalAnswerPattern = FINAL_ANSWER_PATTERNS.some(p => p.test(text));
    if (hasFinalAnswerPattern) {
      violations.push('final_answer_content_detected');
    }
  }

  if (input.deenSourceSensitive) {
    const hasInvention = DEEN_INVENTION_PATTERNS.some(p => p.test(text));
    if (hasInvention) {
      violations.push('deen_source_invention');
    }
  }

  if (input.responseMove !== 'safe_refusal' &&
      input.responseMove !== 'deen_referral' &&
      input.responseMove !== 'safety_support_message') {
    const hasGuidingQuestion = GUIDING_QUESTION_PATTERNS.some(p => p.test(text));
    if (!hasGuidingQuestion && !input.includesGuidingQuestion) {
      violations.push('missing_guiding_question');
    }
  }

  const valid = violations.length === 0;

  return {
    requestId: input.requestId,
    valid,
    violations,
    repaired: false,
    safeResponseText: text,
  };
}
