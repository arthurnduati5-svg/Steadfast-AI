import { z } from 'zod';
import { FORBIDDEN_PROFILE_FIELDS } from '../contracts/studentLearningProfileContracts';

export const ProfileStatusSchema = z.enum([
  'no_data_yet', 'active', 'stale', 'archived',
]);

export const MasteryLevelSchema = z.enum([
  'unknown', 'not_started', 'emerging', 'developing',
  'nearly_secure', 'secure', 'strong',
]);

export const MasteryStatusSchema = z.enum([
  'active', 'needs_review', 'improving', 'stuck',
  'ready_for_challenge', 'inactive',
]);

export const ProfilePrivacyLevelSchema = z.enum([
  'student_only', 'teacher_safe', 'admin_diagnostics', 'system_only',
]);

export const SupportPatternTypeSchema = z.enum([
  'attention_hint', 'direction_hint', 'rephrased_question',
  'smaller_step', 'micro_example', 'guided_completion',
  'teacher_help', 'revision', 'practice_more', 'teach_back', 'video_support',
]);

export const WeakTopicStatusSchema = z.enum([
  'identified', 'improving', 'resolved', 'monitoring',
]);

export const ProfileRecommendedActionSchema = z.enum([
  'review_topic', 'practice_more', 'try_smaller_step',
  'use_revision', 'teach_back', 'attempt_quiz',
  'move_to_next_topic', 'teacher_consult', 'watch_support_video',
  'continue_current_mode', 'start_learning_session',
]);

export const ProfileReasonCodeSchema = z.enum([
  'low_confidence', 'high_hint_dependency', 'repeated_mistakes',
  'stuck_without_recovery', 'negative_trend', 'improving_trend',
  'recovery_after_hint', 'successful_teach_back', 'recent_correct',
  'fewer_hints_over_time', 'strong_evidence', 'no_evidence_yet',
]);

// Validation helper: reject any forbidden fields
function rejectForbiddenProfileFields(data: Record<string, unknown>): string | null {
  for (const key of Object.keys(data)) {
    if ((FORBIDDEN_PROFILE_FIELDS as readonly string[]).includes(key)) {
      return key;
    }
  }
  return null;
}

export const LearningProfileRefreshSchema = z.object({
  subjectId: z.string().min(1).optional(),
  topicId: z.string().min(1).optional(),
  forceRecompute: z.boolean().optional(),
}).strict().refine(
  (data) => {
    const badKey = rejectForbiddenProfileFields(data as Record<string, unknown>);
    return badKey === null;
  },
  (data) => {
    const badKey = rejectForbiddenProfileFields(data as Record<string, unknown>);
    return { message: `Forbidden field detected: ${badKey}` };
  }
);

export const LearningProfileQuerySchema = z.object({
  studentId: z.string().min(1).optional(),
  subjectId: z.string().min(1).optional(),
  topicId: z.string().min(1).optional(),
}).strict().refine(
  (data) => {
    const badKey = rejectForbiddenProfileFields(data as Record<string, unknown>);
    return badKey === null;
  },
  (data) => {
    const badKey = rejectForbiddenProfileFields(data as Record<string, unknown>);
    return { message: `Forbidden field detected: ${badKey}` };
  }
);

export const StudentIdParamSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
});

export const MasteryPathwayQuerySchema = z.object({
  subjectId: z.string().min(1).optional(),
}).strict().refine(
  (data) => {
    const badKey = rejectForbiddenProfileFields(data as Record<string, unknown>);
    return badKey === null;
  },
  (data) => {
    const badKey = rejectForbiddenProfileFields(data as Record<string, unknown>);
    return { message: `Forbidden field detected: ${badKey}` };
  }
);

export const WeakTopicsQuerySchema = z.object({
  subjectId: z.string().min(1).optional(),
  status: WeakTopicStatusSchema.optional(),
}).strict().refine(
  (data) => {
    const badKey = rejectForbiddenProfileFields(data as Record<string, unknown>);
    return badKey === null;
  },
  (data) => {
    const badKey = rejectForbiddenProfileFields(data as Record<string, unknown>);
    return { message: `Forbidden field detected: ${badKey}` };
  }
);

export const AcademicMemoryQuerySchema = z.object({
  subjectId: z.string().min(1).optional(),
}).strict().refine(
  (data) => {
    const badKey = rejectForbiddenProfileFields(data as Record<string, unknown>);
    return badKey === null;
  },
  (data) => {
    const badKey = rejectForbiddenProfileFields(data as Record<string, unknown>);
    return { message: `Forbidden field detected: ${badKey}` };
  }
);
