import type {
  CurriculumTrack,
  EnrollmentStatus,
  SchoolAuthFailureCode,
  TutorLanguageMode,
} from './schoolAuthBridgeContracts';
import type {
  CopilotDisplayMode,
  CopilotSessionContinuityStatus,
  CopilotSessionPurpose,
} from './copilotSessionContinuityContracts';

export interface TutorClientContext {
  displayMode?: 'widget' | 'fullscreen';
  activeSchoolPage?: string;
  locale?: string;
}

export interface CopilotHandoffRequest {
  clientContext?: TutorClientContext;
}

export interface CopilotHandoffResponse {
  ok: true;
  requestId: string;
  tutorLearnerId: string;
  tutorSessionId: string;
  schoolId: string;
  classId?: string;
  grade?: string;
  displayName?: string;
  enrollmentStatus: EnrollmentStatus;
  preferredLanguage: TutorLanguageMode;
  curriculumTrack: CurriculumTrack;
  sessionStatus: 'created' | 'resumed';
  continuityStatus?: CopilotSessionContinuityStatus;
  sessionPurpose?: CopilotSessionPurpose;
  displayMode?: CopilotDisplayMode;
  activeSchoolPage?: string;
  safeToStartTutor: boolean;
}

export interface CopilotHandoffErrorResponse {
  ok: false;
  requestId: string;
  errorCode:
    | SchoolAuthFailureCode
    | 'session_binding_failed'
    | 'student_context_failed';
  safeMessage: string;
}
