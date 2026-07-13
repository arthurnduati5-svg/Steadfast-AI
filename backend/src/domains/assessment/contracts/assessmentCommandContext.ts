export type AssessmentActorRole =
  | 'student'
  | 'teacher'
  | 'lead_teacher'
  | 'department_head'
  | 'admin'
  | 'parent'
  | 'system_marking'
  | 'system_job'
  | 'support_owner';

export type AssessmentCommandSource =
  | 'api'
  | 'system'
  | 'job'
  | 'webhook'
  | 'internal';

export interface AssessmentCommandContext {
  actorId: string;
  actorRole: AssessmentActorRole;
  schoolId: string;
  requestId?: string;
  correlationId: string;
  causationId?: string;
  idempotencyKey?: string;
  source: AssessmentCommandSource;
  now: string;
  policyVersionRefs?: Record<string, string>;
  studentToken?: string;
  classId?: string;
  subjectId?: string;
  curriculumVersionId?: string;
  objectiveVersionIds?: string[];
}

export interface AssessmentGovernedCommand<TBody = unknown> {
  context: AssessmentCommandContext;
  commandType: string;
  commandFingerprint: string;
  aggregateType?: string;
  aggregateId?: string;
  expectedVersion?: number;
  body: TBody;
}
