export type PrivacySafeTelemetryPolicy = {
  rawChatAllowed: false;
  rawLearnerMemoryAllowed: false;
  rawTranscriptAllowed: false;
  rawPromptAllowed: false;
  rawAiResponseAllowed: false;
  tokensAllowed: false;
  cookiesAllowed: false;
  safeguardingEvidenceAllowed: false;
};

export const PRIVACY_SAFE_TELEMETRY_POLICY: PrivacySafeTelemetryPolicy = {
  rawChatAllowed: false,
  rawLearnerMemoryAllowed: false,
  rawTranscriptAllowed: false,
  rawPromptAllowed: false,
  rawAiResponseAllowed: false,
  tokensAllowed: false,
  cookiesAllowed: false,
  safeguardingEvidenceAllowed: false,
};

export type RedactionFieldRule = {
  fieldPattern: RegExp;
  redacted: boolean;
  replacement: string;
};

export const DEFAULT_REDACTION_FIELDS: string[] = [
  'authorization',
  'cookie',
  'set-cookie',
  'password',
  'token',
  'jwt',
  'secret',
  'apiKey',
  'api_key',
  'OPENAI_API_KEY',
  'DATABASE_URL',
  'REDIS_URL',
  'rawChat',
  'rawMessage',
  'raw_message',
  'messages',
  'conversation',
  'learnerMemory',
  'learner_memory',
  'transcript',
  'prompt',
  'promptPacket',
  'prompt_packet',
  'aiResponse',
  'ai_response',
  'safeguardingEvidence',
  'safeguarding_evidence',
  'answerKey',
  'answer_key',
  'accessToken',
  'access_token',
  'refreshToken',
  'refresh_token',
];
