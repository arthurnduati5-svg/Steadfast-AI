export type LearnerRecommendationType =
  | 'revision_due'
  | 'foundation_review'
  | 'similar_practice'
  | 'challenge_practice'
  | 'mastery_check'
  | 'mistake_pattern_review'
  | 'spaced_review'
  | 'teacher_help_suggested'
  | 'deen_teacher_referral'
  | 'continue_current_session';

export type LearnerReasonCode =
  | 'repeated_mistake_urgent'
  | 'overdue_spaced_review'
  | 'low_mastery_foundation'
  | 'developing_skill'
  | 'mistake_pattern_detected'
  | 'secure_mastery_ready'
  | 'growth_observed_next_step'
  | 'recent_struggle_suggest_help'
  | 'source_sensitive_deen_referral'
  | 'current_session_continuation'
  | 'revision_due_skill'
  | 'no_evidence_yet';

export type LearnerRecommendationPriority = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface LearnerRecommendationReasonPolicy {
  recommendationType: LearnerRecommendationType;
  priority: LearnerRecommendationPriority;
  reasonCode: LearnerReasonCode;
  shortReason: string;
  studentFriendlyTemplate: string;
  skillConnectionTemplate: string;
  growthConnectionTemplate: string;
  whatToDoFirstTemplate: string;
  whatHappensNextTemplate: string;
  confidenceLabel: string;
}

export interface LearnerAgencyOption {
  optionId: string;
  optionType: string;
  label: string;
  studentFriendlyDescription: string;
  recommended: boolean;
  available: boolean;
  unavailableReason?: string;
  safetyNotes?: string;
}

export interface LearnerSafeEvidenceCard {
  evidenceId: string;
  subject: string;
  topic: string;
  skillLabel: string;
  safeLearningSignal: string;
  recentTrend: 'improving' | 'stable' | 'needs_attention' | 'unknown';
  masteryLabel: string;
  revisionStatus: 'due' | 'upcoming' | 'current' | 'none';
  createdAt: string;
  confidenceLabel: string;
}

export interface LearnerPrivacyVisibilitySummary {
  studentVisibleExplanation: string;
  teacherVisibleSummaryExplanation: string;
  privateConversationBoundary: string;
  safeguardingExceptionExplanation: string;
  dataUseSummary: string;
  teacherSafe: boolean;
  rawChatExcluded: boolean;
  privateMemoryExcluded: boolean;
  safeguardingBoundaryApplied: boolean;
  deenSensitiveHandled: boolean;
  redactionApplied: boolean;
  redactionReasons: string[];
}

export interface LearnerAgencyOptionsPayload {
  options: LearnerAgencyOption[];
  bestRecommendedOptionId: string;
}

export interface LearnerRecommendationExplanation {
  recommendationId: string;
  recommendationType: LearnerRecommendationType;
  subject: string;
  topic: string;
  skillLabel: string;
  shortReason: string;
  studentFriendlyExplanation: string;
  skillConnection: string;
  growthConnection: string;
  whatToDoFirst: string;
  whatHappensNext: string;
  safeEvidenceCards: LearnerSafeEvidenceCard[];
  agencyOptions: LearnerAgencyOption[];
  privacyVisibility: LearnerPrivacyVisibilitySummary;
  confidence: string;
  generatedAt: string;
  metadata: LearnerRecommendationResponseMetadata;
}

export interface LearnerRecommendationResponseMetadata {
  teacherSafe: boolean;
  rawChatExcluded: boolean;
  privateMemoryExcluded: boolean;
  safeguardingBoundaryApplied: boolean;
  deenSensitiveHandled: boolean;
  redactionApplied: boolean;
  redactionReasons: string[];
}

export interface LearnerProgressNarrative {
  narrativeType: 'what_improved' | 'what_to_review' | 'why_this_is_next' | 'how_to_succeed' | 'ready_for_challenge' | 'privacy_visibility';
  title: string;
  narrative: string;
  safeEvidenceCards: LearnerSafeEvidenceCard[];
  generatedAt: string;
}

export interface LearnerRecommendationAuditRecord {
  actorId: string;
  actorRole: 'learner';
  schoolId: string;
  tutorLearnerId: string;
  sessionId?: string;
  recommendationType: LearnerRecommendationType;
  reasonCodes: LearnerReasonCode[];
  safeEvidenceRefs: string[];
  privacyDecision: string;
  deenSensitivityHandled: boolean;
  safeguardingBoundaryApplied: boolean;
  generatedAt: string;
  requestId: string;
}

export interface LearnerExplanationSafetyDecision {
  safe: boolean;
  redactionApplied: boolean;
  redactionReasons: string[];
  blockedReason?: string;
  sanitizedPayload?: Record<string, unknown>;
}

export interface LearnerRecommendationRequestContext {
  schoolId: string;
  studentId: string;
  userId: string;
  role: string;
  subject?: string;
  topic?: string;
  sessionId?: string;
  mode?: 'practice' | 'revision' | 'challenge' | 'continue';
}

export interface LearnerNextRecommendationRequest {
  subject?: string;
  topic?: string;
  sessionId?: string;
  mode?: 'practice' | 'revision' | 'challenge' | 'continue';
}

export interface LearnerRecommendationPreference {
  optionId: string;
  feedback: 'too_easy' | 'too_hard' | 'want_hint' | 'want_challenge' | 'want_foundation_review' | 'want_teacher_help' | 'not_now';
  recommendationId?: string;
}

const RECOMMENDATION_TYPE_PRIORITY: Record<LearnerRecommendationType, LearnerRecommendationPriority> = {
  revision_due: 1,
  foundation_review: 3,
  similar_practice: 5,
  challenge_practice: 7,
  mastery_check: 4,
  mistake_pattern_review: 2,
  spaced_review: 2,
  teacher_help_suggested: 6,
  deen_teacher_referral: 8,
  continue_current_session: 4,
};

const RECOMMENDATION_REASON_POLICY: Record<LearnerRecommendationType, LearnerRecommendationReasonPolicy> = {
  revision_due: {
    recommendationType: 'revision_due',
    priority: 1,
    reasonCode: 'revision_due_skill',
    shortReason: 'Revision is due for this skill',
    studentFriendlyTemplate: 'This skill needs a little more practice to strengthen your foundation.',
    skillConnectionTemplate: 'Practicing this will help you build confidence in {skillLabel}.',
    growthConnectionTemplate: 'Reviewing now helps what you have learned stay fresh and strong.',
    whatToDoFirstTemplate: 'Try one step: review what you remember about this topic first.',
    whatHappensNextTemplate: 'After this review, the system will check whether the skill is getting stronger.',
    confidenceLabel: 'based on your learning evidence',
  },
  foundation_review: {
    recommendationType: 'foundation_review',
    priority: 3,
    reasonCode: 'low_mastery_foundation',
    shortReason: 'Building a stronger foundation',
    studentFriendlyTemplate: 'You are building a foundation for this step. Some more practice will help it feel more natural.',
    skillConnectionTemplate: 'This strengthens your understanding of {skillLabel}.',
    growthConnectionTemplate: 'Laying a solid foundation now makes future topics easier.',
    whatToDoFirstTemplate: 'Start with a simple example to warm up.',
    whatHappensNextTemplate: 'As you improve, the system will offer slightly more challenging practice.',
    confidenceLabel: 'based on your recent practice',
  },
  similar_practice: {
    recommendationType: 'similar_practice',
    priority: 5,
    reasonCode: 'developing_skill',
    shortReason: 'Practice with a similar example',
    studentFriendlyTemplate: 'You are making progress. A similar problem will help confirm your understanding.',
    skillConnectionTemplate: 'This checks whether you can apply {skillLabel} in a slightly different way.',
    growthConnectionTemplate: 'Applying a skill more than once builds lasting understanding.',
    whatToDoFirstTemplate: 'Read the problem and decide which approach to use.',
    whatHappensNextTemplate: 'After this, the system will check if you are ready to move forward.',
    confidenceLabel: 'based on your learning progress',
  },
  challenge_practice: {
    recommendationType: 'challenge_practice',
    priority: 7,
    reasonCode: 'secure_mastery_ready',
    shortReason: 'Ready for a small challenge',
    studentFriendlyTemplate: 'Challenge time — you have been doing well with this skill. Try a slightly harder problem.',
    skillConnectionTemplate: 'This stretches your ability with {skillLabel} a little further.',
    growthConnectionTemplate: 'Challenges help turn good understanding into deep mastery.',
    whatToDoFirstTemplate: 'Try one step first: what approach feels right for this problem?',
    whatHappensNextTemplate: 'A challenge helps the system see how strong your understanding really is.',
    confidenceLabel: 'based on strong evidence of progress',
  },
  mastery_check: {
    recommendationType: 'mastery_check',
    priority: 4,
    reasonCode: 'developing_skill',
    shortReason: 'Checking your understanding',
    studentFriendlyTemplate: 'This checks whether you can use the skill confidently without hints.',
    skillConnectionTemplate: 'This helps confirm how well you know {skillLabel}.',
    growthConnectionTemplate: 'Knowing where you stand helps plan the best next step.',
    whatToDoFirstTemplate: 'Try explaining the first idea in your own words.',
    whatHappensNextTemplate: 'The system will know which skills are strong and which need more attention.',
    confidenceLabel: 'based on your learning evidence',
  },
  mistake_pattern_review: {
    recommendationType: 'mistake_pattern_review',
    priority: 2,
    reasonCode: 'mistake_pattern_detected',
    shortReason: 'Review a common pattern',
    studentFriendlyTemplate: 'A pattern has appeared in your recent work. Reviewing this will help.',
    skillConnectionTemplate: 'This helps you strengthen {skillLabel} by addressing a specific area.',
    growthConnectionTemplate: 'Working on patterns turns occasional mistakes into learning progress.',
    whatToDoFirstTemplate: 'Look at the pattern and try one corrected step.',
    whatHappensNextTemplate: 'After reviewing, the system will see if the pattern improves.',
    confidenceLabel: 'based on your learning patterns',
  },
  spaced_review: {
    recommendationType: 'spaced_review',
    priority: 2,
    reasonCode: 'overdue_spaced_review',
    shortReason: 'Time for a review',
    studentFriendlyTemplate: 'It has been a while since you practiced this. A quick review will help.',
    skillConnectionTemplate: 'This refreshes your knowledge of {skillLabel}.',
    growthConnectionTemplate: 'Regular review helps move learning into long-term memory.',
    whatToDoFirstTemplate: 'Start by recalling what you remember about this topic.',
    whatHappensNextTemplate: 'After review, the system will adjust the next review time.',
    confidenceLabel: 'based on spaced review schedule',
  },
  teacher_help_suggested: {
    recommendationType: 'teacher_help_suggested',
    priority: 6,
    reasonCode: 'recent_struggle_suggest_help',
    shortReason: 'Teacher support may help',
    studentFriendlyTemplate: 'This topic has been challenging. Your teacher can offer helpful guidance.',
    skillConnectionTemplate: 'Your teacher can help with {skillLabel} in a way that fits your learning style.',
    growthConnectionTemplate: 'Getting support when you need it is a smart way to keep growing.',
    whatToDoFirstTemplate: 'Tell your teacher which part feels trickiest.',
    whatHappensNextTemplate: 'Your teacher can recommend the best approach for you.',
    confidenceLabel: 'based on learning patterns',
  },
  deen_teacher_referral: {
    recommendationType: 'deen_teacher_referral',
    priority: 8,
    reasonCode: 'source_sensitive_deen_referral',
    shortReason: 'Guidance from your teacher',
    studentFriendlyTemplate: 'This topic may need guidance from your teacher because it is source-sensitive.',
    skillConnectionTemplate: 'Your teacher can provide the right guidance for this topic.',
    growthConnectionTemplate: 'Some topics benefit from guided support with a trusted teacher.',
    whatToDoFirstTemplate: 'Ask your teacher about this topic for the best guidance.',
    whatHappensNextTemplate: 'Your teacher can help you continue learning safely.',
    confidenceLabel: 'source-sensitive topic',
  },
  continue_current_session: {
    recommendationType: 'continue_current_session',
    priority: 4,
    reasonCode: 'current_session_continuation',
    shortReason: 'Continue your current work',
    studentFriendlyTemplate: 'You were making progress. Continue where you left off.',
    skillConnectionTemplate: 'This continues building your understanding of {skillLabel}.',
    growthConnectionTemplate: 'Steady progress leads to strong learning.',
    whatToDoFirstTemplate: 'Review where you left off and continue.',
    whatHappensNextTemplate: 'After this session, the system will recommend the next best step.',
    confidenceLabel: 'based on your current session',
  },
};

export function getRecommendationPriority(type: LearnerRecommendationType): LearnerRecommendationPriority {
  return RECOMMENDATION_TYPE_PRIORITY[type];
}

export function getRecommendationReasonPolicy(type: LearnerRecommendationType): LearnerRecommendationReasonPolicy {
  return RECOMMENDATION_REASON_POLICY[type];
}

export function getAllRecommendationReasonPolicies(): Record<LearnerRecommendationType, LearnerRecommendationReasonPolicy> {
  return { ...RECOMMENDATION_REASON_POLICY };
}

const SHAME_PATTERNS: RegExp[] = [
  /you are weak/i,
  /you are bad at this/i,
  /you failed/i,
  /you are behind everyone/i,
  /you are slow/i,
  /you are lazy/i,
  /your teacher is worried about you/i,
  /you are not trying/i,
  /you are failing/i,
  /you are stupid/i,
  /wrong again/i,
  /still wrong/i,
];

const FINAL_ANSWER_PATTERNS: RegExp[] = [
  /the (correct|right) answer is/i,
  /answer is \d+/i,
  /solution is/i,
  /here is the (answer|solution)/i,
  /the answer key/i,
  /final answer/i,
  /^answer: /i,
];

const RAW_DATA_PATTERNS: RegExp[] = [
  /raw chat/i,
  /raw prompt/i,
  /system prompt/i,
  /model draft/i,
  /provider response/i,
  /internal scoring/i,
  /private memory/i,
  /teacher.only.note/i,
  /safeguarding detail/i,
  /safeguarding signal/i,
  /risk score/i,
  /risk classifier/i,
  /chain.of.thought/i,
  /internal.reason/i,
  /ai.reason/i,
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
