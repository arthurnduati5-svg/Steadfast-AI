import type { SafeGenerationRequest } from './safeGenerationContracts';
import type { PolicyAwarePromptBundle } from './promptBoundaryContracts';
import type { ModelRoutingDecision } from './modelRoutingContracts';
import type { ProviderGenerationResult } from './modelProviderContracts';
import { ProviderHealthService } from './providerHealthService';
import { logger } from '../../utils/logger';

export interface AIProviderGatewayInput {
  generationRequest: SafeGenerationRequest;
  promptBundle: PolicyAwarePromptBundle;
  routingDecision: ModelRoutingDecision;
}

export async function generate(
  input: AIProviderGatewayInput,
  healthService: ProviderHealthService,
  timeoutMs: number = 30000,
): Promise<ProviderGenerationResult> {
  const { generationRequest, promptBundle, routingDecision } = input;

  if (!generationRequest.policyPacket) {
    const errMsg = 'Generation rejected: no policy packet provided';
    logger.warn({ requestId: generationRequest.requestId }, errMsg);
    return {
      requestId: generationRequest.requestId,
      providerId: 'none',
      modelId: 'none',
      ok: false,
      errorCode: 'no_policy',
      errorMessage: errMsg,
    };
  }

  if (!routingDecision.allowedToRoute) {
    const errMsg = `Generation rejected: routing not allowed. Reason: ${routingDecision.reason}`;
    logger.warn({ requestId: generationRequest.requestId, reason: routingDecision.reason }, errMsg);
    return {
      requestId: generationRequest.requestId,
      providerId: 'none',
      modelId: 'none',
      ok: false,
      errorCode: 'routing_blocked',
      errorMessage: errMsg,
    };
  }

  if (!routingDecision.providerId) {
    const errMsg = 'Generation rejected: no provider selected by router';
    logger.warn({ requestId: generationRequest.requestId }, errMsg);
    return {
      requestId: generationRequest.requestId,
      providerId: 'none',
      modelId: 'none',
      ok: false,
      errorCode: 'no_provider',
      errorMessage: errMsg,
    };
  }

  const adapter = healthService.getAdapter(routingDecision.providerId);
  if (!adapter) {
    const errMsg = `Generation rejected: adapter not found for provider ${routingDecision.providerId}`;
    logger.warn({ requestId: generationRequest.requestId, providerId: routingDecision.providerId }, errMsg);
    return {
      requestId: generationRequest.requestId,
      providerId: routingDecision.providerId,
      modelId: routingDecision.modelId || 'unknown',
      ok: false,
      errorCode: 'adapter_not_found',
      errorMessage: errMsg,
    };
  }

  logger.info({
    requestId: generationRequest.requestId,
    providerId: routingDecision.providerId,
    modelId: routingDecision.modelId,
    generationMode: routingDecision.routedBy,
  }, 'Calling provider for generation');

  try {
    const result = await adapter.generate({
      requestId: generationRequest.requestId,
      providerId: routingDecision.providerId,
      modelId: routingDecision.modelId || 'default',
      prompt: promptBundle.prompt,
      generationMode: 'socratic_tutoring',
      timeoutMs,
    });

    if (!result.ok) {
      logger.warn({
        requestId: generationRequest.requestId,
        providerId: routingDecision.providerId,
        errorCode: result.errorCode,
        latencyMs: result.latencyMs,
      }, 'Provider generation failed');
    }

    return result;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown provider error';
    logger.error({
      requestId: generationRequest.requestId,
      providerId: routingDecision.providerId,
      error: errorMessage,
    }, 'Provider generation threw exception');

    return {
      requestId: generationRequest.requestId,
      providerId: routingDecision.providerId,
      modelId: routingDecision.modelId || 'default',
      ok: false,
      errorCode: 'provider_exception',
      errorMessage: 'Provider call failed with an unexpected error',
      latencyMs: undefined,
    };
  }
}
