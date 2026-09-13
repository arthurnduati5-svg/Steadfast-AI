import {
  FORBIDDEN_TEACHER_SAFE_REPORT_FIELDS,
  TeacherSafePrivacyResult,
  TeacherSafeReasonCode,
} from '../contracts/teacherSafeInsightContracts';

const FORBIDDEN_SET = new Set<string>(FORBIDDEN_TEACHER_SAFE_REPORT_FIELDS);

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function deepFindForbiddenFields(obj: unknown, path = ''): string[] {
  if (!isObject(obj)) return [];
  const found: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const currentPath = path ? `${path}.${key}` : key;
    if (FORBIDDEN_SET.has(key) && value !== false && value !== undefined) {
      found.push(currentPath);
    }
    if (isObject(value)) {
      found.push(...deepFindForbiddenFields(value, currentPath));
    }
    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        if (isObject(value[i])) {
          found.push(...deepFindForbiddenFields(value[i], `${currentPath}[${i}]`));
        }
      }
    }
  }
  return found;
}

function deepRedactForbiddenFields(obj: unknown): unknown {
  if (!isObject(obj)) return obj;
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (FORBIDDEN_SET.has(key)) {
      result[key] = undefined;
    } else if (isObject(value)) {
      result[key] = deepRedactForbiddenFields(value);
    } else if (Array.isArray(value)) {
      result[key] = value.map(item =>
        isObject(item) ? deepRedactForbiddenFields(item) : item
      );
    } else {
      result[key] = value;
    }
  }
  return result;
}

export function containsForbiddenTeacherSafeFields(obj: unknown): boolean {
  return deepFindForbiddenFields(obj).length > 0;
}

export function findForbiddenTeacherSafeFields(obj: unknown): string[] {
  return deepFindForbiddenFields(obj);
}

export function rejectForbiddenTeacherSafeFields(obj: unknown): TeacherSafePrivacyResult {
  const forbidden = deepFindForbiddenFields(obj);
  return {
    safe: forbidden.length === 0,
    forbiddenFieldsFound: forbidden,
    redacted: false,
    reasonCodes: forbidden.length > 0 ? ['forbidden_raw_field_detected'] : [],
  };
}

export function redactForbiddenTeacherSafeFields<T>(obj: T): T {
  return deepRedactForbiddenFields(obj) as T;
}

export function assertSafeTeacherInsightInput(obj: unknown): void {
  const forbidden = deepFindForbiddenFields(obj);
  if (forbidden.length > 0) {
    throw new Error(
      `Teacher insight input contains forbidden fields: ${forbidden.join(', ')}`
    );
  }
}

export function assertSafeTeacherInsightOutput(obj: unknown): void {
  const forbidden = deepFindForbiddenFields(obj);
  if (forbidden.length > 0) {
    throw new Error(
      `Teacher insight output contains forbidden fields: ${forbidden.join(', ')}`
    );
  }
}

export function assertSafeLearnerFacingOutput(obj: unknown): void {
  const forbidden = deepFindForbiddenFields(obj);
  const learnerBlocked = [...FORBIDDEN_SET].filter(f =>
    f === 'teacherOnlyNote' || f === 'answerKey' || f === 'markingScheme' || f === 'modelAnswer' || f === 'correctAnswer'
  );
  const extraFields: string[] = [];
  if (isObject(obj)) {
    for (const key of learnerBlocked) {
      if (key in (obj as Record<string, unknown>)) {
        extraFields.push(key);
      }
    }
  }
  const allForbidden = [...forbidden, ...extraFields];
  if (allForbidden.length > 0) {
    throw new Error(
      `Learner-facing output contains forbidden fields: ${allForbidden.join(', ')}`
    );
  }
}

export function assertSafeClassSummaryOutput(obj: unknown): void {
  assertSafeTeacherInsightOutput(obj);
}

export function assertSafeSupportQueueOutput(obj: unknown): void {
  assertSafeTeacherInsightOutput(obj);
  if (isObject(obj)) {
    const o = obj as Record<string, unknown>;
    if ('safeguardingRawDetail' in o) {
      throw new Error('Support queue output contains safeguarding raw detail');
    }
    if ('deenSensitivePrivateText' in o) {
      throw new Error('Support queue output contains Deen-sensitive private text');
    }
  }
}
