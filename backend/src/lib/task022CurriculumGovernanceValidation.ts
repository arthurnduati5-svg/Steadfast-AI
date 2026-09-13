import {
  TASK022_SOURCE_TYPES, TASK022_SOURCE_APPROVAL_STATUSES,
  TASK022_SOURCE_VISIBILITY_SCOPES, TASK022_CURRICULUM_TYPES,
  TASK022_CURRICULUM_VERSION_STATUSES, TASK022_CONTENT_ITEM_TYPES,
  TASK022_CONTENT_GOVERNANCE_STATUSES, TASK022_CONTENT_GROUNDING_DECISIONS,
  TASK022_CONTENT_GAP_TYPES, TASK022_FORBIDDEN_FIELDS,
  type Task022CurriculumGovernanceContext,
  type Task022ApprovedSource,
  type Task022SourceApprovalRequest,
  type Task022SourceApprovalDecision,
  type Task022CurriculumRegistryEntry,
  type Task022CurriculumVersion,
  type Task022ContentItem,
  type Task022TopicSkillObjectiveMap,
  type Task022LearningObjectiveGovernanceRecord,
  type Task022ContentGroundingRequest,
  type Task022ContentRetrievalRequest,
  type Task022CurriculumImportDryRunRequest,
  type Task022SourceType,
  type Task022SourceApprovalStatus,
  type Task022CurriculumType,
  type Task022CurriculumVersionStatus,
  type Task022ContentItemType,
  type Task022ContentGovernanceStatus,
  type Task022ContentGroundingDecisionValue,
} from '../contracts/task022CurriculumGovernanceContracts';

const VALID_LEARNER_SAFE_SCOPES: readonly string[] = [
  'learner_safe', 'parent_safe', 'peer_safe',
];

const AI_GENERATED_DRAFT = 'ai_generated_draft' as const;
const APPROVED_STATUS = 'approved' as const;
const STALE_STATUS = 'stale' as const;
const TEACHER_ONLY_SCOPE = 'teacher_only' as const;
const ANSWER_KEY_TYPE = 'answer_key' as const;
const MARKING_SCHEME_TYPE = 'marking_scheme' as const;
const DEEN_GUIDANCE_TYPE = 'deen_guidance' as const;
const PRIVATE_DEEN_BLOCKED = 'private_deen_blocked' as const;
const SAFEGUARDING_BLOCKED = 'safeguarding_blocked' as const;
const ANSWER_ARTIFACT_BLOCKED = 'answer_artifact_blocked' as const;
const RAW_CONTENT_BLOCKED = 'raw_content_blocked' as const;

export interface Task022ValidationError {
  code: string;
  message: string;
  field?: string;
}

export function createSafeTask022ValidationError(message: string): Error {
  return new Error(`Task022 validation error: ${message}`);
}

function safeError(msg: string): never {
  throw createSafeTask022ValidationError(msg);
}

export function isString(val: unknown): val is string {
  return typeof val === 'string' && val.length > 0;
}

function isRecord(val: unknown): val is Record<string, unknown> {
  return val !== null && typeof val === 'object' && !Array.isArray(val);
}

function validateConstantSet<T extends string>(
  value: unknown,
  validSet: readonly T[],
  label: string,
): T {
  if (!isString(value)) {
    safeError(`${label} must be a non-empty string`);
  }
  if (!(validSet as readonly string[]).includes(value)) {
    safeError(`Unsupported ${label}: ${value}`);
  }
  return value as T;
}

// ── Simple validation helpers for route-level use ────────────────

const VALID_CURRICULUM_FAMILIES: readonly string[] = ['cambridge_academic', 'madrasa_deen', 'school_custom', 'system_seed'];

const VALID_TRUST_LEVELS: readonly string[] = [
  'system_seeded', 'school_approved', 'teacher_approved', 'review_required', 'restricted', 'blocked',
];

export function isValidCurriculumFamily(value: unknown): boolean {
  return typeof value === 'string' && VALID_CURRICULUM_FAMILIES.includes(value);
}

export function isValidSourceType(value: unknown): boolean {
  return typeof value === 'string' && TASK022_SOURCE_TYPES.includes(value);
}

export function isValidTrustLevel(value: unknown): boolean {
  return typeof value === 'string' && VALID_TRUST_LEVELS.includes(value);
}

export function containsForbiddenFields(body: Record<string, unknown>): string[] {
  const detected: string[] = [];
  for (const field of TASK022_FORBIDDEN_FIELDS) {
    if (field in body && body[field] !== undefined && body[field] !== null) {
      detected.push(field);
    }
  }
  return detected;
}

export function validateString(value: unknown, fieldName: string): string | null {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return `${fieldName} must be a non-empty string.`;
  }
  return null;
}

export function validateOptionalString(value: unknown, fieldName: string): string | null {
  if (value !== undefined && value !== null && (typeof value !== 'string' || value.trim().length === 0)) {
    return `${fieldName} must be a non-empty string when provided.`;
  }
  return null;
}

export function collectErrors(validations: (string | null)[]): string[] {
  return validations.filter((e): e is string => e !== null);
}

export function sanitizePayload(body: Record<string, unknown>): Record<string, unknown> {
  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    if (!TASK022_FORBIDDEN_FIELDS.has(key)) {
      safe[key] = value;
    }
  }
  return safe;
}

export function validateTask022SourceType(value: string): Task022SourceType {
  return validateConstantSet(value, TASK022_SOURCE_TYPES, 'sourceType');
}

export function validateTask022SourceApprovalStatus(value: string): Task022SourceApprovalStatus {
  return validateConstantSet(value, TASK022_SOURCE_APPROVAL_STATUSES, 'sourceApprovalStatus');
}

export function validateTask022CurriculumType(value: string): Task022CurriculumType {
  return validateConstantSet(value, TASK022_CURRICULUM_TYPES, 'curriculumType');
}

export function validateTask022CurriculumVersionStatus(value: string): Task022CurriculumVersionStatus {
  return validateConstantSet(value, TASK022_CURRICULUM_VERSION_STATUSES, 'curriculumVersionStatus');
}

export function validateTask022ContentItemType(value: string): Task022ContentItemType {
  return validateConstantSet(value, TASK022_CONTENT_ITEM_TYPES, 'contentItemType');
}

export function validateTask022ContentGovernanceStatus(value: string): Task022ContentGovernanceStatus {
  return validateConstantSet(value, TASK022_CONTENT_GOVERNANCE_STATUSES, 'contentGovernanceStatus');
}

export function validateTask022ContentGroundingDecision(value: string): Task022ContentGroundingDecisionValue {
  return validateConstantSet(value, TASK022_CONTENT_GROUNDING_DECISIONS, 'contentGroundingDecision');
}

function validateGovernanceContext(ctx: Record<string, unknown>): void {
  if (!isString(ctx.schoolId)) {
    safeError('schoolId is required and must be a non-empty string');
  }
  if (!ctx.verifiedSchoolContext) {
    safeError('Verified school context is required');
  }
  if (!isString(ctx.actorId)) {
    safeError('actorId is required and must be a non-empty string');
  }
  if (!isString(ctx.actorRole)) {
    safeError('actorRole is required and must be a non-empty string');
  }
}

function rejectForbiddenPayload(obj: Record<string, unknown>, path: string): string[] {
  const found: string[] = [];
  for (const key of Object.keys(obj)) {
    const fullPath = path ? `${path}.${key}` : key;
    if (TASK022_FORBIDDEN_FIELDS.has(key)) {
      found.push(fullPath);
    }
    const val = obj[key];
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      found.push(...rejectForbiddenPayload(val as Record<string, unknown>, fullPath));
    }
  }
  return found;
}

export function rejectForbiddenTask022PayloadFields(payload: Record<string, unknown>): string[] {
  return rejectForbiddenPayload(payload, '');
}

function checkForbiddenIn(payload: Record<string, unknown>): void {
  const forbidden = rejectForbiddenPayload(payload, '');
  if (forbidden.length > 0) {
    safeError(`Payload contains forbidden fields: ${forbidden.join(', ')}`);
  }
}

function checkAnswerArtifacts(payload: Record<string, unknown>): void {
  if (payload.contentType === ANSWER_KEY_TYPE || payload.contentType === MARKING_SCHEME_TYPE) {
    return;
  }
  if (
    payload.answerKey !== undefined || payload.correctAnswer !== undefined ||
    payload.modelAnswer !== undefined
  ) {
    safeError('Payload contains answer artifact fields');
  }
}

function checkTeacherOnlyInLearnerSafe(scope: unknown, teacherOnly: unknown): void {
  if (scope && isString(scope) && VALID_LEARNER_SAFE_SCOPES.includes(scope) && teacherOnly === true) {
    safeError('Teacher-only content in learner-safe context is rejected');
  }
}

function checkPrivateDeenText(payload: Record<string, unknown>): void {
  if (
    payload.privateDeenText !== undefined || payload.deenSensitiveRaw !== undefined ||
    payload.rawDeenText !== undefined
  ) {
    safeError('Payload contains private Deen text');
  }
}

function checkSafeguardingRaw(payload: Record<string, unknown>): void {
  if (
    payload.safeguardingRaw !== undefined || payload.safeguardingCaseNote !== undefined ||
    payload.safeguardingDisclosure !== undefined
  ) {
    safeError('Payload contains safeguarding raw content');
  }
}

function checkHiddenReasoning(payload: Record<string, unknown>): void {
  if (
    payload.hiddenReasoning !== undefined || payload.chainOfThought !== undefined ||
    payload.scratchpad !== undefined
  ) {
    safeError('Payload contains hidden reasoning');
  }
}

function checkProviderPayloads(payload: Record<string, unknown>): void {
  if (
    payload.providerPrompt !== undefined || payload.providerResponse !== undefined ||
    payload.rawProviderResponse !== undefined
  ) {
    safeError('Payload contains provider payloads');
  }
}

function checkCredentials(payload: Record<string, unknown>): void {
  if (
    payload.authorization !== undefined || payload.apiKey !== undefined ||
    payload.token !== undefined || payload.cookie !== undefined ||
    payload.privateKey !== undefined || payload.connectionString !== undefined
  ) {
    safeError('Payload contains credentials');
  }
}

function runSafetyChecks(payload: Record<string, unknown>, scope?: unknown): void {
  checkForbiddenIn(payload);
  checkAnswerArtifacts(payload);
  checkPrivateDeenText(payload);
  checkSafeguardingRaw(payload);
  checkHiddenReasoning(payload);
  checkProviderPayloads(payload);
  checkCredentials(payload);
  if (scope !== undefined) {
    checkTeacherOnlyInLearnerSafe(scope, payload.teacherOnly);
  }
}

export function validateTask022CurriculumGovernanceContext(ctx: any): Task022CurriculumGovernanceContext {
  if (!isRecord(ctx)) {
    safeError('Curriculum governance context must be a non-null object');
  }
  validateGovernanceContext(ctx);
  const result: Task022CurriculumGovernanceContext = {
    schoolId: ctx.schoolId as string,
    actorId: ctx.actorId as string,
    actorRole: ctx.actorRole as string,
    verifiedSchoolContext: true,
    curriculumType: ctx.curriculumType
      ? validateTask022CurriculumType(ctx.curriculumType as string)
      : undefined,
    subjectId: ctx.subjectId as string | undefined,
    subjectKey: ctx.subjectKey as string | undefined,
    correlationId: ctx.correlationId as string | undefined,
    requestId: ctx.requestId as string | undefined,
  };
  return result;
}

export function validateTask022ApprovedSource(data: any): Task022ApprovedSource {
  if (!isRecord(data)) {
    safeError('Approved source must be a non-null object');
  }
  runSafetyChecks(data);

  if (!isString(data.sourceId)) {
    safeError('sourceId is required');
  }
  if (!isString(data.sourceKey)) {
    safeError('sourceKey is required');
  }
  if (!isString(data.title)) {
    safeError('title is required');
  }

  const sourceType = validateTask022SourceType(data.sourceType as string);
  if (sourceType === AI_GENERATED_DRAFT && data.approvalStatus !== APPROVED_STATUS) {
    safeError('AI-generated draft must be explicitly reviewed before approval');
  }

  const approvalStatus = validateTask022SourceApprovalStatus(data.approvalStatus as string);

  let visibilityScope: string | undefined;
  if (data.visibilityScope) {
    visibilityScope = validateConstantSet(
      data.visibilityScope, TASK022_SOURCE_VISIBILITY_SCOPES, 'visibilityScope',
    );
  }

  const result: Task022ApprovedSource = {
    id: data.id as string || data.sourceId as string,
    sourceId: data.sourceId as string,
    schoolId: data.schoolId as string | undefined,
    sourceKey: data.sourceKey as string,
    title: data.title as string,
    sourceType,
    curriculumFamily: data.curriculumFamily as any,
    curriculumType: data.curriculumType
      ? validateTask022CurriculumType(data.curriculumType as string)
      : undefined,
    subject: data.subject as string | undefined,
    stage: data.stage as string | undefined,
    topic: data.topic as string | undefined,
    deenCategory: data.deenCategory as string | undefined,
    trustLevel: data.trustLevel as any,
    approvalStatus,
    visibilityScope: visibilityScope as any,
    approvedByActorId: data.approvedByActorId as string | undefined,
    approvedByRole: data.approvedByRole as string | undefined,
    approvedAt: data.approvedAt as string | undefined,
    reviewRequired: data.reviewRequired === true,
    restrictedUse: data.restrictedUse === true,
    citationMetadata: data.citationMetadata as Record<string, unknown> | undefined,
    metadata: data.metadata as Record<string, unknown> | undefined,
    createdAt: data.createdAt as string,
    updatedAt: data.updatedAt as string,
  };
  return result;
}

export function validateTask022SourceApprovalRequest(data: any): Task022SourceApprovalRequest {
  if (!isRecord(data)) {
    safeError('Source approval request must be a non-null object');
  }
  runSafetyChecks(data);

  if (!isString(data.requestId)) {
    safeError('requestId is required');
  }
  if (!isString(data.sourceId)) {
    safeError('sourceId is required for source-based decisions');
  }
  if (!isString(data.schoolId)) {
    safeError('schoolId is required');
  }
  if (!isString(data.requestedByActorId)) {
    safeError('requestedByActorId is required');
  }
  if (!isString(data.requestedByRole)) {
    safeError('requestedByRole is required');
  }

  const status = validateTask022SourceApprovalStatus(data.status as string);

  const result: Task022SourceApprovalRequest = {
    id: data.id as string || data.requestId as string,
    requestId: data.requestId as string,
    sourceId: data.sourceId as string,
    schoolId: data.schoolId as string,
    requestedByActorId: data.requestedByActorId as string,
    requestedByRole: data.requestedByRole as string,
    requestNotes: data.requestNotes as string | undefined,
    status,
    createdAt: data.createdAt as string,
    updatedAt: data.updatedAt as string,
  };
  return result;
}

export function validateTask022SourceApprovalDecision(data: any): Task022SourceApprovalDecision {
  if (!isRecord(data)) {
    safeError('Source approval decision must be a non-null object');
  }
  runSafetyChecks(data);

  if (!isString(data.decisionId)) {
    safeError('decisionId is required');
  }
  if (!isString(data.sourceId)) {
    safeError('sourceId is required');
  }
  if (!isString(data.schoolId)) {
    safeError('schoolId is required');
  }
  if (!isString(data.decidedByActorId)) {
    safeError('decidedByActorId is required');
  }
  if (!isString(data.decidedByRole)) {
    safeError('decidedByRole is required');
  }

  const decision = validateTask022SourceApprovalStatus(data.decision as string);

  let visibilityScope: any;
  if (data.visibilityScope) {
    visibilityScope = validateConstantSet(
      data.visibilityScope, TASK022_SOURCE_VISIBILITY_SCOPES, 'visibilityScope',
    );
  }

  const result: Task022SourceApprovalDecision = {
    id: data.id as string || data.decisionId as string,
    decisionId: data.decisionId as string,
    sourceId: data.sourceId as string,
    schoolId: data.schoolId as string,
    decidedByActorId: data.decidedByActorId as string,
    decidedByRole: data.decidedByRole as string,
    decision,
    visibilityScope: visibilityScope as any,
    reasonCodes: Array.isArray(data.reasonCodes) ? data.reasonCodes as string[] : [],
    safeNotes: data.safeNotes as string | undefined,
    decidedAt: data.decidedAt as string,
  };
  return result;
}

export function validateTask022CurriculumRegistryEntry(data: any): Task022CurriculumRegistryEntry {
  if (!isRecord(data)) {
    safeError('Curriculum registry entry must be a non-null object');
  }
  runSafetyChecks(data);

  if (!isString(data.curriculumId)) {
    safeError('curriculumId is required for curriculum-based decisions');
  }
  if (!isString(data.title)) {
    safeError('title is required');
  }

  const curriculumType = validateTask022CurriculumType(data.curriculumType as string);

  if (data.subjectId || data.subjectKey) {
    if (!isString(data.subjectId) && !isString(data.subjectKey)) {
      safeError('subjectId or subjectKey must be a non-empty string for subject-level content');
    }
  }

  const result: Task022CurriculumRegistryEntry = {
    id: data.id as string || data.curriculumId as string,
    curriculumId: data.curriculumId as string,
    schoolId: data.schoolId as string | undefined,
    curriculumType,
    title: data.title as string,
    subjectId: data.subjectId as string | undefined,
    subjectKey: data.subjectKey as string | undefined,
    curriculumFamily: data.curriculumFamily as any,
    versionCount: typeof data.versionCount === 'number' ? data.versionCount : 0,
    activeVersionId: data.activeVersionId as string | undefined,
    metadata: data.metadata as Record<string, unknown> | undefined,
    createdAt: data.createdAt as string,
    updatedAt: data.updatedAt as string,
  };
  return result;
}

export function validateTask022CurriculumVersion(data: any): Task022CurriculumVersion {
  if (!isRecord(data)) {
    safeError('Curriculum version must be a non-null object');
  }
  runSafetyChecks(data);

  if (!isString(data.curriculumVersionId)) {
    safeError('curriculumVersionId is required for version-based decisions');
  }
  if (!isString(data.curriculumId)) {
    safeError('curriculumId is required');
  }
  if (!isString(data.versionCode)) {
    safeError('versionCode is required');
  }
  if (!isString(data.title)) {
    safeError('title is required');
  }

  validateTask022CurriculumType(data.curriculumType as string);
  const status = validateTask022CurriculumVersionStatus(data.status as string);

  const result: Task022CurriculumVersion = {
    id: data.id as string || data.curriculumVersionId as string,
    curriculumVersionId: data.curriculumVersionId as string,
    curriculumId: data.curriculumId as string,
    schoolId: data.schoolId as string | undefined,
    versionCode: data.versionCode as string,
    title: data.title as string,
    status,
    curriculumFamily: data.curriculumFamily as any,
    curriculumType: data.curriculumType as any,
    effectiveFrom: data.effectiveFrom as string | undefined,
    effectiveTo: data.effectiveTo as string | undefined,
    metadata: data.metadata as Record<string, unknown> | undefined,
    createdAt: data.createdAt as string,
    updatedAt: data.updatedAt as string,
  };
  return result;
}

export function validateTask022ContentItem(data: any): Task022ContentItem {
  if (!isRecord(data)) {
    safeError('Content item must be a non-null object');
  }

  if (!isString(data.contentItemId)) {
    safeError('contentItemId is required');
  }

  const contentType = validateTask022ContentItemType(data.contentType as string);
  const governanceStatus = validateTask022ContentGovernanceStatus(data.governanceStatus as string);

  checkForbiddenIn(data);
  checkHiddenReasoning(data);
  checkProviderPayloads(data);
  checkCredentials(data);

  if (
    contentType === ANSWER_KEY_TYPE || contentType === MARKING_SCHEME_TYPE
  ) {
    if (data.studentSafeContent || data.teacherSafeContent) {
      safeError(`Content type ${contentType} must not expose content directly`);
    }
  }

  if (data.teacherOnly === true) {
    if (data.studentSafeContent) {
      safeError('Teacher-only content must not contain studentSafeContent');
    }
  }

  checkPrivateDeenText(data);
  checkSafeguardingRaw(data);

  const result: Task022ContentItem = {
    id: data.id as string || data.contentItemId as string,
    contentItemId: data.contentItemId as string,
    schoolId: data.schoolId as string | undefined,
    curriculumVersionId: data.curriculumVersionId as string | undefined,
    curriculumId: data.curriculumId as string | undefined,
    topicId: data.topicId as string | undefined,
    skillId: data.skillId as string | undefined,
    learningObjectiveId: data.learningObjectiveId as string | undefined,
    sourceId: data.sourceId as string | undefined,
    contentType,
    governanceStatus,
    sensitivity: data.sensitivity as any,
    studentSafeContent: data.studentSafeContent as string | undefined,
    teacherSafeContent: data.teacherSafeContent as string | undefined,
    answerKeyProtected: data.answerKeyProtected === true,
    teacherOnly: data.teacherOnly === true,
    reviewState: data.reviewState as any,
    reasonCodes: Array.isArray(data.reasonCodes) ? data.reasonCodes as string[] : undefined,
    metadata: data.metadata as Record<string, unknown> | undefined,
    createdAt: data.createdAt as string,
    updatedAt: data.updatedAt as string,
  };
  return result;
}

export function validateTask022TopicSkillObjectiveMap(data: any): Task022TopicSkillObjectiveMap {
  if (!isRecord(data)) {
    safeError('Topic-skill-objective map must be a non-null object');
  }
  runSafetyChecks(data);

  if (!isString(data.mapId)) {
    safeError('mapId is required');
  }
  if (!isString(data.curriculumVersionId)) {
    safeError('curriculumVersionId is required');
  }
  if (!isString(data.topicId)) {
    safeError('topicId is required');
  }
  if (!isString(data.topicTitle)) {
    safeError('topicTitle is required');
  }
  if (!Array.isArray(data.skillIds)) {
    safeError('skillIds must be an array');
  }
  if (!Array.isArray(data.objectiveIds)) {
    safeError('objectiveIds must be an array');
  }

  const result: Task022TopicSkillObjectiveMap = {
    id: data.id as string || data.mapId as string,
    mapId: data.mapId as string,
    curriculumVersionId: data.curriculumVersionId as string,
    topicId: data.topicId as string,
    topicTitle: data.topicTitle as string,
    skillIds: data.skillIds as string[],
    objectiveIds: data.objectiveIds as string[],
    metadata: data.metadata as Record<string, unknown> | undefined,
    createdAt: data.createdAt as string,
    updatedAt: data.updatedAt as string,
  };
  return result;
}

export function validateTask022LearningObjectiveGovernanceRecord(data: any): Task022LearningObjectiveGovernanceRecord {
  if (!isRecord(data)) {
    safeError('Learning objective governance record must be a non-null object');
  }
  runSafetyChecks(data);

  if (!isString(data.recordId)) {
    safeError('recordId is required');
  }
  if (!isString(data.objectiveId)) {
    safeError('objectiveId is required');
  }

  const governanceStatus = validateTask022ContentGovernanceStatus(data.governanceStatus as string);

  const result: Task022LearningObjectiveGovernanceRecord = {
    id: data.id as string || data.recordId as string,
    recordId: data.recordId as string,
    objectiveId: data.objectiveId as string,
    schoolId: data.schoolId as string | undefined,
    curriculumVersionId: data.curriculumVersionId as string | undefined,
    governanceStatus,
    sourceRequirement: data.sourceRequirement as Record<string, unknown> | undefined,
    requiresApprovedSource: data.requiresApprovedSource === true,
    requiresCambridgeSource: data.requiresCambridgeSource === true,
    requiresDeenSource: data.requiresDeenSource === true,
    reasonCodes: Array.isArray(data.reasonCodes) ? data.reasonCodes as string[] : [],
    createdAt: data.createdAt as string,
    updatedAt: data.updatedAt as string,
  };
  return result;
}

export function validateTask022ContentGroundingRequest(data: any): Task022ContentGroundingRequest {
  if (!isRecord(data)) {
    safeError('Content grounding request must be a non-null object');
  }
  runSafetyChecks(data);

  if (!isString(data.requestId)) {
    safeError('requestId is required');
  }
  if (!isString(data.contentItemId)) {
    safeError('contentItemId is required');
  }
  if (!isString(data.sourceId)) {
    safeError('sourceId is required for source-based decisions');
  }

  const result: Task022ContentGroundingRequest = {
    requestId: data.requestId as string,
    contentItemId: data.contentItemId as string,
    curriculumVersionId: data.curriculumVersionId as string | undefined,
    sourceId: data.sourceId as string | undefined,
    schoolId: data.schoolId as string | undefined,
    requestedByActorId: data.requestedByActorId as string | undefined,
    requestedByRole: data.requestedByRole as string | undefined,
    context: data.context as Record<string, unknown> | undefined,
    createdAt: data.createdAt as string,
  };
  return result;
}

export function validateTask022ContentRetrievalRequest(data: any): Task022ContentRetrievalRequest {
  if (!isRecord(data)) {
    safeError('Content retrieval request must be a non-null object');
  }

  if (data.curriculumType) {
    validateTask022CurriculumType(data.curriculumType as string);
  }

  const result: Task022ContentRetrievalRequest = {
    curriculumType: data.curriculumType as any,
    curriculumFamily: data.curriculumFamily as any,
    subject: data.subject as string | undefined,
    topic: data.topic as string | undefined,
    skill: data.skill as string | undefined,
    learningObjectiveId: data.learningObjectiveId as string | undefined,
    stage: data.stage as string | undefined,
    sourceTrustLevel: data.sourceTrustLevel as any,
    schoolId: data.schoolId as string | undefined,
    requireApprovedSource: data.requireApprovedSource === true,
    requireGroundedContent: data.requireGroundedContent === true,
  };
  return result;
}

export function validateTask022CurriculumImportDryRunRequest(data: any): Task022CurriculumImportDryRunRequest {
  if (!isRecord(data)) {
    safeError('Curriculum import dry run request must be a non-null object');
  }
  runSafetyChecks(data);

  if (!isString(data.importId)) {
    safeError('importId is required');
  }
  if (!isString(data.schoolId)) {
    safeError('schoolId is required');
  }
  if (!isString(data.requestedByActorId)) {
    safeError('requestedByActorId is required');
  }
  if (!isString(data.requestedByRole)) {
    safeError('requestedByRole is required');
  }

  const curriculumType = validateTask022CurriculumType(data.curriculumType as string);

  if (!isRecord(data.payload)) {
    safeError('payload must be a non-null object');
  }

  const forbiddenInPayload = rejectForbiddenPayload(data.payload as Record<string, unknown>, '');
  if (forbiddenInPayload.length > 0) {
    safeError(`Import payload contains forbidden fields: ${forbiddenInPayload.join(', ')}`);
  }

  const result: Task022CurriculumImportDryRunRequest = {
    importId: data.importId as string,
    schoolId: data.schoolId as string,
    curriculumType,
    subjectId: data.subjectId as string | undefined,
    payload: data.payload as Record<string, unknown>,
    requestedByActorId: data.requestedByActorId as string,
    requestedByRole: data.requestedByRole as string,
    createdAt: data.createdAt as string,
  };
  return result;
}
