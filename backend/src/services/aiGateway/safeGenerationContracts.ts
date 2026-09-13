import type { TutorTurnPolicyPacket } from '../tutorTurnPolicy/tutorTurnPolicyContracts';

export type SafeGenerationDecision =
  | 'generated'
  | 'clarify_first'
  | 'safe_refusal'
  | 'referral'
  | 'fallback'
  | 'blocked';

export type GenerationMode =
  | 'socratic_tutoring'
  | 'hint_only'
  | 'attempt_feedback'
  | 'concept_explanation'
  | 'practice_generation'
  | 'study_support'
  | 'safe_deen_referral'
  | 'safe_clarification'
  | 'safe_refusal';

export interface SafeGenerationRequest {
  requestId: string;
  schoolId: string;
  tutorLearnerId: string;
  tutorSessionId: string;
  messageText: string;
  policyPacket: TutorTurnPolicyPacket;
  safeContext: {
    curriculumContext?: unknown;
    safeMemoryContext?: unknown;
    deenPolicyContext?: unknown;
    recentSafeTurnSummaries?: Array<{
      role: 'learner' | 'assistant' | 'system';
      safeSummary: string;
      createdAt?: string;
    }>;
  };
  clientContext?: {
    displayMode?: 'widget' | 'fullscreen';
    activeSchoolPage?: string;
    subjectHint?: string;
    topicHint?: string;
  };
}

export interface SafeGenerationResponse {
  requestId: string;
  decision: SafeGenerationDecision;
  responseText: string;
  provider?: {
    providerId: string;
    modelId: string;
    routedBy: string;
  };
  validation: {
    valid: boolean;
    repaired: boolean;
    fallbackUsed: boolean;
    violationCodes: string[];
  };
  policyTags: string[];
  archiveMetadata: {
    shouldArchive: boolean;
    archiveUserMessage: boolean;
    archiveAssistantMessage: boolean;
    safeSummary?: string;
  };
  safeMemoryMetadata: {
    shouldUpdateSafeMemory: boolean;
    safeSignals: string[];
  };
}
