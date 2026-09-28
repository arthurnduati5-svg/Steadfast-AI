import type { GenerationMode } from './safeGenerationContracts';
import type { TutorTurnPolicyPacket } from '../tutorTurnPolicy/tutorTurnPolicyContracts';
import type { SafeGenerationRequest } from './safeGenerationContracts';

export interface TutorMessageGenerationExecutionContext {
  /**
   * Optional prepared ChatPromptPacket from Live Chat pipeline preparation
   * (R3-C). Generation context only — deliberately NOT part of
   * TutorTurnPolicyInput: policy input and generation context are
   * different concerns.
   */
  preparedPromptPacket?: import('../chatPipelineContracts').ChatPromptPacket;
}

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
