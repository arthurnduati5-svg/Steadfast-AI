import type {
  Task032ApprovedSchoolCanaryConfig,
  Task032CanaryConsentMatrix,
  Task032CanaryCohortMember,
} from '../../contracts/task032ControlledCanaryContracts';

export const TASK032_TEST_SCHOOL_ID = 'school_task032_canary_safe';
export const TASK032_TEST_TENANT_ID = 'tenant_task032_canary_safe';
export const TASK032_TEST_COHORT_ID = 'canary_cohort_task032_safe';
export const TASK032_TEST_CANARY_RUN_ID = 'canary_run_task032_safe';
export const TASK032_TEST_ADMIN_HASH = 'admin_hash_task032_safe_001';
export const TASK032_TEST_OPERATOR_HASH = 'operator_hash_task032_safe_001';
export const TASK032_TEST_TEACHER_HASH = 'teacher_hash_task032_safe_001';
export const TASK032_TEST_STUDENT_HASH_001 = 'student_hash_task032_safe_001';
export const TASK032_TEST_STUDENT_HASH_002 = 'student_hash_task032_safe_002';
export const TASK032_TEST_UNKNOWN_HASH = 'unknown_hash_task032_safe_001';
export const TASK032_TEST_CLASS_ID = 'class_task032_safe_001';
export const TASK032_TEST_SUBJECT_ID = 'subject_task032_safe_math_001';
export const TASK032_TEST_CURRICULUM_SCOPE = 'curriculum_scope_task032_safe_001';

export function createTask032ApprovedCanaryFixture(): Task032ApprovedSchoolCanaryConfig {
  return {
    schoolId: TASK032_TEST_SCHOOL_ID,
    tenantId: TASK032_TEST_TENANT_ID,
    canaryCohortId: TASK032_TEST_COHORT_ID,
    canaryRunId: TASK032_TEST_CANARY_RUN_ID,
    canaryName: 'Task 032 Controlled Canary Dry Run',
    approvedByRole: 'admin',
    approvedByActorHash: TASK032_TEST_ADMIN_HASH,
    approvalTimestamp: new Date().toISOString(),
    maxCanaryPercent: 5,
    maxCanaryStudents: 25,
    eligibleStudentCount: 20,
    requestedStudentCount: 10,
    effectiveStudentCap: 10,
    curriculumScopes: [TASK032_TEST_CURRICULUM_SCOPE],
    sourceScopes: ['task032_safe_source_scope_001'],
    subjectScopes: [TASK032_TEST_SUBJECT_ID],
    teacherAssignmentScopes: [TASK032_TEST_CLASS_ID],
    monitoringWindowStart: new Date(Date.now() - 86400000).toISOString(),
    monitoringWindowEnd: new Date(Date.now() + 86400000).toISOString(),
    rollbackOwnerActorHash: TASK032_TEST_ADMIN_HASH,
    safeguardingEscalationActorHash: TASK032_TEST_ADMIN_HASH,
    deenReviewActorHash: TASK032_TEST_ADMIN_HASH,
    studentNoticeReady: true,
    teacherNoticeReady: true,
    adminRunbookReady: true,
    rollbackPlanReady: true,
    killSwitchReady: true,
  };
}

export function createTask032ConsentMatrixFixture(): Task032CanaryConsentMatrix {
  return {
    schoolAuthorized: true,
    adminApproved: true,
    teacherNotified: true,
    studentNoticeReady: true,
    guardianPolicyStatus: 'not_required_by_school_policy',
    guardianConsentSatisfiedIfRequired: true,
    guardianConsentProofSummaryFieldExists: true,
    rollbackOwnerAssigned: true,
    safeguardingContactAssigned: true,
    deenReviewContactAssignedIfNeeded: true,
    privacyBoundaryAccepted: true,
    canarySizeAccepted: true,
    monitoringAccepted: true,
  };
}

export function createTask032CohortMembersFixture(): Task032CanaryCohortMember[] {
  return [
    {
      studentHash: TASK032_TEST_STUDENT_HASH_001,
      approvedSchoolId: TASK032_TEST_SCHOOL_ID,
      approvedCohortId: TASK032_TEST_COHORT_ID,
      isActive: true,
      curriculumScope: TASK032_TEST_CURRICULUM_SCOPE,
      consentStatus: 'granted',
      excludedByPolicy: false,
    },
    {
      studentHash: TASK032_TEST_STUDENT_HASH_002,
      approvedSchoolId: TASK032_TEST_SCHOOL_ID,
      approvedCohortId: TASK032_TEST_COHORT_ID,
      isActive: true,
      curriculumScope: TASK032_TEST_CURRICULUM_SCOPE,
      consentStatus: 'granted',
      excludedByPolicy: false,
    },
  ];
}

export function createTask032OutOfCohortStudentFixture(): Task032CanaryCohortMember {
  return {
    studentHash: 'student_hash_task032_safe_outside_001',
    approvedSchoolId: TASK032_TEST_SCHOOL_ID,
    approvedCohortId: 'different_cohort_task032_safe',
    isActive: true,
    curriculumScope: TASK032_TEST_CURRICULUM_SCOPE,
    consentStatus: 'granted',
    excludedByPolicy: false,
  };
}

export function createTask032InactiveStudentFixture(): Task032CanaryCohortMember {
  return {
    studentHash: 'student_hash_task032_safe_inactive_001',
    approvedSchoolId: TASK032_TEST_SCHOOL_ID,
    approvedCohortId: TASK032_TEST_COHORT_ID,
    isActive: false,
    curriculumScope: TASK032_TEST_CURRICULUM_SCOPE,
    consentStatus: 'granted',
    excludedByPolicy: false,
  };
}
