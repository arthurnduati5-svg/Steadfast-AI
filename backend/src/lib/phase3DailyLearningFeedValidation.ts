import {
  PHASE3_DAILY_LEARNING_FEED_ITEM_TYPES,
  PHASE3_DAILY_LEARNING_FEED_PRIORITIES,
  PHASE3_DAILY_LEARNING_FEED_ACTIONS,
  PHASE3_DAILY_LEARNING_FEED_FORBIDDEN_FIELDS,
  type Phase3DailyLearningFeedItemType,
  type Phase3DailyLearningFeedPriority,
  type Phase3DailyLearningFeedAction,
  type Phase3DailyLearningFeedQuery,
  type Phase3DailyLearningFeedTeacherOverviewQuery,
} from '../contracts/phase3DailyLearningFeedContracts';
import { PHASE3_SOURCE_TRUTH_STATUSES as SOURCE_TRUTH_STATUSES } from '../contracts/phase3ObjectiveMasteryContracts';

export interface Phase3DailyLearningFeedValidationResult {
  ok: boolean;
  errors: Phase3DailyLearningFeedValidationError[];
}

export interface Phase3DailyLearningFeedValidationError {
  code: string;
  field?: string;
  message: string;
  safeReasonCodes: string[];
}

export function okFeedResult(): Phase3DailyLearningFeedValidationResult {
  return { ok: true, errors: [] };
}

export function createSafeDailyLearningFeedValidationError(
  code: string,
  message: string,
  safeReasonCodes: string[],
  field?: string,
): Phase3DailyLearningFeedValidationError {
  return { code, field, message, safeReasonCodes };
}

function err(
  code: string,
  message: string,
  safeReasonCodes: string[],
  field?: string,
): Phase3DailyLearningFeedValidationResult {
  return {
    ok: false,
    errors: [createSafeDailyLearningFeedValidationError(code, message, safeReasonCodes, field)],
  };
}

export function rejectForbiddenDailyLearningFeedPayloadFields(payload: Record<string, unknown>): Phase3DailyLearningFeedValidationError[] {
  const errors: Phase3DailyLearningFeedValidationError[] = [];
  for (const forbidden of PHASE3_DAILY_LEARNING_FEED_FORBIDDEN_FIELDS) {
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

export function validateDailyLearningFeedQuery(
  query: Partial<Phase3DailyLearningFeedQuery>,
): Phase3DailyLearningFeedValidationResult {
  const forbiddenErrors = rejectForbiddenDailyLearningFeedPayloadFields(query as unknown as Record<string, unknown>);
  if (forbiddenErrors.length > 0) {
    return { ok: false, errors: forbiddenErrors };
  }

  if (!query.schoolId || typeof query.schoolId !== 'string' || query.schoolId.trim().length === 0) {
    return err('MISSING_SCHOOL_ID', 'School ID is required.', ['missing_school_id'], 'schoolId');
  }
  if (!query.studentId || typeof query.studentId !== 'string' || query.studentId.trim().length === 0) {
    return err('MISSING_STUDENT_ID', 'Student ID is required for learner feed.', ['missing_student_id'], 'studentId');
  }

  return okFeedResult();
}

export function validateDailyLearningFeedTeacherOverviewQuery(
  query: Partial<Phase3DailyLearningFeedTeacherOverviewQuery>,
): Phase3DailyLearningFeedValidationResult {
  const forbiddenErrors = rejectForbiddenDailyLearningFeedPayloadFields(query as unknown as Record<string, unknown>);
  if (forbiddenErrors.length > 0) {
    return { ok: false, errors: forbiddenErrors };
  }

  if (!query.schoolId || typeof query.schoolId !== 'string' || query.schoolId.trim().length === 0) {
    return err('MISSING_SCHOOL_ID', 'School ID is required.', ['missing_school_id'], 'schoolId');
  }
  if (!query.teacherId || typeof query.teacherId !== 'string' || query.teacherId.trim().length === 0) {
    return err('MISSING_TEACHER_ID', 'Teacher ID is required.', ['missing_teacher_id'], 'teacherId');
  }
  if (!query.role || typeof query.role !== 'string') {
    return err('MISSING_ROLE', 'Role is required for teacher overview.', ['missing_role'], 'role');
  }

  const allowedRoles = ['teacher', 'admin', 'internal'];
  if (!allowedRoles.includes(query.role)) {
    return err('FORBIDDEN_ROLE', 'Only teacher, admin, or internal roles can access teacher overview.', ['forbidden_role'], 'role');
  }

  return okFeedResult();
}

export function validateDailyLearningFeedItemInput(item: Record<string, unknown>): Phase3DailyLearningFeedValidationResult {
  const forbiddenErrors = rejectForbiddenDailyLearningFeedPayloadFields(item);
  if (forbiddenErrors.length > 0) {
    return { ok: false, errors: forbiddenErrors };
  }

  if (item.itemType && !PHASE3_DAILY_LEARNING_FEED_ITEM_TYPES.includes(item.itemType as Phase3DailyLearningFeedItemType)) {
    return err('INVALID_ITEM_TYPE', `Item type must be one of: ${PHASE3_DAILY_LEARNING_FEED_ITEM_TYPES.join(', ')}.`, ['invalid_item_type'], 'itemType');
  }
  if (item.priority && !PHASE3_DAILY_LEARNING_FEED_PRIORITIES.includes(item.priority as Phase3DailyLearningFeedPriority)) {
    return err('INVALID_PRIORITY', `Priority must be one of: ${PHASE3_DAILY_LEARNING_FEED_PRIORITIES.join(', ')}.`, ['invalid_priority'], 'priority');
  }
  if (item.nextAction && !PHASE3_DAILY_LEARNING_FEED_ACTIONS.includes(item.nextAction as Phase3DailyLearningFeedAction)) {
    return err('INVALID_ACTION', `Action must be one of: ${PHASE3_DAILY_LEARNING_FEED_ACTIONS.join(', ')}.`, ['invalid_action'], 'nextAction');
  }
  if (item.sourceTruthStatus && !SOURCE_TRUTH_STATUSES.includes(item.sourceTruthStatus as any)) {
    return err('INVALID_SOURCE_TRUTH_STATUS', `Source truth status must be one of: ${SOURCE_TRUTH_STATUSES.join(', ')}.`, ['invalid_source_truth_status'], 'sourceTruthStatus');
  }

  return okFeedResult();
}
