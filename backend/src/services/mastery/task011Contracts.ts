// ─────────────────────────────────────────────────────────────
// Steadfast AI — Task 011 Contracts
// Practice attempt persistence, step evidence persistence,
// mastery aggregation, weak skill tracking, revision scheduling,
// spaced review, learner progress state, growth proof summaries.
// ─────────────────────────────────────────────────────────────

// ── Safe Practice Attempt Input/Output ──
export interface SafePracticeAttemptInput {
  schoolId: string;
  tutorLearnerId: string;
  sessionId?: string | null;
  subject?: string | null;
  topic?: string | null;
  skillIds?: string[];
  curriculumTrack?: string;
  subjectModuleId?: string | null;
  promptSummary: string;
  learnerAnswerSummary?: string | null;
  expectedAnswerSummary?: string | null;
  outcome: 'correct' | 'partially_correct' | 'incorrect' | 'unclear' | 'not_evaluated';
  hintLevelUsed: number;
  attemptNumber: number;
  timeSpentSeconds?: number | null;
  confidence: number;
  validationModes?: string[];
  mistakeCategories?: string[];
  misconceptionSignals?: Array<{
    label: string;
    summary: string;
    confidence?: number;
    skillIds?: string[];
  }>;
}

export interface SafePracticeAttemptRecord {
  attemptId: string;
  schoolId: string;
  studentId: string;
  sessionId?: string | null;
  subject?: string | null;
  topic?: string | null;
  skillIds: string[];
  curriculumTrack: string;
  subjectModuleId?: string | null;
  outcome: string;
  hintLevelUsed: number;
  attemptNumber: number;
  confidence: number;
  validationModes: string[];
  mistakeCategories: string[];
  safeSummary: string;
  createdAt: string;
}

// ── Step Evidence ──
export type StepEvidenceType =
  | 'attempt_correct'
  | 'attempt_partially_correct'
  | 'attempt_incorrect'
  | 'hint_used'
  | 'mistake_detected'
  | 'misconception_detected'
  | 'step_improved'
  | 'practice_requested'
  | 'revision_needed'
  | 'challenge_ready';

export interface SafeStepEvidenceInput {
  schoolId: string;
  tutorLearnerId: string;
  sessionId?: string | null;
  subject?: string | null;
  topic?: string | null;
  skillIds?: string[];
  evidenceType: StepEvidenceType;
  confidenceScore: number;
  hintLevel?: number;
  validationModes?: string[];
  mistakeCategory?: string | null;
  safeSummary: string;
  curriculumTrack?: string;
  subjectModuleId?: string | null;
  sourceSensitive?: boolean;
  source: string;
}

export interface SafeStepEvidenceRecord {
  evidenceId: string;
  schoolId: string;
  studentId: string;
  sessionId?: string | null;
  subject?: string | null;
  topic?: string | null;
  skillIds: string[];
  evidenceType: StepEvidenceType;
  confidenceScore: number;
  hintLevel?: number;
  validationModes: string[];
  mistakeCategory?: string | null;
  safeSummary: string;
  curriculumTrack: string;
  subjectModuleId?: string | null;
  sourceSensitive: boolean;
  source: string;
  createdAt: string;
}

// ── Mastery Signal ──
export type MasterySignalLevel =
  | 'not_started'
  | 'emerging'
  | 'developing'
  | 'secure'
  | 'strong';

export interface MasteryAggregationInput {
  schoolId: string;
  tutorLearnerId: string;
  subject: string;
  topic: string;
  skillId: string;
  skillLabel: string;
  outcome: 'correct' | 'partially_correct' | 'incorrect' | 'unclear';
  hintLevel: number;
  confidence: number;
  curriculumTrack?: string;
}

export interface MasteryAggregationResult {
  schoolId: string;
  studentId: string;
  subject: string;
  topic: string;
  skillId: string;
  skillLabel: string;
  level: MasterySignalLevel;
  confidenceScore: number;
  evidenceCount: number;
  attemptCount: number;
  correctCount: number;
  incorrectCount: number;
  independentCorrectCount: number;
  hintDependentCorrectCount: number;
  lastAttemptAt: string;
  lastCorrectAt?: string | null;
  lastIncorrectAt?: string | null;
  nextReviewAt?: string | null;
  fakeMasteryPrevented: boolean;
}

// ── Weak Skill ──
export type WeakSkillStatus =
  | 'needs_review'
  | 'recently_struggled'
  | 'developing'
  | 'improving'
  | 'secure'
  | 'ready_for_challenge'
  | 'watch'
  | 'maintenance';

export interface WeakSkillSignal {
  schoolId: string;
  tutorLearnerId: string;
  subject: string;
  topic: string;
  skillId: string;
  skillLabel: string;
  status: WeakSkillStatus;
  mistakeCount: number;
  misconceptionCount: number;
  independentSuccessCount: number;
  lastMistakeAt?: string | null;
  lastCorrectAt?: string | null;
  safeSummary: string;
  priority: 'high' | 'medium' | 'low' | 'none';
}

export interface WeakSkillUpdateResult {
  skillId: string;
  previousStatus: WeakSkillStatus;
  currentStatus: WeakSkillStatus;
  priority: 'high' | 'medium' | 'low' | 'none';
  updatedAt: string;
}

// ── Revision Scheduling ──
export type RevisionPriority = 'high' | 'medium' | 'low' | 'none';

export type RevisionReason =
  | 'repeated_mistake'
  | 'low_mastery'
  | 'urgent_review'
  | 'partial_understanding'
  | 'recent_struggle'
  | 'maintenance'
  | 'review_soon'
  | 'no_signal';

export interface RevisionScheduleInput {
  schoolId: string;
  tutorLearnerId: string;
  subject: string;
  topic: string;
  skillId: string;
  skillLabel: string;
  currentMasteryLevel: MasterySignalLevel;
  confidenceScore: number;
  mistakeCount: number;
  independentSuccessCount: number;
  lastAttemptAt?: string | null;
  lastCorrectAt?: string | null;
  lastIncorrectAt?: string | null;
}

export interface RevisionScheduleDecision {
  skillId: string;
  priority: RevisionPriority;
  reason: RevisionReason;
  nextReviewAt: string;
  intervalDays: number;
  shouldSchedule: boolean;
  duplicatePrevented: boolean;
}

// ── Spaced Review Plan ──
export interface SpacedReviewPlan {
  skillId: string;
  subject: string;
  topic: string;
  intervalDays: number;
  dueAt: string;
  priority: RevisionPriority;
  reason: RevisionReason;
}

// ── Learner Progress State ──
export interface LearnerProgressState {
  schoolId: string;
  studentId: string;
  strengths: Array<{
    skillId: string;
    skillLabel: string;
    level: MasterySignalLevel;
    confidenceScore: number;
  }>;
  needsReview: Array<{
    skillId: string;
    skillLabel: string;
    status: WeakSkillStatus;
    priority: RevisionPriority;
  }>;
  improving: Array<{
    skillId: string;
    skillLabel: string;
    level: MasterySignalLevel;
  }>;
  readyForChallenge: Array<{
    skillId: string;
    skillLabel: string;
    level: MasterySignalLevel;
  }>;
  subjects: string[];
  totalMastered: number;
  totalDeveloping: number;
  totalNeedsReview: number;
  lastUpdated: string;
}

// ── Growth Proof Summary ──
export interface GrowthProofSummary {
  schoolId: string;
  studentId: string;
  whatImproved: string[];
  whatNeedsReview: string[];
  supportingEvidence: string[];
  revisionScheduled: Array<{
    skillId: string;
    skillLabel: string;
    dueAt: string;
    priority: RevisionPriority;
  }>;
  nextLearningAction: string;
  confidenceLevel: 'high' | 'medium' | 'low';
  generatedAt: string;
}

// ── Result Types ──
export interface Task011PersistenceResult {
  ok: boolean;
  attemptPersisted: boolean;
  stepEvidencePersisted: boolean;
  masteryAggregated: boolean;
  weakSkillUpdated: boolean;
  revisionScheduled: boolean;
  spacedReviewPlanned: boolean;
  progressStateUpdated: boolean;
  growthProofGenerated: boolean;
  warnings: string[];
  errors: string[];
}

export interface Task011TutorTurnIntegrationResult {
  ok: boolean;
  requestId: string;
  persistenceResult: Task011PersistenceResult;
  growthProofSummary?: GrowthProofSummary | null;
  warnings: string[];
  errors: string[];
}
