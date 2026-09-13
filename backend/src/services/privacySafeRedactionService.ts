import { createHash } from 'crypto';
import { DEFAULT_REDACTION_FIELDS, PRIVACY_SAFE_TELEMETRY_POLICY } from '../contracts/privacySafeTelemetryContracts';

const REDACTION_PLACEHOLDER = '[REDACTED]';

const FORBIDDEN_FIELDS_LOWER = new Set(DEFAULT_REDACTION_FIELDS.map((f) => f.toLowerCase()));

function isForbiddenField(key: string): boolean {
  const lower = key.toLowerCase();
  if (FORBIDDEN_FIELDS_LOWER.has(lower)) return true;
  if (lower.includes('token') || lower.includes('secret') || lower.includes('key')) return true;
  if (lower.includes('password') || lower.includes('authorization')) return true;
  if (lower.includes('cookie')) return true;
  return false;
}

function isRawPrivateTelemetryField(key: string): boolean {
  const lower = key.toLowerCase();
  if (lower === 'rawchat' || lower === 'raw_chat') return true;
  if (lower === 'rawlearnermemory' || lower === 'raw_learner_memory') return true;
  if (lower === 'rawtranscript' || lower === 'raw_transcript') return true;
  if (lower === 'rawprompt' || lower === 'raw_prompt') return true;
  if (lower === 'rawairesponse' || lower === 'raw_ai_response') return true;
  if (lower === 'safeguardingevidence' || lower === 'safeguarding_evidence') return true;
  if (lower === 'rawmessage' || lower === 'raw_message') return true;
  return false;
}

export function redactSensitiveValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return REDACTION_PLACEHOLDER;
  }
  if (typeof value === 'object' && value !== null) {
    if (Array.isArray(value)) {
      return value.map(redactSensitiveValue);
    }
    return redactLogPayload(value as Record<string, unknown>);
  }
  return value;
}

export function redactLogPayload(payload: Record<string, unknown>): Record<string, unknown> {
  const redacted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (isForbiddenField(key)) {
      redacted[key] = REDACTION_PLACEHOLDER;
      continue;
    }
    if (key === 'safeMeta' && typeof value === 'object' && value !== null) {
      redacted[key] = redactLogPayload(value as Record<string, unknown>);
      continue;
    }
    if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        redacted[key] = value.map((item) =>
          typeof item === 'object' && item !== null
            ? redactLogPayload(item as Record<string, unknown>)
            : redactSensitiveValue(item)
        );
      } else {
        redacted[key] = redactLogPayload(value as Record<string, unknown>);
      }
    } else {
      redacted[key] = value;
    }
  }
  return redacted;
}

export function hashTelemetryIdentifier(input: string | undefined | null): string | undefined {
  if (!input) return undefined;
  const hash = createHash('sha256').update(input).digest('hex');
  return hash.slice(0, 16);
}

export function assertNoRawPrivateTelemetry(payload: unknown): {
  safe: boolean;
  violations: string[];
} {
  const violations: string[] = [];
  if (typeof payload !== 'object' || payload === null) {
    return { safe: true, violations: [] };
  }

  function walk(obj: Record<string, unknown>, path: string) {
    for (const [key, value] of Object.entries(obj)) {
      const fullPath = path ? `${path}.${key}` : key;
      if (isRawPrivateTelemetryField(key)) {
        violations.push(fullPath);
      }
      if (typeof value === 'object' && value !== null) {
        walk(value as Record<string, unknown>, fullPath);
      }
    }
  }

  walk(payload as Record<string, unknown>, '');
  return { safe: violations.length === 0, violations };
}
