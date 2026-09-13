import { FORBIDDEN_GROWTH_ACTION_FIELDS } from '../contracts/growthActionContracts';

const forbiddenSet = new Set<string>(FORBIDDEN_GROWTH_ACTION_FIELDS);

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

export function containsForbiddenGrowthActionFields(obj: unknown): boolean {
  return findForbiddenGrowthActionFields(obj).length > 0;
}

export function findForbiddenGrowthActionFields(obj: unknown): string[] {
  const found: string[] = [];
  inspectValue(obj, '', found);
  return found;
}

export function rejectForbiddenGrowthActionFields(obj: unknown): asserts obj is Record<string, unknown> {
  const forbidden = findForbiddenGrowthActionFields(obj);
  if (forbidden.length > 0) {
    throw new Error(`Forbidden fields detected: ${forbidden.join(', ')}`);
  }
}

export function redactForbiddenGrowthActionFields(obj: unknown): Record<string, unknown> {
  if (!obj || typeof obj !== 'object') return { _redacted: true };
  const redacted: Record<string, unknown> = {};
  const entries = Array.isArray(obj) ? obj.entries() : Object.entries(obj);
  for (const [key, val] of Object.entries(obj)) {
    if (forbiddenSet.has(key)) continue;
    if (val && typeof val === 'object') {
      redacted[key] = redactForbiddenGrowthActionFields(val);
    } else {
      redacted[key] = val;
    }
  }
  return redacted;
}

export function assertSafeGrowthActionInput(obj: unknown): void {
  const forbidden = findForbiddenGrowthActionFields(obj);
  if (forbidden.length > 0) {
    throw new Error(`Forbidden fields in input: ${forbidden.join(', ')}`);
  }
}

export function assertSafeGrowthActionOutput(obj: unknown): Record<string, unknown> {
  return redactForbiddenGrowthActionFields(obj);
}
