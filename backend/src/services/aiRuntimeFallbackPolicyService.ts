import type { AiProviderErrorCategory, AiSafeFallbackDecision } from '../contracts/aiRuntimeReliabilityContracts';

const LEARNER_SAFE_MESSAGES: Record<string, string> = {
  timeout: 'I\'m having trouble reaching the tutor engine right now. Let\'s keep working safely: tell me what step you tried first, and I\'ll help you reason from there.',
  rate_limited: 'The AI service is temporarily overloaded. I won\'t guess the answer, but I can help you break the problem into the first step.',
  network_error: 'There seems to be a network issue reaching the tutor engine. Please try again shortly.',
  provider_unavailable: 'The AI service is temporarily unavailable. Let\'s continue with what you know — what part of this problem can you solve already?',
  budget_exceeded: 'I\'m near my usage limit for today. Let\'s focus on one small step — what\'s the first thing you tried?',
  circuit_open: 'The AI service is having connectivity trouble. I can still help — explain what you\'re working on and I\'ll guide you step by step.',
  content_safety_block: 'I cannot process that request safely. Please ask a learning-related question.',
  invalid_request: 'I encountered an issue processing your request. Could you rephrase what you need help with?',
  auth_error: 'The tutor engine is experiencing an authentication issue. Please try again later.',
  unknown: 'I encountered an unexpected issue. Please try rephrasing your question or try again later.',
};

const SOURCE_REQUIRED_MESSAGE = 'I cannot verify sources right now, so I should not pretend. Share the material you are using, and I can help you inspect it step by step.';

export function decideAiSafeFallback(input: {
  errorCategory: AiProviderErrorCategory;
  operation: 'chat_completion' | 'tool_call' | 'embedding' | 'classification' | 'unknown';
  socraticRequired: boolean;
  noFinalAnswerRequired: boolean;
  sourceRequired?: boolean;
  canAskClarifyingQuestion?: boolean;
}): AiSafeFallbackDecision {
  const category = input.errorCategory;
  const socraticRequired = input.socraticRequired !== false;
  const noFinalAnswerRequired = input.noFinalAnswerRequired !== false;

  if (input.sourceRequired) {
    return {
      fallbackAllowed: true,
      fallbackMode: 'source_required_unavailable',
      learnerSafeMessage: SOURCE_REQUIRED_MESSAGE,
      preservesSocraticPolicy: true,
      preservesNoFinalAnswer: true,
    };
  }

  if (category === 'content_safety_block') {
    return {
      fallbackAllowed: true,
      fallbackMode: 'safe_degraded_hint',
      learnerSafeMessage: 'I cannot process that request safely. Please ask a learning-related question.',
      preservesSocraticPolicy: true,
      preservesNoFinalAnswer: true,
    };
  }

  if (category === 'budget_exceeded') {
    return {
      fallbackAllowed: true,
      fallbackMode: 'safe_degraded_hint',
      learnerSafeMessage: 'I\'m near my usage limit for today. Let\'s focus on one small step — what\'s the first thing you tried?',
      preservesSocraticPolicy: true,
      preservesNoFinalAnswer: true,
    };
  }

  if (category === 'circuit_open') {
    return {
      fallbackAllowed: true,
      fallbackMode: 'socratic_retry_later',
      learnerSafeMessage: 'The AI service is having connectivity trouble. I can still help — explain what you\'re working on and I\'ll guide you step by step.',
      preservesSocraticPolicy: true,
      preservesNoFinalAnswer: true,
    };
  }

  if (input.canAskClarifyingQuestion) {
    return {
      fallbackAllowed: true,
      fallbackMode: 'ask_clarifying_question',
      learnerSafeMessage: LEARNER_SAFE_MESSAGES[category] || LEARNER_SAFE_MESSAGES.unknown,
      preservesSocraticPolicy: socraticRequired,
      preservesNoFinalAnswer: noFinalAnswerRequired,
    };
  }

  const fallbackMode = (category === 'timeout' || category === 'rate_limited' || category === 'network_error' || category === 'provider_unavailable')
    ? 'socratic_retry_later'
    : 'safe_degraded_hint';

  return {
    fallbackAllowed: true,
    fallbackMode,
    learnerSafeMessage: LEARNER_SAFE_MESSAGES[category] || LEARNER_SAFE_MESSAGES.unknown,
    preservesSocraticPolicy: socraticRequired,
    preservesNoFinalAnswer: noFinalAnswerRequired,
  };
}
