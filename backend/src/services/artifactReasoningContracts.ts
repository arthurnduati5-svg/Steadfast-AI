// ─────────────────────────────────────────────────────────────
// Steadfast AI — Artifact-Aware Tutor Reasoning Contracts v2
// Canonical types for artifact reasoning requests, intents,
// evidence items, grounding status, response plans, citations,
// and cache policy.
// ─────────────────────────────────────────────────────────────

import type {
  ArtifactStructuredBlock,
  ArtifactQuestionBlock,
  ArtifactSafeView,
  ArtifactScope,
  ArtifactTopicSkillMapping,
  ArtifactExtractionConfidence,
} from './artifactUnderstandingContracts';

// ── Artifact Reasoning Intent Types ──
export type ArtifactReasoningIntent =
  | 'explain_question'
  | 'explain_section'
  | 'explain_worked_example'
  | 'explain_formula'
  | 'explain_diagram'
  | 'mark_answer'
  | 'give_hint'
  | 'generate_similar_practice'
  | 'generate_section_practice'
  | 'summarize_artifact'
  | 'teach_from_artifact'
  | 'find_topic'
  | 'compare_to_worked_example'
  | 'clarify_reference'
  | 'unsupported_or_ambiguous';

// ── Grounding Status ──
export type ArtifactGroundingStatus =
  | 'grounded'
  | 'partially_grounded'
  | 'not_grounded'
  | 'ambiguous_reference'
  | 'artifact_missing'
  | 'unsafe_blocked'
  | 'answer_key_restricted';

// ── Response Action ──
export type ArtifactReasoningAction =
  | 'answer_with_evidence'
  | 'ask_clarifying_question'
  | 'give_hint_only'
  | 'mark_answer'
  | 'generate_practice'
  | 'explain_step_by_step'
  | 'refuse_unsafe_artifact_instruction'
  | 'say_not_found';

// ── Artifact Reasoning Request ──
export interface ArtifactReasoningRequest {
  studentId: string;
  schoolId?: string | null;
  classId?: string | null;
  sessionId?: string | null;
  tutorStateId?: string | null;
  artifactId?: string | null;
  learnerMessage: string;
  learnerIntent?: string | null;
  activeQuestionId?: string | null;
  activeBlockId?: string | null;
  referencedQuestionNumber?: string | null;
  referencedSection?: string | null;
  referencedPage?: number | null;
  referencedTopic?: string | null;
  learningMode?: string | null;
  answerText?: string | null;
  metadata?: Record<string, unknown>;
}

// ── Artifact Reasoning Evidence Item ──
export interface ArtifactReasoningEvidence {
  artifactId: string;
  blockId?: string | null;
  questionId?: string | null;
  blockType: string;
  visibility: string;
  safeText: string;
  safeQuestionText?: string | null;
  topic?: string | null;
  skillId?: string | null;
  skillLabel?: string | null;
  difficulty?: string | null;
  locationLabel?: string | null;
  pageNumber?: number | null;
  sectionPath: string[];
  confidence: 'low' | 'medium' | 'high';
  sourceTrustStatus: string;
  safetyFlags: string[];
  provenance: Record<string, unknown>;
}

// ── Artifact Reasoning Citation ──
export interface ArtifactReasoningCitation {
  artifactId: string;
  blockId?: string | null;
  questionId?: string | null;
  label: string;
  location?: string | null;
  evidence: string;
}

// ── Artifact Reasoning Cache Decision ──
export interface ArtifactReasoningCacheDecision {
  cacheAllowed: boolean;
  scope: string;
  key: string | null;
  reason: string;
}

// ── Artifact Reasoning Result ──
export interface ArtifactReasoningResult {
  decision: ArtifactReasoningAction;
  intent: ArtifactReasoningIntent;
  selectedEvidence: ArtifactReasoningEvidence[];
  excludedEvidence: ArtifactReasoningEvidence[];
  groundingStatus: ArtifactGroundingStatus;
  answerKeyUsed: boolean;
  learnerFacingResponsePlan: string;
  tutorActionHint: string;
  practiceCandidateRefs: string[];
  masteryEvidenceRefs: string[];
  learnerMemorySignals: string[];
  citations: ArtifactReasoningCitation[];
  warnings: string[];
  cachePolicy: ArtifactReasoningCacheDecision;
  metadata: Record<string, unknown>;
}

// ── Artifact Reasoning Context (output of context resolver) ──
export interface ArtifactReasoningContext {
  studentId: string;
  schoolId?: string | null;
  sessionId?: string | null;
  artifactId?: string | null;
  safeView: ArtifactSafeView | null;
  blocks: ArtifactStructuredBlock[];
  questions: ArtifactQuestionBlock[];
  topicMappings: ArtifactTopicSkillMapping[];
  activeQuestionId?: string | null;
  activeBlockId?: string | null;
  referencedQuestionNumber?: string | null;
  referencedSection?: string | null;
  referencedPage?: number | null;
  referencedTopic?: string | null;
  learningMode?: string | null;
  answerText?: string | null;
  learnerMessage: string;
  isValid: boolean;
  warnings: string[];
}

// ── Reference Resolution ──
export interface ArtifactReferenceResolution {
  resolved: boolean;
  blockId?: string | null;
  questionId?: string | null;
  blockType?: string | null;
  locationLabel?: string | null;
  pageNumber?: number | null;
  method: string;
  ambiguityDetected: boolean;
  notFound: boolean;
  warnings: string[];
}

// ── Intent Resolution ──
export interface ArtifactReasoningIntentResolution {
  intent: ArtifactReasoningIntent;
  method: 'structured' | 'keyword' | 'fallback';
  confidence: 'high' | 'medium' | 'low';
  requiresClarification: boolean;
  warnings: string[];
}

// ── Evidence Retrieval Result ──
export interface ArtifactEvidenceRetrievalResult {
  selectedEvidence: ArtifactReasoningEvidence[];
  excludedEvidence: Array<{ evidence: ArtifactReasoningEvidence; reason: string }>;
  totalBlocksScanned: number;
  totalQuestionsScanned: number;
  answerKeyBlocksExcluded: number;
  teacherNoteBlocksExcluded: number;
  blockedBlocksExcluded: number;
  warnings: string[];
}

// ── Grounding Validation Result ──
export interface ArtifactGroundingValidationResult {
  status: ArtifactGroundingStatus;
  supportedByEvidence: boolean;
  missingEvidence: string[];
  fabricatedCitationRisk: boolean;
  answerKeyRequired: boolean;
  unsafeBlocked: boolean;
  warnings: string[];
}

// ── Hint/Explanation Input ──
export interface ArtifactHintExplanationInput {
  evidence: ArtifactReasoningEvidence[];
  intent: ArtifactReasoningIntent;
  learnerMessage: string;
  learningMode?: string | null;
  answerKeyAvailable: boolean;
}

// ── Hint/Explanation Result ──
export interface ArtifactHintExplanationResult {
  hint: string;
  explanation: string;
  grounded: boolean;
  answerKeyUsed: boolean;
  warnings: string[];
}

// ── Answer Marking Input ──
export interface ArtifactAnswerMarkingInput {
  evidence: ArtifactReasoningEvidence[];
  learnerAnswer: string;
  questionText: string;
  answerKeyAvailable: boolean;
  isTeacherMode: boolean;
}

// ── Answer Marking Result ──
export interface ArtifactAnswerMarkingResult {
  feedback: string;
  tentative: boolean;
  misconceptionHint?: string | null;
  masteryEvidenceRef: string;
  warnings: string[];
}

// ── Follow-Up Practice Input ──
export interface ArtifactFollowupPracticeInput {
  evidence: ArtifactReasoningEvidence[];
  intent: ArtifactReasoningIntent;
  topic?: string | null;
  skillId?: string | null;
  section?: string | null;
  maxCandidates: number;
}

// ── Follow-Up Practice Result ──
export interface ArtifactFollowupPracticeResult {
  candidates: ArtifactReasoningEvidence[];
  warnings: string[];
}

// ── Prompt Packet Input ──
export interface ArtifactPromptPacketInput {
  intent: ArtifactReasoningIntent;
  evidence: ArtifactReasoningEvidence[];
  learnerMessage: string;
  learningMode?: string | null;
  groundingStatus: ArtifactGroundingStatus;
  citations: ArtifactReasoningCitation[];
}

// ── Prompt Packet ──
export interface ArtifactReasoningPromptPacket {
  systemInstructions: string[];
  developerInstructions: string[];
  artifactEvidenceSections: string[];
  groundingRequirement: string;
  answerKeyRestriction: string;
  citationInstructions: string;
  safetyWarnings: string[];
  totalCharacters: number;
}
