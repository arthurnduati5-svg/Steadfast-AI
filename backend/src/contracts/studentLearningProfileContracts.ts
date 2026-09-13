// ── Phase 2 Task 002: Student Learning Profile + Mastery Foundation ──

export const MASTERY_LEVELS = [
  'unknown',
  'not_started',
  'emerging',
  'developing',
  'nearly_secure',
  'secure',
  'strong',
] as const;
export type MasteryLevel = typeof MASTERY_LEVELS[number];

export const MASTERY_STATUSES = [
  'active',
  'needs_review',
  'improving',
  'stuck',
  'ready_for_challenge',
  'inactive',
] as const;
export type MasteryStatus = typeof MASTERY_STATUSES[number];

export const PROFILE_STATUSES = [
  'no_data_yet',
  'active',
  'stale',
  'archived',
] as const;
export type ProfileStatus = typeof PROFILE_STATUSES[number];

export const PROFILE_PRIVACY_LEVELS = [
  'student_only',
  'teacher_safe',
  'admin_diagnostics',
  'system_only',
] as const;
export type ProfilePrivacyLevel = typeof PROFILE_PRIVACY_LEVELS[number];

export const PROFILE_VIEW_SCOPES = [
  'self',
  'teacher_assigned',
  'teacher_same_school',
  'admin_same_school',
  'system',
] as const;
export type ProfileViewScope = typeof PROFILE_VIEW_SCOPES[number];

export const SUPPORT_PATTERN_TYPES = [
  'attention_hint',
  'direction_hint',
  'rephrased_question',
  'smaller_step',
  'micro_example',
  'guided_completion',
  'teacher_help',
  'revision',
  'practice_more',
  'teach_back',
  'video_support',
] as const;
export type SupportPatternType = typeof SUPPORT_PATTERN_TYPES[number];

export const WEAK_TOPIC_STATUSES = [
  'identified',
  'improving',
  'resolved',
  'monitoring',
] as const;
export type WeakTopicStatus = typeof WEAK_TOPIC_STATUSES[number];

export const PROFILE_RECOMMENDED_ACTIONS = [
  'review_topic',
  'practice_more',
  'try_smaller_step',
  'use_revision',
  'teach_back',
  'attempt_quiz',
  'move_to_next_topic',
  'teacher_consult',
  'watch_support_video',
  'continue_current_mode',
  'start_learning_session',
] as const;
export type ProfileRecommendedAction = typeof PROFILE_RECOMMENDED_ACTIONS[number];

export const PROFILE_REASON_CODES = [
  'low_confidence',
  'high_hint_dependency',
  'repeated_mistakes',
  'stuck_without_recovery',
  'negative_trend',
  'improving_trend',
  'recovery_after_hint',
  'successful_teach_back',
  'recent_correct',
  'fewer_hints_over_time',
  'strong_evidence',
  'no_evidence_yet',
] as const;
export type ProfileReasonCode = typeof PROFILE_REASON_CODES[number];

export const FORBIDDEN_PROFILE_FIELDS = [
  'rawText',
  'studentMessage',
  'messageBody',
  'aiResponse',
  'prompt',
  'providerResponse',
  'answerKey',
  'teacherOnlyNote',
  'safeguardingRawDetail',
  'token',
  'apiKey',
  'authorization',
  'cookie',
  'privateKey',
  'databaseUrl',
  'rawConversation',
  'rawTranscript',
  'privateDisclosure',
] as const;
export type ForbiddenProfileField = typeof FORBIDDEN_PROFILE_FIELDS[number];

// ── Response Types ──

export interface StudentLearningProfileResponse {
  status: ProfileStatus;
  profileVersion: number;
  profileConfidence: string;
  lastUpdatedAt: string | null;
  subjects: SubjectProfileResponse[];
  overallStrengthSignals: string[];
  overallWeaknessSignals: string[];
  recentGrowthSignals: string[];
  supportPatternSummary: SupportPatternSummaryResponse[];
  recommendedNextActions: ProfileRecommendedActionWithReason[];
  safeEvidenceRefs: string[];
  privacyLevel: ProfilePrivacyLevel;
}

export interface SubjectProfileResponse {
  subjectId: string;
  masteryLevel: MasteryLevel;
  confidenceScore: number;
  strongTopicCount: number;
  weakTopicCount: number;
  developingTopicCount: number;
  recentActivityCount: number;
  recommendedNextTopic: string | null;
  safeEvidenceRefs: string[];
}

export interface TopicProfileResponse {
  topicId: string;
  subjectId: string;
  masteryLevel: MasteryLevel;
  confidenceScore: number;
  attemptCount: number;
  correctCount: number;
  partialCount: number;
  incorrectCount: number;
  hintCount: number;
  stuckCount: number;
  recoveryCount: number;
  lastAttemptAt: string | null;
  lastImprovedAt: string | null;
  recommendedNextAction: ProfileRecommendedAction | null;
  safeEvidenceRefs: string[];
}

export interface SkillMasterySnapshotResponse {
  skillId: string;
  skillLabel?: string;
  subjectId?: string;
  topicId?: string;
  masteryLevel: MasteryLevel;
  masteryStatus: MasteryStatus;
  confidenceScore: number;
  evidenceCount: number;
  attemptCount: number;
  correctCount: number;
  partialCount: number;
  incorrectCount: number;
  hintCount: number;
  stuckCount: number;
  recoveryCount: number;
  misconceptionCount: number;
  lastObservedAt: string | null;
  lastCorrectAt: string | null;
  lastIncorrectAt: string | null;
  nextReviewAt?: string | null;
  safeEvidenceRefs: string[];
}

export interface MistakePatternResponse {
  patternKey: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  mistakeCategory: string;
  safeTitle: string;
  safeSummary: string;
  recurrenceCount: number;
  firstObservedAt: string;
  lastObservedAt: string;
  recoverySignals: string[];
  recommendedRepairAction: string;
  safeEvidenceRefs: string[];
}

export interface SupportPatternSummaryResponse {
  supportType: SupportPatternType;
  effectivenessSignal: string;
  timesUsed: number;
  recoveryAfterUseCount: number;
  hintLevelMostHelpful?: string;
  lastEffectiveAt?: string;
  confidenceScore: number;
  safeEvidenceRefs: string[];
}

export interface ProfileRecommendedActionWithReason {
  action: ProfileRecommendedAction;
  reasonCodes: ProfileReasonCode[];
  priority: number;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
}

export interface MasteryPathwayResponse {
  strongSkills: SkillMasterySnapshotResponse[];
  developingSkills: SkillMasterySnapshotResponse[];
  weakSkills: SkillMasterySnapshotResponse[];
  recommendedNextSkill: SkillMasterySnapshotResponse | null;
  whyThisNextReasonCodes: ProfileReasonCode[];
  safeEvidenceRefs: string[];
}

export interface WeakTopicResponse {
  topicId: string;
  subjectId: string;
  weaknessScore: number;
  status: WeakTopicStatus;
  safeSummary: string;
  reasonCodes: ProfileReasonCode[];
  recommendedAction: ProfileRecommendedAction;
  safeEvidenceRefs: string[];
}

export interface AcademicMemoryResponse {
  strengthPatterns: string[];
  weaknessPatterns: string[];
  supportPatterns: SupportPatternSummaryResponse[];
  revisionNeeds: string[];
  safeEvidenceRefs: string[];
}

// ── Request Types ──

export interface LearningProfileRefreshRequest {
  subjectId?: string;
  topicId?: string;
  forceRecompute?: boolean;
}

export interface LearningProfileQueryRequest {
  studentId?: string;
  subjectId?: string;
  topicId?: string;
}
