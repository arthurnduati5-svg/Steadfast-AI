export const PHASE3_REVISION_NODE_TYPES = [
  'learner_note',
  'approved_source_anchor',
  'objective_anchor',
  'daily_check_anchor',
  'study_plan_anchor',
  'growth_page_anchor',
  'mistake_pattern_anchor',
  'weak_topic_anchor',
  'recall_prompt',
  'teach_back_prompt',
  'worked_step_summary',
  'concept_summary',
  'source_required_placeholder',
  'teacher_support_placeholder',
  // Phase 3D spec-aligned aliases
  'objective_revisit',
  'daily_check_revisit',
  'mistake_pattern_repair',
  'weak_topic_revisit',
  'study_plan_revisit',
  'growth_due_now_revisit',
  'learner_saved_revision',
  'teacher_assigned_revision',
  'source_required_revision',
  'teacher_support_revision',
] as const;

export type Phase3RevisionNodeType = typeof PHASE3_REVISION_NODE_TYPES[number];

export const PHASE3_REVISION_EDGE_TYPES = [
  'same_objective',
  'same_topic',
  'same_skill',
  'prerequisite_of',
  'supports',
  'strengthens',
  'revisits',
  'came_from_mistake',
  'repairs_mistake',
  'commonly_confused_with',
  'supports_study_plan',
  'supports_growth_action',
  'due_for_recall',
  'requires_source',
  'requires_teacher_support',
] as const;

export type Phase3RevisionEdgeType = typeof PHASE3_REVISION_EDGE_TYPES[number];

export const PHASE3_REVISION_NODE_STATUSES = [
  'active',
  'pinned',
  'archived',
  'due_for_review',
  'needs_recall',
  'needs_teach_back',
  'needs_practice',
  'needs_source',
  'needs_teacher_support',
  'blocked',
] as const;

export type Phase3RevisionNodeStatus = typeof PHASE3_REVISION_NODE_STATUSES[number];

export const PHASE3_REVISION_DUE_STATUSES = [
  'not_due',
  'due_now',
  'due_today',
  'due_this_week',
  'overdue',
  'completed',
  'blocked',
  'source_required',
  'teacher_support_required',
] as const;

export type Phase3RevisionDueStatus = typeof PHASE3_REVISION_DUE_STATUSES[number];

export const PHASE3_REVISION_PRIORITIES = [
  'low',
  'medium',
  'high',
  'urgent',
  'blocked',
] as const;

export type Phase3RevisionPriority = typeof PHASE3_REVISION_PRIORITIES[number];

export const PHASE3_REVISION_ACTIONS = [
  'open_revision_node',
  'start_recall_check',
  'start_teach_back',
  'open_focus_mode',
  'open_quiz_mode',
  'open_study_plan',
  'review_mistake_pattern',
  'review_weak_topic',
  'ask_teacher_for_source',
  'ask_teacher_for_help',
  'pin_node',
  'archive_node',
  'no_action_needed',
] as const;

export type Phase3RevisionAction = typeof PHASE3_REVISION_ACTIONS[number];

export const PHASE3_REVISION_SOURCE_TYPES = [
  'learner_created',
  'approved_source',
  'objective_mastery',
  'daily_objective_check',
  'daily_learning_feed',
  'study_plan',
  'growth_page',
  'safe_learning_evidence',
  'teacher_safe_insight',
  'revision_import_adapter',
] as const;

export type Phase3RevisionSourceType = typeof PHASE3_REVISION_SOURCE_TYPES[number];

export const PHASE3_REVISION_SIGNAL_TYPES = [
  'saved_by_learner',
  'created_from_objective',
  'created_from_daily_check',
  'created_from_study_plan',
  'created_from_growth_page',
  'created_from_mistake_pattern',
  'created_from_weak_topic',
  'due_for_recall',
  'due_for_teach_back',
  'due_for_practice',
  'source_required',
  'teacher_support_required',
  'recently_revisited',
  'strengthened_by_review',
] as const;

export type Phase3RevisionSignalType = typeof PHASE3_REVISION_SIGNAL_TYPES[number];

export const PHASE3_REVISION_AUDIT_EVENTS = [
  'revision_node_created',
  'revision_node_viewed',
  'revision_node_pinned',
  'revision_node_archived',
  'revision_node_completed',
  'revision_node_snoozed',
  'revision_edge_created',
  'revision_edge_removed',
  'revision_graph_viewed',
  'learner_revision_viewed',
  'revision_due_item_created',
  'revision_due_item_completed',
  'revision_source_required_returned',
  'revision_teacher_support_returned',
  'revision_teacher_overview_viewed',
  'revision_empty_state_returned',
] as const;

export type Phase3RevisionAuditEventType = typeof PHASE3_REVISION_AUDIT_EVENTS[number];

export const PHASE3_LIVING_REVISION_FORBIDDEN_FIELDS = [
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
  'riskScore',
  'diagnosis',
  'pietyScore',
  'leaderboardRank',
  'classmateComparison',
] as const;

export type Phase3LivingRevisionForbiddenField = typeof PHASE3_LIVING_REVISION_FORBIDDEN_FIELDS[number];

export const PHASE3_REVISION_FORBIDDEN_FIELDS = [
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

export type Phase3RevisionForbiddenField = typeof PHASE3_REVISION_FORBIDDEN_FIELDS[number];

export interface Phase3RevisionSafeEvidenceRef {
  evidenceId: string;
  sourceType: Phase3RevisionSourceType;
  safeSummary: string;
  safeReasonCode: string;
}

export interface Phase3RevisionSourceTruth {
  status: 'approved' | 'teacher_created' | 'school_created' | 'learner_created_visible' | 'source_required' | 'content_gap' | 'blocked' | 'unknown';
  approvedSourceRef?: string;
  requiresApprovedDeenSource?: boolean;
}

export interface Phase3RevisionContext {
  schoolId: string;
  studentId?: string;
  teacherId?: string;
  classId?: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  role?: string;
}

export interface Phase3RevisionNode {
  nodeId: string;
  nodeType: Phase3RevisionNodeType;
  status: Phase3RevisionNodeStatus;
  priority: Phase3RevisionPriority;
  schoolId: string;
  studentId?: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  objectiveId?: string;
  safeTitle: string;
  safeSummary: string;
  learnerVisibleText?: string;
  sourceAnchorTitle?: string;
  approvedSourceRef?: string;
  sourceTruth: Phase3RevisionSourceTruth;
  safeEvidenceRefs: Phase3RevisionSafeEvidenceRef[];
  safeReasonCodes: string[];
  connectionCount: number;
  isPinned: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Phase3RevisionEdge {
  edgeId: string;
  edgeType: Phase3RevisionEdgeType;
  schoolId: string;
  studentId?: string;
  sourceNodeId: string;
  targetNodeId: string;
  safeEvidenceRefs: Phase3RevisionSafeEvidenceRef[];
  safeReasonCodes: string[];
  createdAt: string;
}

export interface Phase3RevisionSchedule {
  dueStatus: Phase3RevisionDueStatus;
  dueAt?: string;
  snoozedUntil?: string;
  intervalDays?: number;
  lastReviewedAt?: string;
}

export interface Phase3RevisionDueItem {
  dueItemId: string;
  schoolId: string;
  studentId: string;
  nodeId: string;
  edgeId?: string;
  priority: Phase3RevisionPriority;
  signalType: Phase3RevisionSignalType;
  safeTitle: string;
  safeSummary: string;
  recommendedAction: Phase3RevisionAction;
  sourceTruthStatus: string;
  objectiveId?: string;
  topicId?: string;
  skillId?: string;
  isCompleted: boolean;
  safeEvidenceRefs: Phase3RevisionSafeEvidenceRef[];
  safeReasonCodes: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Phase3RevisionConnectionSuggestion {
  sourceNodeId: string;
  targetNodeId: string;
  edgeType: Phase3RevisionEdgeType;
  reasonCode: string;
  score: number;
  safeEvidenceRefs: Phase3RevisionSafeEvidenceRef[];
}

export interface Phase3RevisionNoteGraph {
  schoolId: string;
  studentId: string;
  generatedAt: string;
  nodes: Phase3RevisionNode[];
  edges: Phase3RevisionEdge[];
  dueItems: Phase3RevisionDueItem[];
  connectionSuggestions: Phase3RevisionConnectionSuggestion[];
  safeEvidenceRefs: Phase3RevisionSafeEvidenceRef[];
  safeReasonCodes: string[];
  safeSummary: string;
}

export interface Phase3RevisionLearnerView {
  schoolId: string;
  studentId: string;
  generatedAt: string;
  safeHeadline: string;
  safeSummary: string;
  nodes: Phase3RevisionNode[];
  edges: Phase3RevisionEdge[];
  dueItems: Phase3RevisionDueItem[];
  connectionSuggestions: Phase3RevisionConnectionSuggestion[];
  safeEvidenceRefs: Phase3RevisionSafeEvidenceRef[];
  safeReasonCodes: string[];
}

export interface Phase3RevisionTeacherLearnerRow {
  studentId: string;
  revisionNodeCount: number;
  dueRevisionCount: number;
  sourceRequiredCount: number;
  teacherSupportNeeded: number;
  mistakeRepairCount: number;
  safePatternSummary: string;
  recommendedTeacherAction: string;
  safeEvidenceRefs: Phase3RevisionSafeEvidenceRef[];
}

export interface Phase3RevisionTeacherTopicRow {
  topicId: string;
  skillId?: string;
  objectiveIds: string[];
  learnersAffectedCount: number;
  revisionNodeCount: number;
  dueRevisionCount: number;
  sourceRequiredCount: number;
  teacherSupportCount: number;
  mistakeRepairCount: number;
  safePatternSummary: string;
  recommendedTeacherAction: string;
  safeEvidenceRefs: Phase3RevisionSafeEvidenceRef[];
}

export interface Phase3RevisionTeacherOverview {
  schoolId: string;
  teacherId: string;
  classId?: string;
  subjectId?: string;
  generatedAt: string;
  totalLearnersWithRevisionNodes: number;
  totalDueRevisionItems: number;
  totalSourceRequired: number;
  totalTeacherSupportNeeded: number;
  totalMistakeRepairNodes: number;
  learnerRows: Phase3RevisionTeacherLearnerRow[];
  topicRows: Phase3RevisionTeacherTopicRow[];
  safeSummary: string;
  recommendedTeacherActions: string[];
}

export interface Phase3RevisionAuditEvent {
  eventId: string;
  schoolId: string;
  actorId: string;
  actorRole: string;
  studentId?: string;
  teacherId?: string;
  classId?: string;
  nodeId?: string;
  edgeId?: string;
  objectiveId?: string;
  topicId?: string;
  skillId?: string;
  eventType: Phase3RevisionAuditEventType;
  safeReasonCodes: string[];
  safeEvidenceRefs: Phase3RevisionSafeEvidenceRef[];
  createdAt: string;
}

export interface Phase3RevisionNodeCreateInput {
  schoolId: string;
  studentId?: string;
  nodeType: Phase3RevisionNodeType;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  objectiveId?: string;
  safeTitle: string;
  safeSummary: string;
  learnerVisibleText?: string;
  sourceAnchorTitle?: string;
  approvedSourceRef?: string;
  sourceTruth: Phase3RevisionSourceTruth;
  safeEvidenceRefs?: Phase3RevisionSafeEvidenceRef[];
  safeReasonCodes?: string[];
}

export interface Phase3RevisionEdgeCreateInput {
  schoolId: string;
  studentId?: string;
  edgeType: Phase3RevisionEdgeType;
  sourceNodeId: string;
  targetNodeId: string;
  safeEvidenceRefs?: Phase3RevisionSafeEvidenceRef[];
  safeReasonCodes?: string[];
}

export interface Phase3RevisionGraphQuery {
  schoolId: string;
  studentId: string;
  includeArchived?: boolean;
  topicId?: string;
  objectiveId?: string;
  nodeType?: Phase3RevisionNodeType;
  statusFilter?: Phase3RevisionNodeStatus;
}

export interface Phase3RevisionQuery {
  schoolId: string;
  studentId: string;
  includeArchived?: boolean;
  topicId?: string;
  objectiveId?: string;
  nodeType?: Phase3RevisionNodeType;
  statusFilter?: Phase3RevisionNodeStatus;
  dueStatusFilter?: Phase3RevisionDueStatus;
}

export interface Phase3RevisionTeacherQuery {
  schoolId: string;
  teacherId: string;
  classId?: string;
  subjectId?: string;
  role: string;
}
