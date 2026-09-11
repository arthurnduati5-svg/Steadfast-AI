import { FORBIDDEN_TUTOR_TURN_FIELDS } from '../contracts/tutorTurnRuntimeContracts';

const forbiddenSet = new Set<string>(FORBIDDEN_TUTOR_TURN_FIELDS);

function inspectValue(value: unknown, path: string, found: string[]): void {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      inspectValue(value[i], `${path}[${i}]`, found);
    }
    return;
  }
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    const currentPath = path ? `${path}.${key}` : key;
    if (forbiddenSet.has(key)) {
      found.push(currentPath);
    }
    if (val && typeof val === 'object') {
      inspectValue(val, currentPath, found);
    }
  }
}

export function containsForbiddenTutorTurnFields(obj: unknown): boolean {
  return findForbiddenTutorTurnFields(obj).length > 0;
}

export function findForbiddenTutorTurnFields(obj: unknown): string[] {
  const found: string[] = [];
  inspectValue(obj, '', found);
  return found;
}

export function rejectForbiddenTutorTurnFields(obj: unknown): asserts obj is Record<string, unknown> {
  const forbidden = findForbiddenTutorTurnFields(obj);
  if (forbidden.length > 0) {
    throw new Error(`Forbidden fields detected: ${forbidden.join(', ')}`);
  }
}

export function redactForbiddenTutorTurnFields(obj: unknown): unknown {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(item => redactForbiddenTutorTurnFields(item));
  }
  const redacted: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
    if (forbiddenSet.has(key)) continue;
    if (val && typeof val === 'object') {
      redacted[key] = redactForbiddenTutorTurnFields(val);
    } else {
      redacted[key] = val;
    }
  }
  return redacted;
}

export function assertSafeTutorTurnInput(obj: unknown): void {
  const forbidden = findForbiddenTutorTurnFields(obj);
  if (forbidden.length > 0) {
    throw new Error(`Forbidden fields in Tutor Turn input: ${forbidden.join(', ')}`);
  }
}

export function assertSafeTutorTurnOutput(obj: unknown): unknown {
  return redactForbiddenTutorTurnFields(obj);
}
