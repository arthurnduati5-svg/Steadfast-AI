import { FORBIDDEN_TUTOR_ACTION_FIELDS } from '../contracts/tutorActionContracts';

const forbiddenSet = new Set<string>(FORBIDDEN_TUTOR_ACTION_FIELDS);

export function rejectForbiddenFields(data: Record<string, unknown>): string[] {
  const detected: string[] = [];
  for (const key of Object.keys(data)) {
    if (forbiddenSet.has(key)) {
      detected.push(key);
    }
    if (typeof data[key] === 'object' && data[key] !== null && !Array.isArray(data[key])) {
      const nested = rejectForbiddenFields(data[key] as Record<string, unknown>);
      detected.push(...nested.map(n => `${key}.${n}`));
    }
  }
  return detected;
}

export function redactForbiddenFields(data: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = { ...data };
  for (const key of Object.keys(result)) {
    if (forbiddenSet.has(key)) {
      delete result[key];
    }
    if (typeof result[key] === 'object' && result[key] !== null && !Array.isArray(result[key])) {
      result[key] = redactForbiddenFields(result[key] as Record<string, unknown>);
    }
  }
  return result;
}

export function containsForbiddenFields(data: Record<string, unknown>): boolean {
  return rejectForbiddenFields(data).length > 0;
}
