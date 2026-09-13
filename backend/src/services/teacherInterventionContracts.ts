// ─────────────────────────────────────────────────────────────
// Steadfast AI — Teacher Intervention Contracts v1
// Types for teacher intervention assignments, queues, outcomes.
// ─────────────────────────────────────────────────────────────

export type TeacherInterventionActionType =
  | 'reteach_topic'
  | 'assign_foundation_practice'
  | 'assign_similar_practice'
  | 'assign_challenge_practice'
  | 'teacher_check_in'
  | 'recommend_alternative_video'
  | 'review_artifact_question'
  | 'assign_reflection'
  | 'manual_teacher_note'
  | 'dismiss_recommendation';

export type TeacherInterventionStatus =
  | 'draft'
  | 'assigned'
  | 'viewed_by_learner'
  | 'started'
  | 'submitted'
  | 'completed'
  | 'cancelled'
  | 'dismissed'
  | 'expired'
  | 'needs_follow_up'
  | 'closed';

export type TeacherInterventionOutcomeStatus =
  | 'not_started'
  | 'awaiting_evidence'
  | 'improved'
  | 'unchanged'
  | 'worsened'
  | 'needs_reteach'
  | 'needs_teacher_check_in'
  | 'blocked';

export type TeacherInterventionPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TeacherInterventionVisibility =
  | 'teacher_private'
  | 'learner_visible'
  | 'teacher_and_learner'
  | 'system_internal';

export type TeacherInterventionFollowUpStatus =
  | 'not_required'
  | 'pending'
  | 'completed'
  | 'overdue'
  | 'blocked';

export interface TeacherInterventionAssignment {
  interventionId: string;
  sourceRecommendationId?: string | null;
  teacherId: string;
  studentId: string;
  schoolId: string;
  classId?: string | null;
  subject?: string | null;
  topic?: string | null;
  skillId?: string | null;
  skillLabel?: string | null;
  artifactId?: string | null;
  questionId?: string | null;
  videoId?: string | null;
  watchSessionId?: string | null;
  analyticsEvidenceRefs: string[];
  actionType: TeacherInterventionActionType;
  priority: TeacherInterventionPriority;
  status: TeacherInterventionStatus;
  outcomeStatus: TeacherInterventionOutcomeStatus;
  teacherReason: string;
  learnerFacingInstruction?: string | null;
  teacherPrivateNote?: string | null;
  dueAt?: string | null;
  followUpRequired: boolean;
  followUpStatus: TeacherInterventionFollowUpStatus;
  evidenceSummary: string;
  warnings: string[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
  closedAt?: string | null;
}

export interface TeacherInterventionCreateRequest {
  teacherId: string;
  studentId: string;
  schoolId: string;
  classId?: string | null;
  sourceRecommendationId?: string | null;
  actionType: TeacherInterventionActionType;
  priority?: TeacherInterventionPriority | null;
  subject?: string | null;
  topic?: string | null;
  skillId?: string | null;
  skillLabel?: string | null;
  artifactId?: string | null;
  questionId?: string | null;
  videoId?: string | null;
  watchSessionId?: string | null;
  analyticsEvidenceRefs?: string[];
  teacherReason: string;
  learnerFacingInstruction?: string | null;
  teacherPrivateNote?: string | null;
  dueAt?: string | null;
  followUpRequired?: boolean | null;
}

export interface TeacherInterventionUpdateRequest {
  interventionId: string;
  teacherId: string;
  schoolId: string;
  status?: TeacherInterventionStatus | null;
  learnerFacingInstruction?: string | null;
  teacherPrivateNote?: string | null;
  teacherReason?: string | null;
  followUpRequired?: boolean | null;
  dueAt?: string | null;
}

export interface TeacherInterventionQueueRequest {
  teacherId: string;
  schoolId: string;
  classId?: string | null;
  studentId?: string | null;
  status?: TeacherInterventionStatus | 'all' | null;
  priority?: TeacherInterventionPriority | 'all' | null;
  topic?: string | null;
  skillId?: string | null;
  dueBefore?: string | null;
  limit?: number | null;
}

export interface TeacherInterventionQueueResponse {
  status: 'ok' | 'empty' | 'forbidden' | 'invalid_request' | 'error';
  assignments: TeacherInterventionAssignment[];
  urgentCount: number;
  overdueCount: number;
  needsFollowUpCount: number;
  warnings: string[];
  metadata: Record<string, unknown>;
}

export interface TeacherInterventionOutcomeRequest {
  teacherId: string;
  schoolId: string;
  interventionId: string;
  outcomeStatus: TeacherInterventionOutcomeStatus;
  evidenceRefs?: string[];
  teacherNote?: string | null;
  learnerCompletedAction?: boolean | null;
  practiceAttemptId?: string | null;
  masteryEvidenceId?: string | null;
}

export interface TeacherInterventionSafeLearnerView {
  interventionId: string;
  actionType: TeacherInterventionActionType;
  status: TeacherInterventionStatus;
  subject?: string | null;
  topic?: string | null;
  skillLabel?: string | null;
  learnerFacingInstruction: string;
  dueAt?: string | null;
  nextStep: string;
  warnings: string[];
}

export interface TeacherInterventionSafeTeacherView {
  interventionId: string;
  studentId: string;
  actionType: TeacherInterventionActionType;
  priority: TeacherInterventionPriority;
  status: TeacherInterventionStatus;
  outcomeStatus: TeacherInterventionOutcomeStatus;
  subject?: string | null;
  topic?: string | null;
  skillLabel?: string | null;
  learnerFacingInstruction?: string | null;
  teacherPrivateNote?: string | null;
  teacherReason: string;
  dueAt?: string | null;
  followUpRequired: boolean;
  followUpStatus: TeacherInterventionFollowUpStatus;
  evidenceSummary: string;
  createdAt: string;
  updatedAt: string;
  warnings: string[];
}

export interface TeacherInterventionScope {
  teacherId: string;
  schoolId: string;
  classId?: string | null;
  studentId?: string | null;
}

export interface TeacherInterventionIdentity {
  teacherId: string;
  schoolId: string;
  userId: string;
  role?: string;
}
