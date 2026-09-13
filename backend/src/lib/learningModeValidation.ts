import { z } from 'zod';

export const LearningModeSchema = z.enum([
  'normal', 'focus', 'exam', 'quiz', 'teach_back',
  'plan', 'revision', 'study_stream', 'creative_stream', 'course',
]);

export const ModeSessionStatusSchema = z.enum([
  'requested', 'started', 'active', 'paused', 'resumed',
  'completed', 'cancelled', 'expired', 'failed',
]);

export const ModeStageSchema = z.enum([
  'entry', 'context_check', 'goal_set', 'attempting', 'hinting',
  'repairing', 'reflecting', 'summarizing', 'completed', 'cancelled',
]);

export const SignalTypeSchema = z.enum([
  'mode_entered', 'mode_exited', 'mode_stage_changed', 'goal_set',
  'attempt_started', 'attempt_submitted', 'answer_quality_marked',
  'hint_requested', 'hint_given', 'stuck_detected', 'recovery_detected',
  'mistake_detected', 'repeated_mistake_detected', 'step_successful',
  'reflection_detected', 'teach_back_submitted', 'readiness_check_submitted',
  'mode_summary_created', 'support_action_selected', 'support_action_effective',
]);

export const HintLevelSchema = z.enum([
  'attention_hint', 'direction_hint', 'rephrased_question',
  'smaller_step', 'micro_example', 'guided_completion',
]);

export const TimeSpentBucketSchema = z.enum([
  'very_fast', 'fast', 'normal', 'slow', 'very_slow', 'extreme',
]);

export const DifficultyBucketSchema = z.enum([
  'very_easy', 'easy', 'medium', 'hard', 'very_hard',
]);

export const AnswerQualitySchema = z.enum([
  'correct', 'partially_correct', 'incorrect', 'unclear', 'skipped',
]);

export const MistakeCategorySchema = z.enum([
  'conceptual', 'procedural', 'careless', 'misreading',
  'prerequisite_gap', 'language_barrier', 'unknown',
]);

export const RecommendedNextActionSchema = z.enum([
  'review_topic', 'practice_more', 'move_to_next_topic',
  'retake_assessment', 'revision_suggested', 'teacher_consult',
  'focus_mode_suggested', 'exam_mode_suggested',
  'teach_back_suggested', 'study_stream_suggested',
]);

export const ConfidenceSignalSchema = z.enum([
  'high', 'medium', 'low', 'very_low', 'unknown',
]);

export const SourceTypeSchema = z.enum([
  'student_initiated', 'system_initiated', 'teacher_initiated', 'auto_detected',
]);

export const SupportActionTypeSchema = z.enum([
  'simplify', 'use_example', 'revisit_prerequisite', 'ask_recall',
  'break_down', 'visual_aid', 'analogy', 'rephrase',
  'mini_quiz', 'teach_back_invite', 'raise_confidence',
]);

export const ForbiddenMetadataKeys = [
  'rawText', 'messageBody', 'studentMessage', 'aiResponse',
  'prompt', 'providerResponse', 'answerKey', 'teacherOnlyNote',
  'safeguardingRawDetail', 'token', 'apiKey', 'authorization',
  'cookie', 'privateKey', 'databaseUrl',
] as const;

// Request Validation Schemas

export const StartModeSessionSchema = z.object({
  mode: LearningModeSchema,
  conversationId: z.string().optional(),
  subjectId: z.string().optional(),
  topicId: z.string().optional(),
  skillId: z.string().optional(),
}).strict().refine(
  (data) => {
    const bodyKeys = Object.keys(data);
    const forbidden = ForbiddenMetadataKeys.filter(k => bodyKeys.includes(k));
    return forbidden.length === 0;
  },
  { message: 'Forbidden metadata field detected' }
);

export const TransitionModeSchema = z.object({
  status: ModeSessionStatusSchema.optional(),
  stage: ModeStageSchema.optional(),
  reason: z.string().max(200).optional(),
}).strict().refine(
  (data) => data.status || data.stage,
  { message: 'At least one of status or stage is required' }
);

export const RecordSignalSchema = z.object({
  signalType: SignalTypeSchema,
  stage: ModeStageSchema.optional(),
  topicId: z.string().optional(),
  subjectId: z.string().optional(),
  skillId: z.string().optional(),
  attemptNumber: z.number().int().positive().optional(),
  hintLevel: HintLevelSchema.optional(),
  answerQuality: AnswerQualitySchema.optional(),
  mistakeCategory: MistakeCategorySchema.optional(),
  supportActionType: SupportActionTypeSchema.optional(),
  confidenceSignal: ConfidenceSignalSchema.optional(),
  timeSpentBucket: TimeSpentBucketSchema.optional(),
  difficultyBucket: DifficultyBucketSchema.optional(),
  sourceType: SourceTypeSchema.optional(),
}).strict().refine(
  (data) => {
    const bodyKeys = Object.keys(data);
    const forbidden = ForbiddenMetadataKeys.filter(k => bodyKeys.includes(k));
    return forbidden.length === 0;
  },
  { message: 'Forbidden metadata field detected' }
);

export const RecordAttemptSchema = z.object({
  stage: ModeStageSchema,
  attemptNumber: z.number().int().positive(),
  answerQuality: AnswerQualitySchema.optional(),
  isCorrect: z.boolean().optional(),
  mistakeCategory: MistakeCategorySchema.optional(),
  usedHint: z.boolean().optional(),
  hintLevel: HintLevelSchema.optional(),
  timeSpentBucket: TimeSpentBucketSchema.optional(),
  topicId: z.string().optional(),
  skillId: z.string().optional(),
}).strict().refine(
  (data) => {
    const bodyKeys = Object.keys(data);
    const forbidden = ForbiddenMetadataKeys.filter(k => bodyKeys.includes(k));
    return forbidden.length === 0;
  },
  { message: 'Forbidden metadata field detected' }
);

export const RecordHintSchema = z.object({
  hintLevel: HintLevelSchema,
  stage: ModeStageSchema.optional(),
  attemptNumber: z.number().int().positive().optional(),
  wasRequestedByStudent: z.boolean().optional(),
  wasSuggestedBySystem: z.boolean().optional(),
}).strict().refine(
  (data) => {
    const bodyKeys = Object.keys(data);
    const forbidden = ForbiddenMetadataKeys.filter(k => bodyKeys.includes(k));
    return forbidden.length === 0;
  },
  { message: 'Forbidden metadata field detected' }
);

// ID format validation
export const IdParamSchema = z.string().min(1, 'ID is required');
