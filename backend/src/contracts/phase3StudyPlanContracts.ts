export const PHASE3_STUDY_PLAN_TYPES = [
  'learner_goal_plan', 'exam_preparation_plan', 'weekly_revision_plan',
  'daily_focus_plan', 'weak_topic_recovery_plan', 'teacher_assigned_plan',
] as const

export type Phase3StudyPlanType = typeof PHASE3_STUDY_PLAN_TYPES[number]

export const PHASE3_STUDY_PLAN_STATUSES = [
  'draft', 'active', 'paused', 'completed', 'cancelled', 'archived',
  'needs_adjustment', 'source_required', 'blocked', 'needs_teacher_support',
] as const

export type Phase3StudyPlanStatus = typeof PHASE3_STUDY_PLAN_STATUSES[number]

export const PHASE3_STUDY_PLAN_GOAL_TYPES = [
  'master_objective', 'improve_weak_topic', 'prepare_for_exam',
  'build_confidence', 'reinforce_revision',
] as const

export const PHASE3_STUDY_PLAN_STEP_TYPES = [
  'practice', 'revision', 'teach_back', 'quiz', 'focus_mode', 'study',
] as const

export type Phase3StudyPlanStepType = typeof PHASE3_STUDY_PLAN_STEP_TYPES[number]

export const PHASE3_STUDY_PLAN_ADJUSTMENT_REASONS = [
  'too_easy', 'too_hard', 'not_engaging', 'schedule_conflict', 'teacher_request',
] as const

export const PHASE3_STUDY_PLAN_ACTIONS = [
  'create', 'activate', 'pause', 'resume', 'adjust', 'complete', 'cancel',
] as const

export const PHASE3_STUDY_PLAN_FORBIDDEN_FIELDS = [
  'rawAnswer', 'rawChat', 'providerPrompt', 'answerKey',
] as const

export type Phase3StudyPlan = {
  planId: string
  schoolId: string
  studentId: string
  planType?: Phase3StudyPlanType
  status: Phase3StudyPlanStatus
  title: string
  safeDescription?: string
  subject?: string
  goal: { targetObjectiveIds: string[] }
  safeEvidenceRefs: string[]
  safeReasonCodes: string[]
  sourceTruthStatus?: string
  isArchived: boolean
  createdAt: string
  updatedAt?: string
}

export type Phase3StudyPlanStep = {
  stepId: string
  planId: string
  schoolId: string
  studentId: string
  stepType?: Phase3StudyPlanStepType
  title: string
  objectiveId?: string
  status: Phase3StudyPlanStatus
  sourceTruthStatus?: string
  safeEvidenceRefs: string[]
  reasonCode?: string
  createdAt: string
  updatedAt?: string
  completedAt?: string
}
