// ─────────────────────────────────────────────────────────────
// Steadfast AI — Chat Pipeline Context Integration Contracts v1
// Domain: live chat turn context resolution, prompt assembly,
// response safety, and post-turn event writing.
// ─────────────────────────────────────────────────────────────

import type { TutorTurnContext } from './tutorStateContracts';
import type {
  TutorIntent,
  TutorIntentResolution,
  IntentResolutionStatus,
  TutorTaskKind,
} from './intentResolverContracts';

// ── Pipeline Modes ──
export type ChatPipelineMode = 'standard' | 'streaming' | 'voice' | 'debug' | 'unknown';

// ── Pipeline Status ──
export type ChatPipelineStatus =
  | 'ready'
  | 'context_resolved'
  | 'intent_resolved'
  | 'generating'
  | 'completed'
  | 'partial'
  | 'failed'
  | 'blocked';

// ── Generation Safety Status ──
export type ChatGenerationSafetyStatus =
  | 'safe'
  | 'needs_clarification'
  | 'unsafe'
  | 'unsupported'
  | 'source_blocked'
  | 'cache_blocked'
  | 'error';

// ── Context Integration Status ──
export type ChatContextIntegrationStatus = 'resolved' | 'partial' | 'no_data_yet' | 'error';

// ── Integrated Chat Request ──
export interface IntegratedChatRequest {
  message: string;
  sessionId?: string | null;
  mode?: ChatPipelineMode;
  activeSubject?: string | null;
  activeTopic?: string | null;
  activeSkillIds?: string[];
  activeArtifactIds?: string[];
  activeVideoId?: string | null;
  learnerAnswerSummary?: string | null;
  sourceCandidateIds?: string[];
  clientMessageId?: string | null;
  includeDebug?: boolean;
}

// ── Chat Prompt Packet ──
export interface ChatPromptPacket {
  systemInstructions: string[];
  developerInstructions: string[];
  tutorTaskInstruction: string;
  learnerMessage: string;
  allowedContext: {
    tutorState?: unknown;
    learnerProfile?: unknown;
    artifactBlocks?: unknown[];
    masterySignals?: unknown[];
    sourceTrust?: unknown;
    intentResolution?: unknown;
    videoLearningContext?: unknown;
    /** Video-aware practice loop safe summaries — no answer keys, no raw answers */
    videoAwarePracticeContext?: unknown;
    /** Artifact reasoning evidence sections — bounded safe summaries only */
    artifactReasoningEvidence?: string[];
    /** Personalization prompt block — structured learner context */
    personalization?: string | null;
    /** Socratic runtime policy safe summary only; no raw learner memory or transcripts */
    socraticPolicy?: {
      supportMode: string;
      challengeLevel: string;
      integritySignal: string;
      safeguardingSignal: string;
      noFinalAnswerRequired: boolean;
      privacyMode: string;
      safeContextSummary?: string;
    };
  };
  forbiddenContext: string[];
  citationPolicy: {
    allowSourceChips: boolean;
    verifiedSourceIds: string[];
    blockedSourceIds: string[];
  };
  cachePolicy: {
    cacheAllowed: boolean;
    scope: string;
    reason: string;
  };
  tokenBudget: {
    maxArtifactBlocks: number;
    maxMemorySignals: number;
    maxMasterySignals: number;
    maxSourceSummaries: number;
  };
  warnings: string[];
}

// ── Response Safety Decision ──
export interface ChatResponseSafetyDecision {
  safeToReturn: boolean;
  blockedReasons: string[];
  fakeSourcesDetected: string[];
  unverifiedSources: string[];
  promptLeakageDetected: boolean;
  answerKeyExposureRisk: boolean;
  warnings: string[];
}

// ── Integrated Chat Response Meta ──
export interface IntegratedChatResponseMeta {
  executionId: string;
  sessionId?: string | null;
  tutorContextStatus: ChatContextIntegrationStatus;
  intentStatus: IntentResolutionStatus;
  primaryIntent: TutorIntent;
  taskKind: TutorTaskKind;
  cacheScope: unknown;
  sourceTrust: unknown;
  usedContext: {
    tutorState: boolean;
    learnerMemory: boolean;
    practiceMastery: boolean;
    artifacts: boolean;
    sources: boolean;
    intentResolution: boolean;
  };
  warnings: string[];
  /** Optional video recommendation metadata — only present when video was recommended */
  videoRecommendations?: import('./videoChatIntegrationContracts').VideoChatRecommendationMeta | null;
  /** Optional personalization metadata — present when personalization was resolved */
  personalization?: import('./personalizationContracts').PersonalizationResponseMetadata | null;

  // ── Safe Socratic Policy Metadata Markers ──
  /** Socratic mode active for this turn — reflects supportMode from policy packet */
  socraticMode?: string;
  /** Academic integrity signal detected (none, possible_shortcut_seeking, repeated_shortcut_attempt, urgent_shortcut_seeking, allowed_learning_help) */
  integritySignal?: string;
  /** Challenge calibration level (too_easy, productive_struggle, too_hard, blocked, ready_for_challenge, needs_reteach, needs_foundation) */
  challengeLevel?: string;
  /** Privacy mode (private_by_default, minimum_necessary_safeguarding_disclosure) */
  privacyMode?: string;
  /** Whether safeguarding was escalated for this turn */
  safeguardingEscalated?: boolean;
  /** Whether final answers are forbidden for this turn */
  noFinalAnswerRequired?: boolean;
  /** Socratic support mode (question_first, hint_first, explanation_first, challenge_first, socratic_dialogue, guided_practice, reflection_first) */
  supportMode?: string;
  /** Source freshness routing decision for this turn */
  sourceFreshness?: {
    sourceNeed: import('./sourceFreshnessContracts').SourceNeed;
    freshnessStatus: import('./sourceFreshnessContracts').SourceFreshnessStatus;
    shouldRetrieve: boolean;
    queryPrivacyRisk: 'none' | 'low' | 'medium' | 'high' | 'blocked';
  };
  /** Citation integrity verification result */
  citationIntegrity?: {
    verified: boolean;
    unsupportedDowngraded: number;
    supportedKept: number;
    missingSourceFallback: boolean;
  };
}

// ── Integrated Chat Response ──
export interface IntegratedChatResponse {
  ok: true;
  answer: string;
  meta: IntegratedChatResponseMeta;
  sources: unknown[];
  followUps: string[];
  /** Optional video recommendation metadata */
  videoRecommendations?: import('./videoChatIntegrationContracts').VideoChatRecommendationMeta | null;
  /** Optional personalization response metadata */
  personalization?: import('./personalizationContracts').PersonalizationResponseMetadata | null;
  /** Optional research source trust response metadata */
  researchSourceTrust?: import('./researchSourceTrustContracts').ResearchSourceResponseMetadata | null;
}

// ── Chat Turn Execution Context ──
export interface ChatTurnExecutionContext {
  executionId: string;
  identity: {
    schoolId: string;
    studentId?: string | null;
    teacherId?: string | null;
    userId?: string | null;
    role?: string | null;
  };
  request: IntegratedChatRequest;
  tutorContext: TutorTurnContext | null;
  intentResolution: TutorIntentResolution | null;
  cachePolicy: unknown;
  sourceTrust: unknown;
  promptPacket: ChatPromptPacket | null;
  safety: ChatResponseSafetyDecision;
  /** Socratic runtime policy packet — built before prompt assembly */
  socraticPolicyContext?: {
    supportMode: import('./socraticTutorPolicyContracts').SocraticSupportMode;
    challengeLevel: import('./socraticTutorPolicyContracts').ChallengeCalibrationLevel;
    integritySignal: import('./socraticTutorPolicyContracts').AcademicIntegritySignal;
    safeguardingSignal: import('./socraticTutorPolicyContracts').SafeguardingSignal;
    noFinalAnswerRequired: boolean;
    shouldEscalateToHuman: boolean;
    privacyMode: 'private_by_default' | 'minimum_necessary_safeguarding_disclosure';
    recommendedTutorMove: string;
    forbiddenTutorMoves: string[];
    allowedTutorMoves: string[];
    socraticInstructions: string[];
    forbiddenInstructions: string[];
    safeContextSummary?: string;
    audit?: {
      eventType: string;
      severity: 'info' | 'warning' | 'critical';
      safeSummary: string;
      rawPrivateDataIncluded: false;
    };
    policyPacket?: import('./socraticTutorPolicyContracts').SocraticRuntimePolicyPacket;
  };

  /** Optional artifact reasoning context for ChatPromptAssembler consumption */
  artifactReasoningContext?: {
    intent: string;
    evidence: import('./artifactReasoningContracts').ArtifactReasoningEvidence[];
    groundingStatus: string;
    citations: import('./artifactReasoningContracts').ArtifactReasoningCitation[];
    summary: string;
    evidenceRefs: string[];
    warnings: string[];
    actionHint: string;
  };
  warnings: string[];
  errors: string[];
  createdAt: string;
}

// ── Post-Turn Event Result ──
export interface PostTurnEventResult {
  eventWritten: boolean;
  eventId?: string;
  warnings: string[];
}
