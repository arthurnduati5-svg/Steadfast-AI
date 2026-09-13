export type AcademicIntegrityCategory =
  | 'normal_learning'
  | 'homework_help'
  | 'direct_final_answer_request'
  | 'test_or_exam_answer_request'
  | 'essay_or_assignment_completion_request'
  | 'plagiarism_or_impersonation_request'
  | 'attempt_feedback'
  | 'unknown';

export interface AcademicIntegrityPolicyInput {
  requestId: string;
  messageText: string;
  activeSchoolPage?: string;
  subjectHint?: string;
  topicHint?: string;
}

export interface AcademicIntegrityPolicyResult {
  category: AcademicIntegrityCategory;
  integrityRisk: 'none' | 'low' | 'medium' | 'high';
  directAnswerRequested: boolean;
  learnerAttemptPresent: boolean;
  allowedSupportModes: Array<
    | 'concept_explanation'
    | 'hint'
    | 'one_step_guidance'
    | 'attempt_feedback'
    | 'practice_question'
    | 'outline_support'
    | 'study_strategy'
  >;
  disallowedBehaviors: string[];
  reasons: string[];
}
