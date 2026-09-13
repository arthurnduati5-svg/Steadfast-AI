import { FORBIDDEN_TEACH_BACK_MODE_FIELDS } from '../contracts/teachBackModeContracts';

const forbiddenSet = new Set<string>(FORBIDDEN_TEACH_BACK_MODE_FIELDS);

export function containsForbiddenTeachBackFields(data: Record<string, unknown>): boolean {
  return findForbiddenTeachBackFields(data).length > 0;
}

export function findForbiddenTeachBackFields(data: Record<string, unknown>, prefix = ''): string[] {
  const detected: string[] = [];
  for (const key of Object.keys(data)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (forbiddenSet.has(key)) {
      detected.push(fullKey);
    }
    if (typeof data[key] === 'object' && data[key] !== null && !Array.isArray(data[key])) {
      const nested = findForbiddenTeachBackFields(data[key] as Record<string, unknown>, fullKey);
      detected.push(...nested);
    }
    if (Array.isArray(data[key])) {
      for (let i = 0; i < (data[key] as unknown[]).length; i++) {
        const item = (data[key] as unknown[])[i];
        if (typeof item === 'object' && item !== null) {
          const nested = findForbiddenTeachBackFields(item as Record<string, unknown>, `${fullKey}[${i}]`);
          detected.push(...nested);
        }
      }
    }
  }
  return detected;
}

export function rejectForbiddenTeachBackFields(data: Record<string, unknown>): { valid: true } | { valid: false; detectedKeys: string[] } {
  const detected = findForbiddenTeachBackFields(data);
  if (detected.length > 0) {
    return { valid: false, detectedKeys: detected };
  }
  return { valid: true };
}

export function redactForbiddenTeachBackFields(data: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = { ...data };
  for (const key of Object.keys(result)) {
    if (forbiddenSet.has(key)) {
      delete result[key];
    }
    if (typeof result[key] === 'object' && result[key] !== null && !Array.isArray(result[key])) {
      result[key] = redactForbiddenTeachBackFields(result[key] as Record<string, unknown>);
    }
    if (Array.isArray(result[key])) {
      result[key] = (result[key] as unknown[]).map(item => {
        if (typeof item === 'object' && item !== null) {
          return redactForbiddenTeachBackFields(item as Record<string, unknown>);
        }
        return item;
      });
    }
  }
  return result;
}

export function assertSafeTeachBackModeInput(data: Record<string, unknown>): void {
  const detected = findForbiddenTeachBackFields(data);
  if (detected.length > 0) {
    throw new Error(`Forbidden teach-back mode fields detected: ${detected.join(', ')}`);
  }
}

export function assertSafeTeachBackModeOutput(data: Record<string, unknown>): void {
  const detected = findForbiddenTeachBackFields(data);
  if (detected.length > 0) {
    throw new Error(`Teach-back mode output contains forbidden fields: ${detected.join(', ')}`);
  }
}
