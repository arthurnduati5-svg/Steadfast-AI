// ─────────────────────────────────────────────────────────────
// Steadfast AI — Task 024 Redaction & Leak Detection Service
// Privacy-safe secret redaction and leak scanning for
// production operations, telemetry, and diagnostics output.
// ─────────────────────────────────────────────────────────────

const REDACTED = '[REDACTED]';

const DB_URL_PATTERN = /(postgres|mysql|mongodb|redis|rediss|amqp|rabbitmq):\/\/[^\s"'`)+]+/gi;
const API_KEY_PATTERN = /\b(sk-[a-zA-Z0-9]{20,}|ghp_[a-zA-Z0-9]{36,}|xox[baprs]-[a-zA-Z0-9]{10,}|AIza[0-9A-Za-z_-]{35,})\b/g;
const BEARER_TOKEN_PATTERN = /\bBearer\s+[A-Za-z0-9\-._~+/]+=*\b/gi;
const PRIVATE_KEY_PATTERN = /-----BEGIN\s*(RSA\s|EC\s)?PRIVATE\s*KEY-----[\s\S]*?-----END\s*(RSA\s|EC\s)?PRIVATE\s*KEY-----/g;
const PROVIDER_KEY_PATTERN = /\b(?:pplx|anthropic|cohere|together|openai|google|azure|aws)-[a-zA-Z0-9]{20,}\b/g;
const EMAIL_PATTERN = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
const PHONE_PATTERN = /\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}\b/g;
const LONG_SECRET_PATTERN = /\b[A-Za-z0-9+/]{40,}={0,2}\b/g;
const COOKIE_PATTERN = /(?:^|;\s*)([A-Za-z0-9_-]+=[A-Za-z0-9%-]+;?\s*)+/gi;
const AUTH_HEADER_PATTERN = /(?:authorization|auth|set-cookie|cookie):\s*[^\n]+/gi;

const UNSAFE_FIELD_PATTERNS = [
  /^rawChat$/i, /^raw_chat$/i, /^rawMessage$/i, /^raw_message$/i,
  /^rawTranscript$/i, /^raw_transcript$/i, /^rawPrompt$/i, /^raw_prompt$/i,
  /^systemPrompt$/i, /^system_prompt$/i, /^developerPrompt$/i, /^developer_prompt$/i,
  /^modelDraft$/i, /^model_draft$/i, /^providerResponse$/i, /^provider_response$/i,
  /^answerKey$/i, /^answer_key$/i, /^solutionSteps$/i, /^solution_steps$/i,
  /^privateMemory$/i, /^private_memory$/i, /^teacherOnlyNote$/i, /^teacher_only_note$/i,
  /^databaseUrl$/i, /^database_url$/i, /^connectionString$/i, /^connection_string$/i,
  /^authorization$/i, /^authorizationHeader$/i, /^authorization_header$/i,
  /^cookie$/i, /^setCookie$/i, /^set_cookie$/i,
  /^apiKey$/i, /^api_key$/i, /^token$/i, /^secret$/i, /^password$/i,
  /^privateKey$/i, /^private_key$/i, /^providerKey$/i, /^provider_key$/i,
  /^email$/i, /^phone$/i, /^phoneNumber$/i, /^phone_number$/i,
];

const REDACTION_PATTERNS: { name: string; regex: RegExp }[] = [
  { name: 'private_key', regex: PRIVATE_KEY_PATTERN },
  { name: 'database_url', regex: DB_URL_PATTERN },
  { name: 'bearer_token', regex: BEARER_TOKEN_PATTERN },
  { name: 'api_key', regex: API_KEY_PATTERN },
  { name: 'provider_key', regex: PROVIDER_KEY_PATTERN },
  { name: 'auth_header', regex: AUTH_HEADER_PATTERN },
  { name: 'email', regex: EMAIL_PATTERN },
  { name: 'phone', regex: PHONE_PATTERN },
  { name: 'long_secret', regex: LONG_SECRET_PATTERN },
];

function isUnsafeField(key: string): boolean {
  return UNSAFE_FIELD_PATTERNS.some((p) => p.test(key));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function redactString(value: string): { redacted: string; matched: string[] } {
  let result = value;
  const matched: string[] = [];

  for (const { name, regex } of REDACTION_PATTERNS) {
    if (regex.test(result)) {
      matched.push(name);
      result = result.replace(regex, REDACTED);
    }
  }

  const lower = result.toLowerCase();
  if (/raw(prompt|chat|message|transcript|response)/.test(lower) || /answer.?key/.test(lower)) {
    matched.push('unsafe_content_marker');
    result = result.replace(/(raw(prompt|chat|message|transcript|response)|answer.?key)/gi, REDACTED);
  }

  return { redacted: result, matched };
}

export function redactText(text: string): string {
  return redactString(text).redacted;
}

export function redactObject(
  obj: Record<string, unknown>,
  depth: number = 10,
): Record<string, unknown> {
  if (depth <= 0) return { ...obj };

  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (isUnsafeField(key)) {
      result[key] = REDACTED;
      continue;
    }

    if (typeof value === 'string') {
      const { redacted } = redactString(value);
      result[key] = redacted;
    } else if (isRecord(value)) {
      result[key] = redactObject(value, depth - 1);
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) => {
        if (isRecord(item)) return redactObject(item, depth - 1);
        if (typeof item === 'string') return redactString(item).redacted;
        return item;
      });
    } else {
      result[key] = value;
    }
  }

  return result;
}

export function scanForLeaks(input: string): { hasLeak: boolean; patterns: string[] } {
  const matchedPatterns: string[] = [];

  const SECURITY_PATTERNS = [
    { name: 'private_key', regex: PRIVATE_KEY_PATTERN },
    { name: 'database_url', regex: DB_URL_PATTERN },
    { name: 'bearer_token', regex: BEARER_TOKEN_PATTERN },
    { name: 'api_key', regex: API_KEY_PATTERN },
    { name: 'provider_key', regex: PROVIDER_KEY_PATTERN },
  ];

  for (const { name, regex } of SECURITY_PATTERNS) {
    regex.lastIndex = 0;
    if (regex.test(input)) {
      matchedPatterns.push(name);
    }
  }

  const lower = input.toLowerCase();
  if (/raw(prompt|chat|message|transcript|response)/.test(lower)) {
    matchedPatterns.push('unsafe_content_marker');
  }
  if (/answer.?key/.test(lower)) {
    matchedPatterns.push('answer_key_marker');
  }

  return { hasLeak: matchedPatterns.length > 0, patterns: matchedPatterns };
}

export function assertNoLeaks(input: string): { safe: boolean; violations: string[] } {
  const { patterns } = scanForLeaks(input);
  return { safe: patterns.length === 0, violations: patterns };
}
