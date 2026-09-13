import {
  FORBIDDEN_HIDDEN_REASONING_FIELDS,
} from '../contracts/learnerTransparencyContracts';

const forbiddenSet = new Set<string>(FORBIDDEN_HIDDEN_REASONING_FIELDS);

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function findHiddenReasoningFieldsRecursive(value: unknown, prefix: string = ''): string[] {
  const detected: string[] = [];
  if (!value || typeof value !== 'object') return detected;
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      detected.push(...findHiddenReasoningFieldsRecursive(value[i], `${prefix}[${i}]`));
    }
    return detected;
  }
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (forbiddenSet.has(key)) {
      detected.push(fullKey);
    }
    if (val && typeof val === 'object') {
      detected.push(...findHiddenReasoningFieldsRecursive(val, fullKey));
    }
  }
  return detected;
}

function redactHiddenReasoningRecursive(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (forbiddenSet.has(key)) continue;
    if (isObject(value)) {
      result[key] = redactHiddenReasoningRecursive(value);
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        isObject(item) ? redactHiddenReasoningRecursive(item) : item
      );
    } else {
      result[key] = value;
    }
  }
  return result;
}

export const HIDDEN_REASONING_PATTERNS: RegExp[] = [
  /chain[-.\s_]?of[-.\s_]?thought/i,
  /hidden reasoning/i,
  /internal reasoning/i,
  /system prompt/i,
  /developer prompt/i,
  /provider response/i,
  /the model reasoned/i,
  /scratchpad/i,
];

export function containsHiddenReasoningPatternsInText(text: string): boolean {
  return HIDDEN_REASONING_PATTERNS.some((p) => p.test(text));
}

export function containsHiddenReasoningFields(obj: unknown): boolean {
  return findHiddenReasoningFieldsRecursive(obj).length > 0;
}

export function findHiddenReasoningFields(obj: unknown): string[] {
  return findHiddenReasoningFieldsRecursive(obj);
}

export function rejectHiddenReasoningFields(obj: unknown): void {
  const detected = findHiddenReasoningFieldsRecursive(obj);
  if (detected.length > 0) {
    throw new Error(`Hidden reasoning fields detected: ${detected.join(', ')}`);
  }
}

export function redactHiddenReasoningFields(obj: Record<string, unknown>): Record<string, unknown> {
  return redactHiddenReasoningRecursive(obj);
}

export function assertNoHiddenReasoningInLearnerOutput(obj: unknown): void {
  const detected = findHiddenReasoningFieldsRecursive(obj);
  if (detected.length > 0) {
    throw new Error(`Learner output contains hidden reasoning fields: ${detected.join(', ')}`);
  }
  if (typeof obj === 'string') {
    if (containsHiddenReasoningPatternsInText(obj)) {
      throw new Error(`Learner output text contains hidden reasoning patterns`);
    }
  }
}

export function assertNoPromptOrProviderResponseInLearnerOutput(obj: unknown): void {
  const promptProviderFields = FORBIDDEN_HIDDEN_REASONING_FIELDS.filter((f) =>
    ['prompt', 'systemPrompt', 'developerPrompt', 'providerResponse', 'aiResponse', 'rawCompletion'].includes(f)
  );
  const promptProviderSet = new Set<string>(promptProviderFields);
  const detected: string[] = [];
  function scan(value: unknown, prefix: string = '') {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        scan(value[i], `${prefix}[${i}]`);
      }
      return;
    }
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (promptProviderSet.has(key)) {
        detected.push(fullKey);
      }
      if (val && typeof val === 'object') {
        scan(val, fullKey);
      }
    }
  }
  scan(obj);
  if (detected.length > 0) {
    throw new Error(`Learner output contains prompt or provider response fields: ${detected.join(', ')}`);
  }
}
