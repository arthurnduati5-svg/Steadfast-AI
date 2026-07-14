import { AssessmentPolicyFamily, AssessmentPolicyDecision } from '../../contracts/assessmentPolicyContracts';

export const MARKING_INVOCATION_POLICY_DEFAULTS: Record<string, {
  missingDecision: AssessmentPolicyDecision;
  defaultBlockedStatus: string;
}> = {
  MARKING_INVOCATION_REQUEST: {
    missingDecision: {
      decisionId: 'policy-default-marking-invocation-request-missing',
      policyFamily: 'MARKING_INVOCATION_REQUEST' as AssessmentPolicyFamily,
      status: 'MISSING',
      allowed: true,
      reasonCode: 'POLICY_MISSING',
      safeMessage: 'Marking invocation request creation is not configured. Please contact your system administrator.',
      missingPolicyKeys: ['marking.invocation.request'],
      requiredOwner: 'school_admin',
      blockedOperation: 'createInvocationRequest',
      policyVersionRef: '0.0.0',
      createdAt: new Date().toISOString(),
    },
    defaultBlockedStatus: 'blocked',
  },
  SUBMITTED_SNAPSHOT_INTAKE: {
    missingDecision: {
      decisionId: 'policy-default-submitted-snapshot-intake-missing',
      policyFamily: 'MARKING_INVOCATION_REQUEST' as AssessmentPolicyFamily,
      status: 'MISSING',
      allowed: true,
      reasonCode: 'POLICY_MISSING',
      safeMessage: 'Submitted snapshot intake is not configured. Snapshot intake is blocked.',
      missingPolicyKeys: ['marking.snapshot.intake'],
      requiredOwner: 'school_admin',
      blockedOperation: 'intakeSubmissionSnapshot',
      policyVersionRef: '0.0.0',
      createdAt: new Date().toISOString(),
    },
    defaultBlockedStatus: 'blocked',
  },
  MARKING_BATCH_PLANNING: {
    missingDecision: {
      decisionId: 'policy-default-marking-batch-planning-missing',
      policyFamily: 'MARKING_INVOCATION_REQUEST' as AssessmentPolicyFamily,
      status: 'MISSING',
      allowed: true,
      reasonCode: 'POLICY_MISSING',
      safeMessage: 'Marking batch planning is not configured. Batch creation is blocked.',
      missingPolicyKeys: ['marking.batch.planning'],
      requiredOwner: 'school_admin',
      blockedOperation: 'createMarkingBatch',
      policyVersionRef: '0.0.0',
      createdAt: new Date().toISOString(),
    },
    defaultBlockedStatus: 'blocked',
  },
  DETERMINISTIC_MARKING_INVOCATION: {
    missingDecision: {
      decisionId: 'policy-default-deterministic-marking-invocation-missing',
      policyFamily: 'MARKING_INVOCATION_REQUEST' as AssessmentPolicyFamily,
      status: 'MISSING',
      allowed: true,
      reasonCode: 'POLICY_MISSING',
      safeMessage: 'Deterministic marking invocation is not configured. Dispatching to teacher review.',
      missingPolicyKeys: ['marking.deterministic.invocation'],
      requiredOwner: 'school_admin',
      blockedOperation: 'executeDeterministicBatch',
      policyVersionRef: '0.0.0',
      createdAt: new Date().toISOString(),
    },
    defaultBlockedStatus: 'blocked',
  },
  RUBRIC_MARKING_INVOCATION: {
    missingDecision: {
      decisionId: 'policy-default-rubric-marking-invocation-missing',
      policyFamily: 'MARKING_INVOCATION_REQUEST' as AssessmentPolicyFamily,
      status: 'MISSING',
      allowed: true,
      reasonCode: 'POLICY_MISSING',
      safeMessage: 'Rubric marking invocation is not configured. Blocking rubric scoring.',
      missingPolicyKeys: ['marking.rubric.invocation'],
      requiredOwner: 'school_admin',
      blockedOperation: 'executeRubricDeterministicBatchItem',
      policyVersionRef: '0.0.0',
      createdAt: new Date().toISOString(),
    },
    defaultBlockedStatus: 'blocked',
  },
  TEACHER_REVIEW_DISPATCH: {
    missingDecision: {
      decisionId: 'policy-default-teacher-review-dispatch-missing',
      policyFamily: 'MARKING_INVOCATION_REQUEST' as AssessmentPolicyFamily,
      status: 'MISSING',
      allowed: true,
      reasonCode: 'POLICY_MISSING',
      safeMessage: 'Teacher review dispatch is not configured. Blocking teacher review routing.',
      missingPolicyKeys: ['teacher.review.dispatch'],
      requiredOwner: 'school_admin',
      blockedOperation: 'dispatchBatchItemToTeacherReview',
      policyVersionRef: '0.0.0',
      createdAt: new Date().toISOString(),
    },
    defaultBlockedStatus: 'blocked',
  },
  MARKING_RESULT_VERSION_LINK: {
    missingDecision: {
      decisionId: 'policy-default-marking-result-version-link-missing',
      policyFamily: 'MARKING_INVOCATION_REQUEST' as AssessmentPolicyFamily,
      status: 'MISSING',
      allowed: true,
      reasonCode: 'POLICY_MISSING',
      safeMessage: 'Marking result version linking is not configured. Blocking result links.',
      missingPolicyKeys: ['marking.result.version.link'],
      requiredOwner: 'school_admin',
      blockedOperation: 'linkResultVersionToBatchItem',
      policyVersionRef: '0.0.0',
      createdAt: new Date().toISOString(),
    },
    defaultBlockedStatus: 'blocked',
  },
  MARKING_INVOCATION_PROJECTION: {
    missingDecision: {
      decisionId: 'policy-default-marking-invocation-projection-missing',
      policyFamily: 'MARKING_INVOCATION_REQUEST' as AssessmentPolicyFamily,
      status: 'MISSING',
      allowed: true,
      reasonCode: 'POLICY_MISSING',
      safeMessage: 'Marking invocation projection is not configured. Returning minimal safe projection.',
      missingPolicyKeys: ['marking.invocation.projection'],
      requiredOwner: 'school_admin',
      blockedOperation: 'toStudentSafeProjection',
      policyVersionRef: '0.0.0',
      createdAt: new Date().toISOString(),
    },
    defaultBlockedStatus: 'blocked',
  },
};

export const ALLOWED_INVOCATION_MUTATION_ROLES = ['teacher', 'lead_teacher', 'department_head', 'admin', 'system_job'];

export const BLOCKED_INVOCATION_MUTATION_ROLES = ['student', 'parent', 'guest', 'unknown'];
