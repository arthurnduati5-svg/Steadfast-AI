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

  // R4: mock routing is TEST-only. Explicit mock config may route to the
  // mock provider only when NODE_ENV === 'test'.
  const primaryProviderId = input.preferredProviderId || config.defaultProviderId || 'mock-provider';
  const fallbackIds = config.fallbackProviderIds || [];

  if (process.env.NODE_ENV === 'test' && (config.useMockInTest || primaryProviderId === 'mock-provider')) {
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

  // Mock as a primary provider ID is still test-only (R4): production traffic
  // must never resolve to the mock provider.
  if (primaryProviderId === 'mock-provider' && process.env.NODE_ENV !== 'test') {
    return {
      allowedToRoute: false,
      routedBy: 'safeModelRouter',
      fallbackProviderIds: [],
      reason: 'Mock provider cannot be the production routing target.',
    };
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

  // R4: NO last-resort production fallback to mock-provider. If no production
  // provider is configured/available, return a truthful routing failure so
  // callers produce a safe unavailable response — never synthetic mock text.
  return {
    allowedToRoute: false,
    routedBy: 'safeModelRouter',
    fallbackProviderIds: [],
    reason: 'No production model provider is configured or available.',
  };
}
