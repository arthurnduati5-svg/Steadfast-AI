import type { ModelProviderAdapter, ProviderGenerationRequest, ProviderGenerationResult, ProviderModelCapability, ProviderStatus } from '../modelProviderContracts';
import type { GenerationMode } from '../safeGenerationContracts';

export interface LocalModelAdapterConfig {
  endpoint?: string;
  modelId?: string;
  apiKey?: string;
}

export class LocalModelAdapter implements ModelProviderAdapter {
  providerId = 'local-provider';
  providerType = 'local' as const;

  private config: LocalModelAdapterConfig;

  constructor(config: LocalModelAdapterConfig = {}) {
    this.config = config;
  }

  async getStatus(): Promise<ProviderStatus> {
    if (!this.config.endpoint) return 'misconfigured';
    if (!this.config.modelId) return 'misconfigured';
    return 'unavailable';
  }

  async listModels(): Promise<ProviderModelCapability[]> {
    if (!this.config.modelId) {
      return [
        {
          modelId: 'local-llm-default',
          providerId: this.providerId,
          supportsChat: true,
          supportsJson: false,
          supportsStreaming: false,
          recommendedUseCases: ['socratic_tutoring', 'hint_only', 'concept_explanation'] as GenerationMode[],
          restrictedUseCases: [] as GenerationMode[],
        },
      ];
    }

    return [
      {
        modelId: this.config.modelId,
        providerId: this.providerId,
        supportsChat: true,
        supportsJson: true,
        supportsStreaming: false,
        recommendedUseCases: ['socratic_tutoring', 'hint_only', 'attempt_feedback', 'concept_explanation', 'practice_generation'] as GenerationMode[],
        restrictedUseCases: ['safe_deen_referral'] as GenerationMode[],
      },
    ];
  }

  async generate(input: ProviderGenerationRequest): Promise<ProviderGenerationResult> {
    const start = Date.now();
    const status = await this.getStatus();

    if (status === 'misconfigured') {
      return {
        requestId: input.requestId,
        providerId: this.providerId,
        modelId: input.modelId,
        ok: false,
        errorCode: 'misconfigured',
        errorMessage: 'Local provider is not configured. Set endpoint and modelId.',
        latencyMs: Date.now() - start,
      };
    }

    return {
      requestId: input.requestId,
      providerId: this.providerId,
      modelId: input.modelId,
      ok: false,
      errorCode: 'provider_unavailable',
      errorMessage: 'Local model endpoint is not reachable. Ensure the local inference server is running.',
      latencyMs: Date.now() - start,
    };
  }
}
