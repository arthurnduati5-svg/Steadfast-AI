import {
  FORBIDDEN_LEARNER_TRANSPARENCY_FIELDS,
} from '../contracts/learnerTransparencyContracts';

const forbiddenSet = new Set<string>(FORBIDDEN_LEARNER_TRANSPARENCY_FIELDS);

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function findForbiddenFieldsRecursive(value: unknown, prefix: string = ''): string[] {
  const detected: string[] = [];
  if (!value || typeof value !== 'object') return detected;
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      detected.push(...findForbiddenFieldsRecursive(value[i], `${prefix}[${i}]`));
    }
    return detected;
  }
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (forbiddenSet.has(key)) {
      detected.push(fullKey);
    }
    if (val && typeof val === 'object') {
      detected.push(...findForbiddenFieldsRecursive(val, fullKey));
    }
  }
  return detected;
}

function redactRecursive(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (forbiddenSet.has(key)) continue;
    if (isObject(value)) {
      result[key] = redactRecursive(value);
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        isObject(item) ? redactRecursive(item) : item
      );
    } else {
      result[key] = value;
    }
  }
  return result;
}

export function containsForbiddenLearnerTransparencyFields(obj: unknown): boolean {
  return findForbiddenFieldsRecursive(obj).length > 0;
}

export function findForbiddenLearnerTransparencyFields(obj: unknown): string[] {
  return findForbiddenFieldsRecursive(obj);
}

export function rejectForbiddenLearnerTransparencyFields(obj: unknown): void {
  const detected = findForbiddenFieldsRecursive(obj);
  if (detected.length > 0) {
    throw new Error(`Forbidden learner transparency fields detected: ${detected.join(', ')}`);
  }
}

export function redactForbiddenLearnerTransparencyFields(obj: Record<string, unknown>): Record<string, unknown> {
  return redactRecursive(obj);
}

export function assertSafeLearnerTransparencyInput(obj: unknown): void {
  const detected = findForbiddenFieldsRecursive(obj);
  if (detected.length > 0) {
    throw new Error(`Learner transparency input contains forbidden fields: ${detected.join(', ')}`);
  }
}

export function assertSafeLearnerTransparencyOutput(obj: unknown): void {
  const detected = findForbiddenFieldsRecursive(obj);
  if (detected.length > 0) {
    throw new Error(`Learner transparency output contains forbidden fields: ${detected.join(', ')}`);
  }
}

export function assertSafeLearnerEvidenceCardOutput(card: unknown): void {
  const detected = findForbiddenFieldsRecursive(card);
  if (detected.length > 0) {
    throw new Error(`Safe evidence card output contains forbidden fields: ${detected.join(', ')}`);
  }
}

export function assertSafeProgressNarrativeOutput(narrative: unknown): void {
  const detected = findForbiddenFieldsRecursive(narrative);
  if (detected.length > 0) {
    throw new Error(`Progress narrative output contains forbidden fields: ${detected.join(', ')}`);
  }
}

export function assertSafeWhyThisNextOutput(explanation: unknown): void {
  const detected = findForbiddenFieldsRecursive(explanation);
  if (detected.length > 0) {
    throw new Error(`Why-this-next output contains forbidden fields: ${detected.join(', ')}`);
  }
}

export function assertSafeAgencyOptionsOutput(options: unknown[]): void {
  for (let i = 0; i < options.length; i++) {
    const detected = findForbiddenFieldsRecursive(options[i]);
    if (detected.length > 0) {
      throw new Error(`Agency options output at index ${i} contains forbidden fields: ${detected.join(', ')}`);
    }
  }
}
