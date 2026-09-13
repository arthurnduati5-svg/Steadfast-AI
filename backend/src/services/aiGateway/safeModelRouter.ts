import type { ModelRoutingInput, ModelRoutingDecision } from './modelRoutingContracts';
import type { ModelProviderAdapter } from './modelProviderContracts';
import { ProviderHealthService } from './providerHealthService';

export interface SafeModelRouterConfig {
  defaultProviderId?: string;
  fallbackProviderIds?: string[];
  mockProviderId?: string;
  useMockInTest?: boolean;
}

export async function routeModel(
  input: ModelRoutingInput,
  healthService: ProviderHealthService,
  config: SafeModelRouterConfig = {},
): Promise<ModelRoutingDecision> {
  const policy = input.policyPacket;

  if (!policy.requestId) {
    return {
      allowedToRoute: false,
      routedBy: 'safeModelRouter',
      fallbackProviderIds: [],
      reason: 'Invalid policy packet: missing requestId',
    };
  }

  if (policy.decision === 'block') {
    return {
      allowedToRoute: false,
      routedBy: 'safeModelRouter',
      fallbackProviderIds: [],
      reason: `Policy decision is block: ${policy.blockReasons.join(', ')}`,
    };
  }

  if (policy.decision === 'refer') {
    return {
      allowedToRoute: false,
      routedBy: 'safeModelRouter',
      fallbackProviderIds: [],
      reason: 'Policy decision is referral. No normal generation route.',
    };
  }

  if (policy.decision === 'clarify_first') {
    return {
      allowedToRoute: false,
      routedBy: 'safeModelRouter',
      fallbackProviderIds: [],
      reason: 'Policy decision is clarify_first. Clarification needed before generation.',
    };
  }

  if (policy.safety?.seriousRisk) {
    return {
      allowedToRoute: false,
      routedBy: 'safeModelRouter',
      fallbackProviderIds: [],
      reason: 'Serious safety risk blocks normal generation routing.',
    };
  }

  if (policy.allowedMode === 'safe_refusal' || policy.allowedMode === 'referral_support') {
    return {
      allowedToRoute: false,
      routedBy: 'safeModelRouter',
      fallbackProviderIds: [],
      reason: `Allowed mode ${policy.allowedMode} does not require model generation.`,
    };
  }

  const blockedModes: string[] = ['safe_deen_referral'];
  if (input.generationMode && blockedModes.includes(input.generationMode)) {
    return {
      allowedToRoute: false,
      routedBy: 'safeModelRouter',
      fallbackProviderIds: [],
      reason: `Generation mode ${input.generationMode} does not route to model generation.`,
    };
  }

  const primaryProviderId = input.preferredProviderId || config.defaultProviderId || 'mock-provider';
  const fallbackIds = config.fallbackProviderIds || [];

  if (config.useMockInTest || primaryProviderId === 'mock-provider') {
    const mockAdapter = healthService.getAdapter('mock-provider');
    if (mockAdapter) {
      const status = await mockAdapter.getStatus();
      if (status === 'available') {
        return {
          allowedToRoute: true,
          providerId: 'mock-provider',
          modelId: 'mock-model-v1',
          routedBy: 'safeModelRouter',
          fallbackProviderIds: fallbackIds,
          reason: 'Routed to mock provider for testing',
        };
      }
    }
  }

  const primaryAdapter = healthService.getAdapter(primaryProviderId);
  if (primaryAdapter) {
    const status = await primaryAdapter.getStatus();
    if (status === 'available') {
      const models = await primaryAdapter.listModels();
      const modelId = input.preferredModelId || (models.length > 0 ? models[0].modelId : undefined);
      return {
        allowedToRoute: true,
        providerId: primaryProviderId,
        modelId,
        routedBy: 'safeModelRouter',
        fallbackProviderIds: fallbackIds,
        reason: `Routed to primary provider: ${primaryProviderId}`,
      };
    }
  }

  for (const fallbackId of fallbackIds) {
    const fallbackAdapter = healthService.getAdapter(fallbackId);
    if (fallbackAdapter) {
      const status = await fallbackAdapter.getStatus();
      if (status === 'available') {
        const models = await fallbackAdapter.listModels();
        const modelId = models.length > 0 ? models[0].modelId : undefined;
        return {
          allowedToRoute: true,
          providerId: fallbackId,
          modelId,
          routedBy: 'safeModelRouter',
          fallbackProviderIds: fallbackIds.filter((id) => id !== fallbackId),
          reason: `Primary unavailable. Routed to fallback: ${fallbackId}`,
        };
      }
    }
  }

  const mockAdapter = healthService.getAdapter('mock-provider');
  if (mockAdapter) {
    const status = await mockAdapter.getStatus();
    if (status === 'available') {
      return {
        allowedToRoute: true,
        providerId: 'mock-provider',
        modelId: 'mock-model-v1',
        routedBy: 'safeModelRouter',
        fallbackProviderIds: [],
        reason: 'All configured providers unavailable. Falling back to mock provider.',
      };
    }
  }

  return {
    allowedToRoute: false,
    routedBy: 'safeModelRouter',
    fallbackProviderIds: [],
    reason: 'No available provider found.',
  };
}
