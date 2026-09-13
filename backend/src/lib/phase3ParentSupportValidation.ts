import {
  PHASE3_PARENT_ROLES,
  PHASE3_PARENT_LINK_STATUSES,
  PHASE3_PARENT_VISIBILITY_LEVELS,
  PHASE3_PARENT_SUMMARY_TYPES,
  PHASE3_PARENT_NOTIFICATION_TYPES,
  PHASE3_PARENT_NOTIFICATION_STATUSES,
  PHASE3_PARENT_SUPPORT_ACTIONS,
  PHASE3_PARENT_SUPPORT_SOURCE_TYPES,
  PHASE3_PARENT_SUPPORT_SIGNAL_TYPES,
  PHASE3_PARENT_SUPPORT_PRIORITIES,
  PHASE3_PARENT_SUPPORT_FORBIDDEN_FIELDS,
  type Phase3ParentRole,
  type Phase3ParentLinkStatus,
  type Phase3ParentVisibilityLevel,
  type Phase3ParentSummaryType,
  type Phase3ParentNotificationType,
  type Phase3ParentNotificationStatus,
  type Phase3ParentSupportAction,
  type Phase3ParentSupportSourceType,
  type Phase3ParentSupportSignalType,
  type Phase3ParentSupportPriority,
  type Phase3ParentSupportContext,
  type Phase3ParentLearnerLink,
  type Phase3ParentSupportQuery,
  type Phase3ParentSupportTeacherQuery,
} from '../contracts/phase3ParentSupportContracts';

export interface Phase3ParentValidationResult {
  ok: boolean;
  errors: Phase3ParentValidationError[];
}

export interface Phase3ParentValidationError {
  code: string;
  field?: string;
  message: string;
  safeReasonCodes: string[];
}

function nowISO(): string {
  return new Date().toISOString();
}

export function okResult(): Phase3ParentValidationResult {
  return { ok: true, errors: [] };
}

export function createSafeParentSupportValidationError(
  code: string,
  message: string,
  safeReasonCodes: string[],
  field?: string,
): Phase3ParentValidationError {
  return { code, field, message, safeReasonCodes };
}

function err(
  code: string,
  message: string,
  safeReasonCodes: string[],
  field?: string,
): Phase3ParentValidationResult {
  return {
    ok: false,
    errors: [createSafeParentSupportValidationError(code, message, safeReasonCodes, field)],
  };
}

export function rejectForbiddenParentSupportPayloadFields(payload: Record<string, unknown>): Phase3ParentValidationError[] {
  const errors: Phase3ParentValidationError[] = [];
  for (const forbidden of PHASE3_PARENT_SUPPORT_FORBIDDEN_FIELDS) {
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

export function validateParentSupportContext(context: Partial<Phase3ParentSupportContext>): Phase3ParentValidationResult {
  if (!context.schoolId || typeof context.schoolId !== 'string' || context.schoolId.trim().length === 0) {
    return err('MISSING_SCHOOL_ID', 'School ID is required.', ['missing_school_id'], 'schoolId');
  }
  if (!context.role || !PHASE3_PARENT_ROLES.includes(context.role as Phase3ParentRole)) {
    return err('INVALID_PARENT_ROLE', 'Valid parent role is required.', ['invalid_parent_role'], 'role');
  }
  return okResult();
}

export function validateParentSupportQuery(query: Partial<Phase3ParentSupportQuery>): Phase3ParentValidationResult {
  if (!query.schoolId || typeof query.schoolId !== 'string' || query.schoolId.trim().length === 0) {
    return err('MISSING_SCHOOL_ID', 'School ID is required.', ['missing_school_id'], 'schoolId');
  }
  if (!query.parentId || typeof query.parentId !== 'string' || query.parentId.trim().length === 0) {
    return err('MISSING_PARENT_ID', 'Parent ID is required for parent query.', ['missing_parent_id'], 'parentId');
  }
  return okResult();
}

export function validateParentSupportTeacherQuery(query: Partial<Phase3ParentSupportTeacherQuery>): Phase3ParentValidationResult {
  if (!query.schoolId || typeof query.schoolId !== 'string' || query.schoolId.trim().length === 0) {
    return err('MISSING_SCHOOL_ID', 'School ID is required.', ['missing_school_id'], 'schoolId');
  }
  if (!query.teacherId || typeof query.teacherId !== 'string' || query.teacherId.trim().length === 0) {
    return err('MISSING_TEACHER_ID', 'Teacher ID is required for teacher query.', ['missing_teacher_id'], 'teacherId');
  }
  return okResult();
}

export function validateParentLearnerLink(link: Partial<Phase3ParentLearnerLink>): Phase3ParentValidationResult {
  if (!link.schoolId || typeof link.schoolId !== 'string' || link.schoolId.trim().length === 0) {
    return err('MISSING_SCHOOL_ID', 'School ID is required.', ['missing_school_id'], 'schoolId');
  }
  if (!link.parentId || typeof link.parentId !== 'string' || link.parentId.trim().length === 0) {
    return err('MISSING_PARENT_ID', 'Parent ID is required.', ['missing_parent_id'], 'parentId');
  }
  if (!link.studentId || typeof link.studentId !== 'string' || link.studentId.trim().length === 0) {
    return err('MISSING_STUDENT_ID', 'Student ID is required for parent-learner link.', ['missing_student_id'], 'studentId');
  }
  if (!link.linkStatus || !PHASE3_PARENT_LINK_STATUSES.includes(link.linkStatus as Phase3ParentLinkStatus)) {
    return err('INVALID_LINK_STATUS', 'Valid link status is required.', ['invalid_link_status'], 'linkStatus');
  }
  if (!link.visibilityLevel || !PHASE3_PARENT_VISIBILITY_LEVELS.includes(link.visibilityLevel as Phase3ParentVisibilityLevel)) {
    return err('INVALID_VISIBILITY_LEVEL', 'Valid visibility level is required.', ['invalid_visibility_level'], 'visibilityLevel');
  }
  return okResult();
}

export function validateParentRole(role: string): Phase3ParentValidationResult {
  if (!PHASE3_PARENT_ROLES.includes(role as Phase3ParentRole)) {
    return err('INVALID_PARENT_ROLE', `Role must be one of: ${PHASE3_PARENT_ROLES.join(', ')}.`, ['invalid_parent_role'], 'role');
  }
  return okResult();
}

export function validateParentLinkStatus(status: string): Phase3ParentValidationResult {
  if (!PHASE3_PARENT_LINK_STATUSES.includes(status as Phase3ParentLinkStatus)) {
    return err('INVALID_LINK_STATUS', `Status must be one of: ${PHASE3_PARENT_LINK_STATUSES.join(', ')}.`, ['invalid_link_status'], 'linkStatus');
  }
  return okResult();
}

export function validateParentVisibilityLevel(level: string): Phase3ParentValidationResult {
  if (!PHASE3_PARENT_VISIBILITY_LEVELS.includes(level as Phase3ParentVisibilityLevel)) {
    return err('INVALID_VISIBILITY_LEVEL', `Level must be one of: ${PHASE3_PARENT_VISIBILITY_LEVELS.join(', ')}.`, ['invalid_visibility_level'], 'visibilityLevel');
  }
  return okResult();
}

export function validateParentSummaryType(summaryType: string): Phase3ParentValidationResult {
  if (!PHASE3_PARENT_SUMMARY_TYPES.includes(summaryType as Phase3ParentSummaryType)) {
    return err('INVALID_SUMMARY_TYPE', `Summary type must be one of: ${PHASE3_PARENT_SUMMARY_TYPES.join(', ')}.`, ['invalid_summary_type'], 'summaryType');
  }
  return okResult();
}

export function validateParentNotificationType(notificationType: string): Phase3ParentValidationResult {
  if (!PHASE3_PARENT_NOTIFICATION_TYPES.includes(notificationType as Phase3ParentNotificationType)) {
    return err('INVALID_NOTIFICATION_TYPE', `Notification type must be one of: ${PHASE3_PARENT_NOTIFICATION_TYPES.join(', ')}.`, ['invalid_notification_type'], 'notificationType');
  }
  return okResult();
}

export function validateParentNotificationStatus(status: string): Phase3ParentValidationResult {
  if (!PHASE3_PARENT_NOTIFICATION_STATUSES.includes(status as Phase3ParentNotificationStatus)) {
    return err('INVALID_NOTIFICATION_STATUS', `Notification status must be one of: ${PHASE3_PARENT_NOTIFICATION_STATUSES.join(', ')}.`, ['invalid_notification_status'], 'notificationStatus');
  }
  return okResult();
}

export function validateParentSupportAction(action: string): Phase3ParentValidationResult {
  if (!PHASE3_PARENT_SUPPORT_ACTIONS.includes(action as Phase3ParentSupportAction)) {
    return err('INVALID_SUPPORT_ACTION', `Support action must be one of: ${PHASE3_PARENT_SUPPORT_ACTIONS.join(', ')}.`, ['invalid_support_action'], 'supportAction');
  }
  return okResult();
}

export function validateParentSupportSourceType(sourceType: string): Phase3ParentValidationResult {
  if (!PHASE3_PARENT_SUPPORT_SOURCE_TYPES.includes(sourceType as Phase3ParentSupportSourceType)) {
    return err('INVALID_SOURCE_TYPE', `Source type must be one of: ${PHASE3_PARENT_SUPPORT_SOURCE_TYPES.join(', ')}.`, ['invalid_source_type'], 'sourceType');
  }
  return okResult();
}

export function validateParentSupportSignalType(signalType: string): Phase3ParentValidationResult {
  if (!PHASE3_PARENT_SUPPORT_SIGNAL_TYPES.includes(signalType as Phase3ParentSupportSignalType)) {
    return err('INVALID_SIGNAL_TYPE', `Signal type must be one of: ${PHASE3_PARENT_SUPPORT_SIGNAL_TYPES.join(', ')}.`, ['invalid_signal_type'], 'signalType');
  }
  return okResult();
}

export function validateParentSupportPriority(priority: string): Phase3ParentValidationResult {
  if (!PHASE3_PARENT_SUPPORT_PRIORITIES.includes(priority as Phase3ParentSupportPriority)) {
    return err('INVALID_PRIORITY', `Priority must be one of: ${PHASE3_PARENT_SUPPORT_PRIORITIES.join(', ')}.`, ['invalid_priority'], 'priority');
  }
  return okResult();
}
