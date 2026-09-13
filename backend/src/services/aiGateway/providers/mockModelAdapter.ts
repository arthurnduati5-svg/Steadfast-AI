import type { ModelProviderAdapter, ProviderGenerationRequest, ProviderGenerationResult, ProviderModelCapability, ProviderStatus } from '../modelProviderContracts';
import type { GenerationMode } from '../safeGenerationContracts';

export type MockBehavior = 'success' | 'timeout' | 'unsafe_output' | 'provider_failure' | 'empty_output';

export class MockModelAdapter implements ModelProviderAdapter {
  providerId = 'mock-provider';
  providerType = 'mock' as const;

  private behavior: MockBehavior;
  private mockResponseText: string;

  constructor(behavior: MockBehavior = 'success', mockResponseText?: string) {
    this.behavior = behavior;
    this.mockResponseText = mockResponseText ?? 'This is a mock tutor response. What do you think about this topic?';
  }

  setBehavior(behavior: MockBehavior): void {
    this.behavior = behavior;
  }

  setMockResponseText(text: string): void {
    this.mockResponseText = text;
  }

  async getStatus(): Promise<ProviderStatus> {
    if (this.behavior === 'provider_failure') return 'unavailable';
    return 'available';
  }

  async listModels(): Promise<ProviderModelCapability[]> {
    return [
      {
        modelId: 'mock-model-v1',
        providerId: this.providerId,
        supportsChat: true,
        supportsJson: false,
        supportsStreaming: false,
        recommendedUseCases: ['socratic_tutoring', 'hint_only', 'attempt_feedback', 'concept_explanation'] as GenerationMode[],
        restrictedUseCases: [] as GenerationMode[],
      },
    ];
  }

  async generate(input: ProviderGenerationRequest): Promise<ProviderGenerationResult> {
    const start = Date.now();

    if (this.behavior === 'timeout') {
      return {
        requestId: input.requestId,
        providerId: this.providerId,
        modelId: input.modelId,
        ok: false,
        errorCode: 'timeout',
        errorMessage: 'Provider timed out',
        latencyMs: Date.now() - start,
      };
    }

    if (this.behavior === 'provider_failure') {
      return {
        requestId: input.requestId,
        providerId: this.providerId,
        modelId: input.modelId,
        ok: false,
        errorCode: 'provider_unavailable',
        errorMessage: 'Provider is not available',
        latencyMs: Date.now() - start,
      };
    }

    if (this.behavior === 'unsafe_output') {
      return {
        requestId: input.requestId,
        providerId: this.providerId,
        modelId: input.modelId,
        ok: true,
        text: 'The final answer is 42. Here is the complete solution step by step...',
        latencyMs: Date.now() - start,
      };
    }

    if (this.behavior === 'empty_output') {
      return {
        requestId: input.requestId,
        providerId: this.providerId,
        modelId: input.modelId,
        ok: true,
        text: '',
        latencyMs: Date.now() - start,
      };
    }

    return {
      requestId: input.requestId,
      providerId: this.providerId,
      modelId: input.modelId,
      ok: true,
      text: this.mockResponseText,
      latencyMs: Date.now() - start,
    };
  }
}
