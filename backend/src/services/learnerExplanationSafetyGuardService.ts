import type {
  LearnerRecommendationExplanation,
  LearnerExplanationSafetyDecision,
} from './learnerTransparencyContracts';
import {
  containsShameLanguage,
  containsFinalAnswerPattern,
  containsRawDataPattern,
} from './learnerTransparencyContracts';

const RAW_FIELD_NAMES = [
  'rawChat',
  'rawPrompt',
  'systemPrompt',
  'modelDraft',
  'providerResponse',
  'teacherPrivateNote',
  'safeguardingRaw',
  'privateMemory',
  'deenSensitiveRawQuestion',
];

export function validateExplanationSafety(
  explanation: LearnerRecommendationExplanation,
): LearnerExplanationSafetyDecision {
  const redactionReasons: string[] = [];
  let redactionApplied = false;
  const unsafeFields: string[] = [];

  const textFieldsToCheck = [
    explanation.shortReason,
    explanation.studentFriendlyExplanation,
    explanation.skillConnection,
    explanation.growthConnection,
    explanation.whatToDoFirst,
    explanation.whatHappensNext,
  ].filter(Boolean);

  const combinedText = textFieldsToCheck.join(' ');

  if (containsShameLanguage(combinedText)) {
    redactionReasons.push('shame_language_detected');
    redactionApplied = true;
    return {
      safe: false,
      redactionApplied: true,
      redactionReasons,
      blockedReason: 'Shame language detected in explanation text',
    };
  }

  if (containsFinalAnswerPattern(combinedText)) {
    redactionReasons.push('answer_dump_detected');
    redactionApplied = true;
    return {
      safe: false,
      redactionApplied: true,
      redactionReasons,
      blockedReason: 'Final answer pattern detected in explanation',
    };
  }

  if (containsRawDataPattern(combinedText)) {
    redactionReasons.push('raw_data_pattern_detected');
    redactionApplied = true;
    return {
      safe: false,
      redactionApplied: true,
      redactionReasons,
      blockedReason: 'Raw internal data pattern detected in explanation',
    };
  }

  const explanationAny = explanation as unknown as Record<string, unknown>;
  for (const fieldName of RAW_FIELD_NAMES) {
    if (fieldName in explanationAny && explanationAny[fieldName] !== undefined) {
      unsafeFields.push(fieldName);
      redactionReasons.push(`raw_field_present:${fieldName}`);
      redactionApplied = true;
    }
  }

  if (unsafeFields.length > 0) {
    return {
      safe: false,
      redactionApplied: true,
      redactionReasons,
      blockedReason: `Unsafe fields present in payload: ${unsafeFields.join(', ')}`,
    };
  }

  for (const option of explanation.agencyOptions) {
    if (option.safetyNotes && containsShameLanguage(option.safetyNotes)) {
      redactionReasons.push('shame_language_in_agency_option');
      redactionApplied = true;
    }
    if (option.studentFriendlyDescription && containsFinalAnswerPattern(option.studentFriendlyDescription)) {
      redactionReasons.push('answer_dump_in_agency_option');
      redactionApplied = true;
    }
  }

  return {
    safe: !redactionApplied,
    redactionApplied,
    redactionReasons,
  };
}

export function redactUnsafeExplanationText(input: string): string {
  let result = input;

  if (containsShameLanguage(result)) {
    result = '[supportive guidance]';
  }
  if (containsFinalAnswerPattern(result)) {
    result = '[learning guidance]';
  }
  if (containsRawDataPattern(result)) {
    result = '[safe guidance]';
  }

  if (result.length > 500) {
    result = result.substring(0, 497) + '...';
  }

  return result;
}

export function assertExplanationIsSafe(
  explanation: LearnerRecommendationExplanation,
): void {
  const result = validateExplanationSafety(explanation);
  if (!result.safe) {
    throw new Error(
      `Explanation safety validation failed: ${result.blockedReason || result.redactionReasons.join(', ')}`,
    );
  }
}
