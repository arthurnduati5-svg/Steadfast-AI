import type { ForbiddenMetadataKey } from '../contracts/learningModeContracts';
import { FORBIDDEN_METADATA_KEYS } from '../contracts/learningModeContracts';

export type PrivacyGuardResult =
  | { allowed: true; sanitized: Record<string, unknown> }
  | { allowed: false; reason: string; detectedKey?: string };

export function sanitizeMetadata(
  input: Record<string, unknown>,
  allowedKeys: string[],
): PrivacyGuardResult {
  const forbidden = FORBIDDEN_METADATA_KEYS as readonly string[];

  for (const key of Object.keys(input)) {
    if (forbidden.includes(key)) {
      return {
        allowed: false,
        reason: `Forbidden metadata key rejected: ${key}`,
        detectedKey: key,
      };
    }
  }

  const sanitized: Record<string, unknown> = {};
  for (const key of allowedKeys) {
    if (key in input) {
      sanitized[key] = input[key];
    }
  }

  return { allowed: true, sanitized };
}

export function rejectForbiddenKeys(
  input: Record<string, unknown>,
): { valid: true } | { valid: false; detectedKey: string } {
  const forbidden = FORBIDDEN_METADATA_KEYS as readonly string[];
  for (const key of Object.keys(input)) {
    if (forbidden.includes(key)) {
      return { valid: false, detectedKey: key };
    }
  }
  return { valid: true };
}

export function isAllowedMetadataKey(key: string): boolean {
  const forbidden = FORBIDDEN_METADATA_KEYS as readonly string[];
  return !forbidden.includes(key);
}
