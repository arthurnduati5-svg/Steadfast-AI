import {
  PHASE3_DAILY_OBJECTIVE_CHECK_STATUSES,
  PHASE3_DAILY_OBJECTIVE_SIGNAL_BUCKETS,
  PHASE3_DAILY_OBJECTIVE_COMPLETION_STATUSES,
  PHASE3_DAILY_OBJECTIVE_FORBIDDEN_FIELDS,
  type Phase3DailyObjectiveCheckStatus,
  type Phase3DailyObjectiveSignalBucket,
  type Phase3DailyObjectiveCheckSessionStartInput,
  type Phase3DailyObjectiveCheckAttemptInput,
  type Phase3DailyObjectiveConfidenceInput,
  type Phase3DailyObjectiveCheckCompletionInput,
  type Phase3DailyObjectiveCheckQuery,
} from '../contracts/phase3DailyObjectiveCheckContracts';
import {
  PHASE3_CONFIDENCE_LABELS,
  PHASE3_SOURCE_TRUTH_STATUSES,
} from '../contracts/phase3ObjectiveMasteryContracts';

export interface Phase3DailyValidationResult {
  ok: boolean;
  errors: Phase3DailyValidationError[];
}

export interface Phase3DailyValidationError {
  code: string;
  field?: string;
  message: string;
  safeReasonCodes: string[];
}

export function okDailyResult(): Phase3DailyValidationResult {
  return { ok: true, errors: [] };
}

export function createSafeDailyObjectiveCheckValidationError(
  code: string,
  message: string,
  safeReasonCodes: string[],
  field?: string,
): Phase3DailyValidationError {
  return { code, field, message, safeReasonCodes };
}

function err(
  code: string,
  message: string,
  safeReasonCodes: string[],
  field?: string,
): Phase3DailyValidationResult {
  return {
    ok: false,
    errors: [createSafeDailyObjectiveCheckValidationError(code, message, safeReasonCodes, field)],
  };
}

export function rejectForbiddenDailyObjectiveCheckPayloadFields(payload: Record<string, unknown>): Phase3DailyValidationError[] {
  const errors: Phase3DailyValidationError[] = [];
  for (const forbidden of PHASE3_DAILY_OBJECTIVE_FORBIDDEN_FIELDS) {
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

export function validateDailyObjectiveCheckSessionStartInput(
  input: Partial<Phase3DailyObjectiveCheckSessionStartInput>,
): Phase3DailyValidationResult {
  const forbiddenErrors = rejectForbiddenDailyObjectiveCheckPayloadFields(input as Record<string, unknown>);
  if (forbiddenErrors.length > 0) {
    return { ok: false, errors: forbiddenErrors };
  }

  if (!input.schoolId || typeof input.schoolId !== 'string' || input.schoolId.trim().length === 0) {
    return err('MISSING_SCHOOL_ID', 'School ID is required.', ['missing_school_id'], 'schoolId');
  }
  if (!input.studentId || typeof input.studentId !== 'string' || input.studentId.trim().length === 0) {
    return err('MISSING_STUDENT_ID', 'Student ID is required.', ['missing_student_id'], 'studentId');
  }
  if (!input.objectiveId || typeof input.objectiveId !== 'string') {
    return err('MISSING_OBJECTIVE_ID', 'Objective ID is required.', ['missing_objective_id'], 'objectiveId');
  }
  if (!input.sourceTruthStatus || typeof input.sourceTruthStatus !== 'string') {
    return err('MISSING_SOURCE_TRUTH_STATUS', 'Source truth status is required.', ['missing_source_truth_status'], 'sourceTruthStatus');
  }

  const validSourceStatuses = [...PHASE3_SOURCE_TRUTH_STATUSES];
  const uniqueValid = [...new Set(validSourceStatuses)];
  if (!uniqueValid.includes(input.sourceTruthStatus as any)) {
    return err('INVALID_SOURCE_TRUTH_STATUS', 'Source truth status must be a valid status.', ['invalid_source_truth_status'], 'sourceTruthStatus');
  }

  return okDailyResult();
}

export function validateDailyObjectiveCheckAttemptInput(
  input: Partial<Phase3DailyObjectiveCheckAttemptInput>,
): Phase3DailyValidationResult {
  const forbiddenErrors = rejectForbiddenDailyObjectiveCheckPayloadFields(input as Record<string, unknown>);
  if (forbiddenErrors.length > 0) {
    return { ok: false, errors: forbiddenErrors };
  }

  if (!input.checkSessionId || typeof input.checkSessionId !== 'string') {
    return err('MISSING_CHECK_SESSION_ID', 'Check session ID is required.', ['missing_check_session_id'], 'checkSessionId');
  }
  if (!input.schoolId || typeof input.schoolId !== 'string') {
    return err('MISSING_SCHOOL_ID', 'School ID is required.', ['missing_school_id'], 'schoolId');
  }
  if (!input.studentId || typeof input.studentId !== 'string') {
    return err('MISSING_STUDENT_ID', 'Student ID is required.', ['missing_student_id'], 'studentId');
  }
  if (!input.signalBucket || !PHASE3_DAILY_OBJECTIVE_SIGNAL_BUCKETS.includes(input.signalBucket as Phase3DailyObjectiveSignalBucket)) {
    return err('INVALID_SIGNAL_BUCKET', `Signal bucket must be one of: ${PHASE3_DAILY_OBJECTIVE_SIGNAL_BUCKETS.join(', ')}.`, ['invalid_signal_bucket'], 'signalBucket');
  }

  if (input.antiCheatLabels) {
    const FORBIDDEN_ACCUSATION_LABELS = ['cheated', 'fraud', 'dishonest', 'lying', 'suspicious_student'];
    for (const label of input.antiCheatLabels) {
      if (FORBIDDEN_ACCUSATION_LABELS.includes(label)) {
        return err('FORBIDDEN_ACCUSATION_LABEL', 'Anti-cheat labels must not accuse the student.', ['forbidden_accusation_label'], 'antiCheatLabels');
      }
    }
  }

  return okDailyResult();
}

export function validateDailyObjectiveConfidenceInput(
  input: Partial<Phase3DailyObjectiveConfidenceInput>,
): Phase3DailyValidationResult {
  const forbiddenErrors = rejectForbiddenDailyObjectiveCheckPayloadFields(input as Record<string, unknown>);
  if (forbiddenErrors.length > 0) {
    return { ok: false, errors: forbiddenErrors };
  }

  if (!input.checkSessionId || typeof input.checkSessionId !== 'string') {
    return err('MISSING_CHECK_SESSION_ID', 'Check session ID is required.', ['missing_check_session_id'], 'checkSessionId');
  }
  if (!input.schoolId || typeof input.schoolId !== 'string') {
    return err('MISSING_SCHOOL_ID', 'School ID is required.', ['missing_school_id'], 'schoolId');
  }
  if (!input.studentId || typeof input.studentId !== 'string') {
    return err('MISSING_STUDENT_ID', 'Student ID is required.', ['missing_student_id'], 'studentId');
  }
  if (!input.confidenceLevel || !PHASE3_CONFIDENCE_LABELS.includes(input.confidenceLevel as any)) {
    return err('INVALID_CONFIDENCE_LEVEL', `Confidence level must be one of: ${PHASE3_CONFIDENCE_LABELS.join(', ')}.`, ['invalid_confidence_level'], 'confidenceLevel');
  }
  if (!input.checkpointType || !['before', 'after'].includes(input.checkpointType)) {
    return err('INVALID_CHECKPOINT_TYPE', 'Checkpoint type must be before or after.', ['invalid_checkpoint_type'], 'checkpointType');
  }

  return okDailyResult();
}

export function validateDailyObjectiveCheckCompletionInput(
  input: Partial<Phase3DailyObjectiveCheckCompletionInput>,
): Phase3DailyValidationResult {
  const forbiddenErrors = rejectForbiddenDailyObjectiveCheckPayloadFields(input as Record<string, unknown>);
  if (forbiddenErrors.length > 0) {
    return { ok: false, errors: forbiddenErrors };
  }

  if (!input.checkSessionId || typeof input.checkSessionId !== 'string') {
    return err('MISSING_CHECK_SESSION_ID', 'Check session ID is required.', ['missing_check_session_id'], 'checkSessionId');
  }
  if (!input.schoolId || typeof input.schoolId !== 'string') {
    return err('MISSING_SCHOOL_ID', 'School ID is required.', ['missing_school_id'], 'schoolId');
  }
  if (!input.studentId || typeof input.studentId !== 'string') {
    return err('MISSING_STUDENT_ID', 'Student ID is required.', ['missing_student_id'], 'studentId');
  }

  return okDailyResult();
}

export function validateDailyObjectiveCheckQuery(
  query: Partial<Phase3DailyObjectiveCheckQuery>,
): Phase3DailyValidationResult {
  if (!query.schoolId || typeof query.schoolId !== 'string') {
    return err('MISSING_SCHOOL_ID', 'School ID is required.', ['missing_school_id'], 'schoolId');
  }
  if (query.status && !PHASE3_DAILY_OBJECTIVE_CHECK_STATUSES.includes(query.status as Phase3DailyObjectiveCheckStatus)) {
    return err('INVALID_STATUS', `Status must be one of: ${PHASE3_DAILY_OBJECTIVE_CHECK_STATUSES.join(', ')}.`, ['invalid_status'], 'status');
  }

  return okDailyResult();
}
