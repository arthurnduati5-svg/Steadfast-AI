import type { TutorTurnIntent, TutorResponseMove } from './tutorOrchestrationContracts';

export interface LearningResponsePlanInput {
  requestId: string;
  messageText: string;
  intent: TutorTurnIntent;
  policyPacket: unknown;
  curriculumContext?: unknown;
  deenPolicyContext?: unknown;
  learnerAttempt?: unknown;
  safeLearningContext?: unknown;
  curriculumValidationModes?: string[];
  deenSourceSensitive?: boolean;
}

export interface LearningResponsePlan {
  requestId: string;
  responseMove: TutorResponseMove;
  requiresAiGeneration: boolean;
  requiresStepCheck: boolean;
  requiresHint: boolean;
  requiresPracticeQuestion: boolean;
  requiresEvidenceWrite: boolean;
  requiresRevisionUpdate: boolean;
  allowedAnswerDepth: string;
  planReason: string;
  generationInstruction: string;
  validationRequirements: string[];
}
