import type { AcademicIntegrityPolicyResult } from './academicIntegrityContracts';

export interface NoFinalAnswerPolicyInput {
  requestId: string;
  messageText: string;
  academicIntegrity: AcademicIntegrityPolicyResult;
  curriculumContext?: unknown;
}

export interface NoFinalAnswerPolicyResult {
  finalAnswerBlocked: boolean;
  allowedAnswerDepth:
    | 'clarify_only'
    | 'hint_only'
    | 'one_step'
    | 'attempt_feedback'
    | 'conceptual_explanation'
    | 'full_explanation_allowed';
  mustAskLearnerToTry: boolean;
  mustAvoidFinalAnswer: boolean;
  allowedResponsePattern: string;
  disallowedPatterns: string[];
  safeRedirectMessage?: string;
}
