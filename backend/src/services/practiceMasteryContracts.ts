// ─────────────────────────────────────────────────────────────
// Steadfast AI — Practice and Mastery Scaffolding Contracts v1
// Domain: evidence-based, school-scoped, privacy-safe practice
// and early mastery signals.  Not final certification.
// ─────────────────────────────────────────────────────────────

// ── Practice Attempt Kind Enum ──
export type PracticeAttemptKind =
  | 'open_response'
  | 'multiple_choice'
  | 'short_answer'
  | 'worked_solution'
  | 'teach_back'
  | 'artifact_question'
  | 'review_prompt'
  | 'diagnostic';

// ── Practice Attempt Status Enum ──
export type PracticeAttemptStatus =
  | 'submitted'
  | 'evaluated'
  | 'needs_review'
  | 'invalid'
  | 'discarded';

// ── Practice Outcome Enum ──
export type PracticeOutcome =
  | 'correct'
  | 'partially_correct'
  | 'incorrect'
  | 'unclear'
  | 'not_evaluated';

// ── Mastery Level Enum ──
export type MasteryLevel =
  | 'not_started'
  | 'emerging'
  | 'developing'
  | 'proficient'
  | 'strong'
  | 'needs_review';

// ── Mastery Status Enum ──
export type MasteryStatus =
  | 'active'
  | 'needs_review'
  | 'stale'
  | 'superseded'
  | 'soft_deleted';

// ── Mastery Evidence Source Enum ──
export type MasteryEvidenceSource =
  | 'practice_attempt'
  | 'artifact_question'
  | 'learner_memory'
  | 'teacher_note'
  | 'revision_session'
  | 'system_import';

// ── Practice Recommendation Action Enum ──
export type PracticeRecommendationAction =
  | 'reteach'
  | 'remediate'
  | 'review'
  | 'practice_similar'
  | 'increase_difficulty'
  | 'advance'
  | 'ask_clarifying_question';

// ── Review Schedule Status Enum ──
export type ReviewScheduleStatus =
  | 'scheduled'
  | 'due'
  | 'completed'
  | 'skipped'
  | 'cancelled';

// ── Context Status for MasteryPracticeContext ──
export type MasteryPracticeContextStatus =
  | 'resolved'
  | 'partial'
  | 'no_data_yet'
  | 'unavailable'
  | 'error';

// ── Recommendation Priority ──
export type RecommendationPriority = 'low' | 'medium' | 'high' | 'urgent';

// ── Recommendation Source ──
export type RecommendationSource =
  | 'practice_attempt'
  | 'mastery_snapshot'
  | 'misconception_signal'
  | 'spaced_review'
  | 'learner_memory'
  | 'artifact_context'
  | 'combined';

// ── Suggested Difficulty ──
export type SuggestedDifficulty = 'easy' | 'medium' | 'hard' | 'adaptive' | 'unknown';

// ── Review Reason ──
export type ReviewReason =
  | 'new_skill'
  | 'incorrect_attempt'
  | 'partial_attempt'
  | 'misconception'
  | 'scheduled_reinforcement'
  | 'stale_mastery';

// ── Practice Attempt ──
export interface PracticeAttempt {
  attemptId: string;
  schoolId: string;
  studentId: string;
  sessionId?: string | null;

  kind: PracticeAttemptKind;
  status: PracticeAttemptStatus;
  outcome: PracticeOutcome;

  subject?: string | null;
  topic?: string | null;
  skillIds: string[];

  promptSummary: string;
  learnerAnswerSummary?: string | null;
  expectedAnswerSummary?: string | null;
  feedbackSummary?: string | null;

  artifactId?: string | null;
  artifactBlockId?: string | null;
  sourceQuestionId?: string | null;

  /**
   * PP-02 exact PracticeProblem binding. sourceQuestionId remains the
   * durable problem identity (equivalent to problemId); problemId mirrors
   * it explicitly, and problemVersion pins the exact immutable issued
   * version. Client data can never override this binding: the Practice Pad
   * check runtime loads the server-owned problem/version itself.
   */
  problemId?: string | null;
  problemVersion?: number | null;

  hintsRequested: number;
  attemptNumber: number;
  timeSpentSeconds?: number | null;

  confidence: number;

  misconceptionSignals: PracticeMisconceptionSignalInput[];
  evidence: MasteryEvidence[];

  createdAt: string;
  evaluatedAt?: string | null;
}

// ── Skill Mastery Snapshot ──
export interface SkillMasterySnapshot {
  masteryId: string;
  schoolId: string;
  studentId: string;

  subject: string;
  topic: string;
  skillId: string;
  skillLabel: string;

  level: MasteryLevel;
  status: MasteryStatus;

  confidenceScore: number;
  evidenceCount: number;
  attemptCount: number;
  correctCount: number;
  partialCount: number;
  incorrectCount: number;

  misconceptionCount: number;
  lastAttemptAt?: string | null;
  lastCorrectAt?: string | null;
  lastIncorrectAt?: string | null;

  nextReviewAt?: string | null;
  reviewIntervalDays?: number | null;

  evidence: MasteryEvidence[];

  createdAt: string;
  updatedAt: string;
}

// ── Mastery Evidence ──
export interface MasteryEvidence {
  evidenceId: string;
  source: MasteryEvidenceSource;
  sourceId: string;

  summary: string;
  outcome?: PracticeOutcome | null;

  subject?: string | null;
  topic?: string | null;
  skillIds: string[];

  artifactId?: string | null;
  artifactBlockId?: string | null;

  confidence: number;
  observedAt: string;
}

// ── Practice Misconception Signal (embedded in attempt) ──
export interface PracticeMisconceptionSignalInput {
  label: string;
  summary: string;
  confidence?: number;
  skillIds?: string[];
}

// ── Practice Misconception Signal (persisted) ──
export interface PracticeMisconceptionSignal {
  misconceptionId: string;
  schoolId: string;
  studentId: string;

  subject?: string | null;
  topic?: string | null;
  skillIds: string[];

  label: string;
  summary: string;

  evidenceAttemptIds: string[];
  evidenceMemoryIds: string[];

  confidenceScore: number;
  observationCount: number;

  status: 'active' | 'improving' | 'resolved' | 'needs_review' | 'soft_deleted';

  firstObservedAt: string;
  lastObservedAt: string;
  updatedAt: string;
}

// ── Spaced Review Item ──
export interface SpacedReviewItem {
  reviewId: string;
  schoolId: string;
  studentId: string;

  subject: string;
  topic: string;
  skillId: string;
  skillLabel: string;

  masteryId?: string | null;

  dueAt: string;
  intervalDays: number;
  status: ReviewScheduleStatus;

  reason: ReviewReason;

  createdAt: string;
  completedAt?: string | null;
}

// ── Next Practice Recommendation ──
export interface NextPracticeRecommendation {
  recommendationId: string;

  schoolId: string;
  studentId: string;

  action: PracticeRecommendationAction;

  subject?: string | null;
  topic?: string | null;
  skillIds: string[];

  reason: string;
  priority: RecommendationPriority;

  suggestedDifficulty: SuggestedDifficulty;

  source: RecommendationSource;

  evidenceIds: string[];
  attemptIds: string[];
  memoryIds: string[];
  masteryIds: string[];
  artifactIds: string[];

  tutorInstruction: string;

  createdAt: string;
}

// ── Mastery Practice Context (resolver output) ──
export interface MasteryPracticeContext {
  status: MasteryPracticeContextStatus;

  masterySignals: MasteryContextSignal[];
  misconceptionSignals: MasteryContextSignal[];
  recentPracticeSignals: MasteryContextSignal[];
  reviewDueSignals: MasteryContextSignal[];
  nextPracticeRecommendations: NextPracticeRecommendation[];

  masteryIdsUsed: string[];
  attemptIdsUsed: string[];
  misconceptionIdsUsed: string[];
  reviewIdsUsed: string[];

  warnings: string[];
  errors: string[];

  resolvedAt: string;
}

// ── Lightweight context signal for TutorTurnContext ──
export interface MasteryContextSignal {
  id: string;
  label: string;
  summary: string;
  source: string;
  confidence: number;
  updatedAt?: string | null;
}

// ── Request Contracts ──

export interface CreatePracticeAttemptRequest {
  sessionId?: string | null;
  kind: PracticeAttemptKind;

  subject?: string | null;
  topic?: string | null;
  skillIds?: string[];

  promptSummary: string;
  learnerAnswerSummary?: string | null;
  expectedAnswerSummary?: string | null;
  feedbackSummary?: string | null;

  artifactId?: string | null;
  artifactBlockId?: string | null;
  sourceQuestionId?: string | null;

  /** PP-02 exact PracticeProblem binding (mirrors PracticeAttempt). */
  problemId?: string | null;
  problemVersion?: number | null;

  hintsRequested?: number;
  attemptNumber?: number;
  timeSpentSeconds?: number | null;

  outcome?: PracticeOutcome;
  confidence?: number;

  misconceptionSignals?: PracticeMisconceptionSignalInput[];
}

export interface ListPracticeAttemptsQuery {
  subject?: string;
  topic?: string;
  skillId?: string;
  limit?: number;
}

export interface ResolveMasteryRequest {
  sessionId?: string | null;
  subject?: string | null;
  topic?: string | null;
  skillIds?: string[];
  artifactIds?: string[];
  maxSignals?: number;
  includeReviewDue?: boolean;
  includeNextPractice?: boolean;
}

export interface NextPracticeRequest {
  sessionId?: string | null;
  subject?: string | null;
  topic?: string | null;
  skillIds?: string[];
  artifactIds?: string[];
  maxRecommendations?: number;
}

export interface PatchMasteryRequest {
  status?: MasteryStatus;
  level?: MasteryLevel;
  confidenceScore?: number;
  nextReviewAt?: string | null;
  reviewIntervalDays?: number | null;
}

// ── Response Contracts ──

export interface CreatePracticeAttemptResponse {
  ok: true;
  attempt: PracticeAttempt;
  masteryUpdates: SkillMasterySnapshot[];
  memoryUpdates: unknown[];
  reviewItems: SpacedReviewItem[];
  recommendations: NextPracticeRecommendation[];
}

export interface MasteryListResponse {
  ok: true;
  masterySnapshots: SkillMasterySnapshot[];
  status: 'resolved' | 'partial' | 'no_data_yet' | 'error';
}

export interface ResolveMasteryResponse {
  ok: true;
  context: MasteryPracticeContext;
}

export interface MasterySingleResponse {
  ok: true;
  masterySnapshot: SkillMasterySnapshot;
}

export interface ReviewDueResponse {
  ok: true;
  reviewItems: SpacedReviewItem[];
}

export interface NextPracticeResponse {
  ok: true;
  recommendations: NextPracticeRecommendation[];
}

export interface PracticeAttemptListResponse {
  ok: true;
  attempts: PracticeAttempt[];
}

// ── Confidence Helpers ──

export const MASTERY_LEVEL_THRESHOLDS: Array<{ max: number; level: MasteryLevel }> = [
  { max: 0.19, level: 'not_started' },
  { max: 0.39, level: 'emerging' },
  { max: 0.64, level: 'developing' },
  { max: 0.82, level: 'proficient' },
  { max: 0.95, level: 'strong' },
];

export function masteryLevelFromScore(score: number): MasteryLevel {
  for (const threshold of MASTERY_LEVEL_THRESHOLDS) {
    if (score <= threshold.max) return threshold.level;
  }
  return 'needs_review';
}

export function computeMasteryConfidenceDelta(outcome: PracticeOutcome, hintsRequested: number, hasPriorCorrect: boolean): number {
  switch (outcome) {
    case 'correct':
      let delta = 0.08;
      if (hintsRequested === 0) delta += 0.03;
      if (hasPriorCorrect) delta += 0.02;
      return delta;
    case 'partially_correct':
      let delta2 = 0.02;
      if (hintsRequested >= 3) delta2 -= 0.01;
      return delta2;
    case 'incorrect':
      return -0.06;
    default:
      return 0;
  }
}

export function clampConfidence(value: number): number {
  return Math.max(0, Math.min(0.95, value));
}
