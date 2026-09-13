// ─────────────────────────────────────────────────────────────
// Steadfast AI — Teacher Intervention Audit Redaction Service v1
// Strips sensitive data from audit payloads before persistence.
// Removes: raw learner chat logs, raw transcripts, private
// learner memory, hidden prompts, system instructions, access
// tokens, API keys, passwords, session cookies, full IP/user-agent.
// ─────────────────────────────────────────────────────────────

import type { TeacherInterventionAuditEventType } from './teacherInterventionAuditContracts';

// ── Patterns to redact ──
// Each pattern matches both:
//   rawField:value       (inline separator)
//   "rawField":"value"   (JSON key-value format after JSON.stringify)

const SENSITIVE_PATTERNS: { pattern: RegExp; replacement: string; description: string }[] = [
  // Raw chat logs
  { pattern: /(rawChatLog|chatLog|rawHistory|conversationHistory)[":=\s]+[^",;\n}\]]+/gi, replacement: '$1: [REDACTED]', description: 'raw chat logs' },

  // Raw transcripts
  { pattern: /(rawTranscript|transcriptText|fullTranscript|videoTranscript)[":=\s]+[^",;\n}\]]+/gi, replacement: '$1: [REDACTED]', description: 'raw transcripts' },

  // Private learner memory
  { pattern: /(privateMemory|learnerMemory|rawMemory|studentMemory|memoryDump)[":=\s]+[^",;\n}\]]+/gi, replacement: '$1: [REDACTED]', description: 'private learner memory' },

  // Hidden prompts / system instructions
  { pattern: /(systemPrompt|developerInstruction|hiddenPrompt|chainOfThought|hiddenInstruction)[":=\s]+[^",;\n}\]]+/gi, replacement: '$1: [REDACTED]', description: 'system/developer instructions' },

  // Teacher private notes
  { pattern: /(teacherPrivateNote|privateNote|teacherOnlyNote)[":=\s]+[^",;\n}\]]+/gi, replacement: '$1: [REDACTED]', description: 'teacher private notes' },

  // Secrets/tokens
  { pattern: /(accessToken|apiKey|API_KEY|password|secret|sessionCookie|authToken|bearerToken)[":=\s]+[^",;\n}\]]+/gi, replacement: '$1: [REDACTED]', description: 'secrets and tokens' },

  // Full IP addresses
  { pattern: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, replacement: '[IP_REDACTED]', description: 'IP addresses' },

  // Email addresses
  { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, replacement: '[EMAIL_REDACTED]', description: 'email addresses' },
];

// ── Public API ──

export interface RedactionResult {
  redactedPayloadString: string;
  redactedFields: string[];
  warning: string | null;
}

/**
 * Redact sensitive data from a payload object.
 * Returns a JSON string with all sensitive patterns replaced.
 */
export function redactAuditPayload(
  payload: Record<string, unknown>,
  eventType?: TeacherInterventionAuditEventType,
): RedactionResult {
  const redactedFields: string[] = [];
  let payloadString = JSON.stringify(payload);

  for (const entry of SENSITIVE_PATTERNS) {
    const before = payloadString;
    payloadString = payloadString.replace(entry.pattern, entry.replacement);
    if (payloadString !== before) {
      if (!redactedFields.includes(entry.description)) {
        redactedFields.push(entry.description);
      }
    }
  }

  const warning = redactedFields.length > 0
    ? `Redacted ${redactedFields.length} sensitive field(s): ${redactedFields.join(', ')}`
    : null;

  return {
    redactedPayloadString: payloadString,
    redactedFields: [...new Set(redactedFields)],
    warning,
  };
}

/**
 * Build a safe summary for an audit event.
 */
export function buildSafeAuditSummary(
  eventType: string,
  baseSummary: string,
): string {
  let safe = baseSummary;
  for (const entry of SENSITIVE_PATTERNS) {
    safe = safe.replace(entry.pattern, '[SAFE SUMMARY]');
  }
  return safe.slice(0, 500);
}

/**
 * Check if a string contains sensitive data patterns.
 */
export function containsSensitiveData(text: string): boolean {
  for (const entry of SENSITIVE_PATTERNS) {
    // Clone regex without 'g' flag to avoid lastIndex mutation across calls
    const flags = entry.pattern.flags.replace('g', '');
    const testPattern = new RegExp(entry.pattern.source, flags);
    if (testPattern.test(text)) {
      return true;
    }
  }
  return false;
}
