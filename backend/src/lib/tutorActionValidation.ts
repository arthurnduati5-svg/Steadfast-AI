import { z } from 'zod';
import {
  TUTOR_ACTION_TYPES,
  HINT_LADDER_LEVELS,
  SUPPORT_LEVELS,
  LEARNER_NEED_CATEGORIES,
  ACTION_REASON_CODES,
  ACTION_EFFECTIVENESS_SIGNALS,
  FORBIDDEN_TUTOR_ACTION_FIELDS,
} from '../contracts/tutorActionContracts';

export const TutorActionTypeSchema = z.enum([...TUTOR_ACTION_TYPES] as [string, ...string[]]);
export const HintLadderLevelSchema = z.enum([...HINT_LADDER_LEVELS] as [string, ...string[]]);
export const SupportLevelSchema = z.enum([...SUPPORT_LEVELS] as [string, ...string[]]);
export const LearnerNeedCategorySchema = z.enum([...LEARNER_NEED_CATEGORIES] as [string, ...string[]]);
export const ActionReasonCodeSchema = z.enum([...ACTION_REASON_CODES] as [string, ...string[]]);
export const EffectivenessSignalSchema = z.enum([...ACTION_EFFECTIVENESS_SIGNALS] as [string, ...string[]]);

const forbiddenFieldCheck = (data: Record<string, unknown>): boolean => {
  const keys = Object.keys(data);
  return !keys.some(k => (FORBIDDEN_TUTOR_ACTION_FIELDS as readonly string[]).includes(k));
};

export const TutorActionDecisionRequestSchema = z.object({
  modeSessionId: z.string().optional(),
  conversationId: z.string().optional(),
  mode: z.string().optional(),
  stage: z.string().optional(),
  subjectId: z.string().optional(),
  topicId: z.string().optional(),
  skillId: z.string().optional(),
  requestCategory: z.string().optional(),
  answerQuality: z.string().optional(),
  mistakeCategory: z.string().optional(),
  approvedContextAvailable: z.boolean().optional(),
  deenSensitive: z.boolean().optional(),
}).strict().refine(forbiddenFieldCheck, { message: 'Forbidden field detected in request' });

export const TutorActionDecisionResponseSchema = z.object({
  id: z.string().optional(),
  schoolId: z.string(),
  studentId: z.string().optional(),
  tutorLearnerId: z.string().optional(),
  modeSessionId: z.string().optional(),
  conversationId: z.string().optional(),
  mode: z.string().optional(),
  stage: z.string().optional(),
  selectedAction: TutorActionTypeSchema,
  rankedActions: z.array(z.object({
    action: TutorActionTypeSchema,
    score: z.number(),
    reasonCodes: z.array(z.string()),
  })),
  hintLevel: HintLadderLevelSchema.optional(),
  supportLevel: SupportLevelSchema,
  learnerNeedCategory: LearnerNeedCategorySchema,
  answerPolicy: z.object({
    finalAnswerAllowed: z.boolean(),
    answerKeyRisk: z.boolean(),
    requiresStudentAttempt: z.boolean(),
    requiresSocraticQuestion: z.boolean(),
  }),
  contentPolicy: z.object({
    approvedContextAvailable: z.boolean(),
    contentGap: z.boolean(),
    deenSensitive: z.boolean(),
    referralRequired: z.boolean(),
  }),
  decisionReasonCodes: z.array(z.string()),
  safeEvidenceRefs: z.array(z.string()),
  confidenceScore: z.number().min(0).max(1),
  nextSignalType: z.string().optional(),
  nextModeStage: z.string().optional(),
  createdAt: z.string(),
}).refine(forbiddenFieldCheck, { message: 'Forbidden field detected in response' });

export const HintLadderStateQuerySchema = z.object({
  modeSessionId: z.string().optional(),
  topicId: z.string().optional(),
  skillId: z.string().optional(),
}).strict();

export const HintLadderAdvanceRequestSchema = z.object({
  modeSessionId: z.string().optional(),
  topicId: z.string().optional(),
  skillId: z.string().optional(),
  currentHintLevel: HintLadderLevelSchema.optional(),
  hintGiven: z.boolean(),
  studentAttempted: z.boolean(),
  studentRecovered: z.boolean(),
}).strict().refine(forbiddenFieldCheck, { message: 'Forbidden field detected in request' });

export const TutorActionEffectivenessRequestSchema = z.object({
  decisionId: z.string().min(1, 'decisionId is required'),
  effectivenessSignal: EffectivenessSignalSchema,
  recoveryDetected: z.boolean(),
  safeEvidenceRefs: z.array(z.string()).optional(),
}).strict().refine(forbiddenFieldCheck, { message: 'Forbidden field detected in request' });

export const TutorActionDecisionIdParamSchema = z.string().min(1, 'decisionId is required');
