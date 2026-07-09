import {
  TASK032_ALLOWED_ENVIRONMENT_TYPES,
  TASK032_ALLOWED_ACTIVATION_MODES,
  TASK032_ALLOWED_DATA_MODES,
  TASK032_ALLOWED_SIDE_EFFECT_MODES,
  TASK032_ALLOWED_REAL_ACTOR_ROLES,
  TASK032_CONTROL_ACTION_IDS,
  TASK032_FORBIDDEN_OUTPUT_FIELDS,
  resolveTask032ActorRole,
  isTask032AdminOperatorRole,
} from '../contracts/task032ControlledCanaryActivationContracts';

export interface Task032ValidationResult {
  ok: boolean;
  reasonCodes: string[];
}

function success(): Task032ValidationResult {
  return { ok: true, reasonCodes: [] };
}

function failure(reasonCodes: string[]): Task032ValidationResult {
  return { ok: false, reasonCodes: [...new Set(reasonCodes)] };
}

function hasField(obj: Record<string, unknown>, field: string): boolean {
  return field in obj && obj[field] !== undefined && obj[field] !== null && obj[field] !== '';
}

function hasAllFields(obj: Record<string, unknown>, fields: string[]): string[] {
  const missing: string[] = [];
  for (const f of fields) {
    if (!hasField(obj, f)) missing.push(`missing_${f}`);
  }
  return missing;
}

export function validateTask032Task031DependencyProof(input: any): Task032ValidationResult {
  const reasons: string[] = [];
  if (!input || typeof input !== 'object') return failure(['input_is_null']);
  const requiredFields = [
    'ok', 'commitFound', 'task031ReportFound', 'task031OpsReportFound',
    'verdict', 'safeToStartTask032', 'safeToStartTask033', 'safeToStartTask034',
    'safeToStartTask035', 'safeToStartTask040', 'task031FocusedTestsPassed',
    'task020To030RegressionPassed', 'phase3RegressionPassed',
    'fullBackendSuitePassed', 'backendBuildPassed', 'backendTypecheckPassed',
    'prismaValidatePassed', 'prismaGeneratePassed', 'task031VerificationScriptPassed',
    'privacyScanPassed', 'noProductionMutationScanPassed', 'noLiveConnectorAiScanPassed',
    'noLiveNotificationScanPassed', 'noFrontendUiScanPassed',
    'noTask032ToTask040ScanPassed', 'noFalsePassScanPassed',
    'remainingBlockers', 'blockingIssues',
  ];
  reasons.push(...hasAllFields(input, requiredFields));
  if (input.ok !== true) reasons.push('ok_not_true');
  if (input.commitFound !== true) reasons.push('commitFound_not_true');
  if (input.task031ReportFound !== true) reasons.push('task031ReportFound_not_true');
  if (input.verdict !== 'ACCEPTED_READY_YES') reasons.push('verdict_not_ACCEPTED_READY_YES');
  if (input.safeToStartTask032 !== true) reasons.push('safeToStartTask032_not_true');
  if (input.safeToStartTask033 !== false) reasons.push('safeToStartTask033_not_false');
  if (input.safeToStartTask034 !== false) reasons.push('safeToStartTask034_not_false');
  if (input.safeToStartTask035 !== false) reasons.push('safeToStartTask035_not_false');
  if (input.safeToStartTask040 !== false) reasons.push('safeToStartTask040_not_false');
  if (!Array.isArray(input.remainingBlockers)) reasons.push('remainingBlockers_not_array');
  if (!Array.isArray(input.blockingIssues)) reasons.push('blockingIssues_not_array');
  return reasons.length === 0 ? success() : failure(reasons);
}

export function validateTask032CanaryEnvironmentGateInput(input: any): Task032ValidationResult {
  const reasons: string[] = [];
  if (!input || typeof input !== 'object') return failure(['input_is_null']);
  const requiredFields = [
    'environmentType', 'activationMode', 'dataMode', 'sideEffectMode',
    'productionDeploymentRequested', 'liveNotificationRequested', 'liveAiRequested',
    'liveSchoolConnectorRequested', 'productionMutationRequested',
    'canaryObservationRequested', 'rolloutRequested', 'schoolWideLaunchRequested',
    'backendFreezeRequested',
  ];
  reasons.push(...hasAllFields(input, requiredFields));
  if (input.environmentType !== 'controlled_canary') reasons.push('environmentType_not_controlled_canary');
  if (input.activationMode !== 'internal_controlled_activation') reasons.push('activationMode_not_internal_controlled_activation');
  if (input.dataMode !== 'approved_canary_fixture') reasons.push('dataMode_not_approved_canary_fixture');
  if (input.sideEffectMode !== 'internal_state_only') reasons.push('sideEffectMode_not_internal_state_only');
  if (input.productionDeploymentRequested !== false) reasons.push('productionDeploymentRequested_not_false');
  if (input.liveNotificationRequested !== false) reasons.push('liveNotificationRequested_not_false');
  if (input.liveAiRequested !== false) reasons.push('liveAiRequested_not_false');
  if (input.liveSchoolConnectorRequested !== false) reasons.push('liveSchoolConnectorRequested_not_false');
  if (input.productionMutationRequested !== false) reasons.push('productionMutationRequested_not_false');
  if (input.canaryObservationRequested !== false) reasons.push('canaryObservationRequested_not_false');
  if (input.rolloutRequested !== false) reasons.push('rolloutRequested_not_false');
  if (input.schoolWideLaunchRequested !== false) reasons.push('schoolWideLaunchRequested_not_false');
  if (input.backendFreezeRequested !== false) reasons.push('backendFreezeRequested_not_false');
  return reasons.length === 0 ? success() : failure(reasons);
}

export function validateTask032ApprovedSchoolCanaryConfig(input: any): { ok: boolean; config: object; reasonCodes: string[] } {
  const reasons: string[] = [];
  if (!input || typeof input !== 'object') return { ok: false, config: {}, reasonCodes: ['input_is_null'] };
  const requiredFields = [
    'configId', 'schoolId', 'approvedByRole', 'activationMode',
    'maxCanaryLearners', 'allowedClassIds', 'allowedSubjectIds', 'allowedCohortIds',
    'rollbackPolicyId', 'incidentPolicyId', 'privacyBoundaryId', 'healthBudgetId',
    'consentAuthorizationPolicyId', 'sourceGovernancePolicyId', 'deenBoundaryPolicyId',
    'socraticIntegrityPolicyId',
  ];
  reasons.push(...hasAllFields(input, requiredFields));
  if (typeof input.maxCanaryLearners !== 'number' || input.maxCanaryLearners > 50) reasons.push('maxCanaryLearners_invalid_or_exceeds_50');
  if (!Array.isArray(input.allowedClassIds)) reasons.push('allowedClassIds_not_array');
  if (!Array.isArray(input.allowedSubjectIds)) reasons.push('allowedSubjectIds_not_array');
  if (!Array.isArray(input.allowedCohortIds)) reasons.push('allowedCohortIds_not_array');
  if (reasons.length > 0) return { ok: false, config: {}, reasonCodes: reasons };
  return { ok: true, config: input as object, reasonCodes: [] };
}

export function validateTask032CanaryCohortEligibilityInput(input: any): Task032ValidationResult {
  const reasons: string[] = [];
  if (!input || typeof input !== 'object') return failure(['input_is_null']);
  reasons.push(...hasAllFields(input, ['schoolId', 'cohortId', 'actorRole', 'config']));
  if (typeof input.config !== 'object' || input.config === null) reasons.push('config_is_not_object');
  return reasons.length === 0 ? success() : failure(reasons);
}

export function validateTask032ConsentAuthorizationInput(input: any): Task032ValidationResult {
  const reasons: string[] = [];
  if (!input || typeof input !== 'object') return failure(['input_is_null']);
  reasons.push(...hasAllFields(input, ['schoolId', 'config', 'actorRole']));
  if (typeof input.config !== 'object' || input.config === null) reasons.push('config_is_not_object');
  return reasons.length === 0 ? success() : failure(reasons);
}

export function validateTask032PrivacyBoundaryInput(input: any): Task032ValidationResult {
  const reasons: string[] = [];
  if (!input || typeof input !== 'object') return failure(['input_is_null']);
  reasons.push(...hasAllFields(input, ['schoolId', 'actorRole']));
  return reasons.length === 0 ? success() : failure(reasons);
}

export function validateTask032RuntimeGuardInput(input: any): Task032ValidationResult {
  const reasons: string[] = [];
  if (!input || typeof input !== 'object') return failure(['input_is_null']);
  reasons.push(...hasAllFields(input, ['schoolId', 'actorRole', 'activationId']));
  const resolvedRole = resolveTask032ActorRole(String(input.actorRole || ''));
  if (!isTask032AdminOperatorRole(resolvedRole)) reasons.push('actorRole_not_admin_or_operator');
  return reasons.length === 0 ? success() : failure(reasons);
}

export function validateTask032ActivationRecordInput(input: any): Task032ValidationResult {
  const reasons: string[] = [];
  if (!input || typeof input !== 'object') return failure(['input_is_null']);
  reasons.push(...hasAllFields(input, ['schoolId', 'config']));
  if (typeof input.config !== 'object' || input.config === null) reasons.push('config_is_not_object');
  if (input.config) {
    const configRequiredFields = [
      'configId', 'schoolId', 'approvedByRole', 'activationMode',
      'maxCanaryLearners', 'allowedClassIds', 'allowedSubjectIds', 'allowedCohortIds',
      'rollbackPolicyId', 'incidentPolicyId', 'privacyBoundaryId', 'healthBudgetId',
      'consentAuthorizationPolicyId', 'sourceGovernancePolicyId', 'deenBoundaryPolicyId',
      'socraticIntegrityPolicyId',
    ];
    for (const f of configRequiredFields) {
      if (!hasField(input.config, f)) reasons.push(`config_missing_${f}`);
    }
  }
  return reasons.length === 0 ? success() : failure(reasons);
}

export function validateTask032ActivationCommandInput(input: any): Task032ValidationResult {
  const reasons: string[] = [];
  if (!input || typeof input !== 'object') return failure(['input_is_null']);
  reasons.push(...hasAllFields(input, ['schoolId', 'actorRole', 'config', 'environmentInput']));
  if (typeof input.config !== 'object' || input.config === null) reasons.push('config_is_not_object');
  if (typeof input.environmentInput !== 'object' || input.environmentInput === null) reasons.push('environmentInput_is_not_object');
  return reasons.length === 0 ? success() : failure(reasons);
}

export function validateTask032ControlActionInput(input: any): Task032ValidationResult {
  const reasons: string[] = [];
  if (!input || typeof input !== 'object') return failure(['input_is_null']);
  reasons.push(...hasAllFields(input, ['activationId', 'action', 'actorRole', 'schoolId']));
  if (!TASK032_CONTROL_ACTION_IDS.includes(input.action)) reasons.push(`action_not_in_TASK032_CONTROL_ACTION_IDS`);
  return reasons.length === 0 ? success() : failure(reasons);
}

export function validateTask032HealthBudgetInput(input: any): Task032ValidationResult {
  const reasons: string[] = [];
  if (!input || typeof input !== 'object') return failure(['input_is_null']);
  reasons.push(...hasAllFields(input, ['activationId', 'schoolId']));
  return reasons.length === 0 ? success() : failure(reasons);
}

export function validateTask032IncidentBridgeInput(input: any): Task032ValidationResult {
  const reasons: string[] = [];
  if (!input || typeof input !== 'object') return failure(['input_is_null']);
  reasons.push(...hasAllFields(input, ['activationId', 'schoolId']));
  return reasons.length === 0 ? success() : failure(reasons);
}

export function validateTask032CanarySafeViewInput(input: any): Task032ValidationResult {
  const reasons: string[] = [];
  if (!input || typeof input !== 'object') return failure(['input_is_null']);
  reasons.push(...hasAllFields(input, ['activationId']));
  return reasons.length === 0 ? success() : failure(reasons);
}

export function validateTask032ReportInput(input: any): Task032ValidationResult {
  const reasons: string[] = [];
  if (!input || typeof input !== 'object') return failure(['input_is_null']);
  reasons.push(...hasAllFields(input, ['activationId']));
  return reasons.length === 0 ? success() : failure(reasons);
}

export function rejectTask032ForbiddenFields(obj: any): { hasForbiddenFields: boolean; matchedFields: string[] } {
  if (!obj || typeof obj !== 'object') return { hasForbiddenFields: false, matchedFields: [] };
  const matched: string[] = [];
  for (const field of TASK032_FORBIDDEN_OUTPUT_FIELDS) {
    if (field in obj) matched.push(field);
  }
  return { hasForbiddenFields: matched.length > 0, matchedFields: matched };
}

export function redactTask032SensitiveValue(value: string): string {
  if (!value) return value;
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const phoneRegex = /\+\d{1,3}\d{6,14}/g;
  return value
    .replace(emailRegex, 'REDACTED')
    .replace(phoneRegex, 'REDACTED')
    .replace(/Bearer\s+\S+/gi, 'Bearer REDACTED')
    .replace(/sk-proj-\S+/g, 'sk-proj-REDACTED')
    .replace(/sk-ant-\S+/g, 'sk-ant-REDACTED');
}

export function createSafeTask032ValidationError(title: string, reasonCodes: string[]): { error: string; reasonCodes: string[]; safe: true; timestamp: string } {
  return {
    error: `[TASK032_VALIDATION_ERROR] ${title}`,
    reasonCodes: [...new Set(reasonCodes)],
    safe: true as const,
    timestamp: new Date().toISOString(),
  };
}
