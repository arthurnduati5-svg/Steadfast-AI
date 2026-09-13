export const GROWTH_ACTION_INTENTS = [
  'continue_learning',
  'review_weak_topic',
  'repair_mistake',
  'revise_due_item',
  'start_recall_check',
  'start_teach_back',
  'start_focus_repair',
  'start_exam_review',
  'start_quiz_check',
  'view_mastery_pathway',
  'explain_why_this_next',
  'teacher_support_needed',
  'safe_content_gap',
  'safe_deen_referral',
  'no_action_available',
] as const;

export type GrowthActionIntent = typeof GROWTH_ACTION_INTENTS[number];

export const GROWTH_ACTION_TYPES = [
  'open_revision_mode',
  'start_revision_mode',
  'start_quiz_mode',
  'start_teach_back_mode',
  'start_focus_mode',
  'start_exam_mode',
  'continue_current_learning_mode',
  'open_mastery_pathway',
  'open_weak_topics',
  'open_academic_memory',
  'recommend_teacher_support',
  'safe_content_gap_referral',
  'safe_deen_referral',
  'blocked_answer_key_request',
  'blocked_model_answer_request',
  'blocked_unsafe_request',
] as const;

export type GrowthActionType = typeof GROWTH_ACTION_TYPES[number];

export const GROWTH_ACTION_DESTINATIONS = [
  'revision',
  'quiz',
  'teach_back',
  'focus',
  'exam',
  'learning_profile',
  'mastery_pathway',
  'weak_topics',
  'academic_memory',
  'teacher_support',
  'content_gap_referral',
  'deen_referral',
  'none',
] as const;

export type GrowthActionDestination = typeof GROWTH_ACTION_DESTINATIONS[number];

export const GROWTH_ACTION_EXECUTION_STATUSES = [
  'pending',
  'resolved',
  'executing',
  'executed',
  'failed',
  'blocked',
  'cancelled',
] as const;

export type GrowthActionExecutionStatus = typeof GROWTH_ACTION_EXECUTION_STATUSES[number];

export const GROWTH_ACTION_PRIORITY_BUCKETS = [
  'none',
  'low',
  'medium',
  'high',
  'urgent_learning',
  'teacher_review',
  'blocked',
] as const;

export type GrowthActionPriorityBucket = typeof GROWTH_ACTION_PRIORITY_BUCKETS[number];

export const GROWTH_ACTION_CONFIDENCE_BUCKETS = [
  'no_data_yet',
  'low',
  'medium',
  'high',
  'very_high',
] as const;

export type GrowthActionConfidenceBucket = typeof GROWTH_ACTION_CONFIDENCE_BUCKETS[number];

export const GROWTH_ACTION_ROUTING_DECISIONS = [
  'allowed',
  'blocked_cross_school',
  'blocked_missing_learner',
  'blocked_missing_content',
  'blocked_deen_sensitive',
  'blocked_answer_key_request',
  'blocked_model_answer_request',
  'blocked_unsafe_request',
  'blocked_no_evidence',
  'blocked_missing_identity',
] as const;

export type GrowthActionRoutingDecision = typeof GROWTH_ACTION_ROUTING_DECISIONS[number];

export const GROWTH_ACTION_WHY_THIS_NEXT_CODES = [
  'due_revision_item',
  'weak_topic_detected',
  'mistake_pattern_detected',
  'low_mastery',
  'partial_mastery',
  'strong_mastery_ready_for_challenge',
  'high_hint_dependency',
  'repeated_stuck_signal',
  'recovery_after_struggle',
  'quiz_recall_needed',
  'teach_back_explanation_needed',
  'focus_deep_repair_needed',
  'exam_review_needed',
  'spaced_review_due',
  'teacher_assigned_priority',
  'student_choice_requested',
  'content_gap_detected',
  'deen_uncertainty_detected',
  'answer_key_request_blocked',
  'model_answer_request_blocked',
  'unsafe_request_blocked',
  'insufficient_evidence',
] as const;

export type GrowthActionWhyThisNextCode = typeof GROWTH_ACTION_WHY_THIS_NEXT_CODES[number];

export const GROWTH_ACTION_EVENT_TYPES = [
  'growth_action_resolved',
  'growth_action_routed',
  'growth_action_executed',
  'growth_action_blocked',
  'growth_action_failed',
  'why_this_next_generated',
] as const;

export type GrowthActionEventType = typeof GROWTH_ACTION_EVENT_TYPES[number];

export const GROWTH_ACTION_SOURCE_SURFACES = [
  'growth_panel',
  'next_step_panel',
  'why_this_next_panel',
  'learning_dashboard',
  'revision_queue',
  'mode_exit',
  'session_resume',
  'teacher_assignment',
  'admin_diagnostics',
  'system_internal',
  'api_direct',
] as const;

export type GrowthActionSourceSurface = typeof GROWTH_ACTION_SOURCE_SURFACES[number];

export const GROWTH_ACTION_REASON_CODES = [
  'school_identity_verified',
  'student_ownership_confirmed',
  'role_access_allowed',
  'content_available',
  'content_gap',
  'deen_uncertainty',
  'answer_key_detected',
  'model_answer_detected',
  'unsafe_request_detected',
  'insufficient_evidence',
  'cross_school_blocked',
  'missing_learner_context',
  'missing_school_context',
  'evidence_stale',
  'evidence_fresh',
  'mode_available',
  'mode_unavailable',
  'teacher_assignment_scope',
] as const;

export type GrowthActionReasonCode = typeof GROWTH_ACTION_REASON_CODES[number];

export const FORBIDDEN_GROWTH_ACTION_FIELDS = [
  'rawText',
  'rawMessage',
  'studentMessage',
  'messageBody',
  'rawNote',
  'noteText',
  'revisionText',
  'savedText',
  'questionText',
  'promptText',
  'answerText',
  'studentAnswer',
  'rawAnswer',
  'studentExplanation',
  'rawExplanation',
  'explanationText',
  'aiResponse',
  'prompt',
  'providerResponse',
  'answerKey',
  'markingScheme',
  'modelAnswer',
  'correctAnswer',
  'expectedAnswer',
  'teacherOnlyNote',
  'safeguardingRawDetail',
  'deenSensitivePrivateText',
  'privateDisclosure',
  'rawConversation',
  'rawTranscript',
  'transcript',
  'audioBlob',
  'audioUrl',
  'recordingUrl',
  'token',
  'apiKey',
  'authorization',
  'cookie',
  'privateKey',
  'databaseUrl',
  'connectionString',
] as const;

export type ForbiddenGrowthActionField = typeof FORBIDDEN_GROWTH_ACTION_FIELDS[number];

export interface GrowthActionResolveRequest {
  schoolId: string;
  studentId: string;
  tutorLearnerId?: string;
  conversationId?: string;
  modeSessionId?: string;
  sourceSurface?: GrowthActionSourceSurface;
  requestedIntent?: GrowthActionIntent;
  requestedDestination?: GrowthActionDestination;
  targetType?: string;
  targetRef?: string;
  approvedContentRef?: string;
  contentFingerprint?: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  [key: string]: unknown;
}

export interface GrowthActionExecuteRequest extends GrowthActionResolveRequest {
  execute: true;
  replaceExisting?: boolean;
}

export interface GrowthWhyThisNextRequest {
  schoolId: string;
  studentId: string;
  tutorLearnerId?: string;
  growthActionPlanId?: string;
  conversationId?: string;
  modeSessionId?: string;
  targetType?: string;
  targetRef?: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  [key: string]: unknown;
}

export interface GrowthActionPlan {
  id: string;
  schoolId: string;
  studentId: string;
  tutorLearnerId?: string;
  conversationId?: string;
  modeSessionId?: string;
  growthIntent: GrowthActionIntent;
  growthActionType: GrowthActionType;
  recommendedDestination: GrowthActionDestination;
  recommendedMode?: string;
  recommendedRoute?: string;
  targetType?: string;
  targetRef?: string;
  approvedContentRef?: string;
  contentFingerprint?: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  priorityBucket: GrowthActionPriorityBucket;
  confidenceBucket: GrowthActionConfidenceBucket;
  routingDecision: GrowthActionRoutingDecision;
  whyThisNextCode: GrowthActionWhyThisNextCode;
  executionStatus: GrowthActionExecutionStatus;
  safeReasonCodes: string[];
  safeEvidenceRefs: string[];
  createdAt: string;
  updatedAt: string;
  executedAt?: string;
  cancelledAt?: string;
}

export interface GrowthActionRouteEvent {
  id: string;
  schoolId: string;
  studentId: string;
  tutorLearnerId?: string;
  growthActionPlanId?: string;
  eventType: GrowthActionEventType;
  sourceSurface?: string;
  growthIntent: GrowthActionIntent;
  resolvedDestination: GrowthActionDestination;
  executedDestination?: GrowthActionDestination;
  executionStatus: GrowthActionExecutionStatus;
  failureReasonCode?: string;
  safeMetadata: Record<string, unknown>;
  safeEvidenceRefs: string[];
  createdAt: string;
}

export interface GrowthWhyThisNextDecision {
  id: string;
  schoolId: string;
  studentId: string;
  tutorLearnerId?: string;
  growthActionPlanId?: string;
  conversationId?: string;
  modeSessionId?: string;
  whyThisNextCode: GrowthActionWhyThisNextCode;
  priorityBucket: GrowthActionPriorityBucket;
  confidenceBucket: GrowthActionConfidenceBucket;
  studentSafeReason: string;
  teacherSafeReason?: string;
  evidenceSummary: Record<string, unknown>;
  safeReasonCodes: string[];
  safeEvidenceRefs: string[];
  createdAt: string;
}

export interface GrowthLearnerEvidenceSnapshot {
  studentId: string;
  schoolId: string;
  weakTopicSignals: WeakTopicSignal[];
  mistakeSignals: MistakeSignal[];
  masterySignals: MasterySignal[];
  supportSignals: SupportSignal[];
  revisionSignals: RevisionSignal[];
  modeSummarySignals: ModeSummarySignal[];
  contentAvailability: ContentAvailability;
  deenSensitivity: DeenSensitivity;
  stateQuality: 'no_data_yet' | 'partial' | 'sufficient' | 'rich';
  safeEvidenceRefs: string[];
  safeReasonCodes: string[];
}

export interface WeakTopicSignal {
  topicId?: string;
  topicName?: string;
  weaknessScore?: number;
  lastStruggledAt?: string;
}

export interface MistakeSignal {
  patternKey?: string;
  label?: string;
  recurrenceScore?: number;
  lastSeenAt?: string;
}

export interface MasterySignal {
  subjectId?: string;
  topicId?: string;
  level?: string;
  confidenceScore?: number;
}

export interface SupportSignal {
  supportNeed?: string;
  urgency?: string;
}

export interface RevisionSignal {
  itemId?: string;
  dueAt?: string;
  priority?: string;
}

export interface ModeSummarySignal {
  mode: string;
  exitReason?: string;
  masterySignal?: string;
  readinessSignal?: string;
}

export interface ContentAvailability {
  available: boolean;
  gapDetected: boolean;
}

export interface DeenSensitivity {
  detected: boolean;
  uncertain: boolean;
}

export interface GrowthModeRecommendation {
  recommendedMode: string;
  recommendedDestination: GrowthActionDestination;
  confidence: GrowthActionConfidenceBucket;
  reasonCodes: string[];
}

export interface GrowthActionResolverResult {
  actionPlan: GrowthActionPlan;
  whyThisNextDecision: GrowthWhyThisNextDecision;
  routingDecision: GrowthActionRoutingDecision;
  recommendedDestination: GrowthActionDestination;
  recommendedMode?: string;
  safeEvidenceRefs: string[];
  safeReasonCodes: string[];
}

export interface GrowthActionExecutionResult {
  success: boolean;
  executionStatus: GrowthActionExecutionStatus;
  actionPlanId: string;
  modeSessionId?: string;
  failureReasonCode?: string;
  safeMetadata: Record<string, unknown>;
}

export interface GrowthActionStateResponse {
  ok: boolean;
  actionPlan?: GrowthActionPlan;
  whyThisNextDecision?: GrowthWhyThisNextDecision;
  routeEvent?: GrowthActionRouteEvent;
  executionResult?: GrowthActionExecutionResult;
  safeEvidenceRefs: string[];
  safeReasonCodes: string[];
}

export interface GrowthActionSafeErrorResponse {
  ok: false;
  code: string;
  message: string;
  safeReasonCodes: string[];
  safeEvidenceRefs: string[];
}
