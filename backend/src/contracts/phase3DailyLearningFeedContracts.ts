export const PHASE3_DAILY_LEARNING_FEED_ITEM_TYPES = [
  'objective_check',
  'objective_recheck',
  'objective_rescue',
  'teacher_support',
  'source_required',
  'completed_today',
  'continue_check',
  'confidence_followup',
  'teach_back_required',
  'transfer_check_required',
  'delayed_recall_required',
  'review_ready',
] as const;

export type Phase3DailyLearningFeedItemType = typeof PHASE3_DAILY_LEARNING_FEED_ITEM_TYPES[number];

export const PHASE3_DAILY_LEARNING_FEED_PRIORITIES = [
  'low',
  'medium',
  'high',
  'urgent',
  'blocked',
] as const;

export type Phase3DailyLearningFeedPriority = typeof PHASE3_DAILY_LEARNING_FEED_PRIORITIES[number];

export const PHASE3_DAILY_LEARNING_FEED_ACTIONS = [
  'start_daily_objective_check',
  'continue_daily_objective_check',
  'record_confidence_before',
  'record_confidence_after',
  'complete_teach_back',
  'complete_transfer_check',
  'complete_delayed_recall',
  'review_completed_objective',
  'ask_teacher_for_source',
  'ask_teacher_for_help',
  'no_action_needed',
] as const;

export type Phase3DailyLearningFeedAction = typeof PHASE3_DAILY_LEARNING_FEED_ACTIONS[number];

export const PHASE3_DAILY_LEARNING_FEED_REASON_CODES = [
  'pending_daily_seed',
  'in_progress_check',
  'awaiting_confidence_before',
  'awaiting_confidence_after',
  'awaiting_teach_back',
  'awaiting_transfer_check',
  'awaiting_delayed_recall',
  'completed_today',
  'needs_rescue_mastery',
  'needs_teacher_support',
  'source_required_status',
  'content_gap_status',
  'blocked_status',
  'unknown_source_status',
  'almost_there_needs_recheck',
  'getting_better_needs_recheck',
  'confident_review_due',
  'overdue_seed',
  'repeated_needs_recheck',
  'deen_source_required',
  'safeguarding_boundary',
  'school_identity_boundary',
  'privacy_boundary',
] as const;

export type Phase3DailyLearningFeedReasonCode = typeof PHASE3_DAILY_LEARNING_FEED_REASON_CODES[number];

export const PHASE3_DAILY_LEARNING_FEED_AUDIT_EVENT_TYPES = [
  'daily_learning_feed_viewed',
  'daily_learning_feed_item_ranked',
  'daily_learning_feed_source_required_item_created',
  'daily_learning_feed_teacher_overview_viewed',
  'daily_learning_feed_empty_state_returned',
  'daily_learning_feed_blocked_item_returned',
] as const;

export type Phase3DailyLearningFeedAuditEventType = typeof PHASE3_DAILY_LEARNING_FEED_AUDIT_EVENT_TYPES[number];

export const PHASE3_DAILY_LEARNING_FEED_FORBIDDEN_FIELDS = [
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
  'DATABASE_URL',
  'REDIS_URL',
  'connectionString',
  'privateKey',
] as const;

export type Phase3DailyLearningFeedForbiddenField = typeof PHASE3_DAILY_LEARNING_FEED_FORBIDDEN_FIELDS[number];

export const PHASE3_DAILY_LEARNING_FEED_DEDUPE_ORDER: Phase3DailyLearningFeedItemType[] = [
  'source_required',
  'teacher_support',
  'objective_rescue',
  'continue_check',
  'teach_back_required',
  'transfer_check_required',
  'delayed_recall_required',
  'confidence_followup',
  'objective_recheck',
  'objective_check',
  'review_ready',
  'completed_today',
];

export interface Phase3DailyLearningFeedItem {
  feedItemId: string;
  schoolId: string;
  studentId: string;
  classId?: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  objectiveId: string;
  dailySeedId?: string;
  checkSessionId?: string;
  itemType: Phase3DailyLearningFeedItemType;
  priority: Phase3DailyLearningFeedPriority;
  title: string;
  safeDescription: string;
  learnerSafeReason: string;
  teacherSafeReason?: string;
  nextAction: Phase3DailyLearningFeedAction;
  modeDestination?: string;
  masteryStatus?: string;
  checkStatus?: string;
  sourceTruthStatus: string;
  dueAt?: string;
  estimatedTimeMinutes?: number;
  safeEvidenceRefs: string[];
  safeReasonCodes: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Phase3DailyLearningFeed {
  schoolId: string;
  studentId: string;
  generatedAt: string;
  items: Phase3DailyLearningFeedItem[];
  blockedItems: Phase3DailyLearningFeedItem[];
  completedToday: Phase3DailyLearningFeedItem[];
  summary: Phase3DailyLearningFeedLearnerSummary;
  counts: Phase3DailyLearningFeedCounts;
  safeEvidenceRefs: string[];
}

export interface Phase3DailyLearningFeedLearnerSummary {
  totalItems: number;
  actionableCount: number;
  blockedCount: number;
  completedTodayCount: number;
  urgentCount: number;
  estimatedTotalMinutes: number;
  safeMessage: string;
  nextBestAction?: string;
}

export interface Phase3DailyLearningFeedCounts {
  objectiveCheck: number;
  objectiveRecheck: number;
  objectiveRescue: number;
  teacherSupport: number;
  sourceRequired: number;
  completedToday: number;
  continueCheck: number;
  confidenceFollowup: number;
  teachBackRequired: number;
  transferCheckRequired: number;
  delayedRecallRequired: number;
  reviewReady: number;
}

export interface Phase3DailyLearningFeedTeacherOverview {
  schoolId: string;
  teacherId: string;
  classId?: string;
  subjectId?: string;
  generatedAt: string;
  totalLearnersWithItems: number;
  totalActionableItems: number;
  totalSourceRequiredItems: number;
  totalTeacherSupportItems: number;
  totalRescueItems: number;
  totalCompletedTodayItems: number;
  objectiveRows: Phase3DailyLearningFeedObjectiveRow[];
  safeSummary: string;
  recommendedTeacherActions: string[];
}

export interface Phase3DailyLearningFeedObjectiveRow {
  objectiveId: string;
  classId?: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  title: string;
  pendingCheckCount: number;
  inProgressCheckCount: number;
  needsRecheckCount: number;
  needsRescueCount: number;
  teacherSupportCount: number;
  sourceRequiredCount: number;
  completedTodayCount: number;
  safePatternSummary: string;
  recommendedTeacherAction: string;
  safeEvidenceRefs: string[];
}

export interface Phase3DailyLearningFeedAuditEvent {
  eventId: string;
  schoolId: string;
  actorId: string;
  actorRole: string;
  studentId?: string;
  teacherId?: string;
  classId?: string;
  objectiveId?: string;
  feedItemId?: string;
  eventType: Phase3DailyLearningFeedAuditEventType;
  safeReasonCodes: string[];
  safeEvidenceRefs: string[];
  createdAt: string;
}

export interface Phase3DailyLearningFeedQuery {
  schoolId: string;
  studentId?: string;
  classId?: string;
  subjectId?: string;
  includeCompleted?: boolean;
  limit?: number;
}

export interface Phase3DailyLearningFeedTeacherOverviewQuery {
  schoolId: string;
  teacherId: string;
  classId?: string;
  subjectId?: string;
  role: string;
}
