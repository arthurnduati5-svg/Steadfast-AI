export const PHASE3_PARENT_ROLES = [
  'parent',
  'guardian',
  'authorized_family_contact',
  'teacher',
  'admin',
  'internal',
] as const;

export type Phase3ParentRole = typeof PHASE3_PARENT_ROLES[number];

export const PHASE3_PARENT_LINK_STATUSES = [
  'active',
  'pending_verification',
  'revoked',
  'expired',
  'blocked',
  'not_linked',
] as const;

export type Phase3ParentLinkStatus = typeof PHASE3_PARENT_LINK_STATUSES[number];

export const PHASE3_PARENT_VISIBILITY_LEVELS = [
  'none',
  'summary_only',
  'support_actions_only',
  'summary_and_support',
  'teacher_mediated_only',
  'blocked',
] as const;

export type Phase3ParentVisibilityLevel = typeof PHASE3_PARENT_VISIBILITY_LEVELS[number];

export const PHASE3_PARENT_SUMMARY_TYPES = [
  'weekly_progress',
  'daily_support',
  'objective_progress',
  'study_plan_progress',
  'revision_support',
  'confidence_recovery_support',
  'teacher_requested_support',
  'source_required_notice',
  'empty_state',
  'blocked',
] as const;

export type Phase3ParentSummaryType = typeof PHASE3_PARENT_SUMMARY_TYPES[number];

export const PHASE3_PARENT_NOTIFICATION_TYPES = [
  'weekly_progress_summary',
  'daily_support_nudge',
  'missed_study_plan_step',
  'revision_due_support',
  'repeated_weak_topic_support',
  'confidence_recovery_support',
  'positive_growth_update',
  'teacher_requested_support',
  'source_required_notice',
  'teacher_support_needed',
  'empty_state',
  'blocked',
] as const;

export type Phase3ParentNotificationType = typeof PHASE3_PARENT_NOTIFICATION_TYPES[number];

export const PHASE3_PARENT_NOTIFICATION_STATUSES = [
  'not_needed',
  'queued',
  'ready_for_review',
  'teacher_mediated',
  'blocked_by_visibility',
  'blocked_by_source_truth',
  'blocked_by_safeguarding',
  'blocked_by_deen_boundary',
  'blocked_by_missing_parent_link',
  'sent_externally_not_supported',
  'completed',
] as const;

export type Phase3ParentNotificationStatus = typeof PHASE3_PARENT_NOTIFICATION_STATUSES[number];

export const PHASE3_PARENT_SUPPORT_ACTIONS = [
  'ask_child_to_explain',
  'encourage_short_revision',
  'support_study_plan_time',
  'remind_revision_due',
  'ask_teacher_for_source',
  'ask_teacher_for_support',
  'celebrate_effort',
  'review_teacher_note',
  'no_action_needed',
] as const;

export type Phase3ParentSupportAction = typeof PHASE3_PARENT_SUPPORT_ACTIONS[number];

export const PHASE3_PARENT_SUPPORT_SOURCE_TYPES = [
  'objective_mastery',
  'daily_objective_check',
  'daily_learning_feed',
  'study_plan',
  'growth_page',
  'living_revision',
  'confidence_recovery',
  'safe_learning_evidence',
  'teacher_safe_insight',
  'parent_visibility_guard',
  'parent_notification_policy',
] as const;

export type Phase3ParentSupportSourceType = typeof PHASE3_PARENT_SUPPORT_SOURCE_TYPES[number];

export const PHASE3_PARENT_SUPPORT_SIGNAL_TYPES = [
  'objective_progress',
  'objective_needs_support',
  'daily_check_completed',
  'daily_check_missed',
  'daily_feed_due',
  'study_plan_due',
  'study_plan_missed',
  'revision_due',
  'weak_topic_repeated',
  'mistake_pattern_repeated',
  'confidence_recovery_needed',
  'micro_mastery_growth',
  'teacher_support_needed',
  'source_required',
  'positive_growth',
  'empty_state',
  'blocked',
] as const;

export type Phase3ParentSupportSignalType = typeof PHASE3_PARENT_SUPPORT_SIGNAL_TYPES[number];

export const PHASE3_PARENT_SUPPORT_PRIORITIES = [
  'low',
  'medium',
  'high',
  'urgent',
  'blocked',
] as const;

export type Phase3ParentSupportPriority = typeof PHASE3_PARENT_SUPPORT_PRIORITIES[number];

export const PHASE3_PARENT_SUPPORT_AUDIT_EVENTS = [
  'parent_link_verified',
  'parent_link_blocked',
  'parent_visibility_checked',
  'parent_safe_summary_created',
  'parent_safe_summary_viewed',
  'parent_notification_decision_created',
  'parent_notification_card_created',
  'parent_notification_preference_updated',
  'teacher_parent_support_overview_viewed',
  'parent_support_source_required_returned',
  'parent_support_teacher_support_returned',
  'parent_support_safeguarding_block_returned',
  'parent_support_empty_state_returned',
] as const;

export type Phase3ParentSupportAuditEventType = typeof PHASE3_PARENT_SUPPORT_AUDIT_EVENTS[number];

export const PHASE3_PARENT_SUPPORT_FORBIDDEN_FIELDS = [
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
  'safeguardingCaseNote',
  'safeguardingDisclosure',
  'deenSensitiveRaw',
  'privateDeenText',
  'authorization',
  'cookie',
  'apiKey',
  'token',
  'DATABASE_URL',
  'REDIS_URL',
  'connectionString',
  'privateKey',
  'riskScore',
  'diagnosis',
  'pietyScore',
  'leaderboardRank',
  'classmateComparison',
  'peerPrivateContent',
] as const;

export type Phase3ParentForbiddenField = typeof PHASE3_PARENT_SUPPORT_FORBIDDEN_FIELDS[number];

export interface Phase3ParentSupportContext {
  schoolId: string;
  parentId?: string;
  studentId?: string;
  teacherId?: string;
  classId?: string;
  subjectId?: string;
  role: Phase3ParentRole;
  requestId?: string;
}

export interface Phase3ParentLearnerLink {
  linkId: string;
  schoolId: string;
  parentId: string;
  studentId: string;
  linkStatus: Phase3ParentLinkStatus;
  visibilityLevel: Phase3ParentVisibilityLevel;
  linkedAt: string;
  updatedAt: string;
  expiresAt?: string;
  revokedAt?: string;
  blockedReason?: string;
  safeReasonCodes: string[];
}

export interface Phase3ParentVisibilityDecision {
  decisionId: string;
  schoolId: string;
  parentId: string;
  studentId: string;
  visibilityLevel: Phase3ParentVisibilityLevel;
  linkStatus: Phase3ParentLinkStatus;
  sourceTruthStatus?: string;
  isDeenSensitive?: boolean;
  isSafeguardingSeparated?: boolean;
  safeSummary: string;
  safeReasonCodes: string[];
  createdAt: string;
}

export interface Phase3ParentSafeSummarySection {
  sectionId: string;
  sectionType: string;
  safeTitle: string;
  safeSummary: string;
  priority: Phase3ParentSupportPriority;
  sourceType: Phase3ParentSupportSourceType;
  signalType: Phase3ParentSupportSignalType;
  safeReasonCodes: string[];
  safeEvidenceRefs: string[];
  sourceTruthStatus?: string;
}

export interface Phase3ParentSupportSuggestion {
  suggestionId: string;
  supportAction: Phase3ParentSupportAction;
  safeTitle: string;
  safeSummary: string;
  priority: Phase3ParentSupportPriority;
  sourceType: Phase3ParentSupportSourceType;
  safeReasonCodes: string[];
  safeEvidenceRefs: string[];
  sourceTruthStatus?: string;
}

export interface Phase3ParentSafeProgressSummary {
  summaryId: string;
  schoolId: string;
  studentId: string;
  parentId: string;
  generatedAt: string;
  summaryType: Phase3ParentSummaryType;
  safeHeadline: string;
  safeSummary: string;
  sections: Phase3ParentSafeSummarySection[];
  supportSuggestions: Phase3ParentSupportSuggestion[];
  notificationDecisions: string[];
  safeEvidenceRefs: string[];
  safeReasonCodes: string[];
  visibilityDecisionId?: string;
}

export interface Phase3ParentNotificationPreference {
  preferenceId: string;
  parentId: string;
  studentId: string;
  schoolId: string;
  enabledNotificationTypes: Phase3ParentNotificationType[];
  quietHoursStart?: string;
  quietHoursEnd?: string;
  frequencyPreference: string;
  languagePreference?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Phase3ParentNotificationDecision {
  decisionId: string;
  schoolId: string;
  studentId: string;
  parentId: string;
  notificationType: Phase3ParentNotificationType;
  notificationStatus: Phase3ParentNotificationStatus;
  priority: Phase3ParentSupportPriority;
  safeTitle: string;
  safeSummary: string;
  supportAction: Phase3ParentSupportAction;
  sourceTruthStatus?: string;
  visibilityLevel: Phase3ParentVisibilityLevel;
  safeEvidenceRefs: string[];
  safeReasonCodes: string[];
  createdAt: string;
}

export interface Phase3ParentNotificationCard {
  cardId: string;
  decisionId: string;
  schoolId: string;
  studentId: string;
  parentId: string;
  notificationType: Phase3ParentNotificationType;
  notificationStatus: Phase3ParentNotificationStatus;
  priority: Phase3ParentSupportPriority;
  safeTitle: string;
  safeSummary: string;
  supportAction: Phase3ParentSupportAction;
  safeEvidenceRefs: string[];
  safeReasonCodes: string[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface Phase3ParentSupportSafeEvidenceRef {
  refId: string;
  sourceType: Phase3ParentSupportSourceType;
  safeLabel: string;
  safeSummary: string;
  sourceTruthStatus: string;
  safeReasonCodes: string[];
}

export interface Phase3ParentSupportSourceTruth {
  sourceTruthId: string;
  sourceType: Phase3ParentSupportSourceType;
  status: string;
  isActionable: boolean;
  requiresTeacherMediation: boolean;
  requiresApprovedSource: boolean;
  safeReasonCodes: string[];
}

export interface Phase3ParentSupportLearnerSignal {
  signalId: string;
  schoolId: string;
  studentId: string;
  sourceType: Phase3ParentSupportSourceType;
  signalType: Phase3ParentSupportSignalType;
  priority: Phase3ParentSupportPriority;
  safeTitle: string;
  safeSummary: string;
  safeEvidenceRefs: string[];
  safeReasonCodes: string[];
  sourceTruthStatus: string;
  requiresTeacherMediation: boolean;
  isDeenSensitive: boolean;
  isSafeguardingSeparated: boolean;
  createdAt: string;
}

export interface Phase3ParentSupportTeacherOverview {
  schoolId: string;
  teacherId: string;
  classId?: string;
  subjectId?: string;
  generatedAt: string;
  totalLearnersWithParentSupport: number;
  totalActiveParentLinks: number;
  totalParentSummaries: number;
  totalNotificationCards: number;
  totalSourceRequired: number;
  totalTeacherMediated: number;
  totalBlockedBySafeguarding: number;
  learnerRows: Phase3ParentSupportTeacherLearnerRow[];
  safeSummary: string;
  recommendedTeacherActions: Phase3ParentSupportAction[];
}

export interface Phase3ParentSupportTeacherLearnerRow {
  studentId: string;
  activeParentLinkCount: number;
  summaryCount: number;
  notificationCardCount: number;
  sourceRequiredCount: number;
  teacherMediatedCount: number;
  blockedBySafeguardingCount: number;
  safePatternSummary: string;
  recommendedTeacherAction: Phase3ParentSupportAction;
  safeEvidenceRefs: string[];
}

export interface Phase3ParentSupportAuditEvent {
  eventId: string;
  schoolId: string;
  actorId: string;
  actorRole: Phase3ParentRole;
  studentId?: string;
  parentId?: string;
  teacherId?: string;
  classId?: string;
  summaryId?: string;
  notificationDecisionId?: string;
  notificationCardId?: string;
  visibilityDecisionId?: string;
  eventType: Phase3ParentSupportAuditEventType;
  safeReasonCodes: string[];
  safeEvidenceRefs: string[];
  createdAt: string;
}

export interface Phase3ParentSupportQuery {
  schoolId: string;
  parentId: string;
  studentId?: string;
  classId?: string;
  subjectId?: string;
  limit?: number;
  offset?: number;
}

export interface Phase3ParentSupportTeacherQuery {
  schoolId: string;
  teacherId: string;
  classId?: string;
  subjectId?: string;
  studentId?: string;
  limit?: number;
  offset?: number;
}
