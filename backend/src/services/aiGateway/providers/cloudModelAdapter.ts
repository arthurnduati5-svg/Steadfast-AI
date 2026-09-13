import type { ModelProviderAdapter, ProviderGenerationRequest, ProviderGenerationResult, ProviderModelCapability, ProviderStatus } from '../modelProviderContracts';
import type { GenerationMode } from '../safeGenerationContracts';

export interface CloudModelAdapterConfig {
  apiKey?: string;
  modelId?: string;
  baseUrl?: string;
}

export class CloudModelAdapter implements ModelProviderAdapter {
  providerId = 'cloud-provider';
  providerType = 'cloud' as const;

  private config: CloudModelAdapterConfig;

  constructor(config: CloudModelAdapterConfig = {}) {
    this.config = config;
  }

  async getStatus(): Promise<ProviderStatus> {
    if (!this.config.apiKey) return 'misconfigured';
    if (!this.config.modelId) return 'misconfigured';
    return 'unavailable';
  }

  async listModels(): Promise<ProviderModelCapability[]> {
    if (!this.config.modelId) {
      return [
        {
          modelId: 'gpt-4o-mini',
          providerId: this.providerId,
          supportsChat: true,
          supportsJson: true,
          supportsStreaming: true,
          recommendedUseCases: ['socratic_tutoring', 'hint_only', 'attempt_feedback', 'concept_explanation', 'practice_generation', 'study_support'] as GenerationMode[],
          restrictedUseCases: ['safe_deen_referral'] as GenerationMode[],
        },
        {
          modelId: 'gpt-4o',
          providerId: this.providerId,
          supportsChat: true,
          supportsJson: true,
          supportsStreaming: true,
          recommendedUseCases: ['socratic_tutoring', 'concept_explanation', 'study_support'] as GenerationMode[],
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
        supportsStreaming: true,
        recommendedUseCases: ['socratic_tutoring', 'hint_only', 'attempt_feedback', 'concept_explanation', 'practice_generation', 'study_support'] as GenerationMode[],
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
        errorMessage: 'Cloud provider is not configured. Set apiKey and modelId.',
        latencyMs: Date.now() - start,
      };
    }

    return {
      requestId: input.requestId,
      providerId: this.providerId,
      modelId: input.modelId,
      ok: false,
      errorCode: 'provider_unavailable',
      errorMessage: 'Cloud provider endpoint is not reachable. Ensure API key and endpoint are correct.',
      latencyMs: Date.now() - start,
    };
  }
}
