export type CopilotDisplayMode = 'widget' | 'fullscreen';

export type CopilotSessionPurpose = 'copilot_default';

export type CopilotSessionStatus =
  | 'active'
  | 'paused'
  | 'closed'
  | 'archived';

export type CopilotSessionContinuityStatus =
  | 'created'
  | 'resumed'
  | 'mode_updated'
  | 'ownership_verified';

export interface CopilotClientContext {
  displayMode?: CopilotDisplayMode;
  activeSchoolPage?: string;
  locale?: string;
}

export interface ResolveCopilotSessionInput {
  requestId: string;
  authorizationHeader?: string;
  requestedTutorSessionId?: string;
  clientContext?: CopilotClientContext;
}

export interface VerifiedCopilotSessionContext {
  requestId: string;
  schoolId: string;
  externalStudentId: string;
  tutorLearnerId: string;
  tutorSessionId: string;
  sessionPurpose: CopilotSessionPurpose;
  sessionStatus: CopilotSessionStatus;
  continuityStatus: CopilotSessionContinuityStatus;
  displayMode?: CopilotDisplayMode;
  activeSchoolPage?: string;
  safeToContinueTutor: boolean;
}

export interface CopilotSessionContinuityError {
  ok: false;
  requestId: string;
  errorCode:
    | 'missing_token'
    | 'invalid_token'
    | 'expired_token'
    | 'missing_student_identity'
    | 'role_not_learner'
    | 'inactive_student'
    | 'session_not_found'
    | 'session_ownership_mismatch'
    | 'session_closed'
    | 'session_binding_failed'
    | 'unknown';
  httpStatus: 401 | 403 | 404 | 409 | 503;
  safeMessage: string;
}
