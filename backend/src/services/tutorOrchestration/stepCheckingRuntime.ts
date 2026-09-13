import type { StepCheckResult, StepCheckStatus } from './stepCheckingContracts';
import type { LearningResponsePlan } from './learningResponsePlannerContracts';

export interface StepCheckInput {
  requestId: string;
  learnerAttempt: string;
  expectedAnswer?: string;
  plan?: LearningResponsePlan;
  validationModes?: string[];
  deenSourceSensitive?: boolean;
}

export function checkLearnerStep(input: StepCheckInput): StepCheckResult {
  if (input.deenSourceSensitive) {
    return {
      requestId: input.requestId,
      status: 'needs_source_check',
      checkedAspect: 'Deen source-sensitive attempt',
      reasoning: 'Deen source-sensitive content requires source verification before confirming correctness.',
      nextStepSuggestion: 'Let us check the source together.',
      shouldRevealFinalAnswer: false,
      validationModesUsed: ['deen_source_sensitive_validation'],
    };
  }

  if (!input.learnerAttempt || input.learnerAttempt.trim().length === 0) {
    return {
      requestId: input.requestId,
      status: 'unclear',
      checkedAspect: 'attempt content',
      reasoning: 'No attempt content was provided.',
      nextStepSuggestion: 'Please share your answer or reasoning so I can check it.',
      shouldRevealFinalAnswer: false,
      validationModesUsed: input.validationModes || [],
    };
  }

  const attempt = input.learnerAttempt.trim().toLowerCase();
  const expected = input.expectedAnswer?.trim().toLowerCase();

  if (!expected) {
    if (attempt.length < 3) {
      return {
        requestId: input.requestId,
        status: 'unclear',
        checkedAspect: 'attempt content',
        reasoning: 'The attempt is very short. More detail would help me check it.',
        nextStepSuggestion: 'Can you show your working or explain your reasoning?',
        shouldRevealFinalAnswer: false,
        validationModesUsed: input.validationModes || [],
      };
    }

    return {
      requestId: input.requestId,
      status: 'partially_correct',
      checkedAspect: 'reasoning quality',
      reasoning: 'An attempt was submitted. Let me review your reasoning.',
      nextStepSuggestion: 'Explain how you arrived at your answer.',
      shouldRevealFinalAnswer: false,
      validationModesUsed: input.validationModes || [],
    };
  }

  if (attempt === expected) {
    return {
      requestId: input.requestId,
      status: 'correct',
      checkedAspect: 'answer comparison',
      reasoning: 'Your answer matches the expected answer.',
      nextStepSuggestion: 'Great work! Can you explain how you got that answer?',
      shouldRevealFinalAnswer: true,
      validationModesUsed: input.validationModes || [],
    };
  }

  if (attempt.includes(expected) || expected.includes(attempt)) {
    return {
      requestId: input.requestId,
      status: 'partially_correct',
      checkedAspect: 'answer comparison',
      reasoning: 'Your answer is close to the expected answer but needs adjustment.',
      nextStepSuggestion: 'Check your working for small errors. You are on the right track.',
      shouldRevealFinalAnswer: false,
      validationModesUsed: input.validationModes || [],
    };
  }

  return {
    requestId: input.requestId,
    status: 'incorrect',
    checkedAspect: 'answer comparison',
    reasoning: 'Your answer does not match the expected answer.',
    nextStepSuggestion: 'Let us review the steps together. What was your first step?',
    shouldRevealFinalAnswer: false,
    validationModesUsed: input.validationModes || [],
  };
}
