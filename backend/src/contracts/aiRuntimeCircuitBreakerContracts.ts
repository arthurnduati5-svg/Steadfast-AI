import type {
  AiCircuitBreakerState,
  AiCircuitBreakerSnapshot,
  AiProviderErrorCategory,
} from './aiRuntimeReliabilityContracts';

export type CircuitBreakerConfig = {
  failureThreshold: number;
  successThreshold: number;
  cooldownMs: number;
  halfOpenMaxProbes: number;
};

export const DEFAULT_CIRCUIT_BREAKER_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  successThreshold: 2,
  cooldownMs: 30000,
  halfOpenMaxProbes: 1,
};

export type {
  AiCircuitBreakerState,
  AiCircuitBreakerSnapshot,
  AiProviderErrorCategory,
};
