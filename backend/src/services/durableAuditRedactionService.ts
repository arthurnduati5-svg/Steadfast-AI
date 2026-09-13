// ─────────────────────────────────────────────────────────────
// Steadfast AI — Durable Audit Redaction Service v1
// Strips sensitive data from audit payloads before persistence.
// Reuses patterns from privacySafeRedactionService and extends
// with additional durable-audit-specific redaction rules.
// ─────────────────────────────────────────────────────────────

import type { DurableAuditEventPayload, DurableAuditRedactionState } from '../contracts/durableAuditEventContracts';
import { redactLogPayload, hashTelemetryIdentifier } from './privacySafeRedactionService';

const REDACTION_VERSION = '1.0.0';

/**
 * Fields that must be removed or redacted from audit metadata.
 */
const FORBIDDEN_DURABLE_AUDIT_FIELDS = new Set([
  'password',
  'token',
  'secret',
  'cookie',
  'authorization',
  'bearer',
  'apikey',
  'privatekey',
  'rawprompt',
  'prompttext',
  'rawairesponse',
  'rawresponse',
  'rawchat',
  'messages',
  'transcript',
  'rawtranscript',
  'learnermemoryraw',
  'answerkey',
  'expectedanswer',
  'safeguardingevidenceraw',
  'requestbody',
  'responsebody',
  'accesstoken',
  'refreshtoken',
  'sessioncookie',
  'bearertoken',
]);

const FORBIDDEN_DURABLE_PREFIXES = [
  'raw_',
  'raw',
  '_raw',
];

function isForbiddenDurableAuditField(key: string): boolean {
  const lower = key.toLowerCase().replace(/[-_]/g, '');
  if (FORBIDDEN_DURABLE_AUDIT_FIELDS.has(lower)) return true;
  for (const prefix of FORBIDDEN_DURABLE_PREFIXES) {
    if (lower.startsWith(prefix.replace(/[-_]/g, ''))) return true;
  }
  return false;
}

/**
 * Sanitize audit metadata by removing forbidden fields recursively.
 * Returns a new object — does not mutate the original.
 */
export function sanitizeDurableAuditMetadata(input: unknown): Record<string, unknown> {
  if (typeof input !== 'object' || input === null) return {};
  return deepSanitize(input as Record<string, unknown>);
}

function deepSanitize(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (isForbiddenDurableAuditField(key)) {
      result[key] = '[REDACTED]';
      continue;
    }
    if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        result[key] = value.map((item) =>
          typeof item === 'object' && item !== null
            ? deepSanitize(item as Record<string, unknown>)
            : typeof item === 'string' && isSensitiveValue(item)
              ? '[REDACTED]'
              : item,
        );
      } else {
        result[key] = deepSanitize(value as Record<string, unknown>);
      }
    } else if (typeof value === 'string' && isSensitiveValue(value)) {
      result[key] = '[REDACTED]';
    } else {
      result[key] = value;
    }
  }
  return result;
}

function isSensitiveValue(value: string): boolean {
  const lower = value.toLowerCase();
  if (lower.includes('-----begin')) return true;
  if (lower.startsWith('sk-') && lower.length > 20) return true;
  if (lower.startsWith('ghp_') && lower.length > 30) return true;
  if (lower.startsWith('xox') && lower.length > 20) return true;
  return false;
}

/**
 * Assert that a durable audit payload contains no forbidden raw private data.
 */
export function assertDurableAuditPayloadSafe(input: DurableAuditEventPayload): {
  safe: boolean;
  violations: string[];
} {
  const violations: string[] = [];

  // Check redaction state
  if (input.redaction.rawChatIncluded) violations.push('rawChatIncluded is true');
  if (input.redaction.rawPromptIncluded) violations.push('rawPromptIncluded is true');
  if (input.redaction.rawAiResponseIncluded) violations.push('rawAiResponseIncluded is true');
  if (input.redaction.rawTranscriptIncluded) violations.push('rawTranscriptIncluded is true');
  if (input.redaction.rawLearnerMemoryIncluded) violations.push('rawLearnerMemoryIncluded is true');
  if (input.redaction.rawSafeguardingEvidenceIncluded) violations.push('rawSafeguardingEvidenceIncluded is true');
  if (input.redaction.answerKeyIncluded) violations.push('answerKeyIncluded is true');
  if (input.redaction.secretIncluded) violations.push('secretIncluded is true');

  // Check safeSummary length
  if (input.safeSummary && input.safeSummary.length > 500) {
    violations.push('safeSummary exceeds 500 characters');
  }

  // Check safeMetadata for forbidden fields
  if (input.safeMetadata) {
    function walk(obj: Record<string, unknown>, path: string) {
      for (const [key, value] of Object.entries(obj)) {
        const fullPath = path ? `${path}.${key}` : key;
        if (isForbiddenDurableAuditField(key)) {
          violations.push(`Forbidden field in safeMetadata: ${fullPath}`);
        }
        if (typeof value === 'object' && value !== null) {
          walk(value as Record<string, unknown>, fullPath);
        }
      }
    }
    walk(input.safeMetadata, 'safeMetadata');
  }

  return { safe: violations.length === 0, violations };
}

/**
 * Build a redaction state for a durable audit event.
 * All raw data flags are always false — durable audit never stores raw data.
 */
export function buildDurableAuditRedactionState(): DurableAuditRedactionState {
  return {
    redacted: true,
    rawPrivateDataIncluded: false,
    rawPromptIncluded: false,
    rawAiResponseIncluded: false,
    rawChatIncluded: false,
    rawTranscriptIncluded: false,
    rawLearnerMemoryIncluded: false,
    rawSafeguardingEvidenceIncluded: false,
    answerKeyIncluded: false,
    secretIncluded: false,
    redactionVersion: REDACTION_VERSION,
  };
}

/**
 * Hash an identifier for durable audit storage.
 */
export function hashDurableAuditIdentifier(input: string | undefined | null): string | undefined {
  return hashTelemetryIdentifier(input);
}
