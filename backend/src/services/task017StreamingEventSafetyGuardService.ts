import type { StreamingSafetyDecision } from './task017Contracts';
import { UNSAFE_FIELD_PATTERNS } from './task017Contracts';

export function checkStreamEventSafety(
  payload: Record<string, unknown>,
): StreamingSafetyDecision {
  const redactedFields: string[] = [];

  for (const key of Object.keys(payload)) {
    const keyLower = key.toLowerCase();
    for (const pattern of UNSAFE_FIELD_PATTERNS) {
      if (keyLower.includes(pattern.toLowerCase())) {
        redactedFields.push(key);
        break;
      }
    }
    if (typeof payload[key] === 'string') {
      const strValue = (payload[key] as string).toLowerCase();
      for (const pattern of UNSAFE_FIELD_PATTERNS) {
        if (strValue.includes(pattern.toLowerCase())) {
          if (!redactedFields.includes(key)) redactedFields.push(key);
          break;
        }
      }
    }
  }

  if (redactedFields.length > 0) {
    return {
      allowed: false,
      redactedFields,
      blockedReason: `Event blocked: contains unsafe fields: ${redactedFields.join(', ')}`,
    };
  }

  return { allowed: true, redactedFields: [] };
}

export function sanitizeStreamPayload(
  payload: Record<string, unknown>,
): { sanitized: Record<string, unknown>; redactedFields: string[] } {
  const redactedFields: string[] = [];
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(payload)) {
    const keyLower = key.toLowerCase();
    let isUnsafe = false;
    for (const pattern of UNSAFE_FIELD_PATTERNS) {
      if (keyLower.includes(pattern.toLowerCase())) {
        isUnsafe = true;
        break;
      }
    }
    if (isUnsafe) {
      redactedFields.push(key);
      continue;
    }
    if (typeof value === 'string') {
      let strValue = value;
      let modified = false;
      for (const pattern of UNSAFE_FIELD_PATTERNS) {
        if (strValue.toLowerCase().includes(pattern.toLowerCase())) {
          strValue = strValue.replace(new RegExp(pattern, 'gi'), '[REDACTED]');
          modified = true;
        }
      }
      sanitized[key] = modified ? strValue : value;
    } else {
      sanitized[key] = value;
    }
  }

  return { sanitized, redactedFields };
}
