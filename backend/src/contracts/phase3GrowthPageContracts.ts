export const PHASE3_GROWTH_PAGE_CARD_TYPES = [
  'due_now',
  'weak_topic_lane',
  'mistake_pattern',
  'recently_improving',
  'study_plan_due',
  'daily_feed_item',
  'objective_progress',
  'what_helps_me_learn_best',
  'source_required',
  'teacher_support_needed',
  'empty_state',
] as const;

export type Phase3GrowthPageCardType = typeof PHASE3_GROWTH_PAGE_CARD_TYPES[number];

export const PHASE3_GROWTH_PAGE_PRIORITIES = [
  'low',
  'medium',
  'high',
  'urgent',
  'blocked',
] as const;

export type Phase3GrowthPagePriority = typeof PHASE3_GROWTH_PAGE_PRIORITIES[number];

export const PHASE3_GROWTH_PAGE_ACTIONS = [
  'start_daily_objective_check',
  'continue_daily_objective_check',
  'open_study_plan',
  'start_study_plan_step',
  'open_focus_mode',
  'open_quiz_mode',
  'open_teach_back_mode',
  'open_revision_mode',
  'review_mistake_pattern',
  'review_weak_topic',
  'ask_teacher_for_help',
  'ask_teacher_for_source',
  'view_progress_explanation',
  'no_action_needed',
] as const;

export type Phase3GrowthPageAction = typeof PHASE3_GROWTH_PAGE_ACTIONS[number];

export const PHASE3_GROWTH_PAGE_SOURCE_TYPES = [
  'objective_mastery',
  'daily_objective_check',
  'daily_learning_feed',
  'study_plan',
  'safe_learning_evidence',
  'growth_action',
  'teacher_safe_insight',
  'learner_transparency',
  'revision_due_adapter',
  'confidence_event_adapter',
  'micro_mastery_adapter',
] as const;

export type Phase3GrowthPageSourceType = typeof PHASE3_GROWTH_PAGE_SOURCE_TYPES[number];

export const PHASE3_GROWTH_PAGE_SIGNAL_TYPES = [
  'objective_not_started',
  'objective_still_learning',
  'objective_getting_better',
  'objective_almost_there',
  'objective_confident',
  'objective_needs_rescue',
  'objective_needs_teacher_support',
  'daily_check_pending',
  'daily_check_in_progress',
  'daily_check_needs_recheck',
  'daily_check_completed',
  'study_plan_due',
  'study_plan_blocked',
  'study_plan_completed',
  'mistake_pattern_repeated',
  'weak_topic_repeated',
  'source_required',
  'teacher_support_required',
  'recent_improvement',
  'learning_help_pattern_detected',
] as const;

export type Phase3GrowthPageSignalType = typeof PHASE3_GROWTH_PAGE_SIGNAL_TYPES[number];

export const PHASE3_WEAK_TOPIC_LANE_STATUSES = [
  'watch',
  'practice_next',
  'needs_recheck',
  'needs_rescue',
  'needs_teacher_support',
  'source_required',
  'stabilizing',
  'improving',
] as const;

export type Phase3WeakTopicLaneStatus = typeof PHASE3_WEAK_TOPIC_LANE_STATUSES[number];

export const PHASE3_MISTAKE_PATTERN_TYPES = [
  'recall_gap',
  'concept_confusion',
  'procedure_step_error',
  'careless_slip',
  'explanation_gap',
  'transfer_gap',
  'delayed_recall_gap',
  'confidence_mismatch',
  'high_hint_dependency',
  'source_context_gap',
] as const;

export type Phase3MistakePatternType = typeof PHASE3_MISTAKE_PATTERN_TYPES[number];

export const PHASE3_LEARNING_HELP_PATTERN_TYPES = [
  'short_recall_helps',
  'teach_back_helps',
  'worked_step_helps',
  'visual_example_helps',
  'slower_pacing_helps',
  'revision_revisit_helps',
  'practice_variation_helps',
  'teacher_support_helps',
  'source_confirmation_helps',
] as const;

export type Phase3LearningHelpPatternType = typeof PHASE3_LEARNING_HELP_PATTERN_TYPES[number];

export const PHASE3_GROWTH_PAGE_AUDIT_EVENTS = [
  'growth_page_viewed',
  'growth_page_card_ranked',
  'due_now_item_created',
  'due_now_item_completed',
  'weak_topic_lane_created',
  'weak_topic_lane_updated',
  'mistake_journal_entry_created',
  'what_helps_me_learn_best_updated',
  'growth_page_teacher_overview_viewed',
  'growth_page_source_required_returned',
  'growth_page_teacher_support_returned',
  'growth_page_empty_state_returned',
] as const;

export type Phase3GrowthPageAuditEventType = typeof PHASE3_GROWTH_PAGE_AUDIT_EVENTS[number];

export const PHASE3_GROWTH_PAGE_FORBIDDEN_FIELDS = [
  'rawChat',
  'rawMessage',
  'rawAnswer',
  'rawStudentAnswer',
  'rawExplanation',
  'rawPrompt',
  'rawResponse',
  'providerPrompt',
  'providerResponse',
  'rawProviderResponse',
  'chainOfThought',
  'hiddenReasoning',
  'scratchpad',
  'answerKey',
  'correctAnswer',
  'modelAnswer',
  'markingScheme',
  'teacherOnlyNotes',
  'safeguardingRaw',
  'deenSensitiveRaw',
  'authorization',
  'cookie',
  'apiKey',
  'token',
  'DATABASE_URL',
  'REDIS_URL',
  'connectionString',
  'privateKey',
] as const;

export type Phase3GrowthPageForbiddenField = typeof PHASE3_GROWTH_PAGE_FORBIDDEN_FIELDS[number];

export interface Phase3GrowthPageContext {
  schoolId: string;
  studentId?: string;
  teacherId?: string;
  classId?: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  role?: string;
}

export interface Phase3DueNowItem {
  dueNowItemId: string;
  schoolId: string;
  studentId: string;
  sourceType: Phase3GrowthPageSourceType;
  signalType: Phase3GrowthPageSignalType;
  priority: Phase3GrowthPagePriority;
  safeTitle: string;
  safeSummary: string;
  recommendedAction: Phase3GrowthPageAction;
  objectiveId?: string;
  topicId?: string;
  skillId?: string;
  studyPlanId?: string;
  studyPlanStepId?: string;
  actionPayload?: Record<string, string>;
  isCompleted: boolean;
  safeEvidenceRefs: string[];
  safeReasonCodes: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Phase3WeakTopicLane {
  laneId: string;
  schoolId: string;
  studentId: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  objectiveIds: string[];
  status: Phase3WeakTopicLaneStatus;
  safeTitle: string;
  safeSummary: string;
  recommendedAction: Phase3GrowthPageAction;
  priority: Phase3GrowthPagePriority;
  safeEvidenceRefs: string[];
  safeReasonCodes: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Phase3MistakeJournalEntry {
  mistakeEntryId: string;
  schoolId: string;
  studentId: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  objectiveId?: string;
  patternType: Phase3MistakePatternType;
  safeTitle: string;
  learnerSafeSummary: string;
  teacherSafeSummary?: string;
  recommendedAction: Phase3GrowthPageAction;
  priority: Phase3GrowthPagePriority;
  occurrenceCount: number;
  lastSeenAt: string;
  safeEvidenceRefs: string[];
  safeReasonCodes: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Phase3MistakeJournalReadModel {
  schoolId: string;
  studentId: string;
  entries: Phase3MistakeJournalEntry[];
  summary: string;
  totalPatterns: number;
}

export interface Phase3WhatHelpsMeLearnBestProfile {
  profileId: string;
  schoolId: string;
  studentId: string;
  topPatterns: Phase3LearningHelpPatternType[];
  supportActions: string[];
  safeSummary: string;
  confidenceLevel: string;
  safeEvidenceRefs: string[];
  safeReasonCodes: string[];
  updatedAt: string;
}

export interface Phase3GrowthPageCard {
  cardId: string;
  cardType: Phase3GrowthPageCardType;
  priority: Phase3GrowthPagePriority;
  safeTitle: string;
  safeSummary: string;
  recommendedAction: Phase3GrowthPageAction;
  sourceType: Phase3GrowthPageSourceType;
  signalType: Phase3GrowthPageSignalType;
  objectiveId?: string;
  topicId?: string;
  skillId?: string;
  dueNowItemId?: string;
  laneId?: string;
  mistakeEntryId?: string;
  studyPlanId?: string;
  actionPayload?: Record<string, string>;
  safeEvidenceRefs: string[];
  safeReasonCodes: string[];
  createdAt: string;
}

export interface Phase3GrowthPageSummary {
  totalCards: number;
  dueNowCount: number;
  weakTopicLaneCount: number;
  mistakePatternCount: number;
  recentlyImprovingCount: number;
  sourceRequiredCount: number;
  teacherSupportCount: number;
  safeHeadline: string;
}

export interface Phase3GrowthPage {
  schoolId: string;
  studentId: string;
  generatedAt: string;
  summary: Phase3GrowthPageSummary;
  dueNow: Phase3DueNowItem[];
  weakTopicLanes: Phase3WeakTopicLane[];
  mistakeJournal: Phase3MistakeJournalReadModel;
  whatHelpsMeLearnBest?: Phase3WhatHelpsMeLearnBestProfile;
  recentlyImproving: Phase3GrowthPageCard[];
  cards: Phase3GrowthPageCard[];
  safeEvidenceRefs: string[];
  safeReasonCodes: string[];
  payloadSource: 'live_safe_evidence' | 'empty_safe' | 'demo_fallback';
}

export interface Phase3GrowthPageEvidenceAdapterInput {
  schoolId: string;
  studentId: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  requesterSchoolId?: string;
  requesterStudentId?: string;
}

export interface Phase3GrowthPageEvidenceAdapterResult {
  evidenceRefs: string[];
  reasonCodes: string[];
  hasRecentEvidence: boolean;
  evidenceSummary: string;
  sourceTruthStatus: string;
  signalCounts: Record<string, number>;
  lastSignalAt?: string;
}

export interface Phase3GrowthPageDailyFeedAdapterResult {
  feedCards: Phase3GrowthPageCard[];
  dueNowItems: Phase3DueNowItem[];
  sourceRequiredCards: Phase3GrowthPageCard[];
  teacherSupportCards: Phase3GrowthPageCard[];
}

export interface Phase3GrowthPageStudyPlanAdapterResult {
  planCards: Phase3GrowthPageCard[];
  dueNowItems: Phase3DueNowItem[];
  blockedCards: Phase3GrowthPageCard[];
  summary: string;
}

export interface Phase3GrowthPageLearnerView {
  schoolId: string;
  studentId: string;
  generatedAt: string;
  safeHeadline: string;
  safeSummary: string;
  dueNow: Phase3DueNowItem[];
  weakTopicLanes: Phase3WeakTopicLane[];
  mistakeJournal: Phase3MistakeJournalReadModel;
  whatHelpsMeLearnBest?: Phase3WhatHelpsMeLearnBestProfile;
  recentlyImproving: Phase3GrowthPageCard[];
  cards: Phase3GrowthPageCard[];
  safeEvidenceRefs: string[];
  safeReasonCodes: string[];
  payloadSource: 'live_safe_evidence' | 'empty_safe' | 'demo_fallback';
}

export interface Phase3GrowthPageTeacherLearnerRow {
  studentId: string;
  dueNowCount: number;
  weakTopicLaneCount: number;
  mistakePatternCount: number;
  teacherSupportNeeded: number;
  sourceRequiredCount: number;
  safePatternSummary: string;
  recommendedTeacherAction: string;
  safeEvidenceRefs: string[];
}

export interface Phase3GrowthPageTeacherTopicRow {
  topicId: string;
  skillId?: string;
  objectiveIds: string[];
  learnersAffectedCount: number;
  weakTopicCount: number;
  mistakePatternCount: number;
  teacherSupportCount: number;
  sourceRequiredCount: number;
  safePatternSummary: string;
  recommendedTeacherAction: string;
  safeEvidenceRefs: string[];
}

export interface Phase3GrowthPageTeacherOverview {
  schoolId: string;
  teacherId: string;
  classId?: string;
  subjectId?: string;
  generatedAt: string;
  totalLearnersWithGrowthSignals: number;
  totalDueNowItems: number;
  totalWeakTopicLanes: number;
  totalMistakePatterns: number;
  totalTeacherSupportNeeded: number;
  totalSourceRequired: number;
  learnerRows: Phase3GrowthPageTeacherLearnerRow[];
  topicRows: Phase3GrowthPageTeacherTopicRow[];
  safeSummary: string;
  recommendedTeacherActions: string[];
}

export interface Phase3GrowthPageAuditEvent {
  eventId: string;
  schoolId: string;
  actorId: string;
  actorRole: string;
  studentId?: string;
  teacherId?: string;
  classId?: string;
  cardId?: string;
  objectiveId?: string;
  topicId?: string;
  skillId?: string;
  eventType: Phase3GrowthPageAuditEventType;
  safeReasonCodes: string[];
  safeEvidenceRefs: string[];
  createdAt: string;
}

export interface Phase3GrowthPageQuery {
  schoolId: string;
  studentId: string;
  subjectId?: string;
  classId?: string;
}

export interface Phase3GrowthPageTeacherQuery {
  schoolId: string;
  teacherId: string;
  classId?: string;
  subjectId?: string;
  role: string;
}
