import type { SafetyPolicyResult } from './safetyPolicyContracts';
import type { AcademicIntegrityPolicyResult } from './academicIntegrityContracts';
import type { NoFinalAnswerPolicyResult } from './noFinalAnswerContracts';
import type { SocraticTutorDirective } from './socraticDirectiveContracts';
import type { ResponseBoundary } from './responseBoundaryContracts';

export type TutorTurnDecision =
  | 'allow'
  | 'constrain'
  | 'clarify_first'
  | 'refer'
  | 'block';

export type TutorTurnBlockReason =
  | 'missing_verified_identity'
  | 'missing_session_ownership'
  | 'serious_safety_risk'
  | 'safeguarding_candidate'
  | 'academic_integrity_violation'
  | 'final_answer_request'
  | 'deen_source_required'
  | 'deen_scholar_referral_required'
  | 'sectarian_safety_risk'
  | 'invalid_input'
  | 'unknown';

export type TutorTurnAllowedMode =
  | 'normal_socratic_tutoring'
  | 'hint_only'
  | 'attempt_feedback'
  | 'concept_explanation'
  | 'practice_generation'
  | 'study_support'
  | 'clarification_question'
  | 'safe_refusal'
  | 'referral_support';

export interface TutorTurnPolicyInput {
  requestId: string;
  schoolId: string;
  tutorLearnerId: string;
  externalStudentId?: string;
  tutorSessionId: string;
  messageText: string;
  learnerGrade?: string;
  learnerAge?: number;
  preferredLanguage?: string;
  clientContext?: {
    displayMode?: 'widget' | 'fullscreen';
    activeSchoolPage?: string;
    subjectHint?: string;
    topicHint?: string;
  };
}

export interface TutorTurnPolicyPacket {
  requestId: string;
  decision: TutorTurnDecision;
  allowedMode: TutorTurnAllowedMode;
  blockReasons: TutorTurnBlockReason[];
  safety: SafetyPolicyResult;
  academicIntegrity: AcademicIntegrityPolicyResult;
  noFinalAnswer: NoFinalAnswerPolicyResult;
  curriculumContext?: unknown;
  deenPolicyContext?: unknown;
  socraticDirective: SocraticTutorDirective;
  responseBoundary: ResponseBoundary;
  outputValidationRequired: boolean;
  archivePolicyTags: string[];
  safeStudentMessage?: string;
  safeClarifyingQuestion?: string;
  allowedResponseBehaviors: string[];
  disallowedResponseBehaviors: string[];
}
