export const PROJECTION_ROLES = [
  'student',
  'teacher',
  'lead_teacher',
  'department_head',
  'admin',
  'parent',
  'system_marking',
  'system_job',
  'support_owner',
] as const;

export type ProjectionRole = typeof PROJECTION_ROLES[number];

export const FORBIDDEN_FIELDS = [
  'answerKey',
  'correctAnswer',
  'modelAnswer',
  'markingScheme',
  'rubricInternal',
  'teacherOnlyNotes',
  'rawStudentAnswer',
  'rawStudentWork',
  'rawIntegritySignal',
  'peerIdentifiableData',
  'rawParentData',
  'rawTeacherData',
  'rawPrompt',
  'rawProviderResponse',
  'chainOfThought',
  'hiddenReasoning',
  'scratchpad',
  'secret',
  'token',
  'apiKey',
] as const;

export type ForbiddenField = typeof FORBIDDEN_FIELDS[number];

export interface ForbiddenFieldRegistry {
  readonly forbiddenFields: ReadonlySet<string>;
  isForbidden(field: string): boolean;
  assertNoForbiddenFields(payload: Record<string, unknown>): void;
  findForbidden(payload: unknown, path?: string): string[];
}

export interface ProjectionPolicyDecision {
  role: ProjectionRole;
  allowed: boolean;
  forbiddenFieldsFound: string[];
  strippedFields: string[];
  safeMessage: string;
  reasonCode: string;
}

export type RoleProjectionMap = Record<ProjectionRole, ReadonlySet<string>>;
