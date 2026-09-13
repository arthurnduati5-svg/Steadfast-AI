import type { ResolvedTutorIdentity } from './tutorStateContracts';

export type LearnerPreferenceFeedbackType =
  | 'too_easy'
  | 'too_hard'
  | 'just_right'
  | 'still_confused'
  | 'understood'
  | 'not_helpful'
  | 'helpful'
  | 'want_hint'
  | 'want_foundation_review'
  | 'want_similar_practice'
  | 'want_challenge'
  | 'want_teacher_help'
  | 'not_now'
  | 'shorter_steps'
  | 'more_examples'
  | 'slower_pace'
  | 'faster_pace';

export type RecommendationInteractionType =
  | 'recommendation_shown'
  | 'recommendation_started'
  | 'recommendation_completed'
  | 'recommendation_skipped'
  | 'agency_option_selected'
  | 'feedback_submitted'
  | 'hint_requested'
  | 'teacher_help_requested'
  | 'challenge_requested'
  | 'foundation_review_requested';

export type LearnerSupportLevel =
  | 'minimal_support'
  | 'light_support'
  | 'guided_support'
  | 'step_by_step_support'
  | 'foundation_rebuild'
  | 'teacher_support_recommended';

export type LearnerStepSizePreference = 'shorter' | 'standard' | 'longer';
export type LearnerPracticeModePreference = 'balanced' | 'more_practice' | 'more_examples' | 'more_challenge';
export type LearnerExamplePreference = 'standard' | 'more_examples' | 'fewer_examples';

export interface LearnerPreferenceFeedbackRequest {
  feedbackType: LearnerPreferenceFeedbackType;
  agencyOptionId?: string;
  subject?: string;
  topic?: string;
  skillTag?: string;
  sessionId?: string;
  freeText?: string;
}

export interface RecommendationInteractionRequest {
  interactionType: RecommendationInteractionType;
  sessionId?: string;
  subject?: string;
  topic?: string;
  skillTag?: string;
}

export interface LearnerPreferenceFeedbackResult {
  feedbackAccepted: boolean;
  safeFeedbackType: LearnerPreferenceFeedbackType;
  interactionRecorded: boolean;
  profileUpdated: boolean;
  tuningApplied: boolean;
  supportLevelAdjustment: string;
  learnerFriendlyAcknowledgement: string;
  privacyMetadata: LearnerPreferenceResponseMetadata;
  createdAt: string;
}

export interface RecommendationInteractionRecord {
  interactionId: string;
  schoolId: string;
  tutorLearnerId: string;
  studentId?: string;
  sessionId?: string;
  recommendationId?: string;
  recommendationType?: string;
  interactionType: RecommendationInteractionType;
  subject?: string;
  topic?: string;
  skillTag?: string;
  safeReasonCode?: string;
  createdAt: string;
}

export interface AdaptiveRecommendationProfile {
  preferredSupportLevel: LearnerSupportLevel;
  preferredStepSize: LearnerStepSizePreference;
  practiceModePreference: LearnerPracticeModePreference;
  challengeReadinessSignal: 'low' | 'medium' | 'high';
  foundationReviewPreference: 'low' | 'medium' | 'high';
  hintFrequencySignal: 'low' | 'medium' | 'high';
  difficultyCalibration: number;
  recentSignalSummary: string;
  lastUpdatedAt: string;
  privacyMetadata: LearnerPreferenceResponseMetadata;
}

export interface AdaptiveRecommendationTuningInput {
  feedbackType: LearnerPreferenceFeedbackType;
  profile: AdaptiveRecommendationProfile;
  recentTooHardCount: number;
  recentTooEasyCount: number;
  recentConfusionCount: number;
  recentChallengeRequestCount: number;
  recentTeacherHelpRequestCount: number;
  recentSkipCount: number;
  masteryEvidenceLevel?: string;
}

export interface AdaptiveRecommendationTuningResult {
  supportLevelAdjustment: string;
  difficultyAdjustment: string;
  stepSizeAdjustment: string;
  recommendationBiases: string[];
  reasonCodes: string[];
  confidence: number;
  safetyConstraintsApplied: string[];
  nextRecommendationConstraints: string[];
}

export interface RecommendationWeightingPolicyInput {
  masteryEvidence?: { level: string; confidence: number };
  revisionDueState?: { dueCount: number; urgentCount: number };
  spacedReviewDueState?: { dueCount: number };
  recommendationType?: string;
  learnerPreferenceProfile: AdaptiveRecommendationProfile;
  recentInteractionPatterns: string[];
  safetyBoundaries: string[];
  deenSensitivity?: boolean;
  safeguardingBoundary?: boolean;
}

export interface RecommendationWeightingPolicyDecision {
  priorityOverride: number | null;
  supportLevelOverride: string | null;
  difficultyAdjustment: string;
  stepSizeAdjustment: string;
  challengeEligible: boolean;
  skipAllowed: boolean;
  teacherHelpSuggested: boolean;
  foundationReviewBias: number;
  similarPracticeBias: number;
  reasonCodes: string[];
  safetyApplied: string[];
}

export interface ClosedLoopPersonalizationRequest {
  feedback: LearnerPreferenceFeedbackRequest;
  identity: ResolvedTutorIdentity;
  recommendationId: string;
  interactionType?: RecommendationInteractionType;
  sessionId?: string;
  subject?: string;
  topic?: string;
  skillTag?: string;
}

export interface ClosedLoopPersonalizationResult {
  feedbackAccepted: boolean;
  safeFeedbackType: LearnerPreferenceFeedbackType;
  profileUpdated: boolean;
  tuningApplied: boolean;
  nextRecommendationPreview?: string | null;
  learnerFriendlyAcknowledgement: string;
  privacyMetadata: LearnerPreferenceResponseMetadata;
  auditRecord?: PersonalizationAuditRecord;
  createdAt: string;
}

export interface LearnerChoicePolicyDecision {
  skipAllowed: boolean;
  skipReason?: string;
  challengeAllowed: boolean;
  challengeWarning?: string;
  foundationReviewAllowed: boolean;
  teacherHelpAllowed: boolean;
  hintAllowed: boolean;
  notNowAllowed: boolean;
  deenSensitiveHandled: boolean;
  safeguardingBoundaryApplied: boolean;
}

export interface PreferenceFeedbackSafetyDecision {
  safe: boolean;
  sanitizedFeedback: string;
  feedbackType: LearnerPreferenceFeedbackType;
  safetyFlags: string[];
  redactionApplied: boolean;
  redactionReasons: string[];
  blockedReason?: string;
}

export interface PersonalizationAuditRecord {
  actorId: string;
  actorRole: string;
  schoolId: string;
  tutorLearnerId: string;
  sessionId?: string;
  recommendationId: string;
  feedbackType: string;
  interactionType?: string;
  tuningReasonCodes: string[];
  privacyDecision: string;
  deenSensitivityHandled: boolean;
  safeguardingBoundaryApplied: boolean;
  createdAt: string;
  requestId: string;
}

export interface LearnerPreferenceResponseMetadata {
  rawChatExcluded: boolean;
  rawPromptExcluded: boolean;
  privateMemoryExcluded: boolean;
  teacherOnlyNotesExcluded: boolean;
  safeguardingBoundaryApplied: boolean;
  deenSensitivityHandled: boolean;
}

export const LEARNER_PREFERENCE_FEEDBACK_TYPES: readonly LearnerPreferenceFeedbackType[] = [
  'too_easy', 'too_hard', 'just_right', 'still_confused', 'understood',
  'not_helpful', 'helpful', 'want_hint', 'want_foundation_review',
  'want_similar_practice', 'want_challenge', 'want_teacher_help',
  'not_now', 'shorter_steps', 'more_examples', 'slower_pace', 'faster_pace',
];

export const RECOMMENDATION_INTERACTION_TYPES: readonly RecommendationInteractionType[] = [
  'recommendation_shown', 'recommendation_started', 'recommendation_completed',
  'recommendation_skipped', 'agency_option_selected', 'feedback_submitted',
  'hint_requested', 'teacher_help_requested', 'challenge_requested',
  'foundation_review_requested',
];

export const SUPPORT_LEVELS: readonly LearnerSupportLevel[] = [
  'minimal_support', 'light_support', 'guided_support',
  'step_by_step_support', 'foundation_rebuild', 'teacher_support_recommended',
];

const SHAME_PATTERNS: RegExp[] = [
  /you are weak/i, /you are bad at this/i, /you failed/i,
  /you are behind everyone/i, /you are slow/i, /you are lazy/i,
  /you are not trying/i, /you are failing/i, /you are stupid/i,
  /wrong again/i, /still wrong/i,
];

const FINAL_ANSWER_PATTERNS: RegExp[] = [
  /the (correct|right) answer is/i, /answer is \d+/i,
  /solution is/i, /here is the (answer|solution)/i,
  /the answer key/i, /final answer/i, /^answer: /i,
];

const RAW_DATA_PATTERNS: RegExp[] = [
  /raw chat/i, /raw prompt/i, /system prompt/i, /model draft/i,
  /provider response/i, /internal scoring/i, /private memory/i,
  /teacher\.?only\.?note/i, /safeguarding detail/i, /safeguarding signal/i,
  /risk score/i, /chain\.?of\.?thought/i, /internal\.?reason/i, /ai\.?reason/i,
];

const PROMPT_INJECTION_PATTERNS: RegExp[] = [
  /ignore (all |)previous/i, /ignore all instructions/i,
  /you are now/i, /forget your (policy|instruction)/i,
  /override/i, /system prompt/i, /you must not/i,
];

const SAFEGUARDING_CONCERN_PATTERNS: RegExp[] = [
  /(hurt|harm|kill) (myself|yourself|themselves)/i,
  /want to (die|end it)/i, /suicid/i,
  /self.?harm/i, /abuse/i, /grooming/i,
  /someone is (hurting|abusing)/i, /i am being (abused|hurt)/i,
];

const DEEN_SENSITIVE_PATTERNS: RegExp[] = [
  /i (doubt|question) (allah|islam|quran|prophet)/i,
  /islam is (wrong|false|bad)/i,
  /i (hate|dislike) (islam|prayer|quran)/i,
  /give me a (fatwa|ruling)/i,
  /is it (haram|halal) to/i,
];

export function containsShameLanguage(text: string): boolean {
  return SHAME_PATTERNS.some((p) => p.test(text));
}

export function containsFinalAnswerPattern(text: string): boolean {
  return FINAL_ANSWER_PATTERNS.some((p) => p.test(text));
}

export function containsRawDataPattern(text: string): boolean {
  return RAW_DATA_PATTERNS.some((p) => p.test(text));
}

export function containsPromptInjection(text: string): boolean {
  return PROMPT_INJECTION_PATTERNS.some((p) => p.test(text));
}

export function containsSafeguardingConcern(text: string): boolean {
  return SAFEGUARDING_CONCERN_PATTERNS.some((p) => p.test(text));
}

export function containsDeenSensitiveText(text: string): boolean {
  return DEEN_SENSITIVE_PATTERNS.some((p) => p.test(text));
}
