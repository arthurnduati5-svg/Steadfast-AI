import type { LearningSessionStateRecord, EndToEndLearningLoopResult, SessionTransitionSafetyDecision } from './studentLearningSessionContracts';

const BLOCKED_FIELDS = [
  'rawChat', 'rawPrompt', 'systemPrompt', 'modelDraft', 'providerResponse',
  'answerKey', 'solutionSteps', 'privateMemory', 'teacherOnlyNote',
  'safeguardingRaw', 'deenSensitiveRawQuestion',
];

const SHAME_PATTERNS = /\b(stupid|dumb|foolish|useless|hopeless|failure)\b/i;

export function validateTransitionSafety(
  state: LearningSessionStateRecord,
  result?: EndToEndLearningLoopResult,
): SessionTransitionSafetyDecision {
  const redactedFields: string[] = [];

  // Check for raw content in privacy metadata
  if (state.privacyMetadata) {
    for (const key of BLOCKED_FIELDS) {
      if (key in state.privacyMetadata) {
        redactedFields.push(key);
      }
    }
  }

  // Check for shame language in safe progress summary
  if (state.safeProgressSummary && SHAME_PATTERNS.test(state.safeProgressSummary)) {
    redactedFields.push('safeProgressSummary_shame_language');
  }

  if (result) {
    if (result.learnerFacingResponse && SHAME_PATTERNS.test(result.learnerFacingResponse)) {
      redactedFields.push('learnerFacingResponse_shame_language');
    }

    if (result.whyThisNext && SHAME_PATTERNS.test(result.whyThisNext)) {
      redactedFields.push('whyThisNext_shame_language');
    }
  }

  if (redactedFields.length > 0) {
    return {
      allowed: false,
      blockedReason: `Unsafe content detected in fields: ${redactedFields.join(', ')}`,
      redactedFields,
      safeResponse: true,
    };
  }

  return {
    allowed: true,
    redactedFields: [],
    safeResponse: true,
  };
}

export function validateResultSafety(
  result: EndToEndLearningLoopResult,
): SessionTransitionSafetyDecision {
  const redactedFields: string[] = [];

  // Check no raw content leaks
  const checkRaw = (obj: any, path: string) => {
    if (!obj || typeof obj !== 'object') return;
    for (const key of BLOCKED_FIELDS) {
      if (key in obj) {
        redactedFields.push(`${path}.${key}`);
      }
    }
  };

  checkRaw(result.sessionState, 'sessionState');
  checkRaw(result.privacyMetadata, 'privacyMetadata');

  if (result.learnerFacingResponse && SHAME_PATTERNS.test(result.learnerFacingResponse)) {
    redactedFields.push('learnerFacingResponse_shame');
  }

  if (redactedFields.length > 0) {
    return {
      allowed: false,
      blockedReason: `Result contains unsafe fields: ${redactedFields.join(', ')}`,
      redactedFields,
      safeResponse: true,
    };
  }

  return {
    allowed: true,
    redactedFields: [],
    safeResponse: true,
  };
}
