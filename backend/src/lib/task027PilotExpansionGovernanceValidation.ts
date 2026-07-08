import {
  TASK027_FORBIDDEN_FIELDS,
} from '../contracts/task027PilotExpansionGovernanceContracts';
import type {
  ReviewActorRole,
  Task027GovernanceContext,
  Task027Task026DependencyGateInput,
  Task027PilotExecutionEvidenceInput,
  Task027LearningQualityReviewInput,
  Task027CohortExpansionProposalInput,
  Task027CohortExpansionEligibilityInput,
  Task027ExpansionRiskAssessmentInput,
  Task027TeacherReviewInput,
  Task027SchoolAdminApprovalInput,
  Task027ParentLearnerFeedbackReadinessInput,
  Task027SafeguardingReviewInput,
  Task027DeenContentReviewInput,
  Task027PrivacyReviewInput,
  Task027SocraticIntegrityReviewInput,
  Task027AcademicIntegrityReviewInput,
  Task027OperationsHealthBudgetInput,
  Task027PauseRollbackReadinessInput,
  Task027ExpansionEvidencePackInput,
  Task027GovernanceDecisionInput,
  Task027PilotExecutionEvidenceSummary,
} from '../contracts/task027PilotExpansionGovernanceContracts';

const LEARNER_PARENT_LIKE_ROLES = ['learner', 'student', 'parent', 'peer', 'anonymous', 'unknown'];

const CROSS_SCHOOL_FIELD_PATTERNS = [
  'otherSchoolId', 'crossSchoolActor', 'externalSchoolRef',
  'otherActorSchoolId', 'crossSchoolScope', 'remoteSchoolId',
];

const LEARNER_PARENT_CONTROL_FIELD_PATTERNS = [
  'learnerInitiated', 'parentOverride', 'studentRequestedControl',
  'learnerControlRequest', 'parentControlRequest',
];

const AUTO_EXPANSION_FIELD_PATTERNS = [
  'autoExpand', 'automaticActivation', 'scheduleExpansion',
  'autoActivateExpansion', 'unconditionalExpand',
];

const EXPANDED_COHORT_ACTIVATION_FIELD_PATTERNS = [
  'expandedCohortActivation', 'activateExpandedCohort',
  'cohortAutoActivate', 'expandCohortNow',
];

const NEW_LEARNER_INVITATION_FIELD_PATTERNS = [
  'inviteNewLearners', 'newLearnerInvitation', 'addLearner',
  'autoInviteLearner', 'bulkLearnerInvite',
];

const LIVE_EXTERNAL_COMMS_FIELD_PATTERNS = [
  'liveExternalComm', 'externalApiCall', 'directExternalNotify',
  'liveCommunicationChannel', 'externalPushNotify',
];

const PRODUCTION_DEPLOYMENT_FIELD_PATTERNS = [
  'productionDeploy', 'deployToProd', 'prodEnvironment',
  'productionRelease', 'deploymentTarget',
];

const LIVE_AI_PROVIDER_FIELD_PATTERNS = [
  'liveAiProviderConfig', 'directAiProvider', 'aiProviderEndpoint',
  'aiProviderDirect', 'liveModelEndpoint',
];

const LIVE_SCHOOL_CONNECTOR_WRITE_FIELD_PATTERNS = [
  'schoolConnectorWrite', 'schoolConnectorDirect', 'lmsWriteBack',
  'schoolConnectorEndpoint', 'connectorWriteEnabled',
];

function hasMatchingFieldKey(
  obj: Record<string, unknown>,
  patterns: string[],
): string | null {
  for (const key of Object.keys(obj)) {
    for (const pattern of patterns) {
      if (key === pattern || key.toLowerCase().includes(pattern.toLowerCase())) {
        return key;
      }
    }
  }
  return null;
}

function collectForbiddenFieldErrors(
  obj: Record<string, unknown>,
  path: string = '',
): string[] {
  const errors: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    if ((TASK027_FORBIDDEN_FIELDS as readonly string[]).includes(key)) {
      const fullPath = path ? `${path}.${key}` : key;
      errors.push(`Forbidden field "${fullPath}" is not allowed in governance input.`);
    }
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      const nested = collectForbiddenFieldErrors(
        value as Record<string, unknown>,
        path ? `${path}.${key}` : key,
      );
      errors.push(...nested);
    }
    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        const item = value[i];
        if (item !== null && typeof item === 'object') {
          const nested = collectForbiddenFieldErrors(
            item as Record<string, unknown>,
            path ? `${path}.${key}[${i}]` : `${key}[${i}]`,
          );
          errors.push(...nested);
        }
      }
    }
  }
  return errors;
}

function collectGovernanceRuleErrors(
  obj: Record<string, unknown>,
): string[] {
  const errors: string[] = [];

  const crossSchoolField = hasMatchingFieldKey(obj, CROSS_SCHOOL_FIELD_PATTERNS);
  if (crossSchoolField) {
    errors.push(`Cross-school actor scenario detected via field "${crossSchoolField}". Governance inputs must be scoped to a single school.`);
  }

  const learnerControlField = hasMatchingFieldKey(obj, LEARNER_PARENT_CONTROL_FIELD_PATTERNS);
  if (learnerControlField) {
    errors.push(`Learner/parent control request detected via field "${learnerControlField}". Learners and parents cannot initiate governance control actions.`);
  }

  const autoExpandField = hasMatchingFieldKey(obj, AUTO_EXPANSION_FIELD_PATTERNS);
  if (autoExpandField) {
    errors.push(`Automatic expansion activation detected via field "${autoExpandField}". Expansion must be explicitly governed, not automatic.`);
  }

  const expandedCohortField = hasMatchingFieldKey(obj, EXPANDED_COHORT_ACTIVATION_FIELD_PATTERNS);
  if (expandedCohortField) {
    errors.push(`Expanded cohort activation detected via field "${expandedCohortField}". Cohort activation must go through governance review.`);
  }

  const newLearnerField = hasMatchingFieldKey(obj, NEW_LEARNER_INVITATION_FIELD_PATTERNS);
  if (newLearnerField) {
    errors.push(`New learner invitation detected via field "${newLearnerField}". Adding new learners requires separate controlled flow.`);
  }

  const liveCommField = hasMatchingFieldKey(obj, LIVE_EXTERNAL_COMMS_FIELD_PATTERNS);
  if (liveCommField) {
    errors.push(`Live external communication field detected via "${liveCommField}". External communications are not permitted in governance input.`);
  }

  const prodDeployField = hasMatchingFieldKey(obj, PRODUCTION_DEPLOYMENT_FIELD_PATTERNS);
  if (prodDeployField) {
    errors.push(`Production deployment field detected via "${prodDeployField}". Deployment configuration is not part of governance review.`);
  }

  const liveAiField = hasMatchingFieldKey(obj, LIVE_AI_PROVIDER_FIELD_PATTERNS);
  if (liveAiField) {
    errors.push(`Live AI provider field detected via "${liveAiField}". Direct AI provider configuration is not permitted in governance input.`);
  }

  const connectorWriteField = hasMatchingFieldKey(obj, LIVE_SCHOOL_CONNECTOR_WRITE_FIELD_PATTERNS);
  if (connectorWriteField) {
    errors.push(`Live school connector write field detected via "${connectorWriteField}". School connector writes are not part of governance input.`);
  }

  return errors;
}

function validateIsNonEmptyString(value: unknown, fieldName: string): string | null {
  if (typeof value !== 'string' || value.trim() === '') {
    return `"${fieldName}" must be a non-empty string.`;
  }
  return null;
}

function validateIsString(value: unknown, fieldName: string): string | null {
  if (typeof value !== 'string') {
    return `"${fieldName}" must be a string.`;
  }
  return null;
}

function validateIsBoolean(value: unknown, fieldName: string): string | null {
  if (typeof value !== 'boolean') {
    return `"${fieldName}" must be a boolean.`;
  }
  return null;
}

function validateIsNumber(value: unknown, fieldName: string): string | null {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return `"${fieldName}" must be a number.`;
  }
  return null;
}

function validateIsStringArray(value: unknown, fieldName: string): string | null {
  if (!Array.isArray(value)) {
    return `"${fieldName}" must be an array.`;
  }
  for (let i = 0; i < value.length; i++) {
    if (typeof value[i] !== 'string') {
      return `"${fieldName}[${i}]" must be a string.`;
    }
  }
  return null;
}

function validateIsObject(value: unknown, fieldName: string): string | null {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return `"${fieldName}" must be a non-null object.`;
  }
  return null;
}

function validateSharedRules(input: unknown, requiredFields: { name: string; type: string }[]): string[] {
  const errors: string[] = [];

  if (input === null || input === undefined || typeof input !== 'object' || Array.isArray(input)) {
    errors.push('Input must be a non-null object.');
    return errors;
  }

  const obj = input as Record<string, unknown>;

  for (const field of requiredFields) {
    switch (field.type) {
      case 'string':
      case 'nonEmptyString': {
        const err = validateIsNonEmptyString(obj[field.name], field.name);
        if (err) errors.push(err);
        break;
      }
      case 'optionalString': {
        if (obj[field.name] !== undefined) {
          const err = validateIsString(obj[field.name], field.name);
          if (err) errors.push(err);
        }
        break;
      }
      case 'boolean': {
        const err = validateIsBoolean(obj[field.name], field.name);
        if (err) errors.push(err);
        break;
      }
      case 'number': {
        const err = validateIsNumber(obj[field.name], field.name);
        if (err) errors.push(err);
        break;
      }
      case 'stringArray': {
        const err = validateIsStringArray(obj[field.name], field.name);
        if (err) errors.push(err);
        break;
      }
      case 'object': {
        const err = validateIsObject(obj[field.name], field.name);
        if (err) errors.push(err);
        break;
      }
    }
  }

  return errors;
}

function validateGovernanceRules(input: unknown): string[] {
  if (input === null || input === undefined || typeof input !== 'object' || Array.isArray(input)) {
    return [];
  }
  const obj = input as Record<string, unknown>;
  const errors: string[] = [];

  const forbiddenErrors = collectForbiddenFieldErrors(obj);
  errors.push(...forbiddenErrors);

  const ruleErrors = collectGovernanceRuleErrors(obj);
  errors.push(...ruleErrors);

  return errors;
}

function schoolIdIsPresentAndNonEmpty(input: unknown): string | null {
  if (input === null || input === undefined || typeof input !== 'object' || Array.isArray(input)) {
    return null;
  }
  const obj = input as Record<string, unknown>;
  return validateIsNonEmptyString(obj.schoolId, 'schoolId');
}

function actorIdIsPresent(input: unknown): string | null {
  if (input === null || input === undefined || typeof input !== 'object' || Array.isArray(input)) {
    return null;
  }
  const obj = input as Record<string, unknown>;
  return validateIsNonEmptyString(obj.actorId, 'actorId');
}

function actorRoleIsPresent(input: unknown): string | null {
  if (input === null || input === undefined || typeof input !== 'object' || Array.isArray(input)) {
    return null;
  }
  const obj = input as Record<string, unknown>;
  return validateIsNonEmptyString(obj.actorRole, 'actorRole');
}

function rejectLearnerParentRole(input: unknown): string | null {
  if (input === null || input === undefined || typeof input !== 'object' || Array.isArray(input)) {
    return null;
  }
  const obj = input as Record<string, unknown>;
  if (typeof obj.actorRole === 'string' && LEARNER_PARENT_LIKE_ROLES.includes(obj.actorRole.toLowerCase())) {
    return `Actor role "${obj.actorRole}" is not authorized for governance operations. Learners, parents, and peers cannot perform governance actions.`;
  }
  return null;
}

function rejectCrossSchoolScenario(input: unknown): string | null {
  if (input === null || input === undefined || typeof input !== 'object' || Array.isArray(input)) {
    return null;
  }
  return null;
}

export function rejectTask027ForbiddenFields(obj: Record<string, unknown>): string[] {
  return collectForbiddenFieldErrors(obj);
}

export function redactTask027SensitiveValue(value: string): string {
  if (!value) return value;
  return '[REDACTED]';
}

export function createSafeTask027ValidationError(
  message: string,
  errors: string[],
): { ok: false; errors: string[]; safeMessage: string } {
  return { ok: false, errors, safeMessage: message };
}

export function validateTask027GovernanceContext(
  input: unknown,
): { ok: boolean; data?: Task027GovernanceContext; errors: string[] } {
  const errors: string[] = [];

  const sharedErrors = validateSharedRules(input, [
    { name: 'schoolId', type: 'nonEmptyString' },
    { name: 'actorId', type: 'nonEmptyString' },
    { name: 'actorRole', type: 'nonEmptyString' },
    { name: 'pilotRunId', type: 'nonEmptyString' },
    { name: 'verifiedSchoolIdentity', type: 'boolean' },
    { name: 'task026CommitVerified', type: 'boolean' },
    { name: 'task025Accepted', type: 'boolean' },
    { name: 'task024Accepted', type: 'boolean' },
    { name: 'governanceReviewId', type: 'optionalString' },
  ]);
  errors.push(...sharedErrors);

  if (errors.length === 0) {
    const roleErr = rejectLearnerParentRole(input);
    if (roleErr) errors.push(roleErr);
  }

  const governanceErrors = validateGovernanceRules(input);
  errors.push(...governanceErrors);

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const obj = input as Record<string, unknown>;
  return {
    ok: true,
    data: {
      schoolId: (obj.schoolId as string).trim(),
      actorId: obj.actorId as string,
      actorRole: obj.actorRole as ReviewActorRole,
      pilotRunId: obj.pilotRunId as string,
      governanceReviewId: obj.governanceReviewId as string | undefined,
      verifiedSchoolIdentity: obj.verifiedSchoolIdentity as boolean,
      task026CommitVerified: obj.task026CommitVerified as boolean,
      task025Accepted: obj.task025Accepted as boolean,
      task024Accepted: obj.task024Accepted as boolean,
    },
    errors: [],
  };
}

export function validateTask027Task026DependencyGateInput(
  input: unknown,
): { ok: boolean; data?: Task027Task026DependencyGateInput; errors: string[] } {
  const errors: string[] = [];

  const sharedErrors = validateSharedRules(input, [
    { name: 'schoolId', type: 'nonEmptyString' },
    { name: 'actorRole', type: 'nonEmptyString' },
    { name: 'executionRunId', type: 'nonEmptyString' },
    { name: 'commitHash', type: 'nonEmptyString' },
  ]);
  errors.push(...sharedErrors);

  if (errors.length === 0) {
    const roleErr = rejectLearnerParentRole(input);
    if (roleErr) errors.push(roleErr);
  }

  const governanceErrors = validateGovernanceRules(input);
  errors.push(...governanceErrors);

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const obj = input as Record<string, unknown>;
  return {
    ok: true,
    data: {
      schoolId: (obj.schoolId as string).trim(),
      actorRole: obj.actorRole as ReviewActorRole,
      executionRunId: obj.executionRunId as string,
      commitHash: obj.commitHash as string,
    },
    errors: [],
  };
}

export function validateTask027PilotExecutionEvidenceInput(
  input: unknown,
): { ok: boolean; data?: Task027PilotExecutionEvidenceInput; errors: string[] } {
  const errors: string[] = [];

  const sharedErrors = validateSharedRules(input, [
    { name: 'schoolId', type: 'nonEmptyString' },
    { name: 'pilotRunId', type: 'nonEmptyString' },
    { name: 'executionRunId', type: 'nonEmptyString' },
  ]);
  errors.push(...sharedErrors);

  const governanceErrors = validateGovernanceRules(input);
  errors.push(...governanceErrors);

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const obj = input as Record<string, unknown>;
  return {
    ok: true,
    data: {
      schoolId: (obj.schoolId as string).trim(),
      pilotRunId: obj.pilotRunId as string,
      executionRunId: obj.executionRunId as string,
    },
    errors: [],
  };
}

export function validateTask027LearningQualityReviewInput(
  input: unknown,
): { ok: boolean; data?: Task027LearningQualityReviewInput; errors: string[] } {
  const errors: string[] = [];

  const sharedErrors = validateSharedRules(input, [
    { name: 'schoolId', type: 'nonEmptyString' },
    { name: 'pilotRunId', type: 'nonEmptyString' },
    { name: 'evidenceSummary', type: 'object' },
  ]);
  errors.push(...sharedErrors);

  const governanceErrors = validateGovernanceRules(input);
  errors.push(...governanceErrors);

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const obj = input as Record<string, unknown>;
  return {
    ok: true,
    data: {
      schoolId: (obj.schoolId as string).trim(),
      pilotRunId: obj.pilotRunId as string,
      evidenceSummary: obj.evidenceSummary as Task027PilotExecutionEvidenceSummary,
    },
    errors: [],
  };
}

export function validateTask027CohortExpansionProposalInput(
  input: unknown,
): { ok: boolean; data?: Task027CohortExpansionProposalInput; errors: string[] } {
  const errors: string[] = [];

  const sharedErrors = validateSharedRules(input, [
    { name: 'schoolId', type: 'nonEmptyString' },
    { name: 'pilotRunId', type: 'nonEmptyString' },
    { name: 'proposedCohortSize', type: 'number' },
    { name: 'proposedScopeLabels', type: 'stringArray' },
    { name: 'proposedClassOrGradeIds', type: 'stringArray' },
    { name: 'teacherOwnerSafeRefs', type: 'stringArray' },
    { name: 'supportOwnerSafeRefs', type: 'stringArray' },
    { name: 'curriculumSourceScopeIds', type: 'stringArray' },
    { name: 'startReadinessWindow', type: 'nonEmptyString' },
    { name: 'rollbackReadinessPath', type: 'nonEmptyString' },
  ]);
  errors.push(...sharedErrors);

  const governanceErrors = validateGovernanceRules(input);
  errors.push(...governanceErrors);

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const obj = input as Record<string, unknown>;
  return {
    ok: true,
    data: {
      schoolId: (obj.schoolId as string).trim(),
      pilotRunId: obj.pilotRunId as string,
      proposedCohortSize: obj.proposedCohortSize as number,
      proposedScopeLabels: obj.proposedScopeLabels as string[],
      proposedClassOrGradeIds: obj.proposedClassOrGradeIds as string[],
      teacherOwnerSafeRefs: obj.teacherOwnerSafeRefs as string[],
      supportOwnerSafeRefs: obj.supportOwnerSafeRefs as string[],
      curriculumSourceScopeIds: obj.curriculumSourceScopeIds as string[],
      startReadinessWindow: obj.startReadinessWindow as string,
      rollbackReadinessPath: obj.rollbackReadinessPath as string,
    },
    errors: [],
  };
}

export function validateTask027CohortExpansionEligibilityInput(
  input: unknown,
): { ok: boolean; data?: Task027CohortExpansionEligibilityInput; errors: string[] } {
  const errors: string[] = [];

  const sharedErrors = validateSharedRules(input, [
    { name: 'schoolId', type: 'nonEmptyString' },
    { name: 'proposalId', type: 'nonEmptyString' },
    { name: 'pilotRunId', type: 'nonEmptyString' },
  ]);
  errors.push(...sharedErrors);

  const governanceErrors = validateGovernanceRules(input);
  errors.push(...governanceErrors);

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const obj = input as Record<string, unknown>;
  return {
    ok: true,
    data: {
      schoolId: (obj.schoolId as string).trim(),
      proposalId: obj.proposalId as string,
      pilotRunId: obj.pilotRunId as string,
    },
    errors: [],
  };
}

export function validateTask027ExpansionRiskAssessmentInput(
  input: unknown,
): { ok: boolean; data?: Task027ExpansionRiskAssessmentInput; errors: string[] } {
  const errors: string[] = [];

  const sharedErrors = validateSharedRules(input, [
    { name: 'schoolId', type: 'nonEmptyString' },
    { name: 'proposalId', type: 'nonEmptyString' },
    { name: 'pilotRunId', type: 'nonEmptyString' },
  ]);
  errors.push(...sharedErrors);

  const governanceErrors = validateGovernanceRules(input);
  errors.push(...governanceErrors);

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const obj = input as Record<string, unknown>;
  return {
    ok: true,
    data: {
      schoolId: (obj.schoolId as string).trim(),
      proposalId: obj.proposalId as string,
      pilotRunId: obj.pilotRunId as string,
    },
    errors: [],
  };
}

export function validateTask027TeacherReviewInput(
  input: unknown,
): { ok: boolean; data?: Task027TeacherReviewInput; errors: string[] } {
  const errors: string[] = [];

  const sharedErrors = validateSharedRules(input, [
    { name: 'schoolId', type: 'nonEmptyString' },
    { name: 'proposalId', type: 'nonEmptyString' },
    { name: 'pilotRunId', type: 'nonEmptyString' },
    { name: 'teacherSafeId', type: 'nonEmptyString' },
    { name: 'safeSummary', type: 'nonEmptyString' },
    { name: 'supportConcerns', type: 'stringArray' },
    { name: 'learningQualityConcerns', type: 'stringArray' },
    { name: 'workloadConcerns', type: 'stringArray' },
    { name: 'recommendedDecision', type: 'nonEmptyString' },
    { name: 'safeReasonCodes', type: 'stringArray' },
  ]);
  errors.push(...sharedErrors);

  const governanceErrors = validateGovernanceRules(input);
  errors.push(...governanceErrors);

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const obj = input as Record<string, unknown>;
  return {
    ok: true,
    data: {
      schoolId: (obj.schoolId as string).trim(),
      proposalId: obj.proposalId as string,
      pilotRunId: obj.pilotRunId as string,
      teacherSafeId: obj.teacherSafeId as string,
      safeSummary: obj.safeSummary as string,
      supportConcerns: obj.supportConcerns as string[],
      learningQualityConcerns: obj.learningQualityConcerns as string[],
      workloadConcerns: obj.workloadConcerns as string[],
      recommendedDecision: obj.recommendedDecision as string,
      safeReasonCodes: obj.safeReasonCodes as string[],
    },
    errors: [],
  };
}

export function validateTask027SchoolAdminApprovalInput(
  input: unknown,
): { ok: boolean; data?: Task027SchoolAdminApprovalInput; errors: string[] } {
  const errors: string[] = [];

  const sharedErrors = validateSharedRules(input, [
    { name: 'schoolId', type: 'nonEmptyString' },
    { name: 'proposalId', type: 'nonEmptyString' },
    { name: 'pilotRunId', type: 'nonEmptyString' },
    { name: 'adminSafeId', type: 'nonEmptyString' },
    { name: 'teacherReviewCompleted', type: 'boolean' },
    { name: 'riskAssessmentAcceptable', type: 'boolean' },
    { name: 'operationsCapacityAcceptable', type: 'boolean' },
    { name: 'privacyReviewPassed', type: 'boolean' },
    { name: 'safeguardingReviewPassed', type: 'boolean' },
    { name: 'contentDeenReviewPassed', type: 'boolean' },
    { name: 'rollbackPathReady', type: 'boolean' },
    { name: 'evidencePackGenerated', type: 'boolean' },
    { name: 'safeSummary', type: 'nonEmptyString' },
    { name: 'conditions', type: 'stringArray' },
  ]);
  errors.push(...sharedErrors);

  const governanceErrors = validateGovernanceRules(input);
  errors.push(...governanceErrors);

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const obj = input as Record<string, unknown>;
  return {
    ok: true,
    data: {
      schoolId: (obj.schoolId as string).trim(),
      proposalId: obj.proposalId as string,
      pilotRunId: obj.pilotRunId as string,
      adminSafeId: obj.adminSafeId as string,
      teacherReviewCompleted: obj.teacherReviewCompleted as boolean,
      riskAssessmentAcceptable: obj.riskAssessmentAcceptable as boolean,
      operationsCapacityAcceptable: obj.operationsCapacityAcceptable as boolean,
      privacyReviewPassed: obj.privacyReviewPassed as boolean,
      safeguardingReviewPassed: obj.safeguardingReviewPassed as boolean,
      contentDeenReviewPassed: obj.contentDeenReviewPassed as boolean,
      rollbackPathReady: obj.rollbackPathReady as boolean,
      evidencePackGenerated: obj.evidencePackGenerated as boolean,
      safeSummary: obj.safeSummary as string,
      conditions: obj.conditions as string[],
    },
    errors: [],
  };
}

export function validateTask027ParentLearnerFeedbackReadinessInput(
  input: unknown,
): { ok: boolean; data?: Task027ParentLearnerFeedbackReadinessInput; errors: string[] } {
  const errors: string[] = [];

  const sharedErrors = validateSharedRules(input, [
    { name: 'schoolId', type: 'nonEmptyString' },
    { name: 'proposalId', type: 'nonEmptyString' },
    { name: 'pilotRunId', type: 'nonEmptyString' },
  ]);
  errors.push(...sharedErrors);

  const governanceErrors = validateGovernanceRules(input);
  errors.push(...governanceErrors);

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const obj = input as Record<string, unknown>;
  return {
    ok: true,
    data: {
      schoolId: (obj.schoolId as string).trim(),
      proposalId: obj.proposalId as string,
      pilotRunId: obj.pilotRunId as string,
    },
    errors: [],
  };
}

export function validateTask027SafeguardingReviewInput(
  input: unknown,
): { ok: boolean; data?: Task027SafeguardingReviewInput; errors: string[] } {
  const errors: string[] = [];

  const sharedErrors = validateSharedRules(input, [
    { name: 'schoolId', type: 'nonEmptyString' },
    { name: 'proposalId', type: 'nonEmptyString' },
    { name: 'pilotRunId', type: 'nonEmptyString' },
    { name: 'safeguardingOwnerSafeRef', type: 'nonEmptyString' },
    { name: 'seriousRiskDisclosureMinimal', type: 'boolean' },
    { name: 'humanReviewPathExists', type: 'boolean' },
    { name: 'roleScopedDisclosureOnly', type: 'boolean' },
  ]);
  errors.push(...sharedErrors);

  const governanceErrors = validateGovernanceRules(input);
  errors.push(...governanceErrors);

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const obj = input as Record<string, unknown>;
  return {
    ok: true,
    data: {
      schoolId: (obj.schoolId as string).trim(),
      proposalId: obj.proposalId as string,
      pilotRunId: obj.pilotRunId as string,
      safeguardingOwnerSafeRef: obj.safeguardingOwnerSafeRef as string,
      seriousRiskDisclosureMinimal: obj.seriousRiskDisclosureMinimal as boolean,
      humanReviewPathExists: obj.humanReviewPathExists as boolean,
      roleScopedDisclosureOnly: obj.roleScopedDisclosureOnly as boolean,
    },
    errors: [],
  };
}

export function validateTask027DeenContentReviewInput(
  input: unknown,
): { ok: boolean; data?: Task027DeenContentReviewInput; errors: string[] } {
  const errors: string[] = [];

  const sharedErrors = validateSharedRules(input, [
    { name: 'schoolId', type: 'nonEmptyString' },
    { name: 'proposalId', type: 'nonEmptyString' },
    { name: 'pilotRunId', type: 'nonEmptyString' },
    { name: 'approvedDeenSourcesVerified', type: 'boolean' },
    { name: 'deenContentPresent', type: 'boolean' },
    { name: 'noFatwaEngineBehavior', type: 'boolean' },
    { name: 'noPietyScoring', type: 'boolean' },
    { name: 'noSectarianJudgment', type: 'boolean' },
    { name: 'scholarReferralPathExists', type: 'boolean' },
    { name: 'contentSourcePolicyPassed', type: 'boolean' },
  ]);
  errors.push(...sharedErrors);

  const governanceErrors = validateGovernanceRules(input);
  errors.push(...governanceErrors);

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const obj = input as Record<string, unknown>;
  return {
    ok: true,
    data: {
      schoolId: (obj.schoolId as string).trim(),
      proposalId: obj.proposalId as string,
      pilotRunId: obj.pilotRunId as string,
      approvedDeenSourcesVerified: obj.approvedDeenSourcesVerified as boolean,
      deenContentPresent: obj.deenContentPresent as boolean,
      noFatwaEngineBehavior: obj.noFatwaEngineBehavior as boolean,
      noPietyScoring: obj.noPietyScoring as boolean,
      noSectarianJudgment: obj.noSectarianJudgment as boolean,
      scholarReferralPathExists: obj.scholarReferralPathExists as boolean,
      contentSourcePolicyPassed: obj.contentSourcePolicyPassed as boolean,
    },
    errors: [],
  };
}

export function validateTask027PrivacyReviewInput(
  input: unknown,
): { ok: boolean; data?: Task027PrivacyReviewInput; errors: string[] } {
  const errors: string[] = [];

  const sharedErrors = validateSharedRules(input, [
    { name: 'schoolId', type: 'nonEmptyString' },
    { name: 'proposalId', type: 'nonEmptyString' },
    { name: 'pilotRunId', type: 'nonEmptyString' },
    { name: 'noRawLearnerData', type: 'boolean' },
    { name: 'noRawParentData', type: 'boolean' },
    { name: 'noRawTeacherNotes', type: 'boolean' },
    { name: 'noRawSafeguardingNotes', type: 'boolean' },
    { name: 'noPrivateDeenText', type: 'boolean' },
    { name: 'noProviderPayloads', type: 'boolean' },
    { name: 'noHiddenReasoning', type: 'boolean' },
    { name: 'minimalSafeMetadataOnly', type: 'boolean' },
    { name: 'roleScopedReportVisibility', type: 'boolean' },
  ]);
  errors.push(...sharedErrors);

  const governanceErrors = validateGovernanceRules(input);
  errors.push(...governanceErrors);

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const obj = input as Record<string, unknown>;
  return {
    ok: true,
    data: {
      schoolId: (obj.schoolId as string).trim(),
      proposalId: obj.proposalId as string,
      pilotRunId: obj.pilotRunId as string,
      noRawLearnerData: obj.noRawLearnerData as boolean,
      noRawParentData: obj.noRawParentData as boolean,
      noRawTeacherNotes: obj.noRawTeacherNotes as boolean,
      noRawSafeguardingNotes: obj.noRawSafeguardingNotes as boolean,
      noPrivateDeenText: obj.noPrivateDeenText as boolean,
      noProviderPayloads: obj.noProviderPayloads as boolean,
      noHiddenReasoning: obj.noHiddenReasoning as boolean,
      minimalSafeMetadataOnly: obj.minimalSafeMetadataOnly as boolean,
      roleScopedReportVisibility: obj.roleScopedReportVisibility as boolean,
    },
    errors: [],
  };
}

export function validateTask027SocraticIntegrityReviewInput(
  input: unknown,
): { ok: boolean; data?: Task027SocraticIntegrityReviewInput; errors: string[] } {
  const errors: string[] = [];

  const sharedErrors = validateSharedRules(input, [
    { name: 'schoolId', type: 'nonEmptyString' },
    { name: 'proposalId', type: 'nonEmptyString' },
    { name: 'pilotRunId', type: 'nonEmptyString' },
    { name: 'noFinalAnswerShortcut', type: 'boolean' },
    { name: 'noAnswerKeyLeakage', type: 'boolean' },
    { name: 'hintLadderPreserved', type: 'boolean' },
    { name: 'studentAgencyPreserved', type: 'boolean' },
    { name: 'reflectionPromptsPreserved', type: 'boolean' },
    { name: 'cheatingPreventionPreserved', type: 'boolean' },
    { name: 'teacherOnlyMaterialProtected', type: 'boolean' },
  ]);
  errors.push(...sharedErrors);

  const governanceErrors = validateGovernanceRules(input);
  errors.push(...governanceErrors);

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const obj = input as Record<string, unknown>;
  return {
    ok: true,
    data: {
      schoolId: (obj.schoolId as string).trim(),
      proposalId: obj.proposalId as string,
      pilotRunId: obj.pilotRunId as string,
      noFinalAnswerShortcut: obj.noFinalAnswerShortcut as boolean,
      noAnswerKeyLeakage: obj.noAnswerKeyLeakage as boolean,
      hintLadderPreserved: obj.hintLadderPreserved as boolean,
      studentAgencyPreserved: obj.studentAgencyPreserved as boolean,
      reflectionPromptsPreserved: obj.reflectionPromptsPreserved as boolean,
      cheatingPreventionPreserved: obj.cheatingPreventionPreserved as boolean,
      teacherOnlyMaterialProtected: obj.teacherOnlyMaterialProtected as boolean,
    },
    errors: [],
  };
}

export function validateTask027AcademicIntegrityReviewInput(
  input: unknown,
): { ok: boolean; data?: Task027AcademicIntegrityReviewInput; errors: string[] } {
  const errors: string[] = [];

  const sharedErrors = validateSharedRules(input, [
    { name: 'schoolId', type: 'nonEmptyString' },
    { name: 'proposalId', type: 'nonEmptyString' },
    { name: 'pilotRunId', type: 'nonEmptyString' },
    { name: 'noAnswerKeyLeakage', type: 'boolean' },
    { name: 'noHomeworkShortcutPattern', type: 'boolean' },
    { name: 'noFinalAnswerFirstBehavior', type: 'boolean' },
    { name: 'noProtectedRubricLeakage', type: 'boolean' },
    { name: 'noExamBypass', type: 'boolean' },
    { name: 'studentEffortEvidenceExists', type: 'boolean' },
  ]);
  errors.push(...sharedErrors);

  const governanceErrors = validateGovernanceRules(input);
  errors.push(...governanceErrors);

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const obj = input as Record<string, unknown>;
  return {
    ok: true,
    data: {
      schoolId: (obj.schoolId as string).trim(),
      proposalId: obj.proposalId as string,
      pilotRunId: obj.pilotRunId as string,
      noAnswerKeyLeakage: obj.noAnswerKeyLeakage as boolean,
      noHomeworkShortcutPattern: obj.noHomeworkShortcutPattern as boolean,
      noFinalAnswerFirstBehavior: obj.noFinalAnswerFirstBehavior as boolean,
      noProtectedRubricLeakage: obj.noProtectedRubricLeakage as boolean,
      noExamBypass: obj.noExamBypass as boolean,
      studentEffortEvidenceExists: obj.studentEffortEvidenceExists as boolean,
    },
    errors: [],
  };
}

export function validateTask027OperationsHealthBudgetInput(
  input: unknown,
): { ok: boolean; data?: Task027OperationsHealthBudgetInput; errors: string[] } {
  const errors: string[] = [];

  const sharedErrors = validateSharedRules(input, [
    { name: 'schoolId', type: 'nonEmptyString' },
    { name: 'proposalId', type: 'nonEmptyString' },
    { name: 'pilotRunId', type: 'nonEmptyString' },
    { name: 'monitoringCapacityOk', type: 'boolean' },
    { name: 'supportQueueCapacityOk', type: 'boolean' },
    { name: 'incidentResponseReadinessOk', type: 'boolean' },
    { name: 'latencyErrorBudgetAcceptable', type: 'boolean' },
    { name: 'pausePathReady', type: 'boolean' },
    { name: 'rollbackPathReady', type: 'boolean' },
    { name: 'killSwitchReady', type: 'boolean' },
    { name: 'teacherWorkloadAcceptable', type: 'boolean' },
  ]);
  errors.push(...sharedErrors);

  const governanceErrors = validateGovernanceRules(input);
  errors.push(...governanceErrors);

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const obj = input as Record<string, unknown>;
  return {
    ok: true,
    data: {
      schoolId: (obj.schoolId as string).trim(),
      proposalId: obj.proposalId as string,
      pilotRunId: obj.pilotRunId as string,
      monitoringCapacityOk: obj.monitoringCapacityOk as boolean,
      supportQueueCapacityOk: obj.supportQueueCapacityOk as boolean,
      incidentResponseReadinessOk: obj.incidentResponseReadinessOk as boolean,
      latencyErrorBudgetAcceptable: obj.latencyErrorBudgetAcceptable as boolean,
      pausePathReady: obj.pausePathReady as boolean,
      rollbackPathReady: obj.rollbackPathReady as boolean,
      killSwitchReady: obj.killSwitchReady as boolean,
      teacherWorkloadAcceptable: obj.teacherWorkloadAcceptable as boolean,
    },
    errors: [],
  };
}

export function validateTask027PauseRollbackReadinessInput(
  input: unknown,
): { ok: boolean; data?: Task027PauseRollbackReadinessInput; errors: string[] } {
  const errors: string[] = [];

  const sharedErrors = validateSharedRules(input, [
    { name: 'schoolId', type: 'nonEmptyString' },
    { name: 'proposalId', type: 'nonEmptyString' },
    { name: 'pilotRunId', type: 'nonEmptyString' },
    { name: 'pauseCanBlockNewLearnerAccess', type: 'boolean' },
    { name: 'rollbackCanBlockExpansion', type: 'boolean' },
    { name: 'killSwitchExists', type: 'boolean' },
    { name: 'auditPreserved', type: 'boolean' },
    { name: 'noDestructiveDeletion', type: 'boolean' },
    { name: 'manualReviewPathExists', type: 'boolean' },
  ]);
  errors.push(...sharedErrors);

  const governanceErrors = validateGovernanceRules(input);
  errors.push(...governanceErrors);

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const obj = input as Record<string, unknown>;
  return {
    ok: true,
    data: {
      schoolId: (obj.schoolId as string).trim(),
      proposalId: obj.proposalId as string,
      pilotRunId: obj.pilotRunId as string,
      pauseCanBlockNewLearnerAccess: obj.pauseCanBlockNewLearnerAccess as boolean,
      rollbackCanBlockExpansion: obj.rollbackCanBlockExpansion as boolean,
      killSwitchExists: obj.killSwitchExists as boolean,
      auditPreserved: obj.auditPreserved as boolean,
      noDestructiveDeletion: obj.noDestructiveDeletion as boolean,
      manualReviewPathExists: obj.manualReviewPathExists as boolean,
    },
    errors: [],
  };
}

export function validateTask027ExpansionEvidencePackInput(
  input: unknown,
): { ok: boolean; data?: Task027ExpansionEvidencePackInput; errors: string[] } {
  const errors: string[] = [];

  const sharedErrors = validateSharedRules(input, [
    { name: 'schoolId', type: 'nonEmptyString' },
    { name: 'proposalId', type: 'nonEmptyString' },
    { name: 'pilotRunId', type: 'nonEmptyString' },
  ]);
  errors.push(...sharedErrors);

  const governanceErrors = validateGovernanceRules(input);
  errors.push(...governanceErrors);

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const obj = input as Record<string, unknown>;
  return {
    ok: true,
    data: {
      schoolId: (obj.schoolId as string).trim(),
      proposalId: obj.proposalId as string,
      pilotRunId: obj.pilotRunId as string,
    },
    errors: [],
  };
}

export function validateTask027GovernanceDecisionInput(
  input: unknown,
): { ok: boolean; data?: Task027GovernanceDecisionInput; errors: string[] } {
  const errors: string[] = [];

  const sharedErrors = validateSharedRules(input, [
    { name: 'schoolId', type: 'nonEmptyString' },
    { name: 'proposalId', type: 'nonEmptyString' },
    { name: 'pilotRunId', type: 'nonEmptyString' },
  ]);
  errors.push(...sharedErrors);

  const governanceErrors = validateGovernanceRules(input);
  errors.push(...governanceErrors);

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const obj = input as Record<string, unknown>;
  return {
    ok: true,
    data: {
      schoolId: (obj.schoolId as string).trim(),
      proposalId: obj.proposalId as string,
      pilotRunId: obj.pilotRunId as string,
    },
    errors: [],
  };
}
