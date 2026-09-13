export type AiProviderErrorCategory =
  | 'rate_limited'
  | 'timeout'
  | 'network_error'
  | 'provider_unavailable'
  | 'invalid_request'
  | 'auth_error'
  | 'content_safety_block'
  | 'budget_exceeded'
  | 'circuit_open'
  | 'unknown';

export type AiRetryDecision = {
  shouldRetry: boolean;
  reason:
    | 'retryable_transient_error'
    | 'retry_after_rate_limit'
    | 'non_retryable_error'
    | 'budget_exceeded'
    | 'circuit_open'
    | 'max_attempts_reached'
    | 'not_idempotent_or_unsafe';
  attempt: number;
  maxAttempts: number;
  delayMs?: number;
};

export type AiTimeoutPolicy = {
  operation: 'chat_completion' | 'tool_call' | 'embedding' | 'classification' | 'unknown';
  timeoutMs: number;
  hardDeadlineMs: number;
};

export type AiCircuitBreakerState = 'closed' | 'open' | 'half_open';

export type AiCircuitBreakerSnapshot = {
  provider: string;
  operation: string;
  state: AiCircuitBreakerState;
  failureCount: number;
  successCount: number;
  openedAt?: string;
  nextProbeAt?: string;
  lastFailureCategory?: AiProviderErrorCategory;
};

export type AiBudgetDecision = {
  allowed: boolean;
  reason:
    | 'allowed'
    | 'estimated_tokens_exceed_limit'
    | 'daily_budget_exceeded'
    | 'student_budget_exceeded'
    | 'school_budget_exceeded'
    | 'provider_budget_exceeded'
    | 'unknown_budget_state';
  estimatedInputTokens?: number;
  estimatedOutputTokens?: number;
  maxAllowedTokens?: number;
};

export type AiSafeFallbackDecision = {
  fallbackAllowed: boolean;
  fallbackMode:
    | 'socratic_retry_later'
    | 'ask_clarifying_question'
    | 'safe_degraded_hint'
    | 'source_required_unavailable'
    | 'no_fallback';
  learnerSafeMessage: string;
  preservesSocraticPolicy: boolean;
  preservesNoFinalAnswer: boolean;
};

export type AiRuntimeReliabilityResult<T> = {
  ok: true;
  data: T;
  attempts: number;
  durationMs: number;
  reliability: {
    provider: string;
    operation: string;
    circuitState: AiCircuitBreakerState;
    budgetAllowed: true;
    rateLimitAllowed: true;
  };
} | {
  ok: false;
  errorCategory: AiProviderErrorCategory;
  attempts: number;
  durationMs: number;
  fallback: AiSafeFallbackDecision;
  reliability: {
    provider: string;
    operation: string;
    circuitState: AiCircuitBreakerState;
    budgetAllowed: boolean;
    rateLimitAllowed: boolean;
  };
};
