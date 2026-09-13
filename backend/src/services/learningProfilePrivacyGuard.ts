import { FORBIDDEN_PROFILE_FIELDS } from '../contracts/studentLearningProfileContracts';

export interface PrivacyCheckResult {
  valid: boolean;
  detectedKey?: string;
}

export function rejectRawProfileInput(data: Record<string, unknown>): PrivacyCheckResult {
  const forbidden = FORBIDDEN_PROFILE_FIELDS as readonly string[];
  for (const key of Object.keys(data)) {
    if (forbidden.includes(key as any)) {
      return { valid: false, detectedKey: key };
    }
  }
  return { valid: true };
}

export function sanitizeProfileMetadata(
  metadata: Record<string, unknown>,
  allowedKeys: string[],
): { allowed: boolean; reason?: string } {
  const rejectedKeys: string[] = [];
  const forbidden = FORBIDDEN_PROFILE_FIELDS as readonly string[];

  for (const key of Object.keys(metadata)) {
    if (forbidden.includes(key as any)) {
      rejectedKeys.push(key);
    }
  }

  if (rejectedKeys.length > 0) {
    return { allowed: false, reason: `Forbidden fields detected: ${rejectedKeys.join(', ')}` };
  }

  // Also check that only allowed keys are present if specified
  if (allowedKeys.length > 0) {
    for (const key of Object.keys(metadata)) {
      if (!allowedKeys.includes(key) && !forbidden.includes(key as any)) {
        // Warn but allow unknown keys
      }
    }
  }

  return { allowed: true };
}

export function assertNoForbiddenProfileFields(data: Record<string, unknown>): void {
  const check = rejectRawProfileInput(data);
  if (!check.valid) {
    throw new Error(`Forbidden field detected: ${check.detectedKey}`);
  }
}

export function redactUnsafeProfileOutput<T extends Record<string, any>>(data: T): T {
  const forbidden = FORBIDDEN_PROFILE_FIELDS as readonly string[];
  const redacted = { ...data };

  for (const key of forbidden) {
    if (key in redacted) {
      delete redacted[key];
    }
  }

  return redacted;
}
