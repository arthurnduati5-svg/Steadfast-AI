export const PHASE3_PEER_GROUP_TYPES = [
  'class_group',
  'teacher_group',
  'subject_group',
  'topic_group',
  'revision_group',
  'challenge_group',
  'school_guided_group',
] as const;
export type Phase3PeerGroupType = typeof PHASE3_PEER_GROUP_TYPES[number];

export const PHASE3_PEER_GROUP_STATUSES = [
  'active',
  'paused',
  'teacher_review_required',
  'archived',
  'blocked',
] as const;
export type Phase3PeerGroupStatus = typeof PHASE3_PEER_GROUP_STATUSES[number];

export const PHASE3_PEER_CONTENT_TYPES = [
  'resource_share',
  'revision_tip',
  'study_tip',
  'topic_question',
  'peer_highlight',
  'healthy_challenge',
  'teacher_prompt',
  'source_required_notice',
  'blocked',
] as const;
export type Phase3PeerContentType = typeof PHASE3_PEER_CONTENT_TYPES[number];

export const PHASE3_PEER_CONTENT_STATUSES = [
  'draft',
  'submitted_for_review',
  'approved',
  'rejected',
  'needs_teacher_review',
  'source_required',
  'blocked',
  'archived',
] as const;
export type Phase3PeerContentStatus = typeof PHASE3_PEER_CONTENT_STATUSES[number];

export const PHASE3_PEER_MODERATION_STATUSES = [
  'not_required',
  'pending_review',
  'approved',
  'rejected',
  'source_required',
  'teacher_mediated',
  'blocked_by_safeguarding',
  'blocked_by_deen_boundary',
  'blocked_by_answer_artifact',
  'blocked_by_raw_content',
  'blocked_by_peer_privacy',
  'blocked',
] as const;
export type Phase3PeerModerationStatus = typeof PHASE3_PEER_MODERATION_STATUSES[number];

export const PHASE3_PEER_VISIBILITY_LEVELS = [
  'private_to_author',
  'teacher_only',
  'group_visible',
  'class_visible',
  'school_guided_visible',
  'blocked',
] as const;
export type Phase3PeerVisibilityLevel = typeof PHASE3_PEER_VISIBILITY_LEVELS[number];

export const PHASE3_PEER_RESOURCE_TYPES = [
  'teacher_approved_resource',
  'school_approved_resource',
  'learner_created_visible_resource',
  'revision_prompt',
  'study_tip',
  'source_required_notice',
  'blocked',
] as const;
export type Phase3PeerResourceType = typeof PHASE3_PEER_RESOURCE_TYPES[number];

export const PHASE3_PEER_HIGHLIGHT_TYPES = [
  'effort_highlight',
  'revision_highlight',
  'practice_streak_highlight',
  'teach_back_highlight',
  'collaboration_highlight',
  'positive_growth_highlight',
  'teacher_selected_highlight',
  'blocked',
] as const;
export type Phase3PeerHighlightType = typeof PHASE3_PEER_HIGHLIGHT_TYPES[number];

export const PHASE3_HEALTHY_CHALLENGE_TYPES = [
  'revision_minutes',
  'daily_check_completion',
  'teach_back_practice',
  'resource_review',
  'weak_topic_revisit',
  'study_plan_follow_through',
  'class_effort_goal',
  'teacher_created_challenge',
] as const;
export type Phase3HealthyChallengeType = typeof PHASE3_HEALTHY_CHALLENGE_TYPES[number];

export const PHASE3_HEALTHY_CHALLENGE_STATUSES = [
  'draft',
  'active',
  'paused',
  'completed',
  'archived',
  'blocked',
] as const;
export type Phase3HealthyChallengeStatus = typeof PHASE3_HEALTHY_CHALLENGE_STATUSES[number];

export const PHASE3_PEER_LEARNING_ACTIONS = [
  'share_resource_for_review',
  'approve_resource',
  'reject_resource',
  'open_approved_resource',
  'share_highlight_for_review',
  'approve_highlight',
  'reject_highlight',
  'join_healthy_challenge',
  'complete_challenge_step',
  'open_revision_prompt',
  'open_study_plan_step',
  'open_daily_check',
  'ask_teacher_for_source',
  'ask_teacher_for_moderation',
  'no_action_needed',
] as const;
export type Phase3PeerLearningAction = typeof PHASE3_PEER_LEARNING_ACTIONS[number];

export const PHASE3_PEER_LEARNING_SOURCE_TYPES = [
  'objective_mastery',
  'daily_objective_check',
  'daily_learning_feed',
  'study_plan',
  'growth_page',
  'living_revision',
  'confidence_recovery',
  'parent_support_boundary',
  'safe_learning_evidence',
  'teacher_safe_insight',
  'peer_resource_share',
  'peer_highlight',
  'healthy_challenge',
  'teacher_moderation',
] as const;
export type Phase3PeerLearningSourceType = typeof PHASE3_PEER_LEARNING_SOURCE_TYPES[number];

export const PHASE3_PEER_LEARNING_SIGNAL_TYPES = [
  'resource_shared',
  'resource_approved',
  'resource_rejected',
  'highlight_shared',
  'highlight_approved',
  'highlight_rejected',
  'healthy_challenge_joined',
  'healthy_challenge_step_completed',
  'teacher_review_needed',
  'source_required',
  'peer_privacy_blocked',
  'answer_artifact_blocked',
  'raw_content_blocked',
  'safeguarding_blocked',
  'deen_boundary_blocked',
  'positive_peer_learning',
  'blocked',
] as const;
export type Phase3PeerLearningSignalType = typeof PHASE3_PEER_LEARNING_SIGNAL_TYPES[number];

export const PHASE3_PEER_LEARNING_PRIORITIES = [
  'low',
  'medium',
  'high',
  'urgent',
  'blocked',
] as const;
export type Phase3PeerLearningPriority = typeof PHASE3_PEER_LEARNING_PRIORITIES[number];

export const PHASE3_PEER_LEARNING_AUDIT_EVENTS = [
  'peer_group_created',
  'peer_group_membership_added',
  'peer_visibility_checked',
  'peer_resource_submitted',
  'peer_resource_reviewed',
  'peer_resource_approved',
  'peer_resource_rejected',
  'peer_highlight_submitted',
  'peer_highlight_reviewed',
  'peer_highlight_approved',
  'peer_highlight_rejected',
  'healthy_challenge_created',
  'healthy_challenge_joined',
  'healthy_challenge_step_completed',
  'teacher_peer_overview_viewed',
  'peer_learning_source_required_returned',
  'peer_learning_safeguarding_block_returned',
  'peer_learning_deen_boundary_returned',
  'peer_learning_answer_artifact_block_returned',
  'peer_learning_empty_state_returned',
] as const;
export type Phase3PeerLearningAuditEventType = typeof PHASE3_PEER_LEARNING_AUDIT_EVENTS[number];

export const PHASE3_PEER_LEARNING_FORBIDDEN_FIELDS = [
  'rawChat',
  'rawMessage',
  'rawAnswer',
  'rawStudentAnswer',
  'rawExplanation',
  'rawPrompt',
  'rawResponse',
  'rawStudentWork',
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
  'studentRanking',
  'popularityScore',
  'followerCount',
  'likeCount',
  'privateDm',
  'privateMessage',
  'parentOnlyContent',
  'peerPrivateContent',
] as const;
export type Phase3PeerLearningForbiddenField = typeof PHASE3_PEER_LEARNING_FORBIDDEN_FIELDS[number];

export interface Phase3PeerLearningContext {
  schoolId: string;
  teacherId?: string;
  studentId?: string;
  classId?: string;
  subjectId?: string;
  topicId?: string;
  groupId?: string;
  role?: string;
}

export interface Phase3PeerGroup {
  groupId: string;
  schoolId: string;
  teacherId?: string;
  classId?: string;
  subjectId?: string;
  groupType: Phase3PeerGroupType;
  groupStatus: Phase3PeerGroupStatus;
  safeTitle: string;
  safeSummary: string;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Phase3PeerGroupMembership {
  membershipId: string;
  groupId: string;
  schoolId: string;
  studentId: string;
  teacherId?: string;
  role: string;
  joinedAt: string;
  updatedAt: string;
}

export interface Phase3PeerVisibilityDecision {
  decisionId: string;
  schoolId: string;
  contentId?: string;
  groupId?: string;
  studentId?: string;
  teacherId?: string;
  visibilityLevel: Phase3PeerVisibilityLevel;
  moderationStatus?: Phase3PeerModerationStatus;
  safeSummary: string;
  safeReasonCodes: string[];
  createdAt: string;
}

export interface Phase3PeerModerationDecision {
  decisionId: string;
  schoolId: string;
  contentId?: string;
  groupId?: string;
  moderatorId?: string;
  moderatorRole: string;
  moderationStatus: Phase3PeerModerationStatus;
  safeSummary: string;
  safeReasonCodes: string[];
  createdAt: string;
}

export interface Phase3PeerResourceShare {
  resourceId: string;
  schoolId: string;
  groupId?: string;
  studentId?: string;
  teacherId?: string;
  subjectId?: string;
  topicId?: string;
  objectiveId?: string;
  resourceType: Phase3PeerResourceType;
  contentStatus: Phase3PeerContentStatus;
  moderationStatus: Phase3PeerModerationStatus;
  visibilityLevel: Phase3PeerVisibilityLevel;
  safeTitle: string;
  safeSummary: string;
  safeContent: string;
  safeReasonCodes: string[];
  safeEvidenceRefs: string[];
  sourceTruthStatus: string;
  createdAt: string;
  updatedAt: string;
}

export interface Phase3PeerResourceReviewItem {
  reviewItemId: string;
  resourceId: string;
  schoolId: string;
  groupId?: string;
  studentId?: string;
  teacherId?: string;
  contentType: string;
  moderationStatus: Phase3PeerModerationStatus;
  safeTitle: string;
  safeSummary: string;
  safeReasonCodes: string[];
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface Phase3PeerHighlight {
  highlightId: string;
  schoolId: string;
  groupId?: string;
  studentId?: string;
  teacherId?: string;
  highlightType: Phase3PeerHighlightType;
  contentStatus: Phase3PeerContentStatus;
  moderationStatus: Phase3PeerModerationStatus;
  visibilityLevel: Phase3PeerVisibilityLevel;
  safeTitle: string;
  safeSummary: string;
  safeContent: string;
  safeReasonCodes: string[];
  safeEvidenceRefs: string[];
  sourceTruthStatus: string;
  createdAt: string;
  updatedAt: string;
}

export interface Phase3PeerHighlightReviewItem {
  reviewItemId: string;
  highlightId: string;
  schoolId: string;
  groupId?: string;
  studentId?: string;
  teacherId?: string;
  contentType: string;
  moderationStatus: Phase3PeerModerationStatus;
  safeTitle: string;
  safeSummary: string;
  safeReasonCodes: string[];
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface Phase3HealthyChallenge {
  challengeId: string;
  schoolId: string;
  groupId?: string;
  teacherId?: string;
  classId?: string;
  challengeType: Phase3HealthyChallengeType;
  challengeStatus: Phase3HealthyChallengeStatus;
  safeTitle: string;
  safeSummary: string;
  safeInstructions: string;
  safeEvidenceRefs: string[];
  sourceTruthStatus: string;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  completedAt?: string;
}

export interface Phase3HealthyChallengeParticipation {
  participationId: string;
  challengeId: string;
  schoolId: string;
  groupId?: string;
  studentId: string;
  stepsCompleted: number;
  totalSteps: number;
  safeEvidenceRefs: string[];
  joinedAt: string;
  completedAt?: string;
  updatedAt: string;
}

export interface Phase3PeerLearningSafeEvidenceRef {
  evidenceId: string;
  source: string;
  evidenceType: string;
  evidenceStrength: string;
  createdAt: string;
}

export interface Phase3PeerLearningSourceTruth {
  sourceTruthStatus: string;
  requiresApprovedDeenSource?: boolean;
  requiresApprovedSourceContext?: boolean;
}

export interface Phase3PeerLearningSignal {
  signalId: string;
  schoolId: string;
  studentId?: string;
  teacherId?: string;
  groupId?: string;
  sourceType: Phase3PeerLearningSourceType;
  signalType: Phase3PeerLearningSignalType;
  priority: Phase3PeerLearningPriority;
  safeSummary: string;
  safeReasonCodes: string[];
  safeEvidenceRefs: string[];
  createdAt: string;
}

export interface Phase3PeerLearningLearnerView {
  schoolId: string;
  studentId: string;
  groupId?: string;
  generatedAt: string;
  safeHeadline: string;
  safeSummary: string;
  approvedResources: Phase3PeerResourceShare[];
  approvedHighlights: Phase3PeerHighlight[];
  healthyChallenges: Phase3HealthyChallenge[];
  ownSubmissions: Phase3PeerResourceShare[];
  ownHighlights: Phase3PeerHighlight[];
  ownParticipations: Phase3HealthyChallengeParticipation[];
  safeEvidenceRefs: string[];
  safeReasonCodes: string[];
  visibilityDecision: Phase3PeerVisibilityDecision;
}

export interface Phase3PeerLearningTeacherOverview {
  schoolId: string;
  teacherId: string;
  classId?: string;
  subjectId?: string;
  generatedAt: string;
  totalPeerGroups: number;
  totalActivePeerGroups: number;
  totalResourcesPendingReview: number;
  totalHighlightsPendingReview: number;
  totalHealthyChallenges: number;
  totalSourceRequired: number;
  totalBlockedBySafeguarding: number;
  totalBlockedByAnswerArtifact: number;
  groupRows: Phase3PeerLearningTeacherGroupRow[];
  contentRows: Phase3PeerLearningTeacherContentRow[];
  safeSummary: string;
  recommendedTeacherActions: string[];
}

export interface Phase3PeerLearningTeacherGroupRow {
  groupId: string;
  groupType: Phase3PeerGroupType;
  groupStatus: Phase3PeerGroupStatus;
  memberCount: number;
  approvedResourceCount: number;
  approvedHighlightCount: number;
  healthyChallengeCount: number;
  pendingReviewCount: number;
  sourceRequiredCount: number;
  blockedCount: number;
  safePatternSummary: string;
  recommendedTeacherAction: string;
  safeEvidenceRefs: string[];
}

export interface Phase3PeerLearningTeacherContentRow {
  contentId: string;
  contentType: string;
  contentStatus: Phase3PeerContentStatus;
  moderationStatus: Phase3PeerModerationStatus;
  groupId?: string;
  studentId?: string;
  teacherId?: string;
  safeTitle: string;
  safeSummary: string;
  recommendedTeacherAction: string;
  safeEvidenceRefs: string[];
}

export interface Phase3PeerLearningAuditEvent {
  eventId: string;
  schoolId: string;
  actorId: string;
  actorRole: string;
  studentId?: string;
  teacherId?: string;
  classId?: string;
  groupId?: string;
  resourceId?: string;
  highlightId?: string;
  challengeId?: string;
  participationId?: string;
  reviewItemId?: string;
  visibilityDecisionId?: string;
  moderationDecisionId?: string;
  eventType: Phase3PeerLearningAuditEventType;
  safeReasonCodes: string[];
  safeEvidenceRefs: string[];
  createdAt: string;
}

export interface Phase3PeerLearningQuery {
  schoolId: string;
  studentId?: string;
  groupId?: string;
  classId?: string;
  subjectId?: string;
  contentType?: string;
  moderationStatus?: string;
  contentStatus?: string;
  limit?: number;
  offset?: number;
}

export interface Phase3PeerLearningTeacherQuery {
  schoolId: string;
  teacherId: string;
  classId?: string;
  subjectId?: string;
  groupId?: string;
  moderationStatus?: string;
  contentType?: string;
  limit?: number;
  offset?: number;
}
