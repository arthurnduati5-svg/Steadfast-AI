import { validateBackendEnv, BACKEND_ENV_RULES } from '../config/backendEnv';

/**
 * Backend environment schema and validation service.
 * Re-exports and extends the existing backendEnv validation.
 */

export type BackendEnvMode = 'development' | 'test' | 'production';

export interface BackendEnvValidationIssue {
  key: string;
  severity: 'error' | 'warning';
  message: string;
  secret: boolean;
}

export interface BackendEnvValidationResult {
  ok: boolean;
  mode: BackendEnvMode;
  values: Record<string, string | number | boolean | null>;
  redacted: Record<string, string | number | boolean | null>;
  issues: BackendEnvValidationIssue[];
}

const SECRET_KEYS = new Set([
  'JWT_SECRET',
  'COPILOT_JWT_SECRET',
  'COPILOT_PUBLIC_KEY',
  'OPENAI_API_KEY',
  'DATABASE_URL',
  'REDIS_URL',
  'PINECONE_API_KEY',
  'VIMEO_ACCESS_TOKEN',
  'YOUTUBE_DATA_API_KEY',
  'COUNSELOR_ALERT_WEBHOOK_URL',
]);

const SECRET_REDACTION = '***REDACTED***';

function determineMode(): BackendEnvMode {
  const env = (process.env.NODE_ENV || '').trim().toLowerCase();
  if (env === 'production') return 'production';
  if (env === 'test') return 'test';
  return 'development';
}

function redactValue(key: string, value: string | undefined): string | number | boolean | null {
  if (value === undefined || value === null || value === '') return null;
  if (SECRET_KEYS.has(key)) return SECRET_REDACTION;
  const num = Number(value);
  if (!isNaN(num) && value.trim() !== '') return num;
  if (value.toLowerCase() === 'true') return true;
  if (value.toLowerCase() === 'false') return false;
  return value.length > 80 ? value.slice(0, 40) + '...' + value.slice(-20) : value;
}

export function validateBackendEnvSchema(): BackendEnvValidationResult {
  // Use the existing validateBackendEnv as the core
  const existing = validateBackendEnv();

  const issues: BackendEnvValidationIssue[] = [];
  const values: Record<string, string | number | boolean | null> = {};
  const redacted: Record<string, string | number | boolean | null> = {};

  for (const rule of BACKEND_ENV_RULES) {
    const raw = process.env[rule.key];
    values[rule.key] = raw ?? null;
    redacted[rule.key] = redactValue(rule.key, raw);

    const isPresent = raw !== undefined && raw !== null && raw.trim() !== '';

    if (rule.category === 'required-all' && !isPresent) {
      issues.push({
        key: rule.key,
        severity: 'error',
        message: `Required environment variable ${rule.key} is missing`,
        secret: SECRET_KEYS.has(rule.key),
      });
    }

    if (rule.category === 'required-production' && !isPresent && determineMode() === 'production') {
      issues.push({
        key: rule.key,
        severity: 'error',
        message: `Production-required environment variable ${rule.key} is missing`,
        secret: SECRET_KEYS.has(rule.key),
      });
    }

    if (rule.category === 'recommended-production' && !isPresent && determineMode() === 'production') {
      issues.push({
        key: rule.key,
        severity: 'warning',
        message: `Recommended production environment variable ${rule.key} is missing`,
        secret: SECRET_KEYS.has(rule.key),
      });
    }
  }

  // Add existing warnings from backendEnv
  for (const warning of existing.warnings) {
    issues.push({
      key: 'UNKNOWN',
      severity: 'warning',
      message: warning,
      secret: false,
    });
  }

  const ok = issues.filter((i) => i.severity === 'error').length === 0;

  return {
    ok,
    mode: determineMode(),
    values,
    redacted,
    issues,
  };
}

export function redactEnvValue(key: string, value: unknown): string | null {
  if (value === undefined || value === null) return null;
  const str = String(value);
  if (SECRET_KEYS.has(key)) return SECRET_REDACTION;
  return str.length > 80 ? str.slice(0, 40) + '...' + str.slice(-20) : String(value);
}

export function getBackendEnv(): BackendEnvValidationResult {
  return validateBackendEnvSchema();
}
