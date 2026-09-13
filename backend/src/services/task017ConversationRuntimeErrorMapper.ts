import type { ConversationRuntimeErrorCode, TutorConversationErrorEnvelope } from './task017Contracts';

const ERROR_MESSAGES: Record<ConversationRuntimeErrorCode, { safeMessage: string; retryable: boolean }> = {
  AUTH_REQUIRED: { safeMessage: 'Authentication is required.', retryable: false },
  LEARNER_CONTEXT_REQUIRED: { safeMessage: 'Learner school context is required.', retryable: false },
  FORBIDDEN_SESSION_SCOPE: { safeMessage: 'You do not have access to this session.', retryable: false },
  INVALID_REQUEST: { safeMessage: 'The request was invalid.', retryable: false },
  SESSION_NOT_FOUND: { safeMessage: 'Session not found.', retryable: false },
  SESSION_CONFLICT: { safeMessage: 'Session conflict detected.', retryable: false },
  SAFETY_BOUNDARY: { safeMessage: 'The conversation was paused for safety.', retryable: false },
  DEEN_SOURCE_SENSITIVE: { safeMessage: 'For detailed Islamic matters, please consult a qualified scholar.', retryable: false },
  AI_PROVIDER_UNAVAILABLE: { safeMessage: 'The AI service is temporarily unavailable. Please try again.', retryable: true },
  LEARNING_LOOP_FAILED: { safeMessage: 'The learning service encountered an issue. Please try again.', retryable: true },
  STREAM_ABORTED: { safeMessage: 'The stream was interrupted. Please try again.', retryable: true },
  IDEMPOTENCY_CONFLICT: { safeMessage: 'A conflict was detected with a previous request.', retryable: false },
  RATE_LIMITED: { safeMessage: 'Too many requests. Please wait before trying again.', retryable: true },
  UNKNOWN_SAFE_ERROR: { safeMessage: 'An unexpected error occurred. Please try again.', retryable: true },
};

export function mapErrorToEnvelope(
  requestId: string,
  correlationId: string,
  errorCode: ConversationRuntimeErrorCode,
): TutorConversationErrorEnvelope {
  const info = ERROR_MESSAGES[errorCode] || ERROR_MESSAGES.UNKNOWN_SAFE_ERROR;
  return {
    requestId,
    correlationId,
    status: 'error',
    errorCode,
    safeMessage: info.safeMessage,
    retryable: info.retryable,
    privacyMetadata: {
      dataMinimized: true,
      noRawData: true,
    },
    createdAt: new Date().toISOString(),
  };
}
