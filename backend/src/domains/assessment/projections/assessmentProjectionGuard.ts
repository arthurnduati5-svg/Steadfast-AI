import type {
  ProjectionRole,
  ForbiddenFieldRegistry,
  ProjectionPolicyDecision,
  RoleProjectionMap,
} from '../contracts/assessmentProjectionContracts';
import { FORBIDDEN_FIELDS } from '../contracts/assessmentProjectionContracts';

const STUDENT_FORBIDDEN = new Set([
  'answerKey', 'correctAnswer', 'modelAnswer', 'markingScheme',
  'rubricInternal', 'teacherOnlyNotes', 'rawIntegritySignal',
  'rawPrompt', 'rawProviderResponse', 'chainOfThought',
  'hiddenReasoning', 'scratchpad', 'secret', 'token', 'apiKey',
]);

const PARENT_FORBIDDEN = new Set([
  'answerKey', 'correctAnswer', 'modelAnswer', 'markingScheme',
  'rubricInternal', 'teacherOnlyNotes', 'rawStudentAnswer',
  'rawStudentWork', 'rawIntegritySignal', 'peerIdentifiableData',
  'rawTeacherData', 'rawPrompt', 'rawProviderResponse',
  'chainOfThought', 'hiddenReasoning', 'scratchpad', 'secret',
  'token', 'apiKey',
]);

const TEACHER_FORBIDDEN = new Set([
  'secret', 'token', 'apiKey',
]);

const SYSTEM_MARKING_FORBIDDEN = new Set([
  'rawPrompt', 'rawProviderResponse', 'chainOfThought',
  'hiddenReasoning', 'scratchpad', 'secret', 'token', 'apiKey',
  'peerIdentifiableData', 'rawParentData', 'rawTeacherData',
]);

const ADMIN_FORBIDDEN = new Set([
  'secret', 'token', 'apiKey',
]);

const DEFAULT_ROLE_PROJECTIONS: RoleProjectionMap = {
  student: STUDENT_FORBIDDEN,
  teacher: TEACHER_FORBIDDEN,
  lead_teacher: TEACHER_FORBIDDEN,
  department_head: TEACHER_FORBIDDEN,
  admin: ADMIN_FORBIDDEN,
  parent: PARENT_FORBIDDEN,
  system_marking: SYSTEM_MARKING_FORBIDDEN,
  system_job: SYSTEM_MARKING_FORBIDDEN,
  support_owner: ADMIN_FORBIDDEN,
};

const FORBIDDEN_SET = new Set<string>(FORBIDDEN_FIELDS);

export const defaultForbiddenFieldRegistry: ForbiddenFieldRegistry = {
  forbiddenFields: FORBIDDEN_SET,

  isForbidden(field: string): boolean {
    return FORBIDDEN_SET.has(field);
  },

  assertNoForbiddenFields(payload: Record<string, unknown>): void {
    const found = this.findForbidden(payload);
    if (found.length > 0) {
      throw new Error(`Forbidden fields detected: ${found.join(', ')}`);
    }
  },

  findForbidden(payload: unknown, path = ''): string[] {
    if (!payload || typeof payload !== 'object') return [];
    const found: string[] = [];
    for (const [key, value] of Object.entries(payload as Record<string, unknown>)) {
      if (FORBIDDEN_SET.has(key)) {
        found.push(path ? `${path}.${key}` : key);
      }
      if (value && typeof value === 'object') {
        found.push(...this.findForbidden(value, path ? `${path}.${key}` : key));
      }
    }
    return found;
  },
};

function getForbiddenForRole(role: ProjectionRole): ReadonlySet<string> {
  return DEFAULT_ROLE_PROJECTIONS[role] ?? STUDENT_FORBIDDEN;
}

export function assertProjectionAllowed(
  role: ProjectionRole,
  payload: Record<string, unknown>,
): ProjectionPolicyDecision {
  const forbidden = getForbiddenForRole(role);
  const forbiddenFieldsFound: string[] = [];

  function scan(obj: Record<string, unknown>, prefix = ''): void {
    for (const [key, value] of Object.entries(obj)) {
      const fullPath = prefix ? `${prefix}.${key}` : key;
      if (forbidden.has(key)) {
        forbiddenFieldsFound.push(fullPath);
      }
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        scan(value as Record<string, unknown>, fullPath);
      }
    }
  }

  scan(payload);

  if (forbiddenFieldsFound.length > 0) {
    return {
      role,
      allowed: false,
      forbiddenFieldsFound,
      strippedFields: forbiddenFieldsFound,
      safeMessage: `Role ${role} is not allowed to access fields: ${forbiddenFieldsFound.join(', ')}`,
      reasonCode: 'projection_forbidden_fields_detected',
    };
  }

  return {
    role,
    allowed: true,
    forbiddenFieldsFound: [],
    strippedFields: [],
    safeMessage: `Role ${role} projection allowed`,
    reasonCode: 'projection_allowed',
  };
}

export function stripForbiddenFieldsForRole(
  role: ProjectionRole,
  payload: Record<string, unknown>,
): Record<string, unknown> {
  const forbidden = getForbiddenForRole(role);
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(payload)) {
    if (forbidden.has(key)) continue;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const nested = stripForbiddenFieldsForRole(role, value as Record<string, unknown>);
      if (Object.keys(nested).length > 0) {
        result[key] = nested;
      }
    } else {
      result[key] = value;
    }
  }

  return result;
}

export function getRoleProjectionMap(): RoleProjectionMap {
  return DEFAULT_ROLE_PROJECTIONS;
}
