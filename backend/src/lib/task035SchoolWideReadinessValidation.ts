const VALID_ROLES = ['admin', 'operator', 'school_admin', 'system_admin']

export function validateSchoolWideReadinessRole(role: string): { valid: boolean; role: string; reason?: string } {
  if (VALID_ROLES.includes(role)) {
    return { valid: true, role }
  }
  return { valid: false, role: 'unknown', reason: `role '${role}' is not recognized` }
}

export function validateSessionId(id: string): boolean {
  if (typeof id !== 'string') return false
  if (id.length < 3) return false
  if (id.includes(' ')) return false
  return id.length > 0
}

export function validateSchoolId(id: string): boolean {
  return typeof id === 'string' && id.length > 0
}

export function validateEnvironmentFlags(flags: Record<string, string | undefined>): { valid: boolean; missingFlags: string[] } {
  const missingFlags: string[] = []
  if (!flags.DATABASE_URL) missingFlags.push('DATABASE_URL')
  if (!flags.REDIS_URL) missingFlags.push('REDIS_URL')
  if (!flags.TASK035_SCHOOL_WIDE_READINESS_MODE) missingFlags.push('TASK035_SCHOOL_WIDE_READINESS_MODE')
  if (!flags.NODE_ENV) missingFlags.push('NODE_ENV')
  return { valid: missingFlags.length === 0, missingFlags }
}

export function validateNonEmptyString(value: unknown, fieldName: string): { valid: boolean; reason?: string } {
  if (typeof value !== 'string') {
    return { valid: false, reason: `${fieldName} must be a string, got ${typeof value}` }
  }
  if (value.length === 0) {
    return { valid: false, reason: `${fieldName} must not be empty` }
  }
  return { valid: true }
}

export function validateBlockingIssues(issues: unknown): { valid: boolean; reason?: string } {
  if (!Array.isArray(issues)) {
    return { valid: false, reason: 'blocking issues must be an array' }
  }
  for (const issue of issues) {
    if (typeof issue !== 'string') {
      return { valid: false, reason: 'each blocking issue must be a string' }
    }
  }
  return { valid: true }
}
