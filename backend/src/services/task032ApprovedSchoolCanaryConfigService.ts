import type { Task032ApprovedSchoolCanaryConfig } from '../contracts/task032ControlledCanaryActivationContracts';

const CONFIGURED_CANARY_CAP = 50;

export async function createTask032ApprovedSchoolCanaryConfig(input: any): Promise<Task032ApprovedSchoolCanaryConfig> {
  const blockingIssues: string[] = [];

  if (!input.schoolId) blockingIssues.push('missing_schoolId');
  if (!input.approvedByRole) blockingIssues.push('missing_approvedByRole');
  if (!input.activationMode) blockingIssues.push('missing_activationMode');
  if (input.maxCanaryLearners == null) blockingIssues.push('missing_maxCanaryLearners');
  else if (input.maxCanaryLearners > CONFIGURED_CANARY_CAP) blockingIssues.push(`maxCanaryLearners_exceeds_cap: ${input.maxCanaryLearners} > ${CONFIGURED_CANARY_CAP}`);
  if (!input.allowedClassIds || !Array.isArray(input.allowedClassIds) || input.allowedClassIds.length === 0) blockingIssues.push('missing_or_empty_allowedClassIds');
  if (!input.allowedSubjectIds || !Array.isArray(input.allowedSubjectIds) || input.allowedSubjectIds.length === 0) blockingIssues.push('missing_or_empty_allowedSubjectIds');
  if (!input.allowedCohortIds || !Array.isArray(input.allowedCohortIds) || input.allowedCohortIds.length === 0) blockingIssues.push('missing_or_empty_allowedCohortIds');
  if (!input.canaryStartWindow) blockingIssues.push('missing_canaryStartWindow');
  if (!input.canaryEndWindow) blockingIssues.push('missing_canaryEndWindow');
  if (!input.rollbackPolicyId) blockingIssues.push('missing_rollback_policy');
  if (!input.incidentPolicyId) blockingIssues.push('missing_incident_policy');
  if (!input.privacyBoundaryId) blockingIssues.push('missing_privacy_boundary');
  if (!input.healthBudgetId) blockingIssues.push('missing_health_budget');
  if (!input.consentAuthorizationPolicyId) blockingIssues.push('missing_consent_authorization');
  if (!input.sourceGovernancePolicyId) blockingIssues.push('missing_source_governance');
  if (!input.deenBoundaryPolicyId) blockingIssues.push('missing_deen_boundary');
  if (!input.socraticIntegrityPolicyId) blockingIssues.push('missing_socratic_integrity');
  if (input.allowedCohortIds?.includes('*') || input.allowedCohortIds?.includes('all')) blockingIssues.push('school_wide_cohort_not_allowed');
  if (input.approvedByRole && !['school_admin', 'system_admin', 'internal_operator', 'authorized_canary_operator'].includes(input.approvedByRole)) blockingIssues.push('unknown_approval_role');

  const timestamp = new Date().toISOString();
  const configId = `canary_config_${input.schoolId}_${Date.now()}`;

  const config: Task032ApprovedSchoolCanaryConfig = {
    configId,
    schoolId: input.schoolId,
    approvedByRole: input.approvedByRole,
    activationMode: input.activationMode,
    maxCanaryLearners: Math.min(input.maxCanaryLearners || 0, CONFIGURED_CANARY_CAP),
    allowedClassIds: input.allowedClassIds || [],
    allowedSubjectIds: input.allowedSubjectIds || [],
    allowedCohortIds: input.allowedCohortIds || [],
    canaryStartWindow: input.canaryStartWindow,
    canaryEndWindow: input.canaryEndWindow,
    rollbackPolicyId: input.rollbackPolicyId,
    incidentPolicyId: input.incidentPolicyId,
    privacyBoundaryId: input.privacyBoundaryId,
    healthBudgetId: input.healthBudgetId,
    consentAuthorizationPolicyId: input.consentAuthorizationPolicyId,
    sourceGovernancePolicyId: input.sourceGovernancePolicyId,
    deenBoundaryPolicyId: input.deenBoundaryPolicyId,
    socraticIntegrityPolicyId: input.socraticIntegrityPolicyId,
    blockingIssues
  };

  return config;
}

export async function validateTask032ApprovedSchoolCanaryConfig(input: any): Promise<Task032ApprovedSchoolCanaryConfig> {
  return createTask032ApprovedSchoolCanaryConfig(input);
}
