import type { GenerationMode } from './safeGenerationContracts';
import type { TutorTurnPolicyPacket } from '../tutorTurnPolicy/tutorTurnPolicyContracts';
import type { SafeGenerationRequest } from './safeGenerationContracts';

export interface PolicyAwarePromptInput {
  requestId: string;
  generationMode: GenerationMode;
  messageText: string;
  policyPacket: TutorTurnPolicyPacket;
  safeContext: SafeGenerationRequest['safeContext'];
}

export interface PolicyAwarePromptBundle {
  requestId: string;
  prompt: string;
  redactedPromptPreview: string;
  includedContextTypes: string[];
  excludedContextTypes: string[];
  disallowedModelBehaviors: string[];
}
