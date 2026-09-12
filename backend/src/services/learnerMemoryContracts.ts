// ─────────────────────────────────────────────────────────────
// Steadfast AI — Durable Learner Memory Contracts v1
// Domain: evidence-based, school-scoped, privacy-safe learner memory
// Every memory type must originate from this file.
// ─────────────────────────────────────────────────────────────

// ── Memory Kind Enum ──
export type LearnerMemoryKind =
  | 'strength'
  | 'weakness'
  | 'misconception'
  | 'recent_mistake'
  | 'revision_need'
  | 'practice_pattern'
  | 'artifact_usage'
  | 'language_support'
  | 'metacognitive_support'
  | 'tutor_preference'
  | 'early_mastery_signal';

// ── Memory Status Enum ──
export type LearnerMemoryStatus =
  | 'active'
  | 'merged'
  | 'superseded'
  | 'soft_deleted'
  | 'expired'
  | 'disputed'
  | 'school_exited_hold'
  | 'blocked'
  | 'archived';

// ── Memory Visibility Enum ──
export type LearnerMemoryVisibility =
  | 'system_only'
  | 'teacher_visible'
  | 'student_visible_summary'
  | 'admin_only';

// ── Memory Source Enum ──
export type LearnerMemorySource =
  | 'tutor_turn'
  | 'practice_attempt'
  | 'artifact_query'
  | 'artifact_parse'
  | 'teacher_note'
  | 'student_self_report'
  | 'revision_session'
  | 'system_import'
  | 'manual_admin';

// ── Confidence Enum ──
export type LearnerMemoryConfidence =
  | 'low'
  | 'medium'
  | 'high';

// ── Event Kind Enum ──
export type LearningEventKind =
  | 'asked_question'
  | 'answered_question'
  | 'made_mistake'
  | 'corrected_mistake'
  | 'requested_hint'
  | 'used_artifact'
  | 'queried_artifact'
  | 'completed_practice'
  | 'reviewed_topic'
  | 'explained_back'
  | 'teacher_note_added'
  | 'memory_corrected'
  | 'memory_deleted';

// ── Event Source Enum ──
export type LearningEventSource =
  | 'chat'
  | 'artifact_query'
  | 'practice'
  | 'teacher'
  | 'system'
  | 'revision';

// ── Privacy Level Enum ──
export type PrivacyLevel = 'low' | 'medium' | 'high';

// ── Memory Context Status ──
export type LearnerMemoryContextStatus =
  | 'resolved'
  | 'partial'
  | 'no_data_yet'
  | 'unavailable'
  | 'error';

// ── Memory Evidence ──
export interface LearnerMemoryEvidence {
  evidenceId: string;
  eventId?: string | null;
  source: LearnerMemorySource;
  summary: string;
  observedAt: string;

  subject?: string | null;
  topic?: string | null;
  skillIds: string[];

  artifactId?: string | null;
  artifactBlockId?: string | null;

  confidence: number;

  safeQuote?: string | null;
}

// ── Learning Signal (inside events) ──
export interface LearningSignal {
  signalId: string;
  kind: LearnerMemoryKind;
  label: string;
  summary: string;
  subject?: string | null;
  topic?: string | null;
  skillIds: string[];
  confidence: number;
  evidenceSummary: string;
  artifactId?: string | null;
  artifactBlockId?: string | null;
}

// ── Learning Event ──
export interface LearningEvent {
  eventId: string;
  schoolId: string;
  studentId: string;
  sessionId?: string | null;

  kind: LearningEventKind;

  subject?: string | null;
  topic?: string | null;
  skillIds: string[];

  artifactId?: string | null;
  artifactBlockId?: string | null;

  promptSummary?: string | null;
  responseSummary?: string | null;
  outcomeSummary?: string | null;

  signals: LearningSignal[];

  source: LearningEventSource;

  privacyLevel: PrivacyLevel;

  createdAt: string;
}

// ── Learner Memory Item ──
export interface LearnerMemoryItem {
  memoryId: string;
  schoolId: string;
  studentId: string;

  kind: LearnerMemoryKind;
  status: LearnerMemoryStatus;
  visibility: LearnerMemoryVisibility;

  subject?: string | null;
  topic?: string | null;
  skillIds: string[];

  label: string;
  summary: string;
  tutorUse: string;

  evidence: LearnerMemoryEvidence[];

  confidence: LearnerMemoryConfidence;
  confidenceScore: number;

  firstObservedAt: string;
  lastObservedAt: string;
  observationCount: number;

  source: LearnerMemorySource;
  sourceEventIds: string[];

  artifactIds: string[];
  artifactBlockIds: string[];

  expiresAt?: string | null;
  softDeletedAt?: string | null;
  deletedReason?: string | null;

  createdAt: string;
  updatedAt: string;
}

// ── Memory Candidate (output of reducer) ──
export interface LearnerMemoryCandidate {
  kind: LearnerMemoryKind;
  label: string;
  summary: string;
  tutorUse: string;
  subject?: string | null;
  topic?: string | null;
  skillIds: string[];
  evidence: LearnerMemoryEvidence[];
  confidence: LearnerMemoryConfidence;
  artifactIds: string[];
  artifactBlockIds: string[];
}

// ── Context Signal (used in TutorTurnContext.learnerProfile) ──
export interface ContextSignal {
  id: string;
  label: string;
  summary: string;
  source: string;
  confidence: number;
  updatedAt?: string | null;
}

// ── Learner Memory Context (resolver output for TutorTurnContext) ──
export interface LearnerMemoryContext {
  status: LearnerMemoryContextStatus;

  strengths: ContextSignal[];
  weaknesses: ContextSignal[];
  recentMistakes: ContextSignal[];
  misconceptionSignals: ContextSignal[];
  masterySignals: ContextSignal[];
  revisionNeeds: ContextSignal[];
  artifactUseSignals: ContextSignal[];
  languageSupportSignals: ContextSignal[];
  metacognitiveSupportSignals: ContextSignal[];

  memoryIdsUsed: string[];
  eventIdsUsed: string[];

  warnings: string[];
  errors: string[];

  resolvedAt: string;
}

// ── Request Contracts ──
export interface CreateLearningEventRequest {
  sessionId?: string | null;
  kind: LearningEventKind;
  subject?: string | null;
  topic?: string | null;
  skillIds?: string[];
  artifactId?: string | null;
  artifactBlockId?: string | null;
  promptSummary?: string | null;
  responseSummary?: string | null;
  outcomeSummary?: string | null;
  signals?: LearningSignalInput[];
  source?: LearningEventSource;
}

export interface LearningSignalInput {
  kind: LearnerMemoryKind;
  label: string;
  summary: string;
  subject?: string | null;
  topic?: string | null;
  skillIds?: string[];
  confidence?: number;
  evidenceSummary: string;
  artifactId?: string | null;
  artifactBlockId?: string | null;
}

export interface LearnerMemoryEvidenceInput {
  source: LearnerMemorySource;
  summary: string;
  subject?: string | null;
  topic?: string | null;
  skillIds?: string[];
  artifactId?: string | null;
  artifactBlockId?: string | null;
  confidence?: number;
  safeQuote?: string | null;
}

export interface CreateLearnerMemoryRequest {
  kind: LearnerMemoryKind;
  visibility?: LearnerMemoryVisibility;
  subject?: string | null;
  topic?: string | null;
  skillIds?: string[];
  label: string;
  summary: string;
  tutorUse: string;
  evidence: LearnerMemoryEvidenceInput[];
  confidence?: LearnerMemoryConfidence;
  artifactIds?: string[];
  artifactBlockIds?: string[];
  expiresAt?: string | null;
}

export interface ResolveLearnerMemoryRequest {
  sessionId?: string | null;
  subject?: string | null;
  topic?: string | null;
  skillIds?: string[];
  artifactIds?: string[];
  maxSignals?: number;
  includeDeleted?: false;
}

export interface PatchLearnerMemoryRequest {
  status?: LearnerMemoryStatus;
  visibility?: LearnerMemoryVisibility;
  label?: string;
  summary?: string;
  tutorUse?: string;
  confidence?: LearnerMemoryConfidence;
  expiresAt?: string | null;
}

export interface DeleteLearnerMemoryRequest {
  reason: string;
}

// ── Response Contracts ──
export interface LearnerMemoryResponse {
  ok: true;
  memory: LearnerMemoryItem[];
  status: 'resolved' | 'partial' | 'no_data_yet' | 'error';
}

export interface CreateLearningEventResponse {
  ok: true;
  event: LearningEvent;
  memoryCreated: LearnerMemoryItem[];
  memoryUpdated: LearnerMemoryItem[];
}

export interface ResolveLearnerMemoryResponse {
  ok: true;
  learnerMemoryContext: LearnerMemoryContext;
}

export interface LearnerMemorySingleResponse {
  ok: true;
  memory: LearnerMemoryItem;
}

// ── Safe Frontend View (for learner-visible metadata) ──
export interface LearnerMemorySafeView {
  id: string;
  kind: LearnerMemoryKind;
  visibility: LearnerMemoryVisibility;
  confidence: LearnerMemoryConfidence;
  safeSummary: string;
  subject?: string | null;
  topic?: string | null;
  skillId?: string | null;
  skillLabel?: string | null;
  lastObservedAt: string;
  reviewAfter?: string | null;
}

// ── Prompt Summary (for safe tutor context use) ──
export interface LearnerMemoryPromptSummary {
  studentId: string;
  schoolId?: string | null;
  memoryCount: number;
  strengths: string[];
  weaknesses: string[];
  misconceptions: string[];
  preferences: string[];
  recentActivity: string[];
  reviewNeeds: string[];
  warnings: string[];
}

// ── Confidence Score Helpers ──
export const CONFIDENCE_SCORE_MAP: Record<LearnerMemoryConfidence, number> = {
  low: 0.3,
  medium: 0.6,
  high: 0.85,
};

export function computeConfidenceScore(
  base: LearnerMemoryConfidence,
  observationCount: number,
): number {
  const baseScore = CONFIDENCE_SCORE_MAP[base];
  const increment = Math.min(0.25, observationCount * 0.03);
  return Math.min(0.95, baseScore + increment);
}

export function confidenceFromScore(score: number): LearnerMemoryConfidence {
  if (score >= 0.75) return 'high';
  if (score >= 0.45) return 'medium';
  return 'low';
}
