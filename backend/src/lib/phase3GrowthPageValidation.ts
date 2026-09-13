import {
  PHASE3_GROWTH_PAGE_CARD_TYPES,
  PHASE3_GROWTH_PAGE_PRIORITIES,
  PHASE3_GROWTH_PAGE_ACTIONS,
  PHASE3_GROWTH_PAGE_SOURCE_TYPES,
  PHASE3_GROWTH_PAGE_SIGNAL_TYPES,
  PHASE3_WEAK_TOPIC_LANE_STATUSES,
  PHASE3_MISTAKE_PATTERN_TYPES,
  PHASE3_LEARNING_HELP_PATTERN_TYPES,
  PHASE3_GROWTH_PAGE_FORBIDDEN_FIELDS,
  type Phase3GrowthPageQuery,
  type Phase3GrowthPageTeacherQuery,
  type Phase3GrowthPageContext,
  type Phase3GrowthPageCardType,
  type Phase3GrowthPagePriority,
  type Phase3GrowthPageAction,
  type Phase3GrowthPageSourceType,
  type Phase3GrowthPageSignalType,
  type Phase3WeakTopicLaneStatus,
  type Phase3MistakePatternType,
  type Phase3LearningHelpPatternType,
  type Phase3DueNowItem,
  type Phase3WeakTopicLane,
  type Phase3MistakeJournalEntry,
  type Phase3WhatHelpsMeLearnBestProfile,
} from '../contracts/phase3GrowthPageContracts';

export class Phase3GrowthPageValidationError extends Error {
  public readonly code: string;
  public readonly safeMessage: string;
  constructor(code: string, safeMessage: string) {
    super(safeMessage);
    this.name = 'Phase3GrowthPageValidationError';
    this.code = code;
    this.safeMessage = safeMessage;
  }
}

function safeEnumValue<T extends string>(label: string, value: string, allowed: readonly T[]): T | null {
  const found = allowed.find((a) => a === value);
  return found ?? null;
}

function assertRequired(val: unknown, field: string): void {
  if (val === undefined || val === null || (typeof val === 'string' && val.trim() === '')) {
    throw new Phase3GrowthPageValidationError(
      `MISSING_${field.toUpperCase()}`,
      `Request is missing required information.`
    );
  }
}

function assertNoForbiddenFields(payload: Record<string, unknown>): void {
  for (const key of Object.keys(payload)) {
    if ((PHASE3_GROWTH_PAGE_FORBIDDEN_FIELDS as readonly string[]).includes(key)) {
      throw new Phase3GrowthPageValidationError(
        'FORBIDDEN_FIELD',
        'Request contains fields that cannot be processed.'
      );
    }
  }
}

export function validateGrowthPageLearnerQuery(query: Partial<Phase3GrowthPageQuery>): Phase3GrowthPageQuery {
  assertRequired(query.schoolId, 'schoolId');
  assertRequired(query.studentId, 'studentId');
  assertNoForbiddenFields(query as Record<string, unknown>);
  return {
    schoolId: query.schoolId!,
    studentId: query.studentId!,
    subjectId: query.subjectId,
    classId: query.classId,
  };
}

export function validateGrowthPageTeacherQuery(query: Partial<Phase3GrowthPageTeacherQuery>): Phase3GrowthPageTeacherQuery {
  assertRequired(query.schoolId, 'schoolId');
  assertRequired(query.teacherId, 'teacherId');
  assertRequired(query.role, 'role');
  assertNoForbiddenFields(query as Record<string, unknown>);
  const validRole = query.role === 'teacher' || query.role === 'admin' || query.role === 'internal';
  if (!validRole) {
    throw new Phase3GrowthPageValidationError('INVALID_ROLE', 'Access requires teacher or admin role.');
  }
  return {
    schoolId: query.schoolId!,
    teacherId: query.teacherId!,
    classId: query.classId,
    subjectId: query.subjectId,
    role: query.role!,
  };
}

export function validateGrowthPageContext(ctx: Partial<Phase3GrowthPageContext>): Phase3GrowthPageContext {
  assertRequired(ctx.schoolId, 'schoolId');
  assertNoForbiddenFields(ctx as Record<string, unknown>);
  return {
    schoolId: ctx.schoolId!,
    studentId: ctx.studentId,
    teacherId: ctx.teacherId,
    classId: ctx.classId,
    subjectId: ctx.subjectId,
    topicId: ctx.topicId,
    skillId: ctx.skillId,
    role: ctx.role,
  };
}

export function validateGrowthPageCardType(cardType: string): Phase3GrowthPageCardType {
  const valid = safeEnumValue('cardType', cardType, PHASE3_GROWTH_PAGE_CARD_TYPES);
  if (!valid) {
    throw new Phase3GrowthPageValidationError('UNSUPPORTED_CARD_TYPE', 'This card type is not supported.');
  }
  return valid;
}

export function validateGrowthPagePriority(priority: string): Phase3GrowthPagePriority {
  const valid = safeEnumValue('priority', priority, PHASE3_GROWTH_PAGE_PRIORITIES);
  if (!valid) {
    throw new Phase3GrowthPageValidationError('UNSUPPORTED_PRIORITY', 'This priority level is not supported.');
  }
  return valid;
}

export function validateGrowthPageAction(action: string): Phase3GrowthPageAction {
  const valid = safeEnumValue('action', action, PHASE3_GROWTH_PAGE_ACTIONS);
  if (!valid) {
    throw new Phase3GrowthPageValidationError('UNSUPPORTED_ACTION', 'This action is not supported.');
  }
  return valid;
}

export function validateGrowthPageSourceType(sourceType: string): Phase3GrowthPageSourceType {
  const valid = safeEnumValue('sourceType', sourceType, PHASE3_GROWTH_PAGE_SOURCE_TYPES);
  if (!valid) {
    throw new Phase3GrowthPageValidationError('UNSUPPORTED_SOURCE_TYPE', 'This source type is not supported.');
  }
  return valid;
}

export function validateGrowthPageSignalType(signalType: string): Phase3GrowthPageSignalType {
  const valid = safeEnumValue('signalType', signalType, PHASE3_GROWTH_PAGE_SIGNAL_TYPES);
  if (!valid) {
    throw new Phase3GrowthPageValidationError('UNSUPPORTED_SIGNAL_TYPE', 'This signal type is not supported.');
  }
  return valid;
}

export function validateWeakTopicLaneStatus(status: string): Phase3WeakTopicLaneStatus {
  const valid = safeEnumValue('status', status, PHASE3_WEAK_TOPIC_LANE_STATUSES);
  if (!valid) {
    throw new Phase3GrowthPageValidationError('UNSUPPORTED_WEAK_TOPIC_STATUS', 'This weak topic status is not supported.');
  }
  return valid;
}

export function validateMistakePatternType(patternType: string): Phase3MistakePatternType {
  const valid = safeEnumValue('patternType', patternType, PHASE3_MISTAKE_PATTERN_TYPES);
  if (!valid) {
    throw new Phase3GrowthPageValidationError('UNSUPPORTED_MISTAKE_PATTERN', 'This mistake pattern type is not supported.');
  }
  return valid;
}

export function validateLearningHelpPatternType(patternType: string): Phase3LearningHelpPatternType {
  const valid = safeEnumValue('patternType', patternType, PHASE3_LEARNING_HELP_PATTERN_TYPES);
  if (!valid) {
    throw new Phase3GrowthPageValidationError('UNSUPPORTED_LEARNING_HELP_PATTERN', 'This learning help pattern is not supported.');
  }
  return valid;
}

export function validateGrowthPageCardInput(input: {
  cardType: string;
  priority: string;
  recommendedAction: string;
  sourceType: string;
  signalType: string;
}): void {
  validateGrowthPageCardType(input.cardType);
  validateGrowthPagePriority(input.priority);
  validateGrowthPageAction(input.recommendedAction);
  validateGrowthPageSourceType(input.sourceType);
  validateGrowthPageSignalType(input.signalType);
}

export function validateDueNowInput(input: {
  sourceType: string;
  signalType: string;
  priority: string;
  recommendedAction: string;
}): void {
  validateGrowthPageSourceType(input.sourceType);
  validateGrowthPageSignalType(input.signalType);
  validateGrowthPagePriority(input.priority);
  validateGrowthPageAction(input.recommendedAction);
}

export function validateWeakTopicLaneInput(input: {
  status: string;
  recommendedAction: string;
  priority: string;
}): void {
  validateWeakTopicLaneStatus(input.status);
  validateGrowthPageAction(input.recommendedAction);
  validateGrowthPagePriority(input.priority);
}

export function validateMistakeJournalEntryInput(input: {
  patternType: string;
  recommendedAction: string;
  priority: string;
}): void {
  validateMistakePatternType(input.patternType);
  validateGrowthPageAction(input.recommendedAction);
  validateGrowthPagePriority(input.priority);
}

export function validateWhatHelpsMeLearnBestInput(input: {
  patternTypes: string[];
}): void {
  if (!input.patternTypes || input.patternTypes.length === 0) {
    throw new Phase3GrowthPageValidationError('MISSING_PATTERNS', 'Learning help patterns are required.');
  }
  for (const pt of input.patternTypes) {
    validateLearningHelpPatternType(pt);
  }
}

export function validateGrowthPageActionInput(input: { action: string }): Phase3GrowthPageAction {
  return validateGrowthPageAction(input.action);
}

export function rejectForbiddenGrowthPagePayloadFields(payload: Record<string, unknown>): void {
  assertNoForbiddenFields(payload);
}

export function createSafeGrowthPageValidationError(code: string): Phase3GrowthPageValidationError {
  return new Phase3GrowthPageValidationError(code, 'This request could not be processed.');
}
