import {
  Task030Task029DependencyProof,
  Task030StagingEnvironmentGateInput,
  Task030StagingEnvironmentGateResult,
  Task030SyntheticSchoolFixture,
  Task030SyntheticCohortFixture,
  Task030RoleTokenMatrix,
  Task030RehearsalRun,
  Task030AdminOperatorJourneyResult,
  Task030TeacherJourneyResult,
  Task030StudentJourneyResult,
  Task030UnknownRoleDenialResult,
  Task030OperationsConsoleRehearsalResult,
  Task030ControlActionRehearsalResult,
  Task030RollbackDrillResult,
  Task030StaffTrainingPack,
  Task030ControlledStagingReport,
  Task030RehearsalStageResult,
  Task030DiagnosticsResult,
  TASK030_ALLOWED_ENVIRONMENT_TYPES,
  TASK030_FORBIDDEN_ENVIRONMENT_TYPES,
  TASK030_ALLOWED_DATA_MODES,
  TASK030_FORBIDDEN_DATA_MODES,
  TASK030_ALLOWED_EXECUTION_MODES,
  TASK030_FORBIDDEN_EXECUTION_MODES,
  TASK030_FORBIDDEN_OUTPUT_FIELDS,
  TASK030_FORBIDDEN_SIDE_EFFECT_PATTERNS,
} from '../contracts/task030ControlledStagingRehearsalContracts';

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /\+?\d{1,4}[\s.-]?\(?\d{1,4}\)?[\s.-]?\d{1,4}[\s.-]?\d{1,4}[\s.-]?\d{1,4}/g;

function addError(errors: string[], field: string, msg: string): void {
  errors.push(`${field}: ${msg}`);
}

function isPresent(val: unknown): boolean {
  return val !== undefined && val !== null;
}

function isNonEmptyString(val: unknown): val is string {
  return typeof val === 'string' && val.trim().length > 0;
}

function isNonEmptyArray(val: unknown): val is unknown[] {
  return Array.isArray(val) && val.length > 0;
}

export function validateTask030Task029DependencyProof(
  input: Partial<Task030Task029DependencyProof>,
): { ok: boolean; errors: string[] } {
  const errors: string[] = [];

  if (input.ok !== true) addError(errors, 'ok', 'must be true');
  if (input.reportFound !== true) addError(errors, 'reportFound', 'must be true');
  if (input.safeToStartTask030 !== true) addError(errors, 'safeToStartTask030', 'must be true');
  if (typeof input.finalDecision !== 'string' || !input.finalDecision.includes('PASS')) {
    addError(errors, 'finalDecision', 'must contain PASS');
  }
  if (input.blockingIssuesEmpty !== true) addError(errors, 'blockingIssuesEmpty', 'must be true');
  if (!Array.isArray(input.remainingBlockers) || input.remainingBlockers.length !== 0) {
    addError(errors, 'remainingBlockers', 'must be empty array');
  }

  return { ok: errors.length === 0, errors };
}

export function validateTask030StagingEnvironmentGateInput(
  input: Partial<Task030StagingEnvironmentGateInput>,
): { ok: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!TASK030_ALLOWED_ENVIRONMENT_TYPES.includes(input.environmentType ?? '')) {
    addError(errors, 'environmentType', `must be one of ${TASK030_ALLOWED_ENVIRONMENT_TYPES.join(', ')}`);
  }
  if (TASK030_FORBIDDEN_ENVIRONMENT_TYPES.includes(input.environmentType ?? '')) {
    addError(errors, 'environmentType', `forbidden: ${input.environmentType}`);
  }
  if (!TASK030_ALLOWED_DATA_MODES.includes(input.dataMode ?? '')) {
    addError(errors, 'dataMode', `must be one of ${TASK030_ALLOWED_DATA_MODES.join(', ')}`);
  }
  if (TASK030_FORBIDDEN_DATA_MODES.includes(input.dataMode ?? '')) {
    addError(errors, 'dataMode', `forbidden: ${input.dataMode}`);
  }
  if (!TASK030_ALLOWED_EXECUTION_MODES.includes(input.executionMode ?? '')) {
    addError(errors, 'executionMode', `must be one of ${TASK030_ALLOWED_EXECUTION_MODES.join(', ')}`);
  }
  if (TASK030_FORBIDDEN_EXECUTION_MODES.includes(input.executionMode ?? '')) {
    addError(errors, 'executionMode', `forbidden: ${input.executionMode}`);
  }

  const requestedFields: (keyof Task030StagingEnvironmentGateInput)[] = [
    'productionDeploymentRequested',
    'liveStudentAccessRequested',
    'liveNotificationRequested',
    'liveAiRequested',
    'liveSchoolConnectorRequested',
    'productionMutationRequested',
    'canaryRequested',
    'rolloutRequested',
    'schoolWideLaunchRequested',
  ];

  for (const field of requestedFields) {
    const val = input[field];
    if (val === true) {
      addError(errors, field, 'must be false or undefined');
    }
  }

  return { ok: errors.length === 0, errors };
}

export function validateTask030SyntheticSchoolFixture(
  input: Partial<Task030SyntheticSchoolFixture>,
): { ok: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!isNonEmptyString(input.schoolId)) {
    addError(errors, 'schoolId', 'must be a non-empty string');
  } else if (!input.schoolId!.startsWith('synthetic_')) {
    addError(errors, 'schoolId', 'must start with synthetic_');
  }

  if (!isNonEmptyString(input.adminId)) addError(errors, 'adminId', 'must be a non-empty string');
  if (!isNonEmptyString(input.operatorId)) addError(errors, 'operatorId', 'must be a non-empty string');
  if (!isNonEmptyArray(input.teacherIds)) addError(errors, 'teacherIds', 'must be a non-empty array');
  if (!isNonEmptyArray(input.learnerIds)) addError(errors, 'learnerIds', 'must be a non-empty array');
  if (!isNonEmptyArray(input.classIds)) addError(errors, 'classIds', 'must be a non-empty array');
  if (!isNonEmptyArray(input.subjectIds)) addError(errors, 'subjectIds', 'must be a non-empty array');
  if (!isNonEmptyArray(input.cohortIds)) addError(errors, 'cohortIds', 'must be a non-empty array');

  if (!isNonEmptyString(input.approvedCurriculumSource)) {
    addError(errors, 'approvedCurriculumSource', 'must be a non-empty string');
  }

  const stringFieldsToCheck: (keyof Task030SyntheticSchoolFixture)[] = [
    'schoolId', 'adminId', 'operatorId', 'approvedCurriculumSource',
  ];
  for (const key of stringFieldsToCheck) {
    const val = input[key];
    if (typeof val === 'string' && EMAIL_REGEX.test(val)) {
      addError(errors, key, 'must not contain real email patterns');
      EMAIL_REGEX.lastIndex = 0;
    }
  }

  if (Array.isArray(input.teacherIds)) {
    for (const id of input.teacherIds) {
      if (typeof id === 'string' && EMAIL_REGEX.test(id)) {
        addError(errors, 'teacherIds[]', 'must not contain real email patterns');
        EMAIL_REGEX.lastIndex = 0;
      }
    }
  }
  if (Array.isArray(input.learnerIds)) {
    for (const id of input.learnerIds) {
      if (typeof id === 'string' && EMAIL_REGEX.test(id)) {
        addError(errors, 'learnerIds[]', 'must not contain real email patterns');
        EMAIL_REGEX.lastIndex = 0;
      }
    }
  }

  return { ok: errors.length === 0, errors };
}

export function validateTask030SyntheticCohortFixture(
  input: Partial<Task030SyntheticCohortFixture>,
): { ok: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!isNonEmptyString(input.cohortId)) addError(errors, 'cohortId', 'must be a non-empty string');
  if (!isNonEmptyString(input.schoolId)) addError(errors, 'schoolId', 'must be a non-empty string');
  if (!isNonEmptyString(input.className)) addError(errors, 'className', 'must be a non-empty string');
  if (!isNonEmptyString(input.subjectName)) addError(errors, 'subjectName', 'must be a non-empty string');
  if (typeof input.learnerCount !== 'number' || input.learnerCount <= 0) {
    addError(errors, 'learnerCount', 'must be a positive number');
  }
  if (typeof input.teacherCount !== 'number' || input.teacherCount <= 0) {
    addError(errors, 'teacherCount', 'must be a positive number');
  }
  if (!isNonEmptyString(input.safeCohortLabel)) {
    addError(errors, 'safeCohortLabel', 'must be a non-empty string');
  }

  return { ok: errors.length === 0, errors };
}

export function validateTask030RoleTokenMatrix(
  input: Partial<Task030RoleTokenMatrix>,
): { ok: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!isNonEmptyString(input.matrixId)) addError(errors, 'matrixId', 'must be a non-empty string');
  if (!isNonEmptyArray(input.tokens)) {
    addError(errors, 'tokens', 'must be a non-empty array');
  } else {
    for (let i = 0; i < input.tokens!.length; i++) {
      const token = input.tokens![i];
      if (!token.syntheticRole) {
        addError(errors, `tokens[${i}]`, 'syntheticRole is required');
      }
      if (!isNonEmptyString(token.token)) {
        addError(errors, `tokens[${i}]`, 'token must be a non-empty string');
      } else if (!token.token.startsWith('task030_synthetic_token_')) {
        addError(errors, `tokens[${i}]`, 'token must start with task030_synthetic_token_');
      }
      if (!isNonEmptyString(token.actorIdHash)) {
        addError(errors, `tokens[${i}]`, 'actorIdHash is required');
      }
    }
  }

  return { ok: errors.length === 0, errors };
}

export function validateTask030RehearsalRunInput(
  input: Partial<Task030RehearsalRun>,
): { ok: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!isNonEmptyString(input.runId)) addError(errors, 'runId', 'must be a non-empty string');
  if (!isNonEmptyString(input.schoolId)) addError(errors, 'schoolId', 'must be a non-empty string');
  if (!TASK030_ALLOWED_ENVIRONMENT_TYPES.includes(input.environmentType ?? '')) {
    addError(errors, 'environmentType', `must be one of ${TASK030_ALLOWED_ENVIRONMENT_TYPES.join(', ')}`);
  }
  if (!TASK030_ALLOWED_DATA_MODES.includes(input.dataMode ?? '')) {
    addError(errors, 'dataMode', `must be one of ${TASK030_ALLOWED_DATA_MODES.join(', ')}`);
  }
  if (!TASK030_ALLOWED_EXECUTION_MODES.includes(input.executionMode ?? '')) {
    addError(errors, 'executionMode', `must be one of ${TASK030_ALLOWED_EXECUTION_MODES.join(', ')}`);
  }

  const validStatuses = [
    'created', 'preflight_running', 'preflight_passed', 'journeys_running',
    'operations_rehearsal_running', 'rollback_drill_running', 'training_pack_generated',
    'report_generated', 'accepted_ready', 'blocked',
  ];
  if (input.status && !validStatuses.includes(input.status)) {
    addError(errors, 'status', `invalid status: ${input.status}`);
  }

  return { ok: errors.length === 0, errors };
}

export function validateTask030JourneyInput(
  input: { runId?: string; syntheticRole?: string; schoolId?: string },
): { ok: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!isNonEmptyString(input.runId)) addError(errors, 'runId', 'must be a non-empty string');
  if (!isNonEmptyString(input.syntheticRole)) addError(errors, 'syntheticRole', 'must be a non-empty string');
  if (!isNonEmptyString(input.schoolId)) addError(errors, 'schoolId', 'must be a non-empty string');

  return { ok: errors.length === 0, errors };
}

export function validateTask030OperationsConsoleRehearsalInput(
  input: { runId?: string; schoolId?: string },
): { ok: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!isNonEmptyString(input.runId)) addError(errors, 'runId', 'must be a non-empty string');
  if (!isNonEmptyString(input.schoolId)) addError(errors, 'schoolId', 'must be a non-empty string');

  return { ok: errors.length === 0, errors };
}

export function validateTask030ControlActionRehearsalInput(
  input: { runId?: string; schoolId?: string; actionId?: string },
): { ok: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!isNonEmptyString(input.runId)) addError(errors, 'runId', 'must be a non-empty string');
  if (!isNonEmptyString(input.schoolId)) addError(errors, 'schoolId', 'must be a non-empty string');
  if (!isNonEmptyString(input.actionId)) addError(errors, 'actionId', 'must be a non-empty string');

  return { ok: errors.length === 0, errors };
}

export function validateTask030RollbackDrillInput(
  input: { runId?: string; schoolId?: string },
): { ok: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!isNonEmptyString(input.runId)) addError(errors, 'runId', 'must be a non-empty string');
  if (!isNonEmptyString(input.schoolId)) addError(errors, 'schoolId', 'must be a non-empty string');

  return { ok: errors.length === 0, errors };
}

export function validateTask030StaffTrainingPackInput(
  input: { runId?: string; schoolId?: string },
): { ok: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!isNonEmptyString(input.runId)) addError(errors, 'runId', 'must be a non-empty string');
  if (!isNonEmptyString(input.schoolId)) addError(errors, 'schoolId', 'must be a non-empty string');

  return { ok: errors.length === 0, errors };
}

export function validateTask030ReportInput(
  input: { runId?: string; schoolId?: string },
): { ok: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!isNonEmptyString(input.runId)) addError(errors, 'runId', 'must be a non-empty string');
  if (!isNonEmptyString(input.schoolId)) addError(errors, 'schoolId', 'must be a non-empty string');

  return { ok: errors.length === 0, errors };
}

export function rejectTask030ForbiddenFields(
  obj: Record<string, unknown>,
): string[] {
  const found: string[] = [];

  function walk(value: unknown, path: string): void {
    if (!value || typeof value !== 'object') return;

    for (const key of Object.keys(value as Record<string, unknown>)) {
      const fullPath = path ? `${path}.${key}` : key;
      if (TASK030_FORBIDDEN_OUTPUT_FIELDS.includes(key)) {
        found.push(fullPath);
      }
      walk((value as Record<string, unknown>)[key], fullPath);
    }
  }

  walk(obj, '');
  return found;
}

export function redactTask030SensitiveValue(value: string): string {
  if (typeof value !== 'string' || value.length < 3) return 'redacted';
  return value
    .replace(EMAIL_REGEX, '[REDACTED_EMAIL]')
    .replace(PHONE_REGEX, '[REDACTED_PHONE]');
}

export function createSafeTask030ValidationError(
  title: string,
  reasonCodes: string[],
): { ok: false; error: { title: string; reasonCodes: string[]; safeMessage: string } } {
  return {
    ok: false,
    error: {
      title,
      reasonCodes,
      safeMessage: `VALIDATION_ERROR: ${title} [${reasonCodes.join(', ')}]`,
    },
  };
}
