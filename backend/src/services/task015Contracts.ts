import type { MasterySignalLevel, RevisionPriority, WeakSkillStatus } from './mastery/task011Contracts';

export type AdaptiveChallengeMode = 'auto' | 'challenge' | 'remediation' | 'mastery_check' | 'spaced_review';

export type AdaptiveChallengeType =
  | 'foundation_remediation'
  | 'similar_practice'
  | 'light_challenge'
  | 'standard_challenge'
  | 'stretch_challenge'
  | 'mastery_check'
  | 'spaced_review_item'
  | 'teacher_supported_step'
  | 'deen_teacher_referral';

export type DifficultyLevel = 'foundation' | 'easy' | 'standard' | 'challenging' | 'stretch';

export type SupportLevel = 'minimal' | 'moderate' | 'significant' | 'intensive' | 'maximum';

export type ChallengeReadinessVerdict =
  | 'not_ready'
  | 'foundation_needed'
  | 'remediation_needed'
  | 'similar_practice'
  | 'light_challenge_ready'
  | 'standard_challenge_ready'
  | 'stretch_challenge_ready';

export type RemediationPathStepType =
  | 'micro_explanation_check'
  | 'foundation_question'
  | 'guided_example_without_final_answer'
  | 'similar_practice'
  | 'mistake_pattern_repair'
  | 'confidence_check'
  | 'return_to_main_skill';

export type RemediationReadinessVerdict =
  | 'not_ready'
  | 'partial_progress'
  | 'ready_to_return'
  | 'ready_for_challenge';

export type ChallengeStatus = 'active' | 'completed' | 'expired' | 'skipped';

export type RemediationStatus = 'active' | 'completed' | 'stale';

export interface AdaptiveChallengeRequestContext {
  schoolId: string;
  tutorLearnerId: string;
  studentId?: string;
  sessionId?: string;
  subject?: string;
  topic?: string;
  skillTag?: string;
  mode?: AdaptiveChallengeMode;
}

export interface ChallengeReadinessInput {
  masteryLevel: MasterySignalLevel;
  evidenceCount: number;
  recentIndependentSuccessCount: number;
  recentHintUsage: number;
  recentMistakeCount: number;
  repeatedMistakeSignals: number;
  revisionPriority: RevisionPriority;
  spacedReviewDue: boolean;
  learnerChallengePreference: string;
  difficultyCalibration: DifficultyLevel;
  supportLevel: SupportLevel;
  subject: string;
  topic?: string;
  skillTag?: string;
}

export interface ChallengeReadinessDecision {
  verdict: ChallengeReadinessVerdict;
  reasonCodes: string[];
  suggestedChallengeType: AdaptiveChallengeType;
  suggestedDifficultyLevel: DifficultyLevel;
  whyThisLevel: string;
  confidence: number;
}

export interface RemediationNeedInput {
  masteryLevel: MasterySignalLevel;
  recentMistakeCount: number;
  repeatedMistakeSignals: number;
  recentHintDependency: number;
  weakSkillStatus?: WeakSkillStatus;
  revisionPriority: RevisionPriority;
  prerequisiteGaps: string[];
  subject: string;
  topic?: string;
  skillTag?: string;
}

export interface RemediationNeedDecision {
  remediationRequired: boolean;
  reasonCodes: string[];
  suggestedPathType: AdaptiveChallengeType;
}

export interface RemediationPathStep {
  stepId: string;
  stepType: RemediationPathStepType;
  studentInstruction: string;
  checkQuestion: string;
  supportLevel: SupportLevel;
  completionSignal: string;
}

export interface RemediationPath {
  pathId: string;
  subject: string;
  topic?: string;
  skillTag?: string;
  blockingSkill?: string;
  prerequisiteFocus: string[];
  steps: RemediationPathStep[];
  currentStepIndex: number;
  whyThisPath: string;
  returnToMainSkillCondition: string;
  privacyMetadata: Record<string, unknown>;
  createdAt: string;
}

export interface PrerequisiteSkillResult {
  blockingSkill: string | null;
  prerequisiteSkills: string[];
  prerequisiteLabels: string[];
  confidence: number;
  source: 'curriculum' | 'inferred' | 'safe_fallback';
  blockedBySkill: string | null;
}

export interface DifficultySignalInput {
  correctIndependent: boolean;
  correctWithHint: boolean;
  partialAnswer: boolean;
  incorrectAnswer: boolean;
  repeatedMistake: boolean;
  tooEasyFeedback: boolean;
  tooHardFeedback: boolean;
  stillConfusedFeedback: boolean;
  challengeRequested: boolean;
  hintRequested: boolean;
  attemptCount?: number;
}

export interface DifficultyCalibrationInput {
  schoolId: string;
  tutorLearnerId: string;
  subject: string;
  topic?: string;
  skillTag?: string;
  masteryLevel: MasterySignalLevel;
  evidenceCount: number;
  recentSignals: DifficultySignalInput[];
  adaptiveProfileSupportLevel?: string;
  adaptiveProfileDifficultyCalibration?: number;
}

export interface DifficultyCalibrationDecision {
  currentDifficultyLevel: DifficultyLevel;
  supportLevel: SupportLevel;
  calibrationReason: string;
  recentSignalSummary: string;
  nextAdjustmentCondition: string;
  confidence: number;
  privacyMetadata: Record<string, unknown>;
  updatedAt: string;
}

export interface ChallengeBlueprint {
  challengeId: string;
  challengeType: AdaptiveChallengeType;
  subject: string;
  topic?: string;
  skillTag?: string;
  difficultyLevel: DifficultyLevel;
  learnerPrompt: string;
  socraticOpeningQuestion: string;
  allowedHints: string[];
  expectedSkillSignal: string;
  safeEvidenceRefs: Array<{ source: string; summary: string }>;
  privacyMetadata: Record<string, unknown>;
  internalCheckMetadataRef?: string;
}

export interface LearnerSafeChallengeResponse {
  challengeId: string;
  challengeType: AdaptiveChallengeType;
  subject: string;
  topic?: string;
  skillTag?: string;
  difficultyLevel: DifficultyLevel;
  learnerPrompt: string;
  socraticOpeningQuestion: string;
  allowedActions: string[];
  hintPolicy: string;
  whyThisLevel: string;
  safeEvidenceCards?: Array<{ source: string; summary: string }>;
  privacyMetadata: Record<string, unknown>;
  generatedAt: string;
}

export interface HintScaffoldDecision {
  scaffoldType: 'question_based' | 'stronger_scaffold' | 'worked_pattern' | 'no_more_hints';
  scaffoldText: string;
  hintLevel: number;
  isFinalAnswer: boolean;
}

export interface ChallengeAttemptRequest {
  attemptText: string;
  sessionId?: string;
  hintLevelUsed?: number;
}

export interface ChallengeAttemptResult {
  attemptAccepted: boolean;
  outcome: 'correct' | 'partially_correct' | 'incorrect' | 'unclear' | 'not_evaluated';
  feedback: string;
  hintPolicy: string;
  difficultyUpdated: boolean;
  remediationProgressed: boolean;
  evidencePersisted: boolean;
  privacyMetadata: Record<string, unknown>;
}

export interface AdaptiveChallengeAuditRecord {
  actorId: string;
  actorRole: string;
  schoolId: string;
  tutorLearnerId: string;
  sessionId?: string;
  challengeId?: string;
  remediationPathId?: string;
  challengeType?: string;
  difficultyLevel?: string;
  reasonCodes: string[];
  safeEvidenceRefs: Array<{ source: string; summary: string }>;
  privacyDecision: string;
  deenSensitivityHandled: boolean;
  safeguardingBoundaryApplied: boolean;
  createdAt: string;
  requestId?: string;
}

export interface CrossStudentAccessCheck {
  allowed: boolean;
  reason: string;
}
