import { DeploymentEnvironment, DeploymentReadinessStatus, ReadinessSeverity, EnvironmentVariableRequirement, ReadinessCheckResult } from '../contracts/task023DeploymentReadinessContracts';

interface EnvRule {
  variable: string;
  category: 'required-all' | 'required-production' | 'recommended-production' | 'optional';
  description: string;
}

const ENV_RULES: EnvRule[] = [
  { variable: 'NODE_ENV', category: 'required-all', description: 'Runtime environment' },
  { variable: 'PORT', category: 'optional', description: 'Server port' },
  { variable: 'DATABASE_URL', category: 'required-production', description: 'Database connection string' },
  { variable: 'JWT_SECRET', category: 'required-production', description: 'JWT signing secret' },
  { variable: 'OPENAI_API_KEY', category: 'required-production', description: 'AI provider API key' },
  { variable: 'ALLOWED_ORIGINS', category: 'required-production', description: 'CORS allowed origins' },
  { variable: 'REDIS_URL', category: 'recommended-production', description: 'Redis connection URL' },
  { variable: 'COPILOT_JWT_SECRET', category: 'recommended-production', description: 'Copilot handoff secret' },
  { variable: 'PINECONE_API_KEY', category: 'optional', description: 'Pinecone vector search key' },
  { variable: 'PINECONE_INDEX', category: 'optional', description: 'Pinecone index name' },
  { variable: 'JSON_LIMIT', category: 'optional', description: 'JSON body size limit' },
  { variable: 'REQUEST_TIMEOUT_MS', category: 'optional', description: 'Request timeout in ms' },
  { variable: 'KEEP_ALIVE_TIMEOUT_MS', category: 'optional', description: 'Keep-alive timeout in ms' },
  { variable: 'LOG_LEVEL', category: 'optional', description: 'Logging level' },
  { variable: 'ADMIN_USER_IDS', category: 'optional', description: 'Admin user IDs' },
  { variable: 'COUNSELOR_USER_IDS', category: 'optional', description: 'Counselor user IDs' },
];

function determineEnvironment(): DeploymentEnvironment {
  const env = (process.env.NODE_ENV || '').trim().toLowerCase();
  if (env === 'production') return 'production';
  if (env === 'staging') return 'staging';
  if (env === 'test') return 'test';
  if (env === 'development') return 'development';
  return 'unknown';
}

export function getDeploymentEnvironment(): DeploymentEnvironment {
  return determineEnvironment();
}

export function isStrictMode(): boolean {
  const env = determineEnvironment();
  return env === 'production' || env === 'staging';
}

export function getEnvironmentGateRequirements(): EnvironmentVariableRequirement[] {
  const mode = determineEnvironment();
  const results: EnvironmentVariableRequirement[] = [];

  for (const rule of ENV_RULES) {
    const value = process.env[rule.variable];
    const present = value !== undefined && value !== null && value.trim() !== '';

    if (rule.category === 'optional') {
      results.push({
        variable: rule.variable,
        required: false,
        present,
        valid: true,
        severity: 'info',
        reasonCode: present ? 'PRESENT_OPTIONAL' : 'MISSING_OPTIONAL',
      });
      continue;
    }

    if (rule.category === 'recommended-production') {
      results.push({
        variable: rule.variable,
        required: mode === 'production',
        present,
        valid: true,
        severity: present ? 'info' : 'warning',
        reasonCode: present ? 'PRESENT_RECOMMENDED' : 'MISSING_RECOMMENDED',
      });
      continue;
    }

    const isRequired = rule.category === 'required-all' || (rule.category === 'required-production' && mode === 'production');
    results.push({
      variable: rule.variable,
      required: isRequired,
      present,
      valid: present,
      severity: (isRequired && !present) ? 'error' : 'info',
      reasonCode: present ? 'PRESENT_REQUIRED' : 'MISSING_REQUIRED',
    });
  }

  return results;
}

export function getEnvironmentGateResult(): ReadinessCheckResult {
  const requirements = getEnvironmentGateRequirements();
  const requiredMissing = requirements.filter(r => r.required && !r.present);
  const recommendedMissing = requirements.filter(r => r.variable === 'REDIS_URL' && !r.present && isStrictMode());

  let status: DeploymentReadinessStatus = 'ready';
  let severity: ReadinessSeverity = 'info';
  const messages: string[] = [];

  if (requiredMissing.length > 0) {
    status = 'blocked';
    severity = 'critical';
    messages.push(`Missing required variables: ${requiredMissing.map(r => r.variable).join(', ')}`);
  }

  if (recommendedMissing.length > 0) {
    if (status === 'ready') status = 'degraded';
    if (severity === 'info') severity = 'warning';
    messages.push('Some recommended production variables are not configured');
  }

  if (messages.length === 0) {
    messages.push('All required environment variables are present');
  }

  return {
    name: 'environment-gate',
    status,
    severity,
    required: true,
    message: messages.join('; '),
  };
}

export { ENV_RULES };
