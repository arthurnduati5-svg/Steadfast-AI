import type { AiRetryDecision, AiProviderErrorCategory, AiCircuitBreakerState } from '../contracts/aiRuntimeReliabilityContracts';

const DEFAULT_BASE_DELAY_MS = 1000;
const DEFAULT_MAX_DELAY_MS = 30000;
const DEFAULT_JITTER_RATIO = 0.25;
const DEFAULT_MAX_ATTEMPTS = 3;

function generateJitter(baseDelay: number, jitterRatio: number): number {
  const jitterRange = baseDelay * jitterRatio;
  return baseDelay + (Math.random() * jitterRange * 2 - jitterRange);
}

export function calculateRetryDelayMs(input: {
  attempt: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  jitterRatio?: number;
  retryAfterMs?: number;
}): number {
  const baseDelayMs = input.baseDelayMs ?? DEFAULT_BASE_DELAY_MS;
  const maxDelayMs = input.maxDelayMs ?? DEFAULT_MAX_DELAY_MS;
  const jitterRatio = input.jitterRatio ?? DEFAULT_JITTER_RATIO;

  if (input.retryAfterMs !== undefined && input.retryAfterMs > 0 && input.retryAfterMs < 120000) {
    const withJitter = generateJitter(input.retryAfterMs, jitterRatio);
    return Math.min(withJitter, maxDelayMs);
  }

  const exponentialDelay = baseDelayMs * Math.pow(2, input.attempt - 1);
  const withJitter = generateJitter(exponentialDelay, jitterRatio);
  return Math.min(withJitter, maxDelayMs);
}

export function decideAiRetry(input: {
  category: AiProviderErrorCategory;
  retryable: boolean;
  attempt: number;
  maxAttempts?: number;
  budgetAllowed: boolean;
  circuitState: AiCircuitBreakerState;
  operationIdempotent?: boolean;
  retryAfterMs?: number;
}): AiRetryDecision {
  const maxAttempts = input.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;

  if (!input.budgetAllowed) {
    return {
      shouldRetry: false,
      reason: 'budget_exceeded',
      attempt: input.attempt,
      maxAttempts,
    };
  }

  if (input.circuitState === 'open') {
    return {
      shouldRetry: false,
      reason: 'circuit_open',
      attempt: input.attempt,
      maxAttempts,
    };
  }

  if (input.attempt >= maxAttempts) {
    return {
      shouldRetry: false,
      reason: 'max_attempts_reached',
      attempt: input.attempt,
      maxAttempts,
    };
  }

  if (!input.retryable) {
    return {
      shouldRetry: false,
      reason: 'non_retryable_error',
      attempt: input.attempt,
      maxAttempts,
    };
  }

  if (input.operationIdempotent === false) {
    return {
      shouldRetry: false,
      reason: 'not_idempotent_or_unsafe',
      attempt: input.attempt,
      maxAttempts,
    };
  }

  const delayMs = calculateRetryDelayMs({
    attempt: input.attempt,
    retryAfterMs: input.retryAfterMs,
  });

  const reason = input.category === 'rate_limited' && input.retryAfterMs !== undefined
    ? 'retry_after_rate_limit'
    : 'retryable_transient_error';

  return {
    shouldRetry: true,
    reason,
    attempt: input.attempt,
    maxAttempts,
    delayMs,
  };
}
