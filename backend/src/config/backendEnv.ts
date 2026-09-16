export const BACKEND_ENV_RULES = [
  { key: 'DATABASE_URL', category: 'required-all', required: true, sensitive: true },
  { key: 'JWT_SECRET', category: 'required-all', required: true, sensitive: true },
  { key: 'REDIS_URL', category: 'required-production', required: false, sensitive: true },
  { key: 'OPENAI_API_KEY', category: 'required-all', required: true, sensitive: true },
  { key: 'ALLOWED_ORIGINS', category: 'required-production', required: false, sensitive: false },
  { key: 'PORT', category: 'recommended-production', required: false, sensitive: false },
  { key: 'NODE_ENV', category: 'required-all', required: true, sensitive: false },
  { key: 'LOG_LEVEL', category: 'optional', required: false, sensitive: false },
  { key: 'CORS_ORIGIN', category: 'optional', required: false, sensitive: false },
  { key: 'AI_PROVIDER_API_KEY', category: 'required-all', required: true, sensitive: true },
  { key: 'STUDENT_ANALYTICS_CACHE_TTL', category: 'optional', required: false, sensitive: false },
  { key: 'SESSION_EXPIRY_MS', category: 'optional', required: false, sensitive: false },
  { key: 'SCHOOL_SYNC_INTERVAL_MS', category: 'optional', required: false, sensitive: false },
  { key: 'RATE_LIMIT_WINDOW_MS', category: 'optional', required: false, sensitive: false },
  { key: 'RATE_LIMIT_MAX', category: 'optional', required: false, sensitive: false },
  { key: 'ENCRYPTION_KEY', category: 'required-all', required: true, sensitive: true },
  { key: 'SCHOOL_CONNECTOR_TIMEOUT_MS', category: 'optional', required: false, sensitive: false },
]

export function validateBackendEnv(): { ok: boolean; issues: string[]; warnings: string[] } {
  const issues: string[] = []
  for (const rule of BACKEND_ENV_RULES) {
    if (rule.required && !process.env[rule.key]) {
      issues.push(`${rule.key} is missing`)
    }
  }
  return { ok: issues.length === 0, issues, warnings: [] }
}

export function getBackendReadinessConfig(): {
  environment: string
  isProduction: boolean
  isStaging: boolean
  isDevelopment: boolean
  hasDatabaseUrl: boolean
  hasRedisUrl: boolean
  hasOpenAiKey: boolean
  hasJwtSecret: boolean
  hasPineconeKey: boolean
} {
  const env = process.env.NODE_ENV || 'development'
  return {
    environment: env,
    isProduction: env === 'production',
    isStaging: env === 'staging',
    isDevelopment: env === 'development' || env === 'test',
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasRedisUrl: !!process.env.REDIS_URL,
    hasOpenAiKey: !!process.env.OPENAI_API_KEY,
    hasJwtSecret: !!process.env.JWT_SECRET,
    hasPineconeKey: !!process.env.PINECONE_API_KEY,
  }
}
