import type {
  LearnerPreferenceFeedbackType,
  PreferenceFeedbackSafetyDecision,
} from './learnerPreferenceFeedbackContracts';
import {
  LEARNER_PREFERENCE_FEEDBACK_TYPES,
  containsShameLanguage,
  containsFinalAnswerPattern,
  containsRawDataPattern,
  containsPromptInjection,
  containsSafeguardingConcern,
  containsDeenSensitiveText,
} from './learnerPreferenceFeedbackContracts';

const RAW_FIELD_NAMES = [
  'rawChat', 'rawPrompt', 'systemPrompt', 'modelDraft', 'providerResponse',
  'teacherPrivateNote', 'safeguardingRaw', 'privateMemory', 'deenSensitiveRawQuestion',
  'rawTranscript', 'internalReasoning', 'aiReason', 'chainOfThought',
];

function detectRawFieldLeak(input: string): string[] {
  const flags: string[] = [];
  for (const field of RAW_FIELD_NAMES) {
    const regex = new RegExp(field.replace(/([A-Z])/g, '_$1').toLowerCase(), 'i');
    if (regex.test(input)) {
      flags.push(`${field}Detected`);
    }
    if (input.includes(field)) {
      flags.push(`${field}DirectRef`);
    }
  }
  return flags;
}

function redactText(text: string): string {
  let result = text;
  result = result.replace(containsShameLanguage(text) ? /.+/ : '', (match) => {
    return containsShameLanguage(match) ? '[supportive guidance]' : match;
  });
  result = result.replace(containsFinalAnswerPattern(result) ? /.+/ : '', (match) => {
    return containsFinalAnswerPattern(match) ? '[learning guidance]' : match;
  });
  result = result.replace(containsRawDataPattern(result) ? /.+/ : '', (match) => {
    return containsRawDataPattern(match) ? '[safe guidance]' : match;
  });
  if (result.length > 500) {
    result = result.slice(0, 500) + '...[truncated]';
  }
  return result;
}

export function validateFeedbackSafety(
  feedbackType: string,
  freeText?: string,
): PreferenceFeedbackSafetyDecision {
  const safetyFlags: string[] = [];
  const redactionReasons: string[] = [];
  const sanitizedFeedback = freeText || '';

  if (!LEARNER_PREFERENCE_FEEDBACK_TYPES.includes(feedbackType as LearnerPreferenceFeedbackType)) {
    return {
      safe: false,
      sanitizedFeedback: '',
      feedbackType: 'just_right',
      safetyFlags: ['unknown_feedback_type'],
      redactionApplied: false,
      redactionReasons: [],
      blockedReason: 'Unrecognized feedback type',
    };
  }

  if (sanitizedFeedback.length === 0) {
    return {
      safe: true,
      sanitizedFeedback: '',
      feedbackType: feedbackType as LearnerPreferenceFeedbackType,
      safetyFlags: ['no_free_text'],
      redactionApplied: false,
      redactionReasons: [],
    };
  }

  if (sanitizedFeedback.length > 2000) {
    safetyFlags.push('free_text_too_long');
    redactionReasons.push('Free text exceeded maximum length');
  }

  const shameFlags = containsShameLanguage(sanitizedFeedback);
  if (shameFlags) {
    safetyFlags.push('shame_language_detected');
    redactionReasons.push('Shame language redacted');
  }

  const finalAnswerFlags = containsFinalAnswerPattern(sanitizedFeedback);
  if (finalAnswerFlags) {
    safetyFlags.push('final_answer_pattern_detected');
    redactionReasons.push('Final answer pattern redacted');
  }

  const rawDataFlags = containsRawDataPattern(sanitizedFeedback);
  if (rawDataFlags) {
    safetyFlags.push('raw_data_pattern_detected');
    redactionReasons.push('Raw data pattern redacted');
  }

  const promptInjectionFlags = containsPromptInjection(sanitizedFeedback);
  if (promptInjectionFlags) {
    return {
      safe: false,
      sanitizedFeedback: '',
      feedbackType: feedbackType as LearnerPreferenceFeedbackType,
      safetyFlags: [...safetyFlags, 'prompt_injection_detected'],
      redactionApplied: false,
      redactionReasons: ['Prompt injection detected'],
      blockedReason: 'Feedback blocked due to prompt injection attempt',
    };
  }

  const safeguardingFlags = containsSafeguardingConcern(sanitizedFeedback);
  if (safeguardingFlags) {
    return {
      safe: true,
      sanitizedFeedback: redactText(sanitizedFeedback),
      feedbackType: feedbackType as LearnerPreferenceFeedbackType,
      safetyFlags: [...safetyFlags, 'safeguarding_concern_detected'],
      redactionApplied: true,
      redactionReasons: ['Safeguarding concern flagged'],
      blockedReason: undefined,
    };
  }

  const deenFlags = containsDeenSensitiveText(sanitizedFeedback);
  if (deenFlags) {
    safetyFlags.push('deen_sensitive_text_detected');
    redactionReasons.push('Deen sensitive text handled');
  }

  const fieldLeaks = detectRawFieldLeak(sanitizedFeedback);
  if (fieldLeaks.length > 0) {
    safetyFlags.push(...fieldLeaks);
    redactionReasons.push('Raw field reference detected');
  }

  const redacted = redactText(sanitizedFeedback);

  return {
    safe: true,
    sanitizedFeedback: redacted,
    feedbackType: feedbackType as LearnerPreferenceFeedbackType,
    safetyFlags,
    redactionApplied: redactionReasons.length > 0,
    redactionReasons,
  };
}

export function assertFeedbackIsSafe(decision: PreferenceFeedbackSafetyDecision): void {
  if (!decision.safe) {
    throw new Error(`Feedback safety validation failed: ${decision.blockedReason}`);
  }
}
