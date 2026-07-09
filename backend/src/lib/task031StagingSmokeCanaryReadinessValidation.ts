import {
  TASK031_FORBIDDEN_OUTPUT_PATTERNS,
  TASK031_SAFE_IDENTIFIERS,
  TASK031_FORBIDDEN_ENVIRONMENT_TYPES,
  TASK031_FORBIDDEN_DATA_MODES,
  TASK031_FORBIDDEN_EXECUTION_MODES,
  TASK031_FORBIDDEN_CANARY_MODES,
  TASK031_DENIED_REAL_ACTOR_ROLES,
  TASK031_FORBIDDEN_SIDE_EFFECT_PATTERNS,
  TASK031_FORBIDDEN_OUTPUT_FIELDS,
  TASK031_REQUIRED_DEPENDENCY_COMMITS,
} from '../contracts/task031StagingSmokeCanaryReadinessContracts';

export interface ValidationResult {
  valid: boolean;
  reasonCodes: string[];
}

function success(): ValidationResult {
  return { valid: true, reasonCodes: [] };
}

function failure(reasonCodes: string[]): ValidationResult {
  return { valid: false, reasonCodes: [...new Set(reasonCodes)] };
}

export function createSafeTask031ValidationError(title: string, reasonCodes: string[]): Error & { reasonCodes: string[] } {
  const error = new Error(`[TASK031_VALIDATION_ERROR] ${title}: ${reasonCodes.join(', ')}`) as Error & { reasonCodes: string[] };
  error.reasonCodes = reasonCodes;
  return error;
}

function hasField(obj: Record<string, unknown>, field: string): boolean {
  return field in obj && obj[field] !== undefined && obj[field] !== null && obj[field] !== '';
}

function checkForbiddenPatterns(obj: Record<string, unknown>): string[] {
  const reasons: string[] = [];
  const raw = JSON.stringify(obj).toLowerCase();
  for (const pattern of TASK031_FORBIDDEN_OUTPUT_PATTERNS) {
    if (raw.includes(pattern.toLowerCase())) {
      const idx = raw.indexOf(pattern.toLowerCase());
      const contextStart = Math.max(0, idx - 60);
      const contextEnd = Math.min(raw.length, idx + pattern.length + 60);
      const context = raw.substring(contextStart, contextEnd);
      const isSafeNegative =
        context.includes('do not expose') || context.includes('not exposed') ||
        context.includes('no ') || context.includes('never ') || context.includes('forbidden');
      if (!isSafeNegative) {
        reasons.push(`forbidden_pattern_${pattern.replace(/\s+/g, '_')}`);
      }
    }
  }
  return reasons;
}

function checkForbiddenFields(obj: Record<string, unknown>): string[] {
  const reasons: string[] = [];
  for (const field of TASK031_FORBIDDEN_OUTPUT_FIELDS) {
    if (field in obj) {
      reasons.push(`forbidden_field_${field}`);
    }
  }
  return reasons;
}

function checkForbiddenSideEffects(obj: Record<string, unknown>): string[] {
  const reasons: string[] = [];
  const raw = JSON.stringify(obj).toLowerCase();
  for (const pattern of TASK031_FORBIDDEN_SIDE_EFFECT_PATTERNS) {
    if (raw.includes(pattern.toLowerCase())) {
      reasons.push(`forbidden_side_effect_${pattern}`);
    }
  }
  return reasons;
}

function checkRealEmails(content: string): string[] {
  const reasons: string[] = [];
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  let match;
  while ((match = emailRegex.exec(content)) !== null) {
    const candidate = match[0].toLowerCase();
    const isSafe = TASK031_SAFE_IDENTIFIERS.some(id => candidate.includes(id)) ||
      candidate.includes('example.com') || candidate.includes('.test') ||
      candidate.includes('safe');
    if (!isSafe) {
      reasons.push('real_email_detected');
      break;
    }
  }
  return reasons;
}

function checkRealPhones(content: string): string[] {
  const reasons: string[] = [];
  const phoneRegex = /\+\d{1,3}\d{6,14}/;
  if (phoneRegex.test(content)) {
    reasons.push('phone_number_detected');
  }
  return reasons;
}

export function validateTask031Task030DependencyProof(input: Record<string, unknown>): ValidationResult {
  const reasons: string[] = [];
  if (!input) return failure(['input_is_null']);
  const ok = input.ok === true;
  const reportFound = input.reportFound === true;
  const safeToStart = input.safeToStartTask031 === true;
  const blockingEmpty = Array.isArray(input.blockingIssues) && (input.blockingIssues as unknown[]).length === 0;
  if (!ok) reasons.push('task030_proof_not_ok');
  if (!reportFound) reasons.push('task030_report_not_found');
  if (!safeToStart) reasons.push('task030_safe_to_start_task_031_not_true');
  if (!blockingEmpty) reasons.push('task030_blocking_issues_not_empty');
  return reasons.length === 0 ? success() : failure(reasons);
}

export function validateTask031StagingEnvironmentGateInput(input: Record<string, unknown>): ValidationResult {
  const reasons: string[] = [];
  if (!input) return failure(['input_is_null']);
  const envType = String(input.environmentType || '');
  const dataMode = String(input.dataMode || '');
  const execMode = String(input.executionMode || '');
  const canaryMode = String(input.canaryMode || '');
  if (TASK031_FORBIDDEN_ENVIRONMENT_TYPES.includes(envType)) reasons.push('forbidden_environment_type_' + envType);
  if (TASK031_FORBIDDEN_DATA_MODES.includes(dataMode)) reasons.push('forbidden_data_mode_' + dataMode);
  if (TASK031_FORBIDDEN_EXECUTION_MODES.includes(execMode)) reasons.push('forbidden_execution_mode_' + execMode);
  if (TASK031_FORBIDDEN_CANARY_MODES.includes(canaryMode)) reasons.push('forbidden_canary_mode_' + canaryMode);
  if (input.productionDeploymentRequested === true) reasons.push('production_deployment_requested');
  if (input.liveStudentAccessRequested === true) reasons.push('live_student_access_requested');
  if (input.liveNotificationRequested === true) reasons.push('live_notification_requested');
  if (input.liveAiRequested === true) reasons.push('live_ai_requested');
  if (input.liveSchoolConnectorRequested === true) reasons.push('live_school_connector_requested');
  if (input.productionMutationRequested === true) reasons.push('production_mutation_requested');
  if (input.canaryActivationRequested === true) reasons.push('canary_activation_requested');
  if (input.canaryObservationRequested === true) reasons.push('canary_observation_requested');
  if (input.rolloutRequested === true) reasons.push('rollout_requested');
  if (input.schoolWideLaunchRequested === true) reasons.push('school_wide_launch_requested');
  if (input.backendFreezeRequested === true) reasons.push('backend_freeze_requested');
  return reasons.length === 0 ? success() : failure(reasons);
}

export function validateTask031SyntheticStagingSchoolFixture(input: Record<string, unknown>): ValidationResult {
  const reasons: string[] = [];
  if (!input) return failure(['input_is_null']);
  if (!hasField(input, 'schoolId')) reasons.push('missing_schoolId');
  if (!hasField(input, 'tenantId')) reasons.push('missing_tenantId');
  if (!hasField(input, 'embedId')) reasons.push('missing_embedId');
  if (!hasField(input, 'handoffId')) reasons.push('missing_handoffId');
  const raw = JSON.stringify(input);
  reasons.push(...checkForbiddenPatterns(input));
  reasons.push(...checkRealEmails(raw));
  reasons.push(...checkRealPhones(raw));
  return reasons.length === 0 ? success() : failure(reasons);
}

export function validateTask031SyntheticSmokeCohortFixture(input: Record<string, unknown>): ValidationResult {
  const reasons: string[] = [];
  if (!input) return failure(['input_is_null']);
  if (!hasField(input, 'cohortId')) reasons.push('missing_cohortId');
  reasons.push(...checkForbiddenPatterns(input));
  return reasons.length === 0 ? success() : failure(reasons);
}

export function validateTask031RoleMatrix(input: Record<string, unknown>): ValidationResult {
  const reasons: string[] = [];
  if (!input) return failure(['input_is_null']);
  if (!hasField(input, 'ok')) reasons.push('missing_ok');
  if (!Array.isArray(input.rolesChecked)) reasons.push('missing_rolesChecked');
  return reasons.length === 0 ? success() : failure(reasons);
}

export function validateTask031SmokeRunInput(input: Record<string, unknown>): ValidationResult {
  const reasons: string[] = [];
  if (!input) return failure(['input_is_null']);
  if (!hasField(input, 'schoolId')) reasons.push('missing_schoolId');
  if (!hasField(input, 'actorId')) reasons.push('missing_actorId');
  if (!hasField(input, 'actorRole')) reasons.push('missing_actorRole');
  const role = String(input.actorRole || '');
  if (TASK031_DENIED_REAL_ACTOR_ROLES.includes(role)) reasons.push('denied_actor_role_' + role);
  return reasons.length === 0 ? success() : failure(reasons);
}

export function validateTask031SmokeStageInput(input: Record<string, unknown>): ValidationResult {
  const reasons: string[] = [];
  if (!input) return failure(['input_is_null']);
  if (!hasField(input, 'stageId')) reasons.push('missing_stageId');
  if (!hasField(input, 'runId')) reasons.push('missing_runId');
  return reasons.length === 0 ? success() : failure(reasons);
}

export function validateTask031BackendRouteSmokeInput(input: Record<string, unknown>): ValidationResult {
  return validateTask031SmokeStageInput(input);
}

export function validateTask031CopilotBootstrapSmokeInput(input: Record<string, unknown>): ValidationResult {
  return validateTask031SmokeStageInput(input);
}

export function validateTask031TutorSessionContextSmokeInput(input: Record<string, unknown>): ValidationResult {
  return validateTask031SmokeStageInput(input);
}

export function validateTask031EmbedHandoffSmokeInput(input: Record<string, unknown>): ValidationResult {
  return validateTask031SmokeStageInput(input);
}

export function validateTask031StudentPreflightSmokeInput(input: Record<string, unknown>): ValidationResult {
  return validateTask031SmokeStageInput(input);
}

export function validateTask031TeacherOversightSmokeInput(input: Record<string, unknown>): ValidationResult {
  return validateTask031SmokeStageInput(input);
}

export function validateTask031AdminOperatorMonitoringSmokeInput(input: Record<string, unknown>): ValidationResult {
  return validateTask031SmokeStageInput(input);
}

export function validateTask031OperationsConsoleSmokeInput(input: Record<string, unknown>): ValidationResult {
  return validateTask031SmokeStageInput(input);
}

export function validateTask031ObservabilityBaselineInput(input: Record<string, unknown>): ValidationResult {
  const reasons: string[] = [];
  if (!input) return failure(['input_is_null']);
  if (!hasField(input, 'smokeRunId')) reasons.push('missing_smokeRunId');
  return reasons.length === 0 ? success() : failure(reasons);
}

export function validateTask031LatencyErrorBudgetInput(input: Record<string, unknown>): ValidationResult {
  const reasons: string[] = [];
  if (!input) return failure(['input_is_null']);
  if (!hasField(input, 'baseline')) reasons.push('missing_baseline');
  return reasons.length === 0 ? success() : failure(reasons);
}

export function validateTask031CanaryReadinessDecisionInput(input: Record<string, unknown>): ValidationResult {
  const reasons: string[] = [];
  if (!input) return failure(['input_is_null']);
  return reasons.length === 0 ? success() : failure(reasons);
}

export function validateTask031ReportInput(input: Record<string, unknown>): ValidationResult {
  const reasons: string[] = [];
  if (!input) return failure(['input_is_null']);
  if (!hasField(input, 'taskId')) reasons.push('missing_taskId');
  return reasons.length === 0 ? success() : failure(reasons);
}

export function rejectTask031ForbiddenFields(obj: Record<string, unknown>): ValidationResult {
  const reasons = checkForbiddenFields(obj);
  return reasons.length === 0 ? success() : failure(reasons);
}

export function redactTask031SensitiveValue(value: string): string {
  if (!value) return value;
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const phoneRegex = /\+\d{1,3}\d{6,14}/g;
  return value.replace(emailRegex, 'redacted@email.local')
    .replace(phoneRegex, 'REDACTED')
    .replace(/Bearer\s+\S+/gi, 'Bearer REDACTED')
    .replace(/sk-proj-\S+/g, 'sk-proj-REDACTED')
    .replace(/sk-ant-\S+/g, 'sk-ant-REDACTED');
}