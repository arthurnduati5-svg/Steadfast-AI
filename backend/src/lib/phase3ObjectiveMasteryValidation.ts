import {
  PHASE3_OBJECTIVE_TYPES,
  PHASE3_MASTERY_STATUSES,
  PHASE3_ANTI_CHEAT_LABELS,
  PHASE3_SOURCE_TRUTH_STATUSES,
  PHASE3_FORBIDDEN_FIELDS,
  PHASE3_DIFFICULTY_BUCKETS,
  PHASE3_MODE_DESTINATIONS,
  PHASE3_SEED_SOURCE_TYPES,
  type Phase3ObjectiveType,
  type Phase3MasteryStatus,
  type Phase3SourceTruthStatus,
  type Phase3LearningSpineContext,
  type Phase3Objective,
  type Phase3ObjectiveSuccessCriterion,
  type Phase3ObjectiveCheckPolicy,
  type Phase3ObjectiveEvidenceBridgeInput,
  type Phase3AntiCheatLabel,
  type Phase3ObjectiveCheckBlueprint,
  type Phase3DailyObjectiveCheckSeed,
} from '../contracts/phase3ObjectiveMasteryContracts';

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

export function createSafeObjectiveValidationError(
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
    errors: [createSafeObjectiveValidationError(code, message, safeReasonCodes, field)],
  };
}

export function rejectForbiddenObjectivePayloadFields(payload: Record<string, unknown>): Phase3ValidationError[] {
  const errors: Phase3ValidationError[] = [];
  for (const forbidden of PHASE3_FORBIDDEN_FIELDS) {
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

export function validatePhase3LearningSpineContext(
  context: Partial<Phase3LearningSpineContext>,
): Phase3ValidationResult {
  if (!context.schoolId || typeof context.schoolId !== 'string' || context.schoolId.trim().length === 0) {
    return err('MISSING_SCHOOL_ID', 'School ID is required.', ['missing_school_id'], 'schoolId');
  }
  return okResult();
}

export function validateObjectiveCreateInput(
  input: Record<string, unknown>,
): Phase3ValidationResult {
  const forbiddenErrors = rejectForbiddenObjectivePayloadFields(input);
  if (forbiddenErrors.length > 0) {
    return { ok: false, errors: forbiddenErrors };
  }

  if (!input.schoolId || typeof input.schoolId !== 'string') {
    return err('MISSING_SCHOOL_ID', 'School ID is required.', ['missing_school_id'], 'schoolId');
  }
  if (!input.title || typeof input.title !== 'string' || input.title.trim().length < 3) {
    return err('INVALID_TITLE', 'Objective title must be at least 3 characters.', ['invalid_title'], 'title');
  }
  if (!input.objectiveType || !PHASE3_OBJECTIVE_TYPES.includes(input.objectiveType as Phase3ObjectiveType)) {
    return err('INVALID_OBJECTIVE_TYPE', `Objective type must be one of: ${PHASE3_OBJECTIVE_TYPES.join(', ')}.`, ['invalid_objective_type'], 'objectiveType');
  }
  if (!input.sourceTruthStatus || !PHASE3_SOURCE_TRUTH_STATUSES.includes(input.sourceTruthStatus as Phase3SourceTruthStatus)) {
    return err('INVALID_SOURCE_TRUTH_STATUS', 'Valid source truth status is required.', ['invalid_source_truth_status'], 'sourceTruthStatus');
  }
  if (input.difficultyBucket && !PHASE3_DIFFICULTY_BUCKETS.includes(input.difficultyBucket as any)) {
    return err('INVALID_DIFFICULTY_BUCKET', `Difficulty bucket must be one of: ${PHASE3_DIFFICULTY_BUCKETS.join(', ')}.`, ['invalid_difficulty_bucket'], 'difficultyBucket');
  }
  if (!input.successCriteria || !Array.isArray(input.successCriteria) || input.successCriteria.length === 0) {
    return err('MISSING_SUCCESS_CRITERIA', 'At least one success criterion is required.', ['missing_success_criteria'], 'successCriteria');
  }
  if (input.objectiveType === 'topic_objective' || input.objectiveType === 'skill_objective' || input.objectiveType === 'lesson_objective') {
    if (!input.topicId) {
      return err('MISSING_TOPIC_ID', `Objective type ${input.objectiveType} requires a topicId.`, ['missing_topic_id'], 'topicId');
    }
  }
  if (input.objectiveType === 'skill_objective' && !input.skillId) {
    return err('MISSING_SKILL_ID', 'Skill objective requires a skillId.', ['missing_skill_id'], 'skillId');
  }

  return okResult();
}

export function validateObjectiveUpdateInput(
  input: Record<string, unknown>,
): Phase3ValidationResult {
  const forbiddenErrors = rejectForbiddenObjectivePayloadFields(input);
  if (forbiddenErrors.length > 0) {
    return { ok: false, errors: forbiddenErrors };
  }
  if (input.objectiveType && !PHASE3_OBJECTIVE_TYPES.includes(input.objectiveType as Phase3ObjectiveType)) {
    return err('INVALID_OBJECTIVE_TYPE', 'Invalid objective type.', ['invalid_objective_type'], 'objectiveType');
  }
  if (input.sourceTruthStatus && !PHASE3_SOURCE_TRUTH_STATUSES.includes(input.sourceTruthStatus as Phase3SourceTruthStatus)) {
    return err('INVALID_SOURCE_TRUTH_STATUS', 'Invalid source truth status.', ['invalid_source_truth_status'], 'sourceTruthStatus');
  }
  return okResult();
}

export function validateSuccessCriteria(
  criteria: unknown[],
): Phase3ValidationResult {
  if (!Array.isArray(criteria) || criteria.length === 0) {
    return err('MISSING_CRITERIA', 'Success criteria must be a non-empty array.', ['missing_criteria']);
  }
  for (let i = 0; i < criteria.length; i++) {
    const c = criteria[i] as Record<string, unknown>;
    if (!c.description || typeof c.description !== 'string' || c.description.trim().length < 5) {
      return err('INVALID_CRITERION_DESCRIPTION', `Criterion at index ${i} must have a description of at least 5 characters.`, ['invalid_criterion_description']);
    }
    if (!c.measurableIndicator || typeof c.measurableIndicator !== 'string' || c.measurableIndicator.trim().length < 3) {
      return err('INVALID_MEASURABLE_INDICATOR', `Criterion at index ${i} must have a measurable indicator.`, ['invalid_measurable_indicator']);
    }
  }
  return okResult();
}

export function validateObjectiveCheckPolicy(
  policy: Partial<Phase3ObjectiveCheckPolicy>,
): Phase3ValidationResult {
  if (policy.hintPolicy && !['allow_hints', 'limit_hints', 'no_hints'].includes(policy.hintPolicy)) {
    return err('INVALID_HINT_POLICY', 'Hint policy must be allow_hints, limit_hints, or no_hints.', ['invalid_hint_policy'], 'hintPolicy');
  }
  if (policy.antiCheatPolicy && !['standard', 'enhanced', 'strict'].includes(policy.antiCheatPolicy)) {
    return err('INVALID_ANTI_CHEAT_POLICY', 'Anti-cheat policy must be standard, enhanced, or strict.', ['invalid_anti_cheat_policy'], 'antiCheatPolicy');
  }
  if (policy.evidencePolicy && !['basic', 'standard', 'full'].includes(policy.evidencePolicy)) {
    return err('INVALID_EVIDENCE_POLICY', 'Evidence policy must be basic, standard, or full.', ['invalid_evidence_policy'], 'evidencePolicy');
  }
  return okResult();
}

export function validateObjectiveCheckBlueprintRequest(
  request: Record<string, unknown>,
): Phase3ValidationResult {
  if (!request.objectiveId || typeof request.objectiveId !== 'string') {
    return err('MISSING_OBJECTIVE_ID', 'Objective ID is required.', ['missing_objective_id'], 'objectiveId');
  }
  if (!request.schoolId || typeof request.schoolId !== 'string') {
    return err('MISSING_SCHOOL_ID', 'School ID is required.', ['missing_school_id'], 'schoolId');
  }
  return okResult();
}

export function validateObjectiveEvidenceBridgeInput(
  input: Partial<Phase3ObjectiveEvidenceBridgeInput>,
): Phase3ValidationResult {
  if (!input.objectiveId) {
    return err('MISSING_OBJECTIVE_ID', 'Objective ID is required.', ['missing_objective_id'], 'objectiveId');
  }
  if (!input.schoolId) {
    return err('MISSING_SCHOOL_ID', 'School ID is required.', ['missing_school_id'], 'schoolId');
  }
  if (!input.learnerId) {
    return err('MISSING_LEARNER_ID', 'Learner ID is required.', ['missing_learner_id'], 'learnerId');
  }
  if (!input.safeEvidenceRef) {
    return err('MISSING_SAFE_EVIDENCE_REF', 'Safe evidence reference is required.', ['missing_safe_evidence_ref'], 'safeEvidenceRef');
  }
  if (input.antiCheatLabels) {
    for (const label of input.antiCheatLabels) {
      if (!PHASE3_ANTI_CHEAT_LABELS.includes(label as Phase3AntiCheatLabel)) {
        return err('INVALID_ANTI_CHEAT_LABEL', `Invalid anti-cheat label: ${label}.`, ['invalid_anti_cheat_label'], 'antiCheatLabels');
      }
    }
  }
  if (input.evidenceType === 'raw_answer' || input.evidenceType === 'raw_explanation' || input.evidenceType === 'raw_chat') {
    return err('RAW_EVIDENCE_REJECTED', 'Raw evidence types are not allowed.', ['raw_evidence_rejected'], 'evidenceType');
  }

  const forbiddenErrors = rejectForbiddenObjectivePayloadFields(input as Record<string, unknown>);
  if (forbiddenErrors.length > 0) {
    return { ok: false, errors: forbiddenErrors };
  }

  return okResult();
}

export function validateTeacherObjectiveProgressQuery(
  query: Record<string, unknown>,
): Phase3ValidationResult {
  if (!query.schoolId || typeof query.schoolId !== 'string') {
    return err('MISSING_SCHOOL_ID', 'School ID is required.', ['missing_school_id'], 'schoolId');
  }
  if (!query.teacherId || typeof query.teacherId !== 'string') {
    return err('MISSING_TEACHER_ID', 'Teacher ID is required.', ['missing_teacher_id'], 'teacherId');
  }
  return okResult();
}

export function validateLearnerObjectiveProgressQuery(
  query: Record<string, unknown>,
): Phase3ValidationResult {
  if (!query.schoolId || typeof query.schoolId !== 'string') {
    return err('MISSING_SCHOOL_ID', 'School ID is required.', ['missing_school_id'], 'schoolId');
  }
  if (!query.learnerId || typeof query.learnerId !== 'string') {
    return err('MISSING_LEARNER_ID', 'Learner ID is required.', ['missing_learner_id'], 'learnerId');
  }
  return okResult();
}
