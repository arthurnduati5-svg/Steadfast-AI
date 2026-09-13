// ─────────────────────────────────────────────────────────────
// Steadfast AI — Real Personalization Enforcement Contracts v1
// Domain: formal personalization packet contract that proves
// learner-specific signals are resolved, sanitized, and used
// in live tutor responses. No empty/fake personalization.
// ─────────────────────────────────────────────────────────────

// ── Personalization Domain Enum ──

export type PersonalizationDomain =
  | 'learner_memory'
  | 'mastery'
  | 'misconceptions'
  | 'artifact_history'
  | 'video_history'
  | 'artifact_practice'
  | 'video_practice'
  | 'recent_activity'
  | 'tutor_state'
  | 'intent'
  | 'source_trust'
  | 'cache_policy';

// ── Signal Status ──

export type PersonalizationSignalStatus =
  | 'available'
  | 'missing'
  | 'empty'
  | 'redacted'
  | 'unsafe'
  | 'not_applicable';

// ── Use Level ──

export type PersonalizationUseLevel =
  | 'none'
  | 'context_only'
  | 'prompt_used'
  | 'response_used'
  | 'blocked';

// ── Decision ──

export type PersonalizationDecision =
  | 'use_for_reteach'
  | 'use_for_practice_selection'
  | 'use_for_hint'
  | 'use_for_review'
  | 'use_for_advancement'
  | 'use_for_clarification'
  | 'do_not_use';

// ── Violation Severity ──

export type PersonalizationViolationSeverity = 'warning' | 'error';

// ── Signal ──

export interface PersonalizationSignal {
  signalId: string;
  domain: PersonalizationDomain;
  status: PersonalizationSignalStatus;
  useLevel: PersonalizationUseLevel;
  title: string;
  summary: string;
  evidence: string[];
  skillIds: string[];
  topic?: string | null;
  confidence?: number | null;
  updatedAt?: string | null;
  warnings: string[];
}

// ── Packet ──

export interface PersonalizationPacket {
  packetId: string;
  learnerScoped: boolean;
  sessionScoped: boolean;
  noCache: true;

  domains: {
    learnerMemory: PersonalizationSignal[];
    mastery: PersonalizationSignal[];
    misconceptions: PersonalizationSignal[];
    artifactHistory: PersonalizationSignal[];
    videoHistory: PersonalizationSignal[];
    artifactPractice: PersonalizationSignal[];
    videoPractice: PersonalizationSignal[];
    recentActivity: PersonalizationSignal[];
    tutorState: PersonalizationSignal[];
    intent: PersonalizationSignal[];
    sourceTrust: PersonalizationSignal[];
    cachePolicy: PersonalizationSignal[];
  };

  decisions: Array<{
    decision: PersonalizationDecision;
    reason: string;
    linkedSignalIds: string[];
  }>;

  safePromptSummary: string;

  usage: {
    availableDomains: PersonalizationDomain[];
    usedDomains: PersonalizationDomain[];
    missingDomains: PersonalizationDomain[];
    redactedDomains: PersonalizationDomain[];
    blockedDomains: PersonalizationDomain[];
    emptyButExpectedDomains: PersonalizationDomain[];
  };

  safety: {
    rawArtifactTextIncluded: false;
    rawOcrTextIncluded: false;
    rawTranscriptIncluded: false;
    answerKeyIncluded: false;
    hiddenPromptIncluded: false;
    promptInjectionBlocked: boolean;
    warnings: string[];
  };

  createdAt: string;
}

// ── Response Metadata ──

export interface PersonalizationResponseMetadata {
  personalizationAvailable: boolean;
  personalizationUsed: boolean;
  usedDomains: PersonalizationDomain[];
  missingDomains: PersonalizationDomain[];
  redactedDomains: PersonalizationDomain[];
  blockedDomains: PersonalizationDomain[];
  emptyButExpectedDomains: PersonalizationDomain[];
  nextPersonalizedAction?: string | null;
  warnings: string[];
}

// ── Violation ──

export interface PersonalizationViolation {
  code: string;
  domain?: PersonalizationDomain;
  message: string;
  severity: PersonalizationViolationSeverity;
}

// ── Enforcement Result ──

export interface PersonalizationEnforcementResult {
  ok: boolean;
  packet: PersonalizationPacket;
  metadata: PersonalizationResponseMetadata;
  violations: PersonalizationViolation[];
}

// ── Prompt Block ──

export interface PersonalizationPromptBlock {
  promptBlock: string;
  usedSignalIds: string[];
  usedDomains: PersonalizationDomain[];
  warnings: string[];
}

// ── Event Kinds ──

export type PersonalizationEventKind =
  | 'personalization_packet_resolved'
  | 'personalization_used_in_prompt'
  | 'personalization_empty_context_blocked'
  | 'personalization_domain_redacted'
  | 'personalization_domain_blocked'
  | 'personalization_response_metadata_created';

// ── Constants ──

export const ALL_PERSONALIZATION_DOMAINS: PersonalizationDomain[] = [
  'learner_memory',
  'mastery',
  'misconceptions',
  'artifact_history',
  'video_history',
  'artifact_practice',
  'video_practice',
  'recent_activity',
  'tutor_state',
  'intent',
  'source_trust',
  'cache_policy',
];

export const MAX_PERSONALIZATION_SIGNAL_EVIDENCE = 5;
export const MAX_PERSONALIZATION_SIGNAL_SUMMARY_CHARS = 300;
export const MAX_PERSONALIZATION_EVIDENCE_CHARS = 200;
export const MAX_SAFE_PROMPT_SUMMARY_CHARS = 1500;
export const MAX_PERSONALIZATION_WARNINGS = 10;
export const MAX_PERSONALIZATION_DECISIONS = 10;
