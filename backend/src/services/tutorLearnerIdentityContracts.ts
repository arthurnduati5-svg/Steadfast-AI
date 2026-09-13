import type { EnrollmentStatus } from './schoolAuthBridgeContracts';

export interface TutorLearnerIdentityMapRecord {
  tutorLearnerId: string;
  externalStudentId: string;
  schoolId: string;
  classId?: string;
  grade?: string;
  status: 'active' | 'completed' | 'transferred' | 'left_school' | 'archived';
  firstSeenAt: string;
  lastSeenAt: string;
}

export interface TutorLearnerMappingInput {
  externalStudentId: string;
  schoolId: string;
  classId?: string;
  grade?: string;
  enrollmentStatus: EnrollmentStatus;
}

export interface TutorLearnerMappingResult {
  tutorLearnerId: string;
  createdNew: boolean;
  record: TutorLearnerIdentityMapRecord;
}
