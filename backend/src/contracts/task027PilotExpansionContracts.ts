export const PILOT_EXPANSION_STATUSES = [
  'draft', 'review_required', 'under_review', 'blocked', 'approved',
  'rejected', 'ready_to_expand', 'expanded', 'paused', 'rolled_back',
  'completed', 'failed', 'pending_review', 'in_progress', 'cancelled',
] as const

export const PILOT_EXPANSION_RECOMMENDED_DECISIONS = [
  'do_not_expand', 'pause_and_fix', 'continue_current_pilot',
  'expand_cautiously', 'expand_to_next_cohort', 'expand_after_teacher_review',
  'approve', 'reject', 'request_changes', 'escalate',
] as const

export const PILOT_EXPANSION_RISK_LEVELS = [
  'low', 'medium', 'high', 'critical',
] as const

export const PILOT_EXPANSION_REVIEW_TYPES = [
  'teacher_learning_quality', 'admin_operations', 'privacy',
  'deen_governance', 'socratic_quality', 'curriculum_source_coverage',
  'rollback_readiness', 'teacher_safe_quality', 'privacy_safeguarding',
  'content_governance', 'deen_source', 'socratic_integrity', 'admin_oversight',
] as const

export const REQUIRED_EXPANSION_REVIEW_TYPES = [
  'teacher_learning_quality', 'admin_operations', 'privacy',
  'deen_governance', 'socratic_quality', 'curriculum_source_coverage',
  'rollback_readiness',
] as const

export const EXPANSION_REVIEW_TYPES = [
  'teacher_safe_quality', 'privacy_safeguarding', 'content_governance',
  'deen_source', 'socratic_integrity', 'admin_oversight',
] as const

export const PRIVATE_CONTENT_PATTERNS = [
  'rawStudentData', 'rawLearnerData', 'answerKey', 'correctAnswer',
] as const
