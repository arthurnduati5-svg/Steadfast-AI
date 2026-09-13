export const PHASE3_STUDY_PLAN_TYPES = [
  'learner_goal_plan', 'exam_preparation_plan', 'weekly_revision_plan',
  'daily_focus_plan', 'weak_topic_recovery_plan', 'teacher_assigned_plan',
] as const

export const PHASE3_STUDY_PLAN_STATUSES = [
  'draft', 'active', 'paused', 'completed', 'cancelled', 'archived',
] as const

export const PHASE3_STUDY_PLAN_GOAL_TYPES = [
  'master_objective', 'improve_weak_topic', 'prepare_for_exam',
  'build_confidence', 'reinforce_revision',
] as const

export const PHASE3_STUDY_PLAN_STEP_TYPES = [
  'practice', 'revision', 'teach_back', 'quiz', 'focus_mode', 'study',
] as const

export const PHASE3_STUDY_PLAN_ADJUSTMENT_REASONS = [
  'too_easy', 'too_hard', 'not_engaging', 'schedule_conflict', 'teacher_request',
] as const

export const PHASE3_STUDY_PLAN_ACTIONS = [
  'create', 'activate', 'pause', 'resume', 'adjust', 'complete', 'cancel',
] as const

export const PHASE3_STUDY_PLAN_FORBIDDEN_FIELDS = [
  'rawAnswer', 'rawChat', 'providerPrompt', 'answerKey',
] as const
