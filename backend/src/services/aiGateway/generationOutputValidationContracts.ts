import type { SafeGenerationRequest } from './safeGenerationContracts';
import type { ProviderGenerationResult } from './modelProviderContracts';

export type GenerationValidationDecision =
  | 'valid_return'
  | 'requires_repair'
  | 'requires_regeneration'
  | 'safe_fallback'
  | 'blocked';

export interface GenerationOutputValidationInput {
  requestId: string;
  draftOutput: string;
  generationRequest: SafeGenerationRequest;
  providerResult?: ProviderGenerationResult;
}

export interface GenerationOutputValidationResult {
  decision: GenerationValidationDecision;
  valid: boolean;
  repairedOutput?: string;
  fallbackOutput?: string;
  violationCodes: string[];
  repairInstructions: string[];
}
