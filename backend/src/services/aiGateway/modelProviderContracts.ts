import type { GenerationMode } from './safeGenerationContracts';

export type ProviderType =
  | 'mock'
  | 'local'
  | 'cloud';

export type ProviderStatus =
  | 'available'
  | 'unavailable'
  | 'degraded'
  | 'misconfigured';

export interface ProviderModelCapability {
  modelId: string;
  providerId: string;
  supportsChat: boolean;
  supportsJson: boolean;
  supportsStreaming: boolean;
  maxInputTokens?: number;
  maxOutputTokens?: number;
  recommendedUseCases: GenerationMode[];
  restrictedUseCases: GenerationMode[];
}

export interface ProviderGenerationRequest {
  requestId: string;
  providerId: string;
  modelId: string;
  prompt: string;
  generationMode: GenerationMode;
  maxOutputTokens?: number;
  temperature?: number;
  timeoutMs?: number;
}

export interface ProviderGenerationResult {
  requestId: string;
  providerId: string;
  modelId: string;
  ok: boolean;
  text?: string;
  errorCode?: string;
  errorMessage?: string;
  latencyMs?: number;
}

export interface ModelProviderAdapter {
  providerId: string;
  providerType: ProviderType;

  getStatus(): Promise<ProviderStatus>;

  listModels(): Promise<ProviderModelCapability[]>;

  generate(input: ProviderGenerationRequest): Promise<ProviderGenerationResult>;
}
