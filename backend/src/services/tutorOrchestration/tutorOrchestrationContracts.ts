export type TutorTurnIntent =
  | 'ask_concept'
  | 'ask_for_hint'
  | 'ask_for_final_answer'
  | 'submit_attempt'
  | 'ask_for_practice'
  | 'ask_for_revision'
  | 'ask_deen_question'
  | 'express_confusion'
  | 'express_frustration'
  | 'serious_safety_risk'
  | 'unknown';

export type TutorResponseMove =
  | 'clarify_question'
  | 'concept_explanation'
  | 'socratic_hint'
  | 'one_step_guidance'
  | 'attempt_feedback'
  | 'mistake_correction'
  | 'practice_question'
  | 'worked_example_different_problem'
  | 'revision_prompt'
  | 'safe_refusal'
  | 'deen_referral'
  | 'source_check_message'
  | 'safety_support_message'
  | 'summary_and_next_step';

export interface TutorTurnOrchestrationInput {
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

export interface TutorTurnOrchestrationResult {
  requestId: string;
  tutorSessionId: string;
  intent: TutorTurnIntent;
  responseMove: TutorResponseMove;
  state: {
    initialState: string;
    finalState: string;
    transitionReason: string;
  };
  responseText: string;
  hint?: unknown;
  stepCheck?: unknown;
  attemptFeedback?: unknown;
  practiceQuestion?: unknown;
  mistakeAnalysis?: unknown;
  subjectValidation?: unknown;
  evidenceWrite?: unknown;
  revisionUpdate?: unknown;
  policyTags: string[];
  archiveMetadata: {
    shouldArchive: boolean;
    archivedUserMessage: boolean;
    archivedAssistantMessage: boolean;
  };
  safeMemoryMetadata: {
    shouldUpdateSafeMemory: boolean;
    safeSignals: string[];
  };
  clientSafeMetadata: {
    displayMode?: 'widget' | 'fullscreen';
    curriculumTrack?: string;
    subjectModuleId?: string;
    allowedMode?: string;
  };
}
