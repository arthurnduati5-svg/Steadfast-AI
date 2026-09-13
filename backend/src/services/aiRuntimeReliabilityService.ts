import type { AiCircuitBreakerState } from '../contracts/aiRuntimeReliabilityContracts';
import type { AiProviderErrorCategory, AiSafeFallbackDecision, AiRuntimeReliabilityResult } from '../contracts/aiRuntimeReliabilityContracts';
import { classifyAiProviderError } from './aiProviderErrorClassifierService';
import { runWithAiTimeout } from './aiRuntimeTimeoutService';
import { decideAiRetry, calculateRetryDelayMs } from './aiRuntimeRetryPolicyService';
import { checkAiRateLimit, recordAiRateLimitUsage } from './aiRuntimeRateLimitGuardService';
import { beforeAiProviderCall, recordAiProviderSuccess, recordAiProviderFailure, getAiCircuitBreakerSnapshot } from './aiRuntimeCircuitBreakerService';
import { estimateAiTokens, checkAiBudget, recordAiBudgetUsage } from './aiRuntimeBudgetGuardService';
import { decideAiSafeFallback } from './aiRuntimeFallbackPolicyService';
import { recordAiCallTelemetry } from './backendAiTelemetryService';

export async function runReliableAiOperation<T>(input: {
  provider: string;
  model?: string;
  operation: 'chat_completion' | 'tool_call' | 'embedding' | 'classification' | 'unknown';
  operationIdempotent?: boolean;
  actorType?: string;
  actorId?: string;
  schoolId?: string;
  requestId?: string;
  traceId?: string;
  promptTextForTokenEstimateOnly?: string;
  maxOutputTokens?: number;
  socraticRequired?: boolean;
  noFinalAnswerRequired?: boolean;
  sourceRequired?: boolean;
  fn: (signal: AbortSignal) => Promise<T>;
}): Promise<AiRuntimeReliabilityResult<T>> {
  const startTime = Date.now();
  const socraticRequired = input.socraticRequired !== false;
  const noFinalAnswerRequired = input.noFinalAnswerRequired !== false;
  const operation = input.operation;
  const provider = input.provider;

  // 1. Estimate token budget
  const tokenEstimate = estimateAiTokens({
    text: input.promptTextForTokenEstimateOnly,
    maxOutputTokens: input.maxOutputTokens,
  });

  // 2. Check budget before provider call
  const budgetCheck = checkAiBudget({
    provider,
    model: input.model,
    operation,
    actorType: input.actorType,
    actorId: input.actorId,
    schoolId: input.schoolId,
    estimatedInputTokens: tokenEstimate.estimatedInputTokens,
    estimatedOutputTokens: tokenEstimate.estimatedOutputTokens,
  });

  if (!budgetCheck.allowed) {
    const fallback = decideAiSafeFallback({
      errorCategory: 'budget_exceeded',
      operation,
      socraticRequired,
      noFinalAnswerRequired,
      sourceRequired: input.sourceRequired,
    });
    return {
      ok: false,
      errorCategory: 'budget_exceeded',
      attempts: 0,
      durationMs: Date.now() - startTime,
      fallback,
      reliability: { provider, operation, circuitState: 'closed' as AiCircuitBreakerState, budgetAllowed: false, rateLimitAllowed: false },
    };
  }

  // 3. Check rate limit
  const rateCheck = checkAiRateLimit({
    actorType: input.actorType,
    actorId: input.actorId,
    schoolId: input.schoolId,
    provider,
    operation,
  });

  if (!rateCheck.allowed) {
    const fallback = decideAiSafeFallback({
      errorCategory: 'rate_limited',
      operation,
      socraticRequired,
      noFinalAnswerRequired,
      sourceRequired: input.sourceRequired,
    });
    return {
      ok: false,
      errorCategory: 'rate_limited',
      attempts: 0,
      durationMs: Date.now() - startTime,
      fallback,
      reliability: { provider, operation, circuitState: 'closed' as AiCircuitBreakerState, budgetAllowed: true, rateLimitAllowed: false },
    };
  }

  let attempts = 0;
  let lastErrorCategory: AiProviderErrorCategory = 'unknown';
  let circuitState: AiCircuitBreakerState = 'closed';

  while (attempts < (input.operationIdempotent === false ? 1 : 3)) {
    // 4. Check circuit breaker
    const circuitCheck = beforeAiProviderCall({ provider, operation });

    if (!circuitCheck.allowed) {
      circuitState = circuitCheck.snapshot.state;
      const fallback = decideAiSafeFallback({
        errorCategory: 'circuit_open',
        operation,
        socraticRequired,
        noFinalAnswerRequired,
        sourceRequired: input.sourceRequired,
      });
      return {
        ok: false,
        errorCategory: 'circuit_open',
        attempts,
        durationMs: Date.now() - startTime,
        fallback,
        reliability: { provider, operation, circuitState, budgetAllowed: true, rateLimitAllowed: true },
      };
    }

    circuitState = circuitCheck.snapshot.state;

    // 5. Record usage for rate limiting
    recordAiRateLimitUsage({
      actorType: input.actorType,
      actorId: input.actorId,
      schoolId: input.schoolId,
      provider,
      operation,
    });

    // 6. Run provider call with timeout
    try {
      const result = await runWithAiTimeout<T>({
        operation,
        fn: input.fn,
      });

      // Success — record circuit success and budget usage
      recordAiProviderSuccess({ provider, operation });
      recordAiBudgetUsage({
        provider,
        model: input.model,
        operation,
        actorType: input.actorType,
        actorId: input.actorId,
        schoolId: input.schoolId,
        inputTokens: tokenEstimate.estimatedInputTokens,
        outputTokens: tokenEstimate.estimatedOutputTokens,
      });

      recordAiCallTelemetry({
        requestId: input.requestId,
        traceId: input.traceId,
        aiServiceName: provider,
        startTime,
        success: true,
      });

      return {
        ok: true,
        data: result,
        attempts: attempts + 1,
        durationMs: Date.now() - startTime,
        reliability: { provider, operation, circuitState, budgetAllowed: true, rateLimitAllowed: true },
      };
    } catch (error) {
      attempts++;
      const classified = classifyAiProviderError(error);
      lastErrorCategory = classified.category;

      recordAiProviderFailure({ provider, operation, category: classified.category });
      circuitState = getCircuitStateFromBreaker(provider, operation);

      // Decide retry
      const retryDecision = decideAiRetry({
        category: classified.category,
        retryable: classified.retryable,
        attempt: attempts,
        maxAttempts: 3,
        budgetAllowed: true,
        circuitState,
        operationIdempotent: input.operationIdempotent,
        retryAfterMs: classified.retryAfterMs,
      });

      if (!retryDecision.shouldRetry) {
        const fallback = decideAiSafeFallback({
          errorCategory: classified.category,
          operation,
          socraticRequired,
          noFinalAnswerRequired,
          sourceRequired: input.sourceRequired,
        });

        recordAiCallTelemetry({
          requestId: input.requestId,
          traceId: input.traceId,
          aiServiceName: provider,
          startTime,
          success: false,
          errorCode: classified.category,
          errorCategory: classified.category,
        });

        return {
          ok: false,
          errorCategory: classified.category,
          attempts,
          durationMs: Date.now() - startTime,
          fallback,
          reliability: { provider, operation, circuitState, budgetAllowed: true, rateLimitAllowed: true },
        };
      }

      // Wait before retry with backoff/jitter
      if (retryDecision.delayMs && retryDecision.delayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, retryDecision.delayMs));
      }
    }
  }

  // Should not reach here, but handle as fallback
  const fallback = decideAiSafeFallback({
    errorCategory: lastErrorCategory,
    operation,
    socraticRequired,
    noFinalAnswerRequired,
    sourceRequired: input.sourceRequired,
  });

  return {
    ok: false,
    errorCategory: lastErrorCategory,
    attempts,
    durationMs: Date.now() - startTime,
    fallback,
    reliability: { provider, operation, circuitState, budgetAllowed: true, rateLimitAllowed: true },
  };
}

function getCircuitStateFromBreaker(provider: string, operation: string): AiCircuitBreakerState {
  return getAiCircuitBreakerSnapshot({ provider, operation }).state;
}
