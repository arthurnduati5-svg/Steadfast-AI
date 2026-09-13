import type { AiCircuitBreakerState, AiCircuitBreakerSnapshot, AiProviderErrorCategory } from '../contracts/aiRuntimeReliabilityContracts';
import { DEFAULT_CIRCUIT_BREAKER_CONFIG } from '../contracts/aiRuntimeCircuitBreakerContracts';
import type { CircuitBreakerConfig } from '../contracts/aiRuntimeCircuitBreakerContracts';

type CircuitBreakerEntry = {
  state: AiCircuitBreakerState;
  failureCount: number;
  successCount: number;
  openedAt: number;
  halfOpenProbeCount: number;
  lastFailureCategory?: AiProviderErrorCategory;
};

const breakers = new Map<string, CircuitBreakerEntry>();

function makeKey(provider: string, operation: string): string {
  return `${provider}:${operation}`;
}

function getOrCreateBreaker(key: string): CircuitBreakerEntry {
  let b = breakers.get(key);
  if (!b) {
    b = {
      state: 'closed',
      failureCount: 0,
      successCount: 0,
      openedAt: 0,
      halfOpenProbeCount: 0,
    };
    breakers.set(key, b);
  }
  return b;
}

export function getAiCircuitBreakerSnapshot(input: {
  provider: string;
  operation: string;
}): AiCircuitBreakerSnapshot {
  const key = makeKey(input.provider, input.operation);
  const b = getOrCreateBreaker(key);
  return {
    provider: input.provider,
    operation: input.operation,
    state: b.state,
    failureCount: b.failureCount,
    successCount: b.successCount,
    openedAt: b.openedAt > 0 ? new Date(b.openedAt).toISOString() : undefined,
    lastFailureCategory: b.lastFailureCategory,
  };
}

export function beforeAiProviderCall(input: {
  provider: string;
  operation: string;
  nowMs?: number;
  config?: CircuitBreakerConfig;
}): {
  allowed: boolean;
  snapshot: AiCircuitBreakerSnapshot;
  reason: 'allowed' | 'circuit_open' | 'half_open_probe_allowed';
} {
  const nowMs = input.nowMs ?? Date.now();
  const config = input.config ?? DEFAULT_CIRCUIT_BREAKER_CONFIG;
  const key = makeKey(input.provider, input.operation);
  const b = getOrCreateBreaker(key);

  if (b.state === 'closed') {
    return {
      allowed: true,
      snapshot: getAiCircuitBreakerSnapshot({ provider: input.provider, operation: input.operation }),
      reason: 'allowed',
    };
  }

  if (b.state === 'open') {
    const cooldownElapsed = nowMs - b.openedAt;
    if (cooldownElapsed >= config.cooldownMs) {
      b.state = 'half_open';
      b.halfOpenProbeCount = 0;
      return {
        allowed: true,
        snapshot: getAiCircuitBreakerSnapshot({ provider: input.provider, operation: input.operation }),
        reason: 'half_open_probe_allowed',
      };
    }
    return {
      allowed: false,
      snapshot: getAiCircuitBreakerSnapshot({ provider: input.provider, operation: input.operation }),
      reason: 'circuit_open',
    };
  }

  if (b.state === 'half_open') {
    if (b.halfOpenProbeCount < config.halfOpenMaxProbes) {
      b.halfOpenProbeCount++;
      return {
        allowed: true,
        snapshot: getAiCircuitBreakerSnapshot({ provider: input.provider, operation: input.operation }),
        reason: 'half_open_probe_allowed',
      };
    }
    return {
      allowed: false,
      snapshot: getAiCircuitBreakerSnapshot({ provider: input.provider, operation: input.operation }),
      reason: 'circuit_open',
    };
  }

  return {
    allowed: false,
    snapshot: getAiCircuitBreakerSnapshot({ provider: input.provider, operation: input.operation }),
    reason: 'circuit_open',
  };
}

export function recordAiProviderSuccess(input: {
  provider: string;
  operation: string;
  nowMs?: number;
  config?: CircuitBreakerConfig;
}): AiCircuitBreakerSnapshot {
  const config = input.config ?? DEFAULT_CIRCUIT_BREAKER_CONFIG;
  const key = makeKey(input.provider, input.operation);
  const b = getOrCreateBreaker(key);

  b.successCount++;
  b.failureCount = 0;
  b.openedAt = 0;
  b.halfOpenProbeCount = 0;

  if (b.state === 'half_open' && b.successCount >= config.successThreshold) {
    b.state = 'closed';
  } else if (b.state === 'half_open') {
    b.state = 'closed';
  }

  return getAiCircuitBreakerSnapshot({ provider: input.provider, operation: input.operation });
}

export function recordAiProviderFailure(input: {
  provider: string;
  operation: string;
  category: AiProviderErrorCategory;
  nowMs?: number;
  config?: CircuitBreakerConfig;
}): AiCircuitBreakerSnapshot {
  const config = input.config ?? DEFAULT_CIRCUIT_BREAKER_CONFIG;
  const nowMs = input.nowMs ?? Date.now();
  const key = makeKey(input.provider, input.operation);
  const b = getOrCreateBreaker(key);

  b.failureCount++;
  b.lastFailureCategory = input.category;

  if (input.category === 'invalid_request' || input.category === 'auth_error' || input.category === 'budget_exceeded') {
    return getAiCircuitBreakerSnapshot({ provider: input.provider, operation: input.operation });
  }

  if (b.state === 'closed' && b.failureCount >= config.failureThreshold) {
    b.state = 'open';
    b.openedAt = nowMs;
    b.successCount = 0;
  } else if (b.state === 'half_open') {
    b.state = 'open';
    b.openedAt = nowMs;
    b.successCount = 0;
  }

  return getAiCircuitBreakerSnapshot({ provider: input.provider, operation: input.operation });
}

export function resetAiCircuitBreakersForTests(): void {
  breakers.clear();
}
