import { FORBIDDEN_REVISION_MODE_FIELDS } from '../contracts/revisionModeContracts';

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

export function containsForbiddenRevisionFields(value: unknown): boolean {
  return findForbiddenRevisionFields(value).length > 0;
}

export function findForbiddenRevisionFields(value: unknown, path: string[] = []): string[] {
  const results: string[] = [];
  if (!value || typeof value !== 'object') return results;

  const entries = isArray(value)
    ? value.flatMap((item, index) => {
        if (isObject(item) || isArray(item)) {
          return findForbiddenRevisionFields(item, [...path, `[${index}]`]);
        }
        return [];
      })
    : Object.entries(value as Record<string, unknown>).flatMap(([key, val]) => {
        const currentPath = [...path, key].join('.');
        if (FORBIDDEN_REVISION_MODE_FIELDS.includes(key as any)) {
          results.push(currentPath);
        }
        if (isObject(val) || isArray(val)) {
          return findForbiddenRevisionFields(val, [...path, key]);
        }
        return [];
      });

  return [...results, ...entries];
}

export function rejectForbiddenRevisionFields(value: unknown): { valid: boolean; detectedKeys: string[] } {
  const detected = findForbiddenRevisionFields(value);
  return { valid: detected.length === 0, detectedKeys: detected };
}

export function redactForbiddenRevisionFields(value: unknown): unknown {
  if (!value || typeof value !== 'object') return value;
  if (Array.isArray(value)) {
    return value.map((item) => redactForbiddenRevisionFields(item));
  }
  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    if (FORBIDDEN_REVISION_MODE_FIELDS.includes(key as any)) {
      result[key] = '[REDACTED]';
    } else if (isObject(val) || isArray(val)) {
      result[key] = redactForbiddenRevisionFields(val);
    } else {
      result[key] = val;
    }
  }
  return result;
}

export function assertSafeRevisionModeInput(value: unknown): void {
  const { valid, detectedKeys } = rejectForbiddenRevisionFields(value);
  if (!valid) {
    throw new Error(`Forbidden revision mode fields detected: ${detectedKeys.join(', ')}`);
  }
}

export function assertSafeRevisionModeOutput(value: unknown): void {
  const { valid, detectedKeys } = rejectForbiddenRevisionFields(value);
  if (!valid) {
    throw new Error(`Forbidden revision mode fields in output: ${detectedKeys.join(', ')}`);
  }
}
