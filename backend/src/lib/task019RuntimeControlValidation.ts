import type { RuntimeControlContext, AiCostRouteType, RetryStormSignal, DegradedMode, AiCostEstimate } from '../contracts/task019RuntimeControlContracts';

const VALID_ROUTE_KEY_REGEX = /^\/api\/[a-z0-9/_-]+$/;
const VALID_SCHOOL_ID_REGEX = /^[a-zA-Z0-9_-]{1,128}$/;
const VALID_LEARNER_ID_REGEX = /^[a-zA-Z0-9_-]{1,128}$/;
const VALID_ROLE_REGEX = /^(student|admin|counselor|system|service|anonymous)$/;
const VALID_QUOTA_WINDOWS = ['daily', 'weekly', 'monthly'] as const;
const VALID_COST_ROUTE_TYPES: AiCostRouteType[] = ['chat', 'research', 'voice_stt', 'voice_tts', 'video_recommendation', 'challenge_generation', 'revision_generation'];
const VALID_RETRY_SIGNALS: RetryStormSignal[] = ['client_retry_loop', 'sse_reconnect_storm', 'voice_start_stop_loop', 'repeated_ai_failure', 'idempotency_key_replay', 'request_fingerprint_replay', 'no_storm'];
const VALID_DEGRADED_MODES: DegradedMode[] = ['allow_full', 'allow_limited', 'allow_cached_or_short', 'delay', 'block_with_safe_message', 'admin_only_block'];

export function validateRouteKey(routeKey: string): { valid: boolean; error?: string } {
  if (typeof routeKey !== 'string' || routeKey.length === 0) return { valid: false, error: 'Route key must be a non-empty string' };
  if (!VALID_ROUTE_KEY_REGEX.test(routeKey) && !routeKey.startsWith('/api/')) return { valid: false, error: 'Route key must start with /api/' };
  return { valid: true };
}

export function validateSchoolId(schoolId: string): { valid: boolean; error?: string } {
  if (typeof schoolId !== 'string' || schoolId.length === 0) return { valid: false, error: 'School ID must be a non-empty string' };
  if (!VALID_SCHOOL_ID_REGEX.test(schoolId)) return { valid: false, error: 'School ID contains invalid characters' };
  return { valid: true };
}

export function validateLearnerId(learnerId: string): { valid: boolean; error?: string } {
  if (typeof learnerId !== 'string' || learnerId.length === 0) return { valid: false, error: 'Learner ID must be a non-empty string' };
  if (!VALID_LEARNER_ID_REGEX.test(learnerId)) return { valid: false, error: 'Learner ID contains invalid characters' };
  return { valid: true };
}

export function validateRole(role: string): { valid: boolean; error?: string } {
  if (typeof role !== 'string' || role.length === 0) return { valid: false, error: 'Role must be a non-empty string' };
  if (!VALID_ROLE_REGEX.test(role)) return { valid: false, error: 'Role must be one of: student, admin, counselor, system, service, anonymous' };
  return { valid: true };
}

export function validateQuotaWindow(window: string): { valid: boolean; error?: string } {
  if (!VALID_QUOTA_WINDOWS.includes(window as any)) return { valid: false, error: 'Quota window must be one of: daily, weekly, monthly' };
  return { valid: true };
}

export function validateCostValue(value: number, name: string): { valid: boolean; error?: string } {
  if (typeof value !== 'number' || isNaN(value)) return { valid: false, error: `${name} must be a valid number` };
  if (value < 0) return { valid: false, error: `${name} must be non-negative` };
  return { valid: true };
}

export function validateRetryCounter(counter: number): { valid: boolean; error?: string } {
  if (typeof counter !== 'number' || isNaN(counter) || !Number.isInteger(counter)) return { valid: false, error: 'Retry counter must be an integer' };
  if (counter < 0) return { valid: false, error: 'Retry counter must be non-negative' };
  return { valid: true };
}

export function validateAbuseSignalType(signal: string): { valid: boolean; error?: string } {
  if (VALID_RETRY_SIGNALS.includes(signal as RetryStormSignal)) return { valid: true };
  return { valid: false, error: 'Unknown abuse signal type' };
}

export function validateAdminQueryFilter(filter: Record<string, unknown>): { valid: boolean; error?: string; sanitized: Record<string, unknown> } {
  const allowedKeys = ['schoolId', 'studentId', 'route', 'window', 'since', 'limit', 'scope'];
  const sanitized: Record<string, unknown> = {};
  for (const key of Object.keys(filter)) {
    if (allowedKeys.includes(key)) {
      sanitized[key] = filter[key];
    }
  }
  return { valid: true, sanitized };
}

export function validateRuntimeControlContext(ctx: RuntimeControlContext): { valid: boolean; error?: string } {
  if (typeof ctx.routeKey !== 'string' || ctx.routeKey.length === 0) return { valid: false, error: 'Route key is required' };
  const routeValidation = validateRouteKey(ctx.routeKey);
  if (!routeValidation.valid) return routeValidation;

  if (ctx.schoolId) {
    const schoolValidation = validateSchoolId(ctx.schoolId);
    if (!schoolValidation.valid) return schoolValidation;
  }

  if (ctx.studentId) {
    const learnerValidation = validateLearnerId(ctx.studentId);
    if (!learnerValidation.valid) return learnerValidation;
  }

  if (ctx.role) {
    const roleValidation = validateRole(ctx.role);
    if (!roleValidation.valid) return roleValidation;
  }

  return { valid: true };
}

export function validateCostRouteType(routeType: string): { valid: boolean; error?: string } {
  if (!VALID_COST_ROUTE_TYPES.includes(routeType as AiCostRouteType)) {
    return { valid: false, error: `Cost route type must be one of: ${VALID_COST_ROUTE_TYPES.join(', ')}` };
  }
  return { valid: true };
}

export function validateAiCostEstimate(estimate: AiCostEstimate): { valid: boolean; error?: string } {
  const typeValidation = validateCostRouteType(estimate.routeType);
  if (!typeValidation.valid) return typeValidation;

  const tokensValidation = validateCostValue(estimate.estimatedTokens, 'estimatedTokens');
  if (!tokensValidation.valid) return tokensValidation;

  const audioValidation = validateCostValue(estimate.estimatedAudioSeconds, 'estimatedAudioSeconds');
  if (!audioValidation.valid) return audioValidation;

  const costValidation = validateCostValue(estimate.estimatedCostUnits, 'estimatedCostUnits');
  if (!costValidation.valid) return costValidation;

  return { valid: true };
}

export function failClosed<T>(validation: { valid: boolean; error?: string }, fallback: T): T {
  if (!validation.valid) return fallback;
  return undefined as unknown as T;
}

export const FORBIDDEN_FIELDS = [
  'rawChat', 'rawMessage', 'rawPrompt', 'rawResponse',
  'providerPrompt', 'providerResponse', 'rawProviderResponse',
  'chainOfThought', 'hiddenReasoning', 'scratchpad',
  'answerKey', 'correctAnswer', 'modelAnswer',
  'markingScheme', 'teacherOnlyNotes',
  'safeguardingRaw', 'deenSensitiveRaw',
  'authorization', 'cookie', 'apiKey',
  'DATABASE_URL', 'REDIS_URL', 'connectionString', 'privateKey'
] as const;

export function hasForbiddenField(payload: Record<string, unknown>): { hasForbidden: boolean; forbiddenFields: string[] } {
  const found: string[] = [];
  for (const key of Object.keys(payload)) {
    if ((FORBIDDEN_FIELDS as readonly string[]).includes(key)) {
      found.push(key);
    }
  }
  return { hasForbidden: found.length > 0, forbiddenFields: found };
}
