export type SchoolAuthVerificationSource =
  | 'existing_school_auth_middleware'
  | 'local_jwt_verification'
  | 'school_system_lookup'
  | 'test_mock';

export type SchoolAuthFailureCode =
  | 'missing_token'
  | 'invalid_token'
  | 'expired_token'
  | 'missing_student_identity'
  | 'inactive_student'
  | 'school_lookup_failed'
  | 'role_not_learner'
  | 'unknown';

export type EnrollmentStatus =
  | 'active'
  | 'completed'
  | 'transferred'
  | 'left_school'
  | 'unknown';

export type CurriculumTrack =
  | 'cambridge_academic'
  | 'madrasa_deen'
  | 'mixed_academic_deen'
  | 'general_enrichment'
  | 'unknown';

export type TutorLanguageMode =
  | 'english'
  | 'arabic_terms'
  | 'arabic_full'
  | 'arabic_english'
  | 'kiswahili_future'
  | 'auto_future';

export interface SchoolAuthBridgeInput {
  authorizationHeader?: string;
  requestId: string;
}

export interface VerifiedSchoolIdentityContext {
  authStatus: 'verified';
  externalStudentId: string;
  schoolId: string;
  role: 'learner';
  classId?: string;
  grade?: string;
  age?: number;
  displayName?: string;
  enrollmentStatus: EnrollmentStatus;
  preferredLanguage?: TutorLanguageMode;
  curriculumTrack?: CurriculumTrack;
  verifiedAt: string;
  verificationSource: SchoolAuthVerificationSource;
}

export interface SchoolAuthBridgeFailure {
  authStatus: SchoolAuthFailureCode;
  httpStatus: 401 | 403 | 503;
  safeMessage: string;
}

export type SchoolAuthBridgeResult =
  | { ok: true; context: VerifiedSchoolIdentityContext }
  | { ok: false; failure: SchoolAuthBridgeFailure };
