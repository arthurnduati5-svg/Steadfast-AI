import {
  PHASE3_PEER_GROUP_TYPES,
  PHASE3_PEER_GROUP_STATUSES,
  PHASE3_PEER_CONTENT_TYPES,
  PHASE3_PEER_CONTENT_STATUSES,
  PHASE3_PEER_MODERATION_STATUSES,
  PHASE3_PEER_VISIBILITY_LEVELS,
  PHASE3_PEER_RESOURCE_TYPES,
  PHASE3_PEER_HIGHLIGHT_TYPES,
  PHASE3_HEALTHY_CHALLENGE_TYPES,
  PHASE3_HEALTHY_CHALLENGE_STATUSES,
  PHASE3_PEER_LEARNING_ACTIONS,
  PHASE3_PEER_LEARNING_SOURCE_TYPES,
  PHASE3_PEER_LEARNING_SIGNAL_TYPES,
  PHASE3_PEER_LEARNING_PRIORITIES,
  PHASE3_PEER_LEARNING_FORBIDDEN_FIELDS,
  type Phase3PeerGroupType,
  type Phase3PeerGroupStatus,
  type Phase3PeerContentType,
  type Phase3PeerContentStatus,
  type Phase3PeerModerationStatus,
  type Phase3PeerVisibilityLevel,
  type Phase3PeerResourceType,
  type Phase3PeerHighlightType,
  type Phase3HealthyChallengeType,
  type Phase3HealthyChallengeStatus,
  type Phase3PeerLearningAction,
  type Phase3PeerLearningSourceType,
  type Phase3PeerLearningSignalType,
  type Phase3PeerLearningPriority,
  type Phase3PeerLearningContext,
  type Phase3PeerLearningQuery,
  type Phase3PeerLearningTeacherQuery,
} from '../contracts/phase3PeerLearningContracts';

export interface Phase3ValidationResult {
  ok: boolean;
  errors: Phase3ValidationError[];
}

export interface Phase3ValidationError {
  code: string;
  field?: string;
  message: string;
  safeReasonCodes: string[];
}

function nowISO(): string {
  return new Date().toISOString();
}

export function okResult(): Phase3ValidationResult {
  return { ok: true, errors: [] };
}

export function createSafePeerLearningValidationError(
  code: string,
  message: string,
  safeReasonCodes: string[],
  field?: string,
): Phase3ValidationError {
  return { code, field, message, safeReasonCodes };
}

function err(
  code: string,
  message: string,
  safeReasonCodes: string[],
  field?: string,
): Phase3ValidationResult {
  return {
    ok: false,
    errors: [createSafePeerLearningValidationError(code, message, safeReasonCodes, field)],
  };
}

export function rejectForbiddenPeerLearningPayloadFields(payload: Record<string, unknown>): Phase3ValidationError[] {
  const errors: Phase3ValidationError[] = [];
  for (const forbidden of PHASE3_PEER_LEARNING_FORBIDDEN_FIELDS) {
    if (forbidden in payload) {
      errors.push({
        code: 'FORBIDDEN_FIELD_REJECTED',
        field: forbidden,
        message: 'Payload contains a forbidden field and was rejected.',
        safeReasonCodes: ['forbidden_field_detected'],
      });
    }
  }
  return errors;
}

function isIn<T extends string>(value: string, list: readonly T[]): value is T {
  return list.includes(value as T);
}

export function validatePeerLearningContext(context: Partial<Phase3PeerLearningContext>): Phase3ValidationResult {
  if (!context.schoolId || typeof context.schoolId !== 'string' || context.schoolId.trim().length === 0) {
    return err('MISSING_SCHOOL_ID', 'School ID is required.', ['missing_school_id'], 'schoolId');
  }
  if (!context.studentId && !context.teacherId && !context.role) {
    return err('MISSING_IDENTITY', 'Student or teacher identity is required.', ['missing_identity']);
  }
  return okResult();
}

export function validatePeerLearningQuery(query: Partial<Phase3PeerLearningQuery>): Phase3ValidationResult {
  if (!query.schoolId || typeof query.schoolId !== 'string') {
    return err('MISSING_SCHOOL_ID', 'School ID is required.', ['missing_school_id'], 'schoolId');
  }
  return okResult();
}

export function validatePeerLearningTeacherQuery(query: Partial<Phase3PeerLearningTeacherQuery>): Phase3ValidationResult {
  if (!query.schoolId || typeof query.schoolId !== 'string') {
    return err('MISSING_SCHOOL_ID', 'School ID is required.', ['missing_school_id'], 'schoolId');
  }
  if (!query.teacherId || typeof query.teacherId !== 'string') {
    return err('MISSING_TEACHER_ID', 'Teacher ID is required.', ['missing_teacher_id'], 'teacherId');
  }
  return okResult();
}

export function validatePeerGroup(input: Record<string, unknown>): Phase3ValidationResult {
  const forbiddenErrors = rejectForbiddenPeerLearningPayloadFields(input);
  if (forbiddenErrors.length > 0) {
    return { ok: false, errors: forbiddenErrors };
  }
  if (!input.schoolId || typeof input.schoolId !== 'string') {
    return err('MISSING_SCHOOL_ID', 'School ID is required.', ['missing_school_id'], 'schoolId');
  }
  if (!input.groupType || !isIn(input.groupType as string, PHASE3_PEER_GROUP_TYPES)) {
    return err('INVALID_GROUP_TYPE', 'Unsupported peer group type.', ['invalid_group_type'], 'groupType');
  }
  if (!input.safeTitle || typeof input.safeTitle !== 'string' || input.safeTitle.trim().length < 2) {
    return err('INVALID_TITLE', 'Group title must be at least 2 characters.', ['invalid_title'], 'safeTitle');
  }
  return okResult();
}

export function validatePeerGroupMembership(input: Record<string, unknown>): Phase3ValidationResult {
  const forbiddenErrors = rejectForbiddenPeerLearningPayloadFields(input);
  if (forbiddenErrors.length > 0) {
    return { ok: false, errors: forbiddenErrors };
  }
  if (!input.schoolId || typeof input.schoolId !== 'string') {
    return err('MISSING_SCHOOL_ID', 'School ID is required.', ['missing_school_id'], 'schoolId');
  }
  if (!input.groupId || typeof input.groupId !== 'string') {
    return err('MISSING_GROUP_ID', 'Group ID is required.', ['missing_group_id'], 'groupId');
  }
  if (!input.studentId || typeof input.studentId !== 'string') {
    return err('MISSING_STUDENT_ID', 'Student ID is required.', ['missing_student_id'], 'studentId');
  }
  return okResult();
}

export function validatePeerContentSubmission(input: Record<string, unknown>): Phase3ValidationResult {
  const forbiddenErrors = rejectForbiddenPeerLearningPayloadFields(input);
  if (forbiddenErrors.length > 0) {
    return { ok: false, errors: forbiddenErrors };
  }
  if (!input.schoolId || typeof input.schoolId !== 'string') {
    return err('MISSING_SCHOOL_ID', 'School ID is required.', ['missing_school_id'], 'schoolId');
  }
  if (!input.studentId || typeof input.studentId !== 'string') {
    return err('MISSING_STUDENT_ID', 'Student ID is required.', ['missing_student_id'], 'studentId');
  }
  if (!input.contentType || !isIn(input.contentType as string, PHASE3_PEER_CONTENT_TYPES)) {
    return err('INVALID_CONTENT_TYPE', 'Unsupported content type.', ['invalid_content_type'], 'contentType');
  }
  if (!input.safeTitle || typeof input.safeTitle !== 'string' || input.safeTitle.trim().length < 2) {
    return err('INVALID_TITLE', 'Content title must be at least 2 characters.', ['invalid_title'], 'safeTitle');
  }
  return okResult();
}

export function validatePeerResourceShare(input: Record<string, unknown>): Phase3ValidationResult {
  const forbiddenErrors = rejectForbiddenPeerLearningPayloadFields(input);
  if (forbiddenErrors.length > 0) {
    return { ok: false, errors: forbiddenErrors };
  }
  if (!input.schoolId || typeof input.schoolId !== 'string') {
    return err('MISSING_SCHOOL_ID', 'School ID is required.', ['missing_school_id'], 'schoolId');
  }
  if (!input.studentId || typeof input.studentId !== 'string') {
    return err('MISSING_STUDENT_ID', 'Student ID is required.', ['missing_student_id'], 'studentId');
  }
  if (!input.resourceType || !isIn(input.resourceType as string, PHASE3_PEER_RESOURCE_TYPES)) {
    return err('INVALID_RESOURCE_TYPE', 'Unsupported resource type.', ['invalid_resource_type'], 'resourceType');
  }
  if (!input.safeTitle || typeof input.safeTitle !== 'string' || input.safeTitle.trim().length < 2) {
    return err('INVALID_TITLE', 'Resource title must be at least 2 characters.', ['invalid_title'], 'safeTitle');
  }
  return okResult();
}

export function validatePeerHighlight(input: Record<string, unknown>): Phase3ValidationResult {
  const forbiddenErrors = rejectForbiddenPeerLearningPayloadFields(input);
  if (forbiddenErrors.length > 0) {
    return { ok: false, errors: forbiddenErrors };
  }
  if (!input.schoolId || typeof input.schoolId !== 'string') {
    return err('MISSING_SCHOOL_ID', 'School ID is required.', ['missing_school_id'], 'schoolId');
  }
  if (!input.studentId || typeof input.studentId !== 'string') {
    return err('MISSING_STUDENT_ID', 'Student ID is required.', ['missing_student_id'], 'studentId');
  }
  if (!input.highlightType || !isIn(input.highlightType as string, PHASE3_PEER_HIGHLIGHT_TYPES)) {
    return err('INVALID_HIGHLIGHT_TYPE', 'Unsupported highlight type.', ['invalid_highlight_type'], 'highlightType');
  }
  if (!input.safeTitle || typeof input.safeTitle !== 'string' || input.safeTitle.trim().length < 2) {
    return err('INVALID_TITLE', 'Highlight title must be at least 2 characters.', ['invalid_title'], 'safeTitle');
  }
  return okResult();
}

export function validateHealthyChallenge(input: Record<string, unknown>): Phase3ValidationResult {
  const forbiddenErrors = rejectForbiddenPeerLearningPayloadFields(input);
  if (forbiddenErrors.length > 0) {
    return { ok: false, errors: forbiddenErrors };
  }
  if (!input.schoolId || typeof input.schoolId !== 'string') {
    return err('MISSING_SCHOOL_ID', 'School ID is required.', ['missing_school_id'], 'schoolId');
  }
  if (!input.teacherId || typeof input.teacherId !== 'string') {
    return err('MISSING_TEACHER_ID', 'Teacher ID is required.', ['missing_teacher_id'], 'teacherId');
  }
  if (!input.challengeType || !isIn(input.challengeType as string, PHASE3_HEALTHY_CHALLENGE_TYPES)) {
    return err('INVALID_CHALLENGE_TYPE', 'Unsupported challenge type.', ['invalid_challenge_type'], 'challengeType');
  }
  if (!input.safeTitle || typeof input.safeTitle !== 'string' || input.safeTitle.trim().length < 2) {
    return err('INVALID_TITLE', 'Challenge title must be at least 2 characters.', ['invalid_title'], 'safeTitle');
  }
  return okResult();
}

export function validateHealthyChallengeParticipation(input: Record<string, unknown>): Phase3ValidationResult {
  const forbiddenErrors = rejectForbiddenPeerLearningPayloadFields(input);
  if (forbiddenErrors.length > 0) {
    return { ok: false, errors: forbiddenErrors };
  }
  if (!input.schoolId || typeof input.schoolId !== 'string') {
    return err('MISSING_SCHOOL_ID', 'School ID is required.', ['missing_school_id'], 'schoolId');
  }
  if (!input.studentId || typeof input.studentId !== 'string') {
    return err('MISSING_STUDENT_ID', 'Student ID is required.', ['missing_student_id'], 'studentId');
  }
  if (!input.challengeId || typeof input.challengeId !== 'string') {
    return err('MISSING_CHALLENGE_ID', 'Challenge ID is required.', ['missing_challenge_id'], 'challengeId');
  }
  return okResult();
}

export function validatePeerGroupType(value: string): Phase3ValidationResult {
  if (!isIn(value, PHASE3_PEER_GROUP_TYPES)) {
    return err('INVALID_GROUP_TYPE', 'Unsupported peer group type.', ['invalid_group_type'], 'groupType');
  }
  return okResult();
}

export function validatePeerGroupStatus(value: string): Phase3ValidationResult {
  if (!isIn(value, PHASE3_PEER_GROUP_STATUSES)) {
    return err('INVALID_GROUP_STATUS', 'Unsupported group status.', ['invalid_group_status'], 'groupStatus');
  }
  return okResult();
}

export function validatePeerContentType(value: string): Phase3ValidationResult {
  if (!isIn(value, PHASE3_PEER_CONTENT_TYPES)) {
    return err('INVALID_CONTENT_TYPE', 'Unsupported content type.', ['invalid_content_type'], 'contentType');
  }
  return okResult();
}

export function validatePeerContentStatus(value: string): Phase3ValidationResult {
  if (!isIn(value, PHASE3_PEER_CONTENT_STATUSES)) {
    return err('INVALID_CONTENT_STATUS', 'Unsupported content status.', ['invalid_content_status'], 'contentStatus');
  }
  return okResult();
}

export function validatePeerModerationStatus(value: string): Phase3ValidationResult {
  if (!isIn(value, PHASE3_PEER_MODERATION_STATUSES)) {
    return err('INVALID_MODERATION_STATUS', 'Unsupported moderation status.', ['invalid_moderation_status'], 'moderationStatus');
  }
  return okResult();
}

export function validatePeerVisibilityLevel(value: string): Phase3ValidationResult {
  if (!isIn(value, PHASE3_PEER_VISIBILITY_LEVELS)) {
    return err('INVALID_VISIBILITY_LEVEL', 'Unsupported visibility level.', ['invalid_visibility_level'], 'visibilityLevel');
  }
  return okResult();
}

export function validatePeerResourceType(value: string): Phase3ValidationResult {
  if (!isIn(value, PHASE3_PEER_RESOURCE_TYPES)) {
    return err('INVALID_RESOURCE_TYPE', 'Unsupported resource type.', ['invalid_resource_type'], 'resourceType');
  }
  return okResult();
}

export function validatePeerHighlightType(value: string): Phase3ValidationResult {
  if (!isIn(value, PHASE3_PEER_HIGHLIGHT_TYPES)) {
    return err('INVALID_HIGHLIGHT_TYPE', 'Unsupported highlight type.', ['invalid_highlight_type'], 'highlightType');
  }
  return okResult();
}

export function validateHealthyChallengeType(value: string): Phase3ValidationResult {
  if (!isIn(value, PHASE3_HEALTHY_CHALLENGE_TYPES)) {
    return err('INVALID_CHALLENGE_TYPE', 'Unsupported challenge type.', ['invalid_challenge_type'], 'challengeType');
  }
  return okResult();
}

export function validateHealthyChallengeStatus(value: string): Phase3ValidationResult {
  if (!isIn(value, PHASE3_HEALTHY_CHALLENGE_STATUSES)) {
    return err('INVALID_CHALLENGE_STATUS', 'Unsupported challenge status.', ['invalid_challenge_status'], 'challengeStatus');
  }
  return okResult();
}

export function validatePeerLearningAction(value: string): Phase3ValidationResult {
  if (!isIn(value, PHASE3_PEER_LEARNING_ACTIONS)) {
    return err('INVALID_ACTION', 'Unsupported peer learning action.', ['invalid_action'], 'action');
  }
  return okResult();
}

export function validatePeerLearningSourceType(value: string): Phase3ValidationResult {
  if (!isIn(value, PHASE3_PEER_LEARNING_SOURCE_TYPES)) {
    return err('INVALID_SOURCE_TYPE', 'Unsupported source type.', ['invalid_source_type'], 'sourceType');
  }
  return okResult();
}

export function validatePeerLearningSignalType(value: string): Phase3ValidationResult {
  if (!isIn(value, PHASE3_PEER_LEARNING_SIGNAL_TYPES)) {
    return err('INVALID_SIGNAL_TYPE', 'Unsupported signal type.', ['invalid_signal_type'], 'signalType');
  }
  return okResult();
}

export function validatePeerLearningPriority(value: string): Phase3ValidationResult {
  if (!isIn(value, PHASE3_PEER_LEARNING_PRIORITIES)) {
    return err('INVALID_PRIORITY', 'Unsupported priority level.', ['invalid_priority_level'], 'priority');
  }
  return okResult();
}
