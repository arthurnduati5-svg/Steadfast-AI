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
  /** AI-05: control envelope only — never model-visible content. */
  schoolId?: string;
}

export interface ProviderUsageReport {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  status: 'reported' | 'partial' | 'unknown';
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
  /** AI-05: model id the provider reports it actually served, when available. */
  reportedModelId?: string;
  /** AI-05: provider request/correlation id, when available. */
  providerRequestId?: string;
  /** AI-05: truthful usage — missing usage is 'unknown', NEVER zero. */
  usage?: ProviderUsageReport;
}

export interface ModelProviderAdapter {
  providerId: string;
  providerType: ProviderType;

  getStatus(): Promise<ProviderStatus>;

  listModels(): Promise<ProviderModelCapability[]>;

  generate(input: ProviderGenerationRequest): Promise<ProviderGenerationResult>;
}
