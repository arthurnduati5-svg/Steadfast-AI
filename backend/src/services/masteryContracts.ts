// ─────────────────────────────────────────────────────────────
// Steadfast AI — Mastery and Misconception Engine Contracts v1
// Canonical types for mastery states, misconception signals,
// evidence input, tutor decisions, and prompt-safe summaries.
// Reuses existing contracts where compatible.
// ─────────────────────────────────────────────────────────────

// ── Mastery Level ──
export type MasteryLevel =
  | 'unknown'
  | 'introduced'
  | 'emerging'
  | 'developing'
  | 'proficient'
  | 'mastered'
  | 'regressing'
  | 'needs_remediation';

// ── Mastery Confidence ──
export type MasteryConfidence = 'low' | 'medium' | 'high';

// ── Mastery Decision ──
export type MasteryDecision =
  | 'diagnose'
  | 'reteach'
  | 'remediate'
  | 'review'
  | 'practice_more'
  | 'advance'
  | 'challenge'
  | 'pause_and_clarify';

// ── Mastery Evidence Source ──
export type MasteryEvidenceSource =
  | 'chat_turn'
  | 'practice_attempt'
  | 'artifact_answer'
  | 'video_practice'
  | 'teacher_mark'
  | 'system_diagnostic'
  | 'mastery_review';

// ── Misconception Status ──
export type MisconceptionStatus =
  | 'suspected'
  | 'active'
  | 'resolved'
  | 'superseded'
  | 'blocked';

// ── Mastery Scope ──
export interface MasteryScope {
  studentId: string;
  schoolId?: string | null;
  classId?: string | null;
  sessionId?: string | null;
  subject: string;
  topic: string;
  skillId: string;
  skillLabel?: string | null;
}

// ── Mastery Evidence Input ──
export interface MasteryEvidenceInput {
  scope: MasteryScope;
  source: MasteryEvidenceSource;
  correct?: boolean | null;
  score?: number | null;
  confidence?: MasteryConfidence | null;
  responseText?: string | null;
  expectedAnswer?: string | null;
  selectedChoice?: string | null;
  explanationQuality?: 'missing' | 'weak' | 'partial' | 'strong' | null;
  misconceptionHint?: string | null;
  evidenceRef?: string | null;
  occurredAt?: string | null;
  metadata?: Record<string, unknown>;
}

// ── Skill Mastery State ──
export interface SkillMasteryState {
  id: string;
  scope: MasteryScope;
  masteryLevel: MasteryLevel;
  confidence: MasteryConfidence;
  attemptCount: number;
  correctCount: number;
  incorrectCount: number;
  streakCorrect: number;
  streakIncorrect: number;
  firstAttemptAt?: string | null;
  lastAttemptAt?: string | null;
  lastEvidenceSource?: MasteryEvidenceSource | null;
  lastDecision: MasteryDecision;
  reviewAfter?: string | null;
  misconceptionIds: string[];
  evidenceRefs: string[];
  safeSummary: string;
  metadata: Record<string, unknown>;
}

// ── Misconception Signal ──
export interface MisconceptionSignal {
  id: string;
  scope: MasteryScope;
  misconceptionType: string;
  description: string;
  status: MisconceptionStatus;
  confidence: MasteryConfidence;
  evidenceCount: number;
  firstObservedAt: string;
  lastObservedAt: string;
  resolvedAt?: string | null;
  safeSummary: string;
  evidenceRefs: string[];
  metadata: Record<string, unknown>;
}

// ── Mastery Prompt Summary (for TutorTurnContext) ──
export interface MasteryPromptSummary {
  studentId: string;
  schoolId?: string | null;
  masteryCount: number;
  masteredSkills: string[];
  developingSkills: string[];
  weakSkills: string[];
  activeMisconceptions: string[];
  reviewDue: string[];
  recommendedDecision: MasteryDecision;
  warnings: string[];
}

// ── Mastery Safe View (for frontend) ──
export interface MasterySafeView {
  id: string;
  subject: string;
  topic: string;
  skillId: string;
  skillLabel?: string | null;
  masteryLevel: MasteryLevel;
  confidence: MasteryConfidence;
  safeSummary: string;
  lastAttemptAt?: string | null;
  reviewAfter?: string | null;
}

// ── Weakness Pattern ──
export interface WeaknessPatternResult {
  studentId: string;
  schoolId?: string | null;
  subject: string;
  topic: string;
  skillId: string;
  skillLabel?: string | null;
  incorrectStreakCount: number;
  totalAttemptCount: number;
  weaknessRatio: number; // 0-1
  detectedAt: string;
  evidenceRefs: string[];
  summary: string;
  shouldEscalate: boolean;
}

// ── Skill Progression Result ──
export interface SkillProgressionResult {
  studentId: string;
  schoolId?: string | null;
  subject: string;
  topic: string;
  skillId: string;
  skillLabel?: string | null;
  previousLevel: MasteryLevel;
  currentLevel: MasteryLevel;
  isForward: boolean;
  isRegression: boolean;
  summary: string;
  observedAt: string;
}

// ── Mastery Decision Result ──
export interface MasteryDecisionResult {
  decision: MasteryDecision;
  reason: string;
  tutorActionHint: string;
  evidenceSummary: string;
  warnings: string[];
}

// ── Misconception Candidate (detection output) ──
export interface MisconceptionCandidate {
  scope: MasteryScope;
  misconceptionType: string;
  description: string;
  confidence: MasteryConfidence;
  evidenceRef?: string;
  evidenceSummary: string;
}

// ── Normalized Mastery Evidence (evidence service output) ──
export interface NormalizedMasteryEvidence {
  scope: MasteryScope;
  source: MasteryEvidenceSource;
  correct: boolean;
  score: number; // 0-100
  evidenceRef: string;
  occurredAt: string;
  explanationQuality?: 'missing' | 'weak' | 'partial' | 'strong' | null;
  misconceptionHint?: string | null;
  metadata: Record<string, unknown>;
}

// ── Learner Memory Write Command (for bridge) ──
export interface LearnerMemoryWriteCommand {
  scope: MasteryScope;
  kind: 'mastery_signal' | 'misconception' | 'weakness' | 'strength' | 'recent_activity';
  source: string;
  visibility: 'tutor_internal' | 'learner_visible' | 'system_only';
  confidence: 'low' | 'medium' | 'high';
  safeSummary: string;
  evidenceRefs?: string[];
  metadata?: Record<string, unknown>;
}

// ── Mastery Evidence Signals (extracted from evidence) ──
export interface MasteryEvidenceSignals {
  correct: boolean;
  score: number;
  explanationQuality: 'missing' | 'weak' | 'partial' | 'strong' | null;
  misconceptionHint: string | null;
  confidenceDelta: number;
  isWeaknessSignal: boolean;
  isMisconceptionSignal: boolean;
}
