import { FORBIDDEN_QUIZ_MODE_FIELDS } from '../contracts/quizModeContracts';

const forbiddenSet = new Set<string>(FORBIDDEN_QUIZ_MODE_FIELDS);

export function containsForbiddenQuizFields(data: Record<string, unknown>): boolean {
  return findForbiddenQuizFields(data).length > 0;
}

export function findForbiddenQuizFields(data: Record<string, unknown>, prefix = ''): string[] {
  const detected: string[] = [];
  for (const key of Object.keys(data)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (forbiddenSet.has(key)) {
      detected.push(fullKey);
    }
    if (typeof data[key] === 'object' && data[key] !== null && !Array.isArray(data[key])) {
      const nested = findForbiddenQuizFields(data[key] as Record<string, unknown>, fullKey);
      detected.push(...nested);
    }
    if (Array.isArray(data[key])) {
      for (let i = 0; i < (data[key] as unknown[]).length; i++) {
        const item = (data[key] as unknown[])[i];
        if (typeof item === 'object' && item !== null) {
          const nested = findForbiddenQuizFields(item as Record<string, unknown>, `${fullKey}[${i}]`);
          detected.push(...nested);
        }
      }
    }
  }
  return detected;
}

export function rejectForbiddenQuizFields(data: Record<string, unknown>): { valid: true } | { valid: false; detectedKeys: string[] } {
  const detected = findForbiddenQuizFields(data);
  if (detected.length > 0) {
    return { valid: false, detectedKeys: detected };
  }
  return { valid: true };
}

export function redactForbiddenQuizFields(data: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = { ...data };
  for (const key of Object.keys(result)) {
    if (forbiddenSet.has(key)) {
      delete result[key];
    }
    if (typeof result[key] === 'object' && result[key] !== null && !Array.isArray(result[key])) {
      result[key] = redactForbiddenQuizFields(result[key] as Record<string, unknown>);
    }
    if (Array.isArray(result[key])) {
      result[key] = (result[key] as unknown[]).map(item => {
        if (typeof item === 'object' && item !== null) {
          return redactForbiddenQuizFields(item as Record<string, unknown>);
        }
        return item;
      });
    }
  }
  return result;
}

export function assertSafeQuizModeInput(data: Record<string, unknown>): void {
  const detected = findForbiddenQuizFields(data);
  if (detected.length > 0) {
    throw new Error(`Forbidden quiz mode fields detected: ${detected.join(', ')}`);
  }
}

export function assertSafeQuizModeOutput(data: Record<string, unknown>): void {
  const detected = findForbiddenQuizFields(data);
  if (detected.length > 0) {
    throw new Error(`Quiz mode output contains forbidden fields: ${detected.join(', ')}`);
  }
}
