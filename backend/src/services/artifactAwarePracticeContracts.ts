// ─────────────────────────────────────────────────────────────
// Steadfast AI — Artifact-Aware Practice Loop Contracts v1
// Domain: evidence-based, artifact-linked practice with safe
// answer evaluation, misconception tracking, decision loop,
// and spaced review scheduling. Analogous to Video-Aware
// Practice Loop v1 but for uploaded learning artifacts.
// ─────────────────────────────────────────────────────────────

// ── Status Enums ──

export type ArtifactAwarePracticeStatus =
  | 'not_started'
  | 'generated'
  | 'answered'
  | 'reviewed'
  | 'reteach_needed'
  | 'practice_more'
  | 'advance_ready'
  | 'scheduled_review'
  | 'completed'
  | 'abandoned';

export type ArtifactAwarePracticeItemType =
  | 'recall'
  | 'concept_check'
  | 'worked_example_completion'
  | 'error_spotting'
  | 'application'
  | 'diagram_interpretation'
  | 'formula_use'
  | 'theorem_application'
  | 'question_from_artifact'
  | 'teach_back'
  | 'reflection';

export type ArtifactAwareAnswerStatus =
  | 'not_answered'
  | 'correct'
  | 'partially_correct'
  | 'incorrect'
  | 'needs_review'
  | 'invalid';

export type ArtifactAwarePracticeDecision =
  | 'reteach'
  | 'review_artifact_section'
  | 'review_worked_example'
  | 'review_diagram'
  | 'give_similar_practice'
  | 'give_harder_practice'
  | 'advance'
  | 'schedule_spaced_review'
  | 'ask_clarification';

export type ArtifactAwareMisconceptionStatus =
  | 'suspected'
  | 'confirmed'
  | 'resolved'
  | 'needs_review';

export type ArtifactPracticeSourceKind =
  | 'extracted_question'
  | 'diagram'
  | 'theorem_block'
  | 'formula_block'
  | 'worked_example'
  | 'section'
  | 'learning_objective'
  | 'answer_key_summary'
  | 'teacher_note'
  | 'artifact_summary';

// ── Core Contracts ──

export interface ArtifactPracticeSource {
  sourceKind: ArtifactPracticeSourceKind;
  artifactId: string;
  sourceId?: string | null;
  title?: string | null;
  pageNumber?: number | null;
  topic?: string | null;
  skillIds: string[];
  promptSeed?: string | null;
  expectedAnswerSummary?: string | null;
  rubricPoints: string[];
  safeSummary: string;
  warnings: string[];
}

export interface ArtifactAwarePracticeBasis {
  triggerMessage?: string | null;
  triggerIntent?: string | null;
  artifactContextUsed: boolean;
  learnerWeaknessIds: string[];
  masterySignalsUsed: string[];
  memorySignalsUsed: string[];
  extractedQuestionIds: string[];
  diagramIds: string[];
  theoremBlockIds: string[];
  workedExampleIds: string[];
}

export interface ArtifactAwarePracticeDecisionResult {
  currentDecision: ArtifactAwarePracticeDecision;
  reason: string;
  nextActionPrompt?: string | null;
  recommendedReviewAt?: string | null;
  dueAt?: string | null;
}

export interface ArtifactAwarePracticeSafety {
  rawArtifactTextUsed: false;
  rawArtifactTextStored: false;
  answerKeyVisibleToLearner: false;
  promptInjectionBlocked: boolean;
  warnings: string[];
}

export interface ArtifactAwarePracticeItem {
  practiceItemId: string;
  type: ArtifactAwarePracticeItemType;
  prompt: string;
  expectedAnswerSummary?: string | null;
  rubricPoints: string[];
  linkedArtifactId?: string | null;
  linkedSourceKind?: ArtifactPracticeSourceKind | null;
  linkedSourceId?: string | null;
  linkedPageNumber?: number | null;
  linkedSkillIds: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  status: ArtifactAwareAnswerStatus;
  learnerAnswerSummary?: string | null;
  feedbackSummary?: string | null;
  createdAt: string;
  answeredAt?: string | null;
}

export interface ArtifactAwareMisconception {
  misconceptionId: string;
  label: string;
  evidence: string[];
  linkedArtifactIds: string[];
  linkedSkillIds: string[];
  status: ArtifactAwareMisconceptionStatus;
  firstSeenAt: string;
  lastSeenAt: string;
}

export interface ArtifactAwarePracticeSession {
  artifactPracticeSessionId: string;
  tutorSessionId?: string | null;

  status: ArtifactAwarePracticeStatus;

  artifactIds: string[];
  primaryArtifactId?: string | null;

  subject?: string | null;
  topic?: string | null;
  skillIds: string[];
  syllabusObjectiveIds: string[];

  source: {
    sourceKind: ArtifactPracticeSourceKind;
    sourceId?: string | null;
    title?: string | null;
    sectionTitle?: string | null;
    pageNumber?: number | null;
    diagramId?: string | null;
    questionId?: string | null;
    objectiveId?: string | null;
  };

  basis: ArtifactAwarePracticeBasis;
  items: ArtifactAwarePracticeItem[];
  misconceptionSummary: ArtifactAwareMisconception[];
  decision: ArtifactAwarePracticeDecisionResult;
  safety: ArtifactAwarePracticeSafety;

  createdAt: string;
  updatedAt: string;
}

export interface ArtifactAwarePracticeState {
  activePracticeSession?: ArtifactAwarePracticeSession | null;
  recentPracticeSessions: ArtifactAwarePracticeSession[];
  updatedAt: string;
}

export interface ArtifactPracticeSourceResolverOutput {
  artifactIds: string[];
  primaryArtifactId?: string | null;
  sources: ArtifactPracticeSource[];
  safeContextSummary: {
    topic?: string | null;
    skillIds: string[];
    sourceKinds: ArtifactPracticeSourceKind[];
    sectionSummaries: string[];
    diagramSummaries: string[];
    theoremSummaries: string[];
    workedExampleSummaries: string[];
    extractedQuestionSummaries: string[];
    warnings: string[];
  };
  warnings: string[];
}

// ── Request Contracts ──

export interface GenerateArtifactAwarePracticeRequest {
  sessionId?: string | null;
  artifactIds?: string[];
  primaryArtifactId?: string | null;
  sourceKind?: ArtifactPracticeSourceKind | null;
  sourceId?: string | null;
  requestedItemCount?: number;
  preferredTypes?: ArtifactAwarePracticeItemType[];
  difficulty?: 'easy' | 'medium' | 'hard' | 'adaptive';
  includeLearnerMemory?: boolean;
  includeMasteryContext?: boolean;
}

export interface AnswerArtifactAwarePracticeRequest {
  artifactPracticeSessionId: string;
  practiceItemId: string;
  learnerAnswerSummary: string;
}

export interface ReviewArtifactAwarePracticeRequest {
  artifactPracticeSessionId: string;
}

export interface NextArtifactAwarePracticeRequest {
  artifactPracticeSessionId: string;
}

export interface ScheduleArtifactAwarePracticeRequest {
  artifactPracticeSessionId: string;
}

export interface CompleteArtifactAwarePracticeRequest {
  artifactPracticeSessionId: string;
}

export interface AbandonArtifactAwarePracticeRequest {
  artifactPracticeSessionId: string;
}

export interface GetArtifactAwarePracticeSessionQuery {
  artifactPracticeSessionId?: string;
}

export interface GetArtifactAwarePracticeHistoryQuery {
  maxResults?: number;
}

// ── Response Contracts ──

export interface ArtifactAwarePracticeResponse {
  ok: true;
  status: ArtifactAwarePracticeStatus;
  activePracticeSession?: ArtifactAwarePracticeSession | null;
  recentPracticeSessions: ArtifactAwarePracticeSession[];
  warnings: string[];
}

export interface ArtifactAwarePracticeEvaluateResult {
  status: ArtifactAwareAnswerStatus;
  feedbackSummary: string;
  rubricHits: string[];
  rubricMisses: string[];
  suspectedMisconceptions: ArtifactAwareMisconception[];
  warnings: string[];
}

export interface ArtifactAwarePracticeDecisionOutput {
  decision: ArtifactAwarePracticeDecision;
  reason: string;
  nextActionPrompt?: string | null;
  recommendedReviewAt?: string | null;
  dueAt?: string | null;
  warnings: string[];
}

export interface ArtifactAwarePracticeSafeContextSummary {
  hasActiveArtifactPractice: boolean;
  artifactIds: string[];
  topic?: string | null;
  skillIds: string[];
  currentDecision?: ArtifactAwarePracticeDecision | null;
  misconceptionSummary: string[];
  nextActionPrompt?: string | null;
  dueReviewSummary?: string | null;
  warnings: string[];
}

export interface ArtifactAwarePracticeResolverOutput {
  activePracticeSession?: ArtifactAwarePracticeSession | null;
  recentPracticeSessions: ArtifactAwarePracticeSession[];
  safeContextSummary: ArtifactAwarePracticeSafeContextSummary;
}

// ── Identity ──

export interface ArtifactAwarePracticeIdentity {
  schoolId: string;
  studentId: string;
  sessionId?: string | null;
}

// ── Constants ──

export const ARTIFACT_PRACTICE_DIFFICULTIES = ['easy', 'medium', 'hard', 'adaptive'] as const;
export const ARTIFACT_PRACTICE_ITEM_TYPES: ArtifactAwarePracticeItemType[] = [
  'recall', 'concept_check', 'worked_example_completion', 'error_spotting',
  'application', 'diagram_interpretation', 'formula_use', 'theorem_application',
  'question_from_artifact', 'teach_back', 'reflection',
];

export const MIN_ARTIFACT_PRACTICE_SESSION_ITEMS = 1;
export const DEFAULT_ARTIFACT_PRACTICE_SESSION_ITEMS = 3;
export const MAX_ARTIFACT_PRACTICE_SESSION_ITEMS = 5;
export const MAX_RECENT_ARTIFACT_PRACTICE_SESSIONS = 5;
export const MAX_EVIDENCE_STRINGS = 5;
export const MAX_EVIDENCE_CHARS = 240;
export const MAX_RUBRIC_POINTS = 5;
export const MAX_MISCONCEPTION_EVIDENCE = 5;
export const MAX_ARTIFACT_IDS = 20;
export const MAX_PRIMARY_ARTIFACT_ID = 120;
export const MAX_SOURCE_ID = 160;
export const MAX_PRACTICE_ITEM_ID = 120;
export const MAX_SESSION_ID = 120;
export const MAX_TOPIC = 160;
export const MAX_SUBJECT = 120;
export const MAX_SKILL_IDS = 20;
export const MAX_LEARNER_ANSWER = 1200;
export const MAX_PREFERRED_TYPES = 7;
export const MAX_WARNINGS = 5;
