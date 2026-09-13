import type { TutorConversationTurnRequest, ConversationRequestValidationResult } from './task017Contracts';
import { TUTOR_CONVERSATION_MODES, MAX_MESSAGE_LENGTH, MAX_ATTEMPT_TEXT_LENGTH, MAX_CLIENT_CONTEXT_SIZE, MAX_IDEMPOTENCY_KEY_LENGTH } from './task017Contracts';

export function validateConversationRequest(
  body: unknown,
  identity: { userId: string; schoolId?: string; role?: string } | null,
): ConversationRequestValidationResult {
  if (!identity || !identity.userId) {
    return { valid: false, error: 'AUTH_REQUIRED', safeMessage: 'Authentication is required to use the tutor.' };
  }
  if (!identity.schoolId) {
    return { valid: false, error: 'LEARNER_CONTEXT_REQUIRED', safeMessage: 'School context is required.' };
  }
  if (identity.role && identity.role !== 'learner' && identity.role !== 'student') {
    return { valid: false, error: 'LEARNER_CONTEXT_REQUIRED', safeMessage: 'Only learners can use the tutor conversation.' };
  }
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'INVALID_REQUEST', safeMessage: 'Request body must be a JSON object.' };
  }

  const req = body as Record<string, unknown>;

  if (!req.mode || typeof req.mode !== 'string') {
    return { valid: false, error: 'INVALID_REQUEST', safeMessage: 'Mode is required and must be a string.' };
  }
  if (!TUTOR_CONVERSATION_MODES.includes(req.mode as any)) {
    return { valid: false, error: 'INVALID_REQUEST', safeMessage: `Invalid mode. Allowed: ${TUTOR_CONVERSATION_MODES.join(', ')}` };
  }

  if (req.message !== undefined && req.message !== null) {
    if (typeof req.message !== 'string') {
      return { valid: false, error: 'INVALID_REQUEST', safeMessage: 'Message must be a string.' };
    }
    if (req.message.length > MAX_MESSAGE_LENGTH) {
      return { valid: false, error: 'INVALID_REQUEST', safeMessage: `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer.` };
    }
  }

  if (req.attemptText !== undefined && req.attemptText !== null) {
    if (typeof req.attemptText !== 'string') {
      return { valid: false, error: 'INVALID_REQUEST', safeMessage: 'attemptText must be a string.' };
    }
    if (req.attemptText.length > MAX_ATTEMPT_TEXT_LENGTH) {
      return { valid: false, error: 'INVALID_REQUEST', safeMessage: `attemptText must be ${MAX_ATTEMPT_TEXT_LENGTH} characters or fewer.` };
    }
  }

  if (req.clientContext !== undefined && req.clientContext !== null) {
    if (typeof req.clientContext !== 'object' || Array.isArray(req.clientContext)) {
      return { valid: false, error: 'INVALID_REQUEST', safeMessage: 'clientContext must be an object.' };
    }
    const ctxSize = JSON.stringify(req.clientContext).length;
    if (ctxSize > MAX_CLIENT_CONTEXT_SIZE) {
      return { valid: false, error: 'INVALID_REQUEST', safeMessage: `clientContext must be ${MAX_CLIENT_CONTEXT_SIZE} characters or fewer.` };
    }
  }

  if (req.idempotencyKey !== undefined && req.idempotencyKey !== null) {
    if (typeof req.idempotencyKey !== 'string') {
      return { valid: false, error: 'INVALID_REQUEST', safeMessage: 'idempotencyKey must be a string.' };
    }
    if (req.idempotencyKey.length > MAX_IDEMPOTENCY_KEY_LENGTH) {
      return { valid: false, error: 'INVALID_REQUEST', safeMessage: `idempotencyKey must be ${MAX_IDEMPOTENCY_KEY_LENGTH} characters or fewer.` };
    }
  }

  if (req.stream !== undefined && req.stream !== null) {
    if (typeof req.stream !== 'boolean') {
      return { valid: false, error: 'INVALID_REQUEST', safeMessage: 'stream must be a boolean.' };
    }
  }

  if (req.sessionId !== undefined && req.sessionId !== null) {
    if (typeof req.sessionId !== 'string' || req.sessionId.length < 1) {
      return { valid: false, error: 'INVALID_REQUEST', safeMessage: 'sessionId must be a non-empty string.' };
    }
  }

  return { valid: true };
}
