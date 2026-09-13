import type { TutorTurnPolicyPacket } from '../tutorTurnPolicy/tutorTurnPolicyContracts';
import type { GenerationMode } from './safeGenerationContracts';

export interface ModelRoutingInput {
  requestId: string;
  policyPacket: TutorTurnPolicyPacket;
  generationMode: GenerationMode;
  preferredProviderId?: string;
  preferredModelId?: string;
}

export interface ModelRoutingDecision {
  allowedToRoute: boolean;
  providerId?: string;
  modelId?: string;
  routedBy: string;
  fallbackProviderIds: string[];
  reason: string;
}
