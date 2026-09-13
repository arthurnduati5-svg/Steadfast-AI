import type {
  TutorTurnOrchestrationInput,
  TutorTurnOrchestrationResult,
  TutorTurnIntent,
  TutorResponseMove,
} from './tutorOrchestrationContracts';
import type { SocraticHint } from './hintLadderContracts';
import type { StepCheckResult } from './stepCheckingContracts';
import type { PracticeQuestionPlan } from './practiceQuestionContracts';
import type { MistakeAnalysis } from './mistakeTaxonomyContracts';
import type { AttemptFeedback } from './attemptFeedbackRuntime';
import type { SubjectValidationResult } from './subjectValidationRuntime';
import type { LearningEvidenceWriteResult } from './evidenceAndRevisionContracts';
import type { RevisionQueueUpdateResult } from './evidenceAndRevisionContracts';
import type { StateTransitionResult } from './tutorResponseStateMachine';

export interface AssemblerInput {
  input: TutorTurnOrchestrationInput;
  intent: TutorTurnIntent;
  responseMove: TutorResponseMove;
  responseText: string;
  stateTransition: StateTransitionResult;
  hint?: SocraticHint;
  stepCheck?: StepCheckResult;
  practiceQuestion?: PracticeQuestionPlan;
  mistakeAnalysis?: MistakeAnalysis;
  attemptFeedback?: AttemptFeedback;
  subjectValidation?: SubjectValidationResult;
  evidenceWrite?: LearningEvidenceWriteResult;
  revisionUpdate?: RevisionQueueUpdateResult;
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

export function assembleTutorTurnResult(assemblerInput: AssemblerInput): TutorTurnOrchestrationResult {
  return {
    requestId: assemblerInput.input.requestId,
    tutorSessionId: assemblerInput.input.tutorSessionId,
    intent: assemblerInput.intent,
    responseMove: assemblerInput.responseMove,
    state: {
      initialState: assemblerInput.stateTransition.initialState,
      finalState: assemblerInput.stateTransition.finalState,
      transitionReason: assemblerInput.stateTransition.transitionReason,
    },
    responseText: assemblerInput.responseText,
    hint: assemblerInput.hint,
    stepCheck: assemblerInput.stepCheck,
    attemptFeedback: assemblerInput.attemptFeedback,
    practiceQuestion: assemblerInput.practiceQuestion,
    mistakeAnalysis: assemblerInput.mistakeAnalysis,
    subjectValidation: assemblerInput.subjectValidation,
    evidenceWrite: assemblerInput.evidenceWrite,
    revisionUpdate: assemblerInput.revisionUpdate,
    policyTags: assemblerInput.policyTags,
    archiveMetadata: assemblerInput.archiveMetadata,
    safeMemoryMetadata: assemblerInput.safeMemoryMetadata,
    clientSafeMetadata: assemblerInput.clientSafeMetadata,
  };
}
