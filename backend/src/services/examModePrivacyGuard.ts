import { FORBIDDEN_EXAM_MODE_FIELDS } from '../contracts/examModeContracts';

const forbiddenSet = new Set<string>(FORBIDDEN_EXAM_MODE_FIELDS);

export function containsForbiddenExamFields(data: Record<string, unknown>): boolean {
  return findForbiddenExamFields(data).length > 0;
}

export function findForbiddenExamFields(data: Record<string, unknown>, prefix = ''): string[] {
  const detected: string[] = [];
  for (const key of Object.keys(data)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (forbiddenSet.has(key)) {
      detected.push(fullKey);
    }
    if (typeof data[key] === 'object' && data[key] !== null && !Array.isArray(data[key])) {
      const nested = findForbiddenExamFields(data[key] as Record<string, unknown>, fullKey);
      detected.push(...nested);
    }
    if (Array.isArray(data[key])) {
      for (let i = 0; i < (data[key] as unknown[]).length; i++) {
        const item = (data[key] as unknown[])[i];
        if (typeof item === 'object' && item !== null) {
          const nested = findForbiddenExamFields(item as Record<string, unknown>, `${fullKey}[${i}]`);
          detected.push(...nested);
        }
      }
    }
  }
  return detected;
}

export function rejectForbiddenExamFields(data: Record<string, unknown>): { valid: true } | { valid: false; detectedKeys: string[] } {
  const detected = findForbiddenExamFields(data);
  if (detected.length > 0) {
    return { valid: false, detectedKeys: detected };
  }
  return { valid: true };
}

export function redactForbiddenExamFields(data: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = { ...data };
  for (const key of Object.keys(result)) {
    if (forbiddenSet.has(key)) {
      delete result[key];
    }
    if (typeof result[key] === 'object' && result[key] !== null && !Array.isArray(result[key])) {
      result[key] = redactForbiddenExamFields(result[key] as Record<string, unknown>);
    }
    if (Array.isArray(result[key])) {
      result[key] = (result[key] as unknown[]).map(item => {
        if (typeof item === 'object' && item !== null) {
          return redactForbiddenExamFields(item as Record<string, unknown>);
        }
        return item;
      });
    }
  }
  return result;
}

export function assertSafeExamModeInput(data: Record<string, unknown>): void {
  const detected = findForbiddenExamFields(data);
  if (detected.length > 0) {
    throw new Error(`Forbidden exam mode fields detected: ${detected.join(', ')}`);
  }
}

export function assertSafeExamModeOutput(data: Record<string, unknown>): void {
  const detected = findForbiddenExamFields(data);
  if (detected.length > 0) {
    throw new Error(`Exam mode output contains forbidden fields: ${detected.join(', ')}`);
  }
}
