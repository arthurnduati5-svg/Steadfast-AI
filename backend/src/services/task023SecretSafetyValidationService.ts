import { DeploymentReadinessStatus, ReadinessSeverity, SecretValidationResult, ReadinessCheckResult } from '../contracts/task023DeploymentReadinessContracts';
import { isStrictMode } from './task023EnvironmentGateService';

const SECRET_VARIABLES = [
  'DATABASE_URL',
  'JWT_SECRET',
  'OPENAI_API_KEY',
  'REDIS_URL',
  'COPILOT_JWT_SECRET',
  'PINECONE_API_KEY',
];

const PLACEHOLDER_PATTERNS = [
  'changeme',
  'change-me',
  'change_me',
  'placeholder',
  'example',
  'test',
  'dummy',
  'dev-secret',
  'localhost-only-secret',
  'your-api-key',
  'your-jwt-secret',
  'sk-your',
  'replaceme',
  'replace-me',
];

function isPlaceholder(value: string): boolean {
  const lower = value.toLowerCase().trim();
  for (const pattern of PLACEHOLDER_PATTERNS) {
    if (lower.includes(pattern)) return true;
  }
  if (lower === 'sk-' || lower === 'sk-test' || lower === 'sk-placeholder') return true;
  if (lower.startsWith('sk-') && lower.length < 10) return true;
  return false;
}

function validateSecret(variable: string): SecretValidationResult {
  const value = process.env[variable];
  const present = value !== undefined && value !== null && value.trim() !== '';

  if (!present) {
    return {
      variable,
      present: false,
      valid: false,
      severity: isStrictMode() ? 'error' : 'warning',
      reasonCode: 'MISSING',
      masked: true,
    };
  }

  if (isPlaceholder(value!)) {
    return {
      variable,
      present: true,
      valid: false,
      severity: isStrictMode() ? 'error' : 'warning',
      reasonCode: 'PLACEHOLDER_VALUE',
      masked: true,
    };
  }

  return {
    variable,
    present: true,
    valid: true,
    severity: 'info',
    reasonCode: 'VALID',
    masked: true,
  };
}

export function validateAllSecrets(): SecretValidationResult[] {
  return SECRET_VARIABLES.map(validateSecret);
}

export function getSecretSafetyResult(): ReadinessCheckResult {
  const results = validateAllSecrets();
  const invalid = results.filter(r => !r.valid);

  if (invalid.length === 0) {
    return {
      name: 'secret-safety',
      status: 'ready',
      severity: 'info',
      required: true,
      message: 'All secrets are present and valid',
    };
  }

  const missing = invalid.filter(r => r.reasonCode === 'MISSING');
  const placeholders = invalid.filter(r => r.reasonCode === 'PLACEHOLDER_VALUE');
  const messages: string[] = [];

  if (missing.length > 0) {
    messages.push(`Missing secrets: ${missing.map(r => r.variable).join(', ')}. Variables present but masked in output.`);
  }
  if (placeholders.length > 0) {
    messages.push(`Placeholder values detected in production: ${placeholders.map(r => r.variable).join(', ')}`);
  }

  const blocked = isStrictMode() && invalid.length > 0;

  return {
    name: 'secret-safety',
    status: blocked ? 'blocked' : 'degraded',
    severity: blocked ? 'critical' : 'warning',
    required: true,
    message: messages.join('; '),
  };
}

export function maskSecretValue(variable: string): string {
  const value = process.env[variable];
  if (!value) return '[NOT SET]';
  if (value.length <= 4) return '***';
  return value.slice(0, 3) + '***' + value.slice(-3);
}

export { SECRET_VARIABLES, PLACEHOLDER_PATTERNS, isPlaceholder };
