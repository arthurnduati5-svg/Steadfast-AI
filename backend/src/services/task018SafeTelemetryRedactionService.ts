// ─────────────────────────────────────────────────────────────
// Steadfast AI — Task 018 Safe Telemetry Redaction Service
// Removes unsafe fields from telemetry, diagnostics, and metrics.
// Never exposes raw chat, prompts, provider responses, memory,
// answer keys, secrets, or safeguarding internals.
// ─────────────────────────────────────────────────────────────

import type { TelemetryPrivacyMetadata, TelemetryRedactionResult, RedactionDecision } from '../contracts/task018Contracts';
import { PRIVACY_CLEAN_METADATA } from '../contracts/task018Contracts';

const REDACTED = '[REDACTED]';

const UNSAFE_FIELD_PATTERNS = [
  /^rawChat$/i, /^raw_chat$/i, /^rawMessage$/i, /^raw_message$/i,
  /^rawTranscript$/i, /^raw_transcript$/i, /^rawPrompt$/i, /^raw_prompt$/i,
  /^systemPrompt$/i, /^system_prompt$/i, /^developerPrompt$/i, /^developer_prompt$/i,
  /^modelDraft$/i, /^model_draft$/i, /^providerResponse$/i, /^provider_response$/i,
  /^answerKey$/i, /^answer_key$/i, /^solutionSteps$/i, /^solution_steps$/i,
  /^privateMemory$/i, /^private_memory$/i, /^teacherOnlyNote$/i, /^teacher_only_note$/i,
  /^safeguardingRaw$/i, /^safeguarding_raw$/i, /^deenSensitiveRawQuestion$/i,
  /^deen_sensitive_raw_question$/i, /^rawDeenQuestion$/i, /^raw_deen_question$/i,
  /^fatwaClaim$/i, /^fatwa_claim$/i,
  /^unapprovedReligiousAnswer$/i, /^unapproved_religious_answer$/i,
  /^rawCrisisText$/i, /^raw_crisis_text$/i,
  /^stackTrace$/i, /^stack_trace$/i,
  /^databaseUrl$/i, /^database_url$/i, /^connectionString$/i, /^connection_string$/i,
  /^apiKey$/i, /^api_key$/i, /^token$/i, /^secret$/i, /^password$/i,
  /^authorizationHeader$/i, /^authorization_header$/i, /^cookie$/i,
];

const UNSAFE_VALUE_PATTERNS = [
  /sk-[a-zA-Z0-9]{20,}/,
  /ghp_[a-zA-Z0-9]{36,}/,
  /xox[baprs]-[a-zA-Z0-9]{10,}/,
  /-----BEGIN (RSA |EC )?PRIVATE KEY-----/,
  /AIza[0-9A-Za-z_-]{35,}/,
];

function isUnsafeField(key: string): boolean {
  return UNSAFE_FIELD_PATTERNS.some((p) => p.test(key));
}

function containsSecret(value: string): boolean {
  return UNSAFE_VALUE_PATTERNS.some((p) => p.test(value));
}

function buildPrivacyMetadata(reasons: string[], blocked?: string): TelemetryPrivacyMetadata {
  return {
    redactionApplied: reasons.length > 0,
    redactionReasons: reasons,
    rawChatExcluded: true,
    rawPromptExcluded: true,
    providerResponseExcluded: true,
    privateMemoryExcluded: true,
    teacherOnlyNotesExcluded: true,
    answerKeyExcluded: true,
    secretsExcluded: true,
    safeguardingRawExcluded: true,
    deenSensitiveRawExcluded: true,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function redactPayload(
  payload: Record<string, unknown>,
  path: string,
  decisions: RedactionDecision[],
  reasons: string[],
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(payload)) {
    const currentPath = path ? `${path}.${key}` : key;

    if (isUnsafeField(key)) {
      decisions.push({ field: currentPath, redacted: true, reason: `Field "${key}" is unsafe` });
      reasons.push(`redacted_field:${key}`);
      result[key] = REDACTED;
      continue;
    }

    if (typeof value === 'string') {
      if (containsSecret(value)) {
        decisions.push({ field: currentPath, redacted: true, reason: 'Value contains secret pattern' });
        reasons.push('redacted_secret_pattern');
        result[key] = REDACTED;
      } else {
        result[key] = value;
      }
    } else if (isRecord(value)) {
      result[key] = redactPayload(value, currentPath, decisions, reasons);
    } else if (Array.isArray(value)) {
      result[key] = value.map((item, index) => {
        if (isRecord(item)) {
          return redactPayload(item, `${currentPath}[${index}]`, decisions, reasons);
        }
        return item;
      });
    } else {
      result[key] = value;
    }
  }

  return result;
}

export function redactTelemetryPayload(
  payload: Record<string, unknown>,
): TelemetryRedactionResult {
  const decisions: RedactionDecision[] = [];
  const reasons: string[] = [];

  const sanitized = redactPayload(payload, '', decisions, reasons);

  return {
    safe: true,
    sanitizedPayload: sanitized,
    redactionApplied: decisions.length > 0,
    redactionReasons: reasons,
    privacyMetadata: buildPrivacyMetadata(reasons),
  };
}

export function assertSafeTelemetryPayload(payload: unknown): {
  safe: boolean;
  violations: string[];
} {
  const violations: string[] = [];

  function walk(obj: Record<string, unknown>, path: string) {
    for (const [key, value] of Object.entries(obj)) {
      const fullPath = path ? `${path}.${key}` : key;
      if (isUnsafeField(key) && value !== REDACTED && value !== undefined) {
        violations.push(fullPath);
      }
      if (isRecord(value)) {
        walk(value, fullPath);
      } else if (Array.isArray(value)) {
        value.forEach((item, i) => {
          if (isRecord(item)) walk(item, `${fullPath}[${i}]`);
        });
      } else if (typeof value === 'string' && containsSecret(value)) {
        violations.push(`${fullPath}=secret_pattern`);
      }
    }
  }

  if (isRecord(payload)) {
    walk(payload, '');
  }

  return { safe: violations.length === 0, violations };
}
