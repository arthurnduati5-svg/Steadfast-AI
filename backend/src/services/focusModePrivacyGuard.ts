import { FORBIDDEN_FOCUS_MODE_FIELDS } from '../contracts/focusModeContracts';

const forbiddenSet = new Set<string>(FORBIDDEN_FOCUS_MODE_FIELDS);

export function containsForbiddenFocusFields(data: Record<string, unknown>): boolean {
  return findForbiddenFocusFields(data).length > 0;
}

export function findForbiddenFocusFields(data: Record<string, unknown>, prefix = ''): string[] {
  const detected: string[] = [];
  for (const key of Object.keys(data)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (forbiddenSet.has(key)) {
      detected.push(fullKey);
    }
    if (typeof data[key] === 'object' && data[key] !== null && !Array.isArray(data[key])) {
      const nested = findForbiddenFocusFields(data[key] as Record<string, unknown>, fullKey);
      detected.push(...nested);
    }
    if (Array.isArray(data[key])) {
      for (let i = 0; i < (data[key] as unknown[]).length; i++) {
        const item = (data[key] as unknown[])[i];
        if (typeof item === 'object' && item !== null) {
          const nested = findForbiddenFocusFields(item as Record<string, unknown>, `${fullKey}[${i}]`);
          detected.push(...nested);
        }
      }
    }
  }
  return detected;
}

export function rejectForbiddenFocusFields(data: Record<string, unknown>): { valid: true } | { valid: false; detectedKeys: string[] } {
  const detected = findForbiddenFocusFields(data);
  if (detected.length > 0) {
    return { valid: false, detectedKeys: detected };
  }
  return { valid: true };
}

export function redactForbiddenFocusFields(data: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = { ...data };
  for (const key of Object.keys(result)) {
    if (forbiddenSet.has(key)) {
      delete result[key];
    }
    if (typeof result[key] === 'object' && result[key] !== null && !Array.isArray(result[key])) {
      result[key] = redactForbiddenFocusFields(result[key] as Record<string, unknown>);
    }
    if (Array.isArray(result[key])) {
      result[key] = (result[key] as unknown[]).map(item => {
        if (typeof item === 'object' && item !== null) {
          return redactForbiddenFocusFields(item as Record<string, unknown>);
        }
        return item;
      });
    }
  }
  return result;
}

export function assertSafeFocusModeInput(data: Record<string, unknown>): void {
  const detected = findForbiddenFocusFields(data);
  if (detected.length > 0) {
    throw new Error(`Forbidden focus mode fields detected: ${detected.join(', ')}`);
  }
}

export function assertSafeFocusModeOutput(data: Record<string, unknown>): void {
  const detected = findForbiddenFocusFields(data);
  if (detected.length > 0) {
    throw new Error(`Focus mode output contains forbidden fields: ${detected.join(', ')}`);
  }
}
